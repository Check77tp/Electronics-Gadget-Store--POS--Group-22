// Cart drawer + checkout terminal — ported from point_of_sale_terminal_code.html's
// "RIGHT 35% ACTIVE CART & CHECKOUT TERMINAL", classes kept close to the
// Stitch export. All totals shown here (subtotal/tax/total) come from
// `saleData`, the backend's authoritative SaleRead — never computed and
// trusted purely client-side (per claude/README.md Section 11 / the spec).

const PAYMENT_TABS = [
  { id: 'cash', label: 'Cash', icon: 'payments' },
  { id: 'card', label: 'Card', icon: 'credit_card' },
  { id: 'mobile_money', label: 'Mobile Money', icon: 'contactless' },
];

function CartRow({ item, onIncrement, onDecrement, onRemove }) {
  const { product, quantity } = item;
  const lineTotal = product.price * quantity;
  const atStockLimit = product.inventory && quantity >= product.inventory.stock_quantity;

  return (
    <div className="p-2 rounded-lg bg-surface hover:bg-surface-container transition-colors flex items-center justify-between gap-2">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-body-sm text-body-sm font-semibold text-on-surface truncate">{product.name}</span>
        <span className="font-label-code text-label-code text-outline">
          ${product.price.toFixed(2)} ea &middot; SKU: {product.sku}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onDecrement(product.id)}
          className="w-7 h-7 rounded bg-surface-container text-on-surface flex items-center justify-center font-bold hover:bg-surface-container-high active:scale-95"
        >
          -
        </button>
        <span className="font-label-numeric-sm text-label-numeric-sm font-bold w-6 text-center">{quantity}</span>
        <button
          type="button"
          onClick={() => onIncrement(product.id)}
          disabled={atStockLimit}
          title={atStockLimit ? 'No more stock available' : undefined}
          className="w-7 h-7 rounded bg-surface-container text-on-surface flex items-center justify-center font-bold hover:bg-surface-container-high active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-label-numeric-sm text-label-numeric-sm font-bold text-on-surface w-16 text-right">
          ${lineTotal.toFixed(2)}
        </span>
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          className="text-outline hover:text-error transition-colors p-1"
          title="Remove Item"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
}

