import StockStatusBadge, { deriveStockStatus } from '../common/StockStatusBadge';

// Inventory ledger table, ported from inventory_stock_management_code.html's
// "Inventory Master Table", built on top of ProductRead rows from
// GET /api/products (which already embeds `inventory`).

function formatMoney(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="py-3 px-space-md" colSpan={8}>
            <div className="h-8 bg-surface-container rounded" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export default function InventoryTable({ products, isLoading, isError, errorMessage, canAdjust, onAdjust }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
      {isError && (
        <div className="flex items-center gap-space-sm p-space-md bg-error-container/40 border-b border-error/30 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-body-sm text-body-sm">{errorMessage}</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-headline-sm text-headline-sm uppercase text-[11px] tracking-wider">
              <th className="py-3 px-space-md font-semibold">Product &amp; SKU</th>
              <th className="py-3 px-space-md font-semibold">Category</th>
              <th className="py-3 px-space-md font-semibold">Bin / Shelf</th>
              <th className="py-3 px-space-md font-semibold text-right">Cost / Unit</th>
              <th className="py-3 px-space-md font-semibold text-right">Retail Price</th>
              <th className="py-3 px-space-md font-semibold text-right">Current Stock</th>
              <th className="py-3 px-space-md font-semibold text-right">Reorder Threshold</th>
              <th className="py-3 px-space-md font-semibold text-center">Status</th>
              {canAdjust && <th className="py-3 px-space-md font-semibold text-right">Operations</th>}
            </tr>
          </thead>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <tbody className="divide-y divide-surface-container text-body-md font-body-md text-on-surface">
              {products.map((product) => {
                const status = deriveStockStatus(product);
                const rowTint = status === 'low_stock' ? 'bg-amber-50/20' : status === 'out_of_stock' ? 'bg-red-50/25' : '';
                return (
                  <tr key={product.id} className={`hover:bg-surface-container-low/60 transition-colors group ${rowTint}`}>
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-outline text-[22px]">devices_other</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                            {product.name}
                          </span>
                          <span className="font-label-code text-label-code text-on-surface-variant">
                            SKU: {product.sku} &bull; UPC: {product.barcode}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-md">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-code text-label-code">
                        {product.category?.name || '--'}
                      </span>
                    </td>
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-1 font-label-code text-label-code text-on-surface">
                        <span className="material-symbols-outlined text-[14px] text-outline">shelves</span>
                        <span>{product.inventory?.bin_location || '--'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-space-md text-right font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">
                      {formatMoney(product.cost_price)}
                    </td>
                    <td className="py-3 px-space-md text-right font-label-numeric-md text-label-numeric-md text-on-surface font-semibold">
                      {formatMoney(product.price)}
                    </td>
                    <td className="py-3 px-space-md text-right">
                      <span className="font-label-numeric-md text-label-numeric-md font-bold text-on-surface">
                        {product.inventory ? product.inventory.stock_quantity : '--'}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant ml-0.5">units</span>
                    </td>
                    <td className="py-3 px-space-md text-right font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">
                      {product.inventory ? `${product.inventory.reorder_level} units` : '--'}
                    </td>
                    <td className="py-3 px-space-md text-center">
                      <StockStatusBadge product={product} />
                    </td>
                    {canAdjust && (
                      <td className="py-3 px-space-md text-right">
                        <button
                          type="button"
                          onClick={() => onAdjust(product)}
                          disabled={!product.inventory}
                          className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-sm text-headline-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Adjust &plusmn;
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {!isLoading && products.length === 0 && !isError && (
        <div className="flex flex-col items-center justify-center gap-space-sm py-16 text-center">
          <span className="material-symbols-outlined text-outline text-[40px]">inventory_2</span>
          <p className="font-body-md text-body-md text-on-surface-variant">No products match your filters.</p>
        </div>
      )}
    </div>
  );
}
