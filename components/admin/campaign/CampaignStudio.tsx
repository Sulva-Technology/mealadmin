'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, Copy, Download, ExternalLink, FileJson, ImagePlus, RotateCcw, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import type { Campus } from '@/lib/types';
import {
  CAMPAIGN_FORMATS, CATEGORY_LABELS, FLYER_TEMPLATES, createCampaignDraft, campaignVariant, campaignVariants,
  isSafeCampaignUrl, validateCampaignDraft,
  type CampaignCategory, type CampaignDraft, type CampaignField, type CampaignFormat, type FlyerTemplate,
} from '@/lib/campaign-studio';
import { AsyncBoundary, PageHeader } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Select, TextArea, TextField } from '@/components/ui/Inputs';
import { useToast } from '@/components/ui/Toast';
import { CampaignPoster } from './CampaignPoster';
import { isCampaignDraft, readCampaignDraft, saveCampaignDraft } from '@/lib/campaign-drafts';
import { CAMPAIGN_ART, CAMPAIGN_REFERENCE_SHEET, referencePosition } from '@/lib/campaign-art-direction';

type PromptLibrary = { brandSystem: string; prompts: { number: number; title: string; requiredInputs: string; body: string }[] };
let libraryRequest: Promise<PromptLibrary> | undefined;

async function getLibrary() {
  if (!libraryRequest) {
    libraryRequest = fetch('/campaign/prompt-library.json').then(async (response) => {
      if (!response.ok) throw new Error('Could not load the production brief.');
      return response.json() as Promise<PromptLibrary>;
    }).catch((error: unknown) => { libraryRequest = undefined; throw error; });
  }
  return libraryRequest;
}

function fileStem(value: string) {
  return value.normalize('NFKC').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'campus';
}

function saveJson(filename: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function readImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG, or WebP image.');
  if (file.size > 4 * 1024 * 1024) throw new Error('Choose an image smaller than 4 MB.');
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read this image.'));
    reader.readAsDataURL(file);
  });
  const image = new window.Image();
  image.src = data;
  await image.decode();
  return data;
}

function ImageField({ field, value, onChange }: { field: CampaignField; value: string; onChange: (value: string) => void }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  return <div className="space-y-2">
    <p className="text-sm font-medium text-ink dark:text-muted">{field.label}{field.required ? ' *' : ' (optional)'}</p>
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-muted/35 p-3 transition hover:border-primary focus-within:ring-2 focus-within:ring-primary">
      <ImagePlus className="h-5 w-5 shrink-0 text-primary" />
      <span className="text-xs text-muted">{value ? 'Replace uploaded image' : 'Upload PNG, JPEG, or WebP'}<span className="mt-1 block">Up to 4 MB · use an approved asset</span></span>
      <input ref={input} type="file" className="sr-only" aria-label={field.label} accept="image/png,image/jpeg,image/webp" onChange={async (event) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        try { onChange(await readImage(file)); } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load the image.'); }
        if (input.current) input.current.value = '';
      }} />
    </label>
    {value && <Button size="sm" variant="ghost" onClick={() => onChange('')}>Remove image</Button>}
    {field.hint && <p className="text-xs leading-relaxed text-muted">{field.hint}</p>}
  </div>;
}

function BriefPanel({ template }: { template: FlyerTemplate }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const toast = useToast();
  const load = async () => {
    if (text || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const library = await getLibrary();
      const prompt = library.prompts.find((item) => item.number === template.number);
      if (!prompt) throw new Error('Production brief not found.');
      setText(`${library.brandSystem}\n\n${prompt.title}\n\nRequired inputs\n${prompt.requiredInputs}\n\n${prompt.body}`);
    } catch { setFailed(true); } finally { setLoading(false); }
  };
  return <details className="border-t border-muted/15 pt-4" onToggle={(event) => { if (event.currentTarget.open) void load(); }}>
    <summary className="cursor-pointer text-sm font-semibold text-ink dark:text-white"><BookOpen className="mr-2 inline h-4 w-4" />Full production brief</summary>
    <div className="mt-3 space-y-3">
      {loading && <p className="text-xs text-muted" role="status">Loading brief…</p>}
      {failed && <div role="alert"><p className="text-xs text-danger">The brief could not be loaded.</p><Button size="sm" variant="outline" onClick={() => void load()}>Retry</Button></div>}
      {text && <>
        <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(text).then(() => toast.success('Full brief copied.')).catch(() => toast.error('Could not copy the brief.'))}><Copy className="h-3.5 w-3.5" /> Copy full brief</Button>
        <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-canvas p-3 font-sans text-xs leading-relaxed text-muted dark:bg-ink/40">{text}</pre>
      </>}
    </div>
  </details>;
}

