import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  ChartNoAxesColumn,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Clock3,
  Download,
  FileCheck2,
  FolderKanban,
  FolderOpen,
  FolderPlus,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

import { api } from '../../lib/api';
import { useAuth } from '../../features/auth/AuthContext';
import { formatDate, cn } from '../../lib/utils';

/* ------------------------------------------------------------------ */
/* Design tokens (shared with Groups / Meetings / Landing pages)       */
/* ------------------------------------------------------------------ */

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.04]';

const searchInput =
  'min-h-10 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/[0.04]';

const selectClass =
  'min-h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300';

const primaryBtn =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';

const secondaryBtn =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]';

const TONES = {
  blue: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
};


const ICON = {
  blue: 'text-sky-600 dark:text-sky-300',
  violet: 'text-violet-600 dark:text-violet-300',
  green: 'text-emerald-600 dark:text-emerald-300',
  orange: 'text-orange-600 dark:text-orange-300',
  red: 'text-red-600 dark:text-red-300',
  neutral: 'text-neutral-500 dark:text-neutral-400',
};

const STATUS_TONE = {
  draft: 'neutral',
  awaiting_members: 'orange',
  submitted: 'blue',
  under_review: 'violet',
  changes_requested: 'red',
  approved: 'green',
  rejected: 'red',
  archived: 'neutral',
};

const STATUS_BAR = {
  draft: 'bg-neutral-400',
  awaiting_members: 'bg-amber-500',
  submitted: 'bg-sky-500',
  under_review: 'bg-violet-500',
  changes_requested: 'bg-orange-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  archived: 'bg-neutral-300',
};

const STATUS_LABELS = {
  draft: 'Draft',
  awaiting_members: 'Awaiting members',
  submitted: 'Submitted',
  under_review: 'Under review',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
};

const WIDTH_KEY = 'rf-admin-sidebar-width';
const COLLAPSE_KEY = 'rf-admin-sidebar-collapsed';

const SIDEBAR_ICON = 72;
const SIDEBAR_ICON_SNAP = 140;
const SIDEBAR_MIN_EXPANDED = 200;
const SIDEBAR_MAX = 380;
const SIDEBAR_DEFAULT = 248;

function clampDragWidth(n) {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_ICON, Math.round(n)));
}

const WORKSPACE_NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, tone: 'blue' },
  { id: 'metrics', label: 'Department metrics', icon: Activity, tone: 'violet' },
  { id: 'pipeline', label: 'Project pipeline', icon: ChartNoAxesColumn, tone: 'green' },
  { id: 'reviews', label: 'Review queue', icon: ClipboardList, tone: 'orange' },
  { id: 'groups', label: 'Submission groups', icon: FolderOpen, tone: 'violet' },
  { id: 'recent', label: 'Recent projects', icon: FolderKanban, tone: 'blue' },
  { id: 'actions', label: 'Quick actions', icon: Sparkles, tone: 'green' },
];

const EXPLORE_NAV = [
  { to: '/faculty/dashboard', label: 'Faculty review queue', icon: ClipboardList, tone: 'orange' },
  { to: '/faculty/groups', label: 'Submission groups', icon: Layers3, tone: 'violet' },
  { to: '/faculty/meetings', label: 'Meetings & supervision', icon: CalendarDays, tone: 'blue' },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function getStatusLabel(status) {
  return STATUS_LABELS[status] || (status || 'Unknown').replace(/_/g, ' ');
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDeadlineState(deadline) {
  if (!deadline) return null;

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (day < today) return { label: 'Deadline passed', tone: 'red', icon: AlertCircle };
  if (day.getTime() === today.getTime()) return { label: 'Due today', tone: 'orange', icon: Clock3 };
  return { label: 'Upcoming deadline', tone: 'green', icon: CircleCheck };
}

function downloadCsv(filename, rows) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* UI pieces                                                          */
/* ------------------------------------------------------------------ */

function IconTile({ icon: Icon, tone = 'blue', size = 'normal' }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        size === 'small' ? 'h-9 w-9' : 'h-11 w-11',
        TONES[tone] || TONES.blue,
      )}
    >
      <Icon size={size === 'small' ? 17 : 20} strokeWidth={1.8} />
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        TONES[STATUS_TONE[status] || 'neutral'],
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
      <span className="truncate">{getStatusLabel(status)}</span>
    </span>
  );
}

