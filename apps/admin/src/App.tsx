import { Navigate, Route, Routes, useLocation } from 'react-router';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout';
import { Loading } from '@/components/ui';
import { Login } from '@/pages/login';
import { Dashboard } from '@/pages/dashboard';
import { Reports } from '@/pages/reports';
import { OrderDetail, Orders } from '@/pages/orders';
import { ProductEdit, Products } from '@/pages/products';
import { AuditLog, CustomerDetail, Customers, Inventory, Media } from '@/pages/ops';
import { SettingsPage, Staff } from '@/pages/system';
import { ResourceEdit, ResourceList } from '@/pages/resource';

function Protected() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <Layout />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductEdit />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="staff" element={<Staff />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="media" element={<Media />} />
        <Route path="r/:resource" element={<ResourceList />} />
        <Route path="r/:resource/:id" element={<ResourceEdit />} />
        <Route path="*" element={<div className="card p-10 text-center" data-testid="admin-404"><h1 className="text-xl font-semibold">Page not found</h1></div>} />
      </Route>
    </Routes>
  );
}
