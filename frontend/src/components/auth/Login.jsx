import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChangePassword from './ChangePassword';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      if (result.mustChangePassword) {
        setShowPasswordChange(true);
        setLoading(false);
        return;
      }
      
      setEmail('');
      setPassword('');
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <div className="min-h-screen flex">
        {/* Left Side - Login Form (2/3) */}
        <div className="w-2/3 flex items-center justify-center p-12 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-600 mt-2">Sign in to your Project Phi account</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-purple-600 font-medium hover:text-purple-700"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
        
        {/* Right Side - Color Palette (1/3) */}
        <div className="w-1/3 bg-gradient-to-br from-purple-600 via-red-500 to-yellow-500 flex items-center justify-center p-8">
          <div className="text-center text-white w-full">
            <h2 className="text-4xl font-bold mb-6">Project Phi</h2>
            <p className="text-xl mb-8 text-white/90">
              Join the community of teams competing, collaborating, and making a difference together.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🏆</span>
                <span>Compete on the leaderboard</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🛒</span>
                <span>Shop and support your team</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📸</span>
                <span>Submit activities and earn points</span>
              </div>
            </div>
          </div>
        </div>
        
        {showPasswordChange && (
          <ChangePassword 
            mustChange={true} 
            onClose={() => setShowPasswordChange(false)} 
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <div className="min-h-screen flex">
        {/* Left Side - Login Form (2/3) */}
        <div className="w-2/3 flex items-center justify-center p-12 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-600 mt-2">Sign in to your Project Phi account</p>
            </div>
            
            {formContent}
          </div>
        </div>
        
        {/* Right Side - Color Palette (1/3) */}
        <div className="w-1/3 bg-gradient-to-br from-purple-600 via-red-500 to-yellow-500 flex items-center justify-center p-8">
          <div className="text-center text-white w-full">
            <h2 className="text-4xl font-bold mb-6">Project Phi</h2>
            <p className="text-xl mb-8 text-white/90">
              Join the community of teams competing, collaborating, and making a difference together.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">�</span>
                <span>Compete on the leaderboard</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🛒</span>
                <span>Shop and support your team</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📸</span>
                <span>Submit activities and earn points</span>
              </div>
            </div>
          </div>
        </div>
        
        {showPasswordChange && (
          <ChangePassword 
            mustChange={true} 
            onClose={() => setShowPasswordChange(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default Login;