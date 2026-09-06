// Dashboard landing-page KPI row, adapted from dashboard_code.html's "Top KPI
// Summary Cards" section. Only renders numbers the backend actually reports:
// today's sales/transactions/average ticket come from GET /api/reports/sales
// (period=daily), and inventory health from GET /api/reports/inventory --
// there is no drawer-cash or hourly-throughput endpoint, so those Stitch mock
// metrics are dropped rather than invented. Card shape matches
// SalesKpiCards.jsx / InventoryKpiCards.jsx for visual consistency.

import { formatMoney } from '../../utils/currency';

function Card({ label, value, icon, accent, footer }) {
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
      {footer && <div className="mt-space-md pt-space-xs">{footer}</div>}
    </div>
  );
}

export default function DashboardKpiCards({ salesReport, inventoryReport, isLoading }) {
  if (isLoading || (!salesReport && !inventoryReport)) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  const hasAlerts = (inventoryReport?.low_stock_count ?? 0) + (inventoryReport?.out_of_stock_count ?? 0) > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">
      <Card
        label="Today's Gross Sales"
        value={formatMoney(salesReport?.total_sales)}
        icon="payments"
        accent={{ iconBg: 'bg-primary-container text-on-primary' }}
        footer={
          <div className="flex items-center gap-1 text-on-surface-variant font-label-code text-label-code">
            <span className="material-symbols-outlined text-[15px] text-tertiary">receipt_long</span>
            <span>Last 24 hours (rolling)</span>
          </div>
        }
      />
      <Card label="Transactions Today" value={salesReport?.total_transactions ?? 0} icon="receipt_long" />
      <Card label="Average Ticket" value={formatMoney(salesReport?.average_ticket)} icon="shopping_cart_checkout" />
      <Card
        label="Inventory Health"
        value={`${inventoryReport?.low_stock_count ?? 0} / ${inventoryReport?.out_of_stock_count ?? 0}`}
        icon={hasAlerts ? 'warning' : 'verified'}
        accent={
          hasAlerts
            ? { label: 'text-amber-700', value: 'text-amber-700', iconBg: 'bg-amber-50 text-amber-600' }
            : undefined
        }
        footer={
          <div className="flex items-center justify-between font-label-code text-label-code text-on-surface-variant">
            <span>Low-stock / Out-of-stock SKUs</span>
          </div>
        }
      />
    </div>
  );
}
