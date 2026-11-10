import type { CampaignDraft } from './campaign-studio';

const storageKey = (campusId: string, templateId: string) => `mealdirect:campaign-draft:v2:${campusId}:${templateId}`;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export function isCampaignDraft(value: unknown): value is CampaignDraft {
  if (!isRecord(value) || value.version !== 2) return false;
  if (!['universityName', 'campusName', 'destination', 'headline', 'supporting', 'cta'].every((key) => typeof value[key] === 'string')) return false;
  return isRecord(value.values) && Object.values(value.values).every((item) => typeof item === 'string') &&
    isRecord(value.checks) && Object.values(value.checks).every((item) => typeof item === 'boolean');
}

export function readCampaignDraft(campusId: string, templateId: string): { draft: CampaignDraft | null; error?: string } {
  try {
    const serialized = window.localStorage.getItem(storageKey(campusId, templateId));
    if (!serialized) return { draft: null };
    const parsed: unknown = JSON.parse(serialized);
    if (!isCampaignDraft(parsed)) return { draft: null, error: 'An incompatible saved draft was skipped. The original remains in local storage.' };
    return { draft: parsed };
  } catch {
    return { draft: null, error: 'The saved draft could not be read. You can still edit and download a draft file.' };
  }
}

export function saveCampaignDraft(campusId: string, templateId: string, draft: CampaignDraft): string | undefined {
  try { window.localStorage.setItem(storageKey(campusId, templateId), JSON.stringify(draft)); }
  catch { return 'This draft could not be saved on this device. Download a draft file to keep your changes.'; }
}
