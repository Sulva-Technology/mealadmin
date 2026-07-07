# CONTRACT GAPS

Tracks frontend/backend gaps after wiring the admin UI to the admin API
base path `/v1/admin`.

## Wired

The existing admin dashboard remains wired against live endpoints through the
same-origin proxy: session, dashboard, orders, batches, vendors, riders,
inventory, escalations, settlements, reviews, users, admin memberships,
analytics, audit logs, campus configuration, unit types, notifications, and
notification preferences.

New finance and ops surfaces are now wired with typed API methods:
payments, payment details, reconciliation queues, refunds, refund details,
system health, webhook viewer, webhook detail, and support notes/escalations.

The frontend does not fake financial success. If an endpoint below is missing,
the UI shows the real backend error and keeps the authoritative state unchanged.

## Pagination Contract

All list endpoints should return:

```ts
{
  data: T[];
  pagination: {
    hasMore: boolean;
    limit: number;
    nextCursor?: string;
    previousCursor?: string;
    total?: number;
  };
}
```

The UI uses `nextCursor`, backend `previousCursor` when present, local cursor
history as fallback, and displays `total` when returned.

## Required Payments Endpoints

`GET /v1/admin/payments`

Query: `cursor`, `limit`, `campusId`, `status`, `refundStatus`, `vendorId`,
`from`, `to`, `minAmountKobo`, `maxAmountKobo`, `webhookReceived`,
`requiresReview`, `search`.

Response item fields: `id`, `paymentReference`, `paystackReference`, `orderId`,
`orderNumber?`, `customerId`, `customerName`, `customerEmail`, `customerPhone`,
`vendorId`, `vendorDisplayName`, `campusId`, `campusName?`,
`amountExpectedKobo`, `amountPaidKobo`, `currency`, `paymentStatus`,
`orderStatus`, `webhookReceived`, `verificationStatus`, `refundStatus`,
`requiresAdminReview`, `settlementId?`, `createdAt`, `updatedAt`.

`GET /v1/admin/payments/:id`

Returns the list fields plus `orderSummary`, `customer`, `vendor`,
`riderDelivery`, `amountBreakdown`, `paystackVerification`, `webhookEvents`,
`refundHistory`, `adminNotes`, `adminActions`, `timeline`, `settlementImpact`.

Mutation endpoints:

- `POST /v1/admin/payments/:id/verify`
- `POST /v1/admin/payments/:id/review` body `{ note?: string }`
- `POST /v1/admin/payments/:id/notes` body `{ note: string }`
- `POST /v1/admin/payments/:id/refunds` body `{ amountKobo: number, reason: string }`

Backend must enforce refund eligibility, permissions, idempotency,
duplicate-refund prevention, and settlement impact.

## Required Reconciliation Endpoints

`GET /v1/admin/payments/problem-queues`

Query: `queue`, `cursor`, `limit`.

Response item fields: `id`, `paymentId?`, `queue`, `severity`,
`paymentReference`, `orderId`, `customerName`, `customerEmail`, `amountKobo`,
`currency`, `issueAgeSeconds`, `suggestedAction`, `reviewedAt?`.

Mutation endpoint:

- `POST /v1/admin/payments/problem-queues/:id/review` body `{ note?: string }`

## Required Refunds Endpoints

`GET /v1/admin/refunds`

Query: `cursor`, `limit`, `campusId`, `status`, `adminActionRequired`,
`search`, `orderId`.

Response item fields: `id`, `orderId`, `paymentId?`, `paymentReference`,
`customerName`, `customerEmail`, `vendorDisplayName`, `amountKobo`, `currency`,
`reason`, `status`, `requestedAt`, `processedAt`, `adminActionRequired`.

`GET /v1/admin/refunds/:id`

Returns the list fields plus `originalPayment`, `orderSummary`,
`customerReason`, `eligibilityState`, `paystackRefundStatus`, `timeline`,
`adminNotes`, `settlementImpact`.

Mutation endpoints:

- `POST /v1/admin/refunds/:id/approve` body `{ note?: string }`
- `POST /v1/admin/refunds/:id/reject` body `{ reason: string }`
- `POST /v1/admin/refunds/:id/initiate` body `{ amountKobo: number, reason: string }`
- `POST /v1/admin/refunds/:id/retry`
- `POST /v1/admin/refunds/:id/mark-manually-resolved` body `{ note: string }`
- `POST /v1/admin/refunds/:id/notes` body `{ note: string }`

