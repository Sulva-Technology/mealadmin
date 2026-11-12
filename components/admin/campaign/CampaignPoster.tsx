'use client';

import { useId, type RefObject } from 'react';
import { CAMPAIGN_ART } from '@/lib/campaign-art-direction';
import { CAMPAIGN_FORMATS, CAMPAIGN_PALETTE as P, campaignValues, interpolateCampaignCopy, type CampaignDraft, type CampaignFormat, type FlyerTemplate } from '@/lib/campaign-studio';

const displayFont = 'var(--font-outfit), sans-serif';
const bodyFont = 'var(--font-sans), sans-serif';
function widthOf(text: string, size: number) {
  return [...text].reduce((width, char) => width + (/\s/.test(char) ? .29 : /[ilIjtfr.,:;!|'’]/.test(char) ? .31 : /[MW@%&]/.test(char) ? .91 : /[A-Z]/.test(char) ? .69 : .56) * size * 1.1, 0);
}
function linesFor(text: string, width: number, size: number) {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && widthOf(`${line} ${word}`, size) <= width) { line += ` ${word}`; continue; }
      if (line) { lines.push(line); line = ''; }
      if (widthOf(word, size) > width) {
        let part = '';
        for (const letter of word) {
          if (part && widthOf(part + letter, size) > width) { lines.push(part); part = ''; }
          part += letter;
        }
        line = part;
      } else line = word;
    }
    if (line) lines.push(line);
    else if (!paragraph) lines.push('');
  }
  return lines;
}

type TextProps = { text: string; x: number; y: number; width: number; height: number; size?: number; min?: number; color?: string; weight?: number; display?: boolean; center?: boolean; name: string; accent?: string; highlight?: boolean; verticalCenter?: boolean };
function TextBlock({ text, x, y, width, height, size = 32, min = 24, color = P.ink, weight = 400, display = false, center = false, name, accent, highlight = false, verticalCenter = false }: TextProps) {
  if (!text.trim()) return null;
  let fontSize = size;
  let lines = linesFor(text, width, fontSize);
  const leading = display ? 1.08 : 1.3;
  while (fontSize > min && lines.length * fontSize * leading > height) { fontSize = Math.max(min, fontSize - 1); lines = linesFor(text, width, fontSize); }
  const overflow = lines.length * fontSize * leading > height + 1;
  return <g data-layer={name} data-overflow={overflow ? 'true' : undefined} data-field-label={name} data-text-box={`${x},${y},${width},${height}`}>
    {highlight && lines.map((line, i) => i > 0 && <rect key={i} x={x} y={y + i * fontSize * leading} width={Math.min(width, widthOf(line, fontSize) + 8)} height={fontSize * 1.04} rx={fontSize * .12} fill={P.green} />)}
    <text x={center ? x + width / 2 : x} y={y + fontSize * .9 + (verticalCenter ? Math.max(0, (height - lines.length * fontSize * leading) / 2) : 0)} fill={color} fontFamily={display ? displayFont : bodyFont} fontSize={fontSize} fontWeight={weight} textAnchor={center ? 'middle' : 'start'}>
      {lines.map((line, i) => <tspan key={i} x={center ? x + width / 2 : x} dy={i === 0 ? 0 : fontSize * leading} fill={i > 0 ? highlight ? P.white : accent ?? color : color}>{line}</tspan>)}
    </text>
  </g>;
}

function Photo({ src, x, y, width, height, id, proof, shape = 'rect' }: { src: string; x: number; y: number; width: number; height: number; id: string; proof: boolean; shape?: 'rect' | 'round' }) {
  const safe = src.startsWith('/campaign/') || /^data:image\/(png|jpeg|webp);base64,/.test(src);
  return <g data-layer="photograph">
    <defs><clipPath id={id}>{shape === 'round' ? <ellipse cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2} /> : <rect x={x} y={y} width={width} height={height} />}</clipPath></defs>
    {safe ? <image href={src} x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} /> : <>
      <rect x={x} y={y} width={width} height={height} fill={P.mint} />
      {proof && <TextBlock name="image-placeholder" text="Add approved photograph" x={x + 24} y={y + height / 2 - 40} width={width - 48} height={100} size={28} min={24} color={P.deepGreen} center />}
    </>}
  </g>;
}

