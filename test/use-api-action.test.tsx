import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { useApiAction } from '@/lib/hooks';

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useApiAction double-submit guard', () => {
  it('drops mutate() calls while a mutation is in flight', async () => {
    let resolve!: (v: unknown) => void;
    const fn = vi.fn(() => new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useApiAction(fn), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.mutate();
      result.current.mutate(); // double-click in the same tick
      result.current.mutate();
    });

    expect(fn).toHaveBeenCalledTimes(1);

    await act(async () => { resolve({ ok: true }); });
    await waitFor(() => expect(result.current.isPending).toBe(false));

    // Once settled, a new intentional action goes through again.
    await act(async () => { result.current.mutate(); });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('re-arms after a failed mutation', async () => {
    const fn = vi.fn(() => Promise.reject(new Error('boom')));
    const { result } = renderHook(() => useApiAction(fn), { wrapper: makeWrapper() });

    act(() => { result.current.mutate(); });
    await waitFor(() => expect(result.current.isError).toBe(true));

    act(() => { result.current.mutate(); });
    await waitFor(() => expect(fn).toHaveBeenCalledTimes(2));
  });
});
