'use client';

import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type Column<T> = {
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
};

export function DataTable<T>({
  columns, rows, rowKey, rowHref,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
}) {
  const router = useRouter();
  const align = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
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
                onClick={href ? () => router.push(href) : undefined}
                className={`transition-colors hover:bg-canvas/60 dark:hover:bg-ink/40 ${href ? 'cursor-pointer' : ''}`}
              >
                {columns.map((c, i) => (
                  <td key={i} className={`py-3.5 px-5 text-sm text-ink dark:text-muted ${align(c.align)} ${c.className ?? ''}`}>
                    {c.render(row)}
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
