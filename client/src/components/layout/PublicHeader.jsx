import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderKanban,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  Menu,
  MessageSquare,
  Moon,
  Sparkles,
  Sun,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { cn } from '../../lib/utils';

const features = [
  {
    icon: FolderKanban,
    tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    title: 'Project management',
    description: 'Milestones, tasks and owners in one structured dashboard.',
    href: '/#features',
  },
  {
    icon: Users,
    tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
    title: 'Team collaboration',
    description: 'Invite members with clear, role-aware access.',
    href: '/#features',
  },
  {
    icon: FileText,
    tone: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
    title: 'Documents & files',
    description: 'Versioned library tied to every milestone.',
    href: '/#features',
  },
  {
    icon: ClipboardCheck,
    tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    title: 'Faculty review',
    description: 'Approve, request changes or reject with feedback.',
    href: '/#features',
  },
  {
    icon: FolderOpen,
    tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
    title: 'Submission groups',
    description: 'Cohorts by year, branch, semester and deadline.',
    href: '/#groups',
  },
  {
    icon: CalendarDays,
    tone: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
    title: 'Supervision meetings',
    description: 'Schedule online or in-person sessions with notes.',
    href: '/#supervision',
  },
];

const simpleNav = [
  { label: 'How it works', href: '/#workflow', icon: Workflow },
  { label: 'FAQ', href: '/#faq', icon: HelpCircle },
  { label: 'Ideas', to: '/ideas', icon: BookOpen },
];

