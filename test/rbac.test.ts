import { describe, expect, it } from 'vitest';
import { canAccessRoute, canPerform, visibleNavGroups } from '@/lib/rbac';
import type { AdminSession } from '@/lib/types';

const session = (role: AdminSession['role']): AdminSession => ({
  userId: 'admin-1',
  role,
  campusId: role === 'super_admin' ? null : 'campus-1',
  scopes: [],
});

describe('admin RBAC helpers', () => {
  it('allows finance admins to manage payments and refunds but not admin membership', () => {
    const finance = session('finance_admin');

    expect(canAccessRoute(finance, '/payments')).toBe(true);
    expect(canAccessRoute(finance, '/refunds')).toBe(true);
    expect(canPerform(finance, 'payment.verify')).toBe(true);
    expect(canPerform(finance, 'refund.initiate')).toBe(true);
    expect(canAccessRoute(finance, '/admins')).toBe(false);
  });

  it('keeps read-only admins on read surfaces with sensitive actions disabled', () => {
    const readOnly = session('read_only_admin');

    expect(canAccessRoute(readOnly, '/payments')).toBe(true);
    expect(canAccessRoute(readOnly, '/audit-logs')).toBe(true);
    expect(canPerform(readOnly, 'payment.verify')).toBe(false);
    expect(canPerform(readOnly, 'refund.approve')).toBe(false);
  });

  it('hides unauthorized navigation items instead of relying on route blockers only', () => {
    const support = session('support_admin');
    const labels = visibleNavGroups(support).flatMap((group) => group.items.map((item) => item.name));

    expect(labels).toContain('Payments');
    expect(labels).toContain('Refunds');
    expect(labels).not.toContain('Settlements');
    expect(labels).not.toContain('Admins');
  });
});
