import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  LayoutDashboard,
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardList,
  FileText,
  FolderKanban,
  FolderOpen,
  Flag,
  GraduationCap,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Timer as TimerIcon,
  Users,
  ExternalLink,
  Globe,
  Linkedin,
  Github,
  UserRound,
  Mail,
  User,
  Target,
  Lightbulb,
  Sparkles,
  Settings,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Hash,
} from 'lucide-react';

import { api } from '../../lib/api';
import { formatDate, cn } from '../../lib/utils';

/* -------------------------------------------------------
   Shared styles (neutral only, no coloured borders)
------------------------------------------------------- */

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.04]';

const muted = 'text-neutral-500 dark:text-neutral-400';

const heading = 'font-semibold tracking-tight text-neutral-900 dark:text-white';

const iconBox = 'flex shrink-0 items-center justify-center rounded-xl';

/* Coloured icon backgrounds (cards and borders stay neutral) */
const TONES = {
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
};

/* Coloured plain icons (no background) */
const ICON = {
  sky: 'text-sky-600 dark:text-sky-300',
  violet: 'text-violet-600 dark:text-violet-300',
  amber: 'text-amber-600 dark:text-amber-300',
};

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';

const secondaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:pointer-events-none disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-200 dark:hover:bg-white/[0.07]';

const linkAction =
  'inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white';

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function getInitials(name) {
  return String(name || 'Student')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getArray(data, keys = []) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }

  if (data.data && typeof data.data === 'object') {
    for (const key of keys) {
      if (Array.isArray(data.data[key])) return data.data[key];
    }
  }

  return [];
}

function normalizeStatus(status, fallback = 'pending') {
  return String(status || fallback)
    .trim()
    .toLowerCase()
    .replaceAll('_', ' ')
    .replaceAll('-', ' ');
}

function getProjectTitle(project) {
  return project?.title || project?.name || project?.project_title || 'Untitled project';
}

function getProjectStatus(project) {
  return normalizeStatus(project?.status || project?.project_status, 'in progress');
}

function getTaskStatus(task) {
  return normalizeStatus(task?.status || task?.state, 'pending');
}

function getTaskTitle(task) {
  return task?.title || task?.name || task?.description || 'Project task';
}

function getTaskDeadline(task) {
  return task?.due_date || task?.deadline || task?.submission_deadline || task?.next_deadline || null;
}

function getProjectDeadline(project) {
  return project?.submission_deadline || project?.deadline || project?.due_date || project?.next_deadline || null;
}

function getProgress(project) {
  const raw = project?.progress ?? project?.progress_percentage ?? project?.completion_percentage ?? 0;
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysFromToday(deadline) {
  const date = toDate(deadline);
  if (!date) return null;
  return Math.round((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86400000);
}

function getDeadlineLabel(deadline) {
  const diff = daysFromToday(deadline);
  if (diff === null) return null;
  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `${diff} days left`;
}

function isCompletedStatus(status) {
  return ['completed', 'complete', 'approved', 'accepted', 'done'].includes(normalizeStatus(status));
}

function isInactiveProject(status) {
  return ['completed', 'complete', 'archived', 'rejected', 'cancelled'].includes(normalizeStatus(status));
}

function isUnreadNotification(notification) {
  if (typeof notification?.is_read === 'boolean') return !notification.is_read;
  if (typeof notification?.read === 'boolean') return !notification.read;
  if (typeof notification?.read_at !== 'undefined') return !notification.read_at;
  return true;
}

function sortByDateAscending(items, getDate) {
  return [...items].sort((a, b) => {
    const dateA = getDate(a);
    const dateB = getDate(b);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    const tA = new Date(dateA).getTime();
    const tB = new Date(dateB).getTime();
    if (!Number.isFinite(tA)) return 1;
    if (!Number.isFinite(tB)) return -1;
    return tA - tB;
  });
}

function sortByRecent(items) {
  return [...items].sort((a, b) => {
    const dA = new Date(a?.updated_at || a?.created_at || 0).getTime();
    const dB = new Date(b?.updated_at || b?.created_at || 0).getTime();
    return (Number.isFinite(dB) ? dB : 0) - (Number.isFinite(dA) ? dA : 0);
  });
}

function formatTimer(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.2);
    });
    setTimeout(() => ctx.close?.(), 1500);
  } catch {
    /* sound is optional */
  }
}

/* -------------------------------------------------------
   Reusable components
------------------------------------------------------- */