export default function CartPanel({
  cart,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  discountAmount,
  onDiscountChange,
  saleData,
  isSyncing,
  syncError,
  paymentMethod,
  onPaymentMethodChange,
  tenderedAmount,
  onTenderedChange,
  onQuickCash,
  onPay,
  isPaying,
  payError,
}) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = saleData?.subtotal ?? 0;
  const tax = saleData?.tax_amount ?? 0;
  const discount = saleData?.discount_amount ?? 0;
  const total = saleData?.total_amount ?? 0;
  const tenderedNum = parseFloat(tenderedAmount) || 0;
  const estimatedChange = paymentMethod === 'cash' ? Math.max(0, tenderedNum - total) : 0;
  const shortfall = paymentMethod === 'cash' ? Math.max(0, total - tenderedNum) : 0;

  const cartReady = cart.length > 0 && Boolean(saleData) && !isSyncing;
  const cashInsufficient = paymentMethod === 'cash' && (parseFloat(tenderedAmount) || 0) < total;
  const payDisabled = !cartReady || isPaying || cashInsufficient;

  return (
    <div className="w-full lg:w-[37%] xl:w-[35%] flex flex-col bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
      <div className="p-space-md bg-surface-container-low flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">shopping_cart_checkout</span>
            <span className="font-label-numeric-sm text-label-numeric-sm font-bold text-on-surface">
              {saleData ? `#${saleData.sale_number}` : 'New Sale'}
            </span>
          </div>
          <span className="font-label-code text-label-code px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
            {isSyncing ? 'SYNCING...' : 'READY'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-space-xs max-h-[300px] xl:max-h-[320px]">
        {cart.length === 0 ? (
          <div className="py-12 text-center text-outline font-body-md">Cart is empty. Scan items or select from catalog.</div>
        ) : (
          cart.map((item) => (
            <CartRow key={item.product.id} item={item} onIncrement={onIncrement} onDecrement={onDecrement} onRemove={onRemove} />
          ))
        )}
      </div>

      <div className="px-space-md py-1.5 bg-surface-container-low flex items-center justify-between">
        <button
          type="button"
          onClick={onClear}
          disabled={cart.length === 0}
          className="text-error hover:underline font-body-sm text-body-sm flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
        >
          <span className="material-symbols-outlined text-[16px]">remove_shopping_cart</span> Clear Cart
        </button>
        <label className="flex items-center gap-1 font-body-sm text-body-sm text-primary">
          <span className="material-symbols-outlined text-[16px]">sell</span> Discount $
          <input
            type="number"
            min="0"
            step="0.01"
            value={discountAmount}
            onChange={(e) => onDiscountChange(e.target.value)}
            className="w-16 px-1 py-0.5 rounded border border-outline-variant bg-surface-container-lowest text-on-surface font-label-numeric-sm text-label-numeric-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
      </div>

      {syncError && (
        <div className="mx-space-md mb-space-xs flex items-start gap-space-xs p-space-sm rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
          <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
          <span className="font-body-sm text-body-sm">{syncError}</span>
        </div>
      )}

      <div className="p-space-md bg-surface-container/30 flex flex-col gap-1.5 shadow-inner">
        <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm">
          <span>Subtotal ({itemCount} item{itemCount === 1 ? '' : 's'})</span>
          <span className="font-label-numeric-sm text-label-numeric-sm font-semibold text-on-surface">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-emerald-700 font-body-sm text-body-sm">
          <span>Discount</span>
          <span className="font-label-numeric-sm text-label-numeric-sm font-semibold">-${discount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm">
          <span>Est. Sales Tax (8.25%)</span>
          <span className="font-label-numeric-sm text-label-numeric-sm font-semibold text-on-surface">${tax.toFixed(2)}</span>
        </div>
        <div className="mt-2 p-2.5 rounded-lg bg-primary-container text-on-primary flex items-center justify-between shadow-md">
          <div className="flex flex-col">
            <span className="font-label-code text-label-code text-on-primary-container uppercase font-semibold">Total Amount Due</span>
            <span className="font-body-sm text-body-sm opacity-90">USD Currency</span>
          </div>
          <span className="font-label-numeric-lg text-label-numeric-lg font-bold tracking-tight">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="p-space-md flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-surface-container">
          {PAYMENT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onPaymentMethodChange(tab.id)}
              className={`py-1.5 px-2 rounded font-body-sm text-body-sm font-semibold flex items-center justify-center gap-1 transition-colors ${
                paymentMethod === tab.id
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {paymentMethod === 'cash' && (
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => onQuickCash(total)}
                className="py-1.5 rounded-lg bg-surface-container text-on-surface font-label-numeric-sm text-label-numeric-sm font-semibold hover:bg-surface-container-high transition-colors"
              >
                Exact
              </button>
              {[10, 20, 50].map((bump) => (
                <button
                  key={bump}
                  type="button"
                  onClick={() => onQuickCash(Math.ceil((total + bump) / 10) * 10)}
                  className="py-1.5 rounded-lg bg-surface-container text-on-surface font-label-numeric-sm text-label-numeric-sm font-semibold hover:bg-surface-container-high transition-colors"
                >
                  +${bump}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-surface-container-low flex flex-col justify-center">
                <label className="font-label-code text-label-code text-outline uppercase font-semibold">Tendered</label>
                <div className="flex items-center mt-0.5">
                  <span className="font-label-numeric-md text-label-numeric-md text-on-surface mr-1">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tenderedAmount}
                    onChange={(e) => onTenderedChange(e.target.value)}
                    className="w-full bg-transparent font-label-numeric-md text-label-numeric-md font-bold text-on-surface outline-none"
                  />
                </div>
              </div>
              <div className={`p-2 rounded-lg flex flex-col justify-center shadow-sm ${cashInsufficient ? 'bg-error text-on-error' : 'bg-emerald-600 text-white'}`}>
                <span className="font-label-code text-label-code uppercase tracking-wider opacity-90 font-bold">
                  {cashInsufficient ? 'Amount Short' : 'Change (est.)'}
                </span>
                <span className="font-label-numeric-lg text-label-numeric-lg font-bold leading-tight">
                  ${cashInsufficient ? shortfall.toFixed(2) : estimatedChange.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {payError && (
          <div className="flex items-start gap-space-xs p-space-sm rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
            <span className="material-symbols-outlined text-[18px] shrink-0">warning</span>
            <span className="font-body-sm text-body-sm">{payError}</span>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={onPay}
            disabled={payDisabled}
            className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isPaying ? (
              <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
            )}
            <span>{isPaying ? 'Processing...' : 'Complete Sale & Print Receipt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
