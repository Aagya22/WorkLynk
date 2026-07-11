import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { MfaVerify } from './pages/MfaVerify';
import { ForcePasswordChange } from './pages/ForcePasswordChange';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Payslips } from './pages/Payslips';
import { Leaves } from './pages/Leaves';
import { GDPR } from './pages/GDPR';
import { HrDashboard } from './pages/HrDashboard';
import { HrEmployeeList } from './pages/HrEmployeeList';
import { HrLeaveApprovals } from './pages/HrLeaveApprovals';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUserManagement } from './pages/AdminUserManagement';
import { AuditLogs } from './pages/AuditLogs';
import { Forbidden } from './pages/Forbidden';
import { NotFound } from './pages/NotFound';

// Route protection for authenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-semibold">
        Loading session status...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Role-based route protection
const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-semibold">
        Loading session status...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

// Route protection for guest users
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-semibold">
        Loading session status...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Guest Routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route path="/verify-mfa" element={<MfaVerify />} />
        <Route path="/force-change-password" element={<ForcePasswordChange />} />

        {/* Protected Employee Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payslips"
          element={
            <ProtectedRoute>
              <Payslips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaves"
          element={
            <ProtectedRoute>
              <Leaves />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gdpr"
          element={
            <ProtectedRoute>
              <GDPR />
            </ProtectedRoute>
          }
        />

        {/* Protected HR/Manager Routes */}
        <Route
          path="/hr/dashboard"
          element={
            <RoleRoute allowedRoles={['hr_manager', 'admin']}>
              <HrDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/employees"
          element={
            <RoleRoute allowedRoles={['hr_manager', 'admin']}>
              <HrEmployeeList />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/leaves"
          element={
            <RoleRoute allowedRoles={['hr_manager', 'admin']}>
              <HrLeaveApprovals />
            </RoleRoute>
          }
        />
        <Route
          path="/hr/logs"
          element={
            <RoleRoute allowedRoles={['hr_manager', 'admin']}>
              <AuditLogs />
            </RoleRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminUserManagement />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AuditLogs />
            </RoleRoute>
          }
        />

        {/* Error Fallbacks */}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
