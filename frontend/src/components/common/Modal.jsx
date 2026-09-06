import { useEffect } from 'react';

// Generic centered dialog overlay shared by the Add/Edit Product modal
// (project_management_catalog_code.html) and the Reconcile Stock Level
// modal (inventory_stock_management_code.html) so their near-identical
// overlay/backdrop/close-on-escape boilerplate isn't duplicated twice.
// Callers supply the header/body/footer markup as children -- this wrapper
// only owns the overlay, sizing, and dismiss behavior.
export default function Modal({ open, onClose, children, maxWidthClassName = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-space-md sm:p-space-lg bg-inverse-surface/60 backdrop-blur-sm overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`relative w-full ${maxWidthClassName} my-auto bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
        {children}
      </div>
    </div>
  );
}