function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <section className={cn(card, 'flex min-w-0 flex-col overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3.5 dark:border-white/[0.07] sm:px-5">
        <div className="min-w-0">
          <h2 className={cn('text-[15px]', heading)}>{title}</h2>
          {description ? (
            <p className={cn('mt-0.5 text-xs leading-5 sm:text-[13px] sm:leading-5', muted)}>
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="flex-1 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function StatCard({ label, value, description, icon: Icon, tone = 'neutral' }) {
  return (
    <article className={cn(card, 'min-w-0 p-4 sm:p-5')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('text-sm', muted)}>{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            {value}
          </p>
        </div>

        <div className={cn(iconBox, 'h-10 w-10', TONES[tone])}>
          <Icon size={18} />
        </div>
      </div>

      {description && <p className={cn('mt-3 text-xs leading-5', muted)}>{description}</p>}
    </article>
  );
}

function ProgressBar({ value, label, barClass = 'bg-sky-500 dark:bg-sky-400' }) {
  const progress = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.08]"
      role="progressbar"
      aria-label={label || 'Progress'}
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500', barClass)}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs font-medium capitalize text-neutral-600 dark:border-white/10 dark:text-neutral-300">
      <span className="truncate">{normalizeStatus(status)}</span>
    </span>
  );
}

function EmptyState({ icon: Icon = FolderOpen, title, description, action, tone = 'neutral' }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className={cn(iconBox, 'h-12 w-12 rounded-2xl', TONES[tone])}>
        <Icon size={21} />
      </div>
      <h3 className={cn('mt-3 text-sm', heading)}>{title}</h3>
      <p className={cn('mt-1 max-w-sm text-sm leading-6', muted)}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn(card, 'h-28 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn(card, 'h-72 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')} />
        ))}
      </div>

      <div className={cn(card, 'flex min-h-24 items-center justify-center gap-3 p-6')}>
        <Loader2 size={20} className="animate-spin text-neutral-400" />
        <span className={cn('text-sm', muted)}>Loading your workspace...</span>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className={cn(card, 'p-6 text-center sm:p-10')}>
      <div className={cn(iconBox, 'mx-auto h-12 w-12', TONES.red)}>
        <AlertCircle size={21} />
      </div>
      <h2 className={cn('mt-4 text-lg', heading)}>Could not load dashboard</h2>
      <p className={cn('mx-auto mt-2 max-w-md text-sm leading-6', muted)}>
        {error?.message || 'Something went wrong while loading your data.'}
      </p>
      <button type="button" onClick={onRetry} className={cn(primaryButton, 'mt-5')}>
        <RefreshCw size={15} />
        Try again
      </button>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, description, badge, tone = 'neutral' }) {
  return (
    <Link
      to={to}
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-neutral-200 p-3 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:border-white/10 dark:hover:bg-white/[0.04]"
    >
      <div className={cn(iconBox, 'h-10 w-10', TONES[tone])}>
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</p>
        <p className={cn('mt-0.5 text-xs leading-5', muted)}>{description}</p>
      </div>

      {badge > 0 && (
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">
          {badge}
        </span>
      )}

      <ChevronRight size={16} className="shrink-0 text-neutral-400 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

/* -------------------------------------------------------
   Live clock
------------------------------------------------------- */

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  const date = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  return (
    <div className="flex items-center gap-4">
      <div className={cn(iconBox, 'h-12 w-12 rounded-2xl', TONES.sky)}>
        <Clock size={21} />
      </div>

      <div className="min-w-0">
        <p
          className="text-3xl font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-white"
          aria-live="off"
        >
          {time}
        </p>
        <p className={cn('mt-0.5 text-sm', muted)}>{date}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Timer
------------------------------------------------------- */

const TIMER_PRESETS = [5, 15, 25, 45, 60];

function TimerCard() {
  const [duration, setDuration] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const endAtRef = useRef(0);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  useEffect(() => {
    if (!running) return undefined;

    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);

      if (left === 0) {
        setRunning(false);
        setFinished(true);
        playBeep();
      }
    }, 250);

    return () => clearInterval(id);
  }, [running]);

  /* show the countdown in the browser tab */
  useEffect(() => {
    const original = document.title;
    if (running) document.title = `${formatTimer(remaining)} · Timer`;
    return () => {
      document.title = original;
    };
  }, [running, remaining]);

  const applyDuration = useCallback((totalSeconds) => {
    const safe = Math.min(999 * 60 + 59, Math.max(0, Math.floor(totalSeconds) || 0));
    setDuration(safe);
    setRemaining(safe);
    setRunning(false);
    setFinished(false);
  }, []);

  const toggle = () => {
    if (running) {
      setRunning(false);
      return;
    }

    const start = remaining > 0 ? remaining : duration;
    if (start <= 0) return;

    setRemaining(start);
    setFinished(false);
    endAtRef.current = Date.now() + start * 1000;
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setFinished(false);
    setRemaining(duration);
  };

  const elapsedPercent = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;
  const inputClass =
    'h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-center text-sm font-medium tabular-nums text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white';

  return (
    <SectionCard title="Timer" description="Set a countdown for focused work.">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <TimerIcon size={16} className={ICON.sky} />
          <span className={cn('text-xs', muted)}>
            {finished ? 'Time is up' : running ? 'Running' : remaining === duration ? 'Ready' : 'Paused'}
          </span>
        </div>

        <p
          className={cn(
            'mt-2 text-5xl font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-white',
            finished && 'animate-pulse',
          )}
          role="timer"
        >
          {formatTimer(remaining)}
        </p>

        <div className="mt-4 w-full">
          <ProgressBar value={elapsedPercent} label="Timer progress" />
        </div>

        <div className="mt-5 flex w-full items-center gap-2">
          <button type="button" onClick={toggle} className={cn(primaryButton, 'flex-1')}>
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? 'Pause' : remaining < duration && remaining > 0 ? 'Resume' : 'Start'}
          </button>

          <button type="button" onClick={reset} className={secondaryButton} aria-label="Reset timer">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        <div className="mt-5 w-full border-t border-neutral-100 pt-4 dark:border-white/[0.07]">
          <div className="flex flex-wrap gap-2">
            {TIMER_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyDuration(preset * 60)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300',
                  duration === preset * 60
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]',
                )}
              >
                {preset} min
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className={cn('mb-1 block text-xs', muted)}>Minutes</span>
              <input
                type="number"
                min={0}
                max={999}
                value={minutes}
                disabled={running}
                onChange={(e) => applyDuration(Number(e.target.value) * 60 + seconds)}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={cn('mb-1 block text-xs', muted)}>Seconds</span>
              <input
                type="number"
                min={0}
                max={59}
                value={seconds}
                disabled={running}
                onChange={(e) =>
                  applyDuration(minutes * 60 + Math.min(59, Math.max(0, Number(e.target.value))))
                }
                className={inputClass}
              />
            </label>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/* -------------------------------------------------------
   Calendar
------------------------------------------------------- */

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function CalendarCard({ events }) {
  const today = startOfDay(new Date());
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(() => dayKey(today));

  const eventsByDay = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const date = toDate(event.deadline);
      if (!date) return;
      const key = dayKey(date);
      map.set(key, [...(map.get(key) || []), event]);
    });
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const start = new Date(first);
    start.setDate(first.getDate() - offset);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return {
        date,
        key: dayKey(date),
        inMonth: date.getMonth() === cursor.getMonth(),
      };
    });
  }, [cursor]);

  const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(cursor);
  const todayKey = dayKey(today);
  const selectedEvents = eventsByDay.get(selected) || [];

  const shiftMonth = (delta) =>
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(todayKey);
  };

  const navButton =
    'flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]';

  return (
    <SectionCard
      title="Calendar"
      description="Deadlines are marked with a dot."
      action={
        <div className="flex items-center gap-2">
          <button type="button" onClick={goToday} className={cn(secondaryButton, 'min-h-9 px-3 text-xs')}>
            Today
          </button>
          <button type="button" onClick={() => shiftMonth(-1)} className={navButton} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => shiftMonth(1)} className={navButton} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      }
    >
      <p className={cn('mb-3 text-sm', heading)}>{monthLabel}</p>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className={cn('pb-2 text-xs font-medium', muted)}>
            {day}
          </span>
        ))}

        {cells.map(({ date, key, inMonth }) => {
          const count = eventsByDay.get(key)?.length || 0;
          const isToday = key === todayKey;
          const isSelected = key === selected;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              aria-label={`${date.toDateString()}${count ? `, ${count} deadline${count === 1 ? '' : 's'}` : ''}`}
              aria-pressed={isSelected}
              className={cn(
                'relative flex aspect-square min-h-9 flex-col items-center justify-center rounded-lg text-sm tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300',
                isToday
                  ? 'bg-neutral-900 font-semibold text-white dark:bg-white dark:text-neutral-900'
                  : isSelected
                    ? 'bg-neutral-100 font-semibold text-neutral-900 dark:bg-white/[0.1] dark:text-white'
                    : inMonth
                      ? 'text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-white/[0.05]'
                      : 'text-neutral-300 hover:bg-neutral-50 dark:text-neutral-600 dark:hover:bg-white/[0.04]',
              )}
            >
              {date.getDate()}
              {count > 0 && (
                <span
                  className={cn(
                    'absolute bottom-1.5 h-1 w-1 rounded-full',
                    isToday ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-900 dark:bg-white',
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-white/[0.07]">
        <p className={cn('text-xs', muted)}>
          {formatDate(selected)} · {selectedEvents.length} deadline{selectedEvents.length === 1 ? '' : 's'}
        </p>

        {selectedEvents.length ? (
          <ul className="mt-3 space-y-2">
            {selectedEvents.map((event, index) => (
              <li
                key={`${event.kind}-${event.title}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 dark:border-white/10"
              >
                <div className={cn(iconBox, 'h-8 w-8', event.kind === 'project' ? TONES.violet : TONES.amber)}>
                  {event.kind === 'project' ? <FolderKanban size={15} /> : <ClipboardList size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">{event.title}</p>
                  <p className={cn('text-xs capitalize', muted)}>{event.kind}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={cn('mt-3 text-sm', muted)}>No deadlines on this day.</p>
        )}
      </div>
    </SectionCard>
  );
}

/* -------------------------------------------------------
   Insight components
------------------------------------------------------- */

function NextDeadlineCard({ item }) {
  return (
    <SectionCard title="Next deadline" description="The closest upcoming due date.">
      {item ? (
        <div className="flex items-start gap-3">
          <div className={cn(iconBox, 'h-10 w-10', TONES.amber)}>
            <Flag size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-semibold text-neutral-900 dark:text-white">{item.title}</p>

            <p className={cn('mt-1 text-xs capitalize', muted)}>{item.kind}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className={cn('inline-flex items-center gap-1.5', muted)}>
                <CalendarDays size={13} className={ICON.sky} />
                {formatDate(item.deadline)}
              </span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {getDeadlineLabel(item.deadline)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          tone="emerald"
          title="Nothing due"
          description="No upcoming deadlines in your tasks or projects."
        />
      )}
    </SectionCard>
  );
}

function Breakdown({ items, total, emptyLabel }) {
  if (!total) return <p className={cn('text-sm', muted)}>{emptyLabel}</p>;

  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.08]">
        {items
          .filter((item) => item.count > 0)
          .map((item) => (
            <div
              key={item.label}
              className={item.shade}
              style={{ width: `${(item.count / total) * 100}%` }}
              title={`${item.label}: ${item.count}`}
            />
          ))}
      </div>

      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', item.dot || item.shade)} />
              <span className={cn('truncate', muted)}>{item.label}</span>
            </span>

            <span className="font-semibold text-neutral-900 dark:text-white">
              {item.count}
              <span className={cn('ml-1.5 text-xs font-normal', muted)}>
                {Math.round((item.count / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SHADES = [
  'bg-sky-500 dark:bg-sky-400',
  'bg-violet-500 dark:bg-violet-400',
  'bg-emerald-500 dark:bg-emerald-400',
  'bg-amber-400 dark:bg-amber-300',
];

function ProjectCard({ project }) {
  const title = getProjectTitle(project);
  const description =
    project?.description || project?.summary || 'Manage your milestones, documentation and project progress.';
  const progress = getProgress(project);
  const deadline = getProjectDeadline(project);
  const deadlineLabel = getDeadlineLabel(deadline);
  const projectId = project?.id || project?.project_id;

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-neutral-200 p-4 dark:border-white/10">
      <div className="flex items-start gap-3">
        <div className={cn(iconBox, 'h-10 w-10', TONES.violet)}>
          <FolderKanban size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
          <p className={cn('mt-1 line-clamp-2 text-xs leading-5', muted)}>{description}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <StatusPill status={getProjectStatus(project)} />
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">{progress}%</span>
      </div>

      <div className="mt-2">
        <ProgressBar value={progress} label={`${title} completion`} />
      </div>

      {deadline && (
        <div className={cn('mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs', muted)}>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} className={ICON.sky} />
            {formatDate(deadline)}
          </span>
          {deadlineLabel && (
            <span className="font-medium text-neutral-800 dark:text-neutral-200">{deadlineLabel}</span>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-white/[0.07]">
        {projectId ? (
          <Link
            to={`/app/projects/${projectId}`}
            className="inline-flex min-h-8 items-center gap-2 text-xs font-semibold text-neutral-700 transition hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
          >
            Open project
            <ArrowRight size={14} />
          </Link>
        ) : (
          <span className={cn('text-xs', muted)}>Project details</span>
        )}
      </div>
    </article>
  );
}

function TaskRow({ task }) {
  const deadline = getTaskDeadline(task);
  const deadlineLabel = getDeadlineLabel(deadline);

  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <div className={cn(iconBox, 'mt-0.5 h-9 w-9', TONES.amber)}>
        <ClipboardList size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {getTaskTitle(task)}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPill status={getTaskStatus(task)} />
          {deadline && <span className={cn('text-xs', muted)}>{formatDate(deadline)}</span>}
        </div>

        {deadlineLabel && (
          <p className="mt-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">{deadlineLabel}</p>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ notification, isLast }) {
  const title = notification?.title || 'New notification';
  const message = notification?.message || notification?.body || notification?.description || '';
  const isUnread = isUnreadNotification(notification);

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && (
        <span
          className="absolute left-[17px] top-9 h-[calc(100%-1.5rem)] w-px bg-neutral-200 dark:bg-white/10"
          aria-hidden="true"
        />
      )}

      <div className={cn(iconBox, 'relative h-9 w-9', TONES.sky)}>
        <Bell size={16} />
        {isUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-neutral-900 dark:border-neutral-900 dark:bg-white" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium text-neutral-900 dark:text-white">{title}</p>
        {message && <p className={cn('mt-1 line-clamp-2 text-xs leading-5', muted)}>{message}</p>}
        {notification?.created_at && (
          <p className={cn('mt-1.5 text-xs', muted)}>{formatDate(notification.created_at)}</p>
        )}
      </div>
    </li>
  );
}

function InvitationRow({ invitation }) {
  const projectName =
    invitation?.project?.title ||
    invitation?.project?.name ||
    invitation?.project_title ||
    invitation?.title ||
    'Project invitation';

  const inviter =
    invitation?.inviter?.full_name || invitation?.sender?.full_name || invitation?.invited_by_name || '';

  return (
    <div className="flex items-start gap-3 rounded-xl border border-neutral-200 p-3 dark:border-white/10">
      <div className={cn(iconBox, 'h-9 w-9', TONES.violet)}>
        <Users size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold text-neutral-900 dark:text-white">{projectName}</p>
        {inviter && <p className={cn('mt-1 text-xs', muted)}>Invited by {inviter}</p>}
        <div className="mt-2">
          <StatusPill status={invitation?.status || 'pending'} />
        </div>
      </div>
    </div>
  );
}


function SpotlightMetric({ label, value, sub, icon: Icon, tone = 'neutral' }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3.5 py-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
      <div className={cn(iconBox, 'h-9 w-9', TONES[tone])}>
        <Icon size={16} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className={cn('text-[11px] font-medium uppercase tracking-wide', muted)}>{label}</p>
        <p className="truncate text-sm font-semibold tabular-nums text-neutral-900 dark:text-white">
          {value}
          {sub ? <span className={cn('ml-1.5 text-xs font-normal', muted)}>{sub}</span> : null}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Main dashboard
------------------------------------------------------- */

export default function Dashboard() {
  const profileQuery = useQuery({ queryKey: ['student-dashboard-profile'], queryFn: () => api.getMe(), retry: 1 });
  const projectsQuery = useQuery({ queryKey: ['student-dashboard-projects'], queryFn: () => api.listProjects(), retry: 1 });
  const tasksQuery = useQuery({ queryKey: ['student-dashboard-tasks'], queryFn: () => api.listMyTasks(), retry: 1 });
  const notificationsQuery = useQuery({ queryKey: ['student-dashboard-notifications'], queryFn: () => api.listNotifications(), retry: 1 });
  const invitationsQuery = useQuery({ queryKey: ['student-dashboard-invitations'], queryFn: () => api.listMyInvitations(), retry: 1 });

  const profile = useMemo(() => {
    const data = profileQuery.data;
    if (!data || typeof data !== 'object') return {};
    return data.profile || data.user || data.data?.profile || data.data?.user || data.data || data;
  }, [profileQuery.data]);

  const projects = useMemo(() => getArray(projectsQuery.data, ['projects']), [projectsQuery.data]);
  const tasks = useMemo(() => getArray(tasksQuery.data, ['tasks', 'myTasks', 'submissions']), [tasksQuery.data]);
  const notifications = useMemo(() => getArray(notificationsQuery.data, ['notifications']), [notificationsQuery.data]);
  const invitations = useMemo(() => getArray(invitationsQuery.data, ['invitations']), [invitationsQuery.data]);

  const activeProjects = useMemo(
    () => projects.filter((p) => !isInactiveProject(getProjectStatus(p))),
    [projects],
  );
  const completedProjects = useMemo(
    () => projects.filter((p) => isCompletedStatus(getProjectStatus(p))),
    [projects],
  );
  const pendingTasks = useMemo(() => tasks.filter((t) => !isCompletedStatus(getTaskStatus(t))), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => isCompletedStatus(getTaskStatus(t))), [tasks]);
  const unreadNotifications = useMemo(() => notifications.filter(isUnreadNotification), [notifications]);

  const pendingInvitations = useMemo(
    () =>
      invitations.filter((inv) => {
        const status = normalizeStatus(inv?.status, 'pending');
        return !['accepted', 'rejected', 'declined', 'cancelled', 'expired'].includes(status);
      }),
    [invitations],
  );

  const overallProgress = useMemo(() => {
    if (!projects.length) return 0;
    return Math.round(projects.reduce((sum, p) => sum + getProgress(p), 0) / projects.length);
  }, [projects]);

  const taskCompletionRate = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  /* all deadlines (for calendar) */
  const allDeadlines = useMemo(() => {
    const fromTasks = tasks.map((t) => ({ kind: 'task', title: getTaskTitle(t), deadline: getTaskDeadline(t), done: isCompletedStatus(getTaskStatus(t)) }));
    const fromProjects = projects.map((p) => ({ kind: 'project', title: getProjectTitle(p), deadline: getProjectDeadline(p), done: isInactiveProject(getProjectStatus(p)) }));
    return [...fromTasks, ...fromProjects].filter((i) => toDate(i.deadline));
  }, [tasks, projects]);

  const openDeadlines = useMemo(() => allDeadlines.filter((i) => !i.done), [allDeadlines]);

  const overdueCount = useMemo(
    () => openDeadlines.filter((i) => daysFromToday(i.deadline) < 0).length,
    [openDeadlines],
  );

  const dueThisWeek = useMemo(
    () => openDeadlines.filter((i) => { const d = daysFromToday(i.deadline); return d >= 0 && d <= 6; }).length,
    [openDeadlines],
  );

  const nextDeadline = useMemo(
    () =>
      sortByDateAscending(
        openDeadlines.filter((i) => daysFromToday(i.deadline) >= 0),
        (i) => i.deadline,
      )[0] || null,
    [openDeadlines],
  );

  const focusScore = useMemo(() => {
    const parts = [overallProgress, taskCompletionRate];
    if (overdueCount === 0) parts.push(100);
    else parts.push(Math.max(0, 100 - overdueCount * 15));
    return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
  }, [overallProgress, taskCompletionRate, overdueCount]);

  const weekStrip = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = dayKey(d);
      const count = openDeadlines.filter((ev) => {
        const ed = toDate(ev.deadline);
        return ed && dayKey(startOfDay(ed)) === key;
      }).length;
      const label = new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(d);
      const dayNum = d.getDate();
      return { key, label, dayNum, count, isToday: i === 0 };
    });
  }, [openDeadlines]);

  const tips = useMemo(() => {
    const list = [];
    if (overdueCount > 0) {
      list.push({
        title: 'Clear overdue work first',
        body: `You have ${overdueCount} overdue item${overdueCount === 1 ? '' : 's'}. Start with the oldest deadline.`,
        tone: 'amber',
        icon: Flag,
      });
    }
    if (pendingInvitations.length > 0) {
      list.push({
        title: 'Respond to invitations',
        body: 'Pending team invites can block progress for collaborators.',
        tone: 'violet',
        icon: Users,
      });
    }
    if (pendingTasks.length === 0 && projects.length > 0) {
      list.push({
        title: 'Plan the next milestone',
        body: 'No open tasks — break the next deliverable into smaller steps.',
        tone: 'sky',
        icon: Target,
      });
    }
    if (!list.length) {
      list.push({
        title: 'Keep a steady cadence',
        body: 'Log progress weekly and act on feedback as soon as it arrives.',
        tone: 'emerald',
        icon: Sparkles,
      });
    }
    return list.slice(0, 3);
  }, [overdueCount, pendingInvitations.length, pendingTasks.length, projects.length]);

  const projectBreakdown = useMemo(() => {
    const count = (list) => projects.filter((p) => list.includes(getProjectStatus(p))).length;
    const inProgress = count(['in progress', 'active', 'ongoing', 'draft']);
    const review = count(['pending', 'under review', 'submitted', 'awaiting approval']);
    const done = completedProjects.length;
    return [
      { label: 'In progress', count: inProgress, shade: 'bg-sky-500 dark:bg-sky-400', dot: 'bg-sky-500' },
      { label: 'Under review', count: review, shade: 'bg-violet-500 dark:bg-violet-400', dot: 'bg-violet-500' },
      { label: 'Completed', count: done, shade: 'bg-emerald-500 dark:bg-emerald-400', dot: 'bg-emerald-500' },
      { label: 'Other', count: Math.max(0, projects.length - inProgress - review - done), shade: 'bg-neutral-300 dark:bg-neutral-600', dot: 'bg-neutral-400' },
    ];
  }, [projects, completedProjects]);

  const taskBreakdown = useMemo(() => {
    const overdue = pendingTasks.filter((t) => { const d = daysFromToday(getTaskDeadline(t)); return d !== null && d < 0; }).length;
    const review = pendingTasks.filter((t) => ['under review', 'submitted', 'awaiting approval'].includes(getTaskStatus(t))).length;
    return [
      { label: 'Completed', count: completedTasks.length, shade: 'bg-emerald-500 dark:bg-emerald-400', dot: 'bg-emerald-500' },
      { label: 'Under review', count: review, shade: 'bg-violet-500 dark:bg-violet-400', dot: 'bg-violet-500' },
      { label: 'Overdue', count: overdue, shade: 'bg-red-500 dark:bg-red-400', dot: 'bg-red-500' },
      { label: 'Open', count: Math.max(0, pendingTasks.length - overdue - review), shade: 'bg-amber-400 dark:bg-amber-300', dot: 'bg-amber-400' },
    ];
  }, [pendingTasks, completedTasks]);

  const upcomingTasks = useMemo(() => sortByDateAscending(pendingTasks, getTaskDeadline).slice(0, 5), [pendingTasks]);
  const recentProjects = useMemo(() => sortByRecent(projects).slice(0, 4), [projects]);
  const recentNotifications = useMemo(() => sortByRecent(notifications).slice(0, 5), [notifications]);

  const isLoading = profileQuery.isLoading || projectsQuery.isLoading || tasksQuery.isLoading;
  const dashboardError = projectsQuery.error || tasksQuery.error;
  const isRefreshing =
    profileQuery.isFetching || projectsQuery.isFetching || tasksQuery.isFetching ||
    notificationsQuery.isFetching || invitationsQuery.isFetching;

  const refetchAll = () => {
    profileQuery.refetch();
    projectsQuery.refetch();
    tasksQuery.refetch();
    notificationsQuery.refetch();
    invitationsQuery.refetch();
  };

  const displayName = String(profile?.full_name || profile?.name || profile?.username || 'Student');
  const firstName = displayName.trim().split(/\s+/)[0] || 'Student';
  const branch = profile?.branch || profile?.department || profile?.course || '';
  const academicYear = profile?.academic_year || profile?.session_year || profile?.academic_session || '';
  const profileEmail =
    profile?.email ||
    profileQuery.data?.email ||
    profileQuery.data?.user?.email ||
    profileQuery.data?.data?.email ||
    '';

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
        <div>
          <div className="h-4 w-36 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
          <div className="mt-4 h-9 w-72 max-w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-white/10" />
        </div>
        <LoadingState />
      </div>
    );
  }

  if (dashboardError && projects.length === 0 && tasks.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
        <div>
          <p className={cn('text-sm', muted)}>Student workspace</p>
          <h1 className={cn('mt-2 text-3xl', heading)}>Dashboard</h1>
        </div>
        <ErrorState error={dashboardError} onRetry={refetchAll} />
      </div>
    );
  }

  const chip =
    'inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:border-white/10 dark:text-neutral-300';

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-5 pb-10 sm:space-y-6">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className={cn('mb-3 flex flex-wrap items-center gap-2 text-sm', muted)}>
              <LayoutDashboard size={16} className={ICON.violet} />
              <span>Student workspace</span>
              <span>/</span>
              <span className="text-neutral-800 dark:text-neutral-200">Dashboard</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="group relative shrink-0">
                <Link
                  to="/app/profile"
                  className="relative block h-12 w-12 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 shadow-sm ring-offset-2 transition hover:ring-2 hover:ring-violet-400/60 dark:border-white/10 dark:bg-white/[0.06] dark:ring-offset-neutral-950 sm:h-14 sm:w-14"
                  aria-label="Open profile"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-600 dark:text-neutral-200 sm:text-base">
                      {getInitials(displayName)}
                    </span>
                  )}
                </Link>

                {/* Hover profile preview */}
                <div
                  className={cn(
                    'pointer-events-none absolute left-0 top-full z-40 mt-2.5 w-[288px] origin-top-left',
                    'translate-y-1 scale-[0.98] opacity-0 transition duration-200 ease-out',
                    'group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100',
                    'group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100',
                  )}
                >
                  <div
                    className={cn(
                      'overflow-hidden rounded-2xl border border-neutral-200/90 bg-white',
                      'shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]',
                      'dark:border-white/10 dark:bg-neutral-950 dark:shadow-black/50',
                    )}
                  >
                    <div className="relative h-16 bg-gradient-to-br from-violet-500/20 via-sky-500/15 to-emerald-500/20 dark:from-violet-500/15 dark:via-sky-500/10 dark:to-emerald-500/10">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/40 to-transparent dark:from-white/5" />
                    </div>

                    <div className="relative px-4 pb-4">
                      <div className="-mt-8 flex items-end gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-full border-[3px] border-white bg-neutral-100 shadow-md dark:border-neutral-950 dark:bg-white/10">
                          {profile?.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-base font-semibold text-neutral-600 dark:text-neutral-200">
                              {getInitials(displayName)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pb-1">
                          <p className="truncate text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-white">
                            {displayName}
                          </p>
                          <p className="mt-0.5 inline-flex items-center gap-1 truncate text-xs capitalize text-violet-600 dark:text-violet-300">
                            <UserRound size={12} />
                            {profile?.role || 'Student'}
                          </p>
                        </div>
                      </div>

                      {profile?.bio ? (
                        <p className={cn('mt-2 line-clamp-1 text-[11px] leading-4', muted)}>
                          {profile.bio}
                        </p>
                      ) : null}

                      <div className="mt-2.5 space-y-1.5 rounded-xl border border-neutral-100 bg-neutral-50/80 p-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        {profileEmail ? (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className={cn(iconBox, 'h-7 w-7', TONES.sky)}>
                              <Mail size={13} />
                            </span>
                            <div className="min-w-0">
                              <p className={cn('text-[10px] uppercase tracking-wide', muted)}>Email</p>
                              <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                {profileEmail}
                              </p>
                            </div>
                          </div>
                        ) : null}
                        {branch ? (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className={cn(iconBox, 'h-7 w-7', TONES.violet)}>
                              <GraduationCap size={13} />
                            </span>
                            <div className="min-w-0">
                              <p className={cn('text-[10px] uppercase tracking-wide', muted)}>Branch</p>
                              <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                {branch}
                              </p>
                            </div>
                          </div>
                        ) : null}
                        {academicYear ? (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className={cn(iconBox, 'h-7 w-7', TONES.emerald)}>
                              <CalendarDays size={13} />
                            </span>
                            <div className="min-w-0">
                              <p className={cn('text-[10px] uppercase tracking-wide', muted)}>Academic year</p>
                              <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                {academicYear}
                              </p>
                            </div>
                          </div>
                        ) : null}
                        {profile?.semester ? (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className={cn(iconBox, 'h-7 w-7', TONES.amber)}>
                              <CalendarDays size={13} />
                            </span>
                            <div className="min-w-0">
                              <p className={cn('text-[10px] uppercase tracking-wide', muted)}>Semester</p>
                              <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                {profile.semester}
                              </p>
                            </div>
                          </div>
                        ) : null}
                        {profile?.registration_number ? (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className={cn(iconBox, 'h-7 w-7', TONES.sky)}>
                              <BookOpen size={13} />
                            </span>
                            <div className="min-w-0">
                              <p className={cn('text-[10px] uppercase tracking-wide', muted)}>Registration no.</p>
                              <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                {profile.registration_number}
                              </p>
                            </div>
                          </div>
                        ) : null}
                        {profile?.roll_number ? (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className={cn(iconBox, 'h-7 w-7', TONES.violet)}>
                              <Hash size={13} />
                            </span>
                            <div className="min-w-0">
                              <p className={cn('text-[10px] uppercase tracking-wide', muted)}>Roll number</p>
                              <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                {profile.roll_number}
                              </p>
                            </div>
                          </div>
                        ) : null}
                        {profile?.github_url ? (
                          <a
                            href={profile.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 text-xs transition hover:opacity-80"
                          >
                            <span className={cn(iconBox, 'h-7 w-7', TONES.neutral)}>
                              <Github size={13} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-[10px] uppercase tracking-wide', muted)}>GitHub</p>
                              <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                {String(profile.github_url).replace(/^https?:\/\//, '')}
                              </p>
                            </div>
                            <ExternalLink size={12} className="shrink-0 text-neutral-400" />
                          </a>
                        ) : null}
                        {profile?.linkedin_url ? (
                          <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 text-xs transition hover:opacity-80"
                          >
                            <span className={cn(iconBox, 'h-7 w-7', TONES.sky)}>
                              <Linkedin size={13} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-[10px] uppercase tracking-wide', muted)}>LinkedIn</p>
                              <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                {String(profile.linkedin_url).replace(/^https?:\/\//, '')}
                              </p>
                            </div>
                            <ExternalLink size={12} className="shrink-0 text-neutral-400" />
                          </a>
                        ) : null}
                        {profile?.portfolio_url ? (
                          <a
                            href={profile.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 text-xs transition hover:opacity-80"
                          >
                            <span className={cn(iconBox, 'h-7 w-7', TONES.violet)}>
                              <Globe size={13} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-[10px] uppercase tracking-wide', muted)}>Portfolio</p>
                              <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                                {String(profile.portfolio_url).replace(/^https?:\/\//, '')}
                              </p>
                            </div>
                            <ExternalLink size={12} className="shrink-0 text-neutral-400" />
                          </a>
                        ) : null}
                        {!profileEmail &&
                        !branch &&
                        !academicYear &&
                        !profile?.semester &&
                        !profile?.registration_number &&
                        !profile?.roll_number &&
                        !profile?.github_url &&
                        !profile?.linkedin_url &&
                        !profile?.portfolio_url ? (
                          <p className={cn('text-xs', muted)}>
                            Complete your profile to show details here.
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                          to="/app/profile"
                          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                        >
                          <UserRound size={14} />
                          Profile
                        </Link>
                        <Link
                          to="/app/settings"
                          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200 dark:hover:bg-white/[0.07]"
                        >
                          <Settings size={14} />
                          Settings
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <h1 className="break-words text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
                  {getGreeting()}, {firstName}
                </h1>
                <p className={cn('mt-1 text-sm leading-6', muted)}>
                  {overdueCount
                    ? `${overdueCount} item${overdueCount === 1 ? ' is' : 's are'} overdue.`
                    : dueThisWeek
                      ? `${dueThisWeek} deadline${dueThisWeek === 1 ? '' : 's'} in the next 7 days.`
                      : 'No deadlines in the next 7 days.'}
                </p>
              </div>
            </div>

            {(branch || academicYear) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {branch && <span className={chip}><GraduationCap size={13} className={ICON.violet} />{branch}</span>}
                {academicYear && <span className={chip}><CalendarDays size={13} className={ICON.sky} />{academicYear}</span>}
              </div>
            )}
          </div>

          <div className={cn(card, 'px-5 py-4')}>
            <LiveClock />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={refetchAll} disabled={isRefreshing} className={secondaryButton}>
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <Link to="/app/projects/new" className={primaryButton}>
            <Plus size={16} />
            New project
          </Link>
        </div>

        {dashboardError && (
          <div className={cn(card, 'flex items-start gap-2 p-3 text-sm text-neutral-700 dark:text-neutral-200')}>
            <AlertCircle size={16} className={cn('mt-0.5 shrink-0', ICON.amber)} />
            <p className="min-w-0 flex-1">
              Some project or task data could not be loaded. The displayed information may be incomplete.
            </p>
            <button type="button" onClick={refetchAll} className="shrink-0 font-medium underline underline-offset-2">
              Retry
            </button>
          </div>
        )}

        {overdueCount > 0 && (
          <div className={cn(card, 'flex flex-col gap-3 border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.06] sm:flex-row sm:items-center sm:justify-between')}>
            <div className="flex min-w-0 items-start gap-3">
              <div className={cn(iconBox, 'h-10 w-10', TONES.amber)}>
                <Flag size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {overdueCount} overdue item{overdueCount === 1 ? '' : 's'} need attention
                </p>
                <p className={cn('mt-0.5 text-xs leading-5', muted)}>
                  Clear these before starting new work so deadlines stay under control.
                </p>
              </div>
            </div>
            <Link to="/app/tasks" className={cn(secondaryButton, 'shrink-0 border-amber-200 dark:border-amber-500/30')}>
              Review tasks
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>

      {/* Snapshot metrics */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SpotlightMetric label="Focus" value={focusScore} sub="/ 100" icon={TrendingUp} tone="violet" />
        <SpotlightMetric label="Active" value={activeProjects.length} sub="projects" icon={FolderKanban} tone="sky" />
        <SpotlightMetric label="Open tasks" value={pendingTasks.length} icon={ClipboardList} tone="amber" />
        <SpotlightMetric
          label="Next due"
          value={nextDeadline ? getDeadlineLabel(nextDeadline.deadline) || '—' : 'None'}
          icon={CalendarDays}
          tone="emerald"
        />
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Total projects"
          value={projects.length}
          description={`${activeProjects.length} currently active`}
          icon={FolderKanban}
          tone="sky"
        />
        <StatCard
          label="Completed projects"
          value={completedProjects.length}
          description={
            projects.length
              ? `${Math.round((completedProjects.length / projects.length) * 100)}% of all projects`
              : 'Projects marked complete'
          }
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Pending tasks"
          value={pendingTasks.length}
          description={overdueCount ? `${overdueCount} overdue` : `${dueThisWeek} due this week`}
          icon={ClipboardList}
          tone="amber"
        />
        <StatCard
          label="Unread notifications"
          value={unreadNotifications.length}
          description={
            pendingInvitations.length
              ? `${pendingInvitations.length} pending invitation${pendingInvitations.length === 1 ? '' : 's'}`
              : 'You are up to date'
          }
          icon={Bell}
          tone="violet"
        />
      </section>

      {/* Focus + week strip */}
      <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <article className={cn(card, 'flex min-w-0 flex-col justify-between p-5')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={cn('text-sm', muted)}>Focus score</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-neutral-900 dark:text-white">
                {focusScore}
              </p>
            </div>
            <div className={cn(iconBox, 'h-11 w-11', TONES.violet)}>
              <TrendingUp size={20} />
            </div>
          </div>
          <p className={cn('mt-4 text-xs leading-5', muted)}>
            Based on project progress, task completion and overdue items.
          </p>
          <div className="mt-4">
            <ProgressBar value={focusScore} label="Focus score" barClass="bg-violet-500 dark:bg-violet-400" />
          </div>
        </article>

        <article className={cn(card, 'min-w-0 p-5')}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className={cn('text-base', heading)}>This week</h2>
              <p className={cn('mt-0.5 text-xs', muted)}>Open deadlines by day</p>
            </div>
            <Link to="/app/tasks" className={linkAction}>
              Open tasks
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {weekStrip.map((day) => (
              <div
                key={day.key}
                className={cn(
                  'flex flex-col items-center rounded-xl border px-1 py-2.5 text-center',
                  day.isToday
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-200 dark:border-white/10',
                )}
              >
                <span className={cn('text-[10px] font-medium uppercase', day.isToday ? 'opacity-80' : muted)}>
                  {day.label}
                </span>
                <span className="mt-1 text-sm font-semibold tabular-nums">{day.dayNum}</span>
                <span
                  className={cn(
                    'mt-1.5 h-1.5 w-1.5 rounded-full',
                    day.count > 0
                      ? day.isToday
                        ? 'bg-white dark:bg-neutral-900'
                        : 'bg-amber-500'
                      : day.isToday
                        ? 'bg-white/40 dark:bg-neutral-900/40'
                        : 'bg-neutral-200 dark:bg-white/10',
                  )}
                />
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Calendar, timer, next deadline */}
      <section className="grid min-w-0 items-start gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        <CalendarCard events={openDeadlines} />
        <TimerCard />

        <div className="space-y-5 lg:col-span-2 xl:col-span-1">
          <NextDeadlineCard item={nextDeadline} />

          <SectionCard title="Research overview" description="Progress across your work.">
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={muted}>Average project completion</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{overallProgress}%</span>
                </div>
                <ProgressBar value={overallProgress} label="Average project completion" barClass="bg-sky-500 dark:bg-sky-400" />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={muted}>Tasks completed</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {completedTasks.length}/{tasks.length}
                  </span>
                </div>
                <ProgressBar value={taskCompletionRate} label="Task completion" barClass="bg-emerald-500 dark:bg-emerald-400" />
              </div>
            </div>
          </SectionCard>
        </div>
      </section>

      {/* Status breakdowns */}
      <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        <SectionCard title="Project status" description="Where your projects stand.">
          <Breakdown items={projectBreakdown} total={projects.length} emptyLabel="Create a project to see its status here." />
        </SectionCard>

        <SectionCard title="Task status" description="How your tasks are distributed.">
          <Breakdown items={taskBreakdown} total={tasks.length} emptyLabel="Tasks assigned to you will show up here." />
        </SectionCard>

        <SectionCard title="Completion snapshot" description="Overall delivery health.">
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                <span className={muted}>Projects done</span>
                <span className="font-semibold tabular-nums text-neutral-900 dark:text-white">
                  {completedProjects.length}/{projects.length || 0}
                </span>
              </div>
              <ProgressBar
                value={projects.length ? Math.round((completedProjects.length / projects.length) * 100) : 0}
                label="Projects completed"
               barClass="bg-violet-500 dark:bg-violet-400" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                <span className={muted}>Tasks done</span>
                <span className="font-semibold tabular-nums text-neutral-900 dark:text-white">
                  {completedTasks.length}/{tasks.length || 0}
                </span>
              </div>
              <ProgressBar value={taskCompletionRate} label="Tasks completed" barClass="bg-emerald-500 dark:bg-emerald-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.04]">
                <p className={cn('text-[11px]', muted)}>Overdue</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-white">
                  {overdueCount}
                </p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.04]">
                <p className={cn('text-[11px]', muted)}>Due in 7 days</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-white">
                  {dueThisWeek}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      {/* Projects + tasks */}
      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.85fr)]">
        <SectionCard
          title="Recent projects"
          description="Your latest project activity."
          action={<Link to="/app/projects" className={linkAction}>View all<ArrowRight size={15} /></Link>}
        >
          {recentProjects.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {recentProjects.map((project, index) => (
                <ProjectCard key={project?.id || project?.project_id || index} project={project} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderKanban}
              tone="violet"
              title="No projects yet"
              description="Create your first project to start organising your research."
              action={<Link to="/app/projects/new" className={primaryButton}><Plus size={15} />Create project</Link>}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Upcoming tasks"
          description="Outstanding work and deadlines."
          action={<Link to="/app/submissions" className={linkAction}>View all<ArrowRight size={15} /></Link>}
        >
          {upcomingTasks.length ? (
            <div className="divide-y divide-neutral-100 dark:divide-white/[0.07]">
              {upcomingTasks.map((task, index) => (
                <TaskRow key={task?.id || task?.submission_id || index} task={task} />
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle2} tone="emerald" title="No pending tasks" description="There are no outstanding tasks right now." />
          )}
        </SectionCard>
      </section>

      {/* Activity, invitations, quick actions */}
      <section className="grid min-w-0 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <SectionCard
          title="Recent activity"
          description="Latest updates from your workspace."
          action={<Link to="/app/notifications" className={linkAction}>View all<ArrowRight size={15} /></Link>}
        >
          {recentNotifications.length ? (
            <ul>
              {recentNotifications.map((notification, index) => (
                <ActivityRow
                  key={notification?.id || index}
                  notification={notification}
                  isLast={index === recentNotifications.length - 1}
                />
              ))}
            </ul>
          ) : (
            <EmptyState icon={Activity} tone="sky" title="No activity yet" description="Project updates and announcements will appear here." />
          )}
        </SectionCard>

        <SectionCard
          title="Team invitations"
          description="Requests to collaborate on projects."
          action={<Link to="/app/invitations" className={linkAction}>View all<ArrowRight size={15} /></Link>}
        >
          {pendingInvitations.length ? (
            <div className="space-y-3">
              {pendingInvitations.slice(0, 3).map((invitation, index) => (
                <InvitationRow key={invitation?.id || index} invitation={invitation} />
              ))}
              <Link to="/app/invitations" className={cn(secondaryButton, 'w-full')}>
                Manage invitations
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <EmptyState icon={Users} tone="violet" title="No pending invitations" description="Collaboration invitations will appear here." />
          )}
        </SectionCard>

        <SectionCard title="Quick actions" description="Go directly to your workspace." className="lg:col-span-2 xl:col-span-1">
          <div className="grid gap-3">
            <QuickAction to="/app/projects" icon={FolderOpen} title="My projects" description="View projects and track progress" tone="sky" />
            <QuickAction to="/app/submissions" icon={FileText} title="Submissions" description="Manage your submitted work" badge={pendingTasks.length} tone="amber" />
            <QuickAction to="/app/invitations" icon={Users} title="Team invitations" description="Review collaboration requests" badge={pendingInvitations.length} tone="violet" />
            <QuickAction to="/app/notifications" icon={Bell} title="Notifications" description="Read updates and announcements" badge={unreadNotifications.length} tone="emerald" />
          </div>
        </SectionCard>
      </section>

      {/* Guidance + more shortcuts */}
      <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <SectionCard title="Suggested next steps" description="Priorities based on your current workload.">
          <div className="space-y-3">
            {tips.map((tip) => {
              const TipIcon = tip.icon;
              return (
                <div
                  key={tip.title}
                  className="flex gap-3 rounded-xl border border-neutral-200 p-3.5 dark:border-white/10"
                >
                  <div className={cn(iconBox, 'h-10 w-10', TONES[tip.tone])}>
                    <TipIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{tip.title}</p>
                    <p className={cn('mt-1 text-xs leading-5', muted)}>{tip.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Workspace links" description="Jump to the rest of your tools.">
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickAction to="/app/groups" icon={Users} title="My groups" description="Submission groups you belong to" tone="emerald" />
            <QuickAction to="/app/ideas" icon={Lightbulb} title="Ideas library" description="Browse project ideas" tone="amber" />
            <QuickAction to="/app/projects/join" icon={Hash} title="Join by ID" description="Enter a project invite code" tone="sky" />
            <QuickAction to="/app/profile" icon={GraduationCap} title="Profile" description="Update your academic details" tone="violet" />
          </div>
        </SectionCard>
      </section>

      {/* At-a-glance footer strip */}
      <section className={cn(card, 'grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4')}>
        {[
          { label: 'Active projects', value: activeProjects.length, icon: FolderKanban, tone: 'sky' },
          { label: 'Open tasks', value: pendingTasks.length, icon: ClipboardList, tone: 'amber' },
          { label: 'Due this week', value: dueThisWeek, icon: CalendarDays, tone: 'violet' },
          { label: 'Unread', value: unreadNotifications.length, icon: Bell, tone: 'emerald' },
        ].map((item) => {
          const I = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <div className={cn(iconBox, 'h-10 w-10', TONES[item.tone])}>
                <I size={18} />
              </div>
              <div>
                <p className={cn('text-xs', muted)}>{item.label}</p>
                <p className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-white">{item.value}</p>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}