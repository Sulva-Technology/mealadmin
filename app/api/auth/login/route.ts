import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { API_BASE_URL } from '@/lib/api';

/**
 * Admin login.
 * 1. Exchange email/password with the Meal Direct backend (/v1/auth/admin/login).
 * 2. Seed the Supabase cookie session with the returned tokens so @supabase/ssr
 *    can refresh them automatically on subsequent requests.
 */
export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 }
    );
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Email and password are required.' } },
      { status: 400 }
    );
  }

  // 1. Authenticate against the backend.
  const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return NextResponse.json(
      {
        error: data?.error ?? {
          code: String(res.status),
          message: 'Login failed.',
        },
      },
      { status: res.status }
    );
  }

  const accessToken = data?.accessToken;
  const refreshToken = data?.refreshToken;
  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: { code: 'NO_TOKENS', message: 'Login response missing tokens.' } },
      { status: 502 }
    );
  }

  // 2. Persist as a Supabase cookie session.
  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return NextResponse.json(
      { error: { code: 'SESSION_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ user: data.user ?? null });
}
