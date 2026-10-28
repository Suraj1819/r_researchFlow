
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../../features/auth/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LOGO_URL =
  'https://img.icons8.com/fluency/96/graduation-cap.png';

export default function LoginPage() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/app/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (values) => {
    setLoading(true);

    try {
      const { error } = await signIn({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) {
        toast.error(error.message || 'Failed to sign in');
        return;
      }

      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-4 py-10 text-neutral-950 selection:bg-neutral-200 sm:px-6 dark:bg-neutral-950 dark:text-white">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:36px_36px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[min(90vw,700px)] -translate-x-1/2 rounded-full bg-neutral-100/70 blur-3xl dark:bg-white/[0.035]"
      />

      <div className="relative z-10 w-full max-w-[440px] animate-[fadeIn_0.5s_ease-out]">
        {/* Back to home */}
        <Link
          to="/"
          className="mb-7 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        {/* Logo and heading */}
        <div className="mb-7 text-center">
          <Link
            to="/"
            aria-label="ResearchFlow home"
            className="mx-auto mb-5 flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-[20px] border border-neutral-200 bg-white shadow-sm transition-transform duration-300 hover:scale-[1.04] dark:border-white/10 dark:bg-neutral-900"
          >
            <img
              src={LOGO_URL}
              alt="ResearchFlow logo placeholder"
              className="h-12 w-12 object-contain"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
            <span className="absolute -z-10 flex h-[68px] w-[68px] items-center justify-center rounded-[20px] bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
              <GraduationCap size={30} strokeWidth={1.6} />
            </span>
          </Link>

          <Link
            to="/"
            className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950 dark:text-white"
          >
            ResearchFlow
          </Link>

          <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            Your academic workspace, all in one place.
          </p>
        </div>

        {/* Login card */}
        <section className="rounded-2xl border border-neutral-200 bg-white/95 p-5 shadow-[0_20px_70px_-35px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-neutral-900/95 dark:shadow-black/20">
          <div className="mb-7">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[0.05]">
              <LockKeyhole size={20} strokeWidth={1.7} />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Sign in to continue managing your academic projects.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <div>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@college.edu"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  {...register('password')}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-[37px] z-10 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>

              <div className="mt-3 flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              <span className="inline-flex items-center justify-center gap-2">
                Sign in
                {!loading && <ArrowRight size={16} />}
              </span>
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              New to ResearchFlow?
            </span>
            <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
          </div>

          <Link
            to="/register"
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/[0.05]"
          >
            Create an account
          </Link>
        </section>

        {/* Security note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          <ShieldCheck size={15} className="shrink-0" />
          <span>Your academic workspace starts here.</span>
        </div>

        <p className="mt-5 text-center text-xs text-neutral-400 dark:text-neutral-500">
          © {new Date().getFullYear()} ResearchFlow
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
