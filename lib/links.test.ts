import { describe, expect, it } from 'vitest';
import { displayDomain, faviconUrl, initialOf, qrFileName, savedOn } from './links';

describe('faviconUrl (DESIGN DIRECTION, NFR-PR2)', () => {
  it('uses the hostname only, never the path, query or fragment', () => {
    expect(faviconUrl('https://docs.example.com/private/page?token=abc#x')).toBe(
      'https://docs.example.com/favicon.ico',
    );
  });

  it('always asks over https', () => {
    expect(faviconUrl('http://example.com/a')).toBe('https://example.com/favicon.ico');
  });

  it.each(['http://localhost:3000/', 'http://192.168.1.10/', 'http://[::1]/', 'not a url'])(
    'skips %s',
    (url) => {
      expect(faviconUrl(url)).toBeNull();
    },
  );
});

describe('card helpers (FR-R5, FR-C4)', () => {
  it('shows the domain without www', () => {
    expect(displayDomain('https://www.example.com/a')).toBe('example.com');
  });

  it('takes the first letter or digit as the fallback initial', () => {
    expect(initialOf('https://www.github.com')).toBe('G');
    expect(initialOf('https://9gag.com')).toBe('9');
  });

  it('formats the saved date', () => {
    expect(savedOn('2026-03-05T12:00:00.000Z')).toBe('Mar 5, 2026');
  });

  it('names the QR download after the domain', () => {
    expect(qrFileName('https://www.example.com/a?b')).toBe('linkpocket-qr-example.com.png');
  });
});
