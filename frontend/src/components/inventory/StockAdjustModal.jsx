import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { getErrorMessage } from '../../api/client';

// Reconcile Stock Level modal, ported from
// inventory_stock_management_code.html's "#stockAdjustModal". The Stitch
// version tracked a signed "adjustMultiplier" client-side; here the reason
// choice directly determines the sign of the delta sent to
// POST /api/products/{id}/adjust-stock (StockAdjustmentRequest: {delta,
// reason, note}) -- Restock/Found is always +, Defect/Damage and
// Shrink/Lost are always -.

const REASONS = [
  { key: 'restock', label: '+ Restock / Found', sign: 1, activeClass: 'bg-emerald-100 text-emerald-900' },
  { key: 'damage', label: '- Defect / Damage', sign: -1, activeClass: 'bg-amber-100 text-amber-900' },
  { key: 'shrink', label: '- Shrink / Lost', sign: -1, activeClass: 'bg-red-100 text-red-900' },
];

export default function StockAdjustModal({ open, onClose, product, onSubmit }) {
  const [reasonKey, setReasonKey] = useState('restock');
  const [amount, setAmount] = useState('1');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReasonKey('restock');
      setAmount('1');
      setNote('');
      setError(null);
    }
  }, [open, product]);

  if (!product) return null;

  const currentQty = product.inventory?.stock_quantity ?? 0;
  const reason = REASONS.find((r) => r.key === reasonKey);
  const amountNum = parseInt(amount, 10) || 0;
  const signedDelta = reason.sign * amountNum;
  const projectedQty = currentQty + signedDelta;

  function step(delta) {
    setAmount((prev) => String(Math.max(1, (parseInt(prev, 10) || 0) + delta)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (amountNum <= 0) {
      setError('Enter an adjustment amount greater than zero.');
      return;
    }
    if (projectedQty < 0) {
      setError(`Cannot remove ${amountNum} units -- only ${currentQty} in stock.`);
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ delta: signedDelta, reason: reasonKey, note: note.trim() || undefined });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not adjust stock for this product.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
        <div className="px-space-lg py-space-md bg-inverse-surface text-inverse-on-surface flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary-fixed text-[24px]">tune</span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-semibold text-white">Reconcile Stock Level</span>
              <span className="font-label-code text-label-code text-primary-fixed-dim">SKU: {product.sku}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-inverse-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-space-lg flex flex-col gap-space-md overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="font-body-sm text-body-sm">{error}</span>
            </div>
          )}

          <div>
            <span className="font-body-sm text-body-sm text-on-surface-variant block mb-1">Target Product</span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold truncate">{product.name}</h2>
          </div>

          <div className="grid grid-cols-2 gap-space-md bg-surface-container-low p-space-md rounded-lg">
            <div className="flex flex-col">
              <span className="font-label-code text-label-code text-on-surface-variant uppercase">Current Qty</span>
              <span className="font-label-numeric-lg text-label-numeric-lg text-on-surface font-bold">{currentQty}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-code text-label-code text-on-surface-variant uppercase">Projected Qty</span>
              <span
                className={`font-label-numeric-lg text-label-numeric-lg font-bold ${
                  projectedQty < 0 ? 'text-error' : projectedQty < currentQty ? 'text-amber-700' : 'text-primary'
                }`}
              >
                {Math.max(projectedQty, 0)}
                {projectedQty < 0 && ' (invalid)'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-code text-label-code text-on-surface-variant uppercase">Adjustment Reason</label>
            <div className="grid grid-cols-3 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setReasonKey(r.key)}
                  className={`py-2 px-1 rounded-lg font-headline-sm text-headline-sm text-center font-semibold transition-all ${
                    reasonKey === r.key ? r.activeClass : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-code text-label-code text-on-surface-variant uppercase">Adjustment Amount (units)</label>
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={() => step(-1)}
                className="w-12 h-10 rounded-lg bg-surface-container text-on-surface font-bold text-lg hover:bg-surface-variant transition-colors flex items-center justify-center"
              >
                -
              </button>
              <input
                className="flex-1 h-10 text-center font-label-numeric-md text-label-numeric-md rounded-lg bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                type="button"
                onClick={() => step(1)}
                className="w-12 h-10 rounded-lg bg-surface-container text-on-surface font-bold text-lg hover:bg-surface-variant transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-code text-label-code text-on-surface-variant uppercase">Note (optional)</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-outline-variant"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Physical cycle count verification; damaged box sent to returns"
            />
          </div>

          <div className="flex items-center justify-end gap-space-sm pt-space-sm">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-headline-sm text-headline-sm transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold transition-all shadow-md disabled:opacity-60"
            >
              {isSubmitting ? 'Committing...' : 'Commit Stock Ledger'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
