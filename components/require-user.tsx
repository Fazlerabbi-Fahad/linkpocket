'use client';

import type { CurrentUser } from '@/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { DEFAULT_DESTINATION, rememberNext } from '@/lib/safe-next';
import { rememberPendingEmail, useMe } from '@/lib/session';

/**
 * FR-A7, FR-A3: signed-out visitors go to login with the page they wanted; unverified users
 * go to the verify screen. proxy.ts catches the no-cookie case before render; this catches
 * expired, revoked and unverified sessions. With `role="admin"`, everyone else is sent to
 * their library (FR-AD1, AC-10). This is convenience only: the API checks every request
 * (FR-AD2).
 */
export function RequireUser({
  children,
  role,
}: {
  children: (user: CurrentUser) => ReactNode;
  role?: 'admin';
}) {
  const me = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const destination = `${pathname}${search ? `?${search}` : ''}`;
  const allowed = !!me.data && me.data.emailVerified && (!role || me.data.role === role);

  useEffect(() => {
    if (me.isPending || me.isError) return;
    if (me.data === null) {
      router.replace(`/login?next=${encodeURIComponent(destination)}`);
    } else if (!me.data.emailVerified) {
      rememberPendingEmail(me.data.email);
      rememberNext(destination);
      router.replace('/verify-email');
    } else if (role && me.data.role !== role) {
      router.replace(DEFAULT_DESTINATION);
    }
  }, [me.isPending, me.isError, me.data, router, destination, role]);

  if (me.isError) {
    return (
      <p role="alert" className="mx-auto max-w-md px-4 py-24 text-center text-[15px]">
        Could not reach LinkPocket. Check your connection and reload the page.
      </p>
    );
  }
  if (!allowed || !me.data) {
    return (
      <p role="status" className="sr-only">
        Loading
      </p>
    );
  }
  return children(me.data);
}
