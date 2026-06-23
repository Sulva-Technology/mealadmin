import { describe, it, expect } from 'vitest';
import { formatKobo, titleize, statusTone, todayISO } from '@/lib/format';

describe('formatKobo', () => {
  it('renders integer kobo as NGN naira', () => {
    expect(formatKobo(1234500)).toContain('12,345');
    expect(formatKobo(0)).toBe('₦0');
  });
  it('is defensive about nullish input', () => {
    expect(formatKobo(undefined)).toBe('₦0');
    expect(formatKobo(null)).toBe('₦0');
  });
});

describe('titleize', () => {
  it('humanizes snake_case enums', () => {
    expect(titleize('pending_payment')).toBe('Pending Payment');
    expect(titleize('out_for_delivery')).toBe('Out For Delivery');
    expect(titleize(undefined)).toBe('—');
  });
});

describe('statusTone', () => {
  it('maps backend statuses to display tones', () => {
    expect(statusTone('approved')).toBe('success');
    expect(statusTone('pending')).toBe('warning');
    expect(statusTone('suspended')).toBe('danger');
    expect(statusTone('out_for_delivery')).toBe('info');
    expect(statusTone('whatever')).toBe('neutral');
  });
});

describe('todayISO', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
