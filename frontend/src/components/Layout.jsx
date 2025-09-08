import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from './auth/Login';
import Register from './auth/Register';
import JoinTeamForm from './student/JoinTeamForm';

// Component for individual students without a team
const IndividualStudentNotice = () => {
  const [showJoinTeam, setShowJoinTeam] = useState(false);

  return (
    <>
      <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-blue-700">
              👋 <strong>Welcome!</strong> You're registered as an individual. Join a team to access team activities and compete on the leaderboard!
            </p>
          </div>
          <button
            onClick={() => setShowJoinTeam(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Join a Team
          </button>
        </div>
      </div>
      
      {showJoinTeam && (
        <JoinTeamForm 
          onSuccess={() => setShowJoinTeam(false)}
          onCancel={() => setShowJoinTeam(false)}
        />
      )}
    </>
  );
};

const Layout = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { user, loading, logout, isCoach, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle opening login modal
  const handleLoginClick = () => {
    setShowLogin(true);
    setShowRegister(false);
  };

  const handleRegisterClick = () => {
    setShowRegister(true);
    setShowLogin(false);
  };

  const handleCloseModals = () => {
    setShowLogin(false);
    setShowRegister(false);
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const handleLoginSuccess = () => {
    handleCloseModals();
    navigate('/dashboard');
  };

  const handleRegisterSuccess = () => {
    handleCloseModals();
    navigate('/dashboard');
  };

  // Helper function to check if a path is active
  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with authentication controls */}
      <header className="bg-white shadow mb-8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/leaderboard" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
              Project Phi
            </Link>
            
            {/* Navigation */}
            <nav className="flex space-x-4">
              <Link
                to="/leaderboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActivePath('/leaderboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Leaderboard
              </Link>

              <Link
                to="/store"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActivePath('/store')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Store
              </Link>

              {/* Coach Navigation */}
              {isCoach && (
                <Link
                  to="/dashboard/coach"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/dashboard/coach')
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Coach Dashboard
                </Link>
              )}

              {/* Staff Navigation */}
              {user && user.role === 'STAFF' && (
                <Link
                  to="/dashboard/staff"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/dashboard/staff')
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Staff Dashboard
                </Link>
              )}

              {/* Student Navigation - Only show if student has a team */}
              {user && user.role === 'STUDENT' && user.team && (
                <Link
                  to="/dashboard/student"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/dashboard/student')
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Dashboard
                </Link>
              )}

              {/* Admin Navigation */}
              {isAdmin && (
                <Link
                  to="/dashboard/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath('/dashboard/admin')
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>
          
          {/* Authentication section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : user ? (
              <>
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium">{user.name}</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Role-specific notifications for authenticated users on leaderboard */}
      {user && location.pathname === '/leaderboard' && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
          {isCoach && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-yellow-700">
                🏆 <strong>Coach Dashboard:</strong> Manage your teams and approve activities from your{' '}
                <Link to="/dashboard/coach" className="underline hover:text-yellow-800">
                  Coach Dashboard
                </Link>
              </p>
            </div>
          )}
          
          {isAdmin && (
            <div className="bg-purple-100 border-l-4 border-purple-500 p-4 mb-4">
              <p className="text-purple-700">
                ⚙️ <strong>Admin Panel:</strong> Manage users and teams from your{' '}
                <Link to="/dashboard/admin" className="underline hover:text-purple-800">
                  Admin Panel
                </Link>
              </p>
            </div>
          )}

          {user.role === 'STUDENT' && user.team && (
            <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-green-700">
                🎯 <strong>Member Portal:</strong> Submit photos, track donations, and compete with your team from your{' '}
                <Link to="/dashboard/student" className="underline hover:text-green-800">
                  Dashboard
                </Link>
              </p>
            </div>
          )}

          {user.role === 'STUDENT' && !user.team && (
            <IndividualStudentNotice />
          )}
        </div>
      )}

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-end">
              <button
                onClick={handleCloseModals}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="mt-3">
              <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
                Sign in to Project Phi
              </h2>
              <Login 
                onSwitchToRegister={handleSwitchToRegister}
                onSuccess={handleLoginSuccess}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-end">
              <button
                onClick={handleCloseModals}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="mt-3">
              <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
                Join Project Phi
              </h2>
              <Register 
                onSwitchToLogin={handleSwitchToLogin}
                onSuccess={handleRegisterSuccess}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
