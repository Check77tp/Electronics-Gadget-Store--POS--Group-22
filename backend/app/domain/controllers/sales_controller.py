"""
Domain Layer -- SalesController (GRASP Controller).

The single most important class in the system per README Section 8: handles
Process Sale, Cancel Transaction, Modify Transaction, Apply Discount, Apply
Tax, Generate Receipt -- the full checkout workflow end to end.

Business rules enforced here (README Section 11):
  - A completed sale must contain at least one product.
  - Normal sales must not make stock negative.
  - Inventory updates occur only when a sale successfully completes.
  - Failed transactions must not leave inconsistent/partially updated data
    (stock is checked for ALL line items before ANY are decremented).
"""
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import HTTPException
from sqlmodel import Session, select

from app.business_infrastructure.payment_gateway import ICreditAuthorizationService
from app.config import DEFAULT_TAX_RATE
from app.domain.controllers.inventory_controller import InventoryController
from app.domain.models import (
    Product,
    Receipt,
    Sale,
    SaleLineItem,
    SaleStatus,
)
from app.domain.schemas import PayRequest, SaleCreateRequest
from app.technical_services.logging.logger import log_action, log_error


def _generate_sale_number() -> str:
    return f"TXN-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


def _generate_receipt_number() -> str:
    return f"RCPT-{uuid.uuid4().hex[:10].upper()}"


