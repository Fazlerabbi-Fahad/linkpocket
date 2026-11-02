import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';
import { QR_OPTIONS, qrDataUrl } from './qr';

function read(buffer: Buffer): string | undefined {
  const png = PNG.sync.read(buffer);
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data;
}

describe('QR codes (FR-C3, AC-7, NFR-PR2)', () => {
  it.each([
    'https://example.com/',
    'https://docs.example.com/guide?section=2&lang=en#install',
    'https://xn--r8jz45g.jp/%E3%83%91%E3%82%B9?q=%E6%97%A5%E6%9C%AC',
    `https://example.com/${'a'.repeat(1500)}`,
  ])('decodes to exactly the saved URL: %s', async (url) => {
    const buffer = await QRCode.toBuffer(url, { ...QR_OPTIONS, type: 'png' });
    expect(read(buffer)).toBe(url);
  });

  it('produces the PNG data URL that is shown and downloaded', async () => {
    const url = 'https://example.com/a?b=c';
    const src = await qrDataUrl(url);
    expect(src.startsWith('data:image/png;base64,')).toBe(true);
    const buffer = Buffer.from(src.slice(src.indexOf(',') + 1), 'base64');
    expect(PNG.sync.read(buffer).width).toBe(QR_OPTIONS.width);
    expect(read(buffer)).toBe(url);
  });
});
