/**
 * Path guard for /api/proxy.
 *
 * Only backend areas the admin UI actually uses may be proxied. Everything
 * else (payments ops, promotions, vendor/rider app surfaces, ...) is refused
 * even though the backend still enforces its own authz.
 */
const ALLOWED_ROOTS = new Set(['admin', 'auth', 'notifications', 'me']);

/** Reject empty/dot segments so the joined path cannot escape API_BASE_URL's prefix. */
export function isSafeProxyPath(path: string[]): boolean {
  if (path.length === 0 || !ALLOWED_ROOTS.has(path[0])) return false;
  return path.every(
    (seg) => seg !== '' && seg !== '.' && seg !== '..' && !seg.includes('/') && !seg.includes('\\')
  );
}
