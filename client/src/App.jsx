import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';

import CategoryListPage from './pages/CategoryListPage';
import CategoryFormPage from './pages/CategoryFormPage';
import UnitListPage from './pages/UnitListPage';
import UnitFormPage from './pages/UnitFormPage';
import SupplierListPage from './pages/SupplierListPage';
import SupplierFormPage from './pages/SupplierFormPage';
import CustomerListPage from './pages/CustomerListPage';
import CustomerFormPage from './pages/CustomerFormPage';
import ItemListPage from './pages/ItemListPage';
import ItemFormPage from './pages/ItemFormPage';
import StockInListPage from './pages/StockInListPage';
import StockInDetailPage from './pages/StockInDetailPage';
import StockInFormPage from './pages/StockInFormPage';
import StockOutListPage from './pages/StockOutListPage';
import StockOutDetailPage from './pages/StockOutDetailPage';
import StockOutFormPage from './pages/StockOutFormPage';
import StockPositionPage from './pages/StockPositionPage';
import StockHistoryPage from './pages/StockHistoryPage';
import ReportStockPage from './pages/ReportStockPage';
import ReportStockInPage from './pages/ReportStockInPage';
import ReportStockOutPage from './pages/ReportStockOutPage';
import WarehouseLayoutPage from './pages/WarehouseLayoutPage';
import AdvancedReportsPage from './pages/AdvancedReportsPage';
import ProfilePage from './pages/ProfilePage';
import UserListPage from './pages/UserListPage';
import UserFormPage from './pages/UserFormPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-full flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <MainLayout />;
}

function OwnerRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-4xl">🚫</div>
        <h2 className="text-xl font-bold text-gray-700">Akses Ditolak</h2>
        <p className="text-gray-400 text-sm">Halaman ini hanya dapat diakses oleh Owner.</p>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          
          <Route path="/master/items" element={<ItemListPage />} />
          <Route path="/master/items/create" element={<ItemFormPage />} />
          <Route path="/master/items/:id/edit" element={<ItemFormPage />} />

          <Route path="/transaksi/masuk" element={<StockInListPage />} />
          <Route path="/transaksi/masuk/create" element={<StockInFormPage />} />
          <Route path="/transaksi/masuk/:id" element={<StockInDetailPage />} />

          <Route path="/transaksi/keluar" element={<StockOutListPage />} />
          <Route path="/transaksi/keluar/create" element={<StockOutFormPage />} />
          <Route path="/transaksi/keluar/:id" element={<StockOutDetailPage />} />

          <Route path="/stock" element={<StockPositionPage />} />
          <Route path="/stock/:id/history" element={<StockHistoryPage />} />

          <Route path="/laporan/stok" element={<ReportStockPage />} />
          <Route path="/laporan/masuk" element={<ReportStockInPage />} />
          <Route path="/laporan/keluar" element={<ReportStockOutPage />} />
          <Route path="/laporan/advanced" element={<AdvancedReportsPage />} />

          <Route path="/warehouse/layout" element={<WarehouseLayoutPage />} />

          <Route path="/master/categories" element={<CategoryListPage />} />
          <Route path="/master/categories/create" element={<CategoryFormPage />} />
          <Route path="/master/categories/:id/edit" element={<CategoryFormPage />} />

          <Route path="/master/units" element={<UnitListPage />} />
          <Route path="/master/units/create" element={<UnitFormPage />} />
          <Route path="/master/units/:id/edit" element={<UnitFormPage />} />

          <Route path="/master/suppliers" element={<SupplierListPage />} />
          <Route path="/master/suppliers/create" element={<SupplierFormPage />} />
          <Route path="/master/suppliers/:id/edit" element={<SupplierFormPage />} />

          <Route path="/master/customers" element={<CustomerListPage />} />
          <Route path="/master/customers/create" element={<CustomerFormPage />} />
          <Route path="/master/customers/:id/edit" element={<CustomerFormPage />} />

          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/users" element={<OwnerRoute><UserListPage /></OwnerRoute>} />
          <Route path="/settings/users/create" element={<OwnerRoute><UserFormPage /></OwnerRoute>} />
          <Route path="/settings/users/:id/edit" element={<OwnerRoute><UserFormPage /></OwnerRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
