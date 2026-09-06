"""
Domain Layer -- ReportController (GRASP Controller).

Handles: View Sales Report, View Inventory Report, Export Sales Data, per
design_class_diagram.md. README Section 13 lists what reporting must
support; this controller aggregates the raw Sale/Inventory data into the
shapes the Reports & Analytics screen and CSV export need.
"""
import csv
import io
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlmodel import Session, select

from app.domain.models import Product, Sale, SaleStatus
from app.domain.schemas import (
    InventoryReportResponse,
    InventoryReportRow,
    SalesReportResponse,
    TopProductRow,
)


def _period_bounds(period: str, start: Optional[datetime], end: Optional[datetime]):
    now = datetime.now(timezone.utc)
    if start and end:
        return start, end
    if period == "daily":
        return now - timedelta(days=1), now
    if period == "weekly":
        return now - timedelta(days=7), now
    if period == "monthly":
        return now - timedelta(days=30), now
    # default: all-time
    return datetime(2000, 1, 1, tzinfo=timezone.utc), now


class ReportController:
    def __init__(self, session: Session):
        self.session = session

    def generate_sales_report(
        self,
        period: str = "daily",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> SalesReportResponse:
        start, end = _period_bounds(period, start_date, end_date)
        sales = list(
            self.session.exec(
                select(Sale).where(
                    Sale.status == SaleStatus.COMPLETED,
                    Sale.sale_date >= start,
                    Sale.sale_date <= end,
                )
            ).all()
        )

        total_sales = round(sum(s.total_amount for s in sales), 2)
        total_discounts = round(sum(s.discount_amount for s in sales), 2)
        total_tax = round(sum(s.tax_amount for s in sales), 2)
        total_transactions = len(sales)
        average_ticket = round(total_sales / total_transactions, 2) if total_transactions else 0.0

        # Top products by quantity sold
        product_qty: dict[int, int] = defaultdict(int)
        product_revenue: dict[int, float] = defaultdict(float)
        product_name: dict[int, str] = {}
        sales_by_day: dict[str, float] = defaultdict(float)

        for sale in sales:
            day_key = sale.sale_date.strftime("%Y-%m-%d")
            sales_by_day[day_key] += sale.total_amount
            for li in sale.line_items:
                product_qty[li.product_id] += li.quantity
                product_revenue[li.product_id] += li.subtotal
                product_name[li.product_id] = li.product_name_snapshot

        top_products = sorted(
            (
                TopProductRow(
                    product_id=pid,
                    name=product_name[pid],
                    quantity_sold=qty,
                    revenue=round(product_revenue[pid], 2),
                )
                for pid, qty in product_qty.items()
            ),
            key=lambda r: r.quantity_sold,
            reverse=True,
        )[:10]

        return SalesReportResponse(
            period=period,
            start_date=start,
            end_date=end,
            total_sales=total_sales,
            total_transactions=total_transactions,
            total_discounts=total_discounts,
            total_tax=total_tax,
            average_ticket=average_ticket,
            top_products=top_products,
            sales_by_day=[{"date": k, "total": round(v, 2)} for k, v in sorted(sales_by_day.items())],
        )

    def generate_inventory_report(self) -> InventoryReportResponse:
        products = list(self.session.exec(select(Product)).all())
        rows = []
        total_value = 0.0
        low_stock_count = 0
        out_of_stock_count = 0

        for p in products:
            if not p.inventory:
                continue
            inv = p.inventory
            stock_value = round(inv.stock_quantity * p.cost_price, 2)
            total_value += stock_value
            if inv.is_out_of_stock():
                status_label = "out_of_stock"
                out_of_stock_count += 1
            elif inv.is_below_reorder_level():
                status_label = "low_stock"
                low_stock_count += 1
            else:
                status_label = "in_stock"

            rows.append(
                InventoryReportRow(
                    product_id=p.id,
                    name=p.name,
                    sku=p.sku,
                    category=p.category.name if p.category else None,
                    stock_quantity=inv.stock_quantity,
                    reorder_level=inv.reorder_level,
                    unit_cost=p.cost_price,
                    stock_value=stock_value,
                    status=status_label,
                )
            )

        return InventoryReportResponse(
            generated_at=datetime.now(timezone.utc),
            total_skus=len(rows),
            total_stock_value=round(total_value, 2),
            low_stock_count=low_stock_count,
            out_of_stock_count=out_of_stock_count,
            rows=rows,
        )

    def export_sales_csv(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> str:
        """Export Sales Data use case: returns CSV text for download."""
        query = select(Sale).where(Sale.status == SaleStatus.COMPLETED)
        if start_date:
            query = query.where(Sale.sale_date >= start_date)
        if end_date:
            query = query.where(Sale.sale_date <= end_date)
        sales = list(self.session.exec(query).all())

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            ["Sale Number", "Date", "Cashier ID", "Subtotal", "Discount", "Tax", "Total", "Payment Method", "Items"]
        )
        for s in sales:
            items_desc = "; ".join(f"{li.product_name_snapshot} x{li.quantity}" for li in s.line_items)
            writer.writerow(
                [
                    s.sale_number,
                    s.sale_date.isoformat(),
                    s.cashier_id,
                    f"{s.subtotal:.2f}",
                    f"{s.discount_amount:.2f}",
                    f"{s.tax_amount:.2f}",
                    f"{s.total_amount:.2f}",
                    s.payment_method.value if s.payment_method else "",
                    items_desc,
                ]
            )
        return buffer.getvalue()

    def export_inventory_csv(self) -> str:
        report = self.generate_inventory_report()
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["SKU", "Name", "Category", "Stock", "Reorder Level", "Unit Cost", "Stock Value", "Status"])
        for r in report.rows:
            writer.writerow(
                [r.sku, r.name, r.category or "", r.stock_quantity, r.reorder_level, f"{r.unit_cost:.2f}", f"{r.stock_value:.2f}", r.status]
            )
        return buffer.getvalue()
