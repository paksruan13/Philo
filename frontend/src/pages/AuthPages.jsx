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
  
  return <Login />;
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
  
  return <Register />;
};
