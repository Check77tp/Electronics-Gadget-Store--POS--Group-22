# GadgetPOS Backend API Reference (for frontend integration)

Base URL in dev: `http://localhost:8000`. All endpoints except `/api/auth/login` and
`/api/health` require an `Authorization: Bearer <token>` header. The JWT is obtained
from login and never expires-checked client side — just attach it and let 401s
trigger a redirect to `/login`.

Roles: `admin`, `manager`, `cashier` (see `UserRole` enum). Role checks happen
server-side; a 403 means "not authorized", not "hide the button and move on" —
the frontend should still handle 403 gracefully (toast + no-op), never assume success.

## Auth

- `POST /api/auth/login` — body `{username, password}` → `{access_token, token_type, user: {id, username, full_name, email, phone, role, status, created_at}}`.
  - 401 `{detail}` on wrong credentials. 403 `{detail}` on disabled account.
- `GET /api/auth/me` — returns the current user (UserPublic), given a valid token.

## Products (`/api/products`)

- `GET /api/products?search=&category_id=&include_discontinued=false` — list, any role. `search` matches name/category/sku/barcode.
- `GET /api/products/{id}` — one product.
- `GET /api/products/barcode/{barcode}` — lookup for barcode-scan input; 404 if not found.
- `POST /api/products` — admin/manager only. Body: `ProductCreateRequest` (sku, barcode, name, brand?, description?, cost_price, price, image_url?, category_id?, supplier_id?, initial_stock, reorder_level, bin_location?).
- `PUT /api/products/{id}` — admin/manager only. Partial update (`ProductUpdateRequest`, all fields optional).
- `DELETE /api/products/{id}` — admin/manager only. Marks discontinued (soft delete), returns the updated product.
- `POST /api/products/{id}/adjust-stock` — admin/manager only. Body `{delta, reason?, note?}` (delta can be negative). Returns `{product_id, stock_quantity, reorder_level, is_below_reorder_level}`.
- `GET /api/products/meta/categories` / `POST /api/products/meta/categories` (write = admin/manager)
- `GET /api/products/meta/suppliers`
- `GET /api/products/meta/low-stock` — admin/manager only.

`ProductRead` shape:
```json
{
  "id": 1, "sku": "...", "barcode": "...", "name": "...", "brand": "...",
  "description": "...", "cost_price": 22.0, "price": 39.99, "image_url": null,
  "is_discontinued": false,
  "category": {"id":1,"name":"...","description":null} | null,
  "supplier": {"id":1,"name":"...","phone":"...","email":"...","address":"..."} | null,
  "inventory": {
    "stock_quantity": 42, "reorder_level": 15, "bin_location": "...",
    "last_updated": "iso-datetime",
    "is_below_reorder_level": false, "is_out_of_stock": false
  } | null
}
```

## Sales / POS (`/api/sales`) — the core Process Sale workflow

1. `POST /api/sales` — any authenticated role (cashier normally). Body:
   `{items: [{product_id, quantity, discount?}], discount_amount?, customer_id?}`.
   Creates a PENDING sale server-side (server computes/validates price + stock —
   never trust client-sent prices). Returns `SaleRead` with computed
   `subtotal`, `tax_amount` (8.25%), `total_amount`. 400 if a product is out of
   stock or the cart is empty.
2. `PUT /api/sales/{id}` — replace line items/discount on a still-PENDING sale (Modify Transaction).
3. `POST /api/sales/{id}/discount?discount_amount=5.0` — Apply Discount (query param, not body).
4. `POST /api/sales/{id}/pay` — body `{payment_method: "cash"|"card"|"mobile_money", tendered_amount?}`
   (`tendered_amount` required for cash to compute change; ignored otherwise).
   Authorizes via the mocked payment gateway, decrements inventory, marks
   COMPLETED, creates a Payment + Receipt. Returns full `SaleRead` including
   `payments[]` (with `change_due`) and `receipt`. 402 if payment declined,
   409 if stock changed underneath the cart.
5. `POST /api/sales/{id}/cancel` — Cancel Transaction (only while PENDING).
6. `GET /api/sales?status_filter=&cashier_id=&start_date=&end_date=` — Transaction history with filters.
7. `GET /api/sales/{id}` — Transaction Detail view.
8. `GET /api/sales/{id}/receipt.txt` — plain-text printable receipt (open in a new tab / `<pre>` block or trigger print).

`SaleRead` shape: `{id, sale_number, cashier_id, cashier_name, customer_id, sale_date, subtotal, discount_amount, tax_amount, total_amount, status: "pending"|"completed"|"cancelled", payment_method, line_items: [{id, product_id, product_name_snapshot, quantity, unit_price, discount, subtotal}], payments: [{id, amount, payment_method, payment_date, transaction_ref, tendered_amount, change_due}], receipt: {id, receipt_number, issue_date, total_amount, tax_amount} | null}`.

## Reports (`/api/reports`) — admin/manager only

- `GET /api/reports/sales?period=daily|weekly|monthly&start_date=&end_date=` → `SalesReportResponse` (totals, top_products[], sales_by_day[]).
- `GET /api/reports/inventory` → `InventoryReportResponse` (rows[], total_stock_value, low_stock_count, out_of_stock_count).
- `GET /api/reports/sales/export.csv` / `GET /api/reports/inventory/export.csv` — file download (trigger via `window.open` or an `<a>` with the Authorization header handled via fetch+blob, since `<a href>` can't set headers — fetch the blob and use `URL.createObjectURL`).

## Users (`/api/users`) — admin only

- `GET /api/users` → `UserPublic[]`.
- `POST /api/users` — body `UserCreateRequest {username, password, full_name, email?, phone?, role}`.
- `PUT /api/users/{id}` — body `UserUpdateRequest` (all fields optional: full_name, email, phone, role, status: "active"|"disabled", password).
- `POST /api/users/{id}/disable` — shortcut for PUT with status=disabled. 400 if it's the last active admin.

## Error shape

All errors are `{"detail": "human readable message"}` with a 4xx/5xx status. Show `detail` directly in toasts/inline errors.

## Default seeded logins

- `admin` / `Admin123!` (Administrator)
- `manager` / `Manager123!` (Manager)
- `cashier` / `Cashier123!` (Cashier)
- `cashier2` / `Cashier123!` — **disabled**, useful for demoing the disabled-account error state.
