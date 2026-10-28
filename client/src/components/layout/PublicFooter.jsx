import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  FolderKanban,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  LogIn,
  UserPlus,
  Workflow,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const muted = 'text-neutral-500 dark:text-neutral-400';

const linkClass =
  'inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white';

const exploreLinks = [
  { href: '/#features', label: 'Features', icon: LayoutGrid },
  { href: '/#modules', label: 'Modules', icon: FolderKanban },
  { href: '/#workflow', label: 'How it works', icon: Workflow },
  { href: '/#faq', label: 'FAQ', icon: HelpCircle },
  { to: '/ideas', label: 'Project ideas', icon: BookOpen },
];

const workspaceLinks = [
  {
    to: '/auth?tab=student-login',
    label: 'Student sign in',
    icon: LogIn,
  },
  {
    to: '/auth?tab=faculty-login',
    label: 'Faculty sign in',
    icon: ClipboardCheck,
  },
  {
    to: '/auth?tab=student-register',
    label: 'Create an account',
    icon: UserPlus,
    emphasis: true,
  },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 py-10 sm:grid-cols-2 sm:py-12 lg:grid-cols-[1.6fr_1fr_1fr]">
          {/* Brand */}
          <div className="min-w-0">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                <GraduationCap size={20} strokeWidth={1.75} />
              </span>
              <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                ResearchFlow
              </span>
            </Link>

            <p className={cn('mt-4 max-w-sm text-sm leading-7', muted)}>
              A structured workspace for academic projects, team collaboration,
              research documentation, and faculty review.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { label: 'Projects', tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
                { label: 'Meetings', tone: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300' },
                { label: 'Review', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium',
                    chip.tone,
                  )}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Explore
            </h2>
            <nav className="mt-4 flex flex-col items-start gap-3" aria-label="Explore">
              {exploreLinks.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <Icon size={15} className="shrink-0 text-neutral-400" strokeWidth={1.75} />
                    {item.label}
                  </>
                );

                if (item.to) {
                  return (
                    <Link key={item.label} to={item.to} className={linkClass}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <a key={item.label} href={item.href} className={linkClass}>
                    {content}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Workspace */}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Your workspace
            </h2>
            <nav
              className="mt-4 flex flex-col items-start gap-3"
              aria-label="Workspace"
            >
              {workspaceLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={cn(
                      linkClass,
                      item.emphasis &&
                        'font-medium text-neutral-800 dark:text-neutral-200',
                    )}
                  >
                    <Icon size={15} className="shrink-0 text-neutral-400" strokeWidth={1.75} />
                    {item.label}
                    {item.emphasis ? (
                      <ArrowRight size={14} className="text-neutral-400" />
                    ) : (
                      <ArrowUpRight size={14} className="text-neutral-400" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-neutral-200 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <p className={cn('text-xs', muted)}>
            © {new Date().getFullYear()} ResearchFlow. Built for academic work.
          </p>
          <p className={cn('text-xs', muted)}>Plan. Collaborate. Submit.</p>
        </div>
      </div>
    </footer>
  );
}