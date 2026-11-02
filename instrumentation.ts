import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from './lib/sentry';

/** NFR-O2: server-side rendering and proxy errors, in both Next.js runtimes. */
export function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) Sentry.init(sentryOptions(dsn));
}

export const onRequestError = Sentry.captureRequestError;
