'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { REVIEW_STATUSES, type Review } from '@/lib/types';
import { formatDate, titleize } from '@/lib/format';
import { PageHeader, Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { FilterSelect } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination, useCursorList } from '@/components/ui/Pagination';

const ratings = (r: Review) =>
  [r.foodRating, r.vendorRating, r.deliveryRating].map((x) => (x == null ? '—' : `${x}★`)).join(' / ');

export default function ReviewsPage() {
  const { scopeCampusId } = useSession();
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const pager = useCursorList();

  const params = {
    campusId: scopeCampusId ?? undefined,
    status: status || undefined,
    rating: rating || undefined,
    limit: pager.limit,
    cursor: pager.cursor,
  };
  const query = useApiQuery(['reviews', JSON.stringify(params)], () => api.getReviews(params));

  const moderate = useApiAction(
    ({ id, next }: { id: string; next: 'approved' | 'rejected' }) => api.moderateReview(id, next),
    { invalidate: [['reviews']], success: 'Review moderated.' },
  );

  const columns: Column<Review>[] = [
    { header: 'Ratings', render: (r) => <span className="font-medium">{ratings(r)}</span> },
    { header: 'Comment', render: (r) => <span className="text-muted line-clamp-2 max-w-md">{r.comment ?? '—'}</span> },
    { header: 'Status', render: (r) => <StatusBadge status={r.moderationStatus} /> },
    { header: 'Date', render: (r) => formatDate(r.createdAt) },
    {
      header: '', align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" disabled={r.moderationStatus === 'approved'} onClick={() => moderate.mutate({ id: r.id, next: 'approved' })}>Approve</Button>
          <Button size="sm" variant="danger" disabled={r.moderationStatus === 'rejected'} onClick={() => moderate.mutate({ id: r.id, next: 'rejected' })}>Reject</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Reviews" subtitle="Moderate customer reviews." />
      <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
        <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); pager.reset(); }}>
          <option value="">All statuses</option>
          {REVIEW_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
        </FilterSelect>
        <FilterSelect value={rating} onChange={(e) => { setRating(e.target.value); pager.reset(); }}>
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </FilterSelect>
      </div>
      <Card className="overflow-hidden">
        <AsyncBoundary query={query} empty="No reviews match these filters." isEmpty={(d) => d.data.length === 0}>
          {(d) => (
            <>
              <DataTable columns={columns} rows={d.data} rowKey={(r) => r.id} />
              <Pagination pagination={d.pagination} count={d.data.length} limit={pager.limit} onLimit={pager.setLimit} canPrev={pager.canPrev} onPrev={pager.goPrev} onNext={pager.goNext} />
            </>
          )}
        </AsyncBoundary>
      </Card>
    </>
  );
}
