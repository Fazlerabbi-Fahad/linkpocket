import { WEB_ORIGIN } from '../playwright.config';

/**
 * `next dev` compiles each route on its first request. With several workers starting at
 * once, a cold compile can outlast an assertion's timeout, so every page is compiled here
 * before the first test runs.
 */
const ROUTES = [
  '/',
  '/signup',
  '/login',
  '/verify-email',
  '/library',
  '/account',
  '/admin',
  '/admin/users',
  '/privacy',
];

/**
 * proxy.ts sends requests without a session cookie to /login before the page compiles, so the
 * warm-up carries a placeholder. Only its presence is checked there; the API never sees it.
 */
const PLACEHOLDER_SESSION = '__Host-lp_session=warm-up';

export default async function globalSetup(): Promise<void> {
  for (const route of ROUTES) {
    const response = await fetch(`${WEB_ORIGIN}${route}`, {
      redirect: 'manual',
      headers: { cookie: PLACEHOLDER_SESSION },
    });
    if (response.status !== 200) throw new Error(`warm-up of ${route} answered ${response.status}`);
  }
}
