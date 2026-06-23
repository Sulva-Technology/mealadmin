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
