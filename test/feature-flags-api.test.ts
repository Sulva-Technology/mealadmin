import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('feature flags api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reads flags and patches a flag mode through the admin proxy', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ data: [] }));

    await api.getFeatureFlags();
    await api.setFeatureFlagMode('cloud_printing', 'test');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/proxy/admin/feature-flags',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/proxy/admin/feature-flags/cloud_printing',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ mode: 'test' }) }),
    );
  });

  it('lists, adds and removes testers', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ data: { id: 'tester-1' } }));

    await api.getFeatureTesters();
    await api.addFeatureTester({ subjectType: 'vendor', subjectId: 'vendor-1', note: 'printer pilot' });
    await api.removeFeatureTester('tester-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/proxy/admin/feature-testers',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/proxy/admin/feature-testers',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ subjectType: 'vendor', subjectId: 'vendor-1', note: 'printer pilot' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/proxy/admin/feature-testers/tester-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
