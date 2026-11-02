'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/api';
import { ME_KEY } from '@/lib/session';

const SESSION_ENDED = new Set(['UNAUTHENTICATED', 'SESSION_EXPIRED', 'ACCOUNT_DISABLED']);

export function Providers({ children, nonce }: { children: ReactNode; nonce?: string }) {
  const [client] = useState(() => {
    // FR-A7, FR-A8: a session that expires mid-use sends the user to login (RequireUser
    // watches ME_KEY), keeping the page they were on.
    const onError = (error: unknown) => {
      // A wrong password on re-authentication (REAUTH_REQUIRED) is also 401 but keeps the session.
      if (error instanceof ApiError && SESSION_ENDED.has(error.code)) {
        queryClient.setQueryData(ME_KEY, null);
      }
    };
    const queryClient: QueryClient = new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          refetchOnWindowFocus: false,
          // Client errors (401, 403, 404, 429) will not fix themselves on retry.
          retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
        },
      },
    });
    return queryClient;
  });
  // DESIGN.md: light for first-time visitors whatever the OS says; the toggle's choice is kept
  // in localStorage. The nonce lets the inline theme script run under the CSP (proxy.ts).
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="lp:theme"
      disableTransitionOnChange
      nonce={nonce}
    >
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
