'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { Check, Copy, Download, ExternalLink, Palette, QrCode, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import type { Campus } from '@/lib/types';
import { abbreviateCampus, campaignDestination, FLYER_TEMPLATES, type CampaignStage, type FlyerTemplate } from '@/lib/campaign-studio';
import { AsyncBoundary, Card, PageHeader } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { FilterSelect, Select, TextArea, TextField } from '@/components/ui/Inputs';
import { useToast } from '@/components/ui/Toast';

type Draft = { headline: string; supporting: string; cta: string; stage: CampaignStage };

function readSavedDraft(storageKey: string, stage: CampaignStage): Draft | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null') as Draft | null;
    return saved?.stage === stage ? saved : null;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

const CATEGORY_LABELS: Record<FlyerTemplate['category'], string> = {
  launch: 'Launch', order: 'Ordering', offer: 'Community', vendor: 'Vendor', recruit: 'Recruitment', guide: 'Guide', print: 'Print',
};

const PALETTE = {
  forest: '#09271d',
  cream: '#fff7e5',
  lime: '#b9f800',
  green: '#00a86b',
  leaf: '#dff7e6',
  tomato: '#ef633f',
} as const;

type PosterTone = { surface: string; ink: string; signal: string };

const POSTER_TONES: Record<number, PosterTone> = {
  0: { surface: PALETTE.forest, ink: PALETTE.cream, signal: PALETTE.lime },
  1: { surface: PALETTE.cream, ink: PALETTE.forest, signal: PALETTE.green },
  2: { surface: PALETTE.lime, ink: PALETTE.forest, signal: PALETTE.cream },
  3: { surface: PALETTE.leaf, ink: PALETTE.forest, signal: PALETTE.tomato },
};

const COPY_LAYOUT: Record<number, string> = {
  1: 'mt-auto max-w-[94%] pb-4', 2: 'mt-10 max-w-[76%]', 3: 'mt-auto ml-auto max-w-[72%] pb-8 text-right', 4: 'mt-24 max-w-[88%]',
  5: 'mt-10 ml-auto max-w-[64%] text-right', 6: 'mt-auto max-w-[84%] pb-4', 7: 'mt-12 max-w-[72%]', 8: 'mt-auto max-w-[78%] pb-5',
  9: 'mt-16 max-w-[67%]', 10: 'mt-10 max-w-[74%]', 11: 'mt-auto max-w-[72%] pb-5', 12: 'mt-10 max-w-[80%]',
  13: 'mt-auto max-w-[72%] pb-7', 14: 'mt-10 max-w-[85%]', 15: 'mt-12 mx-auto max-w-[86%] text-center', 16: 'mt-auto max-w-[83%] pb-5',
  17: 'mt-10 max-w-[82%]', 18: 'mt-auto max-w-[80%] pb-5', 19: 'mt-auto mx-auto max-w-[86%] pb-6 text-center', 20: 'mt-10 max-w-[70%]',
  21: 'mt-12 max-w-[84%]', 22: 'mt-auto max-w-[80%] pb-6', 23: 'mt-16 max-w-[72%]', 24: 'mt-auto mx-auto max-w-[88%] pb-7 text-center',
  25: 'mt-10 max-w-[72%]', 26: 'mt-auto mx-auto max-w-[86%] pb-6 text-center', 27: 'mt-12 max-w-[84%]', 28: 'mt-10 max-w-[68%]',
};

function FoodImage({ src, className, priority = false }: { src: string; className: string; priority?: boolean }) {
  return <Image src={src} alt="Meal Direct food or campus moment" fill priority={priority} sizes="(max-width: 768px) 100vw, 540px" className={`object-cover ${className}`} />;
}

