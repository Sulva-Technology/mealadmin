import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

/**
 * Admin forgot-password. Forwards to the backend password-reset endpoint with
 * portal fixed to "admin". Runs unauthenticated (the user cannot sign in yet),
 * so it does not go through the authenticated /api/proxy route.
 */
export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 }
    );
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Email is required.' } },
      { status: 400 }
    );
  }

  const res = await fetch(`${API_BASE_URL}/auth/password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, portal: 'admin' }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return NextResponse.json(
      {
        error: data?.error ?? {
          code: String(res.status),
          message: 'Password reset request failed.',
        },
      },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true });
}
