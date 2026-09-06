"""
Domain Layer -- InventoryController (GRASP Controller).

Handles: Add Product, Update Product Information, Remove Product, Receive
Low Stock Alert, per design_class_diagram.md.
"""
from typing import List, Optional

from fastapi import HTTPException
from sqlmodel import Session, select

from app.config import STORE_MANAGER_EMAIL, STORE_MANAGER_PHONE
from app.domain.models import Inventory, Product, ProductCategory, Supplier
from app.domain.schemas import (
    ProductCreateRequest,
    ProductUpdateRequest,
    StockAdjustmentRequest,
)
from app.technical_services.logging.logger import log_action, log_error
from app.technical_services.notifications.email_service import send_email
from app.technical_services.notifications.sms_service import send_sms


class InventoryController:
    def __init__(self, session: Session):
        self.session = session

    # -- Product CRUD -----------------------------------------------------

    def add_product(self, req: ProductCreateRequest, actor: str) -> Product:
        existing = self.session.exec(
            select(Product).where(
                (Product.barcode == req.barcode) | (Product.sku == req.sku)
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="A product with this barcode or SKU already exists.",
            )

        product = Product(
            sku=req.sku,
            barcode=req.barcode,
            name=req.name,
            brand=req.brand,
            description=req.description,
            cost_price=req.cost_price,
            price=req.price,
            image_url=req.image_url,
            category_id=req.category_id,
            supplier_id=req.supplier_id,
        )
        self.session.add(product)
        self.session.commit()
        self.session.refresh(product)

        inventory = Inventory(
            product_id=product.id,
            stock_quantity=req.initial_stock,
            reorder_level=req.reorder_level,
            bin_location=req.bin_location,
        )
        self.session.add(inventory)
        self.session.commit()
        self.session.refresh(product)

        log_action("product_added", actor=actor, detail=f"product_id={product.id} sku={product.sku}")
        return product

    def update_product(self, product_id: int, req: ProductUpdateRequest, actor: str) -> Product:
        product = self.session.get(Product, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")

        data = req.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(product, field, value)

        self.session.add(product)
        self.session.commit()
        self.session.refresh(product)
        log_action("product_updated", actor=actor, detail=f"product_id={product_id}")
        return product

    def remove_product(self, product_id: int, actor: str) -> Product:
        """Remove Product use case: mark discontinued rather than hard-delete,
        per detailed_use_cases_iteration2.md exception condition (a product
        may be referenced by past sales -- hard delete would break history)."""
        product = self.session.get(Product, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")
        product.is_discontinued = True
        self.session.add(product)
        self.session.commit()
        self.session.refresh(product)
        log_action("product_discontinued", actor=actor, detail=f"product_id={product_id}")
        return product

    def list_products(
        self,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        include_discontinued: bool = False,
    ) -> List[Product]:
        query = select(Product)
        if category_id is not None:
            query = query.where(Product.category_id == category_id)
        if not include_discontinued:
            query = query.where(Product.is_discontinued == False)  # noqa: E712
        products = list(self.session.exec(query).all())
        if search:
            products = [p for p in products if p.matches_search(search)]
        return products

    def get_product(self, product_id: int) -> Product:
        product = self.session.get(Product, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")
        return product

    def get_product_by_barcode(self, barcode: str) -> Optional[Product]:
        return self.session.exec(select(Product).where(Product.barcode == barcode)).first()

    # -- Stock / Inventory --------------------------------------------------

    def adjust_stock(self, product_id: int, req: StockAdjustmentRequest, actor: str) -> Inventory:
        product = self.get_product(product_id)
        inv = product.inventory
        if not inv:
            raise HTTPException(status_code=404, detail="No inventory record for this product.")

        if req.delta >= 0:
            inv.increase_stock(req.delta)
        else:
            try:
                inv.reduce_stock(-req.delta)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))

        self.session.add(inv)
        self.session.commit()
        self.session.refresh(inv)
        log_action(
            "stock_adjusted",
            actor=actor,
            detail=f"product_id={product_id} delta={req.delta} reason={req.reason} note={req.note}",
        )
        self.check_low_stock(product)
        return inv

    def check_low_stock(self, product: Product) -> None:
        """Receive Low Stock Alert use case: system-initiated, following a
        sale or stock adjustment. Sends a mocked SMS + email to the store
        manager when stock falls at/below the reorder level."""
        self.session.refresh(product)
        inv = product.inventory
        if not inv:
            return
        if inv.is_below_reorder_level():
            level_word = "OUT OF STOCK" if inv.is_out_of_stock() else "LOW STOCK"
            message = (
                f"GadgetPOS Alert: {level_word} - {product.name} (SKU {product.sku}) "
                f"has {inv.stock_quantity} units left (reorder level {inv.reorder_level})."
            )
            send_sms(STORE_MANAGER_PHONE, message)
            send_email(STORE_MANAGER_EMAIL, f"[GadgetPOS] {level_word}: {product.name}", message)
            log_action(
                "low_stock_alert",
                actor="system",
                detail=f"product_id={product.id} stock={inv.stock_quantity} reorder_level={inv.reorder_level}",
            )

    def list_low_stock_products(self) -> List[Product]:
        products = self.list_products(include_discontinued=False)
        return [p for p in products if p.inventory and p.inventory.is_below_reorder_level()]

    # -- Categories / Suppliers ---------------------------------------------

    def list_categories(self) -> List[ProductCategory]:
        return list(self.session.exec(select(ProductCategory)).all())

    def add_category(self, name: str, description: Optional[str] = None) -> ProductCategory:
        cat = ProductCategory(name=name, description=description)
        self.session.add(cat)
        self.session.commit()
        self.session.refresh(cat)
        return cat

    def list_suppliers(self) -> List[Supplier]:
        return list(self.session.exec(select(Supplier)).all())
