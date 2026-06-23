'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { ApiError } from '@/lib/api';

export function PageHeader({
  title, subtitle, actions, backHref,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backHref?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        {backHref && (
          <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
        )}
        <h1 className="text-2xl md:text-3xl font-space font-bold tracking-tight text-ink dark:text-white">{title}</h1>
        {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass-card rounded-3xl ${className}`}>{children}</div>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="text-sm font-medium text-muted">{label}</h3>
      <p className="text-2xl font-space font-bold text-ink dark:text-white mt-1">{value}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

/** Definition row for detail pages. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-3 border-b border-muted/10 last:border-0">
      <dt className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-ink dark:text-white mt-1 break-words">{children ?? '—'}</dd>
    </div>
  );
}

/**
 * Gates a query-backed region: spinner while loading, error+retry on failure,
 * optional empty state. Render-prop receives the resolved data.
 */
export function AsyncBoundary<T>({
  query, children, empty, isEmpty,
}: {
  query: { isLoading: boolean; isError: boolean; error: unknown; data?: T; refetch: () => void };
  children: (data: T) => ReactNode;
  empty?: string;
  isEmpty?: (data: T) => boolean;
}) {
  if (query.isLoading) {
    return (
      <div className="p-12 flex items-center justify-center text-muted">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }
  if (query.isError || query.data === undefined) {
    const msg = query.error instanceof ApiError ? query.error.message : 'Failed to load from server.';
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
        <AlertCircle className="w-8 h-8 text-danger" />
        <p className="text-sm font-medium text-ink dark:text-white">Couldn’t load data</p>
        <p className="text-xs text-muted max-w-sm">{msg}</p>
        <Button size="sm" variant="subtle" onClick={() => query.refetch()}>
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }
  if (empty && isEmpty?.(query.data)) {
    return <div className="p-12 text-center text-muted">{empty}</div>;
  }
  return <>{children(query.data)}</>;
}
