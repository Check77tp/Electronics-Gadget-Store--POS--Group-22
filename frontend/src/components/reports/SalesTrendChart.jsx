// Sales trend visualization sourced from `sales_by_day` in
// SalesReportResponse. Deliberately a plain CSS bar chart (no charting
// library) per the increment brief -- each day's total is mapped to a bar
// height as a percentage of the period's max day, with the value shown on
// hover (native title tooltip) and always-visible under narrow bar counts.

import { formatMoney } from '../../utils/currency';

function formatDayLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function SalesTrendChart({ salesByDay, isLoading }) {
  if (isLoading) {
    return <div className="h-56 rounded-xl bg-surface-container-lowest shadow-sm animate-pulse" />;
  }

  const days = salesByDay || [];
  const maxTotal = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
      <span className="font-headline-sm text-headline-sm text-on-surface">Sales Trend</span>
      {days.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-space-sm py-space-2xl text-center">
          <span className="material-symbols-outlined text-outline text-[32px]">show_chart</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">No sales in this period.</p>
        </div>
      ) : (
        <div className="flex items-end gap-1.5 h-48 pt-space-md">
          {days.map((d) => {
            const heightPct = Math.max(2, (d.total / maxTotal) * 100);
            return (
              <div key={d.date} className="flex-1 min-w-[8px] h-full flex flex-col items-center justify-end gap-space-2xs group">
                <span className="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {formatMoney(d.total, { decimals: 0 })}
                </span>
                <div
                  title={`${formatDayLabel(d.date)}: ${formatMoney(d.total, { decimals: 0 })}`}
                  style={{ height: `${heightPct}%` }}
                  className="w-full rounded-t bg-primary-container hover:bg-primary transition-colors min-h-[4px]"
                />
                <span className="font-label-code text-label-code text-on-surface-variant whitespace-nowrap">
                  {formatDayLabel(d.date)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
