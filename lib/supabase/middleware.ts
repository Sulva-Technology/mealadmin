import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase auth token on every request and enforces route protection.
 *
 * IMPORTANT: never trust getSession() in middleware. Use getClaims(), which
 * revalidates the token. Do not run code between createServerClient and getClaims.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const isAuthed = !!data?.claims;

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === '/login';
  // API routes must return JSON (the proxy enforces its own 401); never redirect them.
  const isApi = pathname.startsWith('/api');

  // Unauthenticated user trying to reach a protected page -> /login
  if (!isAuthed && !isLoginRoute && !isApi) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated user on the login page -> dashboard
  if (isAuthed && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
