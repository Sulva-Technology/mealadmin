import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  qr: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  campuses: [
    { id: 'campus-a', name: 'University of Lagos', slug: 'unilag', active: true },
    { id: 'campus-b', name: 'Another University', slug: 'another', active: false },
  ],
}));

vi.mock('@/lib/hooks', () => ({ useApiQuery: () => ({ data: { data: mocks.campuses }, isLoading: false, isError: false, refetch: vi.fn() }) }));
vi.mock('@/components/ui/Toast', () => ({ useToast: () => mocks.toast }));
vi.mock('qrcode', () => ({ default: { toDataURL: mocks.qr } }));
vi.mock('@/components/admin/campaign/CampaignPoster', () => ({
  CampaignPoster: ({ qr, draft, proof }: { qr: string; draft: { destination: string }; proof: boolean }) => <svg data-testid="campaign-poster" data-qr={qr} data-destination={draft.destination} data-proof={String(proof)} />,
}));

import { CampaignStudio } from '@/components/admin/campaign/CampaignStudio';

describe('campaign editor state boundaries', () => {
  beforeEach(() => {
    vi.stubGlobal('React', React);
    localStorage.clear();
    mocks.qr.mockReset().mockImplementation(async (url: string) => `data:image/png;base64,${url}`);
  });
  afterEach(cleanup);

  it('persists edits immediately when switching away and back', async () => {
    render(<CampaignStudio />);
    fireEvent.change(await screen.findByLabelText('Headline'), { target: { value: 'Saved campus launch' } });
    fireEvent.click(screen.getByRole('button', { name: /02\s*Coming soon/i }));
    expect(screen.getByLabelText('Headline')).not.toHaveValue('Saved campus launch');
    fireEvent.click(screen.getByRole('button', { name: /01\s*Campus launch/i }));
    await waitFor(() => expect(screen.getByLabelText('Headline')).toHaveValue('Saved campus launch'));
    fireEvent.change(screen.getByLabelText('Campus record'), { target: { value: 'campus-b' } });
    expect(screen.getByLabelText('Headline')).not.toHaveValue('Saved campus launch');
  });

  it('removes the old QR immediately when the new destination is invalid', async () => {
    render(<CampaignStudio />);
    await waitFor(() => expect(screen.getByTestId('campaign-poster').getAttribute('data-qr')).toContain('unilag'));
    fireEvent.change(screen.getByLabelText(/Campus destination URL/), { target: { value: 'javascript:alert(1)' } });
    expect(screen.getByTestId('campaign-poster')).toHaveAttribute('data-qr', '');
    expect(screen.getByRole('button', { name: 'Download proof PNG' })).toBeDisabled();
  });

  it('does not let a late QR result replace the current destination', async () => {
    const resolvers = new Map<string, (data: string) => void>();
    mocks.qr.mockImplementation((url: string) => new Promise<string>((resolve) => resolvers.set(url, resolve)));
    render(<CampaignStudio />);
    const first = 'https://user.mealdirectly.com/unilag';
    const second = 'https://example.com/campus';
    await waitFor(() => expect(resolvers.has(first)).toBe(true));
    fireEvent.change(screen.getByLabelText(/Campus destination URL/), { target: { value: second } });
    await waitFor(() => expect(resolvers.has(second)).toBe(true));
    resolvers.get(second)!('current-code');
    await waitFor(() => expect(screen.getByTestId('campaign-poster')).toHaveAttribute('data-qr', 'current-code'));
    resolvers.get(first)!('stale-code');
    await waitFor(() => expect(screen.getByTestId('campaign-poster')).toHaveAttribute('data-qr', 'current-code'));
  });

  it('requires review again after editing approved copy', async () => {
    render(<CampaignStudio />);
    fireEvent.click(screen.getByRole('tab', { name: /Review/ }));
    for (const checkbox of screen.getAllByRole('checkbox')) fireEvent.click(checkbox);
    await waitFor(() => expect(screen.getByTestId('campaign-poster')).toHaveAttribute('data-proof', 'false'));
    fireEvent.click(screen.getByRole('tab', { name: 'Content & assets' }));
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Updated launch headline' } });
    expect(screen.getByTestId('campaign-poster')).toHaveAttribute('data-proof', 'true');
  });

  it('does not assume that an inactive campus has live ordering', async () => {
    mocks.campuses[0].active = false;
    try {
      render(<CampaignStudio />);
      expect(await screen.findByLabelText('Campus record')).toHaveValue('campus-a');
      expect(screen.getByTestId('campaign-poster')).toHaveAttribute('data-proof', 'true');
    } finally { mocks.campuses[0].active = true; }
  });

  it('resets an alternate campaign to matching default copy and destination', async () => {
    render(<CampaignStudio />);
    fireEvent.click(screen.getByRole('button', { name: /19\s*Student Voice/i }));
    fireEvent.change(screen.getByLabelText('Campaign action'), { target: { value: 'quote' } });
    expect(screen.getByLabelText(/Campus destination URL/)).toHaveValue('https://user.mealdirectly.com/unilag');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Campaign action')).toHaveValue('default');
    expect(screen.getByLabelText('Headline')).toHaveValue('Tried Meal Direct?\nTell us what you think.');
    expect(screen.getByLabelText(/Feedback destination URL/)).toHaveValue('');
    expect(screen.getByTestId('campaign-poster')).toHaveAttribute('data-proof', 'true');
  });
});
