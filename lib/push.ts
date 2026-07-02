'use client';

import { getToken, deleteToken } from 'firebase/messaging';
import { api } from '@/lib/api';
import { FIREBASE_VAPID_KEY } from '@/lib/env';
import { getMessagingIfSupported } from '@/lib/firebase';

/**
 * Web push (FCM) registration for the admin app.
 *
 * The whole surface is defensive: anything unsupported/blocked resolves to a
 * status instead of throwing, so the UI can call these fire-and-forget.
 */

const SW_URL = '/firebase-messaging-sw.js';
/** Remember the last token we registered so logout can unregister the right one. */
const TOKEN_STORAGE_KEY = 'md.fcmToken';

export type PushResult =
  | { status: 'registered'; token: string }
  | { status: 'unsupported' }
  | { status: 'denied' }
  | { status: 'error'; error: unknown };

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(SW_URL, { scope: '/' });
  } catch {
    return null;
  }
}

/**
 * Ask for notification permission (if not decided), obtain an FCM token, and
 * register it with the backend (`POST /me/device-tokens`). Idempotent: FCM
 * returns a stable token per browser, so re-calling just re-affirms it.
 */
export async function enablePush(): Promise<PushResult> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return { status: 'unsupported' };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { status: 'denied' };

    const swRegistration = await registerServiceWorker();
    if (!swRegistration) return { status: 'unsupported' };

    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
    if (!token) return { status: 'error', error: new Error('Empty FCM token') };

    await api.registerDeviceToken({ token, platform: 'web' });
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      /* private mode / storage disabled — non-fatal */
    }
    return { status: 'registered', token };
  } catch (error) {
    return { status: 'error', error };
  }
}

/**
 * Unregister the current device token (call on logout or when the user turns
 * push off). Best-effort: swallows failures so it never blocks sign-out.
 */
export async function disablePush(): Promise<void> {
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }

  if (token) {
    try {
      await api.removeDeviceToken(token);
    } catch {
      /* backend may already be unreachable during logout — ignore */
    }
  }

  try {
    const messaging = await getMessagingIfSupported();
    if (messaging) await deleteToken(messaging);
  } catch {
    /* ignore */
  }

  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
