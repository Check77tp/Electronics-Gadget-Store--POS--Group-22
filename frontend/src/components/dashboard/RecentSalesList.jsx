// Compact "Recent Register Transactions" list for the Dashboard landing
// page, adapted from TransactionsTable.jsx's row conventions (status pill,
// money/date formatting) but trimmed to a lightweight list rather than a
// full filterable table -- that table already lives at /sales.

import { Link } from 'react-router-dom';

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

function formatMoney(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatTime(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function itemCount(sale) {
  return (sale.line_items || []).reduce((sum, li) => sum + li.quantity, 0);
}

export default function RecentSalesList({ sales, isLoading, isError, errorMessage }) {
  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col">
      <div className="flex items-center justify-between pb-space-md">
        <span className="font-headline-sm text-headline-sm text-on-surface">Recent Register Transactions</span>
        <Link to="/sales" className="font-body-sm text-body-sm text-primary font-semibold hover:underline flex items-center gap-1">
          View All <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </Link>
      </div>

      {isError && (
        <div className="flex items-center gap-space-sm p-space-md mb-space-sm rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-body-sm text-body-sm">{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-space-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        !isError && (
          <div className="flex flex-col items-center justify-center gap-space-sm py-space-2xl text-center">
            <span className="material-symbols-outlined text-outline text-[32px]">receipt_long</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">No transactions yet.</p>
          </div>
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-badge text-label-badge uppercase tracking-wider">
                <th className="py-2.5 px-3 rounded-l-lg">Sale #</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3 text-center">Items</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-0 text-on-surface font-body-sm text-body-sm">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-3 font-label-numeric-sm text-label-numeric-sm font-semibold text-primary">
                    {sale.sale_number}
                  </td>
                  <td className="py-3 px-3 font-label-code text-label-code text-on-surface-variant whitespace-nowrap">
                    {formatTime(sale.sale_date)}
                  </td>
                  <td className="py-3 px-3 font-medium">{sale.cashier_name || '--'}</td>
                  <td className="py-3 px-3 text-center font-label-numeric-sm text-label-numeric-sm">{itemCount(sale)}</td>
                  <td className="py-3 px-3 text-right font-label-numeric-md text-label-numeric-md font-semibold text-on-surface">
                    {formatMoney(sale.total_amount)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-badge text-label-badge uppercase ${STATUS_STYLES[sale.status] || STATUS_STYLES.pending}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[sale.status] || STATUS_DOTS.pending}`}></span>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
