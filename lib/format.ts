/**
 * Display formatting helpers. Money is integer kobo (1/100 NGN) per the backend
 * contract; never do float math on it before the final divide-by-100 here.
 */

const NGN = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Integer kobo -> "₦12,345" display string. */
export function formatKobo(kobo?: number | null): string {
  if (typeof kobo !== 'number' || Number.isNaN(kobo)) return '₦0';
  return NGN.format(kobo / 100);
}

/** Integer kobo -> naira number for an editable input (e.g. 30000 -> 300). */
export function koboToNaira(kobo?: number | null): number {
  if (typeof kobo !== 'number' || Number.isNaN(kobo)) return 0;
  return kobo / 100;
}

/** Naira input (string or number) -> integer kobo (e.g. "300" -> 30000). */
export function nairaToKobo(naira: string | number): number {
  const n = typeof naira === 'number' ? naira : parseFloat(naira);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

/** ISO datetime/date text -> localized date-time. Campus tz when provided. */
export function formatDateTime(value?: string | null, timeZone?: string): string {
  if (!value) return '—';
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(d);
}

/** ISO date -> "23 Jun 2026". */
export function formatDate(value?: string | null, timeZone?: string): string {
  if (!value) return '—';
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeZone }).format(d);
}

/** ISO datetime -> 24-hour "18:20" clock. Campus tz when provided. */
export function formatTime(value?: string | null, timeZone?: string): string {
  if (!value) return '';
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(d);
}

/** Backend clock string "HH:MM:SS" -> "HH:MM" (delivery-slot times). */
export function formatClock(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 5);
}

/** Today as YYYY-MM-DD in the user's local timezone (for default service-date filters). */
export function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** snake_case / "pending_payment" -> "Pending Payment". */
export function titleize(s?: string | null): string {
  if (!s) return '—';
  return s
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

/** Tailwind chip classes (matches globals.css tokens) for a status family. */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_CLASS: Record<Tone, string> = {
  success: 'bg-success/15 text-primary-strong',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  info: 'bg-info/15 text-info',
  neutral: 'bg-canvas text-muted dark:bg-ink/60',
};

export function toneClass(tone: Tone): string {
  return TONE_CLASS[tone];
}

/** Maps a raw backend status string to a display tone. */
export function statusTone(status?: string | null): Tone {
  const s = (status ?? '').toLowerCase();
  if (
    ['approved', 'active', 'verified', 'paid', 'delivered', 'completed', 'resolved', 'success', 'available', 'received', 'processed']
      .includes(s)
  )
    return 'success';
  if (
    ['pending', 'pending_payment', 'draft', 'open', 'investigating', 'preparing', 'low', 'processing', 'requested', 'initiated', 'not_received', 'not_verified', 'required']
      .includes(s)
  )
    return 'warning';
  if (
    ['suspended', 'deactivated', 'cancelled', 'expired', 'refunded', 'rejected', 'failed', 'sold_out', 'mismatch', 'abandoned']
      .includes(s)
  )
    return 'danger';
  if (['accepted', 'confirmed', 'assigned', 'in_progress', 'out_for_delivery', 'ready'].includes(s))
    return 'info';
  return 'neutral';
}
