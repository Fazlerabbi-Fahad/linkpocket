'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/wordmark';
import './globals.css';

/**
 * Last-resort boundary when the root layout itself fails. Reports the error (NFR-O2) and
 * offers a retry; the error's message is never shown, only its digest for support.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh">
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-8">
          <Wordmark />
          <h1 className="mt-12 font-display text-[1.75rem] leading-tight font-semibold tracking-tight">
            LinkPocket couldn’t load this page
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your saved links are safe. Try again, and if it keeps happening, reload the page.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-sm text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
          <Button className="mt-8" onClick={reset}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
