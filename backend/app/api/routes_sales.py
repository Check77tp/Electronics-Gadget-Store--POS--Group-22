from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Response
from sqlmodel import Session

from app.business_infrastructure.payment_gateway import get_payment_service
from app.domain.controllers.sales_controller import SalesController
from app.domain.models import Sale, UserAccount
from app.domain.schemas import PayRequest, SaleCreateRequest, SaleRead
from app.technical_services.auth.dependencies import get_current_user
from app.technical_services.persistence.database import get_session

router = APIRouter(prefix="/api/sales", tags=["sales"])


def _to_sale_read(sale: Sale) -> SaleRead:
    return SaleRead(
        id=sale.id,
        sale_number=sale.sale_number,
        cashier_id=sale.cashier_id,
        cashier_name=sale.cashier.full_name if sale.cashier else None,
        customer_id=sale.customer_id,
        sale_date=sale.sale_date,
        subtotal=sale.subtotal,
        discount_amount=sale.discount_amount,
        tax_amount=sale.tax_amount,
        total_amount=sale.total_amount,
        status=sale.status,
        payment_method=sale.payment_method,
        line_items=[
            {
                "id": li.id,
                "product_id": li.product_id,
                "product_name_snapshot": li.product_name_snapshot,
                "quantity": li.quantity,
                "unit_price": li.unit_price,
                "discount": li.discount,
                "subtotal": li.subtotal,
            }
            for li in sale.line_items
        ],
        payments=[
            {
                "id": p.id,
                "amount": p.amount,
                "payment_method": p.payment_method,
                "payment_date": p.payment_date,
                "transaction_ref": p.transaction_ref,
                "tendered_amount": p.tendered_amount,
                "change_due": p.change_due,
            }
            for p in sale.payments
        ],
        receipt=(
            {
                "id": sale.receipt.id,
                "receipt_number": sale.receipt.receipt_number,
                "issue_date": sale.receipt.issue_date,
                "total_amount": sale.receipt.total_amount,
                "tax_amount": sale.receipt.tax_amount,
            }
            if sale.receipt
            else None
        ),
    )


@router.post("", response_model=SaleRead, status_code=201)
def start_sale(
    payload: SaleCreateRequest,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    """Process Sale use case, steps 1-2: cashier builds the cart -> server
    creates a PENDING Sale with validated line items and totals."""
    controller = SalesController(session, get_payment_service())
    sale = controller.start_sale(payload, cashier_id=current_user.id)
    return _to_sale_read(sale)


@router.put("/{sale_id}", response_model=SaleRead)
def modify_sale(
    sale_id: int,
    payload: SaleCreateRequest,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    """Modify Transaction use case."""
    controller = SalesController(session, get_payment_service())
    sale = controller.modify_transaction(sale_id, payload, actor=current_user.username)
    return _to_sale_read(sale)


@router.post("/{sale_id}/discount", response_model=SaleRead)
def apply_discount(
    sale_id: int,
    discount_amount: float,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    """Apply Discount use case."""
    controller = SalesController(session, get_payment_service())
    sale = controller.apply_discount(sale_id, discount_amount, actor=current_user.username)
    return _to_sale_read(sale)


@router.post("/{sale_id}/pay", response_model=SaleRead)
def pay_sale(
    sale_id: int,
    payload: PayRequest,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    """Process Sale use case, final steps: payment -> complete -> inventory
    update -> receipt generation, all in one call."""
    controller = SalesController(session, get_payment_service())
    sale = controller.make_payment(sale_id, payload, actor=current_user.username)
    return _to_sale_read(sale)


@router.post("/{sale_id}/cancel", response_model=SaleRead)
def cancel_sale(
    sale_id: int,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    """Cancel Transaction use case."""
    controller = SalesController(session, get_payment_service())
    sale = controller.cancel_sale(sale_id, actor=current_user.username)
    return _to_sale_read(sale)


@router.get("", response_model=List[SaleRead])
def list_sales(
    status_filter: Optional[str] = None,
    cashier_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    """Sales/Transaction History with filters."""
    controller = SalesController(session, get_payment_service())
    sales = controller.list_sales(status_filter, cashier_id, start_date, end_date)
    return [_to_sale_read(s) for s in sales]


@router.get("/{sale_id}", response_model=SaleRead)
def get_sale(
    sale_id: int,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    """Transaction Detail view."""
    controller = SalesController(session, get_payment_service())
    sale = controller.get_sale(sale_id)
    return _to_sale_read(sale)


@router.get("/{sale_id}/receipt.txt")
def get_receipt_text(
    sale_id: int,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    """Generate Receipt use case: plain-text printable receipt."""
    controller = SalesController(session, get_payment_service())
    sale = controller.get_sale(sale_id)

    lines = [
        "========================================",
        "            GadgetPOS Receipt",
        "========================================",
        f"Receipt #: {sale.receipt.receipt_number if sale.receipt else 'N/A'}",
        f"Sale #:    {sale.sale_number}",
        f"Date:      {sale.sale_date.strftime('%Y-%m-%d %H:%M:%S')}",
        f"Cashier:   {sale.cashier.full_name if sale.cashier else sale.cashier_id}",
        "----------------------------------------",
    ]
    for li in sale.line_items:
        lines.append(f"{li.product_name_snapshot[:24]:<24} x{li.quantity:<3} {li.subtotal:>8.2f}")
    lines += [
        "----------------------------------------",
        f"{'Subtotal':<28}{sale.subtotal:>10.2f}",
        f"{'Discount':<28}{-sale.discount_amount:>10.2f}",
        f"{'Tax':<28}{sale.tax_amount:>10.2f}",
        f"{'TOTAL':<28}{sale.total_amount:>10.2f}",
    ]
    if sale.payments:
        p = sale.payments[-1]
        lines.append(f"{'Payment (' + p.payment_method.value + ')':<28}{p.amount:>10.2f}")
        if p.tendered_amount is not None:
            lines.append(f"{'Tendered':<28}{p.tendered_amount:>10.2f}")
            lines.append(f"{'Change Due':<28}{p.change_due:>10.2f}")
    lines += ["========================================", "     Thank you for shopping with us!", "========================================"]

    return Response(content="\n".join(lines), media_type="text/plain")
