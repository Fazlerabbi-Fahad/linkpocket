'use client';

import { TIMINGS, type AdminUserSummary } from '@/shared';
import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminUsers } from '@/lib/admin';
import { cn } from '@/lib/cn';
import { savedOn } from '@/lib/links';
import { useMe } from '@/lib/session';
import { StatusDialog } from './status-dialog';

const when = (iso: string | null) => (iso ? savedOn(iso) : 'Never');

function Badge({ tone, children }: { tone: 'plain' | 'strong'; children: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md px-2 font-mono text-[11px] font-medium tracking-wide uppercase',
        tone === 'strong' ? 'bg-foreground text-background' : 'border border-input text-foreground',
      )}
    >
      {children}
    </span>
  );
}

/** FR-AD5, FR-AD6: account summaries (never their links), search by email, 25 per page. */
export function AdminUsers() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const me = useMe();
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const users = useAdminUsers(q, page);
  const [search, setSearch] = useState(q);
  const [changing, setChanging] = useState<AdminUserSummary | null>(null);
  const [notice, setNotice] = useState('');
  const qRef = useRef(q);
  qRef.current = q;

  const go = (nextQ: string, nextPage: number) => {
    const write = new URLSearchParams();
    if (nextQ) write.set('q', nextQ);
    if (nextPage > 1) write.set('page', String(nextPage));
    const query = write.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  };
  const goRef = useRef(go);
  goRef.current = go;

  useEffect(() => {
    const next = search.trim().toLowerCase();
    if (next === qRef.current) return;
    const timer = setTimeout(() => goRef.current(next, 1), TIMINGS.searchDebounceMs);
    return () => clearTimeout(timer);
  }, [search]);

  const data = users.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[2rem] leading-tight font-semibold tracking-tight">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account details only. Saved links are never shown here.
        </p>
      </div>

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          aria-label="Search by email"
          placeholder="Search by email"
          value={search}
          maxLength={254}
          autoCapitalize="none"
          spellCheck={false}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-[15px] placeholder:text-muted-foreground"
        />
      </div>

      <p role="status" className="text-sm text-muted-foreground">
        {notice ||
          (data
            ? `${data.total.toLocaleString('en')} ${data.total === 1 ? 'account' : 'accounts'}${q ? ` matching “${q}”` : ''}`
            : users.isError
              ? ''
              : 'Loading accounts…')}
      </p>

      {users.isError ? (
        <div role="alert" className="rounded-xl border border-border px-5 py-8 text-center">
          <p className="text-[15px]">Could not load accounts.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => void users.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-input px-5 py-10 text-center">
          <p className="font-display text-lg font-semibold">No accounts match</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearch('');
              go('', 1);
            }}
          >
            Clear search
          </Button>
        </div>
      ) : data ? (
        <ul className="flex flex-col gap-2" aria-label="Accounts" aria-busy={users.isFetching}>
          {data.items.map((user) => {
            const isSelf = me.data?.id === user.id;
            return (
              <li
                key={user.id}
                data-testid="admin-user"
                className="grid gap-3 rounded-xl border border-border bg-card px-4 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 font-medium break-all">{user.email}</p>
                    {user.status === 'disabled' ? <Badge tone="strong">Disabled</Badge> : null}
                    {user.emailVerified ? null : <Badge tone="plain">Unverified</Badge>}
                  </div>
                  {user.name ? <p className="text-sm text-muted-foreground">{user.name}</p> : null}
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:flex sm:flex-wrap sm:gap-x-6">
                    {(
                      [
                        ['Joined', savedOn(user.createdAt)],
                        ['Last login', when(user.lastLoginAt)],
                        ['Last active', when(user.lastActiveAt)],
                        ['Links', user.resourceCount.toLocaleString('en')],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="flex flex-col">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="tabular-nums">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {isSelf ? (
                  <span className="text-sm text-muted-foreground sm:text-right">You</span>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`${user.status === 'active' ? 'Disable' : 'Enable'} ${user.email}`}
                    onClick={() => setChanging(user)}
                    className="justify-self-start sm:justify-self-end"
                  >
                    {user.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {data && pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => go(q, page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pages}
            onClick={() => go(q, page + 1)}
          >
            Next
          </Button>
        </nav>
      ) : null}

      <StatusDialog user={changing} onClose={() => setChanging(null)} onDone={setNotice} />
    </div>
  );
}
