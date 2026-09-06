// "Manager Quick Actions" panel, adapted from dashboard_code.html. The
// Stitch mock's buttons (Fast Stock Intake, Z-Report Close) were decorative
// with no backing endpoint; replaced here with real links to screens that
// already exist, per the task brief.

import { Link } from 'react-router-dom';

const ACTIONS = [
  { to: '/pos', label: 'Open POS Terminal', hint: 'Start a new sale', icon: 'point_of_sale', style: 'primary', managerOnly: false },
  { to: '/inventory', label: 'Manage Inventory', hint: 'Stock & reorder levels', icon: 'inventory_2', style: 'default', managerOnly: true },
  { to: '/products', label: 'Add / Edit Products', hint: 'Catalog & pricing', icon: 'add_box', style: 'default', managerOnly: true },
  { to: '/reports', label: 'View Reports', hint: 'Sales & inventory analytics', icon: 'monitoring', style: 'default', managerOnly: true },
];

// The other three tiles link to admin/manager-only actions (View Reports is a
// hard 403 for a cashier; Manage Inventory / Add-Edit Products are read-only
// for a cashier despite the label), so they're hidden for anyone who isn't an
// admin/manager -- same gate DashboardPage already applies to its other
// manager-only widgets.
export default function QuickActions({ canViewManagerActions = false }) {
  const actions = ACTIONS.filter((action) => !action.managerOnly || canViewManagerActions);
  return (
    <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col">
      <span className="font-headline-sm text-headline-sm text-on-surface pb-space-sm">Quick Actions</span>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Jump straight to a task.</p>
      <div className="grid grid-cols-2 gap-space-sm">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`${actions.length === 1 ? 'col-span-2' : ''} ${
              action.style === 'primary'
                ? 'flex flex-col p-space-md rounded-xl bg-primary-container text-on-primary shadow-sm hover:bg-primary transition-all group'
                : 'flex flex-col p-space-md rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-all group'
            }`}
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
