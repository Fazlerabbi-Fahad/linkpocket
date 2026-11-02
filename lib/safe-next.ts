export const DEFAULT_DESTINATION = '/library';

/**
 * FR-A7: the page to return to after login. Only same-site paths are accepted, so a crafted
 * `?next=https://evil.example` or `//evil.example` cannot turn login into an open redirect.
 */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return DEFAULT_DESTINATION;
  }
  // Control characters and backslashes are never part of our own URLs.
  // eslint-disable-next-line no-control-regex -- rejecting control characters is the point
  if (/[\u0000-\u001f\\]/.test(value)) return DEFAULT_DESTINATION;
  try {
    const url = new URL(value, 'https://linkpocket.invalid');
    if (url.origin !== 'https://linkpocket.invalid') return DEFAULT_DESTINATION;
    if (['/login', '/signup', '/verify-email'].includes(url.pathname)) return DEFAULT_DESTINATION;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_DESTINATION;
  }
}

/** Where to go after login, remembered across the verify-email detour (sessionStorage). */
const NEXT_KEY = 'lp:next';

export function rememberNext(next: string): void {
  try {
    sessionStorage.setItem(NEXT_KEY, safeNext(next));
  } catch {
    // Storage unavailable (private mode): fall back to the default destination.
  }
}

export function takeNext(): string {
  try {
    const value = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    return safeNext(value);
  } catch {
    return DEFAULT_DESTINATION;
  }
}
