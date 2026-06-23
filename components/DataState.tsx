'use client';

import { ReactNode } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { LoadStatus } from '@/store/useAppStore';

type DataStateProps = {
  status: LoadStatus;
  error: string | null;
  isEmpty: boolean;
  onRetry?: () => void;
  emptyLabel?: string;
  children: ReactNode;
};

/**
 * Gates a data region on its fetch lifecycle so the UI never silently shows
 * stale or empty data as if it were real. Renders spinner / error+retry /
 * empty, otherwise the children.
 */
export function DataState({
  status,
  error,
  isEmpty,
  onRetry,
  emptyLabel = 'Nothing to show yet.',
  children,
}: DataStateProps) {
  if (status === 'loading' || (status === 'idle' && isEmpty)) {
    return (
      <div className="p-12 flex items-center justify-center text-muted dark:text-muted">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
        <AlertCircle className="w-8 h-8 text-danger" />
        <p className="text-sm text-ink dark:text-white font-medium">Couldn’t load data</p>
        <p className="text-xs text-muted dark:text-muted max-w-sm">
          {error || 'Something went wrong fetching from the server.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="p-12 text-center text-muted dark:text-muted">{emptyLabel}</div>
    );
  }

  return <>{children}</>;
}
