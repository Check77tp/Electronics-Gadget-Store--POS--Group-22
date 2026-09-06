import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { fetchSalesReport, downloadSalesCsv } from '../api/reports';
import { fetchInventoryReport, downloadInventoryCsv } from '../api/products';
import SalesKpiCards from '../components/reports/SalesKpiCards';
import SalesTrendChart from '../components/reports/SalesTrendChart';
import TopProductsTable from '../components/reports/TopProductsTable';
import InventoryReportSection from '../components/reports/InventoryReportSection';
import Toast from '../components/pos/Toast';

// Reports & Analytics screen (Increment 3), admin/manager only per
// API_REFERENCE.md ("## Reports (`/api/reports`) -- admin/manager only").
// No Stitch export exists for this screen (claude/README.md Section 10
// "Coverage gap") -- built from scratch against precision_retail_core.md
// tokens. Covers every item in README Section 13 ("Reporting"): daily/
// weekly/monthly sales + transaction counts (period selector + KPI cards),
// sales trends (bar chart), top-selling products, current stock / low-stock
// / out-of-stock / inventory value (Inventory Report section), date-range
// filters (custom period), and CSV export for both reports.
//
// Gated behind hasRole('admin','manager') at the page level so a cashier who
// lands on /reports directly sees a clean "not authorized" message instead
// of a raw 403 -- this mirrors the backend's own 403 (API_REFERENCE.md:
// "a 403 means 'not authorized', not 'hide the button and move on'") rather
// than replacing it; the queries below never fire for a role that can't see
// them.

const PERIODS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'custom', label: 'Custom Range' },
];

function toInclusiveEndDate(dateStr) {
  return dateStr ? `${dateStr}T23:59:59` : undefined;
}

export default function ReportsPage() {
  const { hasRole } = useAuth();
  const canView = hasRole('admin', 'manager');

  const [period, setPeriod] = useState('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [toast, setToast] = useState(null);
  const [isExportingSales, setIsExportingSales] = useState(false);
  const [isExportingInventory, setIsExportingInventory] = useState(false);

  const isCustom = period === 'custom';
  const customRangeReady = !isCustom || (customStart && customEnd);

  const salesReportQuery = useQuery({
    queryKey: ['sales-report', period, customStart, customEnd],
    queryFn: () =>
      fetchSalesReport(
        isCustom
          ? { startDate: customStart, endDate: toInclusiveEndDate(customEnd) }
          : { period }
      ),
    enabled: canView && customRangeReady,
  });

  const inventoryReportQuery = useQuery({
    queryKey: ['inventory-report'],
    queryFn: fetchInventoryReport,
    enabled: canView,
  });

  function showToast(message, icon = 'check_circle') {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 2800);
  }

  async function handleExportSales() {
    setIsExportingSales(true);
    try {
      await downloadSalesCsv();
      showToast('Sales CSV downloaded', 'file_download');
    } catch (err) {
      if (err?.response?.status === 403) {
        showToast('You do not have permission to export sales reports.', 'block');
      } else {
        showToast(getErrorMessage(err, 'Could not export the sales report.'), 'error');
      }
    } finally {
      setIsExportingSales(false);
    }
  }

  async function handleExportInventory() {
    setIsExportingInventory(true);
    try {
      await downloadInventoryCsv();
      showToast('Inventory CSV downloaded', 'file_download');
    } catch (err) {
      if (err?.response?.status === 403) {
        showToast('You do not have permission to export inventory reports.', 'block');
      } else {
        showToast(getErrorMessage(err, 'Could not export the inventory report.'), 'error');
      }
    } finally {
      setIsExportingInventory(false);
    }
  }

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center gap-space-md p-space-2xl min-h-[calc(100vh-4rem)]">
        <span className="material-symbols-outlined text-outline text-[48px]">lock</span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Not Authorized</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md text-center">
          Reports &amp; Analytics is available to Managers and Administrators only. If you believe you should
          have access, contact your store administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="px-space-xl py-space-lg flex flex-col gap-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col">
            <h1 className="font-display-lg text-display-lg tracking-tight text-on-surface">Reports &amp; Analytics</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">
              Sales performance, product trends, and inventory health.
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col lg:flex-row lg:items-center gap-space-md">
          <div className="flex items-center gap-space-2xs p-1 rounded-lg bg-surface-container-low w-fit">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-md font-headline-sm text-headline-sm transition-colors ${
                  period === p.key ? 'bg-primary-container text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {isCustom && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface w-fit">
              <span className="material-symbols-outlined text-outline text-[18px]">event</span>
              <input
                type="date"
                aria-label="Start date"
                className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none"
                value={customStart}
                max={customEnd || undefined}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span className="text-on-surface-variant">&rarr;</span>
              <input
                type="date"
                aria-label="End date"
                className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none"
                value={customEnd}
                min={customStart || undefined}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleExportSales}
            disabled={isExportingSales}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors shadow-sm disabled:opacity-60 w-fit"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span className="font-headline-sm text-headline-sm">{isExportingSales ? 'Exporting...' : 'Export Sales CSV'}</span>
          </button>
        </div>

        {isCustom && !customRangeReady && (
          <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-surface-container-low text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">info</span>
            <span className="font-body-sm text-body-sm">Choose both a start and end date to run a custom report.</span>
          </div>
        )}

        {salesReportQuery.isError && (
          <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-body-sm text-body-sm">{getErrorMessage(salesReportQuery.error, 'Could not load the sales report.')}</span>
          </div>
        )}

        <SalesKpiCards report={salesReportQuery.data} isLoading={salesReportQuery.isLoading || (isCustom && !customRangeReady)} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-space-lg">
          <div className="lg:col-span-3">
            <SalesTrendChart
              salesByDay={salesReportQuery.data?.sales_by_day}
              isLoading={salesReportQuery.isLoading || (isCustom && !customRangeReady)}
            />
          </div>
          <div className="lg:col-span-2">
            <TopProductsTable products={salesReportQuery.data?.top_products} isLoading={salesReportQuery.isLoading || (isCustom && !customRangeReady)} />
          </div>
        </div>

        {/* Inventory Report */}
        <div className="flex flex-col gap-space-md pt-space-md border-t border-outline-variant/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex flex-col">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Inventory Report</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Current stock health across the catalog.</p>
            </div>
            <button
              type="button"
              onClick={handleExportInventory}
              disabled={isExportingInventory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors shadow-sm disabled:opacity-60 w-fit"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span className="font-headline-sm text-headline-sm">{isExportingInventory ? 'Exporting...' : 'Export Inventory CSV'}</span>
            </button>
          </div>

          <InventoryReportSection
            report={inventoryReportQuery.data}
            isLoading={inventoryReportQuery.isLoading}
            isError={inventoryReportQuery.isError}
            errorMessage={getErrorMessage(inventoryReportQuery.error, 'Could not load the inventory report.')}
          />
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
