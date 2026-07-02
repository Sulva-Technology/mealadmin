'use client';

import { useEffect, useRef } from 'react';
import { onMessage } from 'firebase/messaging';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { getMessagingIfSupported } from '@/lib/firebase';
import { enablePush } from '@/lib/push';
import { isPushConfigured } from '@/lib/env';

/**
 * Headless: mounted inside the authenticated shell. Responsibilities:
 *  1. Register this browser for FCM when the admin has push enabled.
 *  2. Surface foreground pushes as toasts and refresh the notification badge.
 *
 * Renders nothing. Safe to mount unconditionally — everything no-ops when push
 * is unconfigured or unsupported.
 */
export function PushRegistration() {
  const qc = useQueryClient();
  const toast = useToast();
  const registered = useRef(false);

  // Only auto-register when the account actually wants push.
  const prefsQuery = useApiQuery(
    ['notification-preferences'],
    () => api.getNotificationPreferences(),
    isPushConfigured,
  );
  const pushEnabled = prefsQuery.data?.data.pushEnabled;

  // Register the token once per session when push is enabled.
  useEffect(() => {
    if (!isPushConfigured || !pushEnabled || registered.current) return;
    registered.current = true;
    enablePush().then((result) => {
      if (result.status === 'error') registered.current = false; // allow a retry
    });
  }, [pushEnabled]);

  // Foreground message handling: FCM does not show a system notification while
  // the tab is focused, so we toast and invalidate the inbox ourselves.
  useEffect(() => {
    if (!isPushConfigured) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    getMessagingIfSupported().then((messaging) => {
      if (!messaging || cancelled) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || payload.data?.title;
        if (title) toast.info(title);
        qc.invalidateQueries({ queryKey: ['notifications'] });
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [qc, toast]);

  return null;
}
