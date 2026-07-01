import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('unit types api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reads, creates, and patches unit types through the admin proxy', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ data: [] }));

    await api.getUnitTypes({ limit: 100 });
    await api.createUnitType({ code: 'spoon', displayName: 'Spoon', countsTowardSpoonLimit: true });
    await api.updateUnitType('unit-1', { displayName: 'Big Spoon', countsTowardSpoonLimit: false });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/proxy/admin/unit-types?limit=100',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/proxy/admin/unit-types',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: 'spoon', displayName: 'Spoon', countsTowardSpoonLimit: true }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/proxy/admin/unit-types/unit-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ displayName: 'Big Spoon', countsTowardSpoonLimit: false }),
      }),
    );
  });

  it('patches only the active flag when toggling', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ data: { id: 'unit-1', active: false } }));

    await api.updateUnitType('unit-1', { active: false });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/proxy/admin/unit-types/unit-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ active: false }),
      }),
    );
  });
});
