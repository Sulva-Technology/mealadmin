'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';

export type Column<T> = {
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
};

export function DataTable<T>({
  columns, rows, rowKey, rowHref, layout = 'fixed',
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  /** 'fixed' spreads columns to equal widths; 'auto' sizes each to its content. */
  layout?: 'fixed' | 'auto';
}) {
  const align = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');

  return (
    <div className="overflow-x-auto">
      <table className={`w-full min-w-[760px] ${layout === 'auto' ? 'table-auto' : 'table-fixed'} text-left border-collapse`}>
        <thead>
          <tr className="border-b border-muted/20 bg-canvas dark:bg-ink/50">
            {columns.map((c, i) => (
              <th
                key={i}
                className={`py-3.5 px-5 text-xs font-semibold text-muted uppercase tracking-wider ${align(c.align)}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-muted/10">
          {rows.map((row) => {
            const href = rowHref?.(row);
            return (
              <tr
                key={rowKey(row)}
                className="transition-colors hover:bg-canvas/60 focus-within:bg-canvas/60 dark:hover:bg-ink/40 dark:focus-within:bg-ink/40"
              >
                {columns.map((c, i) => (
                  <td key={i} className={`py-3.5 px-5 text-sm text-ink dark:text-muted ${align(c.align)} ${c.className ?? ''}`}>
                    {href && i === 0 ? (
                      <Link
                        href={href}
                        className="-m-2 block rounded-md p-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      >
                        {c.render(row)}
                      </Link>
                    ) : c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
