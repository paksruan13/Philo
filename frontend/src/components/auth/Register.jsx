import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Register = ({ onSwitchToLogin, onSuccess, isModal = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [showTeamCode, setShowTeamCode] = useState(false); // Toggle for team code field
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
      // Register with team code (uses team registration endpoint)
      await registerWithTeam(name, email, password, teamCode.trim().toUpperCase());
      return;
    } else {
      // Regular individual registration (defaults to STUDENT role, no team)
      result = await register(name, email, password, 'STUDENT', null);

      if (result.success) {
      // Registration successful - modal will close automatically
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setTeamCode('');
        setShowTeamCode(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || 'Registration failed');
      }
      setLoading(false);
      }
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
        <label htmlFor="name" className="block text-sm font-semibold text-foreground">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 bg-card border border-border rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth text-foreground placeholder-muted-foreground"
          placeholder="Enter your full name"
        />
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            placeholder="Create password"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth text-foreground placeholder-muted-foreground"
            placeholder="Confirm password"
          />
        </div>
      </div>

      {/* Team Code Toggle */}
      <div className="bg-secondary/30 border border-border/30 rounded-xl p-4 space-y-3">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showTeamCode}
            onChange={(e) => {
              setShowTeamCode(e.target.checked);
              if (!e.target.checked) {
                setTeamCode('');
              }
            }}
            className="w-5 h-5 text-primary bg-card border-border rounded focus:ring-primary/20 focus:ring-2 transition-smooth"
          />
          <span className="text-sm font-semibold text-foreground flex items-center space-x-2">
            <span>🏆</span>
            <span>I have a team code</span>
          </span>
        </label>
        <p className="text-xs text-muted-foreground ml-8">
          Check this if you have a team code to join an existing team
        </p>

        {/* Team Code Input - Only show when checkbox is checked */}
        {showTeamCode && (
          <div className="mt-3 space-y-2">
            <label htmlFor="teamCode" className="block text-sm font-semibold text-foreground">
              Team Code
            </label>
            <input
              id="teamCode"
              name="teamCode"
              type="text"
              required={showTeamCode}
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              placeholder="Enter your team code (e.g. ALPH123)"
              className="w-full px-4 py-3 bg-card border border-border rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth text-foreground placeholder-muted-foreground font-mono"
            />
            <p className="text-xs text-muted-foreground flex items-center space-x-1">
              <span>💡</span>
              <span>Get your team code from your coach or team leader</span>
            </p>
          </div>
        )}
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
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>{showTeamCode ? '🏆' : '🎯'}</span>
              <span>{showTeamCode ? 'Join Team & Create Account' : 'Create Account'}</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center pt-4">
        <p className="text-muted-foreground text-sm">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary hover:text-primary/80 font-semibold transition-smooth hover:underline"
          >
            Sign in here
          </button>
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-secondary/30 border border-border/30 rounded-xl p-4 mt-6">
        <p className="font-semibold text-foreground text-sm mb-2 flex items-center space-x-2">
          <span>📝</span>
          <span>Registration Info</span>
        </p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li className="flex items-start space-x-2">
            <span className="text-primary">•</span>
            <span><strong>Without team code:</strong> Join as individual student</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary">•</span>
            <span><strong>With team code:</strong> Automatically join your team</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-primary">•</span>
            <span>You can join a team later from your profile</span>
          </li>
        </ul>
      </div>
    </form>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-accent opacity-5"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-secondary opacity-30"></div>
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Register Card */}
        <div className="card-base p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center shadow-glow">
              <span className="text-2xl text-primary-foreground">🚀</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-accent">
                Join Project Phi
              </h1>
              <p className="text-muted-foreground mt-2">
                Create your account and start your journey with us
              </p>
            </div>
          </div>
          
          {formContent}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            By creating an account, you agree to our terms and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;