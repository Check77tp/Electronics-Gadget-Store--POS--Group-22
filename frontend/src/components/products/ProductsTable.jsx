import StockStatusBadge, { deriveStockStatus } from '../common/StockStatusBadge';

// Product Catalog table, ported from project_management_catalog_code.html's
// table markup, wired to real ProductRead rows. Margin is computed
// client-side per the task spec: (price - cost) / price.

function formatMoney(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function TableSkeleton() {
  return (
    <tbody className="divide-y divide-surface-container">
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="py-3 px-4" colSpan={10}>
            <div className="h-8 bg-surface-container rounded" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export default function ProductsTable({ products, isLoading, isError, errorMessage, canManage, onEdit, onDiscontinue }) {
  return (
    <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
      {isError && (
        <div className="flex items-center gap-space-sm p-space-md bg-error-container/40 border-b border-error/30 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-body-sm text-body-sm">{errorMessage}</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-headline-sm text-[11px] uppercase tracking-wider select-none">
              <th className="py-3.5 px-4 font-semibold">Product Name &amp; Model</th>
              <th className="py-3.5 px-2 font-semibold">SKU / Barcode</th>
              <th className="py-3.5 px-2 font-semibold">Category</th>
              <th className="py-3.5 px-2 font-semibold">Brand</th>
              <th className="py-3.5 px-2 font-semibold text-right">Cost</th>
              <th className="py-3.5 px-2 font-semibold text-right">Price</th>
              <th className="py-3.5 px-2 font-semibold text-right">Margin</th>
              <th className="py-3.5 px-2 font-semibold text-right">Stock</th>
              <th className="py-3.5 px-2 font-semibold text-center">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <tbody className="divide-y divide-surface-container font-body-sm text-body-sm text-on-surface">
              {products.map((product) => {
                const margin = product.price > 0 ? ((product.price - product.cost_price) / product.price) * 100 : null;
                const status = deriveStockStatus(product);
                const discontinued = status === 'discontinued';
                return (
                  <tr key={product.id} className={`transition-colors ${discontinued ? 'opacity-60' : 'hover:bg-surface-container-low'}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-surface-container overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                          {product.image_url ? (
                            <img className="w-full h-full object-cover" src={product.image_url} alt={product.name} />
                          ) : (
                            <span className="material-symbols-outlined text-outline text-[22px]">devices_other</span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">{product.name}</span>
                          {product.brand && <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{product.brand}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-label-code text-label-code">
                      <div className="flex flex-col">
                        <span className="text-on-surface">{product.sku}</span>
                        <span className="text-[10px] text-on-surface-variant">{product.barcode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-on-surface-variant">{product.category?.name || '--'}</td>
                    <td className="py-3 px-2 font-semibold text-on-surface">{product.brand || '--'}</td>
                    <td className="py-3 px-2 text-right font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">
                      {formatMoney(product.cost_price)}
                    </td>
                    <td className="py-3 px-2 text-right font-label-numeric-md text-label-numeric-md font-bold text-on-surface">
                      {formatMoney(product.price)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {margin === null ? (
                        <span className="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">--</span>
                      ) : (
                        <span
                          className={`font-label-numeric-sm text-label-numeric-sm font-bold px-1.5 py-0.5 rounded ${
                            margin >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-error bg-error-container/40'
                          }`}
                        >
                          {margin.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-label-numeric-md text-label-numeric-md font-semibold text-on-surface">
                      {product.inventory ? product.inventory.stock_quantity : '--'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <StockStatusBadge product={product} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit(product)}
                              disabled={discontinued}
                              title={discontinued ? 'Discontinued products cannot be edited' : 'Edit Item'}
                              className="p-1.5 rounded-lg text-primary hover:bg-surface-container disabled:text-outline disabled:cursor-not-allowed"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDiscontinue(product)}
                              disabled={discontinued}
                              title={discontinued ? 'Already discontinued' : 'Discontinue'}
                              className="p-1.5 rounded-lg text-error hover:bg-error-container/50 disabled:text-outline disabled:cursor-not-allowed"
                            >
                              <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                            </button>
                          </>
                        ) : (
                          <span className="font-label-code text-[10px] text-outline uppercase">View only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {!isLoading && products.length === 0 && !isError && (
        <div className="flex flex-col items-center justify-center gap-space-sm py-16 text-center">
          <span className="material-symbols-outlined text-outline text-[40px]">search_off</span>
          <p className="font-body-md text-body-md text-on-surface-variant">No products match your filters.</p>
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="px-space-md py-3 bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
          <span>
            Displaying {products.length} {products.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      )}
    </div>
  );
}
