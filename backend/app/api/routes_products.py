from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.domain.controllers.inventory_controller import InventoryController
from app.domain.models import Product, UserAccount, UserRole
from app.domain.schemas import (
    CategoryCreateRequest,
    CategoryRead,
    ProductCreateRequest,
    ProductRead,
    ProductUpdateRequest,
    StockAdjustmentRequest,
    SupplierRead,
)
from app.technical_services.auth.dependencies import get_current_user, require_roles
from app.technical_services.persistence.database import get_session

router = APIRouter(prefix="/api/products", tags=["products"])


def _to_product_read(product: Product) -> ProductRead:
    """Manual serialization: Inventory's is_below_reorder_level()/is_out_of_stock()
    are methods, not plain columns, so automatic ORM->Pydantic attribute
    copying can't populate those response fields directly."""
    inv = product.inventory
    return ProductRead(
        id=product.id,
        sku=product.sku,
        barcode=product.barcode,
        name=product.name,
        brand=product.brand,
        description=product.description,
        cost_price=product.cost_price,
        price=product.price,
        image_url=product.image_url,
        is_discontinued=product.is_discontinued,
        category=(
            CategoryRead(id=product.category.id, name=product.category.name, description=product.category.description)
            if product.category
            else None
        ),
        supplier=(
            SupplierRead(
                id=product.supplier.id,
                name=product.supplier.name,
                phone=product.supplier.phone,
                email=product.supplier.email,
                address=product.supplier.address,
            )
            if product.supplier
            else None
        ),
        inventory=(
            {
                "stock_quantity": inv.stock_quantity,
                "reorder_level": inv.reorder_level,
                "bin_location": inv.bin_location,
                "last_updated": inv.last_updated,
                "is_below_reorder_level": inv.is_below_reorder_level(),
                "is_out_of_stock": inv.is_out_of_stock(),
            }
            if inv
            else None
        ),
    )


@router.get("", response_model=List[ProductRead])
def list_products(
    search: Optional[str] = Query(default=None, description="Search by name, category, SKU or barcode"),
    category_id: Optional[int] = None,
    include_discontinued: bool = False,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    """Search Product use case (FR6): any authenticated role can search products."""
    controller = InventoryController(session)
    products = controller.list_products(search, category_id, include_discontinued)
    return [_to_product_read(p) for p in products]


@router.get("/{product_id}", response_model=ProductRead)
def get_product(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    """View Product Details use case (FR13)."""
    controller = InventoryController(session)
    return _to_product_read(controller.get_product(product_id))


@router.get("/barcode/{barcode}", response_model=ProductRead)
def get_product_by_barcode(
    barcode: str,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    controller = InventoryController(session)
    product = controller.get_product_by_barcode(barcode)
    if not product:
        raise HTTPException(status_code=404, detail="No product with that barcode.")
    return _to_product_read(product)


@router.post("", response_model=ProductRead, status_code=201)
def add_product(
    payload: ProductCreateRequest,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Add Product use case: Manager/Admin only, enforced server-side."""
    controller = InventoryController(session)
    return _to_product_read(controller.add_product(payload, actor=current_user.username))


@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: ProductUpdateRequest,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    controller = InventoryController(session)
    return _to_product_read(controller.update_product(product_id, payload, actor=current_user.username))


@router.delete("/{product_id}", response_model=ProductRead)
def remove_product(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Remove Product use case -- marks discontinued rather than hard delete."""
    controller = InventoryController(session)
    return _to_product_read(controller.remove_product(product_id, actor=current_user.username))


@router.post("/{product_id}/adjust-stock", response_model=dict)
def adjust_stock(
    product_id: int,
    payload: StockAdjustmentRequest,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    controller = InventoryController(session)
    inv = controller.adjust_stock(product_id, payload, actor=current_user.username)
    return {
        "product_id": product_id,
        "stock_quantity": inv.stock_quantity,
        "reorder_level": inv.reorder_level,
        "is_below_reorder_level": inv.is_below_reorder_level(),
    }


@router.get("/meta/categories", response_model=List[CategoryRead])
def list_categories(
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    controller = InventoryController(session)
    return controller.list_categories()


@router.post("/meta/categories", response_model=CategoryRead, status_code=201)
def add_category(
    payload: CategoryCreateRequest,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    controller = InventoryController(session)
    return controller.add_category(payload.name, payload.description)


@router.get("/meta/suppliers", response_model=List[SupplierRead])
def list_suppliers(
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(get_current_user),
):
    controller = InventoryController(session)
    return controller.list_suppliers()


@router.get("/meta/low-stock", response_model=List[ProductRead])
def low_stock_products(
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    controller = InventoryController(session)
    return [_to_product_read(p) for p in controller.list_low_stock_products()]
