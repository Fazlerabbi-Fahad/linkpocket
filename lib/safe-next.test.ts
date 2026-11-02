import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DESTINATION, rememberNext, safeNext, takeNext } from './safe-next';

function memoryStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
  return store;
}

describe('safeNext (FR-A7)', () => {
  it.each(['/library', '/library?q=css&tag=web', '/library#top'])('keeps %s', (value) => {
    expect(safeNext(value)).toBe(value);
  });

  it.each([
    null,
    '',
    'library',
    'https://evil.example/library',
    '//evil.example',
    '/\\evil.example',
    '/library\u0000',
    '/\tevil',
    '/login',
    '/signup?next=/library',
    '/verify-email',
  ])('falls back to the library for %j', (value) => {
    expect(safeNext(value)).toBe(DEFAULT_DESTINATION);
  });
});

describe('rememberNext and takeNext', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('round-trips a safe destination once', () => {
    memoryStorage();
    rememberNext('/library?tag=css');
    expect(takeNext()).toBe('/library?tag=css');
    expect(takeNext()).toBe(DEFAULT_DESTINATION);
  });

  it('stores only safe values', () => {
    const store = memoryStorage();
    rememberNext('https://evil.example');
    expect([...store.values()]).toEqual([DEFAULT_DESTINATION]);
  });

  it('falls back when storage is unavailable', () => {
    const blocked = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked, removeItem: blocked });
    expect(() => rememberNext('/library')).not.toThrow();
    expect(takeNext()).toBe(DEFAULT_DESTINATION);
  });
});
