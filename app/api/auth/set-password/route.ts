import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

/**
 * Set a password from an emailed link (admin invite or password reset). The
 * /auth/callback page hands over the short-lived access token Supabase put in
 * the link; the backend validates it and sets the password. Runs
 * unauthenticated, so it does not go through the authenticated /api/proxy route.
 */
export async function POST(request: Request) {
  let body: { accessToken?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 }
    );
  }

  const { accessToken, password } = body;
  if (!accessToken || !password) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Token and password are required.' } },
      { status: 400 }
    );
  }

  const res = await fetch(`${API_BASE_URL}/auth/update-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, password }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return NextResponse.json(
      {
        error: data?.error ?? {
          code: String(res.status),
          message: 'Could not set your password.',
        },
      },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true });
}
