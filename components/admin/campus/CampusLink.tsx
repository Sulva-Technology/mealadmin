'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const CAMPUS_APP_URL = 'https://user.mealdirectly.com';

function campusUrl(slug: string) {
  return `${CAMPUS_APP_URL}/${encodeURIComponent(slug)}`;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Clipboard access was denied.');
}

export function CampusLink({ slug, compact = false }: { slug?: string; compact?: boolean }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!slug) return <span>—</span>;

  const url = campusUrl(slug);

  const copy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    try {
      await copyText(url);
      setCopied(true);
      toast.success('Campus link copied.');
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      toast.error('Could not copy the campus link.');
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="inline-flex min-w-0 items-center gap-1 text-primary hover:underline"
        title={url}
      >
        <span className="truncate font-mono text-xs">{url}</span>
        {!compact && <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      </a>
      <Button
        size="sm"
        variant="outline"
        className={compact ? 'px-2' : undefined}
        onClick={copy}
        title="Copy campus link"
        aria-label="Copy campus link"
      >
        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        {!compact && (copied ? 'Copied' : 'Copy link')}
      </Button>
    </div>
  );
}
