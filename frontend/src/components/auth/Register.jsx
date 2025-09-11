import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [showTeamCode, setShowTeamCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, registerWithTeam } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate team code if provided
    if (showTeamCode && !teamCode.trim()) {
      setError('Please enter a team code or uncheck "Have a team code?"');
      setLoading(false);
      return;
    }

    let result;

    if (showTeamCode && teamCode.trim()) {
      // Register with team code
      result = await registerWithTeam(name, email, password, teamCode.trim().toUpperCase());
    } else {
      // Regular individual registration
      result = await register(name, email, password, 'STUDENT', null);
    }

    if (result && result.success) {
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setTeamCode('');
      navigate('/dashboard');
    } else {
      setError(result?.error || 'Registration failed');
    }
    
    setLoading(false);
  };

  const formContent = (
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
            autoComplete="new-password"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center">
          <input
            id="hasTeamCode"
            name="hasTeamCode"
            type="checkbox"
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            checked={showTeamCode}
            onChange={(e) => setShowTeamCode(e.target.checked)}
          />
          <label htmlFor="hasTeamCode" className="ml-2 block text-sm text-gray-900">
            I have a team code
          </label>
        </div>

        {showTeamCode && (
          <div>
            <label htmlFor="teamCode" className="block text-sm font-medium text-gray-700 mb-2">
              Team Code
            </label>
            <input
              id="teamCode"
              name="teamCode"
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase"
              placeholder="Enter your team code"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-red-600 font-medium hover:text-red-700"
          >
            Sign in here
          </button>
        </p>
      </div>
    </form>
  );

  // Full screen layout with 2/3 + 1/3 split
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <div className="min-h-screen flex">
      {/* Left Side - Registration Form (2/3) */}
      <div className="w-2/3 flex items-center justify-center p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Join Project Phi</h1>
            <p className="text-gray-600 mt-2">Create your account and start your journey</p>
          </div>
          
          {formContent}
        </div>
      </div>
      
      {/* Right Side - Color Palette (1/3) */}
      <div className="w-1/3 bg-gradient-to-br from-purple-600 via-red-500 to-yellow-500 flex items-center justify-center p-8">
        <div className="text-center text-white w-full">
          <h2 className="text-4xl font-bold mb-6">Get Started</h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of students and teams making an impact together.
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎯</span>
              <span>Set goals and achieve them</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🤝</span>
              <span>Connect with your team</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🏆</span>
              <span>Track your progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Register;
