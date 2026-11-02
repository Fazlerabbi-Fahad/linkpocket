'use client';

import type { AdminStats } from '@/shared';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminStats } from '@/lib/admin';
import { cn } from '@/lib/cn';
import { TrendChart } from './trend-chart';

const timeFormat = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});
const n = (value: number) => value.toLocaleString('en');

function Tiles({ title, tiles }: { title: string; tiles: [string, string][] }) {
  return (
    <section aria-label={title}>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
        {/* Each tile draws its right and bottom rule; the 1px overhang is clipped. */}
        <dl className="-mr-px -mb-px grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col-reverse gap-1 border-r border-b border-border px-4 py-3.5"
            >
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-display text-[1.65rem] leading-none font-semibold tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function usersTiles(stats: AdminStats): [string, string][] {
  const u = stats.users;
  return [
    ['Total users', n(u.total)],
    ['Verified', n(u.verified)],
    ['Unverified', n(u.unverified)],
    ['New today', n(u.newToday)],
    ['New, 7 days', n(u.new7d)],
    ['New, 30 days', n(u.new30d)],
    ['Active, 7 days', n(u.active7d)],
    ['Active, 30 days', n(u.active30d)],
    ['With no links', n(u.withZeroResources)],
  ];
}

function linkTiles(stats: AdminStats): [string, string][] {
  const r = stats.resources;
  return [
    ['Total links', n(r.total)],
    ['Added today', n(r.addedToday)],
    ['Added, 7 days', n(r.added7d)],
    ['Added, 30 days', n(r.added30d)],
    ['Per user, average', r.averagePerUser.toLocaleString('en', { maximumFractionDigits: 2 })],
    ['Pinned', n(r.pinned)],
  ];
}

/** FR-AD3, FR-AD4, FR-AD9: counts only, computed when the page loads, with a refresh control. */
export function AdminOverview() {
  const stats = useAdminStats();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[2rem] leading-tight font-semibold tracking-tight">
            Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" role="status">
            {stats.data
              ? `Counts as of ${timeFormat.format(new Date(stats.data.generatedAt))}. Active means used the app in that window. Days are UTC.`
              : stats.isError
                ? 'Could not load the counts.'
                : 'Counting…'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={stats.isFetching}
          onClick={() => void stats.refetch()}
        >
          <RefreshCw aria-hidden className={cn(stats.isFetching && 'motion-safe:animate-spin')} />
          {stats.isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {stats.data ? (
        <>
          <Tiles title="Users" tiles={usersTiles(stats.data)} />
          <Tiles title="Links" tiles={linkTiles(stats.data)} />
          <section aria-label="Trends" className="grid gap-4 lg:grid-cols-2">
            <TrendChart
              title="New users per day"
              unit="new users"
              points={stats.data.trend.map((d) => ({ date: d.date, value: d.newUsers }))}
            />
            <TrendChart
              title="Links added per day"
              unit="links added"
              series={2}
              points={stats.data.trend.map((d) => ({ date: d.date, value: d.resourcesAdded }))}
            />
          </section>
        </>
      ) : stats.isError ? (
        <div role="alert" className="rounded-xl border border-border px-5 py-8 text-center">
          <p className="text-[15px]">Could not load the counts.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => void stats.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
