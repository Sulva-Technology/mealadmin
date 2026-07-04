'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination as PaginationMeta } from '@/lib/types';
import { Button } from './Button';
import { FilterSelect } from './Inputs';

/**
 * Cursor pagination state. The admin list endpoints accept `cursor`+`limit` and
 * return `pagination.hasMore`; `nextCursor` is emitted only when the backend
 * supports it. We keep a cursor history so Prev works once Next is possible.
 */
export function useCursorList(initialLimit = 20) {
  const [limit, setLimitRaw] = useState(initialLimit);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [stack, setStack] = useState<(string | undefined)[]>([]);

  const goNext = (nextCursor?: string) => {
    if (!nextCursor) return;
    setStack((s) => [...s, cursor]);
    setCursor(nextCursor);
  };
  const goPrev = (previousCursor?: string) => {
    if (previousCursor !== undefined) {
      setCursor(previousCursor || undefined);
      setStack((s) => s.slice(0, -1));
      return;
    }
    setStack((s) => {
      if (s.length === 0) return s;
      const copy = [...s];
      const prev = copy.pop();
      setCursor(prev);
      return copy;
    });
  };
  const reset = () => { setCursor(undefined); setStack([]); };
  const setLimit = (n: number) => { setLimitRaw(n); reset(); };

  return { limit, setLimit, cursor, canPrev: stack.length > 0, goNext, goPrev, reset };
}

export function Pagination({
  pagination, count, limit, onLimit, canPrev, onPrev, onNext,
}: {
  pagination?: PaginationMeta;
  count: number;
  limit: number;
  onLimit: (n: number) => void;
  canPrev: boolean;
  onPrev: (previousCursor?: string) => void;
  onNext: (nextCursor?: string) => void;
}) {
  const hasMore = pagination?.hasMore ?? false;
  const nextCursor = pagination?.nextCursor;
  const previousCursor = pagination?.previousCursor;
  const total = pagination?.total;
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-muted/10 text-sm">
      <div className="flex items-center gap-2 text-muted">
        <span>{count} shown{typeof total === 'number' ? ` of ${total}` : ''}</span>
        <FilterSelect value={limit} onChange={(e) => onLimit(Number(e.target.value))}>
          {[20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </FilterSelect>
        {hasMore && !nextCursor && (
          <span className="text-xs text-warning">more exist — raise page size</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={!canPrev && !previousCursor} onClick={() => onPrev(previousCursor)}>
          <ChevronLeft className="w-4 h-4" /> Prev
        </Button>
        <Button size="sm" variant="outline" disabled={!hasMore || !nextCursor} onClick={() => onNext(nextCursor)}>
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
