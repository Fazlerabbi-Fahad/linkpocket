import type { Metadata } from 'next';
import { Wordmark } from '@/components/wordmark';

export const metadata: Metadata = { title: 'Privacy notice' };

/**
 * NFR-PR4, NFR-PR5. Draft wording: the product owner must approve the final text and fill in
 * the Atlas region and contact address before launch (manual, see TRACEABILITY).
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <Wordmark />
      <main className="mt-10 flex flex-col gap-5 text-[16px] leading-7">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Privacy notice</h1>
        <p className="text-muted-foreground">Draft. Awaiting product owner approval.</p>
        <h2 className="font-display text-xl font-semibold">What we store</h2>
        <p>
          Your email address, an optional name, a one-way hash of your password, the time you
          accepted this notice, sign-in times, and the links you save with their titles, notes and
          tags. Nothing else.
        </p>
        <h2 className="font-display text-xl font-semibold">Where it lives</h2>
        <p>
          In a MongoDB Atlas database in the [region to be confirmed] region. Backups are kept for
          35 days.
        </p>
        <h2 className="font-display text-xl font-semibold">Your choices</h2>
        <p>
          You can download everything as a JSON file and delete your account at any time. Unverified
          accounts are deleted after 7 days.
        </p>
        <h2 className="font-display text-xl font-semibold">Icons and fonts</h2>
        <p>
          To show a site icon, your browser asks that site for its icon using only the domain name,
          never the full link. Fonts are loaded from Fontshare.
        </p>
      </main>
    </div>
  );
}
