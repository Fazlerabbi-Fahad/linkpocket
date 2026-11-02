'use client';

import { useState } from 'react';
import { faviconUrl, initialOf } from '@/lib/links';

/**
 * DESIGN DIRECTION: the site's own favicon, requested with the hostname only and no referrer,
 * falling back to the domain's first letter.
 */
export function Favicon({ url }: { url: string }) {
  const src = faviconUrl(url);
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span
        aria-hidden
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-secondary font-mono text-[11px] font-semibold text-foreground"
      >
        {initialOf(url)}
      </span>
    );
  }
  return (
    // A plain img: a remote favicon needs no Next image optimizer.
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      // Many favicons are dark marks on transparency; a light tile keeps them visible in dark.
      className="size-5 shrink-0 rounded-[5px] dark:bg-foreground dark:p-px"
    />
  );
}
