'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import type { AdminSession, Campus } from '@/lib/types';

type SessionCtx = {
  session?: AdminSession;
  isLoading: boolean;
  isSuperAdmin: boolean;
  campuses: Campus[];
  /** id -> campus name (falls back to the id). */
  campusName: (id?: string | null) => string;
  /** Active campus filter applied to scoped queries (null = all, super-admin only). */
  scopeCampusId: string | null;
  setScopeCampusId: (id: string | null) => void;
};

const Ctx = createContext<SessionCtx | null>(null);

export function useSession(): SessionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const sessionQ = useApiQuery(['session'], () => api.getSession());
  const campusesQ = useApiQuery(['campuses'], () => api.getCampuses({ limit: 100 }));

  const session = sessionQ.data?.data;
  const isSuperAdmin = session?.role === 'super_admin';
  const campusData = campusesQ.data?.data;

  // campus_admin is locked to its own campus; super_admin defaults to "all".
  const [scope, setScope] = useState<string | null>(null);
  const scopeCampusId = isSuperAdmin ? scope : session?.campusId ?? null;

  const value = useMemo<SessionCtx>(() => {
    const campuses = campusData ?? [];
    const map = new Map(campuses.map((c) => [c.id, c.name]));
    return {
      session,
      isLoading: sessionQ.isLoading,
      isSuperAdmin,
      campuses,
      campusName: (id) => (id ? map.get(id) ?? id : '—'),
      scopeCampusId,
      setScopeCampusId: setScope,
    };
  }, [session, sessionQ.isLoading, isSuperAdmin, campusData, scopeCampusId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
