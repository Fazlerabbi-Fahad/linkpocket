import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

// Clash Display and Satoshi (DESIGN DIRECTION), served by Fontshare (OQ-34).
const BRAND_FONTS =
  'https://api.fontshare.com/v2/css?f[]=clash-display@500,600&f[]=satoshi@400,500,700&display=swap';

export const metadata: Metadata = {
  title: { default: 'LinkPocket', template: '%s · LinkPocket' },
  description: 'A personal library for the links you want to keep.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Reading the nonce makes every page render per request, as the CSP needs (proxy.ts).
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    // next-themes sets the theme class on <html> before React hydrates.
    <html lang="en" className={mono.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="stylesheet" href={BRAND_FONTS} nonce={nonce} />
      </head>
      <body className="min-h-dvh">
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
