import { disablePush } from '@/lib/push';

/**
 * Signs the admin out: unregisters this browser's push token while the proxy
 * can still authenticate the DELETE, clears the cookie session, then redirects
 * to the login page.
 */
export async function logout(): Promise<void> {
  try {
    await disablePush();
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } finally {
    window.location.href = '/login';
  }
}
