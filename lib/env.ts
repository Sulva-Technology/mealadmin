/**
 * Fail fast with a clear message when required public env vars are missing,
 * instead of an opaque crash deep inside the Supabase client.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Set it in .env.local (see .env.example).`
    );
  }
  return value;
}

export const env = {
  SUPABASE_URL: required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY: required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.mealdirectly.com/v1',
};

/**
 * Firebase Cloud Messaging config for web push.
 *
 * All of these are public by design (they ship in the client bundle and in the
 * service worker), so they are not secrets. Push is optional: if the config or
 * VAPID key is absent, registration no-ops instead of throwing (see lib/push).
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
};

/** VAPID public key (Firebase Console → Cloud Messaging → Web Push certificates). */
export const FIREBASE_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? '';

/** True only when enough config is present to attempt FCM registration. */
export const isPushConfigured =
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && FIREBASE_VAPID_KEY);
