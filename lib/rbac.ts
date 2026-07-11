import type { AdminRole, AdminSession } from '@/lib/types';

export type AdminAction =
  | 'payment.verify'
  | 'payment.review'
  | 'refund.approve'
  | 'refund.reject'
  | 'refund.initiate'
  | 'refund.retry'
  | 'refund.resolve'
  | 'webhook.retry'
  | 'webhook.review'
  | 'settlement.write'
  | 'vendor.approve'
  | 'rider.manage'
  | 'admin.manage'
  | 'support.note'
  | 'support.escalate'
  | 'support.resolve'
  | 'order.transition'
  | 'order.cancel';

export type NavItem = {
  name: string;
  href: string;
  icon: string;
  roles?: AdminRole[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const ALL_ROLES: AdminRole[] = [
  'super_admin',
  'finance_admin',
  'operations_admin',
  'support_admin',
  'campus_admin',
  'read_only_admin',
];

const FINANCE_ROLES: AdminRole[] = ['super_admin', 'finance_admin'];
const OPS_ROLES: AdminRole[] = ['super_admin', 'operations_admin', 'campus_admin'];
const SUPPORT_ROLES: AdminRole[] = ['super_admin', 'support_admin', 'operations_admin', 'campus_admin'];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ALL_ROLES },
      { name: 'Orders', href: '/orders', icon: 'ShoppingCart', roles: ALL_ROLES },
      { name: 'Batches', href: '/batches', icon: 'Boxes', roles: OPS_ROLES },
      { name: 'Inventory', href: '/inventory', icon: 'Package', roles: OPS_ROLES },
      { name: 'Reconciliation', href: '/reconciliation', icon: 'ListChecks', roles: ['super_admin', 'finance_admin', 'operations_admin', 'support_admin'] },
    ],
  },
  {
    label: 'Network',
    items: [
      { name: 'Vendors', href: '/vendors', icon: 'Store', roles: ALL_ROLES },
      { name: 'Riders', href: '/riders', icon: 'Bike', roles: OPS_ROLES },
      { name: 'Users', href: '/users', icon: 'Users', roles: ALL_ROLES },
    ],
  },
  {
    label: 'Finance & Quality',
    items: [
      { name: 'Payments', href: '/payments', icon: 'CreditCard', roles: ['super_admin', 'finance_admin', 'support_admin', 'operations_admin', 'read_only_admin'] },
      { name: 'Refunds', href: '/refunds', icon: 'Undo2', roles: ['super_admin', 'finance_admin', 'support_admin', 'read_only_admin'] },
      { name: 'Money', href: '/finance', icon: 'Wallet', roles: FINANCE_ROLES },
      { name: 'Settlements', href: '/settlements', icon: 'Banknote', roles: FINANCE_ROLES },
      { name: 'Escalations', href: '/escalations', icon: 'AlertTriangle', roles: SUPPORT_ROLES },
      { name: 'Reviews', href: '/reviews', icon: 'Star', roles: SUPPORT_ROLES },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Analytics', href: '/analytics', icon: 'BarChart3', roles: ['super_admin', 'finance_admin', 'operations_admin', 'campus_admin', 'read_only_admin'] },
      { name: 'Audit Logs', href: '/audit-logs', icon: 'ScrollText', roles: ['super_admin', 'finance_admin', 'read_only_admin'] },
      { name: 'System Health', href: '/health', icon: 'Activity', roles: ['super_admin', 'finance_admin', 'operations_admin'] },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { name: 'Campuses', href: '/campuses', icon: 'MapPin', roles: ['super_admin', 'operations_admin', 'read_only_admin'] },
      { name: 'Unit Types', href: '/unit-types', icon: 'Ruler', roles: ['super_admin', 'operations_admin', 'read_only_admin'] },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Admins', href: '/admins', icon: 'ShieldCheck', roles: ['super_admin'] },
      { name: 'Notifications', href: '/notifications', icon: 'Bell', roles: ALL_ROLES },
      { name: 'Settings', href: '/settings', icon: 'Settings', roles: ['super_admin', 'operations_admin'] },
    ],
  },
];

const ACTION_ROLES: Record<AdminAction, AdminRole[]> = {
  'payment.verify': FINANCE_ROLES,
  'payment.review': ['super_admin', 'finance_admin', 'support_admin', 'operations_admin'],
  'refund.approve': FINANCE_ROLES,
  'refund.reject': FINANCE_ROLES,
  'refund.initiate': FINANCE_ROLES,
  'refund.retry': FINANCE_ROLES,
  'refund.resolve': FINANCE_ROLES,
  'webhook.retry': ['super_admin', 'finance_admin', 'operations_admin'],
  'webhook.review': ['super_admin', 'finance_admin', 'operations_admin', 'support_admin'],
  'settlement.write': FINANCE_ROLES,
  'vendor.approve': ['super_admin', 'operations_admin'],
  'rider.manage': OPS_ROLES,
  'admin.manage': ['super_admin'],
  'support.note': ['super_admin', 'finance_admin', 'operations_admin', 'support_admin', 'campus_admin'],
  'support.escalate': SUPPORT_ROLES,
  'support.resolve': SUPPORT_ROLES,
  'order.transition': OPS_ROLES,
  'order.cancel': OPS_ROLES,
};

export function hasRole(session: AdminSession | undefined, roles?: AdminRole[]): boolean {
  if (!session) return false;
  if (!roles || roles.length === 0) return true;
  return roles.includes(session.role);
}

export function canPerform(session: AdminSession | undefined, action: AdminAction): boolean {
  return hasRole(session, ACTION_ROLES[action]);
}

export function visibleNavGroups(session: AdminSession | undefined): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasRole(session, item.roles)),
  })).filter((group) => group.items.length > 0);
}

export function canAccessRoute(session: AdminSession | undefined, pathname: string): boolean {
  if (!session) return false;
  const normalized = pathname === '/' ? '/dashboard' : pathname;
  const items = NAV_GROUPS.flatMap((group) => group.items);
  const match = items
    .filter((item) => normalized === item.href || normalized.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ? hasRole(session, match.roles) : true;
}

export function permissionMessage(actionOrRoute: AdminAction | string): string {
  if (actionOrRoute.includes('.')) return 'Requires higher admin permission. Backend authorization still applies.';
  return 'You do not have permission to view this admin page.';
}
