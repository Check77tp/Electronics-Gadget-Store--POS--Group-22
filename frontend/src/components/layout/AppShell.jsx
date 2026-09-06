import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../../context/AuthContext';

// Shared sidebar + header shell, extracted from the common markup across the
// Stitch exports (point_of_sale_terminal_code.html, dashboard_code.html,
// inventory_stock_management_code.html, project_management_catalog_code.html)
// so every screen (this increment's POS Terminal, and later increments) sits
// inside the same navigation chrome. Tailwind classes are kept close to the
// Stitch markup; static demo data (e.g. "David Vance") is replaced with real
// AuthContext data.
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/pos', label: 'Point of Sale', icon: 'point_of_sale' },
  { path: '/products', label: 'Products', icon: 'devices_other' },
  { path: '/inventory', label: 'Inventory', icon: 'inventory_2' },
  { path: '/sales', label: 'Sales & Transactions', icon: 'receipt_long' },
  { path: '/reports', label: 'Reports & Analytics', icon: 'monitoring' },
  { path: '/users', label: 'User Management', icon: 'manage_accounts' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

const ROLE_LABELS = {
  admin: 'Administrator',
  manager: 'Manager',
  cashier: 'Cashier',
};

function navLinkClasses({ isActive }) {
  const base = 'flex items-center gap-space-md px-space-md py-2.5 rounded-lg transition-all';
  return isActive
    ? `${base} bg-primary-container text-on-primary font-semibold`
    : `${base} text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-surface-container-lowest`;
}

export default function AppShell({ children, headerTitle = 'Console' }) {
  const { user, logout, hasRole } = useAuth();

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.path === '/users') return hasRole('admin');
    return true;
  });

  const fullName = user?.full_name || user?.username || 'Unknown User';
  const roleLabel = ROLE_LABELS[user?.role] || user?.role || '';

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased">
      <aside className="fixed left-0 top-0 h-screen w-pos-sidebar-width bg-inverse-surface text-inverse-on-surface z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col">
          <div className="px-space-lg py-space-md bg-inverse-surface">
            <div className="flex items-center gap-space-sm">
              <Logo className="h-8 w-auto" />
            </div>
            <div className="mt-space-md p-space-sm bg-surface-variant/10 rounded-lg">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary-fixed-dim text-[16px]">storefront</span>
                <span className="font-body-sm text-body-sm font-semibold text-surface-container-lowest truncate">
                  GadgetPOS Store
                </span>
              </div>
              <div className="flex items-center justify-between mt-space-xs">
                <span className="font-label-code text-label-code text-outline-variant">Reg: POS-01</span>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-label-code text-label-code text-emerald-300">Online</span>
                </div>
              </div>
            </div>
          </div>
          <nav className="mt-space-sm px-space-sm flex flex-col gap-space-2xs">
            {visibleNavItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={navLinkClasses}>
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-body-md text-body-md">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-space-md m-space-sm bg-surface-variant/10 rounded-xl">
          <div className="flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">badge</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-label-code text-label-code text-outline-variant uppercase">Signed in</span>
              <span className="font-body-sm text-body-sm font-semibold text-surface-container-lowest truncate">{fullName}</span>
              <span className="font-label-code text-label-code text-primary-fixed-dim truncate">{roleLabel}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Log out"
              className="p-1.5 rounded-lg text-inverse-on-surface/70 hover:bg-surface-variant/20 hover:text-surface-container-lowest transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="pl-pos-sidebar-width min-h-screen flex flex-col">
        <header className="fixed top-0 left-pos-sidebar-width right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md z-40 px-space-lg flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-space-lg flex-1 max-w-2xl">
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">store</span>
              <span className="font-body-sm text-body-sm">Register 01</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{headerTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="h-6 w-px bg-outline-variant/30"></div>
            <div className="flex items-center gap-space-sm pl-space-xs">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="font-body-sm text-body-sm font-semibold text-on-surface leading-tight">{fullName}</span>
                <span className="font-label-code text-label-code text-on-surface-variant">{roleLabel}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Log out"
                className="p-1 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </header>
        <main className="w-full pt-16 bg-background min-h-screen flex-1">{children}</main>
      </div>
    </div>
  );
}
