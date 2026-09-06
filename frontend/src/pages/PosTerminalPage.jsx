import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '../api/client';
import {
  fetchCategories,
  fetchProducts,
  fetchProductByBarcode,
  startSale,
  modifySale,
  cancelSale,
  paySale,
  fetchReceiptText,
} from '../api/pos';
import ProductGrid from '../components/pos/ProductGrid';
import CartPanel from '../components/pos/CartPanel';
import ReceiptModal from '../components/pos/ReceiptModal';
import Toast from '../components/pos/Toast';

// Increment 1's centerpiece screen (claude/README.md Section 8: "Process Sale
// / POS Checkout is the most important screen in the system"). Ported from
// point_of_sale_terminal_code.html, replacing the static demo data + inline
// <script> DOM manipulation with React state and real API calls.
//
// Cart flow: the cashier builds the cart client-side; every change is synced
// to the backend (POST /api/sales to open a PENDING sale, then PUT
// /api/sales/{id} on every further change) and the subtotal/tax/total shown
// in the totals panel always come back from that response -- never computed
// and trusted purely client-side, per API_REFERENCE.md and the business
// rules in claude/README.md Section 11.

const SYNC_DEBOUNCE_MS = 450;
const SEARCH_DEBOUNCE_MS = 300;

export default function PosTerminalPage() {
  const queryClient = useQueryClient();

  // ---- Catalog browsing state ----
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  function showToast(message, icon = 'check_circle') {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 2600);
  }

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  // Unfiltered product list, used only to compute per-category counts for the
  // chip row (the /meta/categories endpoint itself carries no counts).
  const allProductsQuery = useQuery({ queryKey: ['products', 'all'], queryFn: () => fetchProducts() });

  const gridProductsQuery = useQuery({
    queryKey: ['products', 'grid', debouncedSearch, selectedCategoryId],
    queryFn: () => fetchProducts({ search: debouncedSearch || undefined, categoryId: selectedCategoryId || undefined }),
  });

  const categoriesWithCounts = useMemo(() => {
    const categories = categoriesQuery.data || [];
    const products = allProductsQuery.data || [];
    return categories.map((cat) => ({
      ...cat,
      count: products.filter((p) => p.category?.id === cat.id).length,
    }));
  }, [categoriesQuery.data, allProductsQuery.data]);

  function invalidateProductQueries() {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }

  // ---- Cart state ----
  // cart: [{ product: ProductRead, quantity: number }]
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [saleData, setSaleData] = useState(null); // last authoritative SaleRead
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  // Mirrors saleData?.id, but as a ref so async closures (debounced sync,
  // handlePay) always read the latest value instead of one captured at the
  // time the closure was created.
  const saleIdRef = useRef(null);

  function setSaleIdBoth(id) {
    saleIdRef.current = id;
  }

  const cartQuantities = useMemo(() => {
    const map = {};
    cart.forEach((item) => {
      map[item.product.id] = item.quantity;
    });
    return map;
  }, [cart]);

  // Pushes the current cart to the backend and returns the resulting SaleRead
  // (or null if the cart is empty). Throws on failure after recording the
  // error in syncError so callers can decide whether to also surface it
  // themselves (e.g. blocking a payment attempt).
  async function syncCart(currentCart, currentDiscount) {
    if (currentCart.length === 0) {
      if (saleIdRef.current) {
        try {
          await cancelSale(saleIdRef.current);
        } catch {
          // best-effort: an already-completed/cancelled sale is fine to ignore here
        }
      }
      setSaleIdBoth(null);
      setSaleData(null);
      setSyncError(null);
      return null;
    }

    setIsSyncing(true);
    const items = currentCart.map((item) => ({ product_id: item.product.id, quantity: item.quantity, discount: 0 }));
    try {
      let result;
      if (saleIdRef.current) {
        result = await modifySale(saleIdRef.current, { items, discountAmount: currentDiscount });
      } else {
        result = await startSale({ items, discountAmount: currentDiscount });
        setSaleIdBoth(result.id);
      }
      setSaleData(result);
      setSyncError(null);
      return result;
    } catch (err) {
      const message = getErrorMessage(err, 'Could not update the cart totals.');
      setSyncError(message);
      if (err?.response?.status === 404) {
        // The pending sale vanished server-side; force a fresh one next sync.
        setSaleIdBoth(null);
        setSaleData(null);
      }
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }

  // Debounced sync on every cart/discount change.
  useEffect(() => {
    const handle = setTimeout(() => {
      syncCart(cart, discountAmount).catch(() => {
        /* surfaced via syncError state */
      });
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, discountAmount]);

  function addToCart(product) {
    if (product.inventory?.is_out_of_stock) {
      showToast(`${product.name} is out of stock`, 'block');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (product.inventory && existing.quantity >= product.inventory.stock_quantity) {
          showToast(`Only ${product.inventory.stock_quantity} of ${product.name} in stock`, 'warning');
          return prev;
        }
        return prev.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to cart`, 'add_shopping_cart');
  }

  function incrementItem(productId) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        if (item.product.inventory && item.quantity >= item.product.inventory.stock_quantity) return item;
        return { ...item, quantity: item.quantity + 1 };
      })
    );
  }

  function decrementItem(productId) {
    setCart((prev) =>
      prev
        .map((item) => (item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from transaction', 'delete');
  }

  function clearCart() {
    if (cart.length === 0) return;
    if (!window.confirm('Clear all line items in this order?')) return;
    setCart([]);
    setDiscountAmount(0);
    showToast('Cart cleared', 'remove_shopping_cart');
  }

  // Barcode scan / exact-match Enter handling on the search input.
  async function handleSearchEnter(value) {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      const product = await fetchProductByBarcode(trimmed);
      addToCart(product);
      setSearchInput('');
    } catch (err) {
      if (err?.response?.status !== 404) {
        showToast(getErrorMessage(err, 'Barcode lookup failed'), 'error');
      }
      // 404 just means it wasn't an exact barcode match -- the text search
      // above the grid already filters on the same value, so no-op here.
    }
  }

  // ---- Payment state ----
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    // Keep the tendered amount defaulted to the current total whenever it
    // changes and the cashier hasn't started typing a custom figure.
    if (saleData && !tenderedAmount) {
      setTenderedAmount(saleData.total_amount.toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleData?.total_amount]);

  // ---- Completed sale / receipt state ----
  const [completedSale, setCompletedSale] = useState(null);
  const [receiptText, setReceiptText] = useState('');
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  async function handlePay() {
    setPayError(null);

    if (cart.length === 0) {
      setPayError('Cart is empty. Add at least one product before completing the sale.');
      return;
    }
    if (paymentMethod === 'cash') {
      const tendered = parseFloat(tenderedAmount) || 0;
      if (saleData && tendered < saleData.total_amount) {
        setPayError('Tendered cash amount is less than the total due.');
        return;
      }
    }

    setIsPaying(true);
    try {
      // Make sure the backend has the latest cart/discount before charging it.
      const freshSale = await syncCart(cart, discountAmount);
      if (!freshSale) {
        setPayError('Cart is empty. Add at least one product before completing the sale.');
        return;
      }

      const result = await paySale(freshSale.id, {
        paymentMethod,
        tenderedAmount: paymentMethod === 'cash' ? parseFloat(tenderedAmount) || 0 : undefined,
      });

      setCompletedSale(result);
      invalidateProductQueries();

      setIsLoadingReceipt(true);
      try {
        const text = await fetchReceiptText(result.id);
        setReceiptText(text);
      } catch (receiptErr) {
        setReceiptText('Receipt could not be loaded: ' + getErrorMessage(receiptErr));
      } finally {
        setIsLoadingReceipt(false);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setPayError(getErrorMessage(err, 'Stock changed underneath this cart. Please review the cart and try again.'));
        invalidateProductQueries();
      } else if (status === 402) {
        setPayError(getErrorMessage(err, 'Payment was declined. Try another payment method.'));
      } else if (status === 400) {
        setPayError(getErrorMessage(err, 'This sale could not be completed.'));
      } else {
        setPayError(getErrorMessage(err));
      }
    } finally {
      setIsPaying(false);
    }
  }

  function startNewSale() {
    setCart([]);
    setDiscountAmount(0);
    setSaleIdBoth(null);
    setSaleData(null);
    setSyncError(null);
    setPaymentMethod('cash');
    setTenderedAmount('');
    setPayError(null);
    setCompletedSale(null);
    setReceiptText('');
  }

  const catalogError = gridProductsQuery.isError;

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col lg:flex-row gap-space-md p-space-md w-full max-w-[1920px] mx-auto min-h-[calc(100vh-4rem)]">
        <ProductGrid
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchEnter={handleSearchEnter}
          categories={categoriesWithCounts}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          products={gridProductsQuery.data || []}
          isLoading={gridProductsQuery.isLoading}
          isError={catalogError}
          errorMessage={getErrorMessage(gridProductsQuery.error, 'Could not load products.')}
          cartQuantities={cartQuantities}
          onAddToCart={addToCart}
        />
        <CartPanel
          cart={cart}
          onIncrement={incrementItem}
          onDecrement={decrementItem}
          onRemove={removeItem}
          onClear={clearCart}
          discountAmount={discountAmount}
          onDiscountChange={(v) => setDiscountAmount(v === '' ? 0 : parseFloat(v) || 0)}
          saleData={saleData}
          isSyncing={isSyncing}
          syncError={syncError}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          tenderedAmount={tenderedAmount}
          onTenderedChange={setTenderedAmount}
          onQuickCash={(amount) => setTenderedAmount(amount.toFixed(2))}
          onPay={handlePay}
          isPaying={isPaying}
          payError={payError}
        />
      </div>

      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          receiptText={receiptText}
          isLoadingReceipt={isLoadingReceipt}
          onNewSale={startNewSale}
          onClose={() => setCompletedSale(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
