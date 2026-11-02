import QRCode from 'qrcode';

/**
 * FR-C3, NFR-PR2: the QR code encodes the original URL and nothing else. Dark modules on a
 * white quiet zone keep it scannable in both themes.
 */
export const QR_OPTIONS = {
  errorCorrectionLevel: 'M',
  margin: 2,
  width: 512,
  // Raster colours cannot read CSS variables; they match --qr-ink and --qr-paper in globals.css.
  color: { dark: '#0F172A', light: '#FFFFFF' },
} as const;

export function qrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, QR_OPTIONS);
}
