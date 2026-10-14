'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';

type ParsedLink = { accessToken: string | null; type: string | null; error: string | null };

function parseLink(hash: string, search: string): ParsedLink {
  const params = new URLSearchParams((hash.startsWith('#') ? hash.slice(1) : hash) || search);
  const errCode = params.get('error') || params.get('error_code');
  if (errCode) {
    const desc = params.get('error_description');
    return {
      accessToken: null,
      type: null,
      error:
        (desc || errCode).replace(/\+/g, ' ') ||
        'This link is invalid or has expired. Ask for a new one.',
    };
  }
  const accessToken = params.get('access_token');
  if (!accessToken) {
    return {
      accessToken: null,
      type: null,
      error: 'No sign-in information was found in this link. Ask for a new one.',
    };
  }
  return { accessToken, type: params.get('type'), error: null };
}

/**
 * Landing page for Supabase auth-email links sent to admins: an admin invite
 * (type=invite) or a password reset (type=recovery). Supabase puts a short-lived
 * session in the URL fragment:
 *   #access_token=…&refresh_token=…&expires_in=…&token_type=bearer&type=invite
 * or an error:
 *   #error=access_denied&error_code=otp_expired&error_description=…
 *
 * The admin sets a password here, then signs in normally so the login route
 * seeds the cookie session with their admin role.
 */
export default function AuthCallbackPage() {
  const [link, setLink] = useState<ParsedLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // The fragment only exists in the browser, so it is read once after mount.
  useEffect(() => {
    const parsed = parseLink(window.location.hash, window.location.search);
    // Strip the tokens from the URL so they never persist in history.
    window.history.replaceState(null, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLink(parsed);
  }, []);

  const accessToken = link?.accessToken ?? null;
  const linkType = link?.type ?? null;
  const checked = link !== null;
  const shownError = error ?? link?.error ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message || 'Could not set your password. Try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-3 bg-canvas border border-muted/20 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 dark:bg-ink focus:border-primary transition-all text-sm';

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 dark:bg-ink">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-muted/10 dark:bg-ink">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Meal Direct" width={64} height={64} priority className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg shadow-green-500/20" />
          <h1 className="text-2xl font-space font-bold text-ink dark:text-white">
            {linkType === 'recovery' ? 'Reset Password' : 'Set Up Your Admin Account'}
          </h1>
          <p className="text-muted mt-2">
            {done ? 'Your password is set.' : 'Choose a password to finish.'}
          </p>
        </div>

        {shownError && (
          <div role="alert" className="flex items-start gap-2 text-sm rounded-xl px-3 py-2 mb-5 text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{shownError}</span>
          </div>
        )}

        {done ? (
          <div className="space-y-5">
            <div className="flex items-start gap-2 text-sm rounded-xl px-3 py-2 text-primary-strong bg-success/10 border border-success/30">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Password saved. Sign in with your email and new password.</span>
            </div>
            <Link href="/login" className="block w-full text-center bg-primary text-white font-medium py-3 rounded-xl hover:opacity-90 transition-all">
              Go to sign in
            </Link>
          </div>
        ) : accessToken ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink dark:text-muted mb-1">New password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Confirm password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} required />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
              {submitting ? 'Saving…' : 'Save password'}
            </button>
          </form>
        ) : checked ? (
          <Link href="/login" className="block w-full text-center bg-primary text-white font-medium py-3 rounded-xl hover:opacity-90 transition-all">
            Back to sign in
          </Link>
        ) : null}
      </div>
    </div>
  );
}
