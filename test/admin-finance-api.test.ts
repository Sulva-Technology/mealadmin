import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('admin finance api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('queries payments and payment details through typed admin endpoints', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: [] }));

    await api.getPayments({
      limit: 20,
      cursor: 'c1',
      status: 'paid',
      paymentReference: 'PAY-1',
      paystackReference: 'PSK-1',
      customer: 'ada@example.com',
      webhookReceived: 'false',
      requiresReview: 'true',
    });
    await api.getPayment('pay-1');
    await api.verifyPayment('pay-1');
    await api.markPaymentForReview('pay-1', { note: 'Amount mismatch' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/proxy/admin/payments?limit=20&cursor=c1&status=paid&paymentReference=PAY-1&paystackReference=PSK-1&customer=ada%40example.com&webhookReceived=false&requiresReview=true',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/proxy/admin/payments/pay-1',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/proxy/admin/payments/pay-1/verify',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      '/api/proxy/admin/payments/pay-1/review',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ note: 'Amount mismatch' }),
      }),
    );
  });

  it('routes refunds, reconciliation queues, and health diagnostics without fake success paths', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: [] }));

    await api.getRefunds({ status: 'requested', orderId: 'ord-1' });
    await api.getRefund('refund-1');
    await api.approveRefund('refund-1', { note: 'Eligible cancellation' });
    await api.rejectRefund('refund-1', { reason: 'Outside refund window' });
    await api.initiateRefund('refund-1', { amountKobo: 250000, reason: 'Customer approved refund' });
    await api.retryRefund('refund-1');
    await api.markRefundManuallyResolved('refund-1', { note: 'Resolved in Paystack dashboard' });
    await api.getPaymentQueues({ queue: 'webhook_not_received' });
    await api.getSystemHealth();
    await api.getWebhooks({ status: 'failed' });
    await api.getWebhook('evt-1');
    await api.retryWebhook('evt-1');
    await api.markWebhookReviewed('evt-1', { note: 'Duplicate ignored' });

    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      '/api/proxy/admin/refunds?status=requested&orderId=ord-1',
      '/api/proxy/admin/refunds/refund-1',
      '/api/proxy/admin/refunds/refund-1/approve',
      '/api/proxy/admin/refunds/refund-1/reject',
      '/api/proxy/admin/refunds/refund-1/initiate',
      '/api/proxy/admin/refunds/refund-1/retry',
      '/api/proxy/admin/refunds/refund-1/mark-manually-resolved',
      '/api/proxy/admin/payments/problem-queues?queue=webhook_not_received',
      '/api/proxy/admin/health',
      '/api/proxy/admin/webhooks?status=failed',
      '/api/proxy/admin/webhooks/evt-1',
      '/api/proxy/admin/webhooks/evt-1/retry',
      '/api/proxy/admin/webhooks/evt-1/review',
    ]);
  });
});
