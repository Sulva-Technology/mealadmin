import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 * In Next.js 15 `cookies()` is async.
 *
 * Session cookies are forced httpOnly: no client-side Supabase client exists
 * (all data access goes through /api/proxy), so the browser never needs to
 * read them and XSS cannot exfiltrate the tokens.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
              })
            );
          } catch {
            // Called from a Server Component — cookies are read-only there.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  );
}
