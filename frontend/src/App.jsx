
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';

import RepairOrders from './pages/RepairOrders';
import Inventory from './pages/Inventory';
import Parts from './pages/Parts';
import Dealerships from './pages/Dealerships';
import Vendors from './pages/Vendors';
import AIDecisionCentre from './pages/AIDecisionCentre';
import Scheduling from './pages/Scheduling';
import Analytics from './pages/Analytics';
import Users from './pages/Users';

function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  if (user.role === 'Technician') {
    return <TechnicianDashboard />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRouter />} />

        <Route path="repair-orders" element={<RepairOrders />} />

        <Route path="inventory" element={
          <RoleRoute allowedRoles={['Manager', 'Service Advisor']}>
            <Inventory />
          </RoleRoute>
        } />

        <Route path="parts" element={
          <RoleRoute allowedRoles={['Manager', 'Service Advisor']}>
            <Parts />
          </RoleRoute>
        } />

        <Route path="dealerships" element={
          <RoleRoute allowedRoles={['Manager']}>
            <Dealerships />
          </RoleRoute>
        } />

        <Route path="vendors" element={
          <RoleRoute allowedRoles={['Manager', 'Service Advisor']}>
            <Vendors />
          </RoleRoute>
        } />

        <Route path="ai-decision-centre" element={
          <RoleRoute allowedRoles={['Manager', 'Service Advisor']}>
            <AIDecisionCentre />
          </RoleRoute>
        } />

        <Route path="scheduling" element={
          <RoleRoute allowedRoles={['Manager', 'Service Advisor']}>
            <Scheduling />
          </RoleRoute>
        } />

        <Route path="analytics" element={
          <RoleRoute allowedRoles={['Manager']}>
            <Analytics />
          </RoleRoute>
        } />

        <Route path="users" element={
          <RoleRoute allowedRoles={['Manager']}>
            <Users />
          </RoleRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
