import { describe, expect, it } from 'vitest';
import { CAMPAIGN_FORMATS, FLYER_TEMPLATES, campaignDestination, createCampaignDraft, interpolateCampaignCopy, isSafeCampaignUrl, validateCampaignDraft } from '@/lib/campaign-studio';

describe('campaign production rules', () => {
  it('provides 28 independent briefs with a valid default format', () => {
    expect(FLYER_TEMPLATES).toHaveLength(28);
    expect(new Set(FLYER_TEMPLATES.map((template) => template.id)).size).toBe(28);
    for (const template of FLYER_TEMPLATES) expect(template.formats).toContain(template.defaultFormat);
  });

  it('does not silently route applications, event details or feedback to ordering', () => {
    for (const number of [10, 11, 12, 13, 14, 15, 16, 19, 24]) {
      const template = FLYER_TEMPLATES[number - 1];
      expect(createCampaignDraft(template, { name: 'Campus', slug: 'campus' }).destination).toBe('');
    }
    expect(campaignDestination()).toBe('');
    expect(campaignDestination('a/b')).toBe('https://user.mealdirectly.com/a%2Fb');
  });

  it('accepts only explicit public web destinations', () => {
    for (const value of ['javascript:alert(1)', 'data:text/html,test', '/campus', 'https://user:password@example.com', 'https://localhost', 'https://127.0.0.1', 'https://example.com/{{CAMPUS}}']) expect(isSafeCampaignUrl(value)).toBe(false);
    expect(isSafeCampaignUrl('https://example.com/campus?ref=event')).toBe(true);
  });

  it('leaves unknown placeholders visible and blocks final export', () => {
    expect(interpolateCampaignCopy('{{KNOWN}} {{MISSING}}', { KNOWN: 'Meal Direct' })).toBe('Meal Direct {{MISSING}}');
    const template = FLYER_TEMPLATES[0];
    const draft = createCampaignDraft(template, { name: 'Campus', slug: 'campus' });
    draft.checks = Object.fromEntries(template.checks.map((check) => [check, true]));
    expect(validateCampaignDraft(template, draft)).toEqual([]);
    draft.headline = '{{UNKNOWN}}';
    expect(validateCampaignDraft(template, draft).join(' ')).toContain('template field');
  });

  it('requires genuine named content and supplied images before final export', () => {
    const template = FLYER_TEMPLATES[10];
    const draft = createCampaignDraft(template, { name: 'Campus', slug: 'campus' });
    draft.destination = 'https://example.com/vendor';
    draft.checks = Object.fromEntries(template.checks.map((check) => [check, true]));
    const errors = validateCampaignDraft(template, draft).join(' ');
    expect(errors).toContain('vendor name');
    expect(errors).toContain('featured meal');
    expect(errors).toContain('photograph');
  });

  it('keeps exact digital sizes and includes bleed in 300-ppi print canvases', () => {
    expect(CAMPAIGN_FORMATS.feed).toMatchObject({ width: 1080, height: 1350 });
    expect(CAMPAIGN_FORMATS.story).toMatchObject({ width: 1080, height: 1920 });
    expect(CAMPAIGN_FORMATS.a6.width).toBe(Math.round(111 * 300 / 25.4));
    expect(CAMPAIGN_FORMATS.a6.height).toBe(Math.round(154 * 300 / 25.4));
  });
});
