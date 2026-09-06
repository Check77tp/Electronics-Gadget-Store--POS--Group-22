// Sales report KPI row, same card shape as InventoryKpiCards.jsx (Increment
// 2) for visual consistency, sourced straight from GET /api/reports/sales
// (SalesReportResponse) rather than recomputed client-side.

import { formatMoney } from '../../utils/currency';

function Card({ label, value, icon, accent }) {
  return (
    <div className="relative overflow-hidden p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className={`font-label-code text-label-code uppercase tracking-wider ${accent?.label || 'text-on-surface-variant'}`}>
            {label}
          </span>
          <span className={`font-label-numeric-lg text-label-numeric-lg mt-1 ${accent?.value || 'text-on-surface'}`}>{value}</span>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent?.iconBg || 'bg-surface-container text-primary'}`}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function SalesKpiCards({ report, isLoading }) {
  if (isLoading || !report) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
      <Card
        label="Total Sales"
        value={formatMoney(report.total_sales)}
        icon="payments"
        accent={{ iconBg: 'bg-primary-container text-on-primary' }}
      />
      <Card label="Transactions" value={report.total_transactions} icon="receipt_long" />
      <Card label="Average Ticket" value={formatMoney(report.average_ticket)} icon="shopping_cart" />
      <Card
        label="Total Discounts"
        value={formatMoney(report.total_discounts)}
        icon="sell"
        accent={{ label: 'text-amber-700', value: 'text-amber-700', iconBg: 'bg-amber-50 text-amber-600' }}
      />
      <Card label="Total Tax" value={formatMoney(report.total_tax)} icon="account_balance" />
    </div>
  );
}
