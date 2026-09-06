// Top-selling products table sourced from `top_products` in
// SalesReportResponse (already ranked/limited server-side).

import { formatMoney } from '../../utils/currency';

export default function TopProductsTable({ products, isLoading }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
      <div className="p-space-lg pb-0">
        <span className="font-headline-sm text-headline-sm text-on-surface">Top-Selling Products</span>
      </div>
      <div className="overflow-x-auto mt-space-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-headline-sm text-headline-sm uppercase text-[11px] tracking-wider">
              <th className="py-2.5 px-space-md font-semibold w-10">#</th>
              <th className="py-2.5 px-space-md font-semibold">Product</th>
              <th className="py-2.5 px-space-md font-semibold text-right">Units Sold</th>
              <th className="py-2.5 px-space-md font-semibold text-right">Revenue</th>
            </tr>
          </thead>
          {isLoading ? (
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-space-md" colSpan={4}>
                    <div className="h-6 bg-surface-container rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody className="divide-y divide-surface-container text-body-sm font-body-sm text-on-surface">
              {(products || []).map((p, i) => (
                <tr key={p.product_id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-2.5 px-space-md font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">{i + 1}</td>
                  <td className="py-2.5 px-space-md font-semibold">{p.name}</td>
                  <td className="py-2.5 px-space-md text-right font-label-numeric-sm text-label-numeric-sm">{p.quantity_sold}</td>
                  <td className="py-2.5 px-space-md text-right font-label-numeric-sm text-label-numeric-sm font-semibold">
                    {formatMoney(p.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {!isLoading && (!products || products.length === 0) && (
        <div className="flex flex-col items-center justify-center gap-space-sm py-space-2xl text-center">
          <span className="material-symbols-outlined text-outline text-[32px]">inventory_2</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">No product sales in this period.</p>
        </div>
      )}
    </div>
  );
}
