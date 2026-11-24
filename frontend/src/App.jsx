import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import './i18n';

// Layout Components
import AppLayout from './components/AppLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Authenticated Application Pages
import DashboardPage from './pages/DashboardPage';
import DiseaseAlertsPage from './pages/DiseaseAlertsPage';
import CommunityMapPage from './pages/CommunityMapPage';
import NotificationsPage from './pages/NotificationsPage';

// Community & Reporting Pages
import SubmitReport from './pages/community/SubmitReport';
import MyReports from './pages/community/MyReports';
import ChatAssistant from './pages/community/ChatAssistant';
import ProfilePage from './pages/community/ProfilePage';

// Monitoring & Admin Pages
import CommunityMonitoring from './pages/health_worker/CommunityMonitoring';
import UserManagement from './pages/admin/UserManagement';

// Protected Route Guard
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070c18',
          color: '#94a3b8',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              margin: '0 auto 1.25rem',
              width: '36px',
              height: '36px',
              border: '3px solid rgba(20, 184, 166, 0.2)',
              borderTopColor: '#14b8a6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#e2e8f0' }}>
            Securing HealthGuard AI Session...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Routes wrapped in AppLayout with Sidebar & Header */}
            <Route element={<ProtectedRoute />}>
              {/* Main Dashboard & Legacy Role Dashboards - Accessible by all authenticated roles */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/community" element={<DashboardPage />} />
              <Route path="/health-worker" element={<DashboardPage />} />
              <Route path="/professional" element={<DashboardPage />} />
              <Route path="/admin" element={<DashboardPage />} />

              {/* Core Features */}
              <Route path="/submit-report" element={<SubmitReport />} />
              <Route path="/community/submit-report" element={<SubmitReport />} />

              <Route path="/my-reports" element={<MyReports />} />
              <Route path="/community/my-reports" element={<MyReports />} />

              <Route path="/map" element={<CommunityMapPage />} />
              <Route path="/community-map" element={<CommunityMapPage />} />

              <Route path="/alerts" element={<DiseaseAlertsPage />} />
              <Route path="/disease-alerts" element={<DiseaseAlertsPage />} />

              <Route path="/notifications" element={<NotificationsPage />} />

              <Route path="/assistant" element={<ChatAssistant />} />
              <Route path="/community/chat" element={<ChatAssistant />} />

              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/community/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<ProfilePage />} />
            </Route>

            {/* Health Worker & Doctor & Admin monitoring analytics */}
            <Route element={<ProtectedRoute allowedRoles={['health_worker', 'healthcare_professional', 'administrator']} />}>
              <Route path="/analytics" element={<CommunityMonitoring />} />
              <Route path="/health-worker/monitoring" element={<CommunityMonitoring />} />
            </Route>

            {/* Doctor & Admin Alert Verification */}
            <Route element={<ProtectedRoute allowedRoles={['healthcare_professional', 'administrator']} />}>
              <Route path="/professional/verify-alerts" element={<DiseaseAlertsPage />} />
            </Route>

            {/* Administrator Only User Management */}
            <Route element={<ProtectedRoute allowedRoles={['administrator']} />}>
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
