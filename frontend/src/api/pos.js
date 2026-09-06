import apiClient from './client';

// Thin wrappers around the endpoints documented in API_REFERENCE.md that the
// POS Terminal screen needs. Field names here are copied verbatim from the
// reference (ProductRead / SaleRead shapes) -- see that doc before changing
// any key used here.

export async function fetchCategories() {
  const res = await apiClient.get('/api/products/meta/categories');
  return res.data; // CategoryRead[]: {id, name, description}
}

export async function fetchProducts({ search, categoryId, includeDiscontinued } = {}) {
  const params = {};
  if (search) params.search = search;
  if (categoryId) params.category_id = categoryId;
  if (includeDiscontinued) params.include_discontinued = true;
  const res = await apiClient.get('/api/products', { params });
  return res.data; // ProductRead[]
}

export async function fetchProductByBarcode(barcode) {
  const res = await apiClient.get(`/api/products/barcode/${encodeURIComponent(barcode)}`);
  return res.data; // ProductRead, 404 if not found
}

export async function startSale({ items, discountAmount }) {
  const res = await apiClient.post('/api/sales', {
    items,
    discount_amount: discountAmount || 0,
  });
  return res.data; // SaleRead
}

export async function modifySale(saleId, { items, discountAmount }) {
  const res = await apiClient.put(`/api/sales/${saleId}`, {
    items,
    discount_amount: discountAmount || 0,
  });
  return res.data; // SaleRead
}

export async function cancelSale(saleId) {
  const res = await apiClient.post(`/api/sales/${saleId}/cancel`);
  return res.data; // SaleRead
}

export async function paySale(saleId, { paymentMethod, tenderedAmount }) {
  const body = { payment_method: paymentMethod };
  if (paymentMethod === 'cash') body.tendered_amount = tenderedAmount;
  const res = await apiClient.post(`/api/sales/${saleId}/pay`, body);
  return res.data; // SaleRead, includes payments[] + receipt
}

export async function fetchReceiptText(saleId) {
  const res = await apiClient.get(`/api/sales/${saleId}/receipt.txt`, { responseType: 'text' });
  return res.data; // plain text
}

// Increment 3 (Sales & Transactions history) additions -- same thin-wrapper
// pattern, field names copied verbatim from API_REFERENCE.md's `GET
// /api/sales?status_filter=&cashier_id=&start_date=&end_date=` and
// `GET /api/sales/{id}` sections.

export async function fetchSales({ statusFilter, cashierId, startDate, endDate } = {}) {
  const params = {};
  if (statusFilter) params.status_filter = statusFilter;
  if (cashierId) params.cashier_id = cashierId;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const res = await apiClient.get('/api/sales', { params });
  return res.data; // SaleRead[]
}

export async function fetchSaleDetail(saleId) {
  const res = await apiClient.get(`/api/sales/${saleId}`);
  return res.data; // SaleRead
}
