import { describe, it, expect } from 'vitest';
import {
  mapOrder, mapPayment, mapCampus, mapRider, mapVendor,
  mapEscalation, mapSettlement, mapUser,
} from '@/lib/mappers/admin';

const campusName = (id?: string) => (id === 'cmp1' ? 'UNILAG' : id ?? '—');
const vendorName = (id?: string) => (id === 'vnd1' ? 'Spice Route' : id ?? '—');

describe('mapOrder', () => {
  it('converts kobo to naira and maps status to a UI label', () => {
    const o = mapOrder(
      { id: 'o1', vendorDisplayName: 'Burger Queen', customerId: 'c1', campusId: 'cmp1',
        orderStatus: 'out_for_delivery', totalKobo: 450000, createdAt: '2026-01-01' },
      campusName
    );
    expect(o.amount).toBe(4500);
    expect(o.status).toBe('Out for Delivery');
    expect(o.vendor).toBe('Burger Queen');
    expect(o.campus).toBe('UNILAG');
  });

  it('falls back to Pending for unknown status', () => {
    expect(mapOrder({ id: 'o', orderStatus: 'who_knows' }, campusName).status).toBe('Pending');
  });
});

describe('mapPayment', () => {
  it('maps provider status to Completed/Pending/Failed', () => {
    expect(mapPayment({ id: 'p', paymentStatus: 'success', paidAmountKobo: 100000 }).status).toBe('Completed');
    expect(mapPayment({ id: 'p', paymentStatus: 'pending' }).status).toBe('Pending');
    expect(mapPayment({ id: 'p', paymentStatus: 'reversed' }).status).toBe('Failed');
  });
});

describe('mapCampus', () => {
  it('maps active boolean to status', () => {
    expect(mapCampus({ id: 'c', name: 'OAU', active: true }).status).toBe('Active');
    expect(mapCampus({ id: 'c', name: 'OAU', active: false }).status).toBe('Inactive');
  });
});

describe('mapRider', () => {
  it('verified + active -> Active, suspended -> Suspended', () => {
    expect(mapRider({ id: 'r', status: 'verified', active: true }, campusName).status).toBe('Active');
    expect(mapRider({ id: 'r', status: 'suspended' }, campusName).status).toBe('Suspended');
    expect(mapRider({ id: 'r', status: 'pending' }, campusName).status).toBe('Offline');
  });
});

describe('mapVendor', () => {
  it('approved -> Active, pending -> Pending, else Suspended', () => {
    expect(mapVendor({ id: 'v', status: 'approved' }, campusName).status).toBe('Active');
    expect(mapVendor({ id: 'v', status: 'pending' }, campusName).status).toBe('Pending');
    expect(mapVendor({ id: 'v', status: 'deactivated' }, campusName).status).toBe('Suspended');
  });
});

describe('mapEscalation', () => {
  it('maps investigating -> In Progress', () => {
    expect(mapEscalation({ id: 'e', status: 'investigating', category: 'late_delivery' }).status).toBe('In Progress');
    expect(mapEscalation({ id: 'e', status: 'open' }).status).toBe('Open');
  });
});

describe('mapSettlement', () => {
  it('resolves vendor name and converts payable', () => {
    const c = mapSettlement({ id: 's', vendorId: 'vnd1', payableKobo: 320000, status: 'paid' }, vendorName);
    expect(c.vendor).toBe('Spice Route');
    expect(c.amount).toBe(3200);
    expect(c.status).toBe('Paid');
  });
});

describe('mapUser', () => {
  it('prefers displayName, falls back to email', () => {
    expect(mapUser({ id: 'u', email: 'a@b.com' }, campusName).name).toBe('a@b.com');
    expect(mapUser({ id: 'u', displayName: 'Ada', email: 'a@b.com' }, campusName).name).toBe('Ada');
  });
});
