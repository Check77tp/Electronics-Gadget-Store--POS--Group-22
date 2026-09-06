import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { fetchCategories, fetchProducts } from '../api/pos';
import { adjustStock, fetchInventoryReport, downloadInventoryCsv } from '../api/products';
import { deriveStockStatus } from '../components/common/StockStatusBadge';
import InventoryKpiCards from '../components/inventory/InventoryKpiCards';
import InventoryTable from '../components/inventory/InventoryTable';
import StockAdjustModal from '../components/inventory/StockAdjustModal';
import Toast from '../components/pos/Toast';

// Inventory & Stock Management screen (Increment 2), ported from
// inventory_stock_management_code.html. KPI cards come from
// GET /api/reports/inventory rather than being recomputed client-side; the
// stock-status filter is computed client-side from the embedded
// `inventory` flags on GET /api/products, since that endpoint has no
// stock-status query param of its own (API_REFERENCE.md).
//
// Adjust ± and Export CSV are admin/manager only server-side; a cashier
// gets a read-only table here rather than being routed away entirely.

const STATUS_FILTERS = [
  { key: 'all', label: 'Stock: Any Status' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'low_stock', label: 'Low Stock' },
  { key: 'out_of_stock', label: 'Out of Stock' },
];

export default function InventoryPage() {
  const { hasRole } = useAuth();
  const canAdjust = hasRole('admin', 'manager');
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  function showToast(message, icon = 'check_circle') {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 2800);
  }

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const productsQuery = useQuery({
    queryKey: ['products', 'inventory', categoryFilter],
    queryFn: () => fetchProducts({ categoryId: categoryFilter || undefined }),
  });
  const reportQuery = useQuery({ queryKey: ['inventory-report'], queryFn: fetchInventoryReport });

  const filteredProducts = useMemo(() => {
    const products = productsQuery.data || [];
    if (statusFilter === 'all') return products;
    return products.filter((p) => deriveStockStatus(p) === statusFilter);
  }, [productsQuery.data, statusFilter]);

  function invalidateInventory() {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-report'] });
  }

  async function handleAdjustSubmit(payload) {
    const result = await adjustStock(adjustTarget.id, payload);
    showToast(`${adjustTarget.name} now at ${result.stock_quantity} units`, 'check_circle');
    invalidateInventory();
    setAdjustTarget(null);
  }

  async function handleExport() {
    setIsExporting(true);
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
      setIsExporting(false);
    }
  }

  const categories = categoriesQuery.data || [];

  return (
    <div className="flex flex-col w-full">
      <div className="px-space-xl py-space-lg flex flex-col gap-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col">
            <h1 className="font-display-lg text-display-lg tracking-tight text-on-surface">Inventory Management</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">
              Live stock levels, reorder thresholds, and reconciliation ledger.
            </p>
          </div>
          {canAdjust && (
            <div className="flex items-center flex-wrap gap-space-sm">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors shadow-sm disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                <span className="font-headline-sm text-headline-sm">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </button>
            </div>
          )}
        </div>

        <InventoryKpiCards report={reportQuery.data} isLoading={reportQuery.isLoading} />

        {reportQuery.isError && (
          <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-body-sm text-body-sm">{getErrorMessage(reportQuery.error, 'Could not load inventory KPIs.')}</span>
          </div>
        )}

        {/* Filters */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
            <div className="flex items-center flex-wrap gap-space-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface">
                <span className="material-symbols-outlined text-outline text-[18px]">category</span>
                <select
                  className="bg-transparent font-headline-sm text-headline-sm text-on-surface focus:outline-none cursor-pointer"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
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
            </div>
            <span className="font-label-code text-label-code text-on-surface-variant">
              SHOWING: <strong className="text-on-surface font-label-numeric-sm">{filteredProducts.length}</strong> SKUs
            </span>
          </div>
        </div>

        <InventoryTable
          products={filteredProducts}
          isLoading={productsQuery.isLoading}
          isError={productsQuery.isError}
          errorMessage={getErrorMessage(productsQuery.error, 'Could not load inventory.')}
          canAdjust={canAdjust}
          onAdjust={setAdjustTarget}
        />
      </div>

      {canAdjust && (
        <StockAdjustModal
          open={Boolean(adjustTarget)}
          onClose={() => setAdjustTarget(null)}
          product={adjustTarget}
          onSubmit={handleAdjustSubmit}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
