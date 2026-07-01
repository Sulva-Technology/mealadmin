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

export type AdminRole = 'campus_admin' | 'super_admin';
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
  countsTowardSpoonLimit: boolean;
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
  orderStatus: OrderStatus;
  deliveryMode: string;
  totalKobo: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}
export interface Order extends Omit<OrderListItem, 'deliverySlotId' | 'locationId'> {
  customerEmail: string | null;
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
export interface Batch
  extends Omit<BatchListItem, 'deliverySlotId' | 'zoneId'> {
  assignmentId: string | null;
  riderId: string | null;
  assignmentStatus: string | null;
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
export interface VendorInvitation {
  id: string;
  vendorId: string;
  email: string;
  createdByAdminId: string;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedByUserId: string | null;
  revokedAt: string | null;
  createdAt: string;
  inviteUrl?: string;
}

// ---- Riders ----------------------------------------------------------------

export interface RiderListItem {
  id: string;
  campusId: string;
  userId: string;
  displayName: string;
  phone: string | null;
  status: RiderStatus;
  active: boolean;
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

export interface VendorInvitation {
  id: string;
  vendorId: string;
  email: string;
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
