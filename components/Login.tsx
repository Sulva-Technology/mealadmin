'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(data?.error?.message || 'Login failed. Check your credentials.');
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

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 dark:bg-ink">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-muted/10 dark:bg-ink"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-space font-bold text-ink dark:text-white">Admin Portal</h1>
          <p className="text-muted dark:text-muted mt-2">Sign in to Meal Direct mission control</p>
        </div>

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
            <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Password</label>
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

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl px-3 py-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-ink text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
