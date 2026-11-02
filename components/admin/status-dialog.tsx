'use client';

import type { AdminUserSummary } from '@/shared';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormAlert, InputField } from '@/components/ui/field';
import { isApiError } from '@/lib/api';
import { useSetUserStatus } from '@/lib/admin';

const MESSAGES: Record<string, string> = {
  REAUTH_REQUIRED: 'That password is not right. Enter the password you log in with.',
  ACCOUNT_LOCKED: 'Too many wrong passwords. Try again in 15 minutes.',
  FORBIDDEN: 'Admin accounts cannot be disabled here.',
  NOT_FOUND: 'This account no longer exists.',
  RATE_LIMITED: 'Too many changes in a short time. Wait a few minutes and try again.',
};

/** FR-AD6, FR-AD10: disabling or enabling asks for the admin's own password first. */
export function StatusDialog({
  user,
  onClose,
  onDone,
}: {
  user: AdminUserSummary | null;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  return (
    <Dialog
      open={user !== null}
      onOpenChange={(open) => !open && onClose()}
      title={user?.status === 'disabled' ? 'Enable this account?' : 'Disable this account?'}
      description={
        user
          ? user.status === 'disabled'
            ? `${user.email} will be able to log in again.`
            : `${user.email} is signed out everywhere and cannot log in until you enable the account again. Their links are kept.`
          : undefined
      }
    >
      {user ? <StatusForm key={user.id} user={user} onClose={onClose} onDone={onDone} /> : null}
    </Dialog>
  );
}

function StatusForm({
  user,
  onClose,
  onDone,
}: {
  user: AdminUserSummary;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const setStatus = useSetUserStatus();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const disabling = user.status === 'active';

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    setError('');
    try {
      await setStatus.mutateAsync({
        id: user.id,
        status: disabling ? 'disabled' : 'active',
        password,
      });
      onDone(disabling ? `Disabled ${user.email}` : `Enabled ${user.email}`);
      onClose();
    } catch (caught) {
      setPassword('');
      setError(
        isApiError(caught) && MESSAGES[caught.code]
          ? MESSAGES[caught.code]!
          : 'Could not change the account. Check your connection and try again.',
      );
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
      {error ? <FormAlert>{error}</FormAlert> : null}
      <InputField
        label="Your password"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant={disabling ? 'danger' : 'primary'}
          disabled={setStatus.isPending}
        >
          {setStatus.isPending ? 'Saving…' : disabling ? 'Disable account' : 'Enable account'}
        </Button>
      </div>
    </form>
  );
}
