'use client';

import type { ResourceDto } from '@/shared';
import { Copy, ExternalLink, Pencil, Pin, QrCode, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { displayDomain, savedOn } from '@/lib/links';
import { Favicon } from './favicon';

export interface CardActions {
  onPin: (resource: ResourceDto) => void;
  onCopy: (resource: ResourceDto) => void;
  onQr: (resource: ResourceDto) => void;
  onEdit: (resource: ResourceDto) => void;
  onDelete: (resource: ResourceDto) => void;
  onTag: (tag: string) => void;
}

const iconButton = 'text-muted-foreground hover:text-foreground';

/** FR-R5: one saved link. Pinned cards carry a violet left edge (FR-C1, DESIGN.md). */
export function ResourceCard({
  resource,
  actions,
}: { resource: ResourceDto } & { actions: CardActions }) {
  const domain = displayDomain(resource.url);
  return (
    <article
      aria-label={resource.title}
      data-testid="resource-card"
      className={cn(
        'rounded-xl border border-border bg-card px-4 pt-3.5 pb-2 shadow-card transition-colors hover:border-indigo-soft-foreground/40 sm:px-5',
        resource.isPinned && 'pinned-edge',
      )}
    >
      <div className="flex items-center gap-2.5">
        <Favicon url={resource.url} />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
          {domain}
        </span>
        {resource.isPinned ? (
          <span className="font-mono text-[11px] font-medium tracking-wide text-violet-soft-foreground uppercase">
            Pinned
          </span>
        ) : null}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-pressed={resource.isPinned}
          aria-label={resource.isPinned ? `Unpin ${resource.title}` : `Pin ${resource.title}`}
          onClick={() => actions.onPin(resource)}
          className={cn('-mr-2', resource.isPinned ? 'text-violet hover:text-violet' : iconButton)}
        >
          <Pin aria-hidden fill={resource.isPinned ? 'currentColor' : 'none'} />
        </Button>
      </div>

      <h2 className="mt-1.5 text-[17px] leading-snug font-medium break-words">{resource.title}</h2>
      {resource.note ? (
        <p className="mt-1 line-clamp-3 text-[15px] leading-6 break-words whitespace-pre-line text-muted-foreground">
          {resource.note}
        </p>
      ) : null}
      {resource.tags.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Tags">
          {resource.tags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => actions.onTag(tag)}
                aria-label={`Show links tagged ${tag}`}
                className="inline-flex h-7 items-center rounded-md bg-secondary px-2 font-mono text-xs text-secondary-foreground hover:bg-accent dark:bg-background dark:hover:bg-accent"
              >
                #{tag}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2">
        <p className="text-xs text-muted-foreground">
          <time dateTime={resource.createdAt}>Saved {savedOn(resource.createdAt)}</time>
        </p>
        <div className="-mr-2 flex items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            className={iconButton}
            aria-label={`Copy link to ${resource.title}`}
            onClick={() => actions.onCopy(resource)}
          >
            <Copy aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className={iconButton}
            aria-label={`Show QR code for ${resource.title}`}
            onClick={() => actions.onQr(resource)}
          >
            <QrCode aria-hidden />
          </Button>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${resource.title} in a new tab`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), iconButton)}
          >
            <ExternalLink aria-hidden />
          </a>
          <Button
            variant="ghost"
            size="icon-sm"
            className={iconButton}
            aria-label={`Edit ${resource.title}`}
            onClick={() => actions.onEdit(resource)}
          >
            <Pencil aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(iconButton, 'hover:text-destructive')}
            aria-label={`Delete ${resource.title}`}
            onClick={() => actions.onDelete(resource)}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  );
}
