import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProtectedLibrary } from '@/components/library/library';

export const metadata: Metadata = { title: 'Your library' };

export default function LibraryPage() {
  return (
    <Suspense>
      <ProtectedLibrary />
    </Suspense>
  );
}
