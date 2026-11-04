'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useSession } from '@/lib/session';
import { visibleNavGroups } from '@/lib/rbac';
import { Modal } from '@/components/ui/Modal';

export function QuickNav() {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const items = useMemo(() => visibleNavGroups(session).flatMap((group) => (
    group.items.map((item) => ({ ...item, group: group.label }))
  )), [session]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = items.filter((item) => (
    !normalizedQuery || `${item.name} ${item.group}`.toLocaleLowerCase().includes(normalizedQuery)
  ));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-muted/20 bg-surface/60 px-2.5 py-1.5 text-xs font-medium text-muted hover:text-primary-strong dark:bg-ink/40"
        aria-label="Find a page"
        title="Find a page (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Find a page</span>
        <kbd className="hidden xl:inline rounded border border-muted/20 px-1 font-mono text-[10px]">Ctrl K</kbd>
      </button>
      <Modal open={open} onClose={close} title="Find a page">
        <label className="block">
          <span className="sr-only">Search admin pages</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pages"
              className="w-full rounded-xl border border-muted/20 bg-canvas py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 dark:bg-ink dark:text-white"
            />
          </div>
        </label>
        <ul className="mt-4 max-h-72 space-y-1 overflow-y-auto" aria-label="Matching admin pages">
          {matches.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={close}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:text-white dark:hover:bg-ink/60"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-muted">{item.group}</span>
              </Link>
            </li>
          ))}
          {matches.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matching pages.</li>}
        </ul>
      </Modal>
    </>
  );
}
