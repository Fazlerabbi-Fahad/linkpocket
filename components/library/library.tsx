'use client';

import { TIMINGS, tagSchema, type CurrentUser, type ResourceDto } from '@/shared';
import { LogOut, Pin, Search, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { RequireUser } from '@/components/require-user';
import { Wordmark } from '@/components/wordmark';
import { cn } from '@/lib/cn';
import { useLibrary, useTogglePin, type LibraryFilters } from '@/lib/resources';
import { useLogout } from '@/lib/session';
import { CopyFallbackDialog } from './copy-fallback-dialog';
import { DeleteDialog } from './delete-dialog';
import { EditDialog } from './edit-dialog';
import { QrDialog } from './qr-dialog';
import { ResourceCard, type CardActions } from './resource-card';
import { SaveSlot } from './save-slot';

/** FR-L2 to FR-L4: filters live in the address, so a filtered view can be bookmarked. */
function useFilters(): [LibraryFilters, (next: LibraryFilters) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.toString();
  const filters = useMemo<LibraryFilters>(() => {
    const read = new URLSearchParams(raw);
    const tags = [
      ...new Set(
        read.getAll('tag').flatMap((value) => {
          const parsed = tagSchema.safeParse(value);
          return parsed.success ? [parsed.data] : [];
        }),
      ),
    ];
    return { q: (read.get('q') ?? '').trim(), tags, pinned: read.get('pinned') === 'true' };
  }, [raw]);
  const setFilters = useCallback(
    (next: LibraryFilters) => {
      const write = new URLSearchParams();
      if (next.q) write.set('q', next.q);
      for (const tag of next.tags) write.append('tag', tag);
      if (next.pinned) write.set('pinned', 'true');
      const query = write.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    },
    [pathname, router],
  );
  return [filters, setFilters];
}

/** FR-C2: "Link copied" is shown and announced for two seconds. */
function useNotice() {
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), TIMINGS.copyFeedbackMs);
    return () => clearTimeout(timer);
  }, [notice]);
  const show = useCallback((text: string) => setNotice({ id: Date.now(), text }), []);
  return [notice, show] as const;
}

/** The /library screen behind the sign-in guard (FR-A7). */
export function ProtectedLibrary() {
  return <RequireUser>{(user) => <Library user={user} />}</RequireUser>;
}

