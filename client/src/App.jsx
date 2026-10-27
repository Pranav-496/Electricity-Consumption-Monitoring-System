import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ConsumerDashboard from './pages/dashboard/ConsumerDashboard';
import ConsumerList from './pages/consumers/ConsumerList';
import MeterList from './pages/meters/MeterList';
import ConsumptionList from './pages/consumption/ConsumptionList';
import BillList from './pages/billing/BillList';
import PaymentList from './pages/payments/PaymentList';
import AlertList from './pages/alerts/AlertList';
import ReportsPage from './pages/reports/ReportsPage';
import TariffList from './pages/tariffs/TariffList';
import SettingsPage from './pages/settings/SettingsPage';

const RootRedirect = () => {
  const { user, loading, role } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/consumer/dashboard'} replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/consumers" element={<ConsumerList />} />
          <Route path="/admin/meters" element={<MeterList />} />
          <Route path="/admin/consumption" element={<ConsumptionList />} />
          <Route path="/admin/billing" element={<BillList />} />
          <Route path="/admin/payments" element={<PaymentList />} />
          <Route path="/admin/alerts" element={<AlertList />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/tariffs" element={<TariffList />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Consumer Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['consumer']} />}>
        <Route element={<Layout />}>
          <Route path="/consumer/dashboard" element={<ConsumerDashboard />} />
          <Route path="/consumer/consumption" element={<ConsumptionList />} />
          <Route path="/consumer/bills" element={<BillList />} />
          <Route path="/consumer/payments" element={<PaymentList />} />
          <Route path="/consumer/alerts" element={<AlertList />} />
          <Route path="/consumer/reports" element={<ReportsPage />} />
          <Route path="/consumer/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
