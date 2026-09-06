// "Manager Quick Actions" panel, adapted from dashboard_code.html. The
// Stitch mock's buttons (Fast Stock Intake, Z-Report Close) were decorative
// with no backing endpoint; replaced here with real links to screens that
// already exist, per the task brief.

import { Link } from 'react-router-dom';

const ACTIONS = [
  { to: '/pos', label: 'Open POS Terminal', hint: 'Start a new sale', icon: 'point_of_sale', style: 'primary' },
  { to: '/inventory', label: 'Manage Inventory', hint: 'Stock & reorder levels', icon: 'inventory_2', style: 'default' },
  { to: '/products', label: 'Add / Edit Products', hint: 'Catalog & pricing', icon: 'add_box', style: 'default' },
  { to: '/reports', label: 'View Reports', hint: 'Sales & inventory analytics', icon: 'monitoring', style: 'default' },
];

export default function QuickActions() {
  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col">
      <span className="font-headline-sm text-headline-sm text-on-surface pb-space-sm">Quick Actions</span>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Jump straight to a task.</p>
      <div className="grid grid-cols-2 gap-space-sm">
        {ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={
              action.style === 'primary'
                ? 'flex flex-col p-space-md rounded-xl bg-primary-container text-on-primary shadow-sm hover:bg-primary transition-all group'
                : 'flex flex-col p-space-md rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-all group'
            }
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${
                action.style === 'primary' ? 'bg-surface-container-lowest/20' : 'bg-surface-container-highest text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{action.icon}</span>
            </div>
            <span className="font-headline-sm text-headline-sm font-semibold leading-snug">{action.label}</span>
            <span
              className={`font-label-code text-[11px] mt-0.5 ${
                action.style === 'primary' ? 'text-primary-fixed-dim' : 'text-on-surface-variant'
              }`}
            >
              {action.hint}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
