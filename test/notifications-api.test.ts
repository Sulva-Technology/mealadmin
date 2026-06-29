import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('notifications api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the user-scoped notification proxy endpoints', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ data: [] }));

    await (api as any).getNotifications({ limit: 10 });
    await (api as any).markNotificationRead('notification-1');
    await (api as any).markAllNotificationsRead();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/proxy/notifications?limit=10',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/proxy/notifications/notification-1/read',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/proxy/notifications/read-all',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
  });

  it('updates preferences and registers device tokens through current-user routes', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ data: { pushEnabled: true } }));

    await (api as any).updateNotificationPreferences({ pushEnabled: true });
    await (api as any).registerDeviceToken({ token: 'expo-token', platform: 'web' });
    await (api as any).removeDeviceToken('expo-token');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/proxy/notifications/preferences',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ pushEnabled: true }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/proxy/me/device-tokens',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'expo-token', platform: 'web' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/proxy/me/device-tokens/expo-token',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
