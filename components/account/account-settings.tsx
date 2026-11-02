'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { USER_LIMITS, changePasswordSchema, deleteAccountSchema, type CurrentUser } from '@/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useForm, type FieldError } from 'react-hook-form';
import type { z } from 'zod';
import { RequireUser } from '@/components/require-user';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormAlert, InputField } from '@/components/ui/field';
import { Wordmark } from '@/components/wordmark';
import { accountErrorMessage, changePassword, deleteAccount, downloadExport } from '@/lib/account';
import { storeMe, useLogout } from '@/lib/session';

/** The /account screen behind the sign-in guard (FR-A3: verified users only). */
export function ProtectedAccount() {
  return <RequireUser>{(user) => <AccountSettings user={user} />}</RequireUser>;
}

export function AccountSettings({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const logout = useLogout();
  const home = user.role === 'admin' ? '/admin' : '/library';

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Wordmark href={home} />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void logout().then(() => router.replace('/login'));
              }}
            >
              <LogOut aria-hidden />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 pb-24 sm:px-6">
        <Link
          href={home}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {user.role === 'admin' ? 'Back to admin' : 'Back to your library'}
        </Link>
        <h1 className="mt-4 font-display text-[2rem] leading-tight font-semibold tracking-tight">
          Account
        </h1>
        <p className="mt-1 font-mono text-sm break-all text-muted-foreground">{user.email}</p>

        <div className="mt-8 flex flex-col">
          <Section title="Password" description="Changing it logs you out on every other device.">
            <PasswordForm email={user.email} />
          </Section>
          <Section
            title="Your data"
            description="A JSON file with your account details and every saved link, tags and notes included."
          >
            <ExportButton />
          </Section>
          <Section
            title="Delete account"
            description="Removes your account and all your saved links straight away. This cannot be undone."
          >
            <DeleteAccount email={user.email} />
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const id = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <section
      aria-labelledby={id}
      className="grid gap-4 border-t border-border py-8 sm:grid-cols-[13rem_1fr] sm:gap-8"
    >
      <div>
        <h2 id={id} className="font-display text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** A server message is shown as is; a schema failure on a password just asks for it. */
function fieldError(error: FieldError | undefined, empty: string): string | undefined {
  if (!error) return undefined;
  return error.type === 'server' ? error.message : empty;
}

type PasswordInput = z.input<typeof changePasswordSchema>;

/** Change password: other sessions are revoked by the API (AC-16); this one is reissued. */
function PasswordForm({ email }: { email: string }) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null);
    try {
      const { user } = await changePassword(values);
      await storeMe(queryClient, user);
      reset();
      setNotice({ tone: 'info', text: 'Password changed. Your other devices are logged out.' });
    } catch (error) {
      const result = accountErrorMessage(
        error,
        'Could not change the password. Check your connection and try again.',
      );
      if (result.field === 'current') {
        setError('currentPassword', { type: 'server', message: result.message });
      } else if (result.field === 'new') {
        setError('newPassword', { message: result.message });
      } else {
        setNotice({ tone: 'error', text: result.message });
      }
    }
  });

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
      {/* Lets password managers file the new password under the right account. */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      {notice ? <FormAlert tone={notice.tone}>{notice.text}</FormAlert> : null}
      <InputField
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={fieldError(errors.currentPassword, 'Enter your current password.')}
        {...register('currentPassword')}
      />
      <InputField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint={`${USER_LIMITS.passwordMin} to ${USER_LIMITS.passwordMax} characters.`}
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Changing…' : 'Change password'}
        </Button>
      </div>
    </form>
  );
}

/** FR-D1, AC-17. */
function ExportButton() {
  const [state, setState] = useState<
    | { kind: 'idle' }
    | { kind: 'busy' }
    | { kind: 'done'; name: string }
    | { kind: 'error'; text: string }
  >({ kind: 'idle' });

  async function run() {
    setState({ kind: 'busy' });
    try {
      setState({ kind: 'done', name: await downloadExport() });
    } catch (error) {
      setState({
        kind: 'error',
        text: accountErrorMessage(error, 'Could not prepare the export. Try again.').message,
      });
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="secondary" disabled={state.kind === 'busy'} onClick={() => void run()}>
        <Download aria-hidden />
        {state.kind === 'busy' ? 'Preparing…' : 'Download export'}
      </Button>
      {state.kind === 'done' ? (
        <FormAlert tone="info">
          Saved as <span className="font-mono break-all">{state.name}</span>
        </FormAlert>
      ) : null}
      {state.kind === 'error' ? <FormAlert>{state.text}</FormAlert> : null}
    </div>
  );
}

type DeleteInput = z.input<typeof deleteAccountSchema>;

/** FR-D2, AC-18: the password is asked for again before anything is removed. */
function DeleteAccount({ email }: { email: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DeleteInput>({ resolver: zodResolver(deleteAccountSchema) });

  const close = () => {
    setOpen(false);
    setFormError(null);
    reset();
  };

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    try {
      await deleteAccount(password);
      queryClient.clear();
      router.replace('/login?deleted=1');
    } catch (error) {
      const result = accountErrorMessage(
        error,
        'Could not delete the account. Check your connection and try again.',
      );
      if (result.field === 'current')
        setError('password', { type: 'server', message: result.message });
      else setFormError(result.message);
    }
  });

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
        title="Delete your account?"
        description="Your account and every saved link are removed for good. Download an export first if you want a copy."
      >
        <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
          <input type="email" autoComplete="username" value={email} readOnly hidden />
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <InputField
            label="Password"
            type="password"
            autoComplete="current-password"
            hint="Enter your password to confirm."
            error={fieldError(errors.password, 'Enter your password.')}
            {...register('password')}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={close}>
              Keep my account
            </Button>
            <Button type="submit" variant="danger" disabled={isSubmitting}>
              {isSubmitting ? 'Deleting…' : 'Delete account for good'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
