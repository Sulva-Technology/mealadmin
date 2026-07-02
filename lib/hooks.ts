'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useQuery, useMutation, useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api';

/** Read query. `key` must be stable + include all filter params. */
export function useApiQuery<T>(key: QueryKey, fetcher: () => Promise<T>, enabled = true) {
  return useQuery({ queryKey: key, queryFn: fetcher, enabled });
}

/**
 * Mutation wrapper: runs the action, toasts success/error, and invalidates the
 * given query keys so lists/details refetch authoritative state (never optimistic
 * for money/status — we refetch).
 *
 * Double-submit guard: while a mutation is in flight, further mutate() calls
 * are dropped. Each browser request gets its own Idempotency-Key in the proxy,
 * so a double-clicked refund/cancel/mark-paid would otherwise execute twice.
 * The guard uses a ref (set synchronously) because isPending only updates on
 * the next render — two clicks in the same tick would both pass an isPending check.
 */
export function useApiAction<TData, TArgs = void>(
  fn: (args: TArgs) => Promise<TData>,
  opts: { invalidate?: QueryKey[]; success?: string; onSuccess?: (d: TData) => void } = {},
) {
  const qc = useQueryClient();
  const toast = useToast();
  const inFlight = useRef(false);
  const mutation = useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      if (opts.success) toast.success(opts.success);
      opts.invalidate?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      opts.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Action failed.';
      toast.error(msg);
    },
    onSettled: () => {
      inFlight.current = false;
    },
  });

  const mutate: typeof mutation.mutate = (...args) => {
    if (inFlight.current) return;
    inFlight.current = true;
    mutation.mutate(...args);
  };

  return { ...mutation, mutate };
}

/** Debounce a fast-changing value (search inputs) before it hits a query key. */
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
