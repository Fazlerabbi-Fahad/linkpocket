'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { USER_LIMITS, signupSchema } from '@/shared';
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
import { rememberPendingEmail } from '@/lib/session';

type SignupInput = z.input<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api('/auth/signup', { method: 'POST', body: values });
      rememberPendingEmail(values.email.trim().toLowerCase());
      rememberNext(safeNext(params.get('next')));
      router.push('/verify-email');
    } catch (error) {
      if (isApiError(error, 'PASSWORD_TOO_WEAK')) {
        setError('password', {
          message: error.fields[0]?.message ?? 'Choose a stronger password.',
        });
      } else if (isApiError(error, 'RATE_LIMITED')) {
        setFormError('Too many sign-ups from this device. Try again later.');
      } else {
        setFormError('Sign up failed. Check your connection and try again.');
      }
    }
  });

  return (
    <AuthShell
      title="Create your pocket"
      lede="One account, all your saved links. We will email you a link to confirm the address."
      footer={
        <>
          Already have an account?{' '}
          <Link className="font-medium text-primary underline underline-offset-4" href="/login">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <InputField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <InputField
          label="Name (optional)"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <InputField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint={`${USER_LIMITS.passwordMin} to ${USER_LIMITS.passwordMax} characters. A few unrelated words work well.`}
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-3 text-[15px]">
            <input
              type="checkbox"
              className="mt-0.5 size-5 shrink-0 accent-primary"
              aria-invalid={errors.acceptPrivacyPolicy ? true : undefined}
              aria-describedby={errors.acceptPrivacyPolicy ? 'privacy-error' : undefined}
              {...register('acceptPrivacyPolicy')}
            />
            <span>
              I have read the{' '}
              <Link
                href="/privacy"
                target="_blank"
                className="text-primary underline underline-offset-4"
              >
                privacy notice
              </Link>{' '}
              and agree to it.
            </span>
          </label>
          {errors.acceptPrivacyPolicy ? (
            <p id="privacy-error" className="text-sm text-destructive">
              Accept the privacy notice to create an account.
            </p>
          ) : null}
        </div>
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
