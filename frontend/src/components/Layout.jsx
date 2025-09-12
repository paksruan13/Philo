import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  const { user, loading, logout, isCoach, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  // Helper function to check if a path is active
  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with authentication controls */}
      <header className="bg-card shadow-lg border-b-2 border-secondary/30 mb-2">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link 
                to="/leaderboard" 
                className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-red-500 to-yellow-500 bg-clip-text text-transparent hover:scale-105 transition-transform"
              >
                Project Phi
              </Link>
              
              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-2">
                <Link
                  to="/leaderboard"
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 min-w-[120px] text-center ${
                    isActivePath('/leaderboard')
                      ? 'bg-gradient-to-r from-purple-600 to-red-500 text-white shadow-lg'
                      : 'text-foreground hover:bg-secondary/20 hover:text-accent'
                  }`}
                >
                  🏆 Leaderboard
                </Link>

                <Link
                  to="/store"
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 min-w-[120px] text-center ${
                    isActivePath('/store')
                      ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-lg'
                      : 'text-foreground hover:bg-secondary/20 hover:text-accent'
                  }`}
                >
                  🛒 Store
                </Link>

                {/* Coach Navigation */}
                {isCoach && (
                  <Link
                    to="/dashboard/coach"
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 min-w-[120px] text-center ${
                      isActivePath('/dashboard/coach')
                        ? 'bg-gradient-to-r from-yellow-500 to-purple-600 text-white shadow-lg'
                        : 'text-foreground hover:bg-secondary/20 hover:text-accent'
                    }`}
                  >
                    👨‍🏫 Coach
                  </Link>
                )}

                {/* Staff Navigation */}
                {user && user.role === 'STAFF' && (
                  <Link
                    to="/dashboard/staff"
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 min-w-[120px] text-center ${
                      isActivePath('/dashboard/staff')
                        ? 'bg-gradient-to-r from-purple-600 to-red-500 text-white shadow-lg'
                        : 'text-foreground hover:bg-secondary/20 hover:text-accent'
                    }`}
                  >
                    ⭐ Staff
                  </Link>
                )}

                {/* Student Navigation - Only show if student has a team */}
                {user && user.role === 'STUDENT' && user.team && (
                  <Link
                    to="/dashboard/student"
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 min-w-[120px] text-center ${
                      isActivePath('/dashboard/student')
                        ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-lg'
                        : 'text-foreground hover:bg-secondary/20 hover:text-accent'
                    }`}
                  >
                    🎯 Dashboard
                  </Link>
                )}

                {/* Admin Navigation */}
                {isAdmin && (
                  <Link
                    to="/dashboard/admin"
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 min-w-[120px] text-center ${
                      isActivePath('/dashboard/admin')
                        ? 'bg-gradient-to-r from-yellow-500 to-purple-600 text-white shadow-lg'
                        : 'text-foreground hover:bg-secondary/20 hover:text-accent'
                    }`}
                  >
                    ⚙️ Admin
                  </Link>
                )}
              </nav>
          </div>
          
            {/* Authentication section */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
              ) : user ? (
                <>
                  <div className="text-sm text-foreground hidden lg:block">
                    Welcome, <span className="font-semibold">{user.name}</span>
                    <span className="ml-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-yellow-100 text-purple-800 rounded-full text-xs font-medium border border-purple-200">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2.5 rounded-lg hover:from-red-600 hover:to-red-700 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleLoginClick}
                    className="text-accent hover:text-primary font-semibold text-sm transition-colors px-4 py-2.5 rounded-lg hover:bg-secondary/20"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleRegisterClick}
                    className="bg-gradient-to-r from-purple-600 to-red-500 text-white px-6 py-2.5 rounded-lg hover:from-purple-700 hover:to-red-600 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Individual student notice for users without a team */}
      {user && user.role === 'STUDENT' && !user.team && location.pathname === '/leaderboard' && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <IndividualStudentNotice />
        </div>
      )}

      {/* Main content */}
      <main>
        <Outlet />
      </main>


    </div>
  );
};

export default Layout;
