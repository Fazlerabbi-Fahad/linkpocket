'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type CurrentUser } from '@/shared';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { FormAlert, InputField } from '@/components/ui/field';
import { api, isApiError } from '@/lib/api';
import { rememberNext, safeNext } from '@/lib/safe-next';
import { rememberPendingEmail, storeMe } from '@/lib/session';

type LoginInput = z.input<typeof loginSchema>;

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'That email and password do not match an account.',
  ACCOUNT_LOCKED: 'Too many attempts for this email. Try again in 15 minutes.',
  ACCOUNT_DISABLED: 'This account has been disabled.',
  RATE_LIMITED: 'Too many attempts from this device. Wait a few minutes and try again.',
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const next = safeNext(params.get('next'));
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { user } = await api<{ user: CurrentUser }>('/auth/login', {
        method: 'POST',
        body: values,
      });
      await storeMe(queryClient, user);
      if (!user.emailVerified) {
        rememberPendingEmail(user.email);
        rememberNext(next);
        router.replace('/verify-email');
        return;
      }
      router.replace(next);
    } catch (error) {
      setFormError(
        isApiError(error) && MESSAGES[error.code]
          ? MESSAGES[error.code]!
          : 'Log in failed. Check your connection and try again.',
      );
    }
  });

  return (
    <AuthShell
      title="Log in"
      lede="Welcome back. Your links are where you left them."
      footer={
        <>
          New here?{' '}
          <Link
            className="font-medium text-primary underline underline-offset-4"
            href={`/signup${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        {!formError && params.get('deleted') === '1' ? (
          <FormAlert tone="info">Your account and saved links have been deleted.</FormAlert>
        ) : null}
        <InputField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <InputField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password ? 'Enter your password.' : undefined}
          {...register('password')}
        />
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthShell>
  );
}
