import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Eye,
  EyeOff,
  FolderKanban,
  GraduationCap,
  Hash,
  Contact,
  Info,
  LifeBuoy,
  Loader2,
  LockKeyhole,
  Mail,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  User,
  UserPlus,
  Users,
} from 'lucide-react';

import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

/* ------------------------------------------------------------------ */
/* Validation                                                         */
/* ------------------------------------------------------------------ */
const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must contain at least 6 characters'),
});

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Enter your full name')
      .max(100, 'Name must be less than 100 characters'),
    email: z.string().trim().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
    registration_number: z.string().optional(),
    roll_number: z.string().optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/* ------------------------------------------------------------------ */
/* Content                                                            */
/* Only icons and chips are coloured. All text stays neutral.         */
/* ------------------------------------------------------------------ */
const tabs = {
  'student-login': {
    title: 'Welcome back',
    subtitle: 'Sign in to continue your research journey.',
    heading: 'Student login',
    note: 'Your tasks, files, and supervisor feedback are waiting for you.',
    accent: 'sky',
    icon: GraduationCap,
  },
  'student-register': {
    title: 'Create your account',
    subtitle: 'Set up your student account to get started.',
    heading: 'Student registration',
    note: 'We will send a verification link to your email after you register.',
    accent: 'emerald',
    icon: UserPlus,
  },
  'staff-login': {
    title: 'Staff portal',
    subtitle: 'Sign in to manage research projects and students.',
    heading: 'Faculty and staff login',
    note: 'For faculty, reviewers, and coordinators. Students should use Student login.',
    accent: 'violet',
    icon: ClipboardCheck,
  },
};

const ACCENTS = {
  sky: {
    chip: 'bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
    soft: 'border-sky-200 bg-sky-50/60 dark:border-sky-500/20 dark:bg-sky-500/5',
    icon: 'text-sky-600 dark:text-sky-400',
    focus:
      'focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:focus:border-sky-400 dark:focus:ring-sky-400/10',
  },
  emerald: {
    chip: 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
    soft: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5',
    icon: 'text-emerald-600 dark:text-emerald-400',
    focus:
      'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10',
  },
  violet: {
    chip: 'bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
    soft: 'border-violet-200 bg-violet-50/60 dark:border-violet-500/20 dark:bg-violet-500/5',
    icon: 'text-violet-600 dark:text-violet-400',
    focus:
      'focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:focus:border-violet-400 dark:focus:ring-violet-400/10',
  },
};

const highlights = [
  {
    icon: FolderKanban,
    chip: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
    title: 'Structured workflows',
    text: 'Stay on top of submissions, tasks, and milestones.',
  },
  {
    icon: Users,
    chip: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
    title: 'Better collaboration',
    text: 'Keep students and supervisors aligned.',
  },
  {
    icon: ShieldCheck,
    chip: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    title: 'Secure access',
    text: 'Role-aware access for your authorized account.',
  },
];

/* ------------------------------------------------------------------ */
/* Theme (light / dark / system)                                      */
/* If your app already has a ThemeProvider or ThemeToggle, replace    */
/* this block with it. The key must match what your app uses.         */
/* ------------------------------------------------------------------ */
const THEME_KEY = 'theme';

function applyTheme(mode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = mode === 'dark' || (mode === 'system' && prefersDark);
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}

function ThemeToggle() {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    applyTheme(mode);

    if (mode !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const choose = (next) => {
    setMode(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable, theme still applies for this session */
    }
  };

  const options = [
    { value: 'light', label: 'Light theme', icon: Sun },
    { value: 'dark', label: 'Dark theme', icon: Moon },
    { value: 'system', label: 'System theme', icon: Monitor },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const selected = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => choose(value)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500',
              selected
                ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white',
            )}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form helpers                                                       */
/* ------------------------------------------------------------------ */
const labelClass = 'text-sm font-medium text-neutral-800 dark:text-neutral-200';

function inputClasses(accent, hasError) {
  return cn(
    'w-full rounded-xl border bg-white px-4 py-2.5 [@media(max-height:700px)]:py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-600',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-red-500/40'
      : cn(
          'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700',
          ACCENTS[accent].focus,
        ),
  );
}

function FormField({ id, label, error, optional = false, icon: Icon, accent, children }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {optional && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Optional
          </span>
        )}
      </div>

      <div className="relative mt-1.5">
        {Icon && (
          <Icon
            size={16}
            className={cn(
              'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2',
              accent ? ACCENTS[accent].icon : 'text-neutral-400',
            )}
          />
        )}
        {children}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}

