import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

/**
 * ADR-0002: the browser only talks to the web origin. Requests to /api/v1/* are proxied to
 * the Express API, so the session cookie is first-party and SameSite=Lax applies cleanly.
 * API_INTERNAL_URL is server-only and never exposed to the client bundle.
 */
function apiInternalUrl(): string {
  const value = process.env.API_INTERNAL_URL;
  if (value) return value.replace(/\/+$/, '');
  // Deployed builds must be configured explicitly. `next typegen` also runs in the
  // production phase, so NODE_ENV alone cannot tell a deploy from a local type check.
  if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
    throw new Error('API_INTERNAL_URL must be set for deployed builds.');
  }
  return 'http://localhost:4000';
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@/shared'],
  rewrites() {
    return Promise.resolve([
      { source: '/api/v1/:path*', destination: `${apiInternalUrl()}/api/v1/:path*` },
    ]);
  },
};

/**
 * NFR-O2: Sentry with source maps. Uploading needs SENTRY_AUTH_TOKEN, SENTRY_ORG and
 * SENTRY_PROJECT at build time (Vercel); without them the build skips the upload. Maps are
 * deleted after upload so they are never served. Browser events go through /monitoring on
 * this origin, so the CSP needs no Sentry host.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  tunnelRoute: '/monitoring',
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
