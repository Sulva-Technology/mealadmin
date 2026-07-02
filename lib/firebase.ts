'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  isSupported,
  type Messaging,
} from 'firebase/messaging';
import { firebaseConfig, isPushConfigured } from '@/lib/env';

/**
 * Lazy, browser-only Firebase Messaging accessor.
 *
 * - Never runs during SSR (all callers are client components / effects).
 * - Returns null when push is not configured or the browser lacks support
 *   (Safari without the PWA flag, incognito, etc.) so callers can no-op.
 */

let appInstance: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp {
  if (appInstance) return appInstance;
  appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return appInstance;
}

export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (!isPushConfigured) return null;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return null;
  try {
    if (!(await isSupported())) return null;
    return getMessaging(getFirebaseApp());
  } catch {
    return null;
  }
}
