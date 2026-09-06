// Shared stock-status pill used by both ProductsPage and InventoryPage so the
// "in stock / low stock / out of stock / discontinued" derivation logic
// (claude/README.md Section 11 business rules: inventory.is_below_reorder_level
// / is_out_of_stock, product.is_discontinued) lives in exactly one place.
export function deriveStockStatus(product) {
  if (product.is_discontinued) return 'discontinued';
  if (!product.inventory) return 'unknown';
  if (product.inventory.is_out_of_stock) return 'out_of_stock';
  if (product.inventory.is_below_reorder_level) return 'low_stock';
  return 'in_stock';
}

const STYLES = {
  in_stock: 'bg-emerald-50 text-emerald-700',
  low_stock: 'bg-amber-50 text-amber-800',
  out_of_stock: 'bg-error-container text-on-error-container',
  discontinued: 'bg-surface-container text-on-surface-variant',
  unknown: 'bg-surface-container text-on-surface-variant',
};

const DOT_STYLES = {
  in_stock: 'bg-emerald-500',
  low_stock: 'bg-amber-500',
  out_of_stock: 'bg-error',
  discontinued: 'bg-outline',
  unknown: 'bg-outline',
};

function labelFor(status, product) {
  switch (status) {
    case 'in_stock':
      return 'IN STOCK';
    case 'low_stock':
      return `LOW STOCK (${product.inventory?.stock_quantity ?? '?'})`;
    case 'out_of_stock':
      return 'OUT OF STOCK';
    case 'discontinued':
      return 'DISCONTINUED';
    default:
      return 'NO STOCK DATA';
  }
}

export default function StockStatusBadge({ product }) {
  const status = deriveStockStatus(product);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-badge text-label-badge ${STYLES[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_STYLES[status]}`}></span>
      {labelFor(status, product)}
    </span>
  );
}
