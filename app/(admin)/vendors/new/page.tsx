'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { PageHeader, Card } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { TextField, Select } from '@/components/ui/Inputs';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function VendorNewPage() {
  const router = useRouter();
  const { campuses, isSuperAdmin, session } = useSession();
  const lockedCampus = isSuperAdmin ? '' : session?.campusId ?? '';

  const [campusId, setCampusId] = useState(lockedCampus);
  const [legalName, setLegalName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugDirty, setSlugDirty] = useState(false);

  const create = useApiAction(
    () => api.createVendor({ campusId, legalName, displayName, slug }),
    {
      invalidate: [['vendors']],
      success: 'Vendor created.',
      onSuccess: (res) => router.push(`/vendors/${res.data.id}`),
    },
  );

  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const valid = campusId && legalName.length >= 2 && displayName.length >= 2 && validSlug;

  return (
    <>
      <PageHeader title="Onboard Vendor" backHref="/vendors" />
      <Card className="p-6 max-w-xl">
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); if (valid) create.mutate(); }}
        >
          <Select
            label="Campus" value={campusId} onChange={(e) => setCampusId(e.target.value)}
            disabled={!isSuperAdmin} required
          >
            <option value="" disabled>Select campus</option>
            {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <TextField
            label="Legal name" value={legalName} minLength={2} maxLength={160} required
            onChange={(e) => setLegalName(e.target.value)}
          />
          <TextField
            label="Display name" value={displayName} minLength={2} maxLength={120} required
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (!slugDirty) setSlug(slugify(e.target.value));
            }}
          />
          <TextField
            label="Slug" value={slug} required
            hint={slug && !validSlug ? 'Lowercase letters, numbers and single hyphens only.' : 'Used in URLs.'}
            onChange={(e) => { setSlugDirty(true); setSlug(e.target.value); }}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => router.push('/vendors')}>Cancel</Button>
            <Button type="submit" loading={create.isPending} disabled={!valid}>Create Vendor</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
