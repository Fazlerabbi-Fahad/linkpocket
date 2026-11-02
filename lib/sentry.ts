import { scrubErrorEvent } from '@/shared';

/**
 * NFR-O2 with NFR-B6: errors only (no tracing, replay or breadcrumbs), and every event leaves
 * without cookies, headers, bodies, query strings, user details, URLs or emails. Shared by the
 * browser (instrumentation-client.ts) and server (instrumentation.ts) setups.
 */
export function sentryOptions(dsn: string) {
  return {
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? 'local',
    tracesSampleRate: 0,
    maxBreadcrumbs: 0,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    beforeSend: scrubErrorEvent,
  };
}
