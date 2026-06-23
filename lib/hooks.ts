'use client';

import { useEffect, useState } from 'react';
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
 */
export function useApiAction<TData, TArgs = void>(
  fn: (args: TArgs) => Promise<TData>,
  opts: { invalidate?: QueryKey[]; success?: string; onSuccess?: (d: TData) => void } = {},
) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
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
  });
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
