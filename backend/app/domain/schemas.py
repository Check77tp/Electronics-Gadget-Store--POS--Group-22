"""
Domain Layer -- API request/response schemas (Pydantic, via SQLModel).

Kept separate from the persistent table models in models.py so the wire
format (what the React UI sends/receives) can evolve independently of the
DB schema.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.domain.models import PaymentMethod, SaleStatus, UserRole, UserStatus


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


class UserPublic(BaseModel):
    id: int
    username: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole
    status: UserStatus
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class UserCreateRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.CASHIER


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    password: Optional[str] = None


# ---------------------------------------------------------------------------
# Catalog
# ---------------------------------------------------------------------------

class CategoryRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None


class CategoryCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


class SupplierRead(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class SupplierCreateRequest(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class InventoryRead(BaseModel):
    stock_quantity: int
    reorder_level: int
    bin_location: Optional[str] = None
    last_updated: datetime
    is_below_reorder_level: bool
    is_out_of_stock: bool


class ProductRead(BaseModel):
    id: int
    sku: str
    barcode: str
    name: str
    brand: Optional[str] = None
    description: Optional[str] = None
    cost_price: float
    price: float
    image_url: Optional[str] = None
    is_discontinued: bool
    category: Optional[CategoryRead] = None
    supplier: Optional[SupplierRead] = None
    inventory: Optional[InventoryRead] = None


class ProductCreateRequest(BaseModel):
    sku: str
    barcode: str
    name: str
    brand: Optional[str] = None
    description: Optional[str] = None
    cost_price: float = 0.0
    price: float
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    initial_stock: int = 0
    reorder_level: int = 5
    bin_location: Optional[str] = None


class ProductUpdateRequest(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    cost_price: Optional[float] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    is_discontinued: Optional[bool] = None


class StockAdjustmentRequest(BaseModel):
    delta: int  # positive = add stock, negative = remove
    reason: str = "manual_adjustment"
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# Sales / POS
# ---------------------------------------------------------------------------

class CartLineItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    discount: float = 0.0


class SaleCreateRequest(BaseModel):
    """Body for POST /api/sales -- creates a PENDING sale (cart)."""
    items: List[CartLineItemRequest]
    discount_amount: float = 0.0
    customer_id: Optional[int] = None


class SaleLineItemRead(BaseModel):
    id: int
    product_id: int
    product_name_snapshot: str
    quantity: int
    unit_price: float
    discount: float
    subtotal: float


class PaymentRead(BaseModel):
    id: int
    amount: float
    payment_method: PaymentMethod
    payment_date: datetime
    transaction_ref: Optional[str] = None
    tendered_amount: Optional[float] = None
    change_due: Optional[float] = None


class ReceiptRead(BaseModel):
    id: int
    receipt_number: str
    issue_date: datetime
    total_amount: float
    tax_amount: float


class SaleRead(BaseModel):
    id: int
    sale_number: str
    cashier_id: int
    cashier_name: Optional[str] = None
    customer_id: Optional[int] = None
    sale_date: datetime
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    status: SaleStatus
    payment_method: Optional[PaymentMethod] = None
    line_items: List[SaleLineItemRead] = []
    payments: List[PaymentRead] = []
    receipt: Optional[ReceiptRead] = None


class PayRequest(BaseModel):
    payment_method: PaymentMethod
    tendered_amount: Optional[float] = None  # required for cash to compute change


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

class TopProductRow(BaseModel):
    product_id: int
    name: str
    quantity_sold: int
    revenue: float


class SalesReportResponse(BaseModel):
    period: str
    start_date: datetime
    end_date: datetime
    total_sales: float
    total_transactions: int
    total_discounts: float
    total_tax: float
    average_ticket: float
    top_products: List[TopProductRow]
    sales_by_day: List[dict]


class InventoryReportRow(BaseModel):
    product_id: int
    name: str
    sku: str
    category: Optional[str] = None
    stock_quantity: int
    reorder_level: int
    unit_cost: float
    stock_value: float
    status: str


class InventoryReportResponse(BaseModel):
    generated_at: datetime
    total_skus: int
    total_stock_value: float
    low_stock_count: int
    out_of_stock_count: int
    rows: List[InventoryReportRow]
