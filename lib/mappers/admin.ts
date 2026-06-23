import type { z } from 'zod';
import type {
  Order, Payment, Campus, Rider, Vendor, Complaint, Commission, Student, SystemLog,
} from '@/store/useAppStore';
import {
  OrderDtoSchema, PaymentDtoSchema, CampusDtoSchema, RiderDtoSchema, VendorDtoSchema,
  EscalationDtoSchema, SettlementDtoSchema, UserDtoSchema, AuditLogDtoSchema,
} from '@/lib/schemas/admin';

type OrderDto = z.infer<typeof OrderDtoSchema>;
type PaymentDto = z.infer<typeof PaymentDtoSchema>;
type CampusDto = z.infer<typeof CampusDtoSchema>;
type RiderDto = z.infer<typeof RiderDtoSchema>;
type VendorDto = z.infer<typeof VendorDtoSchema>;
type EscalationDto = z.infer<typeof EscalationDtoSchema>;
type SettlementDto = z.infer<typeof SettlementDtoSchema>;
type UserDto = z.infer<typeof UserDtoSchema>;
type AuditLogDto = z.infer<typeof AuditLogDtoSchema>;

/** id -> display name resolver (e.g. campusId -> campus name). */
export type NameLookup = (id?: string) => string;

const kobo = (v?: number) => (typeof v === 'number' ? Math.round(v) / 100 : 0);
const titleize = (s?: string) =>
  (s ?? '').split(/[_\s]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

const ORDER_STATUS: Record<string, Order['status']> = {
  pending_payment: 'Pending', pending: 'Pending',
  accepted: 'Preparing', confirmed: 'Preparing', paid: 'Preparing', preparing: 'Preparing',
  ready: 'Out for Delivery', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', administratively_completed: 'Delivered',
  cancelled: 'Cancelled', expired: 'Cancelled', refunded: 'Cancelled',
};

export function mapOrder(d: OrderDto, campusName: NameLookup): Order {
  return {
    id: d.id,
    vendor: d.vendorDisplayName ?? '—',
    student: d.customerId ?? '—',
    campus: campusName(d.campusId),
    status: ORDER_STATUS[d.orderStatus ?? ''] ?? 'Pending',
    amount: kobo(d.totalKobo),
    date: d.createdAt ?? d.serviceDate ?? '',
  };
}

export function mapPayment(d: PaymentDto): Payment {
  const s = (d.paymentStatus ?? '').toLowerCase();
  const status: Payment['status'] =
    ['success', 'succeeded', 'paid', 'completed'].includes(s) ? 'Completed'
    : ['pending', 'processing', 'initialized'].includes(s) ? 'Pending'
    : 'Failed';
  return {
    id: d.id,
    amount: kobo(d.paidAmountKobo ?? d.expectedAmountKobo),
    status,
    date: d.paidAt ?? d.initializedAt ?? '',
    method: 'Paystack',
    reference: d.providerReference ?? d.id,
  };
}

export function mapCampus(d: CampusDto): Campus {
  return { id: d.id, name: d.name ?? d.id, status: d.active === false ? 'Inactive' : 'Active' };
}

export function mapRider(d: RiderDto, campusName: NameLookup): Rider {
  const s = (d.status ?? '').toLowerCase();
  const status: Rider['status'] =
    s === 'suspended' || s === 'deactivated' ? 'Suspended'
    : d.active && s === 'verified' ? 'Active'
    : 'Offline';
  return {
    id: d.id,
    name: d.displayName ?? '—',
    phone: d.phone ?? '',
    campus: campusName(d.campusId),
    status,
    deliveries: 0,
    rating: 0,
  };
}

export function mapVendor(d: VendorDto, campusName: NameLookup): Vendor {
  const s = (d.status ?? '').toLowerCase();
  const status: Vendor['status'] =
    s === 'approved' ? 'Active' : s === 'pending' ? 'Pending' : 'Suspended';
  return {
    id: d.id,
    name: d.displayName ?? d.legalName ?? '—',
    campus: campusName(d.campusId),
    status,
    rating: 0,
    totalOrders: 0,
  };
}

export function mapEscalation(d: EscalationDto): Complaint {
  const s = (d.status ?? '').toLowerCase();
  const status: Complaint['status'] =
    s === 'open' ? 'Open' : s === 'investigating' ? 'In Progress' : 'Resolved';
  return {
    id: d.id,
    user: d.openedBy ?? '—',
    subject: titleize(d.category) || (d.description ?? '—'),
    status,
    date: d.createdAt ?? d.openedAt ?? '',
  };
}

export function mapSettlement(d: SettlementDto, vendorName: NameLookup): Commission {
  return {
    id: d.id,
    vendor: vendorName(d.vendorId),
    amount: kobo(d.payableKobo),
    rate: '—',
    status: (d.status ?? '').toLowerCase() === 'paid' ? 'Paid' : 'Pending',
    date: d.settlementDate ?? '',
  };
}

export function mapUser(d: UserDto, campusName: NameLookup): Student {
  return {
    id: d.id,
    name: d.displayName ?? d.fullName ?? d.email ?? '—',
    email: d.email ?? '',
    campus: campusName(d.campusId),
    orders: 0,
    joined: d.createdAt ?? '',
  };
}

export function mapAuditLog(d: AuditLogDto): SystemLog {
  const level = (d.level ?? d.severity ?? 'info').toLowerCase();
  return {
    id: d.id ?? crypto.randomUUID(),
    action: titleize(d.action) || '—',
    user: d.actor ?? d.actorId ?? 'System',
    date: d.createdAt ?? '',
    level: level === 'error' ? 'Error' : level === 'warning' || level === 'warn' ? 'Warning' : 'Info',
  };
}
