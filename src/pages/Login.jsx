import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const successMessage = location.state?.message;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message || 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-[rgb(var(--bg))] text-[rgb(var(--fg))] p-4 overflow-hidden">
      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Company Info & Logo */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-6 p-8">
          <div className="w-24 h-24 mb-4">
            <img 
              src="https://asmlm-production.up.railway.app/Logo-300-x-300-px-150-x-150-px.png" 
              alt="CQwealth Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-5xl font-bold text-gradient leading-tight">
              CQwealth
            </h1>
            <p className="text-xl font-semibold text-gradient">
              MLM Management Platform
            </p>
            <p className="text-[rgb(var(--fg))] opacity-70 leading-relaxed">
              Empower your network marketing business with our comprehensive platform. 
              Manage products, track commissions, monitor referrals, and grow your business efficiently.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="modern-card p-4 group">
                <div className="text-2xl mb-2">🚀</div>
                <div className="text-xs font-semibold text-[rgb(var(--fg))] mb-1">Easy Setup</div>
                <div className="text-xs text-[rgb(var(--fg))] opacity-60">Quick onboarding</div>
              </div>
              <div className="modern-card p-4 group">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-xs font-semibold text-[rgb(var(--fg))] mb-1">Track Earnings</div>
                <div className="text-xs text-[rgb(var(--fg))] opacity-60">Real-time updates</div>
              </div>
              <div className="modern-card p-4 group">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-xs font-semibold text-[rgb(var(--fg))] mb-1">Referral Tree</div>
                <div className="text-xs text-[rgb(var(--fg))] opacity-60">Visualize network</div>
              </div>
              <div className="modern-card p-4 group">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-xs font-semibold text-[rgb(var(--fg))] mb-1">Analytics</div>
                <div className="text-xs text-[rgb(var(--fg))] opacity-60">Detailed insights</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Mobile Logo - Only visible on small screens */}
          <div className="lg:hidden flex flex-col items-center mb-6 animate-fade-in">
            <div className="w-32 h-32 mb-4">
              <img 
                src="https://asmlm-production.up.railway.app/Logo-300-x-300-px-150-x-150-px.png" 
                alt="CQwealth Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              CQwealth
            </h1>
            <p className="text-base text-[rgb(var(--fg))] opacity-70 font-medium">MLM Management Platform</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="modern-card w-full p-8 animate-fade-in"
          >
            <h2 className="text-2xl font-bold mb-6 text-center text-gradient">Welcome Back</h2>

        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 text-green-600 px-3 py-2 text-sm">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-600 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Email Address</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="modern-input w-full"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modern-input w-full pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--fg))] opacity-50 hover:opacity-100 transition-opacity"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mb-6 text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-[rgb(var(--fg))] hover:opacity-70 transition-opacity"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-gradient-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Footer info for mobile */}
      <div className="lg:hidden mt-6 text-center">
        <p className="text-[rgb(var(--fg))] opacity-70 font-medium">Manage products, track commissions & grow your business</p>
      </div>
    </div>
      </div>
    </div>
  );
}
