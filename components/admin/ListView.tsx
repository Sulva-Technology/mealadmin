'use client';

import { useEffect, type ReactNode } from 'react';
import type { ListEnvelope } from '@/lib/types';
import type { Query } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { Card } from '@/components/ui/Page';
import { AsyncBoundary } from '@/components/ui/Page';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination, useCursorList } from '@/components/ui/Pagination';

/**
 * Drives a paginated admin list: owns cursor/limit, merges parent filter
 * `params` into the request + query key, and renders toolbar + table + paging.
 */
export function ListView<T>({
  baseKey, params, fetch, columns, rowKey, rowHref, empty, toolbar,
}: {
  baseKey: string;
  params: Query;
  fetch: (q: Query) => Promise<ListEnvelope<T>>;
  columns: Column<T>[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  empty: string;
  toolbar?: ReactNode;
}) {
  const pager = useCursorList();
  const paramSig = JSON.stringify(params);

  // Reset paging whenever filters change.
  useEffect(() => { pager.reset(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [paramSig]);

  const q: Query = { ...params, limit: pager.limit, cursor: pager.cursor };
  const query = useApiQuery<ListEnvelope<T>>([baseKey, paramSig, pager.cursor, pager.limit], () => fetch(q));

  return (
    <>
      {toolbar && <div className="mb-4">{toolbar}</div>}
      <Card className="overflow-hidden">
        <AsyncBoundary query={query} empty={empty} isEmpty={(d) => d.data.length === 0}>
          {(data) => (
            <>
              <DataTable columns={columns} rows={data.data} rowKey={rowKey} rowHref={rowHref} />
              <Pagination
                pagination={data.pagination}
                count={data.data.length}
                limit={pager.limit}
                onLimit={pager.setLimit}
                canPrev={pager.canPrev}
                onPrev={pager.goPrev}
                onNext={pager.goNext}
              />
            </>
          )}
        </AsyncBoundary>
      </Card>
    </>
  );
}
