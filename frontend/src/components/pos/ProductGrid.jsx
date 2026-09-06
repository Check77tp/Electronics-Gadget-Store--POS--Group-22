// Product search/scan bar, category chips, and catalog grid — ported from
// point_of_sale_terminal_code.html's "LEFT 65% CATALOG & LOOKUP AREA",
// classes kept close to the Stitch export, wired to real data + handlers.

import { formatMoney } from '../../utils/currency';

function StockBadge({ inventory }) {
  if (!inventory) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">
        NO STOCK DATA
      </span>
    );
  }
  if (inventory.is_out_of_stock) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-error-container text-error font-label-badge text-label-badge font-bold">
        OUT OF STOCK
      </span>
    );
  }
  if (inventory.is_below_reorder_level) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-label-badge text-label-badge font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        ONLY {inventory.stock_quantity} LEFT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-label-badge text-label-badge">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      {inventory.stock_quantity} IN STOCK
    </span>
  );
}

function ProductCard({ product, cartQuantity, onAdd }) {
  const outOfStock = product.inventory?.is_out_of_stock;
  const atStockLimit = product.inventory && cartQuantity >= product.inventory.stock_quantity;
  const disabled = outOfStock || atStockLimit;

  return (
    <div
      className={`group relative bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col justify-between transition-all ${
        outOfStock ? 'opacity-80' : 'hover:shadow-md hover:bg-surface-container-low'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-1 mb-2">
          <StockBadge inventory={product.inventory} />
          <span className="font-label-code text-label-code text-outline">{product.sku}</span>
        </div>
        <div className={`relative w-full h-24 rounded-lg overflow-hidden bg-surface-container mb-2.5 flex items-center justify-center ${outOfStock ? 'grayscale opacity-75' : ''}`}>
          {product.image_url ? (
            <img className="w-full h-full object-cover" src={product.image_url} alt={product.name} />
          ) : (
            <span className="material-symbols-outlined text-outline text-[32px]">devices_other</span>
          )}
        </div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1 leading-snug">{product.name}</h3>
        <p className="font-label-code text-label-code text-outline mt-0.5">BC: {product.barcode}</p>
      </div>
      <div className="mt-3 pt-2 flex items-center justify-between bg-surface-container-low/40 p-1.5 rounded-lg">
        <span className="font-label-numeric-md text-label-numeric-md text-on-surface">{formatMoney(product.price)}</span>
        {disabled ? (
          <button
            type="button"
            disabled
            className="h-8 px-3 rounded bg-surface-container text-outline font-body-sm text-body-sm font-semibold cursor-not-allowed"
            title={outOfStock ? 'Out of stock' : 'No more stock available to add'}
          >
            {outOfStock ? 'Sold Out' : 'Max Qty'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(product)}
            className="h-8 px-3 rounded bg-primary text-on-primary font-body-sm text-body-sm font-semibold flex items-center gap-1 hover:bg-primary-container active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span> Add
          </button>
        )}
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-space-sm">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm animate-pulse">
          <div className="h-4 w-16 bg-surface-container rounded mb-2" />
          <div className="h-24 w-full bg-surface-container rounded-lg mb-2.5" />
          <div className="h-4 w-3/4 bg-surface-container rounded mb-1.5" />
          <div className="h-3 w-1/3 bg-surface-container rounded" />
        </div>
      ))}
    </div>
  );
}

export default function ProductGrid({
  searchValue,
  onSearchChange,
  onSearchEnter,
  categories,
  selectedCategoryId,
  onSelectCategory,
  products,
  isLoading,
  isError,
  errorMessage,
  cartQuantities,
  onAddToCart,
}) {
  return (
    <div className="w-full lg:w-[63%] xl:w-[65%] flex flex-col gap-space-md">
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary">
            <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
          </div>
          <input
            autoFocus
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchEnter(searchValue);
            }}
            className="w-full pl-10 pr-24 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-label-numeric-sm text-label-numeric-sm outline-none ring-2 ring-primary/40 focus:ring-primary placeholder:text-outline transition-all"
            placeholder="Scan barcode or search by name / SKU, then press Enter..."
            type="text"
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-1.5 pointer-events-none">
            <kbd className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-label-code text-label-code font-bold shadow-sm">
              ↵ SCAN
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-nowrap scrollbar-none pt-1">
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm transition-colors flex items-center gap-1.5 ${
              selectedCategoryId === null
                ? 'bg-primary text-on-primary font-semibold shadow-sm'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>All Items</span>
            <span className={`px-1.5 py-0.2 rounded font-label-code text-[10px] ${selectedCategoryId === null ? 'bg-on-primary/20' : 'bg-on-surface/10'}`}>
              {categories.reduce((sum, c) => sum + c.count, 0)}
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-body-sm text-body-sm transition-colors flex items-center gap-1.5 ${
                selectedCategoryId === cat.id
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`px-1.5 py-0.2 rounded font-label-code text-[10px] ${selectedCategoryId === cat.id ? 'bg-on-primary/20' : 'bg-on-surface/10'}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-body-sm text-body-sm">{errorMessage}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-14rem)] pr-0.5">
        {isLoading ? (
          <ProductGridSkeleton />
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-space-sm py-16 text-center">
            <span className="material-symbols-outlined text-outline text-[40px]">search_off</span>
            <p className="font-body-md text-body-md text-on-surface-variant">No products match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-space-sm">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cartQuantity={cartQuantities[product.id] || 0}
                onAdd={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
