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

const FAMILY: Record<number, { surface: string; text: string; accent: string; plate: string }> = {
  0: { surface: '#09271d', text: '#fff7e5', accent: '#b9f800', plate: '#143e31' },
  1: { surface: '#fff7e5', text: '#09271d', accent: '#ff6b45', plate: '#f1e5cb' },
  2: { surface: '#d4fb46', text: '#09271d', accent: '#09271d', plate: '#b9f800' },
  3: { surface: '#ff714c', text: '#09271d', accent: '#fff7e5', plate: '#ef603f' },
  4: { surface: '#8b72ff', text: '#fff7e5', accent: '#d4fb46', plate: '#735ce2' },
  5: { surface: '#77c7ff', text: '#09271d', accent: '#fff7e5', plate: '#5baee5' },
  6: { surface: '#f5c743', text: '#09271d', accent: '#ff5f9e', plate: '#e7b72e' },
};

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
  const colour = FAMILY[template.family % 7];
  const abbreviation = abbreviateCampus(campus.name);
  const usePhoto = template.family % 3 !== 1;
  const reverse = template.family % 2 === 0;

  return (
    <div ref={targetRef} className="relative aspect-[4/5] w-full overflow-hidden bg-[#09271d] shadow-2xl" style={{ maxWidth: 540, background: colour.surface, color: colour.text }}>
      {usePhoto && <>
        <Image src={template.image} alt="Meal Direct food or campus moment" fill sizes="(max-width: 768px) 100vw, 540px" className={`object-cover ${reverse ? 'opacity-55' : 'opacity-35'}`} />
        <div className="absolute inset-0" style={{ background: reverse ? 'linear-gradient(180deg, rgba(9,39,29,.25), rgba(9,39,29,.92))' : 'linear-gradient(90deg, rgba(9,39,29,.88), rgba(9,39,29,.12))' }} />
      </>}
      <div className="absolute -right-[22%] -top-[8%] h-[45%] w-[62%] rounded-full border-[26px] opacity-90" style={{ borderColor: colour.accent }} />
      <div className="absolute bottom-[16%] right-0 h-[28%] w-[57%] -skew-x-12 opacity-95" style={{ background: colour.plate }} />
      {template.family % 4 === 0 && <div className="absolute right-3 top-[35%] rotate-90 text-[9px] font-black tracking-[.35em] opacity-70">MEAL DIRECT / CAMPUS EDITION</div>}

      <div className="relative z-10 flex h-full flex-col p-7 sm:p-9">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Meal Direct" width={36} height={36} className="h-9 w-9 rounded-full bg-white object-contain p-1" />
            <span className="text-xs font-black tracking-[-.06em]">MEAL DIRECT</span>
          </div>
          <span className="border px-2 py-1 text-[9px] font-black tracking-[.18em]" style={{ borderColor: `${colour.text}80` }}>{abbreviation}</span>
        </div>

        <div className="mt-auto max-w-[92%] pb-5">
          <span className="inline-block px-2.5 py-1 text-[9px] font-black tracking-[.16em]" style={{ background: colour.accent, color: '#09271d' }}>{template.eyebrow}</span>
          <h2 className="mt-5 whitespace-pre-line text-[clamp(2.35rem,8vw,4.75rem)] font-black uppercase leading-[.77] tracking-[-.105em]">{draft.headline}</h2>
          <p className="mt-5 max-w-[20rem] text-sm font-semibold leading-snug opacity-90">{draft.supporting}</p>
        </div>

        <div className="flex items-end justify-between gap-3 border-t pt-4" style={{ borderColor: `${colour.text}55` }}>
          <div className="min-w-0">
            <p className="text-xs font-black tracking-[.1em]">{draft.cta}</p>
            <p className="mt-1 truncate text-[10px] opacity-70">{campaignDestination(campus.slug).replace('https://', '')}</p>
          </div>
          <div className="shrink-0 bg-[#fff7e5] p-1.5 shadow-[4px_4px_0_rgba(9,39,29,.5)]">
            {qr ? <Image src={qr} alt={`Scan to visit Meal Direct at ${campus.name}`} width={66} height={66} unoptimized className="h-[66px] w-[66px]" /> : <div className="h-[66px] w-[66px] animate-pulse bg-black/10" />}
          </div>
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
      const dataUrl = await toPng(flyer.current, { pixelRatio: 3, cacheBust: true, backgroundColor: FAMILY[template.family % 7].surface });
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
