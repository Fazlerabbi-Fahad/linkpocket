import { hostnameOf } from '@/shared';

/**
 * DESIGN DIRECTION: the favicon comes straight from the link's own domain. Only the hostname
 * is used, so the path, query and fragment of a saved URL never leave the browser.
 */
export function faviconUrl(url: string): string | null {
  const host = hostnameOf(url);
  if (!host || host === 'localhost' || host.startsWith('[') || /^\d+(\.\d+){3}$/.test(host)) {
    return null;
  }
  return `https://${host}/favicon.ico`;
}

/** The letter shown when a favicon is missing. */
export function initialOf(url: string): string {
  const host = hostnameOf(url).replace(/^www\./, '');
  return (host.match(/[a-z0-9]/i)?.[0] ?? '?').toUpperCase();
}

/** The domain shown on a card (FR-R5). */
export function displayDomain(url: string): string {
  return hostnameOf(url).replace(/^www\./, '');
}

const dateFormat = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function savedOn(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/** File name for the QR download (FR-C4). */
export function qrFileName(url: string): string {
  const host = displayDomain(url).replace(/[^a-z0-9.-]/gi, '') || 'link';
  return `linkpocket-qr-${host}.png`;
}