Backend must enforce permissions, idempotency, duplicate prevention, Paystack
state checks, and settlement safety.

## Required Health And Webhook Endpoints

`GET /v1/admin/health`

Response fields: `api`, `database`, `paystack`, `lastSuccessfulWebhookAt`,
`lastFailedWebhookAt`, `failedWebhookCount`, `pendingReconciliationCount`,
`failedJobsCount?`.

`GET /v1/admin/webhooks`

Query: `cursor`, `limit`, `status`.

Response item fields: `id`, `eventType`, `paymentReference`, `orderId`,
`signatureVerified`, `processingStatus`, `receivedAt`, `processedAt`,
`failureReason`, `retryCount`.

`GET /v1/admin/webhooks/:id`

Returns the list fields plus `safeSummary` and `processingLogs`.

Mutation endpoints:

- `POST /v1/admin/webhooks/:id/retry`
- `POST /v1/admin/webhooks/:id/review` body `{ note?: string }`

## Required Support Workflow Endpoints

- `POST /v1/admin/orders/:id/notes` body `{ note: string }`
- `POST /v1/admin/orders/:id/escalations` body `{ reason: string }`
- `POST /v1/admin/users/:id/notes` body `{ note: string }`
- `POST /v1/admin/users/:id/escalations` body `{ reason: string }`
- `POST /v1/admin/users/:id/issues/resolve` body `{ note?: string }`

## Vendor Invitation Endpoints (wired)

The admin UI onboards vendor users **by email invite + signup link only**
(the raw-UUID "Add Vendor User" flow was removed). Both `owner` and `staff`
are invited through the same path. Backend implemented in `mealdirectbackend`
(migration `20260704000500_vendor_invitation_role.sql`).

`GET /v1/admin/vendors/:id/invitations`

Lists invitations, newest first. Response items: `id`, `vendorId`, `email`,
`role` (`owner`|`staff`), `createdByAdminId`, `expiresAt`, `acceptedAt`,
`acceptedByUserId`, `revokedAt`, `createdAt`. (Previously 404 — now added.)

`POST /v1/admin/vendors/:id/invitations`

Body: `{ email: string; role: 'owner' | 'staff'; expiresInHours?: number }`
(`role` defaults to `staff`; `expiresInHours` 1–168, default 72).
Response: the item fields above **plus `inviteUrl`** (one-time signup link;
raw token is not stored and never retrievable again).

Accept flow (`POST /v1/auth/vendor/accept-invite`): visiting `inviteUrl` lets
the recipient sign up and attaches them to the vendor with the **invited
`role`** (no longer hardcoded to `owner`), setting `acceptedAt` /
`acceptedByUserId`.

`POST /v1/admin/vendors/:id/users` body `{ userId: string; role }` still exists
for linking an already-existing user by id, but is no longer surfaced in the UI.

## Vendor Menu Endpoints (wired)

Admins add and edit any vendor's menu from the vendor detail page. Backend
implemented in `mealdirectbackend` (`AdminVendorMenuController`, gated on
`campus_admin`/`super_admin`), reusing the vendor menu repository so admin edits
and vendor self-service edits share one source of truth.

`GET /v1/admin/vendors/:vendorId/menu-metadata` — categories + active unit types
used to populate the item editor.

`GET /v1/admin/vendors/:vendorId/menu-items` — all items incl. inactive. Item
fields: `id`, `vendorId`, `categoryId`, `categoryName`, `unitTypeId`, `unitCode`,
`name`, `description`, `imageUrl`, `priceKobo`, `countsTowardSpoonLimit`,
`requiresSoup`, `active`, `displayOrder`, `createdAt`, `updatedAt`.

Mutation endpoints:

- `POST /v1/admin/vendors/:vendorId/menu-categories` body `{ name, displayOrder? }`
- `POST /v1/admin/vendors/:vendorId/menu-items` body
  `{ categoryId?, unitTypeId, name, description?, priceKobo, requiresSoup?, displayOrder? }`
- `PATCH /v1/admin/vendors/:vendorId/menu-items/:itemId` (same fields, all optional)
- `POST /v1/admin/vendors/:vendorId/menu-items/:itemId/activate`
- `POST /v1/admin/vendors/:vendorId/menu-items/:itemId/deactivate`

## Still Deferred

- `GET/POST /v1/admin/promotions*` - out of scope.
- User profile editing (`/v1/me`) - settings page remains read-only.
