from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Response
from sqlmodel import Session

from app.domain.controllers.report_controller import ReportController
from app.domain.models import UserAccount, UserRole
from app.domain.schemas import InventoryReportResponse, SalesReportResponse
from app.technical_services.auth.dependencies import require_roles
from app.technical_services.persistence.database import get_session

router = APIRouter(prefix="/api/reports", tags=["reports"])

# Reports are Manager/Admin territory per README Section 7 (roles table).
_report_roles = require_roles(UserRole.ADMIN, UserRole.MANAGER)


@router.get("/sales", response_model=SalesReportResponse)
def sales_report(
    period: str = "daily",
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(_report_roles),
):
    """View Sales Report use case (FR4, FR10)."""
    controller = ReportController(session)
    return controller.generate_sales_report(period, start_date, end_date)


@router.get("/inventory", response_model=InventoryReportResponse)
def inventory_report(
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(_report_roles),
):
    """View Inventory Report use case (FR11)."""
    controller = ReportController(session)
    return controller.generate_inventory_report()


@router.get("/sales/export.csv")
def export_sales_csv(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(_report_roles),
):
    """Export Sales Data use case (FR12)."""
    controller = ReportController(session)
    csv_text = controller.export_sales_csv(start_date, end_date)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales_export.csv"},
    )


@router.get("/inventory/export.csv")
def export_inventory_csv(
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(_report_roles),
):
    controller = ReportController(session)
    csv_text = controller.export_inventory_csv()
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory_export.csv"},
    )
