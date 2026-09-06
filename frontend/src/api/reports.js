import apiClient from './client';

// Increment 3 (Reports & Analytics) API wrappers, same thin-wrapper-over-axios
// pattern as pos.js / products.js. Field names copied verbatim from
// API_REFERENCE.md's `GET /api/reports/sales` (SalesReportResponse) section.
// fetchInventoryReport / downloadInventoryCsv already live in products.js
// (Increment 2) and are reused as-is from ReportsPage rather than duplicated
// here.

export async function fetchSalesReport({ period, startDate, endDate } = {}) {
  const params = {};
  if (period) params.period = period;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const res = await apiClient.get('/api/reports/sales', { params });
  return res.data; // SalesReportResponse: {period, start_date, end_date, total_sales, total_transactions, total_discounts, total_tax, average_ticket, top_products[], sales_by_day[]}
}

// Same blob-download approach as downloadInventoryCsv in products.js -- the
// endpoint requires the Authorization header, which a plain <a href> can't
// attach, so fetch as a blob and trigger the download via an object URL.
export async function downloadSalesCsv() {
  const res = await apiClient.get('/api/reports/sales/export.csv', { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sales-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