function CampaignEditor({ campus, template: baseTemplate }: { campus: Campus; template: FlyerTemplate }) {
  const toast = useToast();
  const [draft, setDraft] = useState<CampaignDraft>(() => createCampaignDraft(baseTemplate, campus));
  const template = campaignVariant(baseTemplate, draft.values.CAMPAIGN_VARIANT);
  const [hydrated, setHydrated] = useState(false);
  const [storageMessage, setStorageMessage] = useState('Drafts are saved on this device.');
  const [format, setFormat] = useState<CampaignFormat>(template.defaultFormat);
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [qrState, setQrState] = useState({ destination: '', image: '', error: '' });
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<'content' | 'review'>('content');
  const [layoutIssues, setLayoutIssues] = useState<string[]>([]);
  const target = useRef<SVGSVGElement>(null);
  const revision = useRef(0);
  const currentCampus = useRef(campus);
  const currentTemplate = useRef(template);

  useEffect(() => {
    const saved = readCampaignDraft(currentCampus.current.id, currentTemplate.current.id);
    if (saved.draft) setDraft({ ...saved.draft, checks: {} });
    if (saved.error) setStorageMessage(saved.error);
    setHydrated(true);
  }, []);

  useEffect(() => {
    const destination = draft.destination.trim();
    if (!isSafeCampaignUrl(destination)) return;
    let cancelled = false;
    import('qrcode').then(({ default: QRCode }) => QRCode.toDataURL(destination, {
      width: 960, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#FFFFFF' },
    })).then((image) => { if (!cancelled) setQrState({ destination, image, error: '' }); })
      .catch(() => { if (!cancelled) setQrState({ destination, image: '', error: 'Could not generate the QR code. Shorten the destination or try again.' }); });
    return () => { cancelled = true; };
  }, [draft.destination]);

  useEffect(() => {
    if (!target.current || typeof target.current.getBBox !== 'function') return;
    let cancelled = false;
    Promise.all([document.fonts.ready, import('@/lib/campaign-export')]).then(([, helpers]) => {
      if (!cancelled && target.current) setLayoutIssues(helpers.campaignLayoutIssues(target.current));
    }).catch(() => { if (!cancelled) setLayoutIssues(['The layout could not be checked. Reload the page before exporting.']); });
    return () => { cancelled = true; };
  }, [draft, format, side]);

  const destination = draft.destination.trim();
  const qr = qrState.destination === destination && isSafeCampaignUrl(destination) ? qrState.image : '';
  const problems = [...validateCampaignDraft(template, draft), ...layoutIssues];
  const proof = problems.length > 0;
  const spec = CAMPAIGN_FORMATS[format];
  const duplex = Boolean(template.duplex && (format === 'a6' || (format === 'a7' && template.number !== 27)));
  const imageFields = template.fields.filter((field) => field.type === 'image');
  const editableFields = template.fields.filter((field) => field.key !== template.destinationKey);
  const destinationLabel = template.destinationKey === 'CAMPUS_URL' ? 'Campus destination URL' : template.fields.find((field) => field.key === template.destinationKey)?.label ?? 'Campaign destination URL';

  const update = (patch: Partial<CampaignDraft>, preserveChecks = false) => {
    revision.current += 1;
    const next = { ...draft, ...patch, checks: preserveChecks ? patch.checks ?? draft.checks : {} };
    setDraft(next);
    const error = saveCampaignDraft(campus.id, template.id, next);
    setStorageMessage(error ?? 'Saved on this device.');
  };
  const updateValue = (key: string, value: string) => update({ values: { ...draft.values, [key]: value } });
  const filename = `MD_${String(template.number).padStart(2, '0')}_${fileStem(template.name)}_${fileStem(draft.campusName || draft.universityName)}_${format}${duplex ? `_${side}` : ''}${proof ? '_REVIEW' : ''}`;

  const download = async (kind: 'png' | 'svg') => {
    if (!target.current || !qr || !hydrated) return;
    const startedAt = revision.current;
    setExporting(true);
    try {
      await document.fonts.ready;
      const helpers = await import('@/lib/campaign-export');
      if (startedAt !== revision.current) throw new Error('The design changed while preparing the export. Please download it again.');
      if (kind === 'png') await helpers.downloadCampaignPng(target.current, `${filename}.png`);
      else await helpers.downloadCampaignSvg(target.current, `${filename}.svg`);
      toast.success(`${proof ? 'Review proof' : 'Campaign'} ${kind.toUpperCase()} downloaded.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not export this design. Please try again.'); }
    finally { setExporting(false); }
  };

  return <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
    <section className="min-w-0" aria-label="Campaign preview">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Design {String(template.number).padStart(2, '0')}</p><h2 className="mt-1 font-space text-xl font-bold text-ink dark:text-white">{template.name}</h2></div>
        <div className="flex items-end gap-2">
          {duplex && <Select label="Side" value={side} onChange={(event) => { setSide(event.target.value as typeof side); revision.current += 1; }} disabled={exporting}><option value="front">Front</option><option value="back">Back</option></Select>}
          <Select label="Output format" value={format} disabled={exporting} onChange={(event) => { setFormat(event.target.value as CampaignFormat); setSide('front'); update({ checks: {} }, true); }}>
            {template.formats.map((value) => <option key={value} value={value}>{CAMPAIGN_FORMATS[value].label}</option>)}
          </Select>
        </div>
      </div>
      <div className="flex min-h-[360px] items-start justify-center overflow-hidden rounded-2xl border border-muted/15 bg-[#dfe8e3] p-4 sm:p-7" style={{ backgroundImage: 'radial-gradient(#074c391a 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        <div className="w-full max-w-[540px] shadow-xl" style={{ maxWidth: format === 'story' ? 410 : 540 }}>
          <CampaignPoster template={template} draft={draft} format={format} qr={qr} side={duplex ? side : 'front'} proof={proof} targetRef={target} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>{spec.width} × {spec.height} px{spec.widthMm ? ` · ${spec.widthMm} × ${spec.heightMm} mm` : ' · sRGB'}</span>
        <span className={proof ? 'text-amber-700 dark:text-amber-400' : 'text-primary'}>{proof ? 'Review proof · details need confirmation' : 'Checks complete'}</span>
      </div>
      {spec.widthMm && <p className="mt-2 text-xs leading-relaxed text-muted">Print proof with 3 mm bleed. Confirm color conversion, trimming, and paper with your printer. SVG and PNG exports are not PDF/X-4 files.{duplex ? ' Download both front and back.' : ''}</p>}
      <p className="mt-4 text-sm leading-relaxed text-muted">{template.description}</p>
      {layoutIssues.length > 0 && <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900" role="status"><p className="font-semibold">Adjust the layout before exporting</p><ul className="mt-2 list-disc space-y-1 pl-4">{layoutIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
    </section>

    <section className="min-w-0 rounded-2xl border border-muted/15 bg-surface p-4 dark:bg-ink/30" aria-label="Campaign editor">
      <div className="mb-5 flex border-b border-muted/15" role="tablist" aria-label="Editor sections" onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 'content' : event.key === 'End' ? 'review' : tab === 'content' ? 'review' : 'content';
        setTab(next);
        document.getElementById(`campaign-tab-${next}`)?.focus();
      }}>
        {(['content', 'review'] as const).map((value) => <button key={value} role="tab" aria-selected={tab === value} aria-controls={`campaign-panel-${value}`} id={`campaign-tab-${value}`} onClick={() => setTab(value)} className={`flex-1 border-b-2 px-2 pb-3 text-sm font-semibold transition ${tab === value ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink dark:hover:text-white'}`}>{value === 'content' ? 'Content & assets' : `Review${problems.length ? ` (${problems.length})` : ''}`}</button>)}
      </div>
      <fieldset disabled={!hydrated || exporting} className="min-w-0 space-y-5">
        {tab === 'content' ? <div className="space-y-5" role="tabpanel" aria-labelledby="campaign-tab-content" id="campaign-panel-content">
          {campaignVariants(baseTemplate).length > 0 && <Select label="Campaign action" value={draft.values.CAMPAIGN_VARIANT || 'default'} onChange={(event) => {
            const mode = event.target.value;
            const variant = campaignVariant(baseTemplate, mode);
            update({ ...createCampaignDraft(variant, campus), universityName: draft.universityName, campusName: draft.campusName, values: { CAMPAIGN_VARIANT: mode } });
          }}>{campaignVariants(baseTemplate).map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</Select>}
          <TextField label="University name" value={draft.universityName} maxLength={180} onChange={(event) => update({ universityName: event.target.value })} hint="Use the approved full name. It is separate from the campus label." />
          <TextField label="Campus label (optional)" value={draft.campusName} maxLength={140} onChange={(event) => update({ campusName: event.target.value })} hint="Leave blank if it repeats the university name." />
          <TextArea label="Headline" value={draft.headline} maxLength={300} onChange={(event) => update({ headline: event.target.value })} />
          <TextArea label="Supporting copy" value={draft.supporting} maxLength={650} onChange={(event) => update({ supporting: event.target.value })} />
          <TextField label="Call to action" value={draft.cta} maxLength={100} onChange={(event) => update({ cta: event.target.value })} />
          {duplex && <div className="space-y-3 border-t border-muted/15 pt-4"><h3 className="text-sm font-semibold">Reverse-side copy</h3><TextField label="Back headline" value={draft.values.BACK_HEADLINE ?? (template.number === 27 ? 'Meet Meal Direct.' : 'Keep your campus link handy.')} maxLength={160} onChange={(event) => updateValue('BACK_HEADLINE', event.target.value)} /><TextArea label="Back supporting copy" value={draft.values.BACK_SUPPORTING ?? (template.number === 27 ? 'Discover meals and scheduled ordering options through your campus link.' : 'Explore your campus menu.')} maxLength={200} onChange={(event) => updateValue('BACK_SUPPORTING', event.target.value)} /></div>}
          {editableFields.length > 0 && <div className="space-y-4 border-t border-muted/15 pt-4"><h3 className="text-sm font-semibold text-ink dark:text-white">Campaign details</h3><p className="text-xs text-muted">* Required by this brief. Empty optional details are omitted.</p>
            {editableFields.map((field) => field.type === 'image' ? <ImageField key={field.key} field={field} value={draft.values[field.key] ?? ''} onChange={(value) => updateValue(field.key, value)} /> : field.type === 'textarea' ? <div key={field.key}><TextArea label={`${field.label}${field.required ? ' *' : ' (optional)'}`} value={draft.values[field.key] ?? ''} maxLength={700} onChange={(event) => updateValue(field.key, event.target.value)} />{field.hint && <p className="mt-1 text-xs text-muted">{field.hint}</p>}</div> : <TextField key={field.key} label={`${field.label}${field.required ? ' *' : ' (optional)'}`} value={draft.values[field.key] ?? ''} type={field.type === 'url' ? 'url' : 'text'} maxLength={field.type === 'url' ? 500 : 250} hint={field.hint} onChange={(event) => updateValue(field.key, event.target.value)} />)}
          </div>}
          {imageFields.length === 0 && (template.image || CAMPAIGN_ART[template.number]?.image) && <ImageField field={{ key: 'APPROVED_MEAL_PHOTO', label: 'Campaign image', type: 'image', required: false, hint: 'The supplied style uses illustrative photography, including AI-generated portraits. Upload an approved photograph to feature a real person, meal or business.' }} value={draft.values.APPROVED_MEAL_PHOTO ?? ''} onChange={(value) => updateValue('APPROVED_MEAL_PHOTO', value)} />}
          <div className="space-y-3 border-t border-muted/15 pt-4">
            <TextField label={destinationLabel} type="url" value={draft.destination} maxLength={500} onChange={(event) => update({ destination: event.target.value, values: { ...draft.values, [template.destinationKey]: event.target.value } })} hint="The QR and printed fallback use this same address. Match it to the action." />
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!isSafeCampaignUrl(destination)} onClick={() => navigator.clipboard.writeText(destination).then(() => toast.success('Destination copied.')).catch(() => toast.error('Could not copy the destination.'))}><Copy className="h-3.5 w-3.5" /> Copy link</Button>{isSafeCampaignUrl(destination) && <a href={destination} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Open destination</a>}</div>
            {!qr && <p className="text-xs text-amber-700 dark:text-amber-400" role="status">{isSafeCampaignUrl(destination) ? qrState.destination === destination && qrState.error || 'Generating QR code…' : 'Enter a valid destination to generate the QR code.'}</p>}
          </div>
        </div> : <div className="space-y-4" role="tabpanel" aria-labelledby="campaign-tab-review" id="campaign-panel-review">
          <h3 className="text-sm font-semibold text-ink dark:text-white">Before final export</h3>
          <p className="text-xs leading-relaxed text-muted">Confirm these facts for this campaign. Export a review proof first to test its QR code. Editing content or changing format clears these checks.</p>
          {template.checks.map((check) => <label key={check} className="flex cursor-pointer items-start gap-3 border-b border-muted/10 pb-3 text-xs leading-relaxed text-ink dark:text-muted"><input type="checkbox" checked={draft.checks[check] === true} onChange={(event) => update({ checks: { ...draft.checks, [check]: event.target.checked } }, true)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0B6B4F]" /><span>{check}</span></label>)}
          {problems.length > 0 ? <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/25 dark:text-amber-200"><p className="font-semibold">Still needed</p><ul className="mt-2 list-disc space-y-1 pl-4">{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul></div> : <p className="flex items-center gap-2 text-sm text-primary"><Check className="h-4 w-4" /> Ready for final export.</p>}
        </div>}
      </fieldset>
      <div className="mt-5 space-y-3 border-t border-muted/15 pt-5">
        <Button className="w-full" disabled={!qr || !hydrated || layoutIssues.length > 0} loading={exporting} onClick={() => void download('png')}><Download className="h-4 w-4" />{proof ? 'Download proof PNG' : 'Download final PNG'}</Button>
        <Button className="w-full" variant="outline" disabled={!qr || !hydrated || exporting || layoutIssues.length > 0} onClick={() => void download('svg')}><Download className="h-4 w-4" />{proof ? 'Editable proof SVG' : 'Editable final SVG'}</Button>
        <div className="flex justify-between gap-2"><Button size="sm" variant="ghost" disabled={!hydrated || exporting} onClick={() => saveJson(`${filename}.json`, { templateId: template.id, format, side, draft })}><FileJson className="h-3.5 w-3.5" /> Save draft file</Button><Button size="sm" variant="ghost" disabled={!hydrated || exporting} onClick={() => update(createCampaignDraft(baseTemplate, campus))}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button></div>
        <label className="block cursor-pointer rounded-lg text-xs font-medium text-primary focus-within:ring-2 focus-within:ring-primary">Load a saved draft file
          <input type="file" accept="application/json,.json" aria-label="Load a saved draft file" disabled={!hydrated || exporting} className="sr-only" onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            try {
              if (file.size > 20 * 1024 * 1024) throw new Error('This draft file is too large.');
              const saved = JSON.parse(await file.text()) as Record<string, unknown>;
              if (!saved || saved.templateId !== template.id || !isCampaignDraft(saved.draft)) throw new Error('Choose a version 2 draft file for this campaign template.');
              update({ ...saved.draft, checks: {} });
              if (typeof saved.format === 'string' && template.formats.includes(saved.format as CampaignFormat)) setFormat(saved.format as CampaignFormat);
              setSide(saved.side === 'back' ? 'back' : 'front');
              toast.success('Draft loaded. Confirm the campus details and review checks.');
            } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load the draft file.'); }
            input.value = '';
          }} />
        </label>
        <p className="text-xs leading-relaxed text-muted" role="status">{storageMessage}</p>
      </div>
      <div className="mt-5"><BriefPanel key={template.id} template={template} /></div>
    </section>
  </div>;
}

export function CampaignStudio() {
  const campuses = useApiQuery(['campuses'], () => api.getCampuses({ limit: 100 }));
  const [campusId, setCampusId] = useState('');
  const [templateId, setTemplateId] = useState(FLYER_TEMPLATES[0].id);
  const [category, setCategory] = useState<CampaignCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const campus = campuses.data?.data.find((item) => item.id === campusId) ?? campuses.data?.data.find((item) => item.active) ?? campuses.data?.data[0];
  const template = FLYER_TEMPLATES.find((item) => item.id === templateId) ?? FLYER_TEMPLATES[0];
  const availableTemplates = useMemo(() => FLYER_TEMPLATES.filter((item) => (category === 'all' || item.category === category) && `${item.number} ${item.name} ${item.description}`.toLowerCase().includes(search.trim().toLowerCase())), [category, search]);

  return <>
    <PageHeader title="Campaign Studio" subtitle="Create campus campaigns from the Meal Direct production library." />
    <AsyncBoundary query={campuses} empty="Add a campus before creating its campaigns." isEmpty={(result) => result.data.length === 0}>
      {() => campus && <>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-muted/15 pb-5">
          <div className="w-full max-w-sm"><Select label="Campus record" value={campus.id} onChange={(event) => setCampusId(event.target.value)}>{campuses.data?.data.map((item) => <option key={item.id} value={item.id}>{item.name}{item.active ? '' : ' (inactive)'}</option>)}</Select></div>
          <p className="max-w-sm text-xs leading-relaxed text-muted">28 briefs · editable campus names · campaign-specific QR links<br />A campus record does not confirm that ordering is live.</p>
        </div>
        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="min-w-0 space-y-3" aria-label="Campaign library">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-ink dark:text-white">Creative library</h2><span className="text-xs text-muted">{availableTemplates.length} / 28</span></div>
            <a href={CAMPAIGN_REFERENCE_SHEET} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Selected visual direction <ExternalLink className="h-3 w-3" /></a>
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" /><input aria-label="Search campaign templates" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a campaign…" className="w-full rounded-xl border border-muted/25 bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 dark:bg-ink/40" /></div>
            <Select label="Campaign category" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}><option value="all">All campaigns</option>{Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select>
            <div className="grid max-h-[320px] grid-cols-1 gap-1 overflow-y-auto pr-1 sm:grid-cols-2 xl:max-h-[780px] xl:grid-cols-1">
              {availableTemplates.map((item) => <button key={item.id} aria-pressed={template.id === item.id} onClick={() => setTemplateId(item.id)} className={`group flex items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors ${template.id === item.id ? 'bg-[#0B6B4F] text-white' : 'text-ink hover:bg-primary/5 dark:text-muted'}`}><span aria-hidden="true" className="h-[64px] w-[48px] shrink-0 overflow-hidden rounded bg-[#ECF7F2]" style={{ backgroundImage: `url("${CAMPAIGN_REFERENCE_SHEET}")`, backgroundSize: '700% 400%', backgroundPosition: referencePosition(item.number) }} /><span><span className={`block text-[10px] tabular-nums ${template.id === item.id ? 'text-white/65' : 'text-muted'}`}>{String(item.number).padStart(2, '0')}</span><span className="text-sm font-medium">{item.name}</span></span></button>)}
            </div>
            {availableTemplates.length === 0 && <p className="py-4 text-sm text-muted">No matching campaigns. Try another search or category.</p>}
          </aside>
          <CampaignEditor key={`${campus.id}:${template.id}`} campus={campus} template={template} />
        </div>
      </>}
    </AsyncBoundary>
  </>;
}
