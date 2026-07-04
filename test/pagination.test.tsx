import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCursorList } from '@/components/ui/Pagination';

describe('useCursorList', () => {
  it('uses backend previousCursor when available and falls back to local history', () => {
    const { result } = renderHook(() => useCursorList());

    act(() => result.current.goNext('cursor-2'));
    expect(result.current.cursor).toBe('cursor-2');

    act(() => result.current.goNext('cursor-3'));
    expect(result.current.cursor).toBe('cursor-3');

    act(() => result.current.goPrev('cursor-1'));
    expect(result.current.cursor).toBe('cursor-1');

    act(() => result.current.goNext('cursor-4'));
    act(() => result.current.goPrev());
    expect(result.current.cursor).toBe('cursor-1');
  });
});
