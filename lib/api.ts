import { API_PREFIX, type FieldError } from '@/shared';

/** Readable by scripts by design: the double-submit CSRF token (NFR-S10, ADR-0004). */
const CSRF_COOKIE = '__Host-lp_csrf';
const CSRF_HEADER = 'X-CSRF-Token';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function readCsrfCookie(): string | null {
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${CSRF_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(CSRF_COOKIE.length + 1)) : null;
}

async function refreshCsrf(): Promise<void> {
  await fetch(`${API_PREFIX}/auth/csrf`, { credentials: 'same-origin', cache: 'no-store' });
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface ErrorEnvelope {
  error?: { code?: string; message?: string; fields?: FieldError[] };
}

/**
 * Same-origin calls to the API through the Next.js rewrite (ADR-0002). Adds the CSRF header
 * to state-changing requests, fetching a token first if needed, and retries once when the
 * token is stale (for example after the session changed).
 */
export async function api<T>(
  path: string,
  options: { method?: Method; body?: unknown } = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (method !== 'GET') {
      if (!readCsrfCookie()) await refreshCsrf();
      headers[CSRF_HEADER] = readCsrfCookie() ?? '';
    }
    return fetch(`${API_PREFIX}${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  };

  let res = await send();
  if (res.status === 403 && method !== 'GET') {
    const peek = (await res
      .clone()
      .json()
      .catch(() => null)) as ErrorEnvelope | null;
    if (peek?.error?.code === 'CSRF_INVALID') {
      await refreshCsrf();
      res = await send();
    }
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const error = (data as ErrorEnvelope | null)?.error;
    throw new ApiError(
      res.status,
      error?.code ?? 'INTERNAL',
      error?.message ?? 'Something went wrong. Try again.',
      error?.fields ?? [],
    );
  }
  return data as T;
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}
