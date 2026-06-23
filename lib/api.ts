/** Real backend base URL. Used server-side (login + proxy route handlers). */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mealdirectly.com/v1';

/** Same-origin authenticated proxy. The browser only ever talks to this. */
const PROXY_BASE = '/api/proxy';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any[];

  constructor(message: string, code: string, status: number, details?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Client-side request. Goes through /api/proxy, which injects the Authorization
 * bearer from the Supabase cookie session and the Idempotency-Key on mutations.
 */
async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${PROXY_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      // non-JSON error body
    }
    throw new ApiError(
      errorData?.error?.message || `Request failed with status ${response.status}`,
      errorData?.error?.code || String(response.status),
      response.status,
      errorData?.error?.details
    );
  }

  if (response.status === 204) return null as any;

  try {
    return (await response.json()) as T;
  } catch {
    return null as any;
  }
}

const qs = (params?: URLSearchParams) => (params ? `?${params.toString()}` : '');

export const api = {
  // Auth (session lives in cookies; these are convenience reads)
  getMe: () => request('/auth/me'),

  // Dashboard
  getDashboard: (params?: URLSearchParams) => request(`/admin/dashboard${qs(params)}`),

  // Orders
  getOrders: (params?: URLSearchParams) => request(`/admin/orders${qs(params)}`),
  updateOrderStatus: (orderId: string, status: string, reason?: string) =>
    request(`/admin/orders/${orderId}/status-transition`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    }),

  // Vendors
  getVendors: (params?: URLSearchParams) => request(`/admin/vendors${qs(params)}`),
  approveVendor: (vendorId: string) =>
    request(`/admin/vendors/${vendorId}/approve`, { method: 'POST' }),
  suspendVendor: (vendorId: string) =>
    request(`/admin/vendors/${vendorId}/suspend`, { method: 'POST' }),

  // Riders
  getRiders: (params?: URLSearchParams) => request(`/admin/riders${qs(params)}`),
  verifyRider: (riderId: string) =>
    request(`/admin/riders/${riderId}/verify`, { method: 'POST' }),
  suspendRider: (riderId: string) =>
    request(`/admin/riders/${riderId}/suspend`, { method: 'POST' }),

  // Campuses
  getCampuses: () => request('/admin/campuses'),

  // Users (Students)
  getUsers: (params?: URLSearchParams) => request(`/admin/users${qs(params)}`),

  // Payments
  getPayments: (params?: URLSearchParams) => request(`/admin/payments${qs(params)}`),

  // Settlements
  getSettlements: (params?: URLSearchParams) => request(`/admin/settlements${qs(params)}`),

  // Escalations
  getEscalations: (params?: URLSearchParams) => request(`/admin/escalations${qs(params)}`),

  // System
  getSystemLogs: () => request('/admin/audit-logs'),

  // ---------------------------------------------------------------------------
  // Phase 5 admin actions.
  // NOTE: the OpenAPI spec does not document request bodies for several of these
  // (the DTOs have no published properties). Bodies are passed through as-is and
  // must be confirmed against the live API. Idempotency-Key is added by the proxy.
  // ---------------------------------------------------------------------------

  // Dispatch / batches
  getBatches: (params?: URLSearchParams) => request(`/admin/batches${qs(params)}`),
  getBatch: (batchId: string) => request(`/admin/batches/${batchId}`),
  assignRider: (batchId: string, body: Record<string, unknown>) =>
    request(`/admin/batches/${batchId}/assign-rider`, { method: 'POST', body: JSON.stringify(body) }),
  reassignRider: (batchId: string, body: Record<string, unknown>) =>
    request(`/admin/batches/${batchId}/reassign-rider`, { method: 'POST', body: JSON.stringify(body) }),
  assignVendorDelivery: (batchId: string, body: Record<string, unknown>) =>
    request(`/admin/batches/${batchId}/assign-vendor-delivery`, { method: 'POST', body: JSON.stringify(body) }),
  cancelAssignment: (batchId: string) =>
    request(`/admin/batches/${batchId}/cancel-assignment`, { method: 'POST' }),
  closeBatch: (batchId: string) =>
    request(`/admin/batches/${batchId}/close`, { method: 'POST' }),

  // Settlements lifecycle
  previewSettlement: (body: Record<string, unknown>) =>
    request('/admin/settlements/preview', { method: 'POST', body: JSON.stringify(body) }),
  generateSettlements: (body: Record<string, unknown>) =>
    request('/admin/settlements/generate', { method: 'POST', body: JSON.stringify(body) }),
  getSettlement: (id: string) => request(`/admin/settlements/${id}`),
  approveSettlement: (id: string) =>
    request(`/admin/settlements/${id}/approve`, { method: 'POST' }),
  markSettlementPaid: (id: string, body: Record<string, unknown> = {}) =>
    request(`/admin/settlements/${id}/mark-paid`, { method: 'POST', body: JSON.stringify(body) }),
  addSettlementAdjustment: (id: string, body: Record<string, unknown>) =>
    request(`/admin/settlements/${id}/adjustments`, { method: 'POST', body: JSON.stringify(body) }),

  // Escalations workflow
  getEscalation: (id: string) => request(`/admin/escalations/${id}`),
  assignEscalation: (id: string, body: Record<string, unknown> = {}) =>
    request(`/admin/escalations/${id}/assign`, { method: 'POST', body: JSON.stringify(body) }),
  resolveEscalation: (id: string, body: Record<string, unknown> = {}) =>
    request(`/admin/escalations/${id}/resolve`, { method: 'POST', body: JSON.stringify(body) }),
  requestEscalationEvidence: (id: string) =>
    request(`/admin/escalations/${id}/request-evidence`, { method: 'POST' }),
  refundEscalation: (id: string, body: { amountKobo: number; reasonCode: string; reasonText?: string }) =>
    request(`/admin/escalations/${id}/refunds`, { method: 'POST', body: JSON.stringify(body) }),

  // Payments
  getPayment: (paymentId: string) => request(`/admin/payments/${paymentId}`),
  reconcilePayment: (paymentId: string) =>
    request(`/admin/payments/${paymentId}/reconcile`, { method: 'POST' }),
  refundPayment: (paymentId: string, body: { amountKobo: number; reasonCode: string; reasonText?: string }) =>
    request(`/admin/payments/${paymentId}/refunds`, { method: 'POST', body: JSON.stringify(body) }),

  // Orders
  cancelOrder: (orderId: string, reason?: string) =>
    request(`/admin/orders/${orderId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Users / vendors / riders lifecycle
  activateUser: (userId: string) =>
    request(`/admin/users/${userId}/activate`, { method: 'POST' }),
  suspendUser: (userId: string) =>
    request(`/admin/users/${userId}/suspend`, { method: 'POST' }),
  activateVendor: (vendorId: string) =>
    request(`/admin/vendors/${vendorId}/activate`, { method: 'POST' }),
  patchVendor: (vendorId: string, body: Record<string, unknown>) =>
    request(`/admin/vendors/${vendorId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  activateRider: (riderId: string) =>
    request(`/admin/riders/${riderId}/activate`, { method: 'POST' }),
};
