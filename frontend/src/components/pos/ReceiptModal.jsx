// Post-payment confirmation + printable receipt. Fetches
// GET /api/sales/{id}/receipt.txt and renders it verbatim in a <pre> block,
// per API_REFERENCE.md ("open in a new tab / <pre> block or trigger print").
//
// Reused as-is by TransactionDetailModal (Increment 3) to show the same
// receipt for a completed past sale -- `onNewSale` is optional there (the
// button only renders when a handler is supplied) and `title` lets that
// caller say "Receipt" instead of the just-completed-sale copy.

import { formatMoney } from '../../utils/currency';

export default function ReceiptModal({ sale, receiptText, isLoadingReceipt, onNewSale, onClose, title = 'Sale Completed' }) {
  const lastPayment = sale?.payments?.[sale.payments.length - 1];

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/50 p-space-lg">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-lg flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-space-lg bg-emerald-600 text-white flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[28px]">check_circle</span>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md">{title}</span>
            <span className="font-body-sm text-body-sm opacity-90">
              {sale ? `#${sale.sale_number}` : ''} &middot; {lastPayment ? lastPayment.payment_method.replace('_', ' ') : ''}
            </span>
          </div>
        </div>

        {lastPayment?.payment_method === 'cash' && lastPayment?.change_due != null && (
          <div className="px-space-lg pt-space-md flex justify-between items-center">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Change Due</span>
            <span className="font-label-numeric-lg text-label-numeric-lg font-bold text-on-surface">
              {formatMoney(lastPayment.change_due)}
            </span>
          </div>
        )}

        <div className="p-space-lg overflow-y-auto flex-1">
          {isLoadingReceipt ? (
            <div className="flex items-center justify-center py-space-2xl text-on-surface-variant font-body-sm text-body-sm">
              Generating receipt...
            </div>
          ) : (
            <pre
              id="receipt-print-area"
              className="font-label-code text-label-code text-on-surface whitespace-pre-wrap bg-surface-container-low p-space-md rounded-lg overflow-x-auto"
            >
              {receiptText}
            </pre>
          )}
        </div>

        <div className="p-space-lg pt-0 flex flex-col gap-space-sm">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isLoadingReceipt}
            className="w-full h-11 rounded-lg bg-surface-container text-on-surface font-body-md text-body-md font-semibold flex items-center justify-center gap-space-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">print</span> Print Receipt
          </button>
          {onNewSale && (
            <button
              type="button"
              onClick={onNewSale}
              className="w-full h-11 rounded-lg bg-primary-container text-on-primary font-body-md text-body-md font-semibold flex items-center justify-center gap-space-sm hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span> New Sale
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 rounded-lg text-on-surface-variant font-body-sm text-body-sm hover:text-on-surface transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
