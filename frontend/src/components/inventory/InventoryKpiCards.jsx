// KPI card row, ported from inventory_stock_management_code.html's
// "Inventory KPI Summary Deck", sourced from GET /api/reports/inventory
// (InventoryReportResponse) rather than recomputed client-side.

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

export default function InventoryKpiCards({ report, isLoading }) {
  if (isLoading || !report) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
      <Card
        label="Inventory Valuation"
        value={formatMoney(report.total_stock_value)}
        icon="account_balance_wallet"
      />
      <Card label="Active SKUs" value={report.total_skus} icon="devices_other" accent={{ iconBg: 'bg-surface-container text-tertiary' }} />
      <Card
        label="Low Stock Alert"
        value={report.low_stock_count}
        icon="warning"
        accent={{ label: 'text-amber-700', value: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-600' }}
        footer={
          <div className="flex items-center justify-between bg-amber-50/80 px-2 py-1 rounded">
            <span className="font-label-code text-label-code text-amber-800">Requires PO:</span>
            <span className="font-label-numeric-sm text-label-numeric-sm font-semibold text-amber-900">
              {report.low_stock_count > 0 ? 'Immediate Action' : 'None'}
            </span>
          </div>
        }
      />
      <Card
        label="Depleted Stock"
        value={report.out_of_stock_count}
        icon="error"
        accent={{ label: 'text-error', value: 'text-error', iconBg: 'bg-error-container text-error' }}
        footer={
          <div className="flex items-center justify-between bg-error-container/60 px-2 py-1 rounded">
            <span className="font-label-code text-label-code text-on-error-container">Critical Velocity:</span>
            <span className="font-label-numeric-sm text-label-numeric-sm font-bold text-on-error-container">
              {report.out_of_stock_count > 0 ? 'High Priority' : 'None'}
            </span>
          </div>
        }
      />
    </div>
  );
}
