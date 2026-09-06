// Sales/Transaction history table (Increment 3). No Stitch export exists for
// this screen (claude/README.md Section 10 "Coverage gap") -- built from
// scratch against precision_retail_core.md tokens, reusing the row/table
// conventions already established in InventoryTable.jsx / ProductsTable.jsx
// (skeleton rows while loading, an inline error banner, a centered empty
// state) so it reads as the same app rather than a bolt-on.

import { formatMoney } from '../../utils/currency';

const STATUS_STYLES = {
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-800',
  cancelled: 'bg-surface-container text-on-surface-variant',
};

const STATUS_DOTS = {
  completed: 'bg-emerald-500',
  pending: 'bg-amber-500',
  cancelled: 'bg-outline',
};

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-badge text-label-badge uppercase ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status] || STATUS_DOTS.pending}`}></span>
      {status}
    </span>
  );
}

function formatDateTime(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function itemCount(sale) {
  return (sale.line_items || []).reduce((sum, li) => sum + li.quantity, 0);
}

function paymentLabel(method) {
  if (!method) return '--';
  return method.replace('_', ' ');
}

function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="py-3 px-space-md" colSpan={7}>
            <div className="h-8 bg-surface-container rounded" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export default function TransactionsTable({ sales, isLoading, isError, errorMessage, onSelect }) {
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
              <th className="py-3 px-space-md font-semibold">Sale #</th>
              <th className="py-3 px-space-md font-semibold">Date / Time</th>
              <th className="py-3 px-space-md font-semibold">Cashier</th>
              <th className="py-3 px-space-md font-semibold text-right">Items</th>
              <th className="py-3 px-space-md font-semibold text-right">Total</th>
              <th className="py-3 px-space-md font-semibold">Payment</th>
              <th className="py-3 px-space-md font-semibold text-center">Status</th>
            </tr>
          </thead>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <tbody className="divide-y divide-surface-container text-body-md font-body-md text-on-surface">
              {sales.map((sale) => {
                const isCancelled = sale.status === 'cancelled';
                return (
                  <tr
                    key={sale.id}
                    onClick={() => onSelect(sale)}
                    className={`cursor-pointer hover:bg-surface-container-low/60 transition-colors group ${isCancelled ? 'opacity-70' : ''}`}
                  >
                    <td className="py-3 px-space-md">
                      <span
                        className={`font-label-code text-label-code text-on-surface group-hover:text-primary transition-colors ${isCancelled ? 'line-through decoration-outline' : ''}`}
                      >
                        {sale.sale_number}
                      </span>
                    </td>
                    <td className="py-3 px-space-md font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                      {formatDateTime(sale.sale_date)}
                    </td>
                    <td className="py-3 px-space-md font-body-sm text-body-sm text-on-surface">{sale.cashier_name || '--'}</td>
                    <td className="py-3 px-space-md text-right font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">
                      {itemCount(sale)}
                    </td>
                    <td
                      className={`py-3 px-space-md text-right font-label-numeric-md text-label-numeric-md font-semibold ${isCancelled ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}
                    >
                      {formatMoney(sale.total_amount)}
                    </td>
                    <td className="py-3 px-space-md font-body-sm text-body-sm text-on-surface-variant capitalize">
                      {paymentLabel(sale.payment_method)}
                    </td>
                    <td className="py-3 px-space-md text-center">
                      <StatusPill status={sale.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {!isLoading && sales.length === 0 && !isError && (
        <div className="flex flex-col items-center justify-center gap-space-sm py-16 text-center">
          <span className="material-symbols-outlined text-outline text-[40px]">receipt_long</span>
          <p className="font-body-md text-body-md text-on-surface-variant">No transactions match these filters.</p>
        </div>
      )}
    </div>
  );
}
