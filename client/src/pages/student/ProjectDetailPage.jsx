import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  // Navigation & actions
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Download,
  Copy,
  Check,
  RefreshCw,
  Send,
  Pencil,
  Sparkles,
  // Status & health
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  CalendarClock,
  CircleX,
  CircleCheck,
  CircleDotDashed,
  CircleDot,
  Circle,
  Loader2,
  // Project meta
  FolderKanban,
  Hash,
  Layers,
  Eye,
  GitBranch,
  Target,
  TrendingUp,
  Flag,
  Rocket,
  // Team
  Users,
  Crown,
  UserCircle,
  UserPlus,
  // Tabs
  LayoutDashboard,
  ListTodo,
  ClipboardList,
  Activity,
  FileText,
  Code2,
  // Misc
  Inbox,
  Briefcase,
  CalendarDays,
  Globe,
  ShieldCheck,
  Link2,
  Scale,
  Type,
  Tag,
  CalendarRange,
  History,
  Image as ImageIcon,
  FileArchive,
  FileSpreadsheet,
  FileVideo,
  File as FileIcon,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../features/auth/AuthContext';
import { cn, formatDate } from '../../lib/utils';

// ─── Design tokens ──────────────────────────────────────────────────────────

const card =
  'rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900';

const STATUS_STYLE = {
  draft:
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  awaiting_members:
    'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  submitted:
    'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  under_review:
    'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  changes_requested:
    'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  approved:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  rejected:
    'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const STATUS_DOT = {
  draft: 'bg-slate-400',
  awaiting_members: 'bg-amber-500',
  submitted: 'bg-sky-500',
  under_review: 'bg-violet-500',
  changes_requested: 'bg-orange-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
};

