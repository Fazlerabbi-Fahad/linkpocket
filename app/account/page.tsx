import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProtectedAccount } from '@/components/account/account-settings';

export const metadata: Metadata = { title: 'Account' };

export default function AccountPage() {
  return (
    <Suspense>
      <ProtectedAccount />
    </Suspense>
  );
}
