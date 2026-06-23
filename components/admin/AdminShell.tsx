'use client';

import { type ReactNode } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { QueryProvider } from '@/lib/query';
import { ToastProvider } from '@/components/ui/Toast';
import { SessionProvider, useSession } from '@/lib/session';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Button } from '@/components/ui/Button';

function Gate({ children }: { children: ReactNode }) {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-muted">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading session…
      </div>
    );
  }

  // Authenticated (middleware ensured a session) but not an admin -> role gate.
  if (!session) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center gap-4 px-6">
        <ShieldAlert className="w-12 h-12 text-danger" />
        <div>
          <h1 className="text-xl font-space font-bold text-ink dark:text-white">Admin access required</h1>
          <p className="text-muted text-sm mt-1 max-w-sm">
            This account has no admin role for Meal Direct. Contact a super admin to be granted access.
          </p>
        </div>
        <Button variant="subtle" onClick={() => { window.location.href = '/login'; }}>
          Sign in with another account
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas dark:bg-ink">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        <SessionProvider>
          <Gate>{children}</Gate>
        </SessionProvider>
      </ToastProvider>
    </QueryProvider>
  );
}
