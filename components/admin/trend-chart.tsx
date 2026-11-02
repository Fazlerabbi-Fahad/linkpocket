'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';

interface Point {
  date: string;
  value: number;
}

const dayFormat = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const label = (date: string) => dayFormat.format(new Date(`${date}T00:00:00Z`));

/**
 * FR-AD4: one series per chart (new users and links added have different scales, so they
 * get two charts rather than two axes). Thin bars with a 2 px gap, rounded data ends on the
 * baseline, a recessive top gridline, hover details, and the numbers as a table.
 */
export function TrendChart({
  title,
  unit,
  points,
  series = 1,
}: {
  title: string;
  unit: string;
  points: Point[];
  /** DESIGN.md: the first series is indigo (chart-1), the second violet (chart-2). */
  series?: 1 | 2;
}) {
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const shown = active === null ? null : points[active];

  return (
    <figure className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">
          Last 30 days · {total.toLocaleString('en')} in total
        </span>
      </figcaption>

      <div className="relative mt-4" aria-hidden>
        <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>{max.toLocaleString('en')}</span>
          <span className="min-h-4">
            {shown ? `${label(shown.date)}: ${shown.value.toLocaleString('en')}` : ''}
          </span>
        </div>
        <div
          className="mt-1 flex h-32 items-end gap-[2px] border-t border-dashed border-border pt-px"
          onMouseLeave={() => setActive(null)}
        >
          {points.map((point, index) => (
            <div
              key={point.date}
              className="flex h-full min-w-0 flex-1 items-end"
              onMouseEnter={() => setActive(index)}
            >
              <div
                className={cn(
                  'w-full rounded-t-[4px] transition-opacity',
                  series === 1 ? 'bg-chart-1' : 'bg-chart-2',
                )}
                style={{
                  height: point.value === 0 ? 0 : `max(2px, ${(point.value / max) * 100}%)`,
                  opacity: active === null || active === index ? 1 : 0.45,
                }}
              />
            </div>
          ))}
        </div>
        <div className="border-t border-input" />
        <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>{points[0] ? label(points[0].date) : ''}</span>
          <span>{points.at(-1) ? label(points.at(-1)!.date) : ''}</span>
        </div>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Show as a table
        </summary>
        <table id={tableId} className="mt-2 w-full text-left">
          <caption className="sr-only">{title}, last 30 days</caption>
          <thead>
            <tr className="text-muted-foreground">
              <th scope="col" className="py-1 font-medium">
                Day (UTC)
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {unit}
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-[13px]">
            {points.map((point) => (
              <tr key={point.date} className="border-t border-border">
                <td className="py-1">{point.date}</td>
                <td className="py-1 text-right">{point.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
