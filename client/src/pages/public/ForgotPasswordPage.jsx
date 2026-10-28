import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Info,
  KeyRound,
  LifeBuoy,
  Loader2,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../../features/auth/AuthContext';
import { cn } from '../../lib/utils';
import AuthShell from '../../components/auth/AuthShell';
import {
  ACCENTS,
  inputClasses,
  labelClass,
} from '../../components/auth/AuthStyles';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

const RESEND_SECONDS = 60;

const nextSteps = [
  'Open the email we just sent you',
  'Click the reset link inside it',
  'Choose a new password and sign in',
];

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const sent = Boolean(sentTo);

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendLink = async (email, { isResend = false } = {}) => {
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message || 'Failed to send reset email');
        return false;
      }
      setSentTo(email);
      setCooldown(RESEND_SECONDS);
      toast.success(
        isResend
          ? 'Reset link sent again'
          : 'Check your email for the reset link',
      );
      return true;
    } catch {
      toast.error('Something went wrong. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (values) => sendLink(values.email.trim());

  const useDifferentEmail = () => {
    setSentTo('');
    setCooldown(0);
    reset({ email: '' });
  };

  const accent = sent ? 'emerald' : 'amber';
  const A = ACCENTS[accent];
  const HeadingIcon = sent ? MailCheck : KeyRound;

  return (
    <AuthShell>
      {/* Heading */}
      <div className="mb-4 flex items-center gap-3.5">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
            A.chip,
          )}
        >
          <HeadingIcon size={20} strokeWidth={1.8} />
        </span>

        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">
            {sent ? 'Check your email' : 'Reset your password'}
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400 [@media(max-height:640px)]:hidden">
            {sent
              ? 'We have sent you a password reset link.'
              : 'Enter your email and we will send you a reset link.'}
          </p>
        </div>
      </div>

      {sent ? (
        /* ------------------ Success state ------------------ */
        <div className="space-y-3">
          <div
            className={cn(
              'flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5',
              A.soft,
            )}
          >
            <Info size={16} className={cn('mt-0.5 shrink-0', A.icon)} />
            <p className="min-w-0 break-words text-xs leading-5 text-neutral-600 dark:text-neutral-400">
              If an account exists for{' '}
              <span className="font-semibold text-neutral-900 dark:text-white">
                {sentTo}
              </span>
              , a reset link has been sent. Check your spam folder if you do not
              see it.
            </p>
          </div>

          <ol className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 dark:border-neutral-800 dark:bg-neutral-950 [@media(max-height:700px)]:hidden">
            {nextSteps.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => sendLink(sentTo, { isResend: true })}
            disabled={loading || cooldown > 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900 [@media(max-height:700px)]:py-2.5"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email'}
          </button>

          <Link
            to="/auth?tab=student-login"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/15 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 dark:focus-visible:ring-white/15 [@media(max-height:700px)]:py-2.5"
          >
            Back to sign in
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Wrong email?{' '}
            <button
              type="button"
              onClick={useDifferentEmail}
              className="font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-white"
            >
              Use a different email
            </button>
          </p>
        </div>
      ) : (
        /* ------------------ Request state ------------------ */
        <>
          <div
            className={cn(
              'mb-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 [@media(max-height:800px)]:hidden',
              A.soft,
            )}
          >
            <Info size={16} className={cn('mt-0.5 shrink-0', A.icon)} />
            <p className="text-xs leading-5 text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold text-neutral-900 dark:text-white">
                Forgot your password?
              </span>{' '}
              Use the email you registered with. Faculty and staff can reset
              their password here too.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3"
            noValidate
          >
            <div className="min-w-0">
              <label htmlFor="email" className={labelClass}>
                Email address
              </label>

              <div className="relative mt-1.5">
                <Mail
                  size={16}
                  className={cn(
                    'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2',
                    A.icon,
                  )}
                />
                <input
                  id="email"
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  aria-invalid={Boolean(errors.email)}
                  className={cn(
                    inputClasses(accent, Boolean(errors.email)),
                    'pl-10',
                  )}
                />
              </div>

              {errors.email && (
                <p
                  role="alert"
                  className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/15 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 dark:focus-visible:ring-white/15 [@media(max-height:700px)]:py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              Remember your password?{' '}
              <Link
                to="/auth?tab=student-login"
                className="inline-flex items-center gap-1 font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-white"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </p>

            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-neutral-500 dark:text-neutral-400 [@media(max-height:720px)]:hidden">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck
                  size={14}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                Secure authentication
              </span>
              <span className="inline-flex items-center gap-1.5">
                <LifeBuoy
                  size={14}
                  className="text-sky-600 dark:text-sky-400"
                />
                Need help? Contact your coordinator
              </span>
            </div>
          </div>
        </>
      )}
    </AuthShell>
  );
}