function PosterArtwork({ number, image }: { number: number; image: string }) {
  const line = <div className="absolute h-1 bg-[#b9f800]" />;
  switch (number) {
    case 1: return <><FoodImage src={image} priority className="opacity-75" /><div className="absolute inset-0 bg-gradient-to-b from-[#09271d]/25 via-[#09271d]/5 to-[#09271d]" /><div className="absolute -right-12 top-0 h-full w-28 -skew-x-12 bg-[#b9f800]" /></>;
    case 2: return <><div className="absolute right-0 top-0 h-[47%] w-[62%] overflow-hidden"><FoodImage src={image} className="opacity-80" /></div><div className="absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full border-[38px] border-[#00a86b]" /><div className="absolute bottom-[22%] left-0 h-8 w-[115%] -rotate-12 bg-[#09271d]" /></>;
    case 3: return <><div className="absolute bottom-0 right-0 h-[54%] w-[64%] overflow-hidden rounded-tl-[55%]"><FoodImage src={image} className="opacity-95" /></div><div className="absolute left-8 top-[38%] grid grid-cols-4 gap-1">{Array.from({ length: 16 }, (_, i) => <span key={i} className={`h-4 w-4 ${i % 3 === 0 ? 'bg-[#09271d]' : 'bg-[#00a86b]'}`} />)}</div><div className="absolute -left-12 bottom-[18%] h-28 w-28 rounded-full border-[17px] border-[#09271d]" /></>;
    case 4: return <><FoodImage src={image} className="opacity-55" /><div className="absolute inset-0 bg-[#09271d]/65" /><div className="absolute right-[-20px] top-[22%] text-[260px] font-black leading-none tracking-[-.2em] text-[#b9f800]/20">M</div><div className="absolute right-0 top-0 h-full w-5 bg-[#b9f800]" /></>;
    case 5: return <><div className="absolute -right-24 -top-20 h-80 w-80 rounded-full bg-[#b9f800]" /><div className="absolute bottom-[20%] left-7 h-52 w-52 overflow-hidden rounded-full border-[9px] border-[#09271d] shadow-[9px_9px_0_#00a86b]"><FoodImage src={image} className="" /></div><div className="absolute bottom-24 left-2 rotate-[-9deg] bg-[#09271d] px-5 py-2 text-[10px] font-black tracking-[.15em] text-[#fff7e5]">WELCOME PLATE</div></>;
    case 6: return <><div className="absolute bottom-0 right-0 h-[48%] w-[78%] overflow-hidden"><FoodImage src={image} className="opacity-85" /><div className="absolute inset-0 bg-gradient-to-t from-[#09271d] to-transparent" /></div><div className="absolute left-7 top-[38%] h-px w-[72%] bg-[#b9f800]" /><div className="absolute left-[52%] top-[35%] h-7 w-7 rounded-full border-4 border-[#b9f800]" /><div className="absolute -left-16 top-20 h-48 w-48 rounded-full border-[26px] border-[#00a86b]" /></>;
    case 7: return <><div className="absolute bottom-0 h-[42%] w-full overflow-hidden"><FoodImage src={image} className="opacity-55" /><div className="absolute inset-0 bg-gradient-to-t from-[#09271d] to-transparent" /></div><div className="absolute right-6 top-16 flex h-56 items-end gap-2">{[62, 108, 155].map((height, index) => <div key={height} className="w-9 bg-[#00a86b]" style={{ height }}><span className="relative -top-5 text-[9px] font-black">0{index + 1}</span></div>)}</div></>;
    case 8: return <><div className="absolute -left-20 top-[23%] h-72 w-72 rounded-full bg-[#09271d]" /><div className="absolute bottom-24 right-7 h-60 w-60 overflow-hidden rounded-full border-[9px] border-[#fff7e5] shadow-[10px_10px_0_#00a86b]"><FoodImage src={image} className="" /></div><div className="absolute left-0 top-10 h-6 w-full -rotate-6 bg-[#fff7e5]" /></>;
    case 9: return <><div className="absolute right-0 top-0 h-full w-[42%] overflow-hidden"><FoodImage src={image} className="opacity-55" /><div className="absolute inset-0 bg-[#09271d]/35" /></div><div className="absolute bottom-28 left-7 grid grid-cols-3 gap-2">{['LECTURES', 'STUDY', 'LATE'].map((word, i) => <div key={word} className={`border-2 p-2 text-[9px] font-black ${i === 1 ? 'border-[#b9f800] bg-[#b9f800] text-[#09271d]' : 'border-[#fff7e5] text-[#fff7e5]'}`}>{word}</div>)}</div></>;
    case 10: return <><div className="absolute right-0 top-0 h-full w-[54%] overflow-hidden"><FoodImage src={image} className="" /><div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#fff7e5]" /></div><div className="absolute -right-12 -top-16 h-60 w-60 rounded-full border-[32px] border-[#00a86b]" /><div className="absolute bottom-0 h-28 w-full bg-[#09271d]" /></>;
    case 11: return <><FoodImage src={image} className="opacity-75" /><div className="absolute inset-0 bg-gradient-to-b from-[#09271d]/10 via-transparent to-[#09271d]" /><div className="absolute right-7 top-28 w-20 border border-[#fff7e5] p-2 text-[8px] font-black tracking-[.12em] text-[#fff7e5]">LOCAL<br />MADE<br />DAILY</div></>;
    case 12: return <><div className="absolute right-0 top-0 h-full w-[40%] overflow-hidden"><FoodImage src={image} className="opacity-65" /></div><div className="absolute bottom-28 left-7 right-7 rotate-[-2deg] bg-[#fff7e5] p-4 text-[#09271d] shadow-[7px_7px_0_#00a86b]">{['01 / STARTER', '02 / MAIN PLATE', '03 / EXTRA BITE'].map((item) => <div key={item} className="flex justify-between border-b border-[#09271d]/20 py-2 text-[10px] font-black last:border-0"><span>{item}</span><span>↗</span></div>)}</div></>;
    case 13: return <><div className="absolute -right-12 top-3 text-[240px] font-black leading-none tracking-[-.2em] text-[#b9f800]">+</div><div className="absolute bottom-28 left-7 flex items-end gap-2">{[58, 92, 138].map((height, index) => <div key={height} className="w-12 bg-[#00a86b]" style={{ height }}><span className="relative -top-5 text-[9px] font-black text-[#fff7e5]">0{index + 1}</span></div>)}</div><div className="absolute bottom-0 right-0 h-[48%] w-[55%] overflow-hidden"><FoodImage src={image} className="opacity-75" /></div></>;
    case 14: return <><FoodImage src={image} className="opacity-55" /><div className="absolute inset-0 bg-gradient-to-b from-[#09271d]/10 via-[#09271d]/15 to-[#fff7e5]" /><div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[#b9f800]" /><div className="absolute bottom-28 right-7 rotate-6 border-2 border-[#09271d] bg-[#fff7e5] px-4 py-3 text-[10px] font-black">BE THE PLUG →</div></>;
    case 15: return <><div className="absolute inset-x-7 bottom-28 grid grid-cols-4 gap-3">{Array.from({ length: 12 }, (_, i) => <span key={i} className={`aspect-square rounded-full ${i === 2 || i === 7 ? 'bg-[#b9f800]' : 'border border-[#fff7e5]/70'}`} />)}</div><div className="absolute left-7 top-[43%] h-px w-[72%] bg-[#b9f800]" /></>;
    case 16: return <><FoodImage src={image} className="opacity-48" /><div className="absolute inset-0 bg-[#09271d]/68" /><div className="absolute inset-0 opacity-45" style={{ backgroundImage: 'radial-gradient(#b9f800 1px, transparent 1px)', backgroundSize: '20px 20px' }} /><div className="absolute bottom-28 left-7 right-7"><div className="h-1 bg-[#b9f800]" /><div className="mt-3 flex justify-between text-[9px] font-black"><span>HOSTEL</span><span>FACULTY</span><span>HUNGER</span></div></div></>;
    case 17: return <><div className="absolute -right-10 -top-12 text-[300px] font-black leading-none tracking-[-.2em] text-[#09271d]/10">4</div><div className="absolute bottom-28 left-7 right-7 grid grid-cols-2 gap-2">{['SCAN', 'PICK', 'ORDER', 'EAT'].map((word, i) => <div key={word} className="border-2 border-[#09271d] bg-[#fff7e5] p-3"><span className="block text-[10px] font-black opacity-45">0{i + 1}</span><span className="text-[15px] font-black">{word}</span></div>)}</div></>;
    case 18: return <><div className="absolute left-0 top-0 h-full w-4 bg-[#b9f800]" /><div className="absolute bottom-28 left-7 right-7 rotate-[-2deg] border-2 border-[#09271d] bg-[#fff7e5] p-4 text-[#09271d] shadow-[6px_6px_0_#00a86b]">{['PAYMENT', 'DELIVERY', 'ENJOY'].map((word) => <div key={word} className="flex justify-between border-b border-[#09271d]/20 py-2 text-[10px] font-black last:border-0"><span>{word}</span><span>✓</span></div>)}</div></>;
    case 19: return <><FoodImage src={image} className="opacity-52" /><div className="absolute inset-0 bg-[#09271d]/55" /><div className="absolute bottom-28 left-7 right-7 border border-[#fff7e5]/70 bg-[#09271d]/80 p-4 text-[#fff7e5]"><span className="text-[38px] font-black text-[#b9f800]">“</span><p className="mt-[-10px] text-[11px] font-semibold">Real campus experiences, shared in their own words.</p><div className="mt-3 text-[9px] font-black tracking-[.13em] text-[#b9f800]">— VERIFIED STUDENT</div></div></>;
    case 20: return <><div className="absolute -right-14 -top-14 h-56 w-56 rounded-full border-[30px] border-[#00a86b]" /><div className="absolute bottom-28 left-7 grid grid-cols-3 gap-2">{['MON', 'WED', 'FRI'].map((day) => <div key={day} className="border border-[#09271d] p-3 text-center text-[10px] font-black">{day}<span className="mt-3 block h-2 bg-[#00a86b]" /></div>)}</div><div className="absolute bottom-0 right-0 h-[42%] w-[48%] overflow-hidden"><FoodImage src={image} className="" /></div></>;
    case 21: return <><div className="absolute inset-5 border-2 border-[#09271d]" /><div className="absolute left-0 top-10 h-5 w-full bg-[#b9f800]" /><div className="absolute right-4 top-[45%] rotate-90 text-[10px] font-black tracking-[.38em]">CAMPUS / NOTICE / 001</div></>;
    case 22: return <><div className="absolute left-0 top-0 h-full w-[46%] bg-[#09271d]" /><div className="absolute bottom-28 right-7 w-52 border-2 border-[#fff7e5] bg-[#09271d] p-4 text-[#fff7e5]"><div className="mb-5 h-14 w-12 border-2 border-[#b9f800]" /><span className="text-[10px] font-black">YOUR HOSTEL. YOUR MEAL.</span></div><div className="absolute -left-12 top-32 h-52 w-52 rounded-full border-[27px] border-[#00a86b]" /></>;
    case 23: return <><div className="absolute right-0 top-0 h-full w-[38%] overflow-hidden"><FoodImage src={image} className="opacity-80" /></div><div className="absolute -right-20 top-20 h-72 w-72 rotate-12 border-[30px] border-[#b9f800]" /><div className="absolute bottom-28 left-7 border-2 border-[#09271d] bg-[#fff7e5] p-4 text-[#09271d]"><div className="text-[10px] font-black">ONE SCAN. NO QUEUE.</div></div></>;
    case 24: return <><div className="absolute left-0 top-0 h-full w-6 bg-[#b9f800]" /><div className="absolute right-0 top-0 h-full w-6 bg-[#b9f800]" /><div className="absolute bottom-28 left-7 right-7 border-y border-[#b9f800] py-4 text-center text-[10px] font-black tracking-[.2em] text-[#b9f800]">THE MEAL DIRECT LAUNCH DAY</div><FoodImage src={image} className="opacity-22" /></>;
    case 25: return <><div className="absolute left-0 top-0 h-full w-1/2 bg-[#00a86b]" /><div className="absolute right-[-35px] top-8 text-[220px] font-black leading-none tracking-[-.2em] text-[#fff7e5]/60">VS</div><div className="absolute bottom-28 left-7 right-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="border-2 border-[#09271d] p-4 text-center text-[10px] font-black">TEAM<br />JOLLOF</div><span className="text-[24px] font-black">VS</span><div className="border-2 border-[#09271d] p-4 text-center text-[10px] font-black">TEAM<br />SWALLOW</div></div></>;
    case 26: return <><div className="absolute left-0 top-0 h-full w-1/2 bg-[#b9f800]" /><div className="absolute bottom-28 left-7 flex items-center gap-3"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#09271d] text-center text-[9px] font-black text-[#fff7e5]">MEAL<br />DIRECT</div><span className="text-[28px] font-black">×</span><div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#09271d] text-center text-[9px] font-black">CAMPUS</div></div></>;
    case 27: return <><div className="absolute inset-4 border-[3px] border-[#09271d]" /><div className="absolute left-0 top-0 h-6 w-full bg-[#09271d]" /><div className="absolute bottom-0 left-0 h-6 w-full bg-[#09271d]" /><div className="absolute right-7 top-[42%] text-[100px] font-black leading-none tracking-[-.2em] text-[#00a86b]/25">→</div></>;
    case 28: return <><div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-[#09271d]" /><div className="absolute bottom-28 right-6 h-48 w-48 overflow-hidden rounded-full border-[8px] border-[#fff7e5]"><FoodImage src={image} className="" /></div><div className="absolute left-0 top-0 h-5 w-full bg-[#00a86b]" /></>;
    default: return <><FoodImage src={image} className="opacity-45" />{line}</>;
  }
}

function buildDraft(template: FlyerTemplate, campus: Campus, stage: CampaignStage): Draft {
  const abbreviation = abbreviateCampus(campus.name);
  return {
    headline: template.headline(campus.name, abbreviation, stage),
    supporting: template.supporting(campus.name, abbreviation, stage),
    cta: template.cta,
    stage,
  };
}

async function copy(value: string) {
  await navigator.clipboard.writeText(value);
}

function FlyerPreview({ campus, template, draft, qr, targetRef }: { campus: Campus; template: FlyerTemplate; draft: Draft; qr: string; targetRef?: React.RefObject<HTMLDivElement | null> }) {
  const tone = POSTER_TONES[template.number % 4];
  const abbreviation = abbreviateCampus(campus.name);
  const layout = COPY_LAYOUT[template.number] ?? 'mt-auto max-w-[84%] pb-5';
  const printPoster = template.category === 'print';
  const largeQr = template.number === 21 || template.number === 23 || template.number === 27;

  return (
    <div ref={targetRef} className="relative aspect-[4/5] w-full overflow-hidden shadow-2xl" style={{ maxWidth: 540, background: tone.surface, color: tone.ink }}>
      <PosterArtwork number={template.number} image={template.image} />

      <div className="relative z-10 flex h-full flex-col p-7 sm:p-9">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Meal Direct" width={36} height={36} className="h-9 w-9 rounded-full bg-white object-contain p-1" />
            <span className="text-xs font-black tracking-[-.06em]">MEAL DIRECT</span>
          </div>
          <span className="border px-2 py-1 text-[9px] font-black tracking-[.18em]" style={{ borderColor: `${tone.ink}80` }}>{abbreviation}</span>
        </div>

        <div className={layout}>
          <span className="inline-block px-2.5 py-1 text-[9px] font-black tracking-[.16em]" style={{ background: tone.signal, color: PALETTE.forest }}>{template.eyebrow}</span>
          <h2 className={`mt-5 whitespace-pre-line font-black uppercase leading-[.77] tracking-[-.105em] ${printPoster ? 'text-[clamp(2.15rem,7.5vw,4.4rem)]' : 'text-[clamp(2.35rem,8vw,4.75rem)]'}`}>{draft.headline}</h2>
          <p className="mt-5 max-w-[20rem] text-sm font-semibold leading-snug opacity-90">{draft.supporting}</p>
        </div>

        {largeQr && <div className="absolute bottom-28 right-7 bg-[#fff7e5] p-2 shadow-[6px_6px_0_rgba(9,39,29,.55)]">{qr ? <Image src={qr} alt={`Scan to visit Meal Direct at ${campus.name}`} width={118} height={118} unoptimized className="h-[118px] w-[118px]" /> : <div className="h-[118px] w-[118px] animate-pulse bg-black/10" />}</div>}
        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4" style={{ borderColor: `${tone.ink}55` }}>
          <div className="min-w-0">
            <p className="text-xs font-black tracking-[.1em]">{draft.cta}</p>
            <p className="mt-1 truncate text-[10px] opacity-70">{campaignDestination(campus.slug).replace('https://', '')}</p>
          </div>
          {!largeQr && <div className="shrink-0 bg-[#fff7e5] p-1.5 shadow-[4px_4px_0_rgba(9,39,29,.5)]">
            {qr ? <Image src={qr} alt={`Scan to visit Meal Direct at ${campus.name}`} width={66} height={66} unoptimized className="h-[66px] w-[66px]" /> : <div className="h-[66px] w-[66px] animate-pulse bg-black/10" />}
          </div>}
        </div>
      </div>
    </div>
  );
}

export function CampaignStudio() {
  const campuses = useApiQuery(['campuses'], () => api.getCampuses({ limit: 100 }));
  const toast = useToast();
  const [campusId, setCampusId] = useState('');
  const [templateId, setTemplateId] = useState(FLYER_TEMPLATES[0].id);
  const [category, setCategory] = useState<'all' | FlyerTemplate['category']>('all');
  const [stage, setStage] = useState<CampaignStage>('live');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [qr, setQr] = useState('');
  const [exporting, setExporting] = useState(false);
  const flyer = useRef<HTMLDivElement>(null);

  const campus = campuses.data?.data.find((item) => item.id === campusId) ?? campuses.data?.data.find((item) => item.active);
  const template = FLYER_TEMPLATES.find((item) => item.id === templateId) ?? FLYER_TEMPLATES[0];
  const availableTemplates = useMemo(() => category === 'all' ? FLYER_TEMPLATES : FLYER_TEMPLATES.filter((item) => item.category === category), [category]);
  const draftKey = campus ? `${campus.id}:${template.id}:${stage}` : '';
  const storageKey = campus ? `mealdirect:campaign-draft:${campus.id}:${template.id}` : '';
  const draft = campus ? drafts[draftKey] ?? readSavedDraft(storageKey, stage) ?? buildDraft(template, campus, stage) : null;

  useEffect(() => {
    if (!campus) return;
    QRCode.toDataURL(campaignDestination(campus.slug), { width: 300, margin: 1, errorCorrectionLevel: 'H', color: { dark: '#09271d', light: '#fff7e5' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [campus]);

  const updateDraft = (patch: Partial<Draft>) => {
    if (!campus || !draft) return;
    const next = { ...draft, ...patch };
    setDrafts((current) => ({ ...current, [draftKey]: next }));
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const selectTemplate = (next: FlyerTemplate) => {
    setTemplateId(next.id);
  };

  const reset = () => {
    if (!campus) return;
    const next = buildDraft(template, campus, stage);
    setDrafts((current) => ({ ...current, [draftKey]: next }));
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const download = async () => {
    if (!flyer.current || !campus || !draft) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(flyer.current, { pixelRatio: 3, cacheBust: true, backgroundColor: POSTER_TONES[template.number % 4].surface });
      const anchor = document.createElement('a');
      anchor.download = `${abbreviateCampus(campus.name)}-${String(template.number).padStart(2, '0')}-${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      anchor.href = dataUrl;
      anchor.click();
      toast.success('High-resolution flyer downloaded.');
    } catch {
      toast.error('Could not export this flyer. Please try again.');
    } finally { setExporting(false); }
  };

  return (
    <>
      <PageHeader title="Campaign Studio" subtitle="Select a campus, customize its flyer copy, and export a QR-ready PNG." actions={<Button variant="outline" disabled={!campus} onClick={() => campus && copy(campaignDestination(campus.slug)).then(() => toast.success('Campus link copied.')).catch(() => toast.error('Could not copy the campus link.'))}><Copy className="h-4 w-4" /> Copy campus link</Button>} />
      <AsyncBoundary query={campuses} empty="Add a campus before creating its campaign flyers." isEmpty={(result) => result.data.length === 0}>
        {() => campus && draft && <div className="space-y-6">
          <Card className="overflow-hidden border border-primary/10 bg-gradient-to-br from-[#09271d] to-[#154836] p-5 text-[#fff7e5] sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr] lg:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[#d4fb46]"><Sparkles className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[.16em]">Meal Direct campaign system</span></div>
                <h2 className="max-w-xl text-2xl font-black leading-[.9] tracking-[-.06em] sm:text-4xl">ONE CAMPUS RECORD. TWENTY-EIGHT DISTINCT CREATIVE STARTING POINTS.</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Campus" value={campus.id} onChange={(event) => setCampusId(event.target.value)} className="bg-white/10 text-white border-white/20">
                  {campuses.data?.data.filter((item) => item.active).map((item) => <option key={item.id} value={item.id} className="text-ink">{item.name}</option>)}
                </Select>
                <Select label="Campaign stage" value={stage} onChange={(event) => setStage(event.target.value as CampaignStage)} className="bg-white/10 text-white border-white/20">
                  <option className="text-ink" value="coming_soon">Coming soon</option><option className="text-ink" value="launching">Launching now</option><option className="text-ink" value="live">Live</option><option className="text-ink" value="growth">Growth</option>
                </Select>
              </div>
            </div>
            <a className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#d4fb46] hover:underline" href={campaignDestination(campus.slug)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> {campaignDestination(campus.slug)}</a>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_360px]">
            <Card className="h-fit p-4">
              <div className="mb-4 flex items-center justify-between"><div><p className="font-space font-bold">Creative library</p><p className="text-xs text-muted">A system, not a repeated layout.</p></div><Palette className="h-5 w-5 text-primary" /></div>
              <FilterSelect aria-label="Filter flyer templates" value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="mb-3 w-full">
                <option value="all">All formats (28)</option>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </FilterSelect>
              <div className="max-h-[520px] space-y-1 overflow-y-auto pr-1">
                {availableTemplates.map((item) => <button key={item.id} onClick={() => selectTemplate(item)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${item.id === template.id ? 'bg-primary text-white shadow-sm' : 'hover:bg-canvas dark:hover:bg-ink/40'}`}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black ${item.id === template.id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>{String(item.number).padStart(2, '0')}</span>
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold">{item.name}</span><span className={`block text-xs ${item.id === template.id ? 'text-white/75' : 'text-muted'}`}>{CATEGORY_LABELS[item.category]}</span></span>
                </button>)}
              </div>
            </Card>

            <Card className="flex min-h-[600px] items-center justify-center overflow-hidden bg-[#e8e3d8] p-4 sm:p-8"><FlyerPreview campus={campus} template={template} draft={draft} qr={qr} targetRef={flyer} /></Card>

            <Card className="h-fit p-5">
              <div className="mb-5 flex items-start justify-between gap-3"><div><p className="font-space font-bold">{template.name}</p><p className="mt-1 text-xs text-muted">{template.eyebrow}</p></div><span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary">#{String(template.number).padStart(2, '0')}</span></div>
              <div className="space-y-4">
                <TextArea label="Headline" value={draft.headline} maxLength={90} onChange={(event) => updateDraft({ headline: event.target.value })} className="min-h-[88px]" />
                <TextArea label="Supporting copy" value={draft.supporting} maxLength={180} onChange={(event) => updateDraft({ supporting: event.target.value })} className="min-h-[100px]" />
                <TextField label="Call to action" value={draft.cta} maxLength={45} onChange={(event) => updateDraft({ cta: event.target.value })} />
              </div>
              <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted"><div className="flex gap-2"><QrCode className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>The QR code always uses this campus’s live Meal Direct link. Copy stays editable on this device per campus and format.</p></div></div>
              <div className="mt-5 grid grid-cols-2 gap-3"><Button variant="outline" onClick={reset}>Reset copy</Button><Button onClick={download} loading={exporting}><Download className="h-4 w-4" /> Download PNG</Button></div>
              <p className="mt-4 text-xs leading-relaxed text-muted">Use offers, vendor details, testimonials, and event information only when they are confirmed. The studio intentionally starts those formats with neutral copy.</p>
            </Card>
          </div>
        </div>}
      </AsyncBoundary>
    </>
  );
}
