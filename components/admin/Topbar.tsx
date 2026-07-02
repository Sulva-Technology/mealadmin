'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, MapPin, Moon, Sun, LogOut, ShieldCheck } from 'lucide-react';
import { useSession } from '@/lib/session';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { getUnreadNotificationCount } from '@/lib/notifications';
import { disablePush } from '@/lib/push';

export function Topbar() {
  const { session, isSuperAdmin, campuses, scopeCampusId, setScopeCampusId, campusName } = useSession();
  const [dark, setDark] = useState(false);
  const notifications = useApiQuery(
    ['notifications', { limit: 20 }],
    () => api.getNotifications({ limit: 20 }),
    Boolean(session),
  );
  const unreadCount = getUnreadNotificationCount(notifications.data?.data ?? []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const logout = async () => {
    try {
      // Unregister this browser's push token before the session is cleared,
      // while the proxy can still authenticate the DELETE.
      await disablePush();
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <header className="h-16 glass-nav shrink-0 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface/60 dark:bg-ink/40 border border-white/60 dark:border-white/10 rounded-lg text-sm font-medium">
        <MapPin className="w-4 h-4 text-primary" />
        {isSuperAdmin ? (
          <select
            value={scopeCampusId ?? ''}
            onChange={(e) => setScopeCampusId(e.target.value || null)}
            className="bg-transparent border-none outline-none cursor-pointer pr-2 font-space min-w-[150px]"
          >
            <option value="">All Campuses</option>
            {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <span className="font-space">{campusName(session?.campusId)}</span>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {session && (
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-primary-strong">
            <ShieldCheck className="w-3.5 h-3.5" />
            {session.role === 'super_admin' ? 'Super Admin' : 'Campus Admin'}
          </span>
        )}

        <button onClick={() => setDark((d) => !d)} className="p-2 hover:bg-canvas dark:hover:bg-ink/60 rounded-lg text-muted">
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <Link href="/notifications" className="relative p-2 hover:bg-canvas dark:hover:bg-ink/60 rounded-lg text-muted">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3 pl-2 md:pl-4 md:border-l border-muted/20">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-ink dark:text-white">{session?.email ?? 'Admin'}</p>
            <button onClick={logout} className="text-xs text-muted hover:text-danger transition-colors inline-flex items-center gap-1">
              <LogOut className="w-3 h-3" /> Sign out
            </button>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-success flex items-center justify-center text-white shadow-sm">
            {(session?.email ?? 'A').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
