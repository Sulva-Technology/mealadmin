import { statusTone, toneClass, titleize, type Tone } from '@/lib/format';

export function StatusBadge({ status, tone }: { status?: string | null; tone?: Tone }) {
  const t = tone ?? statusTone(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${toneClass(t)}`}>
      {titleize(status)}
    </span>
  );
}
