import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Wordmark } from '@/components/wordmark';

const SAMPLE = [
  { domain: 'developer.mozilla.org', title: 'Content Security Policy (CSP)', pinned: true },
  { domain: 'www.smashingmagazine.com', title: 'Designing better error messages', pinned: false },
  { domain: 'github.com', title: 'A tiny QR code library', pinned: false },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 sm:px-8">
      <header className="flex h-16 items-center justify-between">
        <Wordmark />
        <nav className="flex items-center gap-1">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Log in
          </Link>
          <Link href="/signup" className={buttonVariants({ size: 'sm' })}>
            Create account
          </Link>
        </nav>
      </header>
      <main className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.15fr_1fr]">
        <section>
          <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] leading-[0.96] font-semibold tracking-[-0.025em]">
            Keep the links
            <br />
            worth keeping.
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Paste a link, add a note and a few tags, and it waits for you. Pin what matters, search
            everything, share any link as a QR code.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className={buttonVariants()}>
              Start your pocket
            </Link>
            <Link href="/login" className={buttonVariants({ variant: 'secondary' })}>
              I have an account
            </Link>
          </div>
        </section>
        <section aria-label="Example library" className="flex flex-col gap-3">
          <div className="flex h-12 items-center rounded-xl border border-input bg-card px-4 font-mono text-sm text-muted-foreground">
            https://
            <span className="ml-0.5 inline-block h-5 w-px bg-primary" aria-hidden />
          </div>
          {SAMPLE.map((item) => (
            <article
              key={item.domain}
              className={`rounded-xl border border-border bg-card p-4 shadow-card ${item.pinned ? 'pinned-edge' : ''}`}
            >
              <p className="font-mono text-xs text-muted-foreground">{item.domain}</p>
              <p className="mt-1.5 font-medium">{item.title}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