function SectionHeading({ icon, tone = 'neutral', title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <IconTile icon={icon} tone={tone} size="small" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, description, icon, tone }) {
  return (
    <div
      className={cn(
        card,
        'min-w-0 p-5 transition-colors hover:border-neutral-300 dark:hover:border-white/20',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-neutral-900 dark:text-white">
            {value ?? 0}
          </p>
        </div>
        <IconTile icon={icon} tone={tone} />
      </div>
      <p className="mt-3 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 px-5 py-10 text-center dark:border-white/10">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400">
        <Icon size={22} />
      </span>
      <p className="mt-3 text-sm font-semibold text-neutral-900 dark:text-white">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function ProjectRow({ project, showCategory = false }) {
  return (
    <Link
      to={`/faculty/reviews/${project.id}`}
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-neutral-100 p-3 transition hover:border-neutral-300 hover:bg-neutral-50/70 dark:border-white/[0.07] dark:hover:border-white/15 dark:hover:bg-white/[0.03] sm:p-3.5"
    >
      <IconTile icon={FolderKanban} tone="violet" size="small" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
          {project.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {project.project_code || 'No project code'}
          {showCategory && project.category?.name ? ` · ${project.category.name}` : ''}
          {!showCategory && project.creator?.full_name ? ` · ${project.creator.full_name}` : ''}
        </p>

        {project.submitted_at && !showCategory && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
            <CalendarDays size={11} />
            Submitted {formatDate(project.submitted_at)}
          </p>
        )}
        {showCategory && project.updated_at && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
            <Clock3 size={11} />
            Updated {formatDate(project.updated_at)}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <StatusBadge status={project.status} />
        <ChevronRight
          size={15}
          className="text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:group-hover:text-white"
        />
      </div>
    </Link>
  );
}

function SidebarNavItem({ icon: Icon, label, active = false, collapsed = false, onClick, to, tone = 'neutral' }) {
  const className = cn(
    'group flex min-h-10 w-full items-center rounded-xl text-left text-sm font-medium transition-colors',
    collapsed ? 'mx-auto h-10 w-10 justify-center' : 'gap-3 px-2.5 py-2',
    active
      ? 'bg-neutral-100 text-neutral-900 dark:bg-white/10 dark:text-white'
      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white',
  );

  const content = (
    <>
      {!collapsed ? (
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            TONES[tone] || TONES.neutral,
            active && 'ring-1 ring-neutral-200/80 dark:ring-white/15',
          )}
        >
          <Icon size={15} strokeWidth={1.75} />
        </span>
      ) : (
        <Icon size={18} strokeWidth={1.75} className={cn("shrink-0", ICON[tone] || ICON.neutral)} />
      )}
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      title={collapsed ? label : undefined}
      className={className}
    >
      {content}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const [forceCollapsed, setForceCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(WIDTH_KEY));
      if (Number.isFinite(stored) && stored >= SIDEBAR_ICON) {
        return clampDragWidth(stored);
      }
    } catch {
      /* ignore */
    }
    return SIDEBAR_DEFAULT;
  });
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startW: 0 });
  const [mobileOpen, setMobileOpen] = useState(false);

  const iconOnly = forceCollapsed || sidebarWidth < SIDEBAR_ICON_SNAP;
  const desktopWidth = forceCollapsed || iconOnly ? SIDEBAR_ICON : sidebarWidth;
  const collapsed = iconOnly;
  const [activeSection, setActiveSection] = useState('overview');
  const [signingOut, setSigningOut] = useState(false);
  const [recentSearch, setRecentSearch] = useState('');
  const [recentStatus, setRecentStatus] = useState('all');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: api.getAdminStats,
  });

  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: api.listGroups,
    retry: 1,
  });

  const stats = data?.stats;
  const queue = stats?.review_queue || [];
  const recent = stats?.recent_projects || [];
  const byStatus = stats?.by_status || {};
  const groups = groupsQuery.data?.groups || [];

  const statusEntries = useMemo(
    () => Object.entries(byStatus).sort(([, a], [, b]) => Number(b) - Number(a)),
    [byStatus],
  );

  const statusTotal = Object.values(byStatus).reduce(
    (sum, count) => sum + (Number(count) || 0),
    0,
  );

  const totalProjects = Number(stats?.total_projects) || 0;
  const approved = Number(byStatus.approved) || 0;
  const rejected = Number(byStatus.rejected) || 0;
  const pendingReviews = Number(stats?.awaiting_review) || 0;
  const activeProjects = Number(stats?.active) || 0;
  const students = Number(stats?.students) || 0;
  const faculty = Number(stats?.faculty) || 0;

  const approvalRate = totalProjects > 0 ? Math.round((approved / totalProjects) * 100) : 0;
  const reviewedProjects = approved + rejected;
  const reviewCompletion =
    totalProjects > 0 ? Math.round((reviewedProjects / totalProjects) * 100) : 0;
  const studentsPerFaculty = faculty > 0 ? (students / faculty).toFixed(1) : '–';

  const publishedGroups = groups.filter((group) => group.is_published !== false).length;
  const upcomingGroupDeadlines = groups.filter((group) => {
    const state = getDeadlineState(group.submission_deadline);
    return state?.label === 'Upcoming deadline' || state?.label === 'Due today';
  }).length;

  const attention = [
    {
      label: 'Awaiting review',
      hint: 'Submissions waiting for a decision',
      count: pendingReviews,
      icon: Clock3,
      tone: 'orange',
    },
    {
      label: 'Under review',
      hint: 'Currently being reviewed by faculty',
      count: Number(byStatus.under_review) || 0,
      icon: FileCheck2,
      tone: 'violet',
    },
    {
      label: 'Changes requested',
      hint: 'Teams revising after feedback',
      count: Number(byStatus.changes_requested) || 0,
      icon: AlertCircle,
      tone: 'red',
    },
    {
      label: 'Awaiting members',
      hint: 'Projects still forming their team',
      count: Number(byStatus.awaiting_members) || 0,
      icon: Users,
      tone: 'blue',
    },
  ];

  const filteredRecent = useMemo(() => {
    const term = recentSearch.trim().toLowerCase();

    return recent.filter((project) => {
      const matchesStatus = recentStatus === 'all' || project.status === recentStatus;
      const matchesSearch =
        !term ||
        [project.title, project.project_code, project.category?.name, project.creator?.full_name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [recent, recentSearch, recentStatus]);

  const recentStatuses = useMemo(
    () => [...new Set(recent.map((project) => project.status).filter(Boolean))],
    [recent],
  );

  const quickActions = [
    {
      to: '/faculty/dashboard',
      title: 'Review submissions',
      description: 'Open the review queue to inspect submissions and record decisions.',
      icon: ClipboardList,
      tone: 'orange',
      meta: `${pendingReviews} awaiting review`,
    },
    {
      to: '/faculty/groups',
      title: 'Submission groups',
      description: 'Browse groups by academic year, branch and semester.',
      icon: FolderOpen,
      tone: 'violet',
      meta: `${groups.length} groups`,
    },
    {
      to: '/faculty/groups/new',
      title: 'Create a group',
      description: 'Set up a new submission group with a coordinator and deadline.',
      icon: FolderPlus,
      tone: 'green',
      meta: 'New group',
    },
    {
      to: '/faculty/meetings',
      title: 'Meetings & supervision',
      description: 'Schedule meetings, message students and record supervision notes.',
      icon: MessageSquare,
      tone: 'blue',
      meta: 'Faculty workspace',
    },
  ];

  /* ---------- effects ---------- */

  const hasStats = Boolean(stats);

  useEffect(() => {
    if (!hasStats) return undefined;

    const elements = WORKSPACE_NAV.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -65% 0px', threshold: [0, 0.25, 0.5] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [hasStats]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const onKey = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  /* ---------- actions ---------- */


  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, forceCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [forceCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(WIDTH_KEY, String(sidebarWidth));
    } catch {
      /* ignore */
    }
  }, [sidebarWidth]);

  const onPointerMove = useCallback((event) => {
    if (!dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    const next = clampDragWidth(dragRef.current.startW + delta);
    setSidebarWidth(next);
    if (next >= SIDEBAR_MIN_EXPANDED) setForceCollapsed(false);
  }, []);

  const stopResize = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    setSidebarWidth((w) => {
      if (w < SIDEBAR_ICON_SNAP) {
        setForceCollapsed(true);
        return SIDEBAR_ICON;
      }
      if (w < SIDEBAR_MIN_EXPANDED) {
        setForceCollapsed(false);
        return SIDEBAR_MIN_EXPANDED;
      }
      setForceCollapsed(false);
      return w;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('pointercancel', stopResize);
    };
  }, [onPointerMove, stopResize]);

  function startResize(event) {
    event.preventDefault();
    const startW = forceCollapsed ? SIDEBAR_ICON : sidebarWidth;
    dragRef.current = { active: true, startX: event.clientX, startW };
    setIsResizing(true);
    setForceCollapsed(false);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function handleResizeDoubleClick() {
    setForceCollapsed(false);
    setSidebarWidth(SIDEBAR_DEFAULT);
  }

  function toggleCollapse() {
    if (forceCollapsed || iconOnly) {
      setForceCollapsed(false);
      setSidebarWidth((w) => (w < SIDEBAR_MIN_EXPANDED ? SIDEBAR_DEFAULT : w));
    } else {
      setForceCollapsed(true);
    }
  }

  const scrollToSection = (id) => {
    setActiveSection(id);
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await signOut();
    } finally {
      setSigningOut(false);
      navigate('/auth');
    }
  };

  const refreshAll = () => {
    refetch();
    groupsQuery.refetch();
  };

  const exportRecent = () => {
    downloadCsv('recent-projects.csv', [
      ['Title', 'Project code', 'Category', 'Status', 'Updated'],
      ...filteredRecent.map((project) => [
        project.title,
        project.project_code || '',
        project.category?.name || '',
        getStatusLabel(project.status),
        project.updated_at ? formatDate(project.updated_at) : '',
      ]),
    ]);
  };

  const refreshing = isFetching || groupsQuery.isFetching;

  /* ---------- sidebar ---------- */

  const renderSidebar = (isMobile) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div
          className={cn(
            'flex shrink-0 items-center border-b border-neutral-200 dark:border-white/10',
            isCollapsed ? 'flex-col gap-2 px-2 py-3' : 'gap-3 px-3.5 py-3.5',
          )}
        >
          <Link
            to="/admin/dashboard"
            title={isCollapsed ? 'ResearchFlow' : undefined}
            className={cn(
              'flex min-w-0 items-center gap-3',
              isCollapsed && 'justify-center',
            )}
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
              <GraduationCap size={20} strokeWidth={1.75} />
            </span>
            {!isCollapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
                  ResearchFlow
                </span>
                <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                  Coordinator workspace
                </span>
              </span>
            ) : null}
          </Link>

          {!isMobile ? (
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'flex shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-800 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white',
                isCollapsed ? 'h-8 w-8' : 'h-9 w-9',
              )}
            >
              {isCollapsed ? (
                <PanelLeftOpen size={15} />
              ) : (
                <PanelLeftClose size={15} />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
              className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 dark:border-white/10"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <nav className={cn('flex-1 space-y-5 overflow-y-auto overflow-x-hidden py-3', isCollapsed ? 'px-1.5' : 'px-2.5')} aria-label="Dashboard navigation">
          <div>
            {!isCollapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                Workspace
              </p>
            )}
            <div className="space-y-1">
              {WORKSPACE_NAV.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  tone={item.tone}
                  active={activeSection === item.id}
                  collapsed={isCollapsed}
                  onClick={() => scrollToSection(item.id)}
                />
              ))}
            </div>
          </div>

          <div>
            {!isCollapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                Explore
              </p>
            )}
            <div className="space-y-1">
              {EXPLORE_NAV.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  icon={item.icon}
                  label={item.label}
                  tone={item.tone}
                  to={item.to}
                  collapsed={isCollapsed}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </div>
          </div>
        </nav>

        <div className="shrink-0 border-t border-neutral-200/70 p-3 dark:border-white/[0.08]">
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-1 py-1',
              isCollapsed && 'justify-center px-0',
            )}
            title={isCollapsed ? user?.email : undefined}
          >
            <IconTile icon={ShieldCheck} tone="neutral" size="small" />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {profile?.full_name || 'Coordinator'}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                  {user?.email || 'Department administrator'}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            title={isCollapsed ? 'Log out' : undefined}
            className={cn(
              'mt-2 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-500/10',
              isCollapsed && 'justify-center px-0',
            )}
          >
            {signingOut ? (
              <Loader2 size={17} className="shrink-0 animate-spin" />
            ) : (
              <LogOut size={17} className="shrink-0" />
            )}
            {!isCollapsed && <span>{signingOut ? 'Logging out...' : 'Log out'}</span>}
          </button>
        </div>
      </div>
    );
  };

  /* ---------- render ---------- */

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div
          className={cn(
            'sticky top-0 hidden h-screen shrink-0 lg:flex',
            isResizing && 'select-none',
          )}
          style={{
            width: desktopWidth,
            transition: isResizing
              ? 'none'
              : 'width 280ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <aside
            className="h-full min-w-0 flex-1 overflow-hidden border-r border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-950"
            style={{
              width: desktopWidth,
              transition: isResizing
                ? 'none'
                : 'width 280ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {renderSidebar(false)}
          </aside>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuemin={SIDEBAR_ICON}
            aria-valuemax={SIDEBAR_MAX}
            aria-valuenow={desktopWidth}
            tabIndex={0}
            onPointerDown={startResize}
            onDoubleClick={handleResizeDoubleClick}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setForceCollapsed(false);
                setSidebarWidth((w) =>
                  clampDragWidth(
                    Math.max(SIDEBAR_ICON, (forceCollapsed ? SIDEBAR_ICON : w) - 20),
                  ),
                );
              }
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                setForceCollapsed(false);
                setSidebarWidth((w) =>
                  clampDragWidth((forceCollapsed ? SIDEBAR_ICON : w) + 20),
                );
              }
            }}
            title="Drag to resize · Double-click to reset"
            className="group relative z-20 -ml-1.5 w-3 shrink-0 cursor-col-resize touch-none"
          >
            <span
              className={cn(
                'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors duration-150',
                'bg-transparent group-hover:bg-neutral-300 dark:group-hover:bg-white/20',
                isResizing && 'bg-violet-500 dark:bg-violet-400',
              )}
            />
            <span
              className={cn(
                'absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150',
                'bg-neutral-300 opacity-0 group-hover:opacity-100 dark:bg-white/25',
                isResizing && 'h-12 bg-violet-500 opacity-100 dark:bg-violet-400',
              )}
            />
          </div>
        </div>

        {/* Mobile header + drawer */}
        <div className="lg:hidden">
          <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-3 border-b border-neutral-200/70 bg-white/95 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/95">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 dark:border-white/10"
            >
              <Menu size={19} />
            </button>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <GraduationCap size={19} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">ResearchFlow</p>
              <p className="truncate text-[11px] text-neutral-500">Coordinator workspace</p>
            </div>

            <button
              type="button"
              onClick={refreshAll}
              disabled={refreshing}
              aria-label="Refresh dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 disabled:opacity-60 dark:border-white/10"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </header>

          {mobileOpen && (
            <div className="fixed inset-0 z-50">
              <button
                type="button"
                aria-label="Close sidebar overlay"
                onClick={() => setMobileOpen(false)}
                className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
              />
              <aside
                role="dialog"
                aria-modal="true"
                aria-label="Dashboard navigation"
                className="absolute inset-y-0 left-0 flex w-[285px] max-w-[85vw] flex-col border-r border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-950"
              >
                {renderSidebar(true)}
              </aside>
            </div>
          )}
        </div>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1600px] space-y-8 px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pt-8 xl:px-10">
            {/* ============ Overview ============ */}
            <section id="overview" className="scroll-mt-6 space-y-6">
              <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"
              >
                <GraduationCap size={17} className="shrink-0" />
                <span>Coordinator workspace</span>
                <ChevronRight size={14} className="text-neutral-400" />
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  Department overview
                </span>
              </nav>

              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0 max-w-3xl">
                  <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
                    {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Coordinator'} ·{' '}
                    {new Date().toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
                    Department overview
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400 sm:text-base">
                    Monitor project progress, manage the review pipeline and track
                    department activity from one place.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={refreshAll}
                    disabled={refreshing}
                    className={secondaryBtn}
                  >
                    <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                  <Link to="/faculty/groups/new" className={secondaryBtn}>
                    <FolderPlus size={15} />
                    New group
                  </Link>
                  <Link to="/faculty/dashboard" className={primaryBtn}>
                    <ClipboardList size={15} />
                    Review queue
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className={cn(card, 'flex items-center gap-3.5 p-4')}>
                  <IconTile icon={ShieldCheck} tone="neutral" />
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Signed in as</p>
                    <p className="mt-0.5 truncate text-sm font-semibold">
                      {profile?.full_name || 'Coordinator'}
                    </p>
                    <p className="truncate text-xs capitalize text-neutral-500 dark:text-neutral-400">
                      {profile?.role || 'Administrator'}
                    </p>
                  </div>
                </div>

                <div className={cn(card, 'flex items-center gap-3.5 p-4')}>
                  <IconTile icon={Clock3} tone="orange" />
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Awaiting review</p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums">{pendingReviews}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Need attention</p>
                  </div>
                </div>

                <div className={cn(card, 'flex items-center gap-3.5 p-4')}>
                  <IconTile icon={CheckCircle2} tone="green" />
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Approval rate</p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums">{approvalRate}%</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {approved} approved
                    </p>
                  </div>
                </div>

                <div className={cn(card, 'flex items-center gap-3.5 p-4')}>
                  <IconTile icon={FolderOpen} tone="violet" />
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Submission groups</p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums">
                      {groupsQuery.isLoading ? '–' : groups.length}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {publishedGroups} published
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Loading */}
            {isLoading && (
              <div className={cn(card, 'flex min-h-72 flex-col items-center justify-center gap-3 p-8')}>
                <Loader2 size={25} className="animate-spin text-neutral-400" />
                <p className="text-sm font-semibold">Loading department data</p>
                <p className="text-xs text-neutral-500">Fetching project and review statistics...</p>
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className={cn(card, 'p-6 sm:p-10')}>
                <div className="mx-auto flex max-w-md flex-col items-center text-center">
                  <IconTile icon={AlertCircle} tone="red" />
                  <h2 className="mt-4 font-semibold">Could not load dashboard</h2>
                  <p className="mt-2 break-words text-sm leading-6 text-neutral-500">
                    {error.message || 'Something went wrong while fetching department data.'}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Check your access permissions and backend connection.
                  </p>
                  <button type="button" onClick={() => refetch()} className={cn(primaryBtn, 'mt-5')}>
                    <RefreshCw size={15} />
                    Try again
                  </button>
                </div>
              </div>
            )}

            {stats && !isLoading && (
              <>
                {/* ============ Metrics ============ */}
                <section id="metrics" className="scroll-mt-6 space-y-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">Department metrics</h2>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Current totals reported by the system
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
                      <Activity size={13} />
                      Updated when you refresh
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    <MetricCard
                      label="Total projects"
                      value={stats.total_projects}
                      description="All projects in the department"
                      icon={FolderKanban}
                      tone="violet"
                    />
                    <MetricCard
                      label="Active projects"
                      value={stats.active}
                      description="Projects currently in progress"
                      icon={Activity}
                      tone="blue"
                    />
                    <MetricCard
                      label="Awaiting review"
                      value={stats.awaiting_review}
                      description="Projects needing review attention"
                      icon={ClipboardList}
                      tone="orange"
                    />
                    <MetricCard
                      label="Approved"
                      value={approved}
                      description={`${approvalRate}% of all projects`}
                      icon={CheckCircle2}
                      tone="green"
                    />
                    <MetricCard
                      label="Students"
                      value={students}
                      description="Registered student accounts"
                      icon={Users}
                      tone="blue"
                    />
                    <MetricCard
                      label="Faculty"
                      value={faculty}
                      description={`${studentsPerFaculty} students per faculty`}
                      icon={GraduationCap}
                      tone="violet"
                    />
                  </div>
                </section>

                {/* ============ Pipeline + insights ============ */}
                <section
                  id="pipeline"
                  className="grid scroll-mt-6 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
                >
                  <div className={cn(card, 'min-w-0 p-5 sm:p-6')}>
                    <SectionHeading
                      icon={ChartNoAxesColumn}
                      tone="blue"
                      title="Project pipeline"
                      description="Distribution of projects across their current statuses."
                    />

                    {statusEntries.length === 0 ? (
                      <div className="mt-5">
                        <EmptyState
                          icon={FolderKanban}
                          title="No status data available"
                          description="Status analytics will appear when project data is available."
                        />
                      </div>
                    ) : (
                      <>
                        <div className="mt-6 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-3xl font-semibold tabular-nums">{totalProjects}</p>
                            <p className="mt-1 text-xs text-neutral-500">Total projects</p>
                          </div>
                          <p className="text-right text-xs text-neutral-500">
                            {statusEntries.length} status categories
                          </p>
                        </div>

                        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                          {statusEntries.map(([status, count]) => (
                            <div
                              key={status}
                              title={`${getStatusLabel(status)}: ${count}`}
                              className={cn('h-full transition-all duration-300', STATUS_BAR[status] || 'bg-neutral-400')}
                              style={{
                                width: `${statusTotal > 0 ? (Number(count) / statusTotal) * 100 : 0}%`,
                              }}
                            />
                          ))}
                        </div>

                        <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                          {statusEntries.map(([status, count]) => {
                            const percentage =
                              statusTotal > 0 ? Math.round((Number(count) / statusTotal) * 100) : 0;

                            return (
                              <div key={status} className="min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', STATUS_BAR[status] || 'bg-neutral-400')} />
                                    <span className="truncate text-xs font-medium text-neutral-600 dark:text-neutral-300">
                                      {getStatusLabel(status)}
                                    </span>
                                  </div>
                                  <span className="shrink-0 text-sm font-semibold tabular-nums">{count}</span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                                  <div
                                    className={cn('h-full rounded-full transition-all duration-300', STATUS_BAR[status] || 'bg-neutral-400')}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <p className="mt-1.5 text-[11px] text-neutral-400">
                                  {percentage}% of all statuses
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid min-w-0 gap-5">
                    <div className={cn(card, 'min-w-0 p-5 sm:p-6')}>
                      <SectionHeading
                        icon={TrendingUp}
                        tone="green"
                        title="Department insights"
                        description="A quick summary of the project portfolio."
                      />

                      <div className="mt-5 space-y-3">
                        <div className="rounded-xl border border-neutral-200 p-4 dark:border-white/10">
                          <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-sm font-medium">
                              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                              Approval share
                            </span>
                            <span className="text-lg font-semibold tabular-nums">{approvalRate}%</span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${approvalRate}%` }} />
                          </div>
                          <p className="mt-2 text-xs leading-5 text-neutral-500">
                            {approved} approved out of {totalProjects} projects.
                          </p>
                        </div>

                        <div className="rounded-xl border border-neutral-200 p-4 dark:border-white/10">
                          <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-sm font-medium">
                              <FileCheck2 size={16} className="text-violet-600 dark:text-violet-400" />
                              Final decisions
                            </span>
                            <span className="text-lg font-semibold tabular-nums">{reviewedProjects}</span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${reviewCompletion}%` }} />
                          </div>
                          <p className="mt-2 text-xs leading-5 text-neutral-500">
                            {approved} approved and {rejected} rejected.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-orange-50 p-4 dark:bg-orange-500/[0.08]">
                            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 dark:text-orange-300">
                              <Clock3 size={14} />
                              Pending
                            </p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums text-orange-900 dark:text-orange-200">
                              {pendingReviews}
                            </p>
                          </div>
                          <div className="rounded-xl bg-sky-50 p-4 dark:bg-sky-500/[0.08]">
                            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                              <Activity size={14} />
                              Active
                            </p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums text-sky-900 dark:text-sky-200">
                              {activeProjects}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ============ Review queue + attention ============ */}
                <section
                  id="reviews"
                  className="grid scroll-mt-6 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
                >
                  <div className={cn(card, 'min-w-0 p-5 sm:p-6')}>
                    <SectionHeading
                      icon={ClipboardList}
                      tone="orange"
                      title="Review queue"
                      description="Projects waiting for faculty or coordinator attention."
                      action={
                        <Link to="/faculty/dashboard" className={secondaryBtn}>
                          Open queue
                          <ArrowUpRight size={14} />
                        </Link>
                      }
                    />

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-neutral-50 p-4 dark:bg-white/[0.04]">
                        <p className="text-xs text-neutral-500">Listed in queue</p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums">{queue.length}</p>
                      </div>
                      <div className="rounded-xl bg-orange-50 p-4 dark:bg-orange-500/[0.08]">
                        <p className="text-xs text-orange-700 dark:text-orange-300">Awaiting review</p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums text-orange-900 dark:text-orange-200">
                          {pendingReviews}
                        </p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/[0.08]">
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">Approved</p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-900 dark:text-emerald-200">
                          {approved}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {queue.length === 0 ? (
                        <EmptyState
                          icon={CheckCircle2}
                          title="Queue is clear"
                          description="There are no projects in the current review queue."
                        />
                      ) : (
                        queue.map((project) => <ProjectRow key={project.id} project={project} />)
                      )}
                    </div>
                  </div>

                  <div className="grid min-w-0 content-start gap-5">
                    <div className={cn(card, 'min-w-0 p-5 sm:p-6')}>
                      <SectionHeading
                        icon={AlertCircle}
                        tone="red"
                        title="Needs attention"
                        description="Where the pipeline needs a nudge."
                      />
                      <div className="mt-5 space-y-2">
                        {attention.map(({ label, hint, count, icon, tone }) => (
                          <Link
                            key={label}
                            to="/faculty/dashboard"
                            className="group flex items-center gap-3 rounded-xl border border-neutral-100 p-3 transition hover:border-neutral-300 hover:bg-neutral-50/70 dark:border-white/[0.07] dark:hover:border-white/15 dark:hover:bg-white/[0.03]"
                          >
                            <IconTile icon={icon} tone={tone} size="small" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                                {label}
                              </p>
                              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                {hint}
                              </p>
                            </div>
                            <span className="text-lg font-semibold tabular-nums">{count}</span>
                            <ChevronRight size={15} className="shrink-0 text-neutral-400 transition group-hover:translate-x-0.5" />
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className={cn(card, 'min-w-0 p-5 sm:p-6')}>
                      <SectionHeading
                        icon={Users}
                        tone="blue"
                        title="People"
                        description="Registered accounts in the department."
                      />
                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-neutral-50 p-3.5 text-center dark:bg-white/[0.04]">
                          <p className="text-xl font-semibold tabular-nums">{students}</p>
                          <p className="mt-1 text-xs text-neutral-500">Students</p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3.5 text-center dark:bg-white/[0.04]">
                          <p className="text-xl font-semibold tabular-nums">{faculty}</p>
                          <p className="mt-1 text-xs text-neutral-500">Faculty</p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3.5 text-center dark:bg-white/[0.04]">
                          <p className="text-xl font-semibold tabular-nums">{studentsPerFaculty}</p>
                          <p className="mt-1 text-xs text-neutral-500">Per faculty</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ============ Submission groups ============ */}
                <section id="groups" className="scroll-mt-6">
                  <div className={cn(card, 'min-w-0 p-5 sm:p-6')}>
                    <SectionHeading
                      icon={FolderOpen}
                      tone="violet"
                      title="Submission groups"
                      description="Cohorts organised by academic year, branch and semester."
                      action={
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to="/faculty/groups/new" className={secondaryBtn}>
                            <FolderPlus size={15} />
                            New group
                          </Link>
                          <Link to="/faculty/groups" className={primaryBtn}>
                            Manage groups
                            <ArrowUpRight size={14} />
                          </Link>
                        </div>
                      }
                    />

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-neutral-50 p-4 dark:bg-white/[0.04]">
                        <p className="text-xs text-neutral-500">Total groups</p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums">{groups.length}</p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/[0.08]">
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">Published</p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-900 dark:text-emerald-200">
                          {publishedGroups}
                        </p>
                      </div>
                      <div className="rounded-xl bg-sky-50 p-4 dark:bg-sky-500/[0.08]">
                        <p className="text-xs text-sky-700 dark:text-sky-300">Upcoming deadlines</p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums text-sky-900 dark:text-sky-200">
                          {upcomingGroupDeadlines}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      {groupsQuery.isLoading ? (
                        <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-neutral-500">
                          <Loader2 size={17} className="animate-spin" />
                          Loading groups...
                        </div>
                      ) : groupsQuery.isError ? (
                        <EmptyState
                          icon={AlertCircle}
                          title="Could not load groups"
                          description={groupsQuery.error?.message || 'Something went wrong while fetching groups.'}
                          action={
                            <button type="button" onClick={() => groupsQuery.refetch()} className={secondaryBtn}>
                              <RefreshCw size={14} />
                              Try again
                            </button>
                          }
                        />
                      ) : groups.length === 0 ? (
                        <EmptyState
                          icon={FolderOpen}
                          title="No submission groups yet"
                          description="Create a group to organise student projects by academic year, branch and semester."
                          action={
                            <Link to="/faculty/groups/new" className={primaryBtn}>
                              <FolderPlus size={15} />
                              Create first group
                            </Link>
                          }
                        />
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                          {groups.slice(0, 6).map((group) => {
                            const deadline = getDeadlineState(group.submission_deadline);
                            const DeadlineIcon = deadline?.icon;

                            return (
                              <Link
                                key={group.id}
                                to={`/faculty/groups/${group.id}`}
                                className="group flex min-w-0 items-start gap-3 rounded-xl border border-neutral-100 p-3.5 transition hover:border-neutral-300 hover:bg-neutral-50/70 dark:border-white/[0.07] dark:hover:border-white/15 dark:hover:bg-white/[0.03]"
                              >
                                <IconTile icon={FolderOpen} tone="violet" size="small" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                                    {group.title || group.name || 'Untitled group'}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                                    {[group.academic_year, group.branch, group.semester && `Semester ${group.semester}`]
                                      .filter(Boolean)
                                      .join(' · ') || 'No details added'}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {deadline && (
                                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', TONES[deadline.tone])}>
                                        <DeadlineIcon size={11} />
                                        {deadline.label}
                                      </span>
                                    )}
                                    <span
                                      className={cn(
                                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                                        group.is_published === false ? TONES.neutral : TONES.green,
                                      )}
                                    >
                                      {group.is_published === false ? 'Draft' : 'Published'}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight size={15} className="mt-1 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5" />
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {groups.length > 6 && (
                        <p className="mt-3 text-xs text-neutral-400">
                          Showing 6 of {groups.length} groups.{' '}
                          <Link to="/faculty/groups" className="font-medium text-neutral-600 hover:underline dark:text-neutral-300">
                            View all
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* ============ Recent projects ============ */}
                <section id="recent" className="scroll-mt-6">
                  <div className={cn(card, 'min-w-0 p-5 sm:p-6')}>
                    <SectionHeading
                      icon={FolderKanban}
                      tone="violet"
                      title="Recent projects"
                      description="Recently updated projects across the department."
                      action={
                        <button
                          type="button"
                          onClick={exportRecent}
                          disabled={filteredRecent.length === 0}
                          className={secondaryBtn}
                        >
                          <Download size={15} />
                          Export CSV
                        </button>
                      }
                    />

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <div className="relative flex-1">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                        <input
                          type="search"
                          value={recentSearch}
                          onChange={(event) => setRecentSearch(event.target.value)}
                          placeholder="Search by title, code or student..."
                          aria-label="Search recent projects"
                          className={searchInput}
                        />
                      </div>
                      <select
                        value={recentStatus}
                        onChange={(event) => setRecentStatus(event.target.value)}
                        aria-label="Filter by status"
                        className={selectClass}
                      >
                        <option value="all">All statuses</option>
                        {recentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4 space-y-2">
                      {recent.length === 0 ? (
                        <EmptyState
                          icon={FolderKanban}
                          title="No projects yet"
                          description="Newly created projects will appear here."
                        />
                      ) : filteredRecent.length === 0 ? (
                        <EmptyState
                          icon={Search}
                          title="No matching projects"
                          description="Try another search term or clear the status filter."
                          action={
                            <button
                              type="button"
                              onClick={() => {
                                setRecentSearch('');
                                setRecentStatus('all');
                              }}
                              className={secondaryBtn}
                            >
                              <X size={14} />
                              Clear filters
                            </button>
                          }
                        />
                      ) : (
                        filteredRecent.map((project) => (
                          <ProjectRow key={project.id} project={project} showCategory />
                        ))
                      )}
                    </div>

                    {recent.length > 0 && (
                      <p className="mt-3 text-xs text-neutral-400">
                        Showing {filteredRecent.length} of {recent.length} recent projects
                      </p>
                    )}
                  </div>
                </section>

                {/* ============ Quick actions ============ */}
                <section id="actions" className="scroll-mt-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Quick actions</h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      Shortcuts to coordinator and faculty tools
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {quickActions.map(({ to, title, description, icon, tone, meta }) => (
                      <Link
                        key={title}
                        to={to}
                        className={cn(
                          card,
                          'group flex min-w-0 flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:hover:border-white/20',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <IconTile icon={icon} tone={tone} />
                          <ArrowUpRight
                            size={17}
                            className="mt-1 shrink-0 text-neutral-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:group-hover:text-white"
                          />
                        </div>
                        <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
                        <p className="mt-1.5 flex-1 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
                          {description}
                        </p>
                        <p className="mt-4 inline-flex items-center gap-1.5 border-t border-neutral-100 pt-3 text-xs font-medium text-neutral-600 dark:border-white/[0.07] dark:text-neutral-300">
                          <CalendarClock size={13} className="text-neutral-400" />
                          {meta}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>

                <footer className="flex flex-col gap-3 border-t border-neutral-200 pt-4 text-xs text-neutral-400 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  <span>ResearchFlow · Department administration</span>
                  <button
                    type="button"
                    onClick={refreshAll}
                    disabled={refreshing}
                    className="inline-flex items-center gap-1.5 self-start transition hover:text-neutral-700 disabled:opacity-50 dark:hover:text-neutral-200 sm:self-auto"
                  >
                    <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                    Refresh dashboard data
                  </button>
                </footer>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}