const HEALTH_STYLE = {
  on_track: {
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
    bar: 'bg-emerald-500',
    ring: '#10b981',
    label: 'On Track',
    icon: CheckCircle2,
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  at_risk: {
    pill: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
    bar: 'bg-amber-500',
    ring: '#f59e0b',
    label: 'At Risk',
    icon: AlertCircle,
    accent: 'text-amber-600 dark:text-amber-400',
  },
  delayed: {
    pill: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-900',
    bar: 'bg-orange-500',
    ring: '#f97316',
    label: 'Delayed',
    icon: Clock,
    accent: 'text-orange-600 dark:text-orange-400',
  },
  blocked: {
    pill: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900',
    bar: 'bg-red-500',
    ring: '#ef4444',
    label: 'Blocked',
    icon: CircleX,
    accent: 'text-red-600 dark:text-red-400',
  },
  completed: {
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
    bar: 'bg-emerald-500',
    ring: '#10b981',
    label: 'Completed',
    icon: CircleCheck,
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
};

const PRIORITY_STYLE = {
  low: {
    pill: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
    icon: CircleDot,
  },
  medium: {
    pill: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-300',
    dot: 'bg-sky-500',
    icon: CircleDotDashed,
  },
  high: {
    pill: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300',
    dot: 'bg-orange-500',
    icon: AlertTriangle,
  },
  urgent: {
    pill: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300',
    dot: 'bg-red-500',
    icon: AlertCircle,
  },
};

const TASK_STATUS_STYLE = {
  todo: {
    pill: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
    icon: Circle,
    label: 'To Do',
  },
  in_progress: {
    pill: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-300',
    dot: 'bg-sky-500',
    icon: CircleDotDashed,
    label: 'In Progress',
  },
  blocked: {
    pill: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300',
    dot: 'bg-red-500',
    icon: CircleX,
    label: 'Blocked',
  },
  completed: {
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    icon: CircleCheck,
    label: 'Completed',
  },
};

const REVIEW_DECISION_STYLE = {
  approved:
    'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
  rejected:
    'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300',
  changes_requested:
    'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300',
};

const REVIEW_DECISION_ICON = {
  approved: CheckCircle2,
  rejected: CircleX,
  changes_requested: AlertTriangle,
};

const STAGE_LABELS = {
  idea: 'Idea',
  planning: 'Planning',
  design: 'Design',
  development: 'Development',
  testing: 'Testing',
  completed: 'Completed',
  maintenance: 'Maintenance',
};

const STAGE_ICONS = {
  idea: Sparkles,
  planning: Target,
  design: Pencil,
  development: Code2,
  testing: AlertTriangle,
  completed: Rocket,
  maintenance: RefreshCw,
};

const FILE_ICON_CONFIG = [
  { test: (m) => m?.startsWith('image/'), Icon: ImageIcon, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950' },
  { test: (m) => m?.startsWith('video/'), Icon: FileVideo, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
  { test: (m) => m === 'application/pdf' || m?.includes('pdf'), Icon: FileText, color: 'text-red-500 bg-red-50 dark:bg-red-950' },
  { test: (m) => m?.includes('sheet') || m?.includes('csv') || m?.includes('excel'), Icon: FileSpreadsheet, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
  { test: (m) => m?.includes('zip') || m?.includes('compressed') || m?.includes('rar'), Icon: FileArchive, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950' },
  { test: (m) => m?.includes('msword') || m?.includes('document'), Icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
  { test: () => true, Icon: FileIcon, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
];

const getFileIcon = (mime) => {
  const cfg = FILE_ICON_CONFIG.find((c) => c.test(mime));
  return cfg || FILE_ICON_CONFIG[FILE_ICON_CONFIG.length - 1];
};

const ACTIVITY_ICON_MAP = {
  task: { Icon: ListTodo, color: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300' },
  project: { Icon: FolderKanban, color: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300' },
  member: { Icon: Users, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300' },
  file: { Icon: FileText, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300' },
  link: { Icon: Link2, color: 'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300' },
  review: { Icon: ClipboardList, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300' },
  milestone: { Icon: Flag, color: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300' },
  default: { Icon: Activity, color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
};

const getActivityIcon = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('task')) return ACTIVITY_ICON_MAP.task;
  if (a.includes('member')) return ACTIVITY_ICON_MAP.member;
  if (a.includes('file') || a.includes('upload')) return ACTIVITY_ICON_MAP.file;
  if (a.includes('link')) return ACTIVITY_ICON_MAP.link;
  if (a.includes('review') || a.includes('approval') || a.includes('submit')) return ACTIVITY_ICON_MAP.review;
  if (a.includes('milestone')) return ACTIVITY_ICON_MAP.milestone;
  if (a.includes('project') || a.includes('status')) return ACTIVITY_ICON_MAP.project;
  return ACTIVITY_ICON_MAP.default;
};

// ─── Tab definition ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'milestones', label: 'Milestones', icon: Flag },
  { id: 'reviews', label: 'Reviews', icon: ClipboardList },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'files', label: 'Files', icon: FileText },
];

// ─── Small UI helpers ───────────────────────────────────────────────────────

function Avatar({ name, src, size = 36, ring = false }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700 dark:from-slate-700 dark:to-slate-800 dark:text-slate-200',
        ring && 'ring-2 ring-white dark:ring-slate-900'
      )}
      style={{ width: size, height: size }}
      title={name}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={cn('font-semibold', size <= 24 ? 'text-[10px]' : 'text-xs')}>
          {initial}
        </span>
      )}
    </div>
  );
}

function Badge({ children, className, dot, icon: Icon }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

function StatusPill({ status, size = 'sm' }) {
  const cfg = TASK_STATUS_STYLE[status] || TASK_STATUS_STYLE.todo;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset',
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        STATUS_STYLE[status] || STATUS_STYLE.draft
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status] || STATUS_DOT.draft)} />
      {(status || 'draft').replace(/_/g, ' ')}
    </span>
  );
}

function SectionCard({ title, subtitle, action, children, className, bodyClassName, icon: Icon }) {
  return (
    <section className={cn(card, 'overflow-hidden', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

function CopyCode({ code }) {
  const [ok, setOk] = useState(false);
  if (!code) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setOk(true);
          toast.success('Project ID copied');
          setTimeout(() => setOk(false), 1500);
        } catch {
          toast.error('Copy failed');
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      title="Copy Project ID"
    >
      <Hash size={12} className="text-slate-400" />
      {code}
      {ok ? (
        <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy size={12} className="text-slate-400" />
      )}
    </button>
  );
}

function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icon size={22} />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {desc && <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
      {action}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, capitalize }) {
  const isMissing = value === null || value === undefined || value === '';
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        {Icon && <Icon className="h-3 w-3 text-slate-400" />}
        {label}
      </dt>
      <dd
        className={cn(
          'text-right text-xs font-medium',
          isMissing ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100',
          capitalize && 'capitalize'
        )}
      >
        {isMissing ? '—' : value}
      </dd>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

// ─── Circular progress gauge (SVG) ──────────────────────────────────────────

function CircularProgress({
  value,
  size = 120,
  stroke = 10,
  color = '#10b981',
  label,
  sublabel,
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={stroke}
          className="text-slate-400"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}%</span>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
        )}
        {sublabel && <span className="text-[10px] text-slate-400">{sublabel}</span>}
      </div>
    </div>
  );
}

// ─── Stat tile ──────────────────────────────────────────────────────────────

function StatTile({ icon: Icon, value, label, hint, tone = 'default' }) {
  const toneStyle = {
    default: {
      bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      value: 'text-slate-900 dark:text-white',
    },
    danger: {
      bg: 'bg-red-500 text-white',
      value: 'text-red-600 dark:text-red-400',
    },
    success: {
      bg: 'bg-emerald-500 text-white',
      value: 'text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      bg: 'bg-amber-500 text-white',
      value: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      bg: 'bg-sky-500 text-white',
      value: 'text-sky-600 dark:text-sky-400',
    },
  }[tone];

  return (
    <div className={cn(card, 'p-4')}>
      <div className="flex items-start justify-between">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', toneStyle.bg)}>
          <Icon size={16} />
        </span>
        <span className={cn('text-xl font-bold tabular-nums', toneStyle.value)}>{value}</span>
      </div>
      <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-200">{label}</p>
      {hint && <p className="text-[10px] text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Milestone timeline item ────────────────────────────────────────────────

function MilestoneItem({ m, isLast }) {
  const completed = m.status === 'completed';
  const missed = m.status === 'missed';
  const Icon = completed ? CircleCheck : missed ? CircleX : CircleDotDashed;
  const color = completed
    ? 'text-emerald-600 dark:text-emerald-400'
    : missed
      ? 'text-red-600 dark:text-red-400'
      : 'text-slate-400';

  return (
    <li className={cn('relative pl-7', !isLast && 'pb-4')}>
      {/* Connector line */}
      {!isLast && (
        <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200 dark:bg-slate-700" />
      )}
      <span className="absolute left-0 top-0.5">
        <Icon size={16} className={color} />
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn('text-sm font-medium', missed && 'text-slate-500 line-through')}>
          {m.title}
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset',
            completed
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
              : missed
                ? 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300'
                : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300'
          )}
        >
          {m.status}
        </span>
      </div>
      {m.description && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{m.description}</p>
      )}
      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
        <CalendarClock size={10} />
        {m.planned_date ? formatDate(m.planned_date) : 'No planned date'}
        {m.completed_at && (
          <>
            <ChevronRight size={10} />
            <CheckCircle2 size={10} className="text-emerald-500" />
            {formatDate(m.completed_at)}
          </>
        )}
      </p>
    </li>
  );
}

// ─── Review timeline item ───────────────────────────────────────────────────

function ReviewItem({ r, isLast }) {
  const decision = r.decision;
  const DecisionIcon = REVIEW_DECISION_ICON[decision] || AlertCircle;
  const cls = REVIEW_DECISION_STYLE[decision] || 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <li className={cn('relative pl-7', !isLast && 'pb-5')}>
      {!isLast && (
        <span className="absolute left-[10px] top-6 h-full w-px bg-slate-200 dark:bg-slate-700" />
      )}
      <span
        className={cn(
          'absolute left-0 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900',
          decision === 'approved'
            ? 'bg-emerald-500'
            : decision === 'rejected'
              ? 'bg-red-500'
              : 'bg-orange-500'
        )}
      >
        <DecisionIcon size={10} className="text-white" />
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Avatar name={r.reviewer?.full_name} src={r.reviewer?.avatar_url} size={22} />
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {r.reviewer?.full_name || 'Reviewer'}
        </p>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset', cls)}>
          {decision.replace(/_/g, ' ')}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
          <History size={10} />
          Rev {r.revision || 1}
        </span>
        <span className="text-[11px] text-slate-400">{formatDate(r.created_at)}</span>
      </div>
      {r.overall_comment && (
        <p className="mt-1.5 rounded-lg border-l-2 border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          "{r.overall_comment}"
        </p>
      )}
      {r.rubric?.name && (
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400">
          <ClipboardList size={10} />
          Rubric: {r.rubric.name}
        </p>
      )}
    </li>
  );
}

// ─── Activity timeline item ─────────────────────────────────────────────────

function ActivityItem({ a, isLast }) {
  const cfg = getActivityIcon(a.action);
  const Icon = cfg.Icon;
  return (
    <li className={cn('relative pl-9', !isLast && 'pb-4')}>
      {!isLast && (
        <span className="absolute left-[14px] top-8 h-full w-px bg-slate-200 dark:bg-slate-700" />
      )}
      <span
        className={cn(
          'absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900',
          cfg.color
        )}
      >
        <Icon size={13} />
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Avatar name={a.actor?.full_name} src={a.actor?.avatar_url} size={20} />
        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {a.actor?.full_name || 'System'}
        </span>
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {a.action?.replace(/[\._]/g, ' ')}
        </code>
        <span className="text-[11px] text-slate-400">{formatDate(a.created_at)}</span>
      </div>
      {a.metadata && Object.keys(a.metadata).length > 0 && (
        <p className="mt-0.5 text-[11px] text-slate-400">
          {Object.entries(a.metadata)
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${typeof v === 'string' || typeof v === 'number' ? v : '…'}`)
            .join(' · ')}
        </p>
      )}
    </li>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');

  // Parallel data fetch
  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: !!projectId,
  });
  const progressQuery = useQuery({
    queryKey: ['progress', projectId],
    queryFn: () => api.getProgress(projectId),
    enabled: !!projectId,
  });
  const tasksQuery = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.listTasks(projectId),
    enabled: !!projectId,
  });
  const milestonesQuery = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => api.listMilestones(projectId),
    enabled: !!projectId,
  });
  const reviewsQuery = useQuery({
    queryKey: ['reviews', projectId],
    queryFn: () => api.getProjectReviews(projectId),
    enabled: !!projectId,
  });
  const activityQuery = useQuery({
    queryKey: ['activity', projectId],
    queryFn: () => api.listActivity(projectId),
    enabled: !!projectId,
  });
  const filesQuery = useQuery({
    queryKey: ['files', projectId],
    queryFn: () => api.listFiles(projectId),
    enabled: !!projectId,
  });

  const isLoading = projectQuery.isLoading;
  const error = projectQuery.error;
  const p = projectQuery.data?.project;
  const progress = progressQuery.data;
  const tasks = tasksQuery.data?.tasks || [];
  const milestones = milestonesQuery.data || [];
  const reviews = reviewsQuery.data?.reviews || [];
  const activity = activityQuery.data?.activity || [];
  const files = filesQuery?.data || [];

  // ─── Submit / Resubmit mutations ──────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: () => api.submitProject(projectId),
    onSuccess: () => {
      toast.success('Project submitted for review');
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (err) => {
      if (err.fieldErrors) {
        const msgs = Object.entries(err.fieldErrors)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ');
        toast.error(msgs || err.message);
      } else {
        toast.error(err.message || 'Submit failed');
      }
    },
  });
  const resubmitMutation = useMutation({
    mutationFn: () => api.resubmitProject(projectId),
    onSuccess: () => {
      toast.success('Project resubmitted');
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (err) => toast.error(err.message || 'Resubmit failed'),
  });

  // ─── Derived values ───────────────────────────────────────────────────────
  const activeMembers = useMemo(
    () => (p?.members || []).filter((m) => m.membership_status === 'active'),
    [p]
  );
  const leader = activeMembers.find((m) => m.team_role === 'leader');
  const isLeader = leader?.student_id === user?.id || p?.created_by === user?.id;

  const openTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const blockedTasks = tasks.filter((t) => t.status === 'blocked');
  const overdueTasks = openTasks.filter((t) => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date();
  });

  const daysLeft = useMemo(() => {
    if (!p?.target_end_date) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(p.target_end_date);
    end.setHours(0, 0, 0, 0);
    return Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [p]);

  const health = progress?.health || 'on_track';
  const hStyle = HEALTH_STYLE[health] || HEALTH_STYLE.on_track;
  const HealthIcon = hStyle.icon;
  const StageIcon = STAGE_ICONS[p?.stage] || Sparkles;

  // Tab counts
  const tabCounts = {
    team: activeMembers.length,
    tasks: tasks.length,
    milestones: milestones.length,
    reviews: reviews.length,
    activity: activity.length,
    files: files.length,
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error || !p) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/app/projects')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft size={14} /> Back to projects
        </button>
        <div className={cn(card, 'p-10 text-center')}>
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <p className="mt-3 font-semibold text-red-600 dark:text-red-400">
            {error?.message || 'Project not found'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            The project may have been deleted or you don't have access.
          </p>
          <Link
            to="/app/projects"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
          >
            <ArrowLeft size={14} /> All projects
          </Link>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const canSubmit = ['draft', 'awaiting_members', 'changes_requested'].includes(p.status);
  const canResubmit = p.status === 'changes_requested';
  const canSetup = ['draft', 'awaiting_members', 'changes_requested'].includes(p.status);

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumbs ──────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/app/projects" className="hover:text-slate-700 dark:hover:text-slate-300">
          Projects
        </Link>
        <ChevronDown className="h-3 w-3 -rotate-90" />
        <span className="truncate font-medium text-slate-700 dark:text-slate-200">{p.title}</span>
      </nav>

      {/* ─── Hero cover ────────────────────────────────────────────────────── */}
      <div className={cn(card, 'overflow-hidden')}>
        {/* Gradient banner */}
        <div className="relative h-24 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-200 dark:to-slate-300">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 30%, rgba(255,255,255,0.3) 0, transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.2) 0, transparent 40%)',
            }}
          />
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <StatusPill status={p.status} />
            <Badge className={hStyle.pill} icon={HealthIcon}>
              {hStyle.label}
            </Badge>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-8">
            <div className="flex items-end gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-900 text-white shadow-lg dark:border-slate-950 dark:bg-white dark:text-slate-900">
                <FolderKanban size={28} />
              </span>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CopyCode code={p.project_code} />
                  <Badge
                    className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    icon={StageIcon}
                  >
                    {STAGE_LABELS[p.stage] || p.stage}
                  </Badge>
                  {p.category?.name && (
                    <Badge
                      className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      icon={Tag}
                    >
                      {p.category.name}
                    </Badge>
                  )}
                  {p.visibility && (
                    <Badge
                      className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      icon={Eye}
                    >
                      <span className="capitalize">{p.visibility}</span>
                    </Badge>
                  )}
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {p.title}
                </h1>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <Link
                to={`/app/projects/${p.id}`}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <Pencil size={14} /> Open workspace
              </Link>
              {canSetup && (
                <Link
                  to={`/app/projects/${p.id}/setup`}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <Sparkles size={14} /> Continue setup
                </Link>
              )}
              {canResubmit && (
                <button
                  type="button"
                  onClick={() => resubmitMutation.mutate()}
                  disabled={resubmitMutation.isPending}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {resubmitMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Resubmit
                </button>
              )}
              {canSubmit && !canResubmit && isLeader && (
                <button
                  type="button"
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Submit for review
                </button>
              )}
            </div>
          </div>

          {p.short_description && (
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400">
              {p.short_description}
            </p>
          )}

          {/* Quick meta row */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Users size={12} className="text-slate-400" /> {activeMembers.length} member{activeMembers.length === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ListTodo size={12} className="text-slate-400" /> {completedTasks.length}/{tasks.length} tasks done
            </span>
            {p.technologies?.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Code2 size={12} className="text-slate-400" /> {p.technologies.length} tech
              </span>
            )}
            {p.start_date && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock size={12} className="text-slate-400" /> Started {formatDate(p.start_date)}
              </span>
            )}
            {daysLeft !== null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ring-1 ring-inset',
                  daysLeft < 0
                    ? 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300'
                    : daysLeft <= 14
                      ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300'
                )}
              >
                <Clock size={12} /> {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Circular gauges + stat tiles row ────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Gauges */}
        <div className={cn(card, 'flex flex-wrap items-center justify-around gap-6 p-6')}>
          <div className="flex flex-col items-center">
            <CircularProgress
              value={progress?.task_progress ?? 0}
              color={hStyle.ring}
              label="Tasks"
              sublabel={`${progress?.completed_tasks ?? 0}/${progress?.total_tasks ?? 0}`}
            />
          </div>
          {progress?.milestone_progress !== null && progress?.milestone_progress !== undefined && (
            <div className="flex flex-col items-center">
              <CircularProgress
                value={progress.milestone_progress}
                size={100}
                stroke={8}
                color="#6366f1"
                label="Milestones"
                sublabel={`${progress.completed_milestones}/${progress.total_milestones}`}
              />
            </div>
          )}
          <div className="flex flex-col items-center">
            <CircularProgress
              value={tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0}
              size={100}
              stroke={8}
              color="#10b981"
              label="Completion"
              sublabel={`${completedTasks.length}/${tasks.length}`}
            />
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile
            icon={ListTodo}
            value={openTasks.length}
            label="Open tasks"
            hint={`${completedTasks.length} done`}
            tone="info"
          />
          <StatTile
            icon={CircleX}
            value={blockedTasks.length}
            label="Blocked"
            hint={blockedTasks.length ? 'Needs attention' : 'All clear'}
            tone={blockedTasks.length > 0 ? 'danger' : 'default'}
          />
          <StatTile
            icon={Clock}
            value={overdueTasks.length}
            label="Overdue"
            hint={overdueTasks.length ? 'Past due' : 'On schedule'}
            tone={overdueTasks.length > 0 ? 'danger' : 'default'}
          />
          <StatTile
            icon={Flag}
            value={`${progress?.completed_milestones ?? 0}/${progress?.total_milestones ?? 0}`}
            label="Milestones"
            hint={milestones.length ? `${milestones.length} total` : 'None set'}
            tone="success"
          />
          <StatTile
            icon={FileText}
            value={files.length}
            label="Files"
            hint="Uploaded"
            tone="default"
          />
          <StatTile
            icon={Users}
            value={activeMembers.length}
            label="Team"
            hint={leader ? `Led by ${leader.student?.full_name?.split(' ')[0] || '—'}` : 'No leader'}
            tone="default"
          />
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white/80 px-1 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = tabCounts[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
                tab === id
                  ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count !== undefined && count !== null && (
                <span
                  className={cn(
                    'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    tab === id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Tab content ───────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: project info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Problem statement */}
            {p.problem_statement && (
              <SectionCard
                title="Problem statement"
                subtitle="What this project is solving"
                icon={Target}
                bodyClassName="p-5"
              >
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {p.problem_statement}
                </p>
              </SectionCard>
            )}

            {/* Objectives */}
            {p.objectives?.length > 0 && (
              <SectionCard
                title="Objectives"
                subtitle={`${p.objectives.length} goals to achieve`}
                icon={TrendingUp}
                bodyClassName="p-5"
              >
                <ol className="space-y-2">
                  {p.objectives.map((o, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{o}</span>
                    </li>
                  ))}
                </ol>
              </SectionCard>
            )}

            {/* Technologies */}
            {p.technologies?.length > 0 && (
              <SectionCard
                title="Tech stack"
                subtitle={`${p.technologies.length} technologies in use`}
                icon={Code2}
                bodyClassName="p-5"
              >
                <div className="flex flex-wrap gap-2">
                  {p.technologies.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <GitBranch size={12} className="text-slate-400" />
                      {t.technology?.name || 'Unknown'}
                      <span
                        className={cn(
                          'ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ring-1 ring-inset',
                          t.usage_status === 'in_use'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            : t.usage_status === 'replaced'
                              ? 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-300'
                        )}
                      >
                        {t.usage_status.replace(/_/g, ' ')}
                      </span>
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Recent tasks preview */}
            <SectionCard
              title="Recent tasks"
              subtitle="Latest updates from the workspace"
              icon={ListTodo}
              bodyClassName="p-5"
              action={
                <button
                  type="button"
                  onClick={() => setTab('tasks')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  View all <ArrowUpRight size={12} />
                </button>
              }
            >
              {tasksQuery.isLoading ? (
                <div className="flex min-h-24 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : tasks.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No tasks yet"
                  desc="Open the workspace to plan your first tasks."
                />
              ) : (
                <ul className="space-y-2">
                  {tasks.slice(0, 4).map((t) => {
                    const sCfg = TASK_STATUS_STYLE[t.status] || TASK_STATUS_STYLE.todo;
                    const pCfg = PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.medium;
                    const StatusIcon = sCfg.icon;
                    return (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                      >
                        <StatusIcon size={16} className={cn('shrink-0', sCfg.dot.replace('bg-', 'text-'))} />
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {t.title}
                        </p>
                        <span
                          className={cn(
                            'shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
                            pCfg.pill
                          )}
                        >
                          {t.priority}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>
          </div>

          {/* Right column: details + team mini */}
          <div className="space-y-6">
            <SectionCard
              title="Project details"
              subtitle="Metadata & timeline"
              icon={Briefcase}
              bodyClassName="space-y-3"
            >
              <DetailRow icon={Type} label="Type" value={p.project_type} capitalize />
              <DetailRow icon={Scale} label="Ownership" value={p.ownership_mode} capitalize />
              <DetailRow icon={StageIcon} label="Stage" value={STAGE_LABELS[p.stage] || p.stage} />
              <DetailRow icon={Eye} label="Visibility" value={p.visibility} capitalize />
              {p.category && <DetailRow icon={Tag} label="Category" value={p.category.name} />}
              <DetailRow
                icon={CalendarRange}
                label="Duration"
                value={
                  p.duration_min_months && p.duration_max_months
                    ? `${p.duration_min_months}–${p.duration_max_months} months`
                    : null
                }
              />
              {p.start_date && <DetailRow icon={CalendarDays} label="Started" value={formatDate(p.start_date)} />}
              {p.target_end_date && (
                <DetailRow icon={CalendarClock} label="Target end" value={formatDate(p.target_end_date)} />
              )}
              {p.submitted_at && (
                <DetailRow icon={Send} label="Submitted" value={formatDate(p.submitted_at)} />
              )}
              <DetailRow icon={History} label="Created" value={formatDate(p.created_at)} />
              <DetailRow icon={RefreshCw} label="Updated" value={formatDate(p.updated_at)} />
            </SectionCard>

            <SectionCard
              title="Team"
              subtitle={`${activeMembers.length} active member${activeMembers.length === 1 ? '' : 's'}`}
              icon={Users}
              bodyClassName="p-5"
              action={
                <button
                  type="button"
                  onClick={() => setTab('team')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  View all <ArrowUpRight size={12} />
                </button>
              }
            >
              <ul className="space-y-3">
                {activeMembers.slice(0, 5).map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <Avatar name={m.student?.full_name} src={m.student?.avatar_url} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {m.student?.full_name || 'Member'}
                      </p>
                      {m.student?.registration_number && (
                        <p className="truncate text-[11px] text-slate-500">{m.student.registration_number}</p>
                      )}
                    </div>
                    {m.team_role === 'leader' ? (
                      <Badge
                        className="bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300"
                        icon={Crown}
                      >
                        Leader
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300">
                        Member
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ─── Team tab ──────────────────────────────────────────────────────── */}
      {tab === 'team' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Active members"
            subtitle={`${activeMembers.length} people on the team`}
            icon={Users}
            bodyClassName="space-y-3"
          >
            {activeMembers.length === 0 ? (
              <EmptyState icon={Users} title="No active members" desc="Invite teammates from the workspace." />
            ) : (
              <ul className="space-y-3">
                {activeMembers.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800"
                  >
                    <Avatar name={m.student?.full_name} src={m.student?.avatar_url} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          {m.student?.full_name || 'Member'}
                        </p>
                        {m.team_role === 'leader' ? (
                          <Badge
                            className="bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300"
                            icon={Crown}
                          >
                            Leader
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300">
                            Member
                          </Badge>
                        )}
                      </div>
                      {m.student?.registration_number && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          Reg. no: {m.student.registration_number}
                          {m.student?.roll_number && ` · Roll: ${m.student.roll_number}`}
                        </p>
                      )}
                      {m.student?.bio && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{m.student.bio}</p>
                      )}
                      {m.responsibility && (
                        <p className="mt-1 text-xs">
                          <span className="text-slate-400">Responsibility: </span>
                          <span className="text-slate-700 dark:text-slate-300">{m.responsibility}</span>
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.student?.github_url && (
                          <a
                            href={m.student.github_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            <ExternalLink size={10} /> GitHub
                          </a>
                        )}
                        {m.student?.linkedin_url && (
                          <a
                            href={m.student.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            <ExternalLink size={10} /> LinkedIn
                          </a>
                        )}
                        {m.accepted_at && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <CalendarDays size={10} />
                            joined {formatDate(m.accepted_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Roster (offline team members not yet linked) */}
          {p.roster?.length > 0 && (
            <SectionCard
              title="Roster (offline)"
              subtitle="Pending teammates yet to link their account"
              icon={UserPlus}
              bodyClassName="space-y-2"
            >
              <ul className="space-y-2">
                {p.roster.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 text-sm dark:border-slate-800"
                  >
                    <Avatar name={r.full_name} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-100">{r.full_name}</p>
                      {r.registration_number && (
                        <p className="truncate text-[11px] text-slate-500">{r.registration_number}</p>
                      )}
                    </div>
                    {r.is_leader ? (
                      <Badge
                        className="bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300"
                        icon={Crown}
                      >
                        Leader
                      </Badge>
                    ) : r.linked_student_id ? (
                      <Badge
                        className="bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                        icon={Check}
                      >
                        Linked
                      </Badge>
                    ) : (
                      <Badge
                        className="bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300"
                        icon={Clock}
                      >
                        Pending
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      )}

      {/* ─── Tasks tab ─────────────────────────────────────────────────────── */}
      {tab === 'tasks' && (
        <SectionCard
          title="All tasks"
          subtitle={`${tasks.length} task${tasks.length === 1 ? '' : 's'} total`}
          icon={ListTodo}
          bodyClassName="p-5"
        >
          {tasksQuery.isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No tasks yet"
              desc="Open the workspace to create your first task."
            />
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => {
                const sCfg = TASK_STATUS_STYLE[t.status] || TASK_STATUS_STYLE.todo;
                const pCfg = PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.medium;
                const StatusIcon = sCfg.icon;
                const PriorityIcon = pCfg.icon;
                const overdue = t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date();
                return (
                  <li
                    key={t.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40',
                      overdue
                        ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                        : 'border-slate-100 dark:border-slate-800'
                    )}
                  >
                    <StatusIcon
                      size={16}
                      className={cn('shrink-0', sCfg.dot.replace('bg-', 'text-'))}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {t.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {t.module?.title && (
                          <>
                            <Layers size={10} />
                            {t.module.title}
                            <ChevronRight size={10} />
                          </>
                        )}
                        {t.assignee?.full_name ? (
                          <>
                            <UserCircle size={10} />
                            {t.assignee.full_name}
                          </>
                        ) : (
                          <span className="italic">Unassigned</span>
                        )}
                        {t.due_date && (
                          <>
                            <ChevronRight size={10} />
                            <Clock size={10} className={overdue ? 'text-red-500' : ''} />
                            <span className={overdue ? 'text-red-600 dark:text-red-400' : ''}>
                              {formatDate(t.due_date)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ring-1 ring-inset',
                        pCfg.pill
                      )}
                    >
                      <PriorityIcon size={9} />
                      {t.priority}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      )}

      {/* ─── Milestones tab ────────────────────────────────────────────────── */}
      {tab === 'milestones' && (
        <SectionCard
          title="Milestones"
          subtitle={`${milestones.length} milestone${milestones.length === 1 ? '' : 's'} tracked`}
          icon={Flag}
          bodyClassName="p-5"
        >
          {milestonesQuery.isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : milestones.length === 0 ? (
            <EmptyState
              icon={Flag}
              title="No milestones yet"
              desc="Set key dates to track project phases from the workspace."
            />
          ) : (
            <ol className="space-y-0">
              {milestones.map((m, i) => (
                <MilestoneItem key={m.id} m={m} isLast={i === milestones.length - 1} />
              ))}
            </ol>
          )}
        </SectionCard>
      )}

      {/* ─── Reviews tab ───────────────────────────────────────────────────── */}
      {tab === 'reviews' && (
        <SectionCard
          title="Review history"
          subtitle={`${reviews.length} review${reviews.length === 1 ? '' : 's'} so far`}
          icon={ClipboardList}
          bodyClassName="p-5"
        >
          {reviewsQuery.isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No reviews yet"
              desc="Once submitted, faculty reviews and decisions will appear here."
            />
          ) : (
            <ol className="space-y-0">
              {reviews.map((r, i) => (
                <ReviewItem key={r.id} r={r} isLast={i === reviews.length - 1} />
              ))}
            </ol>
          )}
        </SectionCard>
      )}

      {/* ─── Activity tab ──────────────────────────────────────────────────── */}
      {tab === 'activity' && (
        <SectionCard
          title="Recent activity"
          subtitle={`${activity.length} event${activity.length === 1 ? '' : 's'} recorded`}
          icon={Activity}
          bodyClassName="p-5"
        >
          {activityQuery.isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : activity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity recorded"
              desc="Actions like task creation, file uploads and reviews will appear here."
            />
          ) : (
            <ol className="space-y-0">
              {activity.slice(0, 40).map((a, i) => (
                <ActivityItem key={a.id} a={a} isLast={i === Math.min(activity.length, 40) - 1} />
              ))}
            </ol>
          )}
        </SectionCard>
      )}

      {/* ─── Files tab ─────────────────────────────────────────────────────── */}
      {tab === 'files' && (
        <SectionCard
          title="Project files"
          subtitle={`${files.length} file${files.length === 1 ? '' : 's'} uploaded`}
          icon={FileText}
          bodyClassName="p-5"
        >
          {filesQuery.isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : files.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No files uploaded"
              desc="Share documents, presentations and code archives from the workspace."
            />
          ) : (
            <ul className="space-y-2">
              {files.map((f) => {
                const { Icon, color } = getFileIcon(f.mime_type);
                return (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', color)}>
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {f.original_name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        <UserCircle size={10} />
                        {f.uploader?.full_name || 'Someone'}
                        <ChevronRight size={10} />
                        <CalendarDays size={10} />
                        {formatDate(f.created_at)}
                        {f.size_bytes && (
                          <>
                            <ChevronRight size={10} />
                            {formatBytes(f.size_bytes)}
                          </>
                        )}
                        {f.file_kind && (
                          <>
                            <ChevronRight size={10} />
                            <span className="capitalize">{f.file_kind}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await api.getDownloadUrl(projectId, f.id);
                          if (res?.url) {
                            window.open(res.url, '_blank', 'noopener');
                          }
                        } catch (err) {
                          toast.error(err.message || 'Download failed');
                        }
                      }}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Download size={12} /> Download
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      )}

      {/* ─── Footer link to workspace ──────────────────────────────────────── */}
      <div className={cn(card, 'flex flex-wrap items-center justify-between gap-3 p-5')}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
            <Pencil size={18} />
          </span>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">Open the full workspace</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Edit details, manage tasks, upload files, set milestones, and submit for review.
            </p>
          </div>
        </div>
        <Link
          to={`/app/projects/${p.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Pencil size={14} /> Open workspace
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}
