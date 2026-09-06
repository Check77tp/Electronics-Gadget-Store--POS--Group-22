// "Urgent Stock Alerts" panel, adapted from dashboard_code.html. Sourced
// from GET /api/products/meta/low-stock (admin/manager only) -- already
// filtered server-side to products at/under their reorder level, so no
// client-side threshold logic is needed here. Capped to the 5 most urgent
// (lowest stock first) so the panel stays compact; the full picture lives
// on /inventory.

function stockBadgeClasses(qty) {
  return qty <= 0 ? 'bg-error text-on-error' : 'bg-surface-container-highest text-on-surface';
}

export default function LowStockAlerts({ products, isLoading, isError, errorMessage }) {
  const sorted = [...(products || [])].sort(
    (a, b) => (a.inventory?.stock_quantity ?? 0) - (b.inventory?.stock_quantity ?? 0)
  );
  const shown = sorted.slice(0, 5);
  const criticalCount = sorted.filter((p) => (p.inventory?.stock_quantity ?? 0) <= 0).length;

  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col">
      <div className="flex items-center justify-between pb-space-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-[20px]">notifications_active</span>
          <span className="font-headline-sm text-headline-sm text-on-surface">Urgent Stock Alerts</span>
        </div>
        {!isLoading && sorted.length > 0 && (
          <span className="font-label-badge text-label-badge bg-error-container text-on-error-container px-2 py-0.5 rounded-full font-bold">
            {sorted.length} LOW{criticalCount > 0 ? ` / ${criticalCount} OUT` : ''}
          </span>
        )}
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
        Products at or below their reorder level.
      </p>

      {isError && (
        <div className="flex items-center gap-space-sm p-space-md mb-space-sm rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-body-sm text-body-sm">{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-space-sm">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        !isError && (
          <div className="flex flex-col items-center justify-center gap-space-sm py-space-lg text-center">
            <span className="material-symbols-outlined text-emerald-500 text-[32px]">verified</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">All stock is above reorder level.</p>
          </div>
        )
      ) : (
        <div className="space-y-space-sm">
          {shown.map((p) => {
            const qty = p.inventory?.stock_quantity ?? 0;
            const outOfStock = qty <= 0;
            return (
              <div
                key={p.id}
                className={`p-space-md rounded-xl flex items-start justify-between gap-2 ${outOfStock ? 'bg-error-container/30' : 'bg-surface-container-low'}`}
              >
                <div className="min-w-0">
                  <h4 className={`font-body-sm text-body-sm font-semibold truncate ${outOfStock ? 'text-error' : 'text-on-surface'}`}>
                    {p.name}
                  </h4>
                  <div className="flex items-center gap-1 font-label-code text-label-code text-on-surface-variant">
                    <span>SKU: {p.sku}</span> &bull; <span>Reorder at: {p.inventory?.reorder_level ?? '--'}</span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-badge text-[10px] font-bold shrink-0 ${stockBadgeClasses(qty)}`}
                >
                  {outOfStock ? '0 IN STOCK' : `Stock: ${qty}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
