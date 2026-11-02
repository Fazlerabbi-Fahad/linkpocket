import { expect, test } from '@playwright/test';
import { signUpVerified } from './helpers';

test('NFR-S11: every page gets a nonce CSP and hardening headers', async ({ page }) => {
  const nonces = new Set<string>();
  for (const path of ['/', '/login', '/library']) {
    const res = await page.goto(path);
    const headers = res?.headers() ?? {};
    const csp = headers['content-security-policy'] ?? '';
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce, path).toBeTruthy();
    nonces.add(nonce ?? '');
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toMatch(/connect-src 'self'(;| ws:;)/);
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  }
  // A fresh nonce per response.
  expect(nonces.size).toBe(3);
});

test('NFR-S2: the session lives only in an httpOnly cookie, never in web storage', async ({
  page,
  context,
}) => {
  await signUpVerified(page, 'storage');
  const cookies = await context.cookies();
  const session = cookies.find((cookie) => cookie.name === '__Host-lp_session');
  expect(session).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Lax', path: '/' });

  const visible = await page.evaluate(() => ({
    cookie: document.cookie,
    local: JSON.stringify({ ...localStorage }),
    session: JSON.stringify({ ...sessionStorage }),
  }));
  expect(visible.cookie).not.toContain('__Host-lp_session');
  const token = session?.value ?? '';
  expect(token.length).toBeGreaterThan(20);
  expect(visible.local).not.toContain(token);
  expect(visible.session).not.toContain(token);
  expect(visible.local + visible.session).not.toMatch(/eyJ[A-Za-z0-9_-]+\./); // no JWTs
});
