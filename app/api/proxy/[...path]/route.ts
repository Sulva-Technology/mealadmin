import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { API_BASE_URL } from '@/lib/api';
import { isSafeProxyPath } from '@/lib/proxy-guard';

/**
 * Authenticated proxy to the Meal Direct backend.
 *
 * Browser -> /api/proxy/<path> -> <API_BASE_URL>/<path>
 *
 * - Injects the Authorization bearer from the Supabase cookie session, so the
 *   access token never lives in browser-accessible JS.
 * - Adds an Idempotency-Key on mutating verbs (required by the spec for orders,
 *   payments, refunds, etc).
 * - Keeps the backend origin off the browser, sidestepping CORS.
 */

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function handle(request: NextRequest, path: string[]) {
  if (!isSafeProxyPath(path)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN_PATH', message: 'Path not allowed through this proxy.' } },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  // getClaims() revalidates the token; it is the authorization gate.
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: 'No active session.' } },
      { status: 401 }
    );
  }

  // The raw token is only forwarded; the backend re-validates it.
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    return NextResponse.json(
      { error: { code: 'NO_TOKEN', message: 'Session has no access token.' } },
      { status: 401 }
    );
  }

  const search = request.nextUrl.search;
  const url = `${API_BASE_URL}/${path.join('/')}${search}`;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Accept', 'application/json');

  const method = request.method.toUpperCase();
  let body: string | undefined;
  if (MUTATING.has(method)) {
    body = await request.text();
    if (body) headers.set('Content-Type', 'application/json');
    // Idempotency-Key required by the spec for important mutations.
    headers.set(
      'Idempotency-Key',
      request.headers.get('Idempotency-Key') ?? crypto.randomUUID()
    );
  }

  const upstream = await fetch(url, {
    method,
    headers,
    body,
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
    },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(request, path);
}
export async function POST(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(request, path);
}
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(request, path);
}
export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(request, path);
}
export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(request, path);
}
