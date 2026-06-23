'use client';

import { type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const base =
  'w-full px-3 py-2 rounded-xl bg-surface dark:bg-ink/50 border border-muted/20 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';

export function SearchInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative w-full md:w-72', className)}>
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input type="text" className={cn(base, 'pl-9')} {...rest} />
    </div>
  );
}

export function TextField({
  label, className, hint, ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink dark:text-muted mb-1">{label}</span>}
      <input className={cn(base, className)} {...rest} />
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}

export function Select({
  label, children, className, ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink dark:text-muted mb-1">{label}</span>}
      <select className={cn(base, 'cursor-pointer', className)} {...rest}>
        {children}
      </select>
    </label>
  );
}

export function TextArea({
  label, className, ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink dark:text-muted mb-1">{label}</span>}
      <textarea className={cn(base, 'min-h-[90px]', className)} {...rest} />
    </label>
  );
}

/** Compact filter <select> for toolbars (no label). */
export function FilterSelect({ children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="px-3 py-2 rounded-xl bg-surface dark:bg-ink/50 border border-muted/20 text-sm outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
      {...rest}
    >
      {children}
    </select>
  );
}
