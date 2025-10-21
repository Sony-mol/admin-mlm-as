import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          otp, 
          newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset successfully! Please login with your new password.' 
            } 
          });
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] text-[rgb(var(--fg))] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
        <p className="text-sm text-[rgb(var(--muted-fg))] mb-6 text-center">
          Enter the OTP sent to your email and your new password.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-600 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 text-green-600 px-4 py-3 text-sm">
            ✓ Password reset successfully! Redirecting to login...
          </div>
        )}

        {!success && (
          <>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 px-4 py-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--fg))]/20"
              placeholder="you@example.com"
              required
            />

            <label className="block text-sm font-medium mb-2">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full mb-4 px-4 py-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--fg))]/20"
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              pattern="[0-9]{6}"
              required
            />

            <label className="block text-sm font-medium mb-2">New Password</label>
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--fg))]/20"
                placeholder="Enter new password"
                minLength="6"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
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

            <label className="block text-sm font-medium mb-2">Confirm New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mb-6 px-4 py-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--fg))]/20"
              placeholder="Confirm new password"
              minLength="6"
              required
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg px-4 py-3 font-medium border border-[rgb(var(--border))] disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: 'rgb(var(--fg))', color: 'rgb(var(--bg))' }}
            >
              {submitting ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </>
        )}

        <div className="mt-6 text-center space-y-2">
          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="text-[rgb(var(--fg))] hover:underline"
            >
              Didn't receive OTP? Resend
            </Link>
          </div>
          <div className="text-sm">
            <Link
              to="/login"
              className="text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

