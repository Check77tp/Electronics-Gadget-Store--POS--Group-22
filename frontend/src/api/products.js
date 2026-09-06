import apiClient from './client';

// Increment 2 (Products & Inventory Management) API wrappers, following the
// same thin-wrapper-over-axios pattern as pos.js. Field names are copied
// verbatim from API_REFERENCE.md / the backend's Pydantic schemas
// (ProductCreateRequest / ProductUpdateRequest / StockAdjustmentRequest /
// InventoryReportResponse) -- check that reference before changing any key
// used here. fetchCategories / fetchProducts already live in pos.js and are
// reused as-is rather than duplicated.

export async function fetchSuppliers() {
  const res = await apiClient.get('/api/products/meta/suppliers');
  return res.data; // SupplierRead[]
}

export async function createCategory({ name, description }) {
  const res = await apiClient.post('/api/products/meta/categories', { name, description });
  return res.data; // CategoryRead
}

export async function createProduct(payload) {
  // payload matches ProductCreateRequest verbatim: sku, barcode, name, brand?,
  // description?, cost_price, price, image_url?, category_id?, supplier_id?,
  // initial_stock, reorder_level, bin_location?
  const res = await apiClient.post('/api/products', payload);
  return res.data; // ProductRead
}

export async function updateProduct(productId, payload) {
  // payload matches ProductUpdateRequest (all fields optional).
  const res = await apiClient.put(`/api/products/${productId}`, payload);
  return res.data; // ProductRead
}

export async function discontinueProduct(productId) {
  // Soft delete -- backend marks is_discontinued=true and returns the product.
  const res = await apiClient.delete(`/api/products/${productId}`);
  return res.data; // ProductRead
}

export async function adjustStock(productId, { delta, reason, note }) {
  const res = await apiClient.post(`/api/products/${productId}/adjust-stock`, {
    delta,
    reason,
    note: note || undefined,
  });
  return res.data; // {product_id, stock_quantity, reorder_level, is_below_reorder_level}
}

export async function fetchLowStockProducts() {
  const res = await apiClient.get('/api/products/meta/low-stock');
  return res.data; // ProductRead[], admin/manager only, already filtered to <= reorder level
}

export async function fetchInventoryReport() {
  const res = await apiClient.get('/api/reports/inventory');
  return res.data; // InventoryReportResponse: {generated_at, total_skus, total_stock_value, low_stock_count, out_of_stock_count, rows[]}
}

// The export endpoint requires the Authorization header, which a plain
// <a href> can't attach -- fetch the CSV as a blob and trigger the download
// via a temporary object URL instead.
export async function downloadInventoryCsv() {
  const res = await apiClient.get('/api/reports/inventory/export.csv', { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