function FeatureMegaMenu({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="absolute left-1/2 top-full z-50 w-[min(860px,calc(100vw-1.5rem))] -translate-x-1/2 pt-3"
      onMouseLeave={onClose}
    >
      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-neutral-200/90 bg-white',
          'shadow-[0_24px_80px_-20px_rgba(0,0,0,0.22)]',
          'dark:border-white/10 dark:bg-neutral-950 dark:shadow-black/50',
        )}
      >
        <div className="grid lg:grid-cols-[1fr_220px]">
          {/* Feature grid */}
          <div className="p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Platform features
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                <Sparkles size={11} />
                All-in-one
              </span>
            </div>

            <div className="grid gap-1.5 sm:grid-cols-2">
              {features.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    onClick={onClose}
                    className="group flex gap-3 rounded-xl border border-transparent p-3 transition hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-white/10 dark:hover:bg-white/[0.04]"
                  >
                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-[1.03]',
                        item.tone,
                      )}
                    >
                      <Icon size={19} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 dark:text-white">
                        {item.title}
                        <ArrowUpRight
                          size={13}
                          className="opacity-0 transition group-hover:opacity-100 text-neutral-400"
                        />
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                        {item.description}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Premium side panel */}
          <div className="flex flex-col justify-between border-t border-neutral-100 bg-gradient-to-b from-neutral-50 to-white p-5 dark:border-white/[0.06] dark:from-white/[0.04] dark:to-transparent lg:border-l lg:border-t-0">
            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                <MessageSquare size={18} strokeWidth={1.75} />
              </span>
              <p className="mt-4 text-sm font-semibold text-neutral-900 dark:text-white">
                Messaging & notes
              </p>
              <p className="mt-1.5 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                Private threads with students and supervision notes after every
                meeting — all tied to the project.
              </p>
              <ul className="mt-4 space-y-2">
                {['Role-based access', 'Version history', 'Review pipeline'].map(
                  (t) => (
                    <li
                      key={t}
                      className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300"
                    >
                      <CheckCircle2
                        size={13}
                        className="shrink-0 text-emerald-600 dark:text-emerald-400"
                      />
                      {t}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <a
              href="/#modules"
              onClick={onClose}
              className="mt-6 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-3 text-xs font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Explore all modules
              <ArrowRight size={13} />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-2 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Built for students, team leads and faculty supervisors.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/auth?tab=student-register"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 transition hover:text-neutral-500 dark:text-neutral-200 dark:hover:text-neutral-400"
            >
              Create account
              <ArrowRight size={12} />
            </Link>
            <span className="text-neutral-300 dark:text-neutral-600">·</span>
            <Link
              to="/auth?tab=student-login"
              onClick={onClose}
              className="text-xs font-medium text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicHeader() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const closeTimer = useRef(null);

  const dark = theme === 'dark';

  useEffect(() => {
    setMenuOpen(false);
    setFeaturesOpen(false);
  }, [location.pathname, location.hash]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function openFeatures() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setFeaturesOpen(true);
  }

  function scheduleCloseFeatures() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setFeaturesOpen(false), 180);
  }

  function closeFeatures() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setFeaturesOpen(false);
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/95">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link
          to="/"
          onClick={closeMenu}
          className="flex shrink-0 items-center gap-3"
          aria-label="ResearchFlow home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            <GraduationCap size={20} strokeWidth={1.75} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
            ResearchFlow
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <div
            className="relative"
            onMouseEnter={openFeatures}
            onMouseLeave={scheduleCloseFeatures}
          >
            <button
              type="button"
              onClick={() => setFeaturesOpen((v) => !v)}
              aria-expanded={featuresOpen}
              aria-haspopup="true"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition',
                featuresOpen
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-white/[0.08] dark:text-white'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white',
              )}
            >
              <LayoutGrid size={15} strokeWidth={1.75} />
              Features
            </button>
            <FeatureMegaMenu open={featuresOpen} onClose={closeFeatures} />
          </div>

          {simpleNav.map((item) => {
            const Icon = item.icon;
            const className = cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition',
              'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
              'dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white',
            );

            if (item.to) {
              return (
                <Link key={item.label} to={item.to} className={className}>
                  <Icon size={15} strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            }

            return (
              <a key={item.label} href={item.href} className={className}>
                <Icon size={15} strokeWidth={1.75} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/[0.06]"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <Link
            to="/auth?tab=student-login"
            className="hidden h-10 items-center justify-center rounded-xl px-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 sm:inline-flex dark:text-neutral-300 dark:hover:bg-white/[0.06]"
          >
            Sign in
          </Link>

          <Link
            to="/auth?tab=student-register"
            className="hidden h-10 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 text-sm font-medium text-white transition hover:bg-neutral-700 sm:inline-flex dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Get started
            <ArrowRight size={15} />
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-800 lg:hidden dark:border-white/10 dark:text-white"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="max-h-[min(80vh,640px)] overflow-y-auto border-t border-neutral-200 bg-white px-5 py-4 lg:hidden dark:border-white/10 dark:bg-neutral-950">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile">
            <div className="mb-1 flex items-center justify-between px-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Features
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                <Sparkles size={10} />
                Premium
              </span>
            </div>

            {features.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.title}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex gap-3 rounded-xl px-3 py-2.5 transition hover:bg-neutral-50 dark:hover:bg-white/[0.06]"
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      item.tone,
                    )}
                  >
                    <Icon size={17} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-neutral-900 dark:text-white">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                      {item.description}
                    </span>
                  </span>
                </a>
              );
            })}

            <div className="my-2 h-px bg-neutral-200 dark:bg-white/10" />

            {simpleNav.map((item) => {
              const Icon = item.icon;
              const className =
                'inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/[0.06]';

              if (item.to) {
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={closeMenu}
                    className={className}
                  >
                    <Icon size={16} strokeWidth={1.75} className="text-neutral-400" />
                    {item.label}
                  </Link>
                );
              }

              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className={className}
                >
                  <Icon size={16} strokeWidth={1.75} className="text-neutral-400" />
                  {item.label}
                </a>
              );
            })}

            <div className="my-2 h-px bg-neutral-200 dark:bg-white/10" />

            <Link
              to="/auth?tab=student-login"
              onClick={closeMenu}
              className="inline-flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/[0.06]"
            >
              Sign in
            </Link>

            <Link
              to="/auth?tab=student-register"
              onClick={closeMenu}
              className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              Create account
              <ArrowRight size={15} />
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}