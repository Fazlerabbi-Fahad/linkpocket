import type { ReactNode } from 'react';
import { ThemeToggle } from './theme-toggle';
import { Wordmark } from './wordmark';

/** Shared frame for the signed-out pages: a statement on the left, the task on the right. */
export function AuthShell({
  title,
  lede,
  children,
  footer,
}: {
  title: string;
  lede?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-dvh max-w-6xl grid-rows-[auto_1fr] px-4 sm:px-8">
      <header className="flex h-16 items-center justify-between">
        <Wordmark />
        <ThemeToggle />
      </header>
      <main className="grid items-start gap-10 pt-6 pb-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:pt-0">
        <section aria-hidden className="hidden lg:block">
          <p className="font-display text-[clamp(2.75rem,5vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.02em]">
            Keep the links
            <br />
            worth keeping.
          </p>
          <p className="mt-6 max-w-sm text-lg text-muted-foreground">
            Save a link once. Pin it, tag it, find it again, hand it over as a QR code.
          </p>
          <div className="mt-10 h-0.5 w-40 rounded-full bg-violet" />
        </section>
        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
            <h1 className="font-display text-[1.75rem] leading-tight font-semibold tracking-tight">
              {title}
            </h1>
            {lede ? <div className="mt-2 text-[15px] text-muted-foreground">{lede}</div> : null}
            <div className="mt-6">{children}</div>
          </div>
          {footer ? (
            <div className="mt-5 text-center text-[15px] text-muted-foreground">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
