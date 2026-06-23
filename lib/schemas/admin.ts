import { z } from 'zod';

/**
 * Zod schemas for the raw Meal Direct admin DTOs (kobo amounts, snake_case enums,
 * id references). Permissive on purpose: the backend may add fields, and some
 * admin list endpoints don't fully document their response body. We validate the
 * fields we consume and ignore the rest.
 */

export const OrderDtoSchema = z.object({
  id: z.string(),
  orderNumber: z.string().optional(),
  vendorDisplayName: z.string().optional(),
  customerId: z.string().optional(),
  campusId: z.string().optional(),
  orderStatus: z.string().optional(),
  totalKobo: z.number().optional(),
  currency: z.string().optional(),
  createdAt: z.string().optional(),
  serviceDate: z.string().optional(),
}).passthrough();

export const PaymentDtoSchema = z.object({
  id: z.string(),
  providerReference: z.string().optional(),
  paymentStatus: z.string().optional(),
  paidAmountKobo: z.number().optional(),
  expectedAmountKobo: z.number().optional(),
  currency: z.string().optional(),
  paidAt: z.string().optional(),
  initializedAt: z.string().optional(),
}).passthrough();

export const CampusDtoSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  active: z.boolean().optional(),
}).passthrough();

export const RiderDtoSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  campusId: z.string().optional(),
  status: z.string().optional(),
  active: z.boolean().optional(),
}).passthrough();

export const VendorDtoSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  legalName: z.string().optional(),
  campusId: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

export const EscalationDtoSchema = z.object({
  id: z.string(),
  openedBy: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  openedAt: z.string().optional(),
}).passthrough();

export const SettlementDtoSchema = z.object({
  id: z.string(),
  vendorId: z.string().optional(),
  payableKobo: z.number().optional(),
  status: z.string().optional(),
  settlementDate: z.string().optional(),
}).passthrough();

export const UserDtoSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  fullName: z.string().optional(),
  campusId: z.string().optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const AuditLogDtoSchema = z.object({
  id: z.string().optional(),
  action: z.string().optional(),
  actor: z.string().optional(),
  actorId: z.string().optional(),
  level: z.string().optional(),
  severity: z.string().optional(),
  createdAt: z.string().optional(),
}).passthrough();

/** A list envelope: { data: T[] } (some endpoints also add pagination). */
export const listEnvelope = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: z.array(item) }).passthrough();
