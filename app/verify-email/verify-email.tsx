'use client';

import { TIMINGS, emailSchema, type CurrentUser } from '@/shared';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { FormAlert, InputField } from '@/components/ui/field';
import { api, isApiError } from '@/lib/api';
import { takeNext } from '@/lib/safe-next';
import { pendingEmail, storeMe, useMe } from '@/lib/session';

type Phase = 'checking' | 'verifying' | 'waiting' | 'invalid';

/** Reads `#token=…` (ADR-0005: the token never travels in a query string). */
function tokenFromFragment(): string | null {
  const match = /(?:^|&)token=([A-Za-z0-9_-]+)/.exec(window.location.hash.slice(1));
  return match?.[1] ?? null;
}

const COOLDOWN_SECONDS = TIMINGS.resendMinIntervalMs / 1000;

/** FR-A3, FR-A4, FR-A5: confirms a link, or offers a resend with a 60-second cooldown. */
export function VerifyEmail() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useMe();
  const [phase, setPhase] = useState<Phase>('checking');
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const usedToken = useRef<string | null>(null);

  useEffect(() => {
    setEmail(pendingEmail());
    const check = () => {
      const token = tokenFromFragment();
      if (!token) {
        setPhase((current) => (current === 'checking' ? 'waiting' : current));
        return;
      }
      // Drop the token from the address bar and history straight away. Strict Mode runs
      // effects twice, so each token is sent once.
      window.history.replaceState(null, '', window.location.pathname);
      if (usedToken.current === token) return;
      usedToken.current = token;
      setPhase('verifying');
      api<{ user: CurrentUser }>('/auth/verify-email', { method: 'POST', body: { token } })
        .then(async ({ user }) => {
          await storeMe(queryClient, user);
          router.replace(takeNext());
        })
        .catch(() => setPhase('invalid'));
    };
    check();
    // The link can also arrive in a tab that already shows this page (fragment-only change).
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [queryClient, router]);

  // A signed-in, unverified user: their address is known. A verified one has nothing to do here.
  useEffect(() => {
    if (!me.data) return;
    if (me.data.emailVerified && phase === 'waiting') router.replace('/library');
    else setEmail((current) => current || me.data?.email || '');
  }, [me.data, phase, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend(event: FormEvent) {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setEmailError('Enter the email address you signed up with.');
      return;
    }
    setEmailError(undefined);
    setNotice(null);
    try {
      await api('/auth/resend-verification', { method: 'POST', body: { email: parsed.data } });
      setNotice({
        tone: 'info',
        text: `If ${parsed.data} is waiting for verification, a new link is on its way.`,
      });
      setCooldown(COOLDOWN_SECONDS);
    } catch (error) {
      setNotice({
        tone: 'error',
        text: isApiError(error, 'RATE_LIMITED')
          ? 'You have asked for several links recently. Wait a minute, then try again. After 5 in an hour, wait up to an hour.'
          : 'Could not send the link. Check your connection and try again.',
      });
      if (isApiError(error, 'RATE_LIMITED')) setCooldown(COOLDOWN_SECONDS);
    }
  }

  if (phase === 'checking' || phase === 'verifying') {
    return (
      <AuthShell title="Verifying your email">
        <p role="status" className="text-[15px] text-muted-foreground">
          {phase === 'verifying' ? 'Confirming your link…' : 'One moment…'}
        </p>
      </AuthShell>
    );
  }

  const invalid = phase === 'invalid';
  return (
    <AuthShell
      title={invalid ? 'This link no longer works' : 'Check your inbox'}
      lede={
        invalid
          ? 'Verification links work once, expire after 24 hours, and stop working when a newer one is sent. Send yourself a new one.'
          : email
            ? `We sent a link to ${email}. Open it on any device to finish setting up.`
            : 'We sent you a link. Open it on any device to finish setting up.'
      }
      footer={
        <Link className="font-medium text-primary underline underline-offset-4" href="/login">
          Back to log in
        </Link>
      }
    >
      <form onSubmit={(event) => void resend(event)} noValidate className="flex flex-col gap-4">
        {notice ? <FormAlert tone={notice.tone}>{notice.text}</FormAlert> : null}
        <InputField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
        />
        <Button
          type="submit"
          variant={invalid ? 'primary' : 'secondary'}
          disabled={cooldown > 0}
          className="w-full"
        >
          {cooldown > 0 ? `Send another link in ${cooldown}s` : 'Send a new link'}
        </Button>
      </form>
    </AuthShell>
  );
}
