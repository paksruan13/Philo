import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';

// Standalone Login Page
export const LoginPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/leaderboard" className="block text-center">
          <h1 className="text-3xl font-bold text-blue-600 hover:text-blue-700">
            Project Phi
          </h1>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up here
          </Link>
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Login 
            isModal={false}
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={() => navigate('/register')}
          />
        </div>
      </div>
    </div>
  );
};

// Standalone Register Page
export const RegisterPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleRegisterSuccess = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/leaderboard" className="block text-center">
          <h1 className="text-3xl font-bold text-blue-600 hover:text-blue-700">
            Project Phi
          </h1>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in here
          </Link>
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Register 
            isModal={false}
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => navigate('/login')}
          />
        </div>
      </div>
    </div>
  );
};
