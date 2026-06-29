'use client';

import { useSession } from '@/lib/session';
import { PageHeader, Card, Field } from '@/components/ui/Page';

export default function SettingsPage() {
  const { session, campusName } = useSession();

  return (
    <>
      <PageHeader title="Settings" subtitle="Your admin session and scope." />
      <Card className="p-6 max-w-xl">
        <dl>
          <Field label="Email">{session?.email ?? '—'}</Field>
          <Field label="User ID">{session?.userId}</Field>
          <Field label="Role">{session?.role === 'super_admin' ? 'Super Admin' : 'Campus Admin'}</Field>
          <Field label="Campus Scope">{session?.campusId ? campusName(session.campusId) : 'All campuses (global)'}</Field>
          <Field label="Scopes">{session?.scopes.join(', ')}</Field>
        </dl>
        <p className="text-xs text-muted mt-4">
          Profile editing (<code>/v1/me</code>) is user-scoped and outside the admin contract.
          Notification preferences are managed from the Notifications page.
        </p>
      </Card>
    </>
  );
}
