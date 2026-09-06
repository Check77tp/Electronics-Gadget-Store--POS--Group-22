// Inventory Report section of Reports & Analytics (Increment 3), sourced
// from GET /api/reports/inventory (InventoryReportResponse). Row shape here
// is the report's own flat row (product_id, name, sku, category,
// stock_quantity, reorder_level, unit_cost, stock_value, status) -- distinct
// from ProductRead used by InventoryPage.jsx, so the status pill is a small
// local re-derivation of StockStatusBadge's styles rather than that
// component itself (which expects a full ProductRead with a nested
// `inventory` object).

const STATUS_STYLES = {
  in_stock: 'bg-emerald-50 text-emerald-700',
  low_stock: 'bg-amber-50 text-amber-800',
  out_of_stock: 'bg-error-container text-on-error-container',
};

const STATUS_LABELS = {
  in_stock: 'IN STOCK',
  low_stock: 'LOW STOCK',
  out_of_stock: 'OUT OF STOCK',
};

function formatMoney(value) {
  return `$${Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Stat({ label, value, accent }) {
  return (
    <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col">
      <span className={`font-label-code text-label-code uppercase tracking-wider ${accent || 'text-on-surface-variant'}`}>{label}</span>
      <span className={`font-label-numeric-lg text-label-numeric-lg mt-1 ${accent || 'text-on-surface'}`}>{value}</span>
    </div>
  );
}

export default function InventoryReportSection({ report, isLoading, isError, errorMessage }) {
  if (isError) {
    return (
      <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
        <span className="material-symbols-outlined text-[20px]">error</span>
        <span className="font-body-sm text-body-sm">{errorMessage}</span>
      </div>
    );
  }

  if (isLoading || !report) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <Stat label="Active SKUs" value={report.total_skus} />
        <Stat label="Inventory Value" value={formatMoney(report.total_stock_value)} />
        <Stat label="Low Stock" value={report.low_stock_count} accent="text-amber-700" />
        <Stat label="Out of Stock" value={report.out_of_stock_count} accent="text-error" />
      </div>

      <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-headline-sm text-headline-sm uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-space-md font-semibold">Product</th>
                <th className="py-2.5 px-space-md font-semibold">Category</th>
                <th className="py-2.5 px-space-md font-semibold text-right">Stock</th>
                <th className="py-2.5 px-space-md font-semibold text-right">Reorder Level</th>
                <th className="py-2.5 px-space-md font-semibold text-right">Stock Value</th>
                <th className="py-2.5 px-space-md font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-body-sm font-body-sm text-on-surface">
              {report.rows.map((row) => (
                <tr key={row.product_id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-2.5 px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold">{row.name}</span>
                      <span className="font-label-code text-label-code text-on-surface-variant">SKU: {row.sku}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-space-md text-on-surface-variant">{row.category || '--'}</td>
                  <td className="py-2.5 px-space-md text-right font-label-numeric-sm text-label-numeric-sm">{row.stock_quantity}</td>
                  <td className="py-2.5 px-space-md text-right font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">
                    {row.reorder_level}
                  </td>
                  <td className="py-2.5 px-space-md text-right font-label-numeric-sm text-label-numeric-sm font-semibold">
                    {formatMoney(row.stock_value)}
                  </td>
                  <td className="py-2.5 px-space-md text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-badge text-label-badge ${STATUS_STYLES[row.status] || STATUS_STYLES.in_stock}`}
                    >
                      {STATUS_LABELS[row.status] || row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {report.rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-space-sm py-space-2xl text-center">
            <span className="material-symbols-outlined text-outline text-[32px]">inventory_2</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">No inventory data available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