function Brand({ x, y, color, compact = false }: { x: number; y: number; color: string; compact?: boolean }) {
  const size = compact ? 110 : 96;
  return <g data-layer="official-logo"><image href="/logo.png" x={x} y={y} width={size * .8} height={size * .8} preserveAspectRatio="xMidYMid meet" /><text x={x + size * .8 + 12} y={y + size * .38} fontFamily={bodyFont} fontSize={compact ? 43 : 38} fontWeight={800} fill={color}>meal direct</text><text x={x + size * .8 + 12} y={y + size * .62} fontFamily={bodyFont} fontSize={compact ? 13 : 12} fontWeight={600} letterSpacing={1.1} fill={color}>FOOD. DELIVERED. DIRECT.</text></g>;
}

export function CampaignPoster({ template, draft, format, qr, side = 'front', proof = true, targetRef }: {
  template: FlyerTemplate; draft: CampaignDraft; format: CampaignFormat; qr: string; side?: 'front' | 'back'; proof?: boolean; targetRef?: RefObject<SVGSVGElement | null>;
}) {
  const uid = useId().replace(/:/g, '');
  const spec = CAMPAIGN_FORMATS[format];
  const W = 1080;
  const H = spec.height / spec.width * W;
  const isPrint = Boolean(spec.widthMm);
  const smallPrint = format === 'a6' || format === 'a7';
  const margin = Math.max(64, spec.safePx / spec.width * W);
  const top = format === 'story' ? 250 : margin;
  const bottom = H - (format === 'story' ? 250 : margin);
  const usable = bottom - top;
  const contentW = W - margin * 2;
  const number = template.number;
  const art = CAMPAIGN_ART[number];
  const isDuplex = Boolean(template.duplex && (format === 'a6' || format === 'a7') && !(number === 27 && format === 'a7'));
  const frontOnly = isDuplex && side === 'front';
  const back = isDuplex && side === 'back';
  const compactQr = number === 23 || (number === 27 && format === 'a7') || back;
  const dark = !back && number === 2;
  const bg = dark ? P.deepGreen : '#F3FBF4';
  const ink = dark ? P.white : '#071A10';
  const muted = dark ? P.mint : '#1D3428';
  const values = campaignValues(template, draft);
  const resolve = (copy: string) => interpolateCampaignCopy(copy, values).replace(/\{\{([^}]+)\}\}/g, (_, key: string) => `[${template.fields.find((field) => field.key === key)?.label ?? key.toLowerCase().replace(/_/g, ' ')}]`);
  let headline = resolve(draft.headline);
  let supporting = resolve(draft.supporting);
  if (back) { headline = resolve(draft.values.BACK_HEADLINE ?? (number === 27 ? 'Meet Meal Direct.' : 'Keep your campus link handy.')); supporting = resolve(draft.values.BACK_SUPPORTING ?? (number === 27 ? 'Discover meals and scheduled ordering options through your campus link.' : 'Explore your campus menu.')); }
  if (back && draft.values.VERIFIED_SUPPORT_ROUTE) supporting += `\nOrder help: ${resolve(draft.values.VERIFIED_SUPPORT_ROUTE)}`;
  if (number === 23 && draft.values.VERIFIED_VENDOR_NAME) supporting = resolve(draft.values.VERIFIED_VENDOR_NAME);
  if (number === 27 && format === 'a7') { headline = 'Explore your campus menu'; supporting = ''; }
  const imageFields = template.fields.filter((field) => field.type === 'image' && !/LOGO/.test(field.key));
  const hero = draft.values.APPROVED_MEAL_PHOTO || imageFields.map((field) => draft.values[field.key]).find(Boolean) || art?.image || template.image;
  const needsPhoto = imageFields.some((field) => field.required);
  const hasPhoto = Boolean(hero || needsPhoto) && !back && !compactQr;
  const usedTokens = `${draft.headline} ${draft.supporting}`;
  let details = template.fields.filter((field) => (field.type === 'text' || field.type === 'textarea') && !usedTokens.includes(`{{${field.key}}}`) && Boolean(draft.values[field.key]?.trim())).map((field) => ({ label: field.label.replace(/^Approved |^Verified |^Current /i, ''), text: draft.values[field.key] }));
  if (number === 4) details = [{ label: '01', text: 'Explore menus' }, { label: '02', text: 'Choose meal & slot' }, { label: '03', text: 'Complete your order' }];
  if (number === 17) details = [{ label: '01 Scan', text: 'Open your campus link.' }, { label: '02 Choose', text: 'Choose from available meals.' }, { label: '03 Order', text: draft.values.APPROVED_CHECKOUT_DETAILS || '[Checkout details]' }, { label: '04 Eat', text: draft.values.APPROVED_DELIVERY_WINDOW_DESCRIPTION || '[Delivery-window details]' }];
  if (frontOnly || compactQr) details = [];
  const dense = details.length > 0 && number !== 17;
  const bodyMin = smallPrint ? 37 : 26;
  const brandH = smallPrint ? 110 : 80;
  const locationY = top + brandH + 24;
  const locationH = smallPrint ? 120 : 80;
  const headlineY = locationY + locationH + 24;
  const footerH = compactQr ? Math.max(600, usable * .48) : smallPrint ? 380 : format === 'square' ? 220 : 260;
  const footerY = bottom - footerH;
  const bodyEnd = frontOnly ? bottom : footerY - 32;
  const headlineH = compactQr ? Math.min(back ? 160 : 250, bodyEnd - headlineY - 40) : format === 'square' ? 170 : Math.min(frontOnly ? 420 : dense ? 200 : 300, (bodyEnd - headlineY) * .45);
  const headerPhoto = hasPhoto && !frontOnly && number !== 25;
  const headlineW = headerPhoto ? contentW * .58 : contentW;
  const supportY = headlineY + headlineH + 24;
  const supportH = supporting && !frontOnly ? back ? Math.max(0, bodyEnd - supportY - 12) : Math.min(headerPhoto ? dense ? 170 : 260 : smallPrint ? 120 : 110, Math.max(70, (bodyEnd - supportY) * (headerPhoto ? .65 : .32))) : 0;
  const detailY = supportY + supportH + (supportH ? 24 : 0);
  const detailH = Math.max(0, bodyEnd - detailY);
  const photoH = Math.max(80, detailH);
  const qrSize = compactQr ? Math.min(contentW * .65, footerH - 180) : smallPrint ? 350 : format === 'square' ? 205 : 235;
  const textAreaW = contentW - qrSize - 36;
  const location = draft.campusName.trim() && draft.campusName.trim() !== draft.universityName.trim() ? `${draft.universityName}\n${draft.campusName}` : draft.universityName;

  return <svg ref={targetRef} xmlns="http://www.w3.org/2000/svg" width={spec.width} height={spec.height} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${template.name}, ${spec.label}${isDuplex ? `, ${side}` : ''}`} style={{ display: 'block', width: '100%', height: 'auto' }} data-print-width-mm={spec.widthMm ? spec.widthMm + 6 : undefined} data-print-height-mm={spec.heightMm ? spec.heightMm + 6 : undefined} data-format={format}>
    <title>{template.name} — {draft.universityName}</title>
    <desc>{proof ? 'Review proof: supplied facts and production checks require confirmation.' : 'Campaign artwork.'} {isPrint ? 'The canvas includes 3 mm bleed on all sides.' : ''}</desc>
    <defs>
      <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2=".4" y2="1"><stop stopColor={dark ? '#113D21' : '#FFFFFF'} /><stop offset="1" stopColor={bg} /></linearGradient>
      <linearGradient id={`${uid}-photo-fade`}><stop stopColor="black" /><stop offset=".22" stopColor="white" /></linearGradient>
      <mask id={`${uid}-photo-mask`} maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill={`url(#${uid}-photo-fade)`} /></mask>
    </defs>
    <g data-layer="background"><rect width={W} height={H} fill={`url(#${uid}-paper)`} /></g>
    {headerPhoto && <g mask={`url(#${uid}-photo-mask)`}><Photo src={hero} x={margin + contentW * .58} y={headlineY - 35} width={W - margin - contentW * .58} height={dense ? headlineH + supportH + 58 : bodyEnd - headlineY + 35} id={`${uid}-header`} proof={proof} /></g>}
    <Brand x={margin} y={top} color={dark ? P.white : P.deepGreen} compact={smallPrint} />
    {((number === 26 && draft.values.PARTNER_LOGO_APPROVED) || (number === 23 && draft.values.APPROVED_VENDOR_LOGO)) && <g data-layer="approved-partner-logo"><image href={number === 26 ? draft.values.PARTNER_LOGO_APPROVED : draft.values.APPROVED_VENDOR_LOGO} x={W - margin - 220} y={top} width={220} height={brandH} preserveAspectRatio="xMidYMid meet" /></g>}
    <TextBlock name="campus-identity" text={location || '[University name]'} x={margin} y={locationY} width={contentW} height={locationH} size={smallPrint ? 43 : 32} min={smallPrint ? 37 : 26} color={muted} weight={500} />
    <TextBlock name="headline" text={headline} x={margin} y={headlineY} width={headlineW} height={headlineH} size={frontOnly ? 124 : compactQr ? 92 : 110} min={smallPrint ? 60 : 48} color={ink} accent={dark ? '#95DC78' : P.green} highlight={!back && art?.highlight} weight={800} display />
    {!frontOnly && <TextBlock name="supporting-copy" text={supporting} x={margin} y={supportY} width={headerPhoto ? contentW * .54 : contentW} height={supportH} size={smallPrint ? 43 : 34} min={bodyMin} color={muted} />}

    {frontOnly && hasPhoto && <Photo src={hero} x={margin} y={supportY + 20} width={contentW} height={Math.max(80, bottom - supportY - 20)} id={`${uid}-front`} proof={proof} />}
    {!frontOnly && !compactQr && <g data-layer="campaign-content">
      {number === 25 ? <>
        <Photo src={draft.values.APPROVED_JOLLOF_IMAGE || ''} x={margin} y={detailY} width={(contentW - 20) / 2} height={Math.max(80, detailH - 48)} id={`${uid}-jollof`} proof={proof} />
        <Photo src={draft.values.APPROVED_SWALLOW_IMAGE || ''} x={margin + (contentW + 20) / 2} y={detailY} width={(contentW - 20) / 2} height={Math.max(80, detailH - 48)} id={`${uid}-swallow`} proof={proof} />
        {['JOLLOF', 'SWALLOW'].map((label, i) => <TextBlock key={label} name={`food-label-${i}`} text={label} x={margin + i * (contentW + 20) / 2} y={bodyEnd - 40} width={(contentW - 20) / 2} height={40} size={28} min={26} color={ink} weight={600} />)}
      </> : details.length ? <>
        {hasPhoto && !headerPhoto && <Photo src={hero} x={margin + contentW * .62} y={detailY} width={contentW * .38} height={photoH} id={`${uid}-detail`} proof={proof} />}
        {details.map((detail, index) => {
          const columns = number === 4 ? 3 : number === 17 ? 2 : 1;
          const rowH = detailH / Math.ceil(details.length / columns);
          const width = ((hasPhoto && !headerPhoto ? contentW * .56 : contentW) - (columns - 1) * 28) / columns;
          const x = margin + (index % columns) * (width + 28);
          const y = detailY + Math.floor(index / columns) * rowH;
          return <g key={`${detail.label}-${index}`} data-layer={`detail-${index + 1}`}>
            <line x1={x} y1={y} x2={x + width} y2={y} stroke={dark ? P.mint : P.green} strokeOpacity={.3} />
            <TextBlock name={detail.label} text={`${detail.label}${columns === 2 ? '\n' : ': '}${detail.text}`} x={x} y={y + 10} width={width} height={Math.max(0, rowH - 16)} size={smallPrint ? 39 : 30} min={smallPrint ? 35 : 24} color={ink} weight={index === 0 && number === 12 ? 600 : 400} />
          </g>;
        })}
      </> : hasPhoto && !headerPhoto ? <Photo src={hero} x={margin} y={detailY} width={contentW} height={photoH} id={`${uid}-hero`} proof={proof} /> : <>
        {[6, 15, 19, 24, 26].includes(number) && <rect x={margin} y={detailY + Math.max(0, detailH - 12)} width={contentW * .3} height={8} fill={P.mint} />}
      </>}
    </g>}

    {!frontOnly && <g data-layer="scan-and-destination">
      <rect x={0} y={footerY - 12} width={W} height={H - footerY + 12} fill={dark ? '#DDF1DF' : '#E9F7EA'} />
      {compactQr ? <>
        <TextBlock name="scan-action" text={resolve(draft.cta)} x={margin} y={footerY + 10} width={contentW} height={90} size={smallPrint ? 43 : 38} min={smallPrint ? 38 : 30} color={P.deepGreen} weight={600} center />
        {qr && <image data-layer="qr-code" href={qr} x={(W - qrSize) / 2} y={footerY + 110} width={qrSize} height={qrSize} preserveAspectRatio="xMidYMid meet" style={{ imageRendering: 'pixelated' }} />}
        <TextBlock name="destination-url" text={draft.destination || '[Campaign destination]'} x={margin} y={footerY + qrSize + 132} width={contentW} height={Math.max(80, bottom - footerY - qrSize - 132)} size={smallPrint ? 35 : 26} min={smallPrint ? 32 : 23} color={P.slate} center />
      </> : <>
        <rect x={margin} y={footerY + 22} width={textAreaW} height={footerH * .42 + 16} rx={28} fill={P.green} />
        <TextBlock name="scan-action" text={resolve(draft.cta)} x={margin + 16} y={footerY + 32} width={textAreaW - 32} height={footerH * .42} size={smallPrint ? 42 : 38} min={smallPrint ? 36 : 28} color={P.white} weight={700} center verticalCenter />
        <TextBlock name="destination-url" text={draft.destination || '[Campaign destination]'} x={margin} y={footerY + footerH * .64} width={textAreaW} height={footerH * .32} size={smallPrint ? 33 : 25} min={smallPrint ? 30 : 22} color={P.slate} />
        {qr && <image data-layer="qr-code" href={qr} x={W - margin - qrSize} y={footerY + (footerH - qrSize) / 2} width={qrSize} height={qrSize} preserveAspectRatio="xMidYMid meet" style={{ imageRendering: 'pixelated' }} />}
      </>}
    </g>}
    {proof && <g data-layer="review-proof"><rect x={0} y={0} width={W} height={32} fill={P.deepGreen} /><text x={W / 2} y={23} textAnchor="middle" fontSize={18} fontFamily={bodyFont} fontWeight={600} letterSpacing={3} fill={P.white}>REVIEW PROOF · NOT FOR PUBLICATION</text><g transform={`translate(${W / 2} ${frontOnly ? bottom - 100 : bodyEnd - 22}) rotate(-8)`}><rect x={-175} y={-30} width={350} height={48} fill={P.white} fillOpacity={.94} /><text textAnchor="middle" fontSize={26} fontFamily={bodyFont} fontWeight={700} fill={P.deepGreen}>REVIEW PROOF</text></g></g>}
  </svg>;
}
