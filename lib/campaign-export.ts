const SVG_NS = 'http://www.w3.org/2000/svg';
const assets = new Map<string, Promise<string>>();

async function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not embed an export asset.'));
    reader.readAsDataURL(blob);
  });
}

async function embedAsset(value: string, base = document.baseURI): Promise<string> {
  if (/^data:(image\/(png|jpeg|webp)|font\/[^;,]+|application\/(font-woff|octet-stream));base64,/i.test(value)) return value;
  const url = new URL(value, base);
  if (url.origin !== location.origin) throw new Error('Upload the image to the studio before exporting. External assets cannot be embedded.');
  const key = url.href;
  if (!assets.has(key)) {
    assets.set(key, fetch(key).then(async (response) => {
      if (!response.ok) throw new Error(`Could not load export asset: ${url.pathname}`);
      const blob = await response.blob();
      if (!blob.size || /text\/html|application\/json/.test(blob.type)) throw new Error(`Invalid export asset: ${url.pathname}`);
      return asDataUrl(blob);
    }).catch((error: unknown) => { assets.delete(key); throw error; }));
  }
  return assets.get(key)!;
}

const familyName = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');

function fontRules(): { rule: CSSFontFaceRule; base: string }[] {
  const result: { rule: CSSFontFaceRule; base: string }[] = [];
  const visit = (rules: CSSRuleList, base: string) => {
    for (const rule of Array.from(rules)) {
      if (rule.type === CSSRule.FONT_FACE_RULE) result.push({ rule: rule as CSSFontFaceRule, base });
      else if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules, base);
      else if (rule.type === CSSRule.IMPORT_RULE) {
        const imported = (rule as CSSImportRule).styleSheet;
        if (imported) { try { visit(imported.cssRules, imported.href || base); } catch { /* Only matched local font families are required below. */ } }
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try { visit(sheet.cssRules, sheet.href || document.baseURI); } catch { /* Cross-origin styles cannot be read; missing fonts fail below. */ }
  }
  return result;
}

export function campaignLayoutIssues(svg: SVGSVGElement): string[] {
  const issues = new Set<string>();
  const canvas = svg.viewBox.baseVal;
  for (const group of Array.from(svg.querySelectorAll<SVGGElement>('g[data-text-box]'))) {
    const [x, y, width, height] = (group.dataset.textBox ?? '').split(',').map(Number);
    const bounds = group.getBBox();
    const fontSize = Number(group.querySelector('text')?.getAttribute('font-size') || 24);
    // SVG font bounds include ascender/descender space beyond the visible glyphs.
    const metricPadding = Math.max(4, fontSize * .16);
    if (group.dataset.overflow === 'true' || bounds.x < x - metricPadding || bounds.y < y - metricPadding || bounds.x + bounds.width > x + width + 3 || bounds.y + bounds.height > y + height + metricPadding || bounds.x < canvas.x || bounds.y < canvas.y || bounds.x + bounds.width > canvas.x + canvas.width || bounds.y + bounds.height > canvas.y + canvas.height) {
      issues.add(`Shorten ${group.dataset.fieldLabel?.replace(/-/g, ' ') || 'the text'} or choose a larger format.`);
    }
  }
  return [...issues];
}

export async function serializeCampaignSvg(svg: SVGSVGElement, physicalSize = false): Promise<{ source: string; width: number; height: number }> {
  await document.fonts.ready;
  const issues = campaignLayoutIssues(svg);
  if (issues.length) throw new Error(issues[0]);
  const width = Number(svg.getAttribute('width'));
  const height = Number(svg.getAttribute('height'));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || width * height > 25_000_000) throw new Error('This export size is not supported.');
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', SVG_NS);
  clone.removeAttribute('style');
  clone.removeAttribute('role');
  clone.removeAttribute('aria-label');
  const families = new Set<string>();
  const sourceText = Array.from(svg.querySelectorAll('text'));
  const copyText = Array.from(clone.querySelectorAll('text'));
  sourceText.forEach((text, index) => {
    const style = getComputedStyle(text);
    const family = familyName(style.fontFamily.split(',')[0]);
    families.add(family);
    copyText[index].setAttribute('font-family', style.fontFamily);
  });
  const rules = fontRules().filter(({ rule }) => families.has(familyName(rule.style.getPropertyValue('font-family'))));
  for (const family of families) {
    if (!rules.some(({ rule }) => familyName(rule.style.getPropertyValue('font-family')) === family)) throw new Error(`The ${family} font is not ready for export. Reload the page and try again.`);
  }
  const embeddedRules = await Promise.all(rules.map(async ({ rule, base }) => {
    let css = rule.cssText;
    const urls = [...css.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)];
    if (!urls.length) throw new Error('A required font cannot be embedded. Reload the page and try again.');
    for (const match of urls) css = css.replace(match[0], `url("${await embedAsset(match[1], base)}")`);
    return css;
  }));
  await Promise.all(Array.from(clone.querySelectorAll('image')).map(async (image) => {
    const href = image.getAttribute('href') || image.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (!href) throw new Error('An image is missing from this design.');
    if (href.startsWith('data:') && !/^data:image\/(png|jpeg|webp);base64,/i.test(href)) throw new Error('Use a PNG, JPEG or WebP campaign image.');
    image.setAttribute('href', await embedAsset(href));
    image.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
  }));
  const style = document.createElementNS(SVG_NS, 'style');
  style.textContent = embeddedRules.join('\n');
  clone.insertBefore(style, clone.firstChild);
  if (physicalSize && svg.dataset.printWidthMm && svg.dataset.printHeightMm) {
    clone.setAttribute('width', `${svg.dataset.printWidthMm}mm`);
    clone.setAttribute('height', `${svg.dataset.printHeightMm}mm`);
  }
  return { source: new XMLSerializer().serializeToString(clone), width, height };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadCampaignSvg(svg: SVGSVGElement, filename: string) {
  const { source } = await serializeCampaignSvg(svg, true);
  downloadBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), filename);
}

export async function downloadCampaignPng(svg: SVGSVGElement, filename: string) {
  const { source, width, height } = await serializeCampaignSvg(svg);
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not create the PNG. Try the editable SVG export.');
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not encode the PNG.')), 'image/png'));
    downloadBlob(blob, filename);
  } finally { URL.revokeObjectURL(url); }
}
