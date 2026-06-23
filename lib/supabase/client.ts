import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

/**
 * Supabase client for use in Client Components.
 * Points at the same Supabase project the Meal Direct backend issues tokens from,
 * so sessions established via /api/auth/login are refreshable here.
 */
export function createClient() {
  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
