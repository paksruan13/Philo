import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. You do not have permission to view this page.
        </div>
      </div>
    );
  }

  // For student routes, also check if they have a team
  if (user.role === 'STUDENT' && allowedRoles.includes('STUDENT') && !user.team) {
    return <Navigate to="/leaderboard" replace />;
  }
  
  return children;
};

export default RoleRoute;
