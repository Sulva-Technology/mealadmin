/**
 * Admin API resource shapes, mirrored from
 * `mealdirectbackend/docs/admin-endpoints.md`. Money fields are integer kobo.
 * Optional/nullable exactly as the contract documents.
 */

// ---- Enums (raw backend strings) -------------------------------------------

export const ORDER_STATUSES = [
  'pending_payment', 'paid', 'confirmed', 'accepted', 'preparing', 'ready',
  'out_for_delivery', 'delivered', 'administratively_completed',
  'cancelled', 'expired', 'refunded',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const BATCH_STATUSES = [
  'open', 'closed', 'assigned', 'in_progress', 'completed', 'cancelled',
] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const VENDOR_STATUSES = ['approved', 'pending', 'suspended', 'deactivated'] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const RIDER_STATUSES = ['verified', 'pending', 'suspended', 'deactivated'] as const;
export type RiderStatus = (typeof RIDER_STATUSES)[number];

export const ESCALATION_STATUSES = ['open', 'investigating', 'resolved', 'rejected'] as const;
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];

export const SETTLEMENT_STATUSES = ['draft', 'approved', 'paid', 'cancelled'] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const ACCOUNT_STATUSES = ['active', 'suspended', 'deactivated'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const INVENTORY_STATES = ['available', 'low', 'sold_out'] as const;
export type InventoryState = (typeof INVENTORY_STATES)[number];

export type AdminRole =
  | 'super_admin'
  | 'finance_admin'
  | 'operations_admin'
  | 'support_admin'
  | 'campus_admin'
  | 'read_only_admin';
export type BeneficiaryType = 'rider' | 'vendor';

// ---- Money bounds (integer kobo) -------------------------------------------
// Mirror the backend fee contract. Used for client-side validation/hints only;
// the backend is authoritative and re-validates.

/** Hard ceiling on any single configurable fee (the order cap). */
export const ORDER_CAP_KOBO = 249_000;
/** Rider always nets this on a delivery; platform nets fee − this. */
export const RIDER_SHARE_KOBO = 7_500;
/** A zone delivery fee may not go below the rider share. */
export const MIN_DELIVERY_FEE_KOBO = RIDER_SHARE_KOBO;
/** Default zone delivery fee when none is supplied (₦150). */
export const DEFAULT_DELIVERY_FEE_KOBO = 15_000;
/** Default per-campus takeaway-fee ceiling until changed (₦200). */
export const DEFAULT_MAX_SERVICE_FEE_KOBO = 20_000;

// ---- Envelopes -------------------------------------------------------------

export interface Pagination {
  hasMore: boolean;
  limit: number;
  nextCursor?: string;
  previousCursor?: string;
  total?: number;
}
export interface ListEnvelope<T> {
  data: T[];
  pagination: Pagination;
  meta?: Record<string, unknown>;
}
export interface ItemEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// ---- Notifications ---------------------------------------------------------

export interface NotificationRecord {
  id: string;
  recipientUserId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  title: string;
  body: string;
  linkPath: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  userId: string;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  orderUpdates: boolean;
  paymentUpdates: boolean;
  deliveryUpdates: boolean;
  escalationUpdates: boolean;
  settlementUpdates: boolean;
  updatedAt: string;
}

export type UpdateNotificationPreferences = Partial<
  Omit<NotificationPreferences, 'userId' | 'updatedAt'>
>;

export interface RegisterDeviceTokenPayload {
  token: string;
  platform: 'web' | 'ios' | 'android' | string;
  provider?: string;
}

export interface MarkAllNotificationsReadResult {
  updatedCount: number;
}

// ---- Session & Dashboard ---------------------------------------------------

export interface AdminSession {
  userId: string;
  role: AdminRole;
  campusId: string | null;
  email?: string;
  scopes: string[];
}

export interface DashboardData {
  date: string;
  campusId: string | null;
  orders: { total: number; paid: number };
  batches: { total: number; open: number };
  payments: { total: number; failed: number };
  escalations: { open: number };
  settlements: { payableKobo: number };
  alerts: unknown[];
}

// ---- Campuses (from /v1/admin/campuses; shape verified live) ---------------

export interface Campus {
  id: string;
  name: string;
  slug?: string;
  timezone?: string;
  currency?: string;
  countryCode?: string;
  /** Max takeaway/service fee a vendor on this campus may set. Default 20000. */
  maxServiceFeeKobo?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---- Zones / Locations / Delivery slots (campus configuration) -------------

export interface Zone {
  id: string;
  campusId: string;
  name: string;
  code: string;
  /** Delivery fee charged for this zone, integer kobo. */
  deliveryFeeKobo: number;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Global unit type, shared by all vendors (not campus-scoped). `code` is the
 * immutable machine key; `countsTowardSpoonLimit` marks whether items measured
 * in this unit count toward the 3-spoon takeaway limit.
 */
export interface UnitType {
  id: string;
  /** Immutable machine key, set at creation. */
  code: string;
  displayName: string;
  /** Counts toward the three-spoon takeaway package cap (swallows). */
  countsTowardSpoonLimit: boolean;
  /** Pulls the flat takeaway/service fee. Independent of the spoon cap. */
  triggersTakeawayFee: boolean;
  /** Max quantity per order line for this unit type; null = unlimited. */
  maxQuantity: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const LOCATION_TYPES = ['department', 'hostel'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export interface CampusLocation {
  id: string;
  campusId: string;
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  name: string;
  slug: string;
  type: LocationType;
  deliveryInstructions: string | null;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverySlot {
  id: string;
  campusId: string;
  name: string;
  deliveryTime: string;
  cutoffMinutes: number;
  active: boolean;
  displayOrder: number;
  orderingCutoffAt: string | null;
  acceptingOrders: boolean | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Orders ----------------------------------------------------------------

export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerId: string;
  campusId: string;
  vendorId: string;
  vendorDisplayName: string;
  serviceDate: string;
  deliverySlotId: string | null;
  locationId: string | null;
  roomNumber?: string | null;
  orderStatus: OrderStatus;
  deliveryMode: string;
  totalKobo: number;
  currency: string;
  itemsSummary?: string;
  createdAt: string;
  updatedAt: string;
}
export interface OrderItem {
  id: string;
  menuItemId: string | null;
  itemName: string;
  unitType: string | null;
  unitPriceKobo: number;
  quantity: number;
  lineTotalKobo: number;
  customization: string | null;
  soupOptionId: string | null;
  soupName: string | null;
}
export interface Order extends Omit<OrderListItem, 'deliverySlotId' | 'locationId'> {
  customerEmail: string | null;
  customerPhone?: string | null;
  paymentReference?: string | null;
  items?: OrderItem[];
}

// ---- Payments / refunds / reconciliation / diagnostics --------------------

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'abandoned', 'refunded', 'partially_refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const VERIFICATION_STATUSES = ['not_verified', 'verified', 'failed', 'mismatch', 'unavailable'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const REFUND_STATUSES = [
  'none', 'requested', 'approved', 'rejected', 'initiated', 'processing', 'processed', 'failed', 'manually_resolved',
] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const PAYMENT_QUEUE_KEYS = [
  'paid_order_pending',
  'pending_over_10_minutes',
  'pending_over_30_minutes',
  'failed_payments',
  'webhook_failed',
  'webhook_not_received',
  'amount_mismatch',
  'duplicate_payment_suspicion',
  'refund_stuck',
  'requires_finance_review',
] as const;
export type PaymentQueueKey = (typeof PAYMENT_QUEUE_KEYS)[number];

export interface PaymentListItem {
  id: string;
  paymentReference: string;
  paystackReference: string | null;
  orderId: string;
  orderNumber?: string | null;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  vendorId: string;
  vendorDisplayName: string;
  campusId: string;
  campusName?: string | null;
  amountExpectedKobo: number;
  amountPaidKobo: number;
  currency: string;
  paymentStatus: PaymentStatus | string;
  orderStatus: OrderStatus | string;
  webhookReceived: boolean;
  verificationStatus: VerificationStatus | string;
  refundStatus: RefundStatus | string;
  requiresAdminReview: boolean;
  settlementId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEvent {
  id: string;
  type: string;
  status?: string | null;
  message?: string | null;
  createdAt: string;
}

export interface PaymentNote {
  id: string;
  authorAdminId: string | null;
  note: string;
  createdAt: string;
}

export interface PaymentDetail extends PaymentListItem {
  orderSummary?: {
    id: string;
    orderNumber?: string | null;
    status: string;
    totalKobo: number;
    createdAt: string;
  } | null;
  customer?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  vendor?: {
    id: string;
    displayName: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  riderDelivery?: {
    riderId?: string | null;
    riderName?: string | null;
    status?: string | null;
    batchId?: string | null;
  } | null;
  amountBreakdown?: Record<string, number | string | null>;
  paystackVerification?: Record<string, unknown> | null;
  webhookEvents?: WebhookEvent[];
  refundHistory?: RefundListItem[];
  adminNotes?: PaymentNote[];
  adminActions?: PaymentEvent[];
  timeline?: PaymentEvent[];
  settlementImpact?: {
    settlementId?: string | null;
    affected: boolean;
    message?: string | null;
    amountKobo?: number | null;
  } | null;
}

export interface PaymentQueueItem {
  id: string;
  paymentId?: string | null;
  queue: PaymentQueueKey | string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  paymentReference: string;
  orderId: string;
  customerName: string | null;
  customerEmail: string | null;
  amountKobo: number;
  currency: string;
  issueAgeSeconds: number;
  suggestedAction: string;
  reviewedAt?: string | null;
}

export interface RefundListItem {
  id: string;
  orderId: string;
  paymentId?: string | null;
  paymentReference: string;
  customerName: string | null;
  customerEmail: string | null;
  vendorDisplayName: string;
  amountKobo: number;
  currency: string;
  reason: string;
  status: RefundStatus | string;
  requestedAt: string;
  processedAt: string | null;
  adminActionRequired: boolean;
}

export interface RefundDetail extends RefundListItem {
  originalPayment?: PaymentListItem | null;
  orderSummary?: {
    id: string;
    orderNumber?: string | null;
    status: string;
    totalKobo: number;
  } | null;
  customerReason?: string | null;
  eligibilityState: string;
  paystackRefundStatus?: string | null;
  timeline?: PaymentEvent[];
  adminNotes?: PaymentNote[];
  settlementImpact?: {
    settlementId?: string | null;
    affected: boolean;
    warning?: string | null;
    amountKobo?: number | null;
  } | null;
}

export interface SystemHealth {
  api: string;
  database: string;
  paystack: string;
  lastSuccessfulWebhookAt: string | null;
  lastFailedWebhookAt: string | null;
  failedWebhookCount: number;
  pendingReconciliationCount: number;
  failedJobsCount?: number | null;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  paymentReference: string | null;
  orderId: string | null;
  signatureVerified: boolean;
  processingStatus: string;
  receivedAt: string;
  processedAt: string | null;
  failureReason: string | null;
  retryCount: number;
}

export interface WebhookDetail extends WebhookEvent {
  safeSummary?: Record<string, unknown> | null;
  processingLogs?: PaymentEvent[];
}

// ---- Batches ---------------------------------------------------------------

export interface BatchListItem {
  id: string;
  campusId: string;
  vendorId: string;
  vendorDisplayName: string;
  serviceDate: string;
  deliverySlotId: string | null;
  zoneId: string | null;
  batchNumber: string;
  status: BatchStatus;
  deliveryMode: string;
  orderCount: number;
  deliveryEarningsKobo: number;
  createdAt: string;
  updatedAt: string;
}
export interface BatchOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  locationName: string;
  roomNumber: string | null;
  orderStatus: string;
  deliveryMode: string;
  totalKobo: number;
  sequence: number | null;
}

export interface Batch
  extends Omit<BatchListItem, 'deliverySlotId' | 'zoneId'> {
  assignmentId: string | null;
  riderId: string | null;
  assignmentStatus: string | null;
  orders?: BatchOrder[];
}

// ---- Vendors ---------------------------------------------------------------

export interface VendorListItem {
  id: string;
  campusId: string;
  legalName: string;
  displayName: string;
  slug: string;
  status: VendorStatus;
  active: boolean;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Vendor extends VendorListItem {
  description: string | null;
}
export interface VendorPerformance {
  orderCount?: number;
  grossSalesKobo?: number;
  reviewCount?: number;
  averageVendorRating?: number | null;
}

// ---- Vendor menu -----------------------------------------------------------

export interface MenuCategory {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
export interface MenuItem {
  id: string;
  vendorId: string;
  categoryId: string | null;
  categoryName: string | null;
  unitTypeId: string;
  unitCode: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceKobo: number;
  countsTowardSpoonLimit: boolean;
  requiresSoup: boolean;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
/** Categories + active unit types, used to populate the menu-item editor. */
export interface MenuMetadata {
  categories: MenuCategory[];
  unitTypes: UnitType[];
}
export interface CreateMenuItemInput {
  categoryId?: string | null;
  unitTypeId: string;
  name: string;
  description?: string | null;
  priceKobo: number;
  requiresSoup?: boolean;
  displayOrder?: number;
}
export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;
// ---- Riders ----------------------------------------------------------------

export interface RiderListItem {
  id: string;
  campusId: string;
  userId: string;
  displayName: string;
  phone: string | null;
  status: RiderStatus;
  active: boolean;
  available: boolean;
  verifiedAt: string | null;
  createdAt: string;
}
export interface Rider extends RiderListItem {
  updatedAt: string;
}
export interface RiderAssignment {
  id: string;
  batchId: string;
  riderId: string;
  status: string;
  assignedAt: string | null;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  completedAt: string | null;
  campusId: string;
  vendorId: string;
  vendorDisplayName: string;
  serviceDate: string;
  batchNumber: string;
  orderCount: number;
}

// ---- Inventory -------------------------------------------------------------

export interface InventoryRow {
  id: string;
  vendorId: string;
  campusId: string;
  menuItemName: string;
  serviceDate: string;
  deliverySlotId: string;
  quantityTotal: number;
  quantityReserved: number;
  quantitySold: number;
  quantityAdjusted: number;
  remainingQuantity: number;
}

// ---- Escalations -----------------------------------------------------------

export interface EscalationListItem {
  id: string;
  orderId: string;
  campusId: string;
  openedBy: string;
  category: string;
  description: string;
  status: EscalationStatus;
  assignedAdminId: string | null;
  openedAt: string;
}
export interface Escalation {
  id: string;
  orderId: string;
  campusId: string;
  category: string;
  description: string;
  status: EscalationStatus;
  resolution: string | null;
  assignedAdminId: string | null;
  refundId: string | null;
  openedAt: string;
  resolvedAt: string | null;
}

// ---- Settlements -----------------------------------------------------------

export interface SettlementListItem {
  id: string;
  campusId: string;
  vendorId: string | null;
  riderId: string | null;
  settlementDate: string;
  status: SettlementStatus;
  payableKobo: number;
  paidAt: string | null;
  externalReference: string | null;
  createdAt: string;
}
export interface Settlement extends Omit<SettlementListItem, 'createdAt'> {
  grossFoodAmountKobo: number;
  deliveryEarningsKobo: number;
  refundsKobo: number;
  adjustmentsKobo: number;
}
/** Beneficiary bank account for a settlement, fetched from Paystack for manual payout. */
export interface PayoutDestination {
  settlementId: string;
  payableKobo: number;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
}
/** Automated payout transfer initiated via Paystack for a settlement. */
export interface PayoutTransferRecord {
  id: string;
  settlementId: string;
  reference: string;
  amountKobo: number;
  providerTransferCode: string | null;
  status: string;
}
export interface SettlementPreview {
  beneficiaryType: BeneficiaryType;
  beneficiaryId: string;
  settlementDate: string;
  grossFoodAmountKobo?: number;
  deliveryEarningsKobo?: number;
  refundsKobo?: number;
  estimatedPayableKobo?: number;
}

// ---- Reviews ---------------------------------------------------------------

export interface Review {
  id: string;
  orderId: string;
  campusId: string;
  vendorId: string;
  foodRating: number | null;
  vendorRating: number | null;
  deliveryRating: number | null;
  comment: string | null;
  moderationStatus: ReviewStatus;
  createdAt: string;
}

// ---- Users -----------------------------------------------------------------

export interface UserRecord {
  id: string;
  displayName: string;
  email: string | null;
  phoneNumber: string | null;
  accountStatus: AccountStatus;
  defaultCampusId: string | null;
  createdAt: string;
}

/** Result of DELETE /admin/users/:id. `anonymized` when the user had order history. */
export interface DeleteUserResult {
  userId: string;
  outcome: 'deleted' | 'anonymized';
}

// ---- Admin memberships -----------------------------------------------------

export interface AdminMembership {
  id: string;
  userId: string;
  campusId: string | null;
  role: AdminRole;
  active: boolean;
  grantedAt: string;
  revokedAt: string | null;
}

// ---- Vendor invitations -----------------------------------------------------

export type VendorInvitationStatus = 'pending' | 'accepted' | 'revoked';
export type VendorUserRole = 'owner' | 'staff';

export interface VendorInvitation {
  id: string;
  vendorId: string;
  email: string;
  role: VendorUserRole;
  createdByAdminId: string;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedByUserId: string | null;
  revokedAt: string | null;
  createdAt: string;
}
/** Returned only from the create-invitation call; the raw token is never retrievable again. */
export interface VendorInvitationCreated extends VendorInvitation {
  inviteUrl: string;
}

// ---- Analytics & Audit -----------------------------------------------------

export interface AnalyticsData {
  orderCount?: number;
  grossSalesKobo?: number;
  activeVendorCount?: number;
}
export interface AuditLog {
  id: string;
  actorUserId: string | null;
  campusId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  requestId: string | null;
  createdAt: string;
}
