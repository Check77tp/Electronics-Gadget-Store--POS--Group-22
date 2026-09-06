"""
Domain Layer -- persistent entities.

SQLModel classes here are the implementation of the conceptual classes in
domain_model.md, refined with the methods/behavior described in
design_class_diagram.md. Each SQLModel class doubles as the DB table
definition AND the API (de)serialization schema (one model instead of two,
per README Section 4's rationale for choosing SQLModel).

Business-rule methods (calculateTotal, reduceStock, isBelowReorderLevel...)
live on these classes per GRASP Information Expert, matching
design_class_diagram.md.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Users & Roles
# ---------------------------------------------------------------------------

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    CASHIER = "cashier"


class UserStatus(str, Enum):
    ACTIVE = "active"
    DISABLED = "disabled"


class UserAccount(SQLModel, table=True):
    """UserAccount from domain_model.md. Cashier/Administrator are modeled as
    a `role` field rather than a class hierarchy (simpler mapping to a single
    DB table; role-specific behavior is enforced in the controllers /
    dependencies, not via subclassing) -- a deliberate, documented deviation
    from the conceptual model's generalization, noted in the status doc."""

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = Field(default=UserRole.CASHIER)
    status: UserStatus = Field(default=UserStatus.ACTIVE)
    created_at: datetime = Field(default_factory=_utcnow)

    sales: List["Sale"] = Relationship(back_populates="cashier")

    def has_role(self, role_name: str) -> bool:
        return self.role == role_name


# ---------------------------------------------------------------------------
# Catalog: Category, Supplier, Product, Inventory
# ---------------------------------------------------------------------------

class ProductCategory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = None

    products: List["Product"] = Relationship(back_populates="category")


class Supplier(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

    products: List["Product"] = Relationship(back_populates="supplier")


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sku: str = Field(index=True, unique=True)
    barcode: str = Field(index=True, unique=True)
    name: str = Field(index=True)
    brand: Optional[str] = None
    description: Optional[str] = None
    cost_price: float = 0.0
    price: float = 0.0
    image_url: Optional[str] = None
    is_discontinued: bool = Field(default=False)
    category_id: Optional[int] = Field(default=None, foreign_key="productcategory.id")
    supplier_id: Optional[int] = Field(default=None, foreign_key="supplier.id")
    created_at: datetime = Field(default_factory=_utcnow)

    category: Optional[ProductCategory] = Relationship(back_populates="products")
    supplier: Optional[Supplier] = Relationship(back_populates="products")
    inventory: Optional["Inventory"] = Relationship(
        back_populates="product",
        sa_relationship_kwargs={"uselist": False},
    )

    def matches_search(self, criteria: str) -> bool:
        """Search Product use case: match by name, category name, or barcode."""
        c = criteria.strip().lower()
        if not c:
            return True
        if c in self.name.lower():
            return True
        if c in self.barcode.lower():
            return True
        if c in self.sku.lower():
            return True
        if self.category and c in self.category.name.lower():
            return True
        return False


class Inventory(SQLModel, table=True):
    """Tracks stock for a Product. Business rules (Section 11): normal sales
    must never make stock negative; updates occur when a sale completes."""

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", unique=True)
    stock_quantity: int = Field(default=0)
    reorder_level: int = Field(default=5)
    bin_location: Optional[str] = None
    last_updated: datetime = Field(default_factory=_utcnow)

    product: Optional[Product] = Relationship(back_populates="inventory")

    def is_below_reorder_level(self) -> bool:
        return self.stock_quantity <= self.reorder_level

    def is_out_of_stock(self) -> bool:
        return self.stock_quantity <= 0

    def reduce_stock(self, qty: int) -> None:
        if qty > self.stock_quantity:
            raise ValueError("Insufficient stock: cannot reduce below zero.")
        self.stock_quantity -= qty
        self.last_updated = _utcnow()

    def increase_stock(self, qty: int) -> None:
        if qty < 0:
            raise ValueError("Cannot increase stock by a negative amount.")
        self.stock_quantity += qty
        self.last_updated = _utcnow()


# ---------------------------------------------------------------------------
# Customers (optional / loyalty)
# ---------------------------------------------------------------------------

class Customer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None

    sales: List["Sale"] = Relationship(back_populates="customer")


# ---------------------------------------------------------------------------
# Sales: Sale, SaleLineItem, Payment, Receipt
# ---------------------------------------------------------------------------

class SaleStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    MOBILE_MONEY = "mobile_money"


class Sale(SQLModel, table=True):
    """Sale from domain_model.md / design_class_diagram.md. `calculate_total`
    is Information Expert here because Sale owns its SaleLineItems."""

    id: Optional[int] = Field(default=None, primary_key=True)
    sale_number: str = Field(index=True, unique=True)
    cashier_id: int = Field(foreign_key="useraccount.id")
    customer_id: Optional[int] = Field(default=None, foreign_key="customer.id")
    sale_date: datetime = Field(default_factory=_utcnow)
    subtotal: float = 0.0
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0
    status: SaleStatus = Field(default=SaleStatus.PENDING)
    payment_method: Optional[PaymentMethod] = None

    cashier: Optional[UserAccount] = Relationship(back_populates="sales")
    customer: Optional[Customer] = Relationship(back_populates="sales")
    line_items: List["SaleLineItem"] = Relationship(
        back_populates="sale",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    payments: List["Payment"] = Relationship(back_populates="sale")
    receipt: Optional["Receipt"] = Relationship(
        back_populates="sale",
        sa_relationship_kwargs={"uselist": False},
    )

    def calculate_total(self, tax_rate: float) -> None:
        """Sale.calculateTotal() per design_class_diagram.md: subtotal from
        line items, minus discount, plus tax on the discounted amount."""
        self.subtotal = round(sum(li.subtotal for li in self.line_items), 2)
        discounted = max(0.0, self.subtotal - self.discount_amount)
        self.tax_amount = round(discounted * tax_rate, 2)
        self.total_amount = round(discounted + self.tax_amount, 2)

    def is_complete(self) -> bool:
        return self.status == SaleStatus.COMPLETED


class SaleLineItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sale_id: int = Field(foreign_key="sale.id")
    product_id: int = Field(foreign_key="product.id")
    product_name_snapshot: str  # preserved even if the product is later renamed/discontinued
    quantity: int
    unit_price: float
    discount: float = 0.0
    subtotal: float = 0.0

    sale: Optional[Sale] = Relationship(back_populates="line_items")
    product: Optional[Product] = Relationship()

    def get_subtotal(self) -> float:
        self.subtotal = round((self.unit_price * self.quantity) - self.discount, 2)
        return self.subtotal


class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sale_id: int = Field(foreign_key="sale.id")
    amount: float
    payment_method: PaymentMethod
    payment_date: datetime = Field(default_factory=_utcnow)
    transaction_ref: Optional[str] = None
    tendered_amount: Optional[float] = None
    change_due: Optional[float] = None

    sale: Optional[Sale] = Relationship(back_populates="payments")


class Receipt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sale_id: int = Field(foreign_key="sale.id", unique=True)
    receipt_number: str = Field(index=True, unique=True)
    issue_date: datetime = Field(default_factory=_utcnow)
    total_amount: float
    tax_amount: float

    sale: Optional[Sale] = Relationship(back_populates="receipt")