export function Library({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const logout = useLogout();
  const [filters, setFilters] = useFilters();
  const [notice, notify] = useNotice();
  const [search, setSearch] = useState(filters.q);
  const [qrFor, setQrFor] = useState<ResourceDto | null>(null);
  const [editing, setEditing] = useState<ResourceDto | null>(null);
  const [deleting, setDeleting] = useState<ResourceDto | null>(null);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const library = useLibrary(filters);
  const pin = useTogglePin();
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // FR-L2: search runs 300 ms after the last keystroke.
  useEffect(() => {
    const q = search.trim();
    if (q === filtersRef.current.q) return;
    const timer = setTimeout(
      () => setFilters({ ...filtersRef.current, q }),
      TIMINGS.searchDebounceMs,
    );
    return () => clearTimeout(timer);
  }, [search, setFilters]);

  // Back and forward navigation change the address; keep the box in step.
  useEffect(() => {
    setSearch((current) => (current.trim() === filters.q ? current : filters.q));
  }, [filters.q]);

  const actions = useMemo<CardActions>(
    () => ({
      // NFR-A3: a failed toggle is rolled back and said out loud, never dropped silently.
      onPin: (resource) =>
        pin.mutate(
          { id: resource.id, isPinned: !resource.isPinned },
          { onError: () => notify('Could not change the pin. Try again.') },
        ),
      onCopy: (resource) => {
        if (!navigator.clipboard?.writeText) {
          setCopyFallback(resource.url);
          return;
        }
        navigator.clipboard.writeText(resource.url).then(
          () => notify('Link copied'),
          () => setCopyFallback(resource.url),
        );
      },
      onQr: setQrFor,
      onEdit: setEditing,
      onDelete: setDeleting,
      onTag: (tag) => {
        const current = filtersRef.current;
        if (!current.tags.includes(tag)) setFilters({ ...current, tags: [...current.tags, tag] });
      },
    }),
    [pin, notify, setFilters],
  );

  const items = library.data?.pages.flatMap((page) => page.items) ?? [];
  const filtered = filters.q !== '' || filters.tags.length > 0 || filters.pinned;
  const clearFilters = () => {
    setSearch('');
    setFilters({ q: '', tags: [], pinned: false });
  };

  async function signOut() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Wordmark href="/library" />
          <div className="flex min-w-0 items-center gap-1">
            <span className="hidden truncate text-sm text-muted-foreground sm:block">
              {user.email}
            </span>
            <ThemeToggle />
            <Link href="/account" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              <UserRound aria-hidden />
              Account
            </Link>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              <LogOut aria-hidden />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-6">
        <h1 className="font-display text-[2rem] leading-tight font-semibold tracking-tight">
          Your library
        </h1>
        <div className="mt-6">
          <SaveSlot onSaved={notify} />
        </div>

        <section aria-label="Find links" className="mt-10 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                aria-label="Search titles, notes and links"
                placeholder="Search"
                value={search}
                maxLength={200}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-[15px] placeholder:text-muted-foreground focus-visible:border-ring"
              />
            </div>
            <Button
              variant="secondary"
              aria-pressed={filters.pinned}
              onClick={() => setFilters({ ...filters, pinned: !filters.pinned })}
              className={cn(
                filters.pinned &&
                  'border-violet bg-violet text-violet-foreground hover:bg-violet/90',
              )}
            >
              <Pin aria-hidden />
              <span>Pinned</span>
            </Button>
          </div>
          {filters.tags.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-1.5" aria-label="Active tag filters">
              {filters.tags.map((tag) => (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        tags: filters.tags.filter((value) => value !== tag),
                      })
                    }
                    aria-label={`Remove tag filter ${tag}`}
                    className="inline-flex h-8 items-center gap-1 rounded-md bg-violet pr-1.5 pl-2.5 font-mono text-xs text-violet-foreground hover:bg-violet/90"
                  >
                    #{tag}
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section aria-label="Saved links" aria-busy={library.isFetching} className="mt-5">
          {library.isPending ? (
            <p role="status" className="py-10 text-center text-[15px] text-muted-foreground">
              Loading your links…
            </p>
          ) : library.isError ? (
            <div role="alert" className="rounded-xl border border-border px-5 py-8 text-center">
              <p className="text-[15px]">Could not load your links.</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => void library.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            filtered ? (
              <div className="rounded-xl border border-dashed border-input px-5 py-10 text-center">
                <p className="font-display text-lg font-semibold">No links match</p>
                <p className="mt-1 text-[15px] text-muted-foreground">
                  Try another word, or remove a tag or the pinned filter.
                </p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-input px-5 py-10 text-center">
                <p className="font-display text-lg font-semibold">Nothing saved yet</p>
                <p className="mx-auto mt-1 max-w-xs text-[15px] text-muted-foreground">
                  Paste a link into the box above and press Save. It will wait here for you.
                </p>
              </div>
            )
          ) : (
            <>
              <ol className="flex flex-col gap-3">
                {items.map((resource) => (
                  <li key={resource.id} className="rise">
                    <ResourceCard resource={resource} actions={actions} />
                  </li>
                ))}
              </ol>
              {library.hasNextPage ? (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="secondary"
                    className="border-indigo-soft-foreground/30 bg-indigo-soft text-indigo-soft-foreground hover:bg-indigo-soft"
                    disabled={library.isFetchingNextPage}
                    onClick={() => void library.fetchNextPage()}
                  >
                    {library.isFetchingNextPage ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
        <p
          role="status"
          aria-live="polite"
          className={cn(
            'rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-dialog',
            !notice && 'sr-only',
          )}
        >
          {notice?.text ?? ''}
        </p>
      </div>

      <QrDialog resource={qrFor} onOpenChange={(open) => !open && setQrFor(null)} />
      <EditDialog resource={editing} onClose={() => setEditing(null)} onSaved={notify} />
      <DeleteDialog resource={deleting} onClose={() => setDeleting(null)} onDeleted={notify} />
      <CopyFallbackDialog url={copyFallback} onClose={() => setCopyFallback(null)} />
    </div>
  );
}
