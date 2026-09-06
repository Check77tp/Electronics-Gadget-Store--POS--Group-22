import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { getErrorMessage } from '../../api/client';
import { formatMoney } from '../../utils/currency';

// Add/Edit Product modal, ported from project_management_catalog_code.html's
// "#productModal" (tabbed Basic Info / Pricing & Inventory / Supplier form).
// The Stitch export's tabs were visual-only (all fields sat in one static
// column); here they're real, and the field set is trimmed to exactly what
// ProductCreateRequest / ProductUpdateRequest accept (API_REFERENCE.md) --
// no invented fields like tax tier or POS quick-add toggle.
//
// `product` is null for Add, or a ProductRead for Edit. Create sends the
// full ProductCreateRequest shape (incl. initial_stock/reorder_level/
// bin_location); Edit sends ProductUpdateRequest, which has no stock/
// reorder/bin fields at all -- those are shown read-only with a note
// pointing at the Inventory page's Adjust action instead.

const TABS = [
  { key: 'basic', label: 'Basic Info', icon: 'info' },
  { key: 'pricing', label: 'Pricing & Inventory', icon: 'payments' },
  { key: 'supplier', label: 'Supplier', icon: 'local_shipping' },
];

function emptyForm() {
  return {
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    brand: '',
    description: '',
    cost_price: '',
    price: '',
    initial_stock: '0',
    reorder_level: '5',
    bin_location: '',
    supplier_id: '',
    image_url: '',
  };
}

function formFromProduct(product) {
  return {
    name: product.name || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    category_id: product.category?.id ?? '',
    brand: product.brand || '',
    description: product.description || '',
    cost_price: product.cost_price != null ? String(product.cost_price) : '',
    price: product.price != null ? String(product.price) : '',
    initial_stock: product.inventory ? String(product.inventory.stock_quantity) : '0',
    reorder_level: product.inventory ? String(product.inventory.reorder_level) : '5',
    bin_location: product.inventory?.bin_location || '',
    supplier_id: product.supplier?.id ?? '',
    image_url: product.image_url || '',
  };
}

