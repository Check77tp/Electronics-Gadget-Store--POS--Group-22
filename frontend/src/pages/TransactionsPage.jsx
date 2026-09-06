import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '../api/client';
import { fetchSales } from '../api/pos';
import TransactionsTable from '../components/transactions/TransactionsTable';
import TransactionDetailModal from '../components/transactions/TransactionDetailModal';

// Sales & Transactions history screen (Increment 3). No Stitch export exists
// for this screen (claude/README.md Section 10 "Coverage gap") -- designed
// from scratch against precision_retail_core.md tokens, following the
// filter-bar + table conventions already established by InventoryPage.jsx.
//
// Status + date range are sent to GET /api/sales as query params
// (status_filter / start_date / end_date per API_REFERENCE.md); the cashier
// filter is derived client-side from the already-filtered result set (there
// is no cashier-listing endpoint available to a manager -- GET /api/users is
// admin-only, so a manager viewing this screen couldn't populate that
// dropdown from it anyway) and applied client-side, same pattern as
// InventoryPage's stock-status filter over server-filtered products.
//
// Date-input gotcha: the backend treats `end_date` as an exact timestamp, so
// a bare YYYY-MM-DD (midnight) excludes same-day sales that happened later
// that day -- confirmed against the live backend. We append T23:59:59 before
// sending so picking "today" as the end date actually includes today.

const STATUS_FILTERS = [
  { key: 'all', label: 'Status: All' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
];

function toInclusiveEndDate(dateStr) {
  return dateStr ? `${dateStr}T23:59:59` : undefined;
}

export default function TransactionsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cashierFilter, setCashierFilter] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  const salesQuery = useQuery({
    queryKey: ['sales', statusFilter, startDate, endDate],
    queryFn: () =>
      fetchSales({
        statusFilter: statusFilter === 'all' ? undefined : statusFilter,
        startDate: startDate || undefined,
        endDate: toInclusiveEndDate(endDate),
      }),
  });

  const sales = salesQuery.data || [];

  const cashiers = useMemo(() => {
    const map = new Map();
    sales.forEach((s) => {
      if (s.cashier_id != null) map.set(s.cashier_id, s.cashier_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sales]);

  const filteredSales = useMemo(() => {
    if (!cashierFilter) return sales;
    return sales.filter((s) => String(s.cashier_id) === cashierFilter);
  }, [sales, cashierFilter]);

  function clearFilters() {
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setCashierFilter('');
  }

  const hasActiveFilters = statusFilter !== 'all' || startDate || endDate || cashierFilter;

  return (
    <div className="flex flex-col w-full">
      <div className="px-space-xl py-space-lg flex flex-col gap-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col">
            <h1 className="font-display-lg text-display-lg tracking-tight text-on-surface">Sales &amp; Transactions</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">
              Full transaction history with line items, payments, and receipts.
            </p>
          </div>
          <span className="font-label-code text-label-code text-on-surface-variant">
            SHOWING: <strong className="text-on-surface font-label-numeric-sm">{filteredSales.length}</strong> TRANSACTIONS
          </span>
        </div>

        {/* Filters */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-space-md">
            <div className="flex items-center flex-wrap gap-space-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface">
                <span className="material-symbols-outlined text-outline text-[18px]">filter_alt</span>
                <select
                  className="bg-transparent font-headline-sm text-headline-sm text-on-surface focus:outline-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_FILTERS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface">
                <span className="material-symbols-outlined text-outline text-[18px]">badge</span>
                <select
                  className="bg-transparent font-headline-sm text-headline-sm text-on-surface focus:outline-none cursor-pointer"
                  value={cashierFilter}
                  onChange={(e) => setCashierFilter(e.target.value)}
                >
                  <option value="">All Cashiers</option>
                  {cashiers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface">
                <span className="material-symbols-outlined text-outline text-[18px]">event</span>
                <input
                  type="date"
                  aria-label="Start date"
                  className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-on-surface-variant">&rarr;</span>
                <input
                  type="date"
                  aria-label="End date"
                  className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  <span className="font-body-sm text-body-sm">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <TransactionsTable
          sales={filteredSales}
          isLoading={salesQuery.isLoading}
          isError={salesQuery.isError}
          errorMessage={getErrorMessage(salesQuery.error, 'Could not load transactions.')}
          onSelect={(sale) => setSelectedSaleId(sale.id)}
        />
      </div>

      {selectedSaleId && <TransactionDetailModal saleId={selectedSaleId} onClose={() => setSelectedSaleId(null)} />}
    </div>
  );
}
