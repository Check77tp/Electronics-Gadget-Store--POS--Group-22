import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { fetchCategories, fetchProducts } from '../api/pos';
import { fetchSuppliers, createProduct, updateProduct, discontinueProduct } from '../api/products';
import ProductsTable from '../components/products/ProductsTable';
import ProductFormModal from '../components/products/ProductFormModal';
import Toast from '../components/pos/Toast';

// Product Catalog Management screen (Increment 2), ported from
// project_management_catalog_code.html. Backend endpoints are documented in
// API_REFERENCE.md; Add/Edit/Discontinue are admin/manager-only server-side
// (require_roles(ADMIN, MANAGER) in routes_products.py) -- hiding those
// controls here for a cashier is purely cosmetic convenience, matching the
// philosophy already stated in API_REFERENCE.md ("a 403 means 'not
// authorized', not 'hide the button and move on'"): a stray direct API call
// still gets a graceful 403 toast, never a crash.

const SEARCH_DEBOUNCE_MS = 300;

export default function ProductsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin', 'manager');
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  const [toast, setToast] = useState(null);
  const [modalState, setModalState] = useState({ open: false, product: null });

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  function showToast(message, icon = 'check_circle') {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 2800);
  }

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });

  const productsQuery = useQuery({
    queryKey: ['products', 'catalog', debouncedSearch, categoryFilter, showDiscontinued],
    queryFn: () =>
      fetchProducts({
        search: debouncedSearch || undefined,
        categoryId: categoryFilter || undefined,
        includeDiscontinued: showDiscontinued,
      }),
  });

  function invalidateProducts() {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-report'] });
  }

  function openAddModal() {
    setModalState({ open: true, product: null });
  }

  function openEditModal(product) {
    setModalState({ open: true, product });
  }

  function closeModal() {
    setModalState({ open: false, product: null });
  }

  async function handleFormSubmit(payload) {
    if (modalState.product) {
      await updateProduct(modalState.product.id, payload);
      showToast(`${payload.name} updated`, 'check_circle');
    } else {
      await createProduct(payload);
      showToast(`${payload.name} added to the catalog`, 'add_circle');
    }
    invalidateProducts();
    closeModal();
  }

  async function handleDiscontinue(product) {
    if (!window.confirm(`Discontinue "${product.name}"? It will no longer be sellable at the POS terminal.`)) return;
    try {
      await discontinueProduct(product.id);
      showToast(`${product.name} discontinued`, 'pause_circle');
      invalidateProducts();
    } catch (err) {
      if (err?.response?.status === 403) {
        showToast('You do not have permission to discontinue products.', 'block');
        return;
      }
      showToast(getErrorMessage(err, 'Could not discontinue this product.'), 'error');
    }
  }

  const products = productsQuery.data || [];
  const categories = categoriesQuery.data || [];
  const suppliers = suppliersQuery.data || [];

  return (
    <div className="flex flex-col w-full relative">
      {/* Top Utility Bar & Filter Panel */}
      <section className="px-space-xl pt-space-lg pb-space-md bg-surface-container-low flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[24px]">devices_other</span>
            </div>
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-md text-headline-md text-on-surface">Product Catalog</span>
                <span className="font-label-code text-label-code px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold">
                  {productsQuery.isLoading ? '...' : `${products.length} SKU${products.length === 1 ? '' : 's'}`}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Manage retail pricing, barcodes, and stock health thresholds.
              </p>
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span className="font-body-md text-body-md font-semibold">+ Add New Product</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm items-center bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
          <div className="md:col-span-5 relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none"
              placeholder="Search by name, SKU, or barcode..."
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <select
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer"
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
          <div className="md:col-span-4 flex items-center justify-end gap-space-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-primary"
                checked={showDiscontinued}
                onChange={(e) => setShowDiscontinued(e.target.checked)}
              />
              <span className="font-body-sm text-body-sm text-on-surface-variant">Show discontinued</span>
            </label>
          </div>
        </div>
      </section>

      <section className="p-space-xl">
        <ProductsTable
          products={products}
          isLoading={productsQuery.isLoading}
          isError={productsQuery.isError}
          errorMessage={getErrorMessage(productsQuery.error, 'Could not load products.')}
          canManage={canManage}
          onEdit={openEditModal}
          onDiscontinue={handleDiscontinue}
        />
      </section>

      {canManage && (
        <ProductFormModal
          open={modalState.open}
          onClose={closeModal}
          product={modalState.product}
          categories={categories}
          suppliers={suppliers}
          onSubmit={handleFormSubmit}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