export default function ProductFormModal({ open, onClose, product, categories, suppliers, onSubmit }) {
  const isEdit = Boolean(product);
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(product ? formFromProduct(product) : emptyForm());
      setFieldErrors({});
      setSubmitError(null);
      setActiveTab('basic');
    }
  }, [open, product]);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  const costNum = parseFloat(form.cost_price);
  const priceNum = parseFloat(form.price);
  const hasMargin = !Number.isNaN(costNum) && !Number.isNaN(priceNum) && priceNum > 0;
  const marginPct = hasMargin ? ((priceNum - costNum) / priceNum) * 100 : null;
  const marginProfit = hasMargin ? priceNum - costNum : null;

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Product name is required.';
    if (!form.sku.trim()) errors.sku = 'SKU is required.';
    if (!form.barcode.trim()) errors.barcode = 'Barcode is required.';
    if (!form.price.trim() || Number.isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
      errors.price = 'A valid selling price is required.';
    }
    if (form.cost_price.trim() && Number.isNaN(parseFloat(form.cost_price))) {
      errors.cost_price = 'Cost price must be a number.';
    }
    return errors;
  }

  function firstTabWithError(errors) {
    if (errors.name || errors.sku || errors.barcode) return 'basic';
    if (errors.price || errors.cost_price) return 'pricing';
    return 'basic';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setActiveTab(firstTabWithError(errors));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await onSubmit({
          sku: form.sku.trim(),
          barcode: form.barcode.trim(),
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          description: form.description.trim() || null,
          cost_price: form.cost_price.trim() ? parseFloat(form.cost_price) : 0,
          price: parseFloat(form.price),
          image_url: form.image_url.trim() || null,
          category_id: form.category_id === '' ? null : Number(form.category_id),
          supplier_id: form.supplier_id === '' ? null : Number(form.supplier_id),
        });
      } else {
        await onSubmit({
          sku: form.sku.trim(),
          barcode: form.barcode.trim(),
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          description: form.description.trim() || null,
          cost_price: form.cost_price.trim() ? parseFloat(form.cost_price) : 0,
          price: parseFloat(form.price),
          image_url: form.image_url.trim() || null,
          category_id: form.category_id === '' ? null : Number(form.category_id),
          supplier_id: form.supplier_id === '' ? null : Number(form.supplier_id),
          initial_stock: form.initial_stock.trim() ? parseInt(form.initial_stock, 10) : 0,
          reorder_level: form.reorder_level.trim() ? parseInt(form.reorder_level, 10) : 5,
          bin_location: form.bin_location.trim() || null,
        });
      }
      // onSubmit resolving means the caller already closed the modal on success.
    } catch (err) {
      const message = getErrorMessage(err, 'Could not save this product.');
      // Surface duplicate SKU/barcode (400) inline near the relevant fields too.
      if (/barcode/i.test(message) && /sku/i.test(message)) {
        setFieldErrors((prev) => ({ ...prev, sku: message, barcode: message }));
        setActiveTab('basic');
      }
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputBase =
    'w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none';
  const labelBase = 'font-headline-sm text-headline-sm font-semibold text-on-surface';

  return (
    <Modal open={open} onClose={onClose} maxWidthClassName="max-w-3xl">
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-space-xl py-space-md bg-surface-container-low flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[22px]">{isEdit ? 'edit_note' : 'add_box'}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-headline-md text-headline-md font-semibold text-on-surface truncate">
                  {isEdit ? 'Edit Product' : 'Add New Product'}
                </span>
                {isEdit && (
                  <span className="font-label-code text-label-code px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold">
                    SKU {product.sku}
                  </span>
                )}
              </div>
              {isEdit && <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{product.name}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-space-xl bg-surface-container-lowest flex items-center gap-space-sm border-b border-surface-container">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-3 px-3 font-headline-sm text-headline-sm border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-primary border-primary'
                  : 'text-on-surface-variant hover:text-on-surface border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-space-xl overflow-y-auto flex-1 space-y-space-lg">
          {submitError && (
            <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="font-body-sm text-body-sm">{submitError}</span>
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="flex flex-col gap-space-lg">
              <div className="flex flex-col gap-1.5">
                <label className={labelBase}>
                  Product Name <span className="text-error">*</span>
                </label>
                <input
                  className={inputBase}
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Logitech MX Master 3S Wireless Mouse - Graphite"
                />
                {fieldErrors.name && <span className="font-body-sm text-body-sm text-error">{fieldErrors.name}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-1.5">
                  <label className={labelBase}>
                    SKU <span className="text-error">*</span>
                  </label>
                  <input
                    className={`${inputBase} font-label-code text-label-code uppercase tracking-wider`}
                    type="text"
                    value={form.sku}
                    onChange={(e) => setField('sku', e.target.value)}
                    placeholder="ACC-LOG-MX3S-GR"
                  />
                  {fieldErrors.sku && <span className="font-body-sm text-body-sm text-error">{fieldErrors.sku}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelBase}>
                    Barcode / UPC <span className="text-error">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">barcode</span>
                    <input
                      className={`${inputBase} pl-10 font-label-code text-label-code`}
                      type="text"
                      value={form.barcode}
                      onChange={(e) => setField('barcode', e.target.value)}
                      placeholder="097855175297"
                    />
                  </div>
                  {fieldErrors.barcode && <span className="font-body-sm text-body-sm text-error">{fieldErrors.barcode}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-1.5">
                  <label className={labelBase}>Category</label>
                  <select
                    className={`${inputBase} cursor-pointer`}
                    value={form.category_id}
                    onChange={(e) => setField('category_id', e.target.value)}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelBase}>Brand / Manufacturer</label>
                  <input
                    className={inputBase}
                    type="text"
                    value={form.brand}
                    onChange={(e) => setField('brand', e.target.value)}
                    placeholder="Logitech"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelBase}>Description</label>
                <textarea
                  className={`${inputBase} resize-none`}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Shown on receipts and the POS catalog grid."
                />
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
              <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col gap-space-md shadow-sm">
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">calculate</span>
                  Financials & Margin
                </span>
                <div className="grid grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className={labelBase}>Cost Price (K)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-label-numeric-sm text-on-surface-variant">K</span>
                      <input
                        className="w-full pl-7 pr-3 py-2 rounded-lg bg-surface-container-lowest font-label-numeric-md text-label-numeric-md font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.cost_price}
                        onChange={(e) => setField('cost_price', e.target.value)}
                      />
                    </div>
                    {fieldErrors.cost_price && <span className="font-body-sm text-body-sm text-error">{fieldErrors.cost_price}</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelBase}>
                      Selling Price (K) <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-label-numeric-sm text-on-surface-variant">K</span>
                      <input
                        className="w-full pl-7 pr-3 py-2 rounded-lg bg-surface-container-lowest font-label-numeric-md text-label-numeric-md font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => setField('price', e.target.value)}
                      />
                    </div>
                    {fieldErrors.price && <span className="font-body-sm text-body-sm text-error">{fieldErrors.price}</span>}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-lowest flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-label-code text-[11px] uppercase text-on-surface-variant block">Gross Profit</span>
                    <span className={`font-label-numeric-sm text-label-numeric-sm font-bold ${hasMargin && marginProfit >= 0 ? 'text-emerald-600' : 'text-error'}`}>
                      {hasMargin ? `${marginProfit >= 0 ? '+' : ''}${formatMoney(marginProfit)} / unit` : '--'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-label-code text-[11px] uppercase text-on-surface-variant block">Margin %</span>
                    <span className={`font-label-numeric-lg text-label-numeric-lg font-bold ${hasMargin && marginPct >= 0 ? 'text-emerald-700' : 'text-error'}`}>
                      {hasMargin ? `${marginPct.toFixed(1)}%` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col gap-space-md shadow-sm">
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">warehouse</span>
                  Stock & Shelf Tracking
                </span>
                {isEdit ? (
                  <>
                    <div className="grid grid-cols-2 gap-space-md">
                      <div className="flex flex-col gap-1">
                        <label className={labelBase}>Current Stock</label>
                        <input
                          className="w-full px-3 py-2 rounded-lg bg-surface-container font-label-numeric-md text-label-numeric-md font-bold text-on-surface-variant outline-none"
                          type="text"
                          value={product.inventory ? product.inventory.stock_quantity : 'n/a'}
                          disabled
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelBase}>Reorder Alert At</label>
                        <input
                          className="w-full px-3 py-2 rounded-lg bg-surface-container font-label-numeric-md text-label-numeric-md font-semibold text-on-surface-variant outline-none"
                          type="text"
                          value={product.inventory ? product.inventory.reorder_level : 'n/a'}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelBase}>Store Location / Bin</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg bg-surface-container font-label-code text-label-code font-medium text-on-surface-variant outline-none"
                        type="text"
                        value={product.inventory?.bin_location || 'n/a'}
                        disabled
                      />
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      Stock quantity, reorder level and bin location are managed from the Inventory page's Adjust action.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-space-md">
                      <div className="flex flex-col gap-1">
                        <label className={labelBase}>Initial Stock</label>
                        <input
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest font-label-numeric-md text-label-numeric-md font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                          type="number"
                          min="0"
                          value={form.initial_stock}
                          onChange={(e) => setField('initial_stock', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelBase}>Reorder Alert At</label>
                        <input
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest font-label-numeric-md text-label-numeric-md font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary"
                          type="number"
                          min="0"
                          value={form.reorder_level}
                          onChange={(e) => setField('reorder_level', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelBase}>Store Location / Bin</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">shelves</span>
                        <input
                          className="w-full pl-10 pr-3 py-2 rounded-lg bg-surface-container-lowest font-label-code text-label-code font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary"
                          type="text"
                          value={form.bin_location}
                          onChange={(e) => setField('bin_location', e.target.value)}
                          placeholder="Aisle 3 - Bin C-12"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'supplier' && (
            <div className="flex flex-col gap-space-lg max-w-md">
              <div className="flex flex-col gap-1.5">
                <label className={labelBase}>Supplier</label>
                <select
                  className={`${inputBase} cursor-pointer`}
                  value={form.supplier_id}
                  onChange={(e) => setField('supplier_id', e.target.value)}
                >
                  <option value="">No supplier assigned</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelBase}>Image URL</label>
                <input
                  className={inputBase}
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setField('image_url', e.target.value)}
                  placeholder="https://... (optional)"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-space-xl py-space-md bg-surface-container-low flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[18px] text-primary">info</span>
            <span>Fields marked * are required</span>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container shadow-xs font-body-sm text-body-sm font-semibold transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary shadow-md font-headline-sm text-headline-sm font-semibold transition-all disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">{isSubmitting ? 'sync' : 'save'}</span>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Save & Publish Product'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
