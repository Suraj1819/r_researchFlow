import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FolderKanban,
  GraduationCap,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';

import { cn } from '../../lib/utils';

/* ------------------------------------------------------------------ */
/* Theme (light / dark / system)                                      */
/* If your app already has a ThemeProvider or ThemeToggle, replace    */
/* ThemeToggle with it. The key must match what your app uses.        */
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

/**
 * One shared frame for every auth screen (sign in, register, staff login,
 * forgot password, reset password, verify email...).
 * Only the right-hand content changes, so moving between these pages
 * looks like the same screen and nothing jumps.
 *
 * lg and up: exactly one screen tall, no page scroll.
 * Below lg: the layout stacks and may scroll.
 */
export default function AuthShell({ children }) {
  return (
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

          {/* ============ Right panel ============ */}
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

              {/* Page content stays centred; scrolls inside only on very short screens */}
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

                {children}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}