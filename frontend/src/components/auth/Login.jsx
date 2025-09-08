import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ChangePassword from './ChangePassword';

const Login = ({ onSwitchToRegister, onSuccess, isModal = false }) => {
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
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
    
    setLoading(false);
  };

  const formContent = (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm transition-smooth">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-semibold text-foreground">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-card border border-border rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth text-foreground placeholder-muted-foreground"
          placeholder="Enter your email"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold text-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-card border border-border rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth text-foreground placeholder-muted-foreground"
          placeholder="Enter your password"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-12 flex items-center justify-center space-x-2 text-lg font-semibold hover-scale focus-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Sign In</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center pt-4">
        <p className="text-muted-foreground text-sm">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-primary hover:text-primary/80 font-semibold transition-smooth hover:underline"
          >
            Sign up here
          </button>
        </p>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <>
        {formContent}
        {showPasswordChange && (
          <ChangePassword 
            mustChange={true} 
            onClose={() => setShowPasswordChange(false)} 
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-secondary opacity-30"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Login Card */}
        <div className="card-base p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
              <span className="text-2xl text-primary-foreground">🎓</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">
                Welcome Back
              </h1>
              <p className="text-muted-foreground mt-2">
                Sign in to continue your journey with Project Phi
              </p>
            </div>
          </div>
          
          {formContent}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our terms and privacy policy
          </p>
        </div>
      </div>
      
      {showPasswordChange && (
        <ChangePassword 
          mustChange={true} 
          onClose={() => setShowPasswordChange(false)} 
        />
      )}
    </div>
  );
};

export default Login;