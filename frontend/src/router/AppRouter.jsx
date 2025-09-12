import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layout components
import Layout from '../components/Layout';

// Public components
import Leaderboard from '../components/Leaderboard';
import Donations from '../components/Donations';

// Auth pages
import { LoginPage, RegisterPage } from '../pages/AuthPages';
import NotFoundPage from '../pages/NotFoundPage';

// Protected components
import AdminDashboard from '../components/admin/AdminDashboard';
import CoachDashboard from '../components/coach/CoachDashboard';
import StaffDashboard from '../components/staff/StaffDashboard';
import StudentDashboard from '../components/student/StudentDashboard';
import ActivitySubmission from '../components/student/ActivitySubmission';

// Route protection components
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/leaderboard" replace />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="store" element={<Donations />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute />}>
            {/* Admin routes */}
            <Route path="admin" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </RoleRoute>
            } />
            
            {/* Coach routes */}
            <Route path="coach" element={
              <RoleRoute allowedRoles={['COACH']}>
                <CoachDashboard />
              </RoleRoute>
            } />
            
            {/* Staff routes */}
            <Route path="staff" element={
              <RoleRoute allowedRoles={['STAFF']}>
                <StaffDashboard />
              </RoleRoute>
            } />

            {/* Student routes */}
            <Route path="student" element={
              <RoleRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </RoleRoute>
            } />
            
            <Route path="student/activity/:activityId" element={
              <RoleRoute allowedRoles={['STUDENT']}>
                <ActivitySubmission />
              </RoleRoute>
            } />
            
            {/* Default dashboard redirect based on role */}
            <Route index element={<DashboardRedirect />} />
          </Route>
          
          {/* 404 catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        
        {/* Standalone auth routes outside of layout */}
        <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
        <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
      </Routes>
    </Router>
  );
};

// Component to redirect authenticated users away from auth pages
const AuthRedirect = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Component to redirect to appropriate dashboard based on user role
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/dashboard/admin" replace />;
    case 'COACH':
      return <Navigate to="/dashboard/coach" replace />;
    case 'STAFF':
      return <Navigate to="/dashboard/staff" replace />;
    case 'STUDENT':
      // Only redirect students to dashboard if they have a team
      if (user.team) {
        return <Navigate to="/dashboard/student" replace />;
      } else {
        // Students without teams go to leaderboard
        return <Navigate to="/leaderboard" replace />;
      }
    default:
      return <Navigate to="/leaderboard" replace />;
  }
};

export default AppRouter;
