// Role / account-status pills for the User Management screen (Increment 4),
// styled after StockStatusBadge's dot-plus-pill pattern so this screen reads
// as part of the same design system rather than inventing a new one.

const ROLE_STYLES = {
  admin: 'bg-violet-50 text-violet-700',
  manager: 'bg-blue-50 text-blue-700',
  cashier: 'bg-slate-100 text-slate-700',
};

const ROLE_LABELS = {
  admin: 'Administrator',
  manager: 'Manager',
  cashier: 'Cashier',
};

export function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-badge text-label-badge font-semibold ${
        ROLE_STYLES[role] || 'bg-surface-container text-on-surface-variant'
      }`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700',
  disabled: 'bg-surface-container text-on-surface-variant',
};

const STATUS_DOT_STYLES = {
  active: 'bg-emerald-500',
  disabled: 'bg-outline',
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-badge text-label-badge ${
        STATUS_STYLES[status] || STATUS_STYLES.disabled
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_STYLES[status] || STATUS_DOT_STYLES.disabled}`}></span>
      {status === 'active' ? 'ACTIVE' : 'DISABLED'}
    </span>
  );
}
