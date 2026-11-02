import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from './lib/sentry';

// NFR-O2: browser errors go to Sentry through the same-origin tunnel (next.config.ts), so the
// CSP keeps connect-src 'self'. Without a DSN (local development) nothing is sent.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) Sentry.init(sentryOptions(dsn));
