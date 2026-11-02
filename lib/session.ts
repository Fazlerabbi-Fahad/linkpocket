'use client';

import type { CurrentUser } from '@/shared';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { ApiError, api } from './api';

export const ME_KEY = ['me'] as const;

/** The signed-in user, or null when there is no valid session (401). */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async (): Promise<CurrentUser | null> => {
      try {
        return (await api<{ user: CurrentUser }>('/auth/me')).user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
  });
}

/**
 * Stores the user a login or verification returned. A /auth/me request started before the
 * session existed would answer "signed out" and must not overwrite this, so it is cancelled.
 */
export async function storeMe(client: QueryClient, user: CurrentUser): Promise<void> {
  await client.cancelQueries({ queryKey: ME_KEY });
  client.setQueryData(ME_KEY, user);
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    queryClient.clear();
  }, [queryClient]);
}

/** The address waiting for verification, kept for the verify screen (never in the URL). */
const PENDING_EMAIL_KEY = 'lp:pending-email';

export function rememberPendingEmail(email: string): void {
  try {
    sessionStorage.setItem(PENDING_EMAIL_KEY, email);
  } catch {
    // Storage unavailable: the verify screen asks for the address instead.
  }
}

export function pendingEmail(): string {
  try {
    return sessionStorage.getItem(PENDING_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}
