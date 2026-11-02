'use client';

import { LogOut, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { RequireUser } from '@/components/require-user';
import { Button, buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/cn';
import { useLogout } from '@/lib/session';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
] as const;

/** FR-AD1: the admin area's own frame, shown only to verified admins. Not linked from the app. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RequireUser role="admin">{(user) => <Frame email={user.email}>{children}</Frame>}</RequireUser>
  );
}

function Frame({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link href="/admin" className="font-display text-xl font-semibold tracking-tight">
              LinkPocket<span className="logo-mark">.</span>
            </Link>
            <span className="rounded-md bg-violet px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-wide text-violet-foreground uppercase">
              Admin
            </span>
          </div>
          {/* With the Admin badge, the labels do not fit at 360 px; below sm they are for screen readers only. */}
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <span className="hidden truncate text-sm text-muted-foreground sm:block">{email}</span>
            <ThemeToggle />
            <Link href="/account" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              <UserRound aria-hidden />
              <span className="sr-only sm:not-sr-only">Account</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void logout().then(() => router.replace('/login'));
              }}
            >
              <LogOut aria-hidden />
              <span className="sr-only sm:not-sr-only">Log out</span>
            </Button>
          </div>
        </div>
        <nav aria-label="Admin" className="mx-auto flex max-w-5xl gap-1 px-2 sm:px-4">
          {NAV.map((item) => {
            const current = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  '-mb-px border-b-2 px-2.5 py-2.5 text-[15px] font-medium',
                  current
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-24 sm:px-6">{children}</main>
    </div>
  );
}
