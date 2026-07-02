import { describe, expect, it } from 'vitest';
import { isSafeProxyPath } from '@/lib/proxy-guard';

describe('isSafeProxyPath', () => {
  it('allows the backend areas the admin UI uses', () => {
    expect(isSafeProxyPath(['admin', 'orders'])).toBe(true);
    expect(isSafeProxyPath(['auth', 'me'])).toBe(true);
    expect(isSafeProxyPath(['notifications', 'read-all'])).toBe(true);
    expect(isSafeProxyPath(['me', 'device-tokens', 'tok'])).toBe(true);
  });

  it('refuses roots outside the allowlist', () => {
    expect(isSafeProxyPath(['payments'])).toBe(false);
    expect(isSafeProxyPath(['vendor', 'orders'])).toBe(false);
    expect(isSafeProxyPath([])).toBe(false);
  });

  it('refuses dot segments and separators that could escape the API prefix', () => {
    expect(isSafeProxyPath(['admin', '..', 'internal'])).toBe(false);
    expect(isSafeProxyPath(['admin', '.'])).toBe(false);
    expect(isSafeProxyPath(['admin', ''])).toBe(false);
    expect(isSafeProxyPath(['admin', 'a/b'])).toBe(false);
    expect(isSafeProxyPath(['admin', 'a\\b'])).toBe(false);
  });
});
