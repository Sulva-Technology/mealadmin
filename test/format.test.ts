import { describe, it, expect } from 'vitest';
import { formatKobo, titleize, statusTone, todayISO, koboToNaira, nairaToKobo } from '@/lib/format';

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

describe('kobo <-> naira', () => {
  it('koboToNaira divides by 100', () => {
    expect(koboToNaira(30000)).toBe(300);
    expect(koboToNaira(7500)).toBe(75);
    expect(koboToNaira(undefined)).toBe(0);
    expect(koboToNaira(null)).toBe(0);
  });
  it('nairaToKobo multiplies by 100 and rounds', () => {
    expect(nairaToKobo('300')).toBe(30000);
    expect(nairaToKobo(75)).toBe(7500);
    expect(nairaToKobo('249.99')).toBe(24999);
    expect(nairaToKobo('')).toBe(0);
  });
  it('round-trips a fee value', () => {
    expect(nairaToKobo(koboToNaira(30000))).toBe(30000);
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
