import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PosTerminalPage from './pages/PosTerminalPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';
import ComingSoonPage from './pages/ComingSoonPage';

const PLACEHOLDER_ROUTES = [{ path: '/settings', title: 'Settings' }];

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell headerTitle="Dashboard">
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <AppShell headerTitle="Point of Sale">
              <PosTerminalPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <AppShell headerTitle="Products">
              <ProductsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <AppShell headerTitle="Inventory">
              <InventoryPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <AppShell headerTitle="Sales & Transactions">
              <TransactionsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppShell headerTitle="Reports & Analytics">
              <ReportsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AppShell headerTitle="User Management">
              <UserManagementPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {PLACEHOLDER_ROUTES.map(({ path, title }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <AppShell headerTitle={title}>
                <ComingSoonPage title={title} />
              </AppShell>
            </ProtectedRoute>
          }
        />
      ))}

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
