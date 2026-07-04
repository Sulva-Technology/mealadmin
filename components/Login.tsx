'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (next: 'login' | 'forgot') => {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // 401 → generic credential error; 403 → surface the server's message
        // (e.g. account disabled / not an admin).
        if (res.status === 401) {
          setError('Invalid email or password.');
        } else if (res.status === 403) {
          setError(data?.error?.message || 'Access denied.');
        } else {
          setError(data?.error?.message || 'Login failed. Check your credentials.');
        }
        return;
      }
      // Session cookie is set; go to the dashboard.
      router.replace('/');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message || 'Could not send reset link. Try again.');
        return;
      }
      setNotice("If an admin account exists for that email, we've sent a password reset link.");
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 dark:bg-ink">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-muted/10 dark:bg-ink"
      >
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Meal Direct" width={64} height={64} priority className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg shadow-green-500/20" />

          <h1 className="text-2xl font-space font-bold text-ink dark:text-white">
            {mode === 'login' ? 'Admin Portal' : 'Reset Password'}
          </h1>
          <p className="text-muted dark:text-muted mt-2">
            {mode === 'login'
              ? 'Sign in to Meal Direct mission control'
              : 'Enter your admin email to receive a reset link.'}
          </p>
        </div>

        {(error || notice) && (
          <div
            role="alert"
            className={`flex items-start gap-2 text-sm rounded-xl px-3 py-2 mb-5 ${
              error
                ? 'text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40'
                : 'text-primary-strong bg-success/10 border border-success/30'
            }`}
          >
            {error ? (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <span>{error ?? notice}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mealdirect.com"
                  className="w-full pl-10 pr-4 py-3 bg-canvas border border-muted/20 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 dark:bg-ink dark:border-muted/50/20 focus:border-primary transition-all font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-ink dark:text-muted">Password</label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-canvas border border-muted/20 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 dark:bg-ink dark:border-muted/50/20 focus:border-primary transition-all font-mono text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-ink text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mealdirect.com"
                  className="w-full pl-10 pr-4 py-3 bg-canvas border border-muted/20 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 dark:bg-ink dark:border-muted/50/20 focus:border-primary transition-all font-mono text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-ink text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full flex items-center justify-center gap-1 text-sm text-muted hover:text-ink dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
