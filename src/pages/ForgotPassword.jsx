import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to reset password page after 2 seconds
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 2000);
      } else {
        setError(data.error || 'Failed to send OTP');
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
        <h2 className="text-2xl font-bold mb-2 text-center">Forgot Password</h2>
        <p className="text-sm text-[rgb(var(--muted-fg))] mb-6 text-center">
          Enter your email address and we'll send you an OTP to reset your password.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-600 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 text-green-600 px-4 py-3 text-sm">
            ✓ OTP sent successfully! Redirecting to reset password page...
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
              className="w-full mb-6 px-4 py-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--fg))]/20"
              placeholder="you@example.com"
              required
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg px-4 py-3 font-medium border border-[rgb(var(--border))] disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: 'rgb(var(--fg))', color: 'rgb(var(--bg))' }}
            >
              {submitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </>
        )}

        <div className="mt-6 text-center text-sm">
          <Link
            to="/login"
            className="text-[rgb(var(--fg))] hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}

