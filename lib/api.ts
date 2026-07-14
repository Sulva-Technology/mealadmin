import type {
  AdminSession, DashboardData, Campus,
  OrderListItem, Order, BatchListItem, Batch,
  VendorListItem, Vendor, VendorPerformance,
  RiderListItem, Rider, RiderAssignment, SettlementListItem,
  InventoryRow, EscalationListItem, Escalation,
  Settlement, SettlementPreview, PayoutTransferRecord, PayoutDestination, Review, UserRecord, DeleteUserResult,
  AdminMembership, AnalyticsData, AuditLog,
  VendorInvitation, VendorInvitationCreated,
  Zone, CampusLocation, DeliverySlot, LocationType, UnitType,
  MenuItem, MenuCategory, MenuMetadata, CreateMenuItemInput, UpdateMenuItemInput,
  ListEnvelope, ItemEnvelope, BeneficiaryType,
  NotificationRecord, NotificationPreferences,
  UpdateNotificationPreferences, RegisterDeviceTokenPayload,
  MarkAllNotificationsReadResult,
  PaymentListItem, PaymentDetail, PaymentQueueItem,
  RefundListItem, RefundDetail, SystemHealth, WebhookEvent, WebhookDetail,
  ChatMessage,
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
    // Backend caps list page size at 100; clamp so no caller can trip VALIDATION_FAILED.
    if (k === 'limit') { sp.set(k, String(Math.min(Number(v) || 0, 100))); continue; }
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

const post = (path: string, body?: unknown) =>
  request<ItemEnvelope<any>>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
const patch = (path: string, body: unknown) =>
  request<ItemEnvelope<any>>(path, { method: 'PATCH', body: JSON.stringify(body) });
const put = (path: string, body: unknown) =>
  request<ItemEnvelope<any>>(path, { method: 'PUT', body: JSON.stringify(body) });

export const api = {
  // Auth convenience reads (session lives in cookies).
  getMe: () => request('/auth/me'),

  // Current-user notifications
  getNotifications: (q?: Query) =>
    request<ListEnvelope<NotificationRecord>>(`/notifications${qs(q)}`),
  markNotificationRead: (id: string) =>
    post(`/notifications/${id}/read`),
  markAllNotificationsRead: () =>
    post('/notifications/read-all') as Promise<ItemEnvelope<MarkAllNotificationsReadResult>>,
  getNotificationPreferences: () =>
    request<ItemEnvelope<NotificationPreferences>>('/notifications/preferences'),
  updateNotificationPreferences: (body: UpdateNotificationPreferences) =>
    put('/notifications/preferences', body) as Promise<ItemEnvelope<NotificationPreferences>>,
  registerDeviceToken: (body: RegisterDeviceTokenPayload) =>
    request<void>('/me/device-tokens', { method: 'POST', body: JSON.stringify(body) }),
  removeDeviceToken: (token: string) =>
    request<void>(`/me/device-tokens/${encodeURIComponent(token)}`, { method: 'DELETE' }),

  // Session & dashboard
  getSession: () => request<ItemEnvelope<AdminSession>>('/admin/session'),
  getDashboard: (q?: Query) => request<ItemEnvelope<DashboardData>>(`/admin/dashboard${qs(q)}`),

  // Campuses (used for scope selector + name lookups, and campus configuration)
  getCampuses: (q?: Query) => request<ListEnvelope<Campus>>(`/admin/campuses${qs(q)}`),
  createCampus: (body: { name: string; slug: string; timezone: string; currency: string; countryCode: string; active: boolean }) =>
    post('/admin/campuses', body),
  updateCampus: (id: string, body: Partial<{ name: string; slug: string; timezone: string; currency: string; countryCode: string; maxServiceFeeKobo: number; active: boolean }>) =>
    patch(`/admin/campuses/${id}`, body),

  // Zones (per campus)
  getZones: (campusId: string, q?: Query) =>
    request<ListEnvelope<Zone>>(`/admin/campuses/${campusId}/zones${qs(q)}`),
  createZone: (campusId: string, body: { name: string; code: string; active: boolean; displayOrder: number; deliveryFeeKobo?: number }) =>
    post(`/admin/campuses/${campusId}/zones`, body),
  updateZone: (zoneId: string, body: Partial<{ name: string; code: string; active: boolean; displayOrder: number; deliveryFeeKobo: number }>) =>
    patch(`/admin/zones/${zoneId}`, body),

  // Preset locations / dispatch terminals (per campus)
  getLocations: (campusId: string, q?: Query) =>
    request<ListEnvelope<CampusLocation>>(`/admin/campuses/${campusId}/locations${qs(q)}`),
  createLocation: (campusId: string, body: { zoneId: string; name: string; slug: string; type: LocationType; deliveryInstructions?: string; active: boolean; displayOrder: number }) =>
    post(`/admin/campuses/${campusId}/locations`, body),
  updateLocation: (locationId: string, body: Partial<{ zoneId: string; name: string; slug: string; type: LocationType; deliveryInstructions: string; active: boolean; displayOrder: number }>) =>
    patch(`/admin/locations/${locationId}`, body),
  deleteLocation: (locationId: string) =>
    request<void>(`/admin/locations/${locationId}`, { method: 'DELETE' }),

  // Delivery slots / available times (per campus)
  getDeliverySlots: (campusId: string, q?: Query) =>
    request<ListEnvelope<DeliverySlot>>(`/admin/campuses/${campusId}/delivery-slots${qs(q)}`),
  createDeliverySlot: (campusId: string, body: { name: string; deliveryTime: string; cutoffMinutes: number; active: boolean; displayOrder: number }) =>
    post(`/admin/campuses/${campusId}/delivery-slots`, body),
  updateDeliverySlot: (slotId: string, body: Partial<{ name: string; deliveryTime: string; cutoffMinutes: number; active: boolean; displayOrder: number }>) =>
    patch(`/admin/delivery-slots/${slotId}`, body),

  // Unit types (global catalog, shared by all vendors)
  getUnitTypes: (q?: Query) => request<ListEnvelope<UnitType>>(`/admin/unit-types${qs(q)}`),
  createUnitType: (body: { code: string; displayName: string; countsTowardSpoonLimit: boolean; triggersTakeawayFee?: boolean; maxQuantity?: number | null }) =>
    post('/admin/unit-types', body) as Promise<ItemEnvelope<UnitType>>,
  updateUnitType: (id: string, body: Partial<{ displayName: string; countsTowardSpoonLimit: boolean; triggersTakeawayFee: boolean; maxQuantity: number | null; active: boolean }>) =>
    patch(`/admin/unit-types/${id}`, body) as Promise<ItemEnvelope<UnitType>>,

  // Orders
  getOrders: (q?: Query) => request<ListEnvelope<OrderListItem>>(`/admin/orders${qs(q)}`),
  getOrder: (id: string) => request<ItemEnvelope<Order>>(`/admin/orders/${id}`),
  addOrderNote: (id: string, body: { note: string }) =>
    post(`/admin/orders/${id}/notes`, body),
  escalateOrder: (id: string, body: { reason: string }) =>
    post(`/admin/orders/${id}/escalations`, body),
  cancelOrder: (id: string, reason?: string) =>
    post(`/admin/orders/${id}/cancel`, { reason }),
  transitionOrder: (id: string, status: string, reason?: string) =>
    post(`/admin/orders/${id}/status-transition`, { status, reason }),

  // Payments / reconciliation
  getPayments: (q?: Query) => request<ListEnvelope<PaymentListItem>>(`/admin/payments${qs(q)}`),
  getPayment: (id: string) => request<ItemEnvelope<PaymentDetail>>(`/admin/payments/${id}`),
  verifyPayment: (id: string) => post(`/admin/payments/${id}/verify`),
  forcePaymentPaid: (id: string, body: { reason: string }) =>
    post(`/admin/payments/${id}/force-paid`, body),
  markPaymentForReview: (id: string, body: { note?: string }) =>
    post(`/admin/payments/${id}/review`, body),
  createRefundForPayment: (id: string, body: { amountKobo: number; reason: string }) =>
    post(`/admin/payments/${id}/refunds`, body),
  addPaymentNote: (id: string, body: { note: string }) =>
    post(`/admin/payments/${id}/notes`, body),
  getPaymentQueues: (q?: Query) =>
    request<ListEnvelope<PaymentQueueItem>>(`/admin/payments/problem-queues${qs(q)}`),
  markPaymentQueueReviewed: (id: string, body: { note?: string }) =>
    post(`/admin/payments/problem-queues/${id}/review`, body),

  // Refunds
  getRefunds: (q?: Query) => request<ListEnvelope<RefundListItem>>(`/admin/refunds${qs(q)}`),
  getRefund: (id: string) => request<ItemEnvelope<RefundDetail>>(`/admin/refunds/${id}`),
  approveRefund: (id: string, body: { note?: string }) =>
    post(`/admin/refunds/${id}/approve`, body),
  rejectRefund: (id: string, body: { reason: string }) =>
    post(`/admin/refunds/${id}/reject`, body),
  initiateRefund: (id: string, body: { amountKobo: number; reason: string }) =>
    post(`/admin/refunds/${id}/initiate`, body),
  retryRefund: (id: string) => post(`/admin/refunds/${id}/retry`),
  markRefundManuallyResolved: (id: string, body: { note: string }) =>
    post(`/admin/refunds/${id}/mark-manually-resolved`, body),
  addRefundNote: (id: string, body: { note: string }) =>
    post(`/admin/refunds/${id}/notes`, body),

  // Health / webhooks
  getSystemHealth: () => request<ItemEnvelope<SystemHealth>>('/admin/health'),
  getWebhooks: (q?: Query) => request<ListEnvelope<WebhookEvent>>(`/admin/webhooks${qs(q)}`),
  getWebhook: (id: string) => request<ItemEnvelope<WebhookDetail>>(`/admin/webhooks/${id}`),
  retryWebhook: (id: string) => post(`/admin/webhooks/${id}/retry`),
  markWebhookReviewed: (id: string, body: { note?: string }) =>
    post(`/admin/webhooks/${id}/review`, body),

  // Batches
  getBatches: (q?: Query) => request<ListEnvelope<BatchListItem>>(`/admin/batches${qs(q)}`),
  getBatch: (id: string) => request<ItemEnvelope<Batch>>(`/admin/batches/${id}`),
  getBatchChat: (id: string, q?: Query) =>
    request<ListEnvelope<ChatMessage>>(`/admin/batches/${id}/chat/messages${qs(q)}`),
  sendBatchChat: (id: string, body: string) =>
    post(`/admin/batches/${id}/chat/messages`, { body }) as Promise<ItemEnvelope<ChatMessage>>,
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
  getVendorInvitations: (id: string, q?: Query) =>
    request<ListEnvelope<VendorInvitation>>(`/admin/vendors/${id}/invitations${qs(q)}`),
  createVendorInvitation: (id: string, body: { email: string; role: 'owner' | 'staff'; expiresInHours?: number }) =>
    post(`/admin/vendors/${id}/invitations`, body) as Promise<ItemEnvelope<VendorInvitationCreated>>,

  // Vendor menu (admin-managed, per vendor)
  getVendorMenuMetadata: (id: string) =>
    request<ItemEnvelope<MenuMetadata>>(`/admin/vendors/${id}/menu-metadata`),
  getVendorMenuItems: (id: string) =>
    request<ListEnvelope<MenuItem>>(`/admin/vendors/${id}/menu-items`),
  createVendorMenuCategory: (id: string, body: { name: string; displayOrder?: number }) =>
    post(`/admin/vendors/${id}/menu-categories`, body) as Promise<ItemEnvelope<MenuCategory>>,
  createVendorMenuItem: (id: string, body: CreateMenuItemInput) =>
    post(`/admin/vendors/${id}/menu-items`, body) as Promise<ItemEnvelope<MenuItem>>,
  updateVendorMenuItem: (id: string, itemId: string, body: UpdateMenuItemInput) =>
    patch(`/admin/vendors/${id}/menu-items/${itemId}`, body) as Promise<ItemEnvelope<MenuItem>>,
  activateVendorMenuItem: (id: string, itemId: string) =>
    post(`/admin/vendors/${id}/menu-items/${itemId}/activate`) as Promise<ItemEnvelope<MenuItem>>,
  deactivateVendorMenuItem: (id: string, itemId: string) =>
    post(`/admin/vendors/${id}/menu-items/${itemId}/deactivate`) as Promise<ItemEnvelope<MenuItem>>,

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
  updateInventory: (id: string, body: { quantityTotal: number }) =>
    patch(`/admin/inventory/${id}`, body),

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
  paySettlement: (id: string) =>
    request<ItemEnvelope<PayoutTransferRecord>>(`/admin/settlements/${id}/pay`, { method: 'POST' }),
  getSettlementPayoutAccount: (id: string) =>
    request<ItemEnvelope<PayoutDestination>>(`/admin/settlements/${id}/payout-account`),
  addSettlementAdjustment: (id: string, body: { amountKobo: number; description: string }) =>
    post(`/admin/settlements/${id}/adjustments`, body),

  // Reviews
  getReviews: (q?: Query) => request<ListEnvelope<Review>>(`/admin/reviews${qs(q)}`),
  moderateReview: (id: string, status: 'approved' | 'pending' | 'rejected') =>
    post(`/admin/reviews/${id}/moderate`, { status }),

  // Users
  getUsers: (q?: Query) => request<ListEnvelope<UserRecord>>(`/admin/users${qs(q)}`),
  getUser: (id: string) => request<ItemEnvelope<UserRecord>>(`/admin/users/${id}`),
  addUserNote: (id: string, body: { note: string }) =>
    post(`/admin/users/${id}/notes`, body),
  escalateUserIssue: (id: string, body: { reason: string }) =>
    post(`/admin/users/${id}/escalations`, body),
  markUserIssueResolved: (id: string, body: { note?: string }) =>
    post(`/admin/users/${id}/issues/resolve`, body),
  suspendUser: (id: string) => post(`/admin/users/${id}/suspend`),
  activateUser: (id: string) => post(`/admin/users/${id}/activate`),
  // Super-admin only. Anonymizes users with order history; hard-deletes the rest.
  deleteUser: (id: string) =>
    request<ItemEnvelope<DeleteUserResult>>(`/admin/users/${id}`, { method: 'DELETE' }),

  // Admin memberships (super_admin only)
  getAdminMemberships: (q?: Query) =>
    request<ListEnvelope<AdminMembership>>(`/admin/admin-memberships${qs(q)}`),
  createAdminMembership: (body: { userId: string; role: AdminMembership['role']; campusId?: string }) =>
    post('/admin/admin-memberships', body),
  revokeAdminMembership: (id: string) => post(`/admin/admin-memberships/${id}/revoke`),
  activateAdminMembership: (id: string) => post(`/admin/admin-memberships/${id}/activate`),

  // Analytics & audit
  getAnalytics: (q?: Query) => request<ItemEnvelope<AnalyticsData>>(`/admin/analytics${qs(q)}`),
  getAuditLogs: (q?: Query) => request<ListEnvelope<AuditLog>>(`/admin/audit-logs${qs(q)}`),
};