class SalesController:
    def __init__(self, session: Session, payment_service: ICreditAuthorizationService):
        self.session = session
        self.payment_service = payment_service
        self.inventory_controller = InventoryController(session)

    # -- Cart / start sale ---------------------------------------------------

    def start_sale(self, req: SaleCreateRequest, cashier_id: int) -> Sale:
        """startSale() / scanItem() / enterQuantity() collapsed into one call:
        the React cart builds the line-item list client-side, then this
        creates the PENDING Sale server-side (server is the source of truth
        for price and stock, never the client)."""
        if not req.items:
            raise HTTPException(status_code=400, detail="A sale must contain at least one product.")

        sale = Sale(
            sale_number=_generate_sale_number(),
            cashier_id=cashier_id,
            customer_id=req.customer_id,
            discount_amount=max(0.0, req.discount_amount),
            status=SaleStatus.PENDING,
        )
        self.session.add(sale)
        self.session.commit()
        self.session.refresh(sale)

        for item in req.items:
            product = self.session.get(Product, item.product_id)
            if not product or product.is_discontinued:
                self.session.delete(sale)
                self.session.commit()
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item.product_id} not found or discontinued.",
                )
            inv = product.inventory
            if not inv or inv.stock_quantity < item.quantity:
                self.session.delete(sale)
                self.session.commit()
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Insufficient stock for '{product.name}': "
                        f"requested {item.quantity}, available "
                        f"{inv.stock_quantity if inv else 0}."
                    ),
                )

            line_item = SaleLineItem(
                sale_id=sale.id,
                product_id=product.id,
                product_name_snapshot=product.name,
                quantity=item.quantity,
                unit_price=product.price,
                discount=item.discount,
            )
            line_item.get_subtotal()
            self.session.add(line_item)

        self.session.commit()
        self.session.refresh(sale)
        self._recalculate_totals(sale)
        log_action("sale_started", actor=str(cashier_id), detail=f"sale_number={sale.sale_number}")
        return sale

    def modify_transaction(self, sale_id: int, req: SaleCreateRequest, actor: str) -> Sale:
        """Modify Transaction use case: replace the line items / discount of
        a still-PENDING sale (e.g. cashier changed quantities before paying)."""
        sale = self._get_pending_sale(sale_id)

        for li in list(sale.line_items):
            self.session.delete(li)
        self.session.commit()

        sale.discount_amount = max(0.0, req.discount_amount)
        for item in req.items:
            product = self.session.get(Product, item.product_id)
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found.")
            inv = product.inventory
            if not inv or inv.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for '{product.name}'.",
                )
            line_item = SaleLineItem(
                sale_id=sale.id,
                product_id=product.id,
                product_name_snapshot=product.name,
                quantity=item.quantity,
                unit_price=product.price,
                discount=item.discount,
            )
            line_item.get_subtotal()
            self.session.add(line_item)

        self.session.add(sale)
        self.session.commit()
        self.session.refresh(sale)
        self._recalculate_totals(sale)
        log_action("sale_modified", actor=actor, detail=f"sale_id={sale_id}")
        return sale

    def apply_discount(self, sale_id: int, discount_amount: float, actor: str) -> Sale:
        sale = self._get_pending_sale(sale_id)
        if discount_amount < 0:
            raise HTTPException(status_code=400, detail="Discount cannot be negative.")
        sale.discount_amount = discount_amount
        self.session.add(sale)
        self.session.commit()
        self.session.refresh(sale)
        self._recalculate_totals(sale)
        log_action("discount_applied", actor=actor, detail=f"sale_id={sale_id} amount={discount_amount}")
        return sale

    def _recalculate_totals(self, sale: Sale) -> Sale:
        """Sale.calculateTotal() + Apply Tax use case."""
        self.session.refresh(sale)
        sale.calculate_total(DEFAULT_TAX_RATE)
        self.session.add(sale)
        self.session.commit()
        self.session.refresh(sale)
        return sale

    # -- Payment / completion -------------------------------------------------

    def make_payment(self, sale_id: int, req: PayRequest, actor: str) -> Sale:
        """endSale() + makePayment(amount, method) per design_class_diagram.md.

        Order of operations matters for the "no inconsistent data" business
        rule: (1) verify stock is STILL sufficient for every line item,
        (2) authorize payment via the gateway interface, (3) only then
        decrement inventory and mark the sale completed, in one DB
        transaction-equivalent block. If any step fails, nothing is
        persisted as completed.
        """
        sale = self._get_pending_sale(sale_id)
        if not sale.line_items:
            raise HTTPException(status_code=400, detail="A completed sale must contain at least one product.")

        # Step 1: re-validate stock (it may have changed since the cart was built).
        for li in sale.line_items:
            product = self.session.get(Product, li.product_id)
            inv = product.inventory if product else None
            if not product or not inv or inv.stock_quantity < li.quantity:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f"Stock for '{li.product_name_snapshot}' changed and is now "
                        f"insufficient. Please review the cart."
                    ),
                )

        # Step 2: authorize payment (mocked Flutterwave-backed gateway).
        auth_result = self.payment_service.authorize(
            amount=sale.total_amount,
            method=req.payment_method.value,
            reference=sale.sale_number,
        )
        if not auth_result.get("success"):
            log_error("payment_failed", detail=f"sale_id={sale_id} result={auth_result}")
            raise HTTPException(status_code=402, detail=auth_result.get("message", "Payment declined."))

        tendered = req.tendered_amount if req.payment_method.value == "cash" else sale.total_amount
        if req.payment_method.value == "cash":
            if tendered is None or tendered < sale.total_amount:
                raise HTTPException(
                    status_code=400,
                    detail="Tendered cash amount is less than the total due.",
                )
        change_due = round((tendered or sale.total_amount) - sale.total_amount, 2)

        # Step 3: decrement inventory for every line item (all-or-nothing; stock
        # was already verified above so this should not fail, but guard anyway).
        try:
            for li in sale.line_items:
                product = self.session.get(Product, li.product_id)
                product.inventory.reduce_stock(li.quantity)
                self.session.add(product.inventory)
        except ValueError as e:
            self.session.rollback()
            log_error("sale_completion_failed", detail=f"sale_id={sale_id} error={e}")
            raise HTTPException(status_code=409, detail=str(e))

        sale.status = SaleStatus.COMPLETED
        sale.payment_method = req.payment_method
        self.session.add(sale)

        from app.domain.models import Payment  # local import avoids circular import at module load

        payment = Payment(
            sale_id=sale.id,
            amount=sale.total_amount,
            payment_method=req.payment_method,
            transaction_ref=auth_result.get("transaction_ref"),
            tendered_amount=tendered,
            change_due=change_due,
        )
        self.session.add(payment)

        receipt = Receipt(
            sale_id=sale.id,
            receipt_number=_generate_receipt_number(),
            total_amount=sale.total_amount,
            tax_amount=sale.tax_amount,
        )
        self.session.add(receipt)

        self.session.commit()
        self.session.refresh(sale)

        log_action(
            "sale_completed",
            actor=actor,
            detail=f"sale_number={sale.sale_number} total={sale.total_amount} method={req.payment_method}",
        )

        # Low-stock check runs after commit so it reflects the final stock level.
        for li in sale.line_items:
            product = self.session.get(Product, li.product_id)
            self.inventory_controller.check_low_stock(product)

        return sale

    def cancel_sale(self, sale_id: int, actor: str) -> Sale:
        """Cancel Transaction use case. No inventory changes are needed since
        stock is only decremented on successful completion, not on cart
        creation."""
        sale = self._get_pending_sale(sale_id)
        sale.status = SaleStatus.CANCELLED
        self.session.add(sale)
        self.session.commit()
        self.session.refresh(sale)
        log_action("sale_cancelled", actor=actor, detail=f"sale_id={sale_id}")
        return sale

    # -- Queries --------------------------------------------------------------

    def get_sale(self, sale_id: int) -> Sale:
        sale = self.session.get(Sale, sale_id)
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found.")
        return sale

    def _get_pending_sale(self, sale_id: int) -> Sale:
        sale = self.get_sale(sale_id)
        if sale.status != SaleStatus.PENDING:
            raise HTTPException(status_code=400, detail=f"Sale is {sale.status}, not pending.")
        return sale

    def list_sales(
        self,
        status_filter: str | None = None,
        cashier_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> List[Sale]:
        query = select(Sale)
        if status_filter:
            query = query.where(Sale.status == status_filter)
        if cashier_id:
            query = query.where(Sale.cashier_id == cashier_id)
        if start_date:
            query = query.where(Sale.sale_date >= start_date)
        if end_date:
            query = query.where(Sale.sale_date <= end_date)
        query = query.order_by(Sale.sale_date.desc())
        return list(self.session.exec(query).all())
