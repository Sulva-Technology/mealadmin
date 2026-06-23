import type {
  AdminSession, DashboardData, Campus,
  OrderListItem, Order, BatchListItem, Batch,
  VendorListItem, Vendor, VendorPerformance,
  RiderListItem, Rider, RiderAssignment, SettlementListItem,
  InventoryRow, EscalationListItem, Escalation,
  Settlement, SettlementPreview, Review, UserRecord,
  AdminMembership, AnalyticsData, AuditLog,
  ListEnvelope, ItemEnvelope, BeneficiaryType,
} from '@/lib/types';

/** Real backend base URL. Used server-side (login + proxy route handlers). */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mealdirectly.com/v1';

/** Same-origin authenticated proxy. The browser only ever talks to this. */
const PROXY_BASE = '/api/proxy';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type ReqOpts = RequestInit & { idempotencyKey?: string };

/**
 * Client-side request. Goes through /api/proxy, which injects the Authorization
 * bearer from the Supabase cookie session and an Idempotency-Key on mutations.
 */
async function request<T = unknown>(endpoint: string, options: ReqOpts = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (options.idempotencyKey) headers.set('Idempotency-Key', options.idempotencyKey);

  const res = await fetch(`${PROXY_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  if (!res.ok) {
    let body: any;
    try { body = await res.json(); } catch { /* non-JSON */ }
    // Backend errors come either bare ({code,message}) or wrapped ({error:{...}}).
    const err = body?.error ?? body;
    throw new ApiError(
      err?.message || `Request failed with status ${res.status}`,
      err?.code || String(res.status),
      res.status,
      err?.details,
    );
  }
  if (res.status === 204) return null as T;
  try { return (await res.json()) as T; } catch { return null as T; }
}

/** Build a query string, dropping undefined/null/empty values. */
export type Query = Record<string, string | number | undefined | null>;
function qs(params?: Query): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

const post = (path: string, body?: unknown) =>
  request<ItemEnvelope<any>>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
const patch = (path: string, body: unknown) =>
  request<ItemEnvelope<any>>(path, { method: 'PATCH', body: JSON.stringify(body) });

export const api = {
  // Auth convenience reads (session lives in cookies).
  getMe: () => request('/auth/me'),

  // Session & dashboard
  getSession: () => request<ItemEnvelope<AdminSession>>('/admin/session'),
  getDashboard: (q?: Query) => request<ItemEnvelope<DashboardData>>(`/admin/dashboard${qs(q)}`),

  // Campuses (used for scope selector + name lookups)
  getCampuses: (q?: Query) => request<ListEnvelope<Campus>>(`/admin/campuses${qs(q)}`),

  // Orders
  getOrders: (q?: Query) => request<ListEnvelope<OrderListItem>>(`/admin/orders${qs(q)}`),
  getOrder: (id: string) => request<ItemEnvelope<Order>>(`/admin/orders/${id}`),
  cancelOrder: (id: string, reason?: string) =>
    post(`/admin/orders/${id}/cancel`, { reason }),
  transitionOrder: (id: string, status: string, reason?: string) =>
    post(`/admin/orders/${id}/status-transition`, { status, reason }),

  // Batches
  getBatches: (q?: Query) => request<ListEnvelope<BatchListItem>>(`/admin/batches${qs(q)}`),
  getBatch: (id: string) => request<ItemEnvelope<Batch>>(`/admin/batches/${id}`),
  closeBatch: (id: string) => post(`/admin/batches/${id}/close`),
  assignRider: (id: string, riderId: string) =>
    post(`/admin/batches/${id}/assign-rider`, { riderId }),
  assignVendorDelivery: (id: string, vendorId: string) =>
    post(`/admin/batches/${id}/assign-vendor-delivery`, { vendorId }),
  reassignRider: (id: string, riderId: string) =>
    post(`/admin/batches/${id}/reassign-rider`, { riderId }),
  cancelBatchAssignment: (id: string) => post(`/admin/batches/${id}/cancel-assignment`),

  // Vendors
  getVendors: (q?: Query) => request<ListEnvelope<VendorListItem>>(`/admin/vendors${qs(q)}`),
  getVendor: (id: string) => request<ItemEnvelope<Vendor>>(`/admin/vendors/${id}`),
  createVendor: (body: { campusId: string; legalName: string; displayName: string; slug: string }) =>
    post('/admin/vendors', body),
  updateVendor: (id: string, body: Partial<{ displayName: string; description: string; phone: string; active: boolean }>) =>
    patch(`/admin/vendors/${id}`, body),
  approveVendor: (id: string) => post(`/admin/vendors/${id}/approve`),
  suspendVendor: (id: string) => post(`/admin/vendors/${id}/suspend`),
  activateVendor: (id: string) => post(`/admin/vendors/${id}/activate`),
  addVendorUser: (id: string, body: { userId: string; role: 'owner' | 'staff' }) =>
    post(`/admin/vendors/${id}/users`, body),
  getVendorPerformance: (id: string) =>
    request<ItemEnvelope<VendorPerformance>>(`/admin/vendors/${id}/performance`),

  // Riders
  getRiders: (q?: Query) => request<ListEnvelope<RiderListItem>>(`/admin/riders${qs(q)}`),
  getRider: (id: string) => request<ItemEnvelope<Rider>>(`/admin/riders/${id}`),
  getRiderAssignments: (id: string) =>
    request<ListEnvelope<RiderAssignment>>(`/admin/riders/${id}/assignments`),
  getRiderSettlements: (id: string) =>
    request<ListEnvelope<SettlementListItem>>(`/admin/riders/${id}/settlements`),
  verifyRider: (id: string) => post(`/admin/riders/${id}/verify`),
  suspendRider: (id: string) => post(`/admin/riders/${id}/suspend`),
  activateRider: (id: string) => post(`/admin/riders/${id}/activate`),

  // Inventory
  getInventory: (q?: Query) => request<ListEnvelope<InventoryRow>>(`/admin/inventory${qs(q)}`),
  adjustInventory: (id: string, body: { delta: number; reason: string }) =>
    post(`/admin/inventory/${id}/adjustments`, body),

  // Escalations
  getEscalations: (q?: Query) => request<ListEnvelope<EscalationListItem>>(`/admin/escalations${qs(q)}`),
  getEscalation: (id: string) => request<ItemEnvelope<Escalation>>(`/admin/escalations/${id}`),
  assignEscalation: (id: string, adminUserId: string) =>
    post(`/admin/escalations/${id}/assign`, { adminUserId }),
  requestEscalationEvidence: (id: string) => post(`/admin/escalations/${id}/request-evidence`),
  resolveEscalation: (id: string, resolution: string) =>
    post(`/admin/escalations/${id}/resolve`, { resolution }),
  refundEscalation: (id: string) => post(`/admin/escalations/${id}/refunds`),

  // Settlements
  getSettlements: (q?: Query) => request<ListEnvelope<SettlementListItem>>(`/admin/settlements${qs(q)}`),
  getSettlement: (id: string) => request<ItemEnvelope<Settlement>>(`/admin/settlements/${id}`),
  previewSettlement: (body: { beneficiaryType: BeneficiaryType; beneficiaryId: string; settlementDate: string }) =>
    post('/admin/settlements/preview', body),
  generateSettlement: (body: { beneficiaryType: BeneficiaryType; beneficiaryId: string; settlementDate: string }) =>
    post('/admin/settlements/generate', body),
  approveSettlement: (id: string) => post(`/admin/settlements/${id}/approve`),
  markSettlementPaid: (id: string, externalReference: string) =>
    post(`/admin/settlements/${id}/mark-paid`, { externalReference }),
  addSettlementAdjustment: (id: string, body: { amountKobo: number; description: string }) =>
    post(`/admin/settlements/${id}/adjustments`, body),

  // Reviews
  getReviews: (q?: Query) => request<ListEnvelope<Review>>(`/admin/reviews${qs(q)}`),
  moderateReview: (id: string, status: 'approved' | 'pending' | 'rejected') =>
    post(`/admin/reviews/${id}/moderate`, { status }),

  // Users
  getUsers: (q?: Query) => request<ListEnvelope<UserRecord>>(`/admin/users${qs(q)}`),
  getUser: (id: string) => request<ItemEnvelope<UserRecord>>(`/admin/users/${id}`),
  suspendUser: (id: string) => post(`/admin/users/${id}/suspend`),
  activateUser: (id: string) => post(`/admin/users/${id}/activate`),

  // Admin memberships (super_admin only)
  getAdminMemberships: (q?: Query) =>
    request<ListEnvelope<AdminMembership>>(`/admin/admin-memberships${qs(q)}`),
  createAdminMembership: (body: { userId: string; role: 'campus_admin' | 'super_admin'; campusId?: string }) =>
    post('/admin/admin-memberships', body),
  revokeAdminMembership: (id: string) => post(`/admin/admin-memberships/${id}/revoke`),
  activateAdminMembership: (id: string) => post(`/admin/admin-memberships/${id}/activate`),

  // Analytics & audit
  getAnalytics: (q?: Query) => request<ItemEnvelope<AnalyticsData>>(`/admin/analytics${qs(q)}`),
  getAuditLogs: (q?: Query) => request<ListEnvelope<AuditLog>>(`/admin/audit-logs${qs(q)}`),
};
