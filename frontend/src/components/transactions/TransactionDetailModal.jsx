import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '../common/Modal';
import ReceiptModal from '../pos/ReceiptModal';
import { getErrorMessage } from '../../api/client';
import { fetchSaleDetail, fetchReceiptText } from '../../api/pos';
import { formatMoney } from '../../utils/currency';

// Transaction Detail view (Increment 3), opened from a TransactionsTable row.
// Re-fetches GET /api/sales/{id} (rather than trusting the row already held
// by the list) so this always reflects the authoritative SaleRead, per
// API_REFERENCE.md's "GET /api/sales/{id} -- Transaction Detail view".
// "View Receipt" reuses ReceiptModal + fetchReceiptText from Increment 1's
// POS Terminal instead of re-implementing the receipt fetch.

const STATUS_STYLES = {
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-800',
  cancelled: 'bg-surface-container text-on-surface-variant',
};

function formatDateTime(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TransactionDetailModal({ saleId, onClose }) {
  const [receiptText, setReceiptText] = useState(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState('');

  const saleQuery = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => fetchSaleDetail(saleId),
    enabled: Boolean(saleId),
  });

  const sale = saleQuery.data;
  const lastPayment = sale?.payments?.[sale.payments.length - 1];

  async function handleViewReceipt() {
    setShowReceipt(true);
    setIsLoadingReceipt(true);
    setReceiptError('');
    try {
      const text = await fetchReceiptText(saleId);
      setReceiptText(text);
    } catch (err) {
      setReceiptError(getErrorMessage(err, 'Could not load the receipt.'));
    } finally {
      setIsLoadingReceipt(false);
    }
  }

  return (
    <>
      <Modal open={Boolean(saleId) && !showReceipt} onClose={onClose} maxWidthClassName="max-w-2xl">
        <div className="p-space-lg border-b border-outline-variant/30 flex items-start justify-between">
          <div className="flex flex-col gap-space-2xs">
            <span className="font-headline-md text-headline-md text-on-surface">
              {sale ? sale.sale_number : 'Transaction Detail'}
            </span>
            {sale && (
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {formatDateTime(sale.sale_date)} &middot; {sale.cashier_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-space-sm">
            {sale && (
              <span
                className={`px-2 py-0.5 rounded-full font-label-badge text-label-badge uppercase ${STATUS_STYLES[sale.status] || STATUS_STYLES.pending}`}
              >
                {sale.status}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div className="p-space-lg overflow-y-auto flex-1 flex flex-col gap-space-lg">
          {saleQuery.isLoading && (
            <div className="flex flex-col gap-space-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-surface-container rounded animate-pulse" />
              ))}
            </div>
          )}

          {saleQuery.isError && (
            <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="font-body-sm text-body-sm">
                {getErrorMessage(saleQuery.error, 'Could not load this transaction.')}
              </span>
            </div>
          )}

          {sale && (
            <>
              {/* Line items */}
              <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-headline-sm text-headline-sm uppercase text-[11px] tracking-wider">
                      <th className="py-2.5 px-space-md font-semibold">Product</th>
                      <th className="py-2.5 px-space-md font-semibold text-right">Qty</th>
                      <th className="py-2.5 px-space-md font-semibold text-right">Unit Price</th>
                      <th className="py-2.5 px-space-md font-semibold text-right">Discount</th>
                      <th className="py-2.5 px-space-md font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container text-body-sm font-body-sm text-on-surface">
                    {sale.line_items.map((li) => (
                      <tr key={li.id}>
                        <td className="py-2.5 px-space-md">{li.product_name_snapshot}</td>
                        <td className="py-2.5 px-space-md text-right font-label-numeric-sm text-label-numeric-sm">{li.quantity}</td>
                        <td className="py-2.5 px-space-md text-right font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">
                          {formatMoney(li.unit_price)}
                        </td>
                        <td className="py-2.5 px-space-md text-right font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">
                          {li.discount ? formatMoney(li.discount) : '--'}
                        </td>
                        <td className="py-2.5 px-space-md text-right font-label-numeric-sm text-label-numeric-sm font-semibold">
                          {formatMoney(li.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals + Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-lg">
                <div className="flex flex-col gap-space-xs p-space-md rounded-xl bg-surface-container-low">
                  <span className="font-headline-sm text-headline-sm text-on-surface mb-space-2xs">Totals</span>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="font-label-numeric-sm text-label-numeric-sm">{formatMoney(sale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Discount</span>
                    <span className="font-label-numeric-sm text-label-numeric-sm">-{formatMoney(sale.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Tax</span>
                    <span className="font-label-numeric-sm text-label-numeric-sm">{formatMoney(sale.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between pt-space-xs mt-space-2xs border-t border-outline-variant/30 font-headline-sm text-headline-sm text-on-surface font-bold">
                    <span>Total</span>
                    <span className="font-label-numeric-md text-label-numeric-md">{formatMoney(sale.total_amount)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-space-xs p-space-md rounded-xl bg-surface-container-low">
                  <span className="font-headline-sm text-headline-sm text-on-surface mb-space-2xs">Payment</span>
                  {lastPayment ? (
                    <>
                      <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                        <span>Method</span>
                        <span className="capitalize text-on-surface">{lastPayment.payment_method.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                        <span>Tendered</span>
                        <span className="font-label-numeric-sm text-label-numeric-sm">{formatMoney(lastPayment.tendered_amount)}</span>
                      </div>
                      <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                        <span>Change Due</span>
                        <span className="font-label-numeric-sm text-label-numeric-sm">{formatMoney(lastPayment.change_due)}</span>
                      </div>
                      <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                        <span>Transaction Ref</span>
                        <span className="font-label-code text-label-code text-on-surface truncate max-w-[55%]">
                          {lastPayment.transaction_ref}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="font-body-sm text-body-sm text-on-surface-variant italic">
                      {sale.status === 'pending' ? 'Awaiting payment.' : 'No payment recorded.'}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-space-lg pt-0">
          <button
            type="button"
            onClick={handleViewReceipt}
            disabled={!sale || sale.status !== 'completed'}
            className="w-full h-11 rounded-lg bg-primary-container text-on-primary font-body-md text-body-md font-semibold flex items-center justify-center gap-space-sm hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            {sale?.status === 'completed' ? 'View / Print Receipt' : 'Receipt unavailable'}
          </button>
        </div>
      </Modal>

      {showReceipt && (
        <ReceiptModal
          title="Receipt"
          sale={sale}
          receiptText={receiptError || receiptText}
          isLoadingReceipt={isLoadingReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </>
  );
}
