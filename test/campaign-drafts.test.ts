import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isCampaignDraft, readCampaignDraft, saveCampaignDraft } from '@/lib/campaign-drafts';
import { createCampaignDraft, FLYER_TEMPLATES } from '@/lib/campaign-studio';

const draft = () => createCampaignDraft(FLYER_TEMPLATES[0], { name: 'University of Lagos', slug: 'unilag' });

describe('campaign draft persistence', () => {
  beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

  it('isolates saved copy by campus and campaign', () => {
    const edited = { ...draft(), headline: 'A saved headline' };
    expect(saveCampaignDraft('campus-a', 'launch', edited)).toBeUndefined();
    expect(readCampaignDraft('campus-a', 'launch').draft?.headline).toBe('A saved headline');
    expect(readCampaignDraft('campus-b', 'launch').draft).toBeNull();
    expect(readCampaignDraft('campus-a', 'referral').draft).toBeNull();
  });

  it('does not reuse older campaign claims or stage-only drafts', () => {
    localStorage.setItem('mealdirect:campaign-draft:campus-a:launch', JSON.stringify({ headline: 'Official campus drop', stage: 'live' }));
    expect(readCampaignDraft('campus-a', 'launch').draft).toBeNull();
  });

  it('rejects malformed fields and retains the original stored data', () => {
    const key = 'mealdirect:campaign-draft:v2:campus-a:launch';
    localStorage.setItem(key, '{broken');
    expect(readCampaignDraft('campus-a', 'launch').error).toBeTruthy();
    expect(localStorage.getItem(key)).toBe('{broken');
    expect(isCampaignDraft({ ...draft(), values: { photo: 123 } })).toBe(false);
    expect(isCampaignDraft({ ...draft(), checks: { checked: 'yes' } })).toBe(false);
    expect(isCampaignDraft({ ...draft(), headline: null })).toBe(false);
  });

  it('reports storage failures without crashing editing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    expect(saveCampaignDraft('campus-a', 'launch', draft())).toContain('Download a draft file');
  });
});