function PasswordField({
  id,
  label,
  error,
  registerProps,
  visible,
  onToggle,
  accent,
  autoComplete,
  placeholder = 'Enter your password',
}) {
  return (
    <FormField
      id={id}
      label={label}
      error={error}
      icon={LockKeyhole}
      accent={accent}
    >
      <input
        id={id}
        {...registerProps}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={cn(inputClasses(accent, Boolean(error)), 'pl-10 pr-11')}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </FormField>
  );
}

function PasswordStrength({ value = '' }) {
  const rules = [
    { label: '8+ characters', ok: value.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(value) },
    { label: 'Number', ok: /[0-9]/.test(value) },
  ];

  const bonus = /[^A-Za-z0-9]/.test(value) || value.length >= 12 ? 1 : 0;
  const score = value ? rules.filter((r) => r.ok).length + bonus : 0;

  const meta = [
    { label: 'Password strength', bar: 'bg-red-500' },
    { label: 'Weak', bar: 'bg-red-500' },
    { label: 'Fair', bar: 'bg-amber-500' },
    { label: 'Good', bar: 'bg-sky-500' },
    { label: 'Strong', bar: 'bg-emerald-500' },
  ][score];

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-colors',
                i <= score ? meta.bar : 'bg-neutral-200 dark:bg-neutral-800',
              )}
            />
          ))}
        </div>
        <span className="w-28 shrink-0 text-right text-xs font-medium text-neutral-600 dark:text-neutral-300">
          {meta.label}
        </span>
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 [@media(max-height:740px)]:hidden">
        {rules.map((rule) => (
          <li
            key={rule.label}
            className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400"
          >
            <span
              className={cn(
                'flex h-3.5 w-3.5 items-center justify-center rounded-full',
                rule.ok
                  ? 'bg-emerald-500 text-white'
                  : 'border border-neutral-300 dark:border-neutral-700',
              )}
            >
              {rule.ok && <Check size={9} strokeWidth={3} />}
            </span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */
export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { signIn, signUp, isAuthenticated, role } = useAuth();

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    Object.hasOwn(tabs, initialTab) ? initialTab : 'student-login',
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = activeTab === 'student-register';
  const isStaff = activeTab === 'staff-login';

  const schema = isRegister ? registerSchema : loginSchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      registration_number: '',
      roll_number: '',
    },
  });

  const passwordValue = watch('password');

  useEffect(() => {
    const queryTab = searchParams.get('tab');

    if (Object.hasOwn(tabs, queryTab) && queryTab !== activeTab) {
      setActiveTab(queryTab);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (role === 'admin' || role === 'coordinator') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'faculty' || role === 'reviewer') {
      navigate('/faculty/dashboard', { replace: true });
    } else if (role === 'student') {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setShowPassword(false);
    setShowConfirmPassword(false);
    reset();
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const { data, error } = await signUp({
          email: values.email.trim(),
          password: values.password,
          metadata: {
            full_name: values.fullName.trim(),
            role: 'student',
            registration_number: values.registration_number?.trim() || null,
            roll_number: values.roll_number?.trim() || null,
          },
        });

        if (error) {
          toast.error(error.message || 'Unable to create your account.');
          return;
        }

        const userId = data?.user?.id;
        const session = data?.session;

        if (userId) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: values.fullName.trim(),
              registration_number: values.registration_number?.trim() || null,
              roll_number: values.roll_number?.trim() || null,
            })
            .eq('id', userId);

          if (profileError) {
            console.error('Profile update error:', profileError);
            toast.warning(
              'Account created, but some profile details may need updating.',
            );
          }
        }

        if (!session) {
          toast.success('Account created. Please verify your email.');
          navigate('/verify-email', {
            state: { email: values.email.trim() },
          });
          return;
        }

        toast.success('Account created successfully.');
        navigate('/app/dashboard', { replace: true });
        return;
      }

      const { error } = await signIn({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) {
        toast.error(
          error.message || 'Unable to sign in. Check your credentials.',
        );
        return;
      }

      if (isStaff) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          toast.error('Unable to verify your account.');
          await supabase.auth.signOut();
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError || !profile) {
          toast.error('Your staff profile could not be found.');
          await supabase.auth.signOut();
          return;
        }

        if (profile.role === 'admin' || profile.role === 'coordinator') {
          navigate('/admin/dashboard', { replace: true });
        } else if (profile.role === 'faculty' || profile.role === 'reviewer') {
          navigate('/faculty/dashboard', { replace: true });
        } else {
          toast.error('This account does not have staff access.');
          await supabase.auth.signOut();
        }

        return;
      }

      toast.success('Signed in successfully.');
      navigate('/app/dashboard', { replace: true });
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentContent = tabs[activeTab] || tabs['student-login'];
  const accent = currentContent.accent;
  const A = ACCENTS[accent];
  const HeadingIcon = currentContent.icon;

  const tabList = [
    { id: 'student-login', label: 'Student login' },
    { id: 'student-register', label: 'Register' },
    { id: 'staff-login', label: 'Staff' },
  ];

  const submitLabel = isRegister
    ? 'Create account'
    : isStaff
      ? 'Sign in to staff portal'
      : 'Sign in to your account';

  return (
    // lg: exactly one screen tall, no page scroll. Below lg the layout stacks and may scroll.
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-neutral-50 text-neutral-900 transition-colors dark:bg-neutral-950 dark:text-white lg:h-svh">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute -bottom-48 -right-40 h-[30rem] w-[30rem] rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10" />

        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-6 sm:px-8 lg:min-h-0 lg:px-12 lg:py-3">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_24px_80px_-30px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/30 lg:h-[min(46rem,calc(100svh-1.5rem))] lg:grid-cols-[0.85fr_1.15fr]">
          {/* ============ Left information panel ============ */}
          <aside className="relative hidden min-h-0 flex-col justify-between overflow-hidden bg-neutral-950 p-9 text-white dark:bg-black lg:flex">
            <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-12 -top-8 h-48 w-48 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-white/10" />

            <div className="relative">
              <Link
                to="/"
                aria-label="ResearchFlow home"
                className="group inline-flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-neutral-950"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-neutral-950 transition-transform group-hover:scale-105">
                  <GraduationCap size={22} strokeWidth={2} />
                </span>
                <span>
                  <span className="block text-base font-bold tracking-tight">
                    ResearchFlow
                  </span>
                  <span className="block text-[11px] text-neutral-400">
                    Research management platform
                  </span>
                </span>
              </Link>

              <h1 className="mt-10 max-w-sm text-4xl font-semibold leading-[1.15] tracking-tight [@media(max-height:760px)]:mt-6 [@media(max-height:760px)]:text-3xl">
                Turn your
                <br />
                research into
                <br />
                real progress.
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-400 [@media(max-height:760px)]:hidden">
                Plan projects, track milestones, collaborate with your
                supervisor, and keep every important document in one place.
              </p>
            </div>

            <div className="relative space-y-4">
              {highlights.map(({ icon: Icon, chip, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                      chip,
                    )}
                  >
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-neutral-400">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative border-t border-white/10 pt-4 text-xs text-neutral-500">
              ResearchFlow · Project lifecycle management
            </div>
          </aside>

          {/* ============ Right authentication panel ============ */}
          <div className="min-h-0 min-w-0 p-5 sm:p-8 lg:overflow-y-auto lg:px-9 lg:py-5">
            <div className="flex min-h-full flex-col">
              {/* Card top bar: Back to Home + Theme toggle */}
              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/"
                  className="group inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white"
                >
                  <ArrowLeft
                    size={15}
                    className="transition-transform group-hover:-translate-x-0.5"
                  />
                  Back to Home
                </Link>

                <ThemeToggle />
              </div>

              {/* Content stays centred in the card; scrolls inside only on very short screens */}
              <div className="my-auto py-3 [@media(max-height:700px)]:py-1">
                {/* Mobile brand */}
                <div className="mb-5 flex items-center gap-3 lg:hidden">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                    <GraduationCap size={22} />
                  </span>
                  <div>
                    <p className="font-bold tracking-tight">ResearchFlow</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Research management platform
                    </p>
                  </div>
                </div>

                {/* Heading */}
                <div className="mb-3 flex items-center gap-3.5">
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
                      {currentContent.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400 [@media(max-height:640px)]:hidden">
                      {currentContent.subtitle}
                    </p>
                  </div>
                </div>

                {/* Tabs */}
                <div
                  role="tablist"
                  aria-label="Account access"
                  className="mb-3 grid grid-cols-3 rounded-xl border border-neutral-200 bg-neutral-100/80 p-1 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  {tabList.map(({ id, label }) => {
                    const selected = activeTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => switchTab(id)}
                        className={cn(
                          'rounded-lg px-2 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 sm:text-sm',
                          selected
                            ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white'
                            : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Context note (hidden on short screens to keep everything in view) */}
                <div
                  className={cn(
                    'mb-3 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 [@media(max-height:800px)]:hidden',
                    A.soft,
                  )}
                >
                  <Info size={16} className={cn('mt-0.5 shrink-0', A.icon)} />
                  <p className="text-xs leading-5 text-neutral-600 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {currentContent.heading}.
                    </span>{' '}
                    {currentContent.note}
                  </p>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-3"
                  noValidate
                >
                  {isRegister && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          id="fullName"
                          label="Full name"
                          error={errors.fullName}
                          icon={User}
                          accent={accent}
                        >
                          <input
                            id="fullName"
                            {...register('fullName')}
                            type="text"
                            placeholder="Enter your full name"
                            autoComplete="name"
                            aria-invalid={Boolean(errors.fullName)}
                            className={cn(
                              inputClasses(accent, Boolean(errors.fullName)),
                              'pl-10',
                            )}
                          />
                        </FormField>

                        <FormField
                          id="email"
                          label="Email address"
                          error={errors.email}
                          icon={Mail}
                          accent={accent}
                        >
                          <input
                            id="email"
                            {...register('email')}
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            aria-invalid={Boolean(errors.email)}
                            className={cn(
                              inputClasses(accent, Boolean(errors.email)),
                              'pl-10',
                            )}
                          />
                        </FormField>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          id="registration_number"
                          label="Registration no."
                          error={errors.registration_number}
                          icon={Contact}
                          accent={accent}
                          optional
                        >
                          <input
                            id="registration_number"
                            {...register('registration_number')}
                            type="text"
                            placeholder="e.g. 220..."
                            autoComplete="off"
                            className={cn(inputClasses(accent, false), 'pl-10')}
                          />
                        </FormField>

                        <FormField
                          id="roll_number"
                          label="Roll number"
                          error={errors.roll_number}
                          icon={Hash}
                          accent={accent}
                          optional
                        >
                          <input
                            id="roll_number"
                            {...register('roll_number')}
                            type="text"
                            placeholder="Enter roll number"
                            autoComplete="off"
                            className={cn(inputClasses(accent, false), 'pl-10')}
                          />
                        </FormField>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <PasswordField
                          id="password"
                          label="Password"
                          error={errors.password}
                          registerProps={register('password')}
                          visible={showPassword}
                          onToggle={() => setShowPassword((value) => !value)}
                          accent={accent}
                          autoComplete="new-password"
                          placeholder="Create a password"
                        />

                        <PasswordField
                          id="confirmPassword"
                          label="Confirm password"
                          error={errors.confirmPassword}
                          registerProps={register('confirmPassword')}
                          visible={showConfirmPassword}
                          onToggle={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                          accent={accent}
                          autoComplete="new-password"
                          placeholder="Enter it again"
                        />
                      </div>

                      <PasswordStrength value={passwordValue} />
                    </>
                  )}

                  {!isRegister && (
                    <>
                      <FormField
                        id="email"
                        label="Email address"
                        error={errors.email}
                        icon={Mail}
                        accent={accent}
                      >
                        <input
                          id="email"
                          {...register('email')}
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          aria-invalid={Boolean(errors.email)}
                          className={cn(
                            inputClasses(accent, Boolean(errors.email)),
                            'pl-10',
                          )}
                        />
                      </FormField>

                      <PasswordField
                        id="password"
                        label="Password"
                        error={errors.password}
                        registerProps={register('password')}
                        visible={showPassword}
                        onToggle={() => setShowPassword((value) => !value)}
                        accent={accent}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                      />

                      <div className="flex justify-end">
                        <Link
                          to="/forgot-password"
                          className="text-sm font-medium text-neutral-600 underline-offset-4 transition hover:text-neutral-950 hover:underline dark:text-neutral-400 dark:hover:text-white"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 [@media(max-height:700px)]:py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/15 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 dark:focus-visible:ring-white/15"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Please wait...
                      </>
                    ) : (
                      <>
                        {submitLabel}
                        <ArrowRight
                          size={17}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </form>

                {/* Bottom links */}
                <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                  {isRegister ? (
                    <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchTab('student-login')}
                        className="font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-white"
                      >
                        Sign in
                      </button>
                    </p>
                  ) : (
                    <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                      {isStaff
                        ? 'Are you a student? '
                        : "Don't have an account? "}
                      <button
                        type="button"
                        onClick={() =>
                          switchTab(
                            isStaff ? 'student-login' : 'student-register',
                          )
                        }
                        className="font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-white"
                      >
                        {isStaff ? 'Student login' : 'Create an account'}
                      </button>
                    </p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs [@media(max-height:720px)]:hidden text-neutral-500 dark:text-neutral-400">
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
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}