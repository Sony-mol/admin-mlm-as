import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const from = useLocation().state?.from?.pathname || '/';

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
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow"
      >
        <h2 className="text-xl font-semibold mb-4 text-center">Sign in</h2>

        {error && (
          <div className="mb-3 rounded-lg border border-[rgb(var(--border))] bg-red-500/10 text-red-600 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <label className="block text-sm mb-1">Email</label>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
          placeholder="you@example.com"
          required
        />

        <label className="block text-sm mb-1">Password</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
          placeholder="••••••••"
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg px-3 py-2 font-medium border border-[rgb(var(--border))] disabled:opacity-60"
          style={{ background: 'rgb(var(--fg))', color: 'rgb(var(--bg))' }}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
