import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { fetchSalesReport } from '../api/reports';
import { fetchInventoryReport, fetchLowStockProducts } from '../api/products';
import { fetchSales } from '../api/pos';
import DashboardKpiCards from '../components/dashboard/DashboardKpiCards';
import SalesTrendChart from '../components/reports/SalesTrendChart';
import TopProductsTable from '../components/reports/TopProductsTable';
import RecentSalesList from '../components/dashboard/RecentSalesList';
import LowStockAlerts from '../components/dashboard/LowStockAlerts';
import QuickActions from '../components/dashboard/QuickActions';

// Dashboard landing page (bonus/polish increment), ported from
// dashboard_code.html. Wired to live data only -- the Stitch mock's
// hourly-sales chart, drawer-cash, and checkout-velocity metrics have no
// backend equivalent (API_REFERENCE.md) and are dropped rather than
// invented; the "hourly" chart is replaced with a day-by-day sales trend
// reusing SalesTrendChart (same component ReportsPage already renders).
//
// Reports/inventory-report/low-stock are admin/manager only server-side
// (API_REFERENCE.md: "## Reports -- admin/manager only", "meta/low-stock --
// admin/manager only"), so those queries are gated behind hasRole and never
// fire for a cashier -- mirrors the gating already used in
// ReportsPage.jsx / InventoryPage.jsx. A cashier still gets a useful
// landing page: recent transactions (any role, per API_REFERENCE.md) and
// quick actions.

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const canViewManagerWidgets = hasRole('admin', 'manager');

  const dailyReportQuery = useQuery({
    queryKey: ['dashboard-sales-report', 'daily'],
    queryFn: () => fetchSalesReport({ period: 'daily' }),
    enabled: canViewManagerWidgets,
  });

  const weeklyReportQuery = useQuery({
    queryKey: ['dashboard-sales-report', 'weekly'],
    queryFn: () => fetchSalesReport({ period: 'weekly' }),
    enabled: canViewManagerWidgets,
  });

  const inventoryReportQuery = useQuery({
    queryKey: ['inventory-report'],
    queryFn: fetchInventoryReport,
    enabled: canViewManagerWidgets,
  });

  const lowStockQuery = useQuery({
    queryKey: ['low-stock-products'],
    queryFn: fetchLowStockProducts,
    enabled: canViewManagerWidgets,
  });

  const recentSalesQuery = useQuery({
    queryKey: ['sales', 'recent'],
    queryFn: () => fetchSales(),
  });

  const recentSales = (recentSalesQuery.data || []).slice(0, 6);
  const firstName = (user?.full_name || user?.username || '').split(' ')[0];

  return (
    <div className="flex flex-col w-full">
      <div className="px-space-xl py-space-lg flex flex-col gap-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-sm">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[26px]">query_stats</span>
            </div>
            <div>
              <span className="font-headline-md text-headline-md text-on-surface block">
                Welcome back{firstName ? `, ${firstName}` : ''}
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Store operations &amp; performance overview.
              </p>
            </div>
          </div>
        </div>

        {canViewManagerWidgets && (
          <DashboardKpiCards
            salesReport={dailyReportQuery.data}
            inventoryReport={inventoryReportQuery.data}
            isLoading={dailyReportQuery.isLoading || inventoryReportQuery.isLoading}
          />
        )}

        {canViewManagerWidgets && (dailyReportQuery.isError || inventoryReportQuery.isError) && (
          <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-body-sm text-body-sm">
              {getErrorMessage(dailyReportQuery.error || inventoryReportQuery.error, 'Could not load some dashboard metrics.')}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* LEFT COLUMN */}
          <div className="xl:col-span-8 flex flex-col gap-space-lg min-w-0">
            {canViewManagerWidgets && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-space-lg">
                <div className="lg:col-span-3">
                  <SalesTrendChart salesByDay={weeklyReportQuery.data?.sales_by_day} isLoading={weeklyReportQuery.isLoading} />
                </div>
                <div className="lg:col-span-2">
                  <TopProductsTable products={weeklyReportQuery.data?.top_products} isLoading={weeklyReportQuery.isLoading} />
                </div>
              </div>
            )}

            <RecentSalesList
              sales={recentSales}
              isLoading={recentSalesQuery.isLoading}
              isError={recentSalesQuery.isError}
              errorMessage={getErrorMessage(recentSalesQuery.error, 'Could not load recent transactions.')}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="xl:col-span-4 flex flex-col gap-space-lg min-w-0">
            <QuickActions canViewManagerActions={canViewManagerWidgets} />

            {canViewManagerWidgets && (
              <LowStockAlerts
                products={lowStockQuery.data}
                isLoading={lowStockQuery.isLoading}
                isError={lowStockQuery.isError}
                errorMessage={getErrorMessage(lowStockQuery.error, 'Could not load stock alerts.')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
