import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Hash,
  FolderKanban,
  Loader2,
  ArrowUpRight,
  Copy,
  Check,
  Clock3,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileEdit,
  Send,
  Users,
  Layers,
  Search,
  Filter,
  CalendarDays,
  GraduationCap,
  FolderOpen,
  X,
  ChevronRight,
  BriefcaseBusiness,
  Edit3,
  Trash2,
  RefreshCw,
  LayoutGrid,
  List,
  Flag,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate, cn } from '../../lib/utils';

/* -------------------------------------------------------
   Styles (neutral cards, coloured icons)
------------------------------------------------------- */

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60';

const muted = 'text-neutral-500 dark:text-neutral-400';

const iconBox = 'flex shrink-0 items-center justify-center rounded-xl';

const TONES = {
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
};

const ICON = {
  sky: 'text-sky-600 dark:text-sky-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  amber: 'text-amber-600 dark:text-amber-300',
  orange: 'text-orange-600 dark:text-orange-300',
  violet: 'text-violet-600 dark:text-violet-300',
  red: 'text-red-600 dark:text-red-300',
  neutral: 'text-neutral-500 dark:text-neutral-400',
};

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';

const secondaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]';

const fieldClass =
  'min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white/40 dark:focus:ring-white/10';

/* -------------------------------------------------------
   Status config
------------------------------------------------------- */

const STATUS_META = {
  draft: { label: 'Draft', icon: FileEdit, tone: 'neutral', bar: 'bg-neutral-400 dark:bg-neutral-500' },
  awaiting_members: { label: 'Awaiting members', icon: Users, tone: 'amber', bar: 'bg-amber-500' },
  submitted: { label: 'Submitted', icon: Send, tone: 'sky', bar: 'bg-sky-500' },
  under_review: { label: 'Under review', icon: Clock3, tone: 'violet', bar: 'bg-violet-500' },
  changes_requested: { label: 'Changes requested', icon: AlertCircle, tone: 'orange', bar: 'bg-orange-500' },
  approved: { label: 'Approved', icon: CheckCircle2, tone: 'emerald', bar: 'bg-emerald-500' },
  rejected: { label: 'Rejected', icon: AlertCircle, tone: 'red', bar: 'bg-red-500' },
  archived: { label: 'Archived', icon: FolderKanban, tone: 'neutral', bar: 'bg-neutral-300 dark:bg-neutral-600' },
};

const STATUS_ORDER = Object.keys(STATUS_META);

const FILTERS = [
  { id: 'all', label: 'All projects' },
  { id: 'draft', label: 'Drafts' },
  { id: 'active', label: 'In progress' },
  { id: 'review', label: 'In review' },
  { id: 'done', label: 'Completed' },
];

const SORTS = [
  { id: 'recent', label: 'Recently updated' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'title', label: 'Title A to Z' },
  { id: 'status', label: 'By status' },
];

const PAGE_SIZE = 9;

const initialForm = { title: '', short_description: '', project_type: '' };

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function normalizeStatus(status) {
  return String(status || 'draft').toLowerCase().trim().replace(/[\s-]+/g, '_');
}

function getStatusMeta(status) {
  return STATUS_META[normalizeStatus(status)] || STATUS_META.draft;
}

function matchesFilter(status, filter) {
  const value = normalizeStatus(status);

  if (filter === 'all') return true;
  if (filter === 'draft') return ['draft', 'awaiting_members'].includes(value);
  if (filter === 'active') return ['draft', 'awaiting_members', 'changes_requested'].includes(value);
  if (filter === 'review') return ['submitted', 'under_review'].includes(value);
  if (filter === 'done') return ['approved', 'rejected', 'archived'].includes(value);

  return true;
}

function getProgress(project) {
  const raw = project?.progress ?? project?.progress_percentage ?? project?.completion_percentage;
  if (raw === undefined || raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.round(Math.min(100, Math.max(0, value))) : null;
}

function getMemberCount(project) {
  if (Number.isFinite(Number(project?.members_count))) return Number(project.members_count);
  if (Array.isArray(project?.members)) return project.members.length;
  return null;
}

function getDeadline(project) {
  return project?.submission_deadline || project?.deadline || project?.target_end_date || null;
}

function getDeadlineLabel(deadline) {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diff = Math.round((a - b) / 86400000);

  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `${diff} days left`;
}

function timeOf(project) {
  const value = new Date(project?.updated_at || project?.created_at || 0).getTime();
  return Number.isFinite(value) ? value : 0;
}

/* -------------------------------------------------------
   Components
------------------------------------------------------- */

function StatCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <div className={cn(card, 'flex min-w-0 items-start justify-between gap-3 p-5')}>
      <div className="min-w-0">
        <p className={cn('text-sm', muted)}>{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">{value}</p>
        {hint && <p className={cn('mt-1 text-xs', muted)}>{hint}</p>}
      </div>

      <div className={cn(iconBox, 'h-11 w-11', TONES[tone])}>
        <Icon size={19} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  const Icon = meta.icon;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-white/10 dark:text-neutral-200">
      <Icon size={12} className={ICON[meta.tone]} />
      {meta.label}
    </span>
  );
}

function CopyId({ code }) {
  const [done, setDone] = useState(false);

  if (!code) return null;

  async function handleCopy(event) {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(String(code));
      setDone(true);
      toast.success('Project ID copied');
      setTimeout(() => setDone(false), 1500);
    } catch {
      toast.error('Could not copy Project ID');
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy Project ID"
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 font-mono text-xs text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.06]"
    >
      <Hash size={12} className={cn('shrink-0', ICON.sky)} />
      <span className="truncate">{code}</span>
      {done ? (
        <Check size={12} className="shrink-0 text-emerald-500" />
      ) : (
        <Copy size={12} className="shrink-0 text-neutral-400" />
      )}
    </button>
  );
}

function StatusOverview({ projects }) {
  const counts = useMemo(() => {
    const map = {};
    projects.forEach((project) => {
      const key = normalizeStatus(project.status);
      const safe = STATUS_META[key] ? key : 'draft';
      map[safe] = (map[safe] || 0) + 1;
    });
    return STATUS_ORDER.map((key) => ({ key, count: map[key] || 0 })).filter((item) => item.count > 0);
  }, [projects]);

  if (!projects.length) return null;

  return (
    <section className={cn(card, 'p-4 sm:p-5')}>
      <div className="flex items-center gap-3">
        <span className={cn(iconBox, 'h-9 w-9', TONES.violet)}>
          <Layers size={16} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Status overview</h2>
          <p className={cn('text-sm', muted)}>How your projects are distributed.</p>
        </div>
      </div>

      <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.08]">
        {counts.map(({ key, count }) => (
          <div
            key={key}
            className={STATUS_META[key].bar}
            style={{ width: `${(count / projects.length) * 100}%` }}
            title={`${STATUS_META[key].label}: ${count}`}
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {counts.map(({ key, count }) => (
          <li key={key} className="flex items-center gap-2 text-sm">
            <span className={cn('h-2.5 w-2.5 rounded-full', STATUS_META[key].bar)} />
            <span className={muted}>{STATUS_META[key].label}</span>
            <span className="font-semibold text-neutral-900 dark:text-white">{count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AttentionList({ projects, onOpenFilter }) {
  const items = projects.filter((project) =>
    ['changes_requested', 'awaiting_members'].includes(normalizeStatus(project.status)),
  );

  if (!items.length) return null;

  return (
    <section className={cn(card, 'p-4 sm:p-5')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn(iconBox, 'h-9 w-9', TONES.amber)}>
            <AlertTriangle size={16} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Needs your attention</h2>
            <p className={cn('text-sm', muted)}>
              {items.length} project{items.length === 1 ? '' : 's'} waiting on action.
            </p>
          </div>
        </div>

        <button type="button" onClick={onOpenFilter} className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
          Show in progress
        </button>
      </div>

      <ul className="mt-4 divide-y divide-neutral-100 dark:divide-white/[0.06]">
        {items.slice(0, 3).map((project) => {
          const meta = getStatusMeta(project.status);
          const Icon = meta.icon;

          return (
            <li key={project.id}>
              <Link
                to={`/app/projects/${project.id}`}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className={cn(iconBox, 'h-9 w-9', TONES[meta.tone])}>
                  <Icon size={16} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                    {project.title || 'Untitled project'}
                  </p>
                  <p className={cn('text-xs', muted)}>{meta.label}</p>
                </div>

                <ChevronRight size={16} className="shrink-0 text-neutral-400" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className={cn(card, 'border-dashed px-5 py-14 text-center sm:py-16')}>
      <div className={cn(iconBox, 'mx-auto h-14 w-14 rounded-2xl', hasFilters ? TONES.sky : TONES.violet)}>
        {hasFilters ? <Search size={25} /> : <FolderOpen size={25} />}
      </div>

      <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
        {hasFilters ? 'No matching projects' : 'No projects yet'}
      </h3>

      <p className={cn('mx-auto mt-2 max-w-md text-sm leading-6', muted)}>
        {hasFilters
          ? 'Try another search term or clear the filters to see all projects.'
          : 'Create a project workspace or join an existing team using its Project ID.'}
      </p>

      {hasFilters ? (
        <button type="button" onClick={onClear} className={cn(secondaryButton, 'mt-5')}>
          <X size={15} />
          Clear filters
        </button>
      ) : (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to="/app/projects/new" className={primaryButton}>
            <Plus size={16} />
            Create project
          </Link>
          <Link to="/app/projects/join" className={secondaryButton}>
            <Hash size={16} />
            Join by ID
          </Link>
        </div>
      )}
    </div>
  );
}

function ProjectMeta({ project }) {
  const members = getMemberCount(project);
  const deadline = getDeadline(project);
  const deadlineLabel = getDeadlineLabel(deadline);
  const updatedAt = project.updated_at || project.created_at;

  return (
    <div className="space-y-2.5 text-sm">
      {project.project_type && (
        <div className="flex items-center gap-2.5">
          <BriefcaseBusiness size={15} className={cn('shrink-0', ICON.violet)} />
          <span className="capitalize text-neutral-700 dark:text-neutral-300">
            {String(project.project_type).replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {members !== null && (
        <div className="flex items-center gap-2.5">
          <Users size={15} className={cn('shrink-0', ICON.emerald)} />
          <span className="text-neutral-700 dark:text-neutral-300">
            {members} member{members === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {deadline && (
        <div className="flex items-center gap-2.5">
          <Flag size={15} className={cn('shrink-0', ICON.orange)} />
          <span className="text-neutral-700 dark:text-neutral-300">
            {formatDate(deadline)}
            {deadlineLabel && <span className={cn('ml-2 text-xs', muted)}>{deadlineLabel}</span>}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <CalendarDays size={15} className={cn('shrink-0', ICON.sky)} />
        <span className="text-neutral-700 dark:text-neutral-300">
          Updated {updatedAt ? formatDate(updatedAt) : 'not available'}
        </span>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className={muted}>Progress</span>
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{value}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.08]"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-neutral-900 dark:bg-white" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ActionButtons({ project, onEdit, onDelete, isDeleting }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onEdit(project)} className={cn(secondaryButton, 'min-h-9 px-3 text-xs')}>
        <Edit3 size={14} className={ICON.sky} />
        Edit
      </button>

      <button
        type="button"
        onClick={() => onDelete(project)}
        disabled={isDeleting}
        className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-xs font-medium text-neutral-700 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-red-500/10 dark:hover:text-red-300"
      >
        <Trash2 size={14} className={ICON.red} />
        Delete
      </button>
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete, isDeleting }) {
  const meta = getStatusMeta(project.status);
  const title = project.title || 'Untitled project';
  const progress = getProgress(project);

  return (
    <article className={cn(card, 'group flex min-w-0 flex-col p-5 transition hover:border-neutral-300 dark:hover:border-white/20')}>
      <Link to={`/app/projects/${project.id}`} className="flex min-w-0 flex-1 flex-col focus-visible:outline-none">
        <div className="flex items-start justify-between gap-3">
          <div className={cn(iconBox, 'h-11 w-11', TONES[meta.tone])}>
            <FolderOpen size={21} />
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            <ArrowUpRight
              size={17}
              className="text-neutral-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:group-hover:text-white"
            />
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <h3 className="break-words text-base font-semibold text-neutral-900 dark:text-white">{title}</h3>

          {project.short_description && (
            <p className={cn('mt-2 line-clamp-2 break-words text-sm leading-6', muted)}>
              {project.short_description}
            </p>
          )}

          {project.category?.name && (
            <span className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-white/10 dark:text-neutral-300">
              <GraduationCap size={12} className={cn('shrink-0', ICON.amber)} />
              <span className="truncate">{project.category.name}</span>
            </span>
          )}
        </div>

        {progress !== null && (
          <div className="mt-4">
            <ProgressBar value={progress} />
          </div>
        )}

        <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-white/[0.06]">
          <ProjectMeta project={project} />
        </div>
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-4 dark:border-white/[0.06]">
        <CopyId code={project.project_code} />
        <ActionButtons project={project} onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
      </div>
    </article>
  );
}

function ProjectRow({ project, onEdit, onDelete, isDeleting }) {
  const meta = getStatusMeta(project.status);
  const progress = getProgress(project);
  const updatedAt = project.updated_at || project.created_at;

  return (
    <article className={cn(card, 'flex flex-col gap-4 p-4 transition hover:border-neutral-300 dark:hover:border-white/20 lg:flex-row lg:items-center')}>
      <Link to={`/app/projects/${project.id}`} className="flex min-w-0 flex-1 items-center gap-4 focus-visible:outline-none">
        <div className={cn(iconBox, 'h-11 w-11', TONES[meta.tone])}>
          <FolderOpen size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
            {project.title || 'Untitled project'}
          </h3>
          <p className={cn('mt-0.5 truncate text-xs', muted)}>
            {project.short_description || project.category?.name || 'No description'}
          </p>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:justify-end">
        <StatusBadge status={project.status} />

        {progress !== null && (
          <div className="w-28">
            <ProgressBar value={progress} />
          </div>
        )}

        <span className={cn('inline-flex items-center gap-1.5 text-xs', muted)}>
          <CalendarDays size={13} className={ICON.sky} />
          {updatedAt ? formatDate(updatedAt) : 'N/A'}
        </span>

        <CopyId code={project.project_code} />
        <ActionButtons project={project} onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
      </div>
    </article>
  );
}

function Modal({ children, onClose, labelledBy, align = 'center' }) {
  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-center bg-black/50 p-0 sm:p-4',
        align === 'center' ? 'items-center p-4' : 'items-end sm:items-center',
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */

export default function ProjectsPage() {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [view, setView] = useState('grid');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [editError, setEditError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.listProjects(),
  });

  const projects = Array.isArray(data?.projects) ? data.projects : [];

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.updateProject(id, payload),
    onSuccess: async () => {
      setEditingProject(null);
      setEditError('');
      toast.success('Project updated successfully');
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => setEditError(err.message || 'Failed to update project.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteProject(id),
    onSuccess: async () => {
      setDeleteTarget(null);
      setDeleteError('');
      toast.success('Project deleted successfully');
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => setDeleteError(err.message || 'Failed to delete project.'),
  });

  const stats = useMemo(
    () => ({
      total: projects.length,
      draft: projects.filter((p) => ['draft', 'awaiting_members'].includes(normalizeStatus(p.status))).length,
      review: projects.filter((p) => ['submitted', 'under_review'].includes(normalizeStatus(p.status))).length,
      approved: projects.filter((p) => normalizeStatus(p.status) === 'approved').length,
    }),
    [projects],
  );

  const filterCounts = useMemo(
    () => Object.fromEntries(FILTERS.map((item) => [item.id, projects.filter((p) => matchesFilter(p.status, item.id)).length])),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    const list = projects.filter((project) => {
      if (!matchesFilter(project.status, filter)) return false;
      if (!term) return true;

      return [
        project.title,
        project.project_code,
        project.short_description,
        project.category?.name,
        project.project_type,
      ].some((value) => String(value || '').toLowerCase().includes(term));
    });

    const sorted = [...list];

    if (sort === 'recent') sorted.sort((a, b) => timeOf(b) - timeOf(a));
    if (sort === 'oldest') sorted.sort((a, b) => timeOf(a) - timeOf(b));
    if (sort === 'title') sorted.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
    if (sort === 'status') {
      sorted.sort(
        (a, b) => STATUS_ORDER.indexOf(normalizeStatus(a.status)) - STATUS_ORDER.indexOf(normalizeStatus(b.status)),
      );
    }

    return sorted;
  }, [projects, filter, search, sort]);

  const shownProjects = filteredProjects.slice(0, visible);
  const hasFilters = Boolean(search.trim()) || filter !== 'all';

  function clearFilters() {
    setSearch('');
    setFilter('all');
    setVisible(PAGE_SIZE);
  }

  function openEdit(project) {
    setEditingProject(project);
    setEditError('');
    setEditForm({
      title: project.title || '',
      short_description: project.short_description || '',
      project_type: project.project_type || '',
    });
  }

  function closeEdit() {
    if (updateMutation.isPending) return;
    setEditingProject(null);
    setEditError('');
  }

  function closeDelete() {
    if (deleteMutation.isPending) return;
    setDeleteTarget(null);
    setDeleteError('');
  }

  function updateField(name, value) {
    setEditForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleEditSubmit(event) {
    event.preventDefault();
    setEditError('');

    if (editForm.title.trim().length < 3) {
      setEditError('Project title must contain at least 3 characters.');
      return;
    }

    updateMutation.mutate({
      id: editingProject.id,
      payload: {
        title: editForm.title.trim(),
        short_description: editForm.short_description.trim() || null,
        project_type: editForm.project_type.trim() || null,
      },
    });
  }

  const dash = isLoading || Boolean(error);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      {/* Header */}
      <section>
        <div className={cn('mb-3 flex flex-wrap items-center gap-2 text-sm', muted)}>
          <FolderOpen size={16} className={ICON.violet} />
          <span>Student workspace</span>
          <ChevronRight size={14} />
          <span className="text-neutral-800 dark:text-neutral-200">My projects</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              My projects
            </h1>
            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              Manage project workspaces, track submissions and keep your project details organised in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => refetch()} disabled={isFetching} className={secondaryButton}>
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>

            <Link to="/app/projects/join" className={secondaryButton}>
              <Hash size={16} />
              Join by ID
            </Link>

            <Link to="/app/projects/new" className={primaryButton}>
              <Plus size={16} />
              New project
            </Link>
          </div>
        </div>
      </section>

      {deleteError && !deleteTarget && (
        <div className={cn(card, 'flex items-start gap-3 p-3 text-sm')}>
          <span className={cn(iconBox, 'h-8 w-8', TONES.red)}>
            <AlertCircle size={16} />
          </span>
          <p className="min-w-0 flex-1 self-center text-neutral-700 dark:text-neutral-200">{deleteError}</p>
          <button type="button" onClick={() => setDeleteError('')} aria-label="Dismiss error" className="self-center">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total projects" value={dash ? '—' : stats.total} hint="All workspaces" icon={FolderOpen} tone="sky" />
        <StatCard label="Drafts" value={dash ? '—' : stats.draft} hint="Not yet submitted" icon={FileEdit} tone="amber" />
        <StatCard label="In review" value={dash ? '—' : stats.review} hint="Awaiting feedback" icon={Clock3} tone="violet" />
        <StatCard label="Approved" value={dash ? '—' : stats.approved} hint="Completed successfully" icon={CheckCircle2} tone="emerald" />
      </section>

      {/* Overview + attention */}
      {!dash && projects.length > 0 && (
        <section className="grid min-w-0 gap-5 lg:grid-cols-2">
          <StatusOverview projects={projects} />
          <AttentionList projects={projects} onOpenFilter={() => setFilter('active')} />
        </section>
      )}

      {/* Filters */}
      <section className={cn(card, 'space-y-4 p-4 sm:p-5')}>
        <div className="flex items-center gap-3">
          <span className={cn(iconBox, 'h-9 w-9', TONES.sky)}>
            <Filter size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Find a project</h2>
            <p className={cn('text-sm', muted)}>Search, filter and sort your workspaces.</p>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_auto]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder="Search title, project ID, category or type..."
              className={cn(fieldClass, 'pl-9')}
            />
          </div>

          <select value={sort} onChange={(event) => setSort(event.target.value)} className={fieldClass} aria-label="Sort projects">
            {SORTS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>

          <div className="flex rounded-xl border border-neutral-200 p-1 dark:border-white/10" role="group" aria-label="Change layout">
            {[
              { id: 'grid', icon: LayoutGrid, label: 'Grid view' },
              { id: 'list', icon: List, label: 'List view' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-pressed={view === id}
                aria-label={label}
                className={cn(
                  'flex h-9 w-10 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400',
                  view === id
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-white/[0.05]',
                )}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFilter(item.id);
                setVisible(PAGE_SIZE);
              }}
              aria-pressed={filter === item.id}
              className={cn(
                'inline-flex min-h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400',
                filter === item.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]',
              )}
            >
              {item.label}
              {!dash && <span className="opacity-60">{filterCounts[item.id]}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className={cn(iconBox, 'h-9 w-9', TONES.emerald)}>
            <FolderKanban size={17} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">Your workspaces</h2>
            <p className={cn('text-sm', muted)}>
              {isLoading ? 'Loading projects...' : `${filteredProjects.length} of ${projects.length} projects`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className={cn(card, 'flex min-h-56 flex-col items-center justify-center gap-3')}>
            <Loader2 size={25} className="animate-spin text-neutral-400" />
            <p className={cn('text-sm', muted)}>Loading your projects...</p>
          </div>
        ) : error ? (
          <div className={cn(card, 'px-5 py-12 text-center')}>
            <div className={cn(iconBox, 'mx-auto h-12 w-12', TONES.red)}>
              <AlertCircle size={22} />
            </div>
            <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">Could not load projects</h3>
            <p className={cn('mt-2 text-sm', muted)}>
              {error.message || 'Something went wrong while fetching projects.'}
            </p>
            <button type="button" onClick={() => refetch()} className={cn(primaryButton, 'mt-5')}>
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
        ) : (
          <>
            <div
              className={cn(
                view === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-3',
              )}
            >
              {shownProjects.map((project) => {
                const Item = view === 'grid' ? ProjectCard : ProjectRow;

                return (
                  <Item
                    key={project.id}
                    project={project}
                    onEdit={openEdit}
                    onDelete={(item) => {
                      setDeleteError('');
                      setDeleteTarget(item);
                    }}
                    isDeleting={deleteMutation.isPending && deleteTarget?.id === project.id}
                  />
                );
              })}
            </div>

            {filteredProjects.length > visible && (
              <div className="flex justify-center">
                <button type="button" onClick={() => setVisible((previous) => previous + PAGE_SIZE)} className={secondaryButton}>
                  Show more ({filteredProjects.length - visible} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Edit modal */}
      {editingProject && (
        <Modal onClose={closeEdit} labelledBy="edit-project-title" align="sheet">
          <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-neutral-950 sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={cn(iconBox, 'h-10 w-10', TONES.sky)}>
                  <Edit3 size={18} />
                </span>
                <div>
                  <h2 id="edit-project-title" className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Edit project
                  </h2>
                  <p className={cn('text-sm', muted)}>Update the basic details of your project.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={updateMutation.isPending}
                aria-label="Close edit form"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Project title *</label>
                <input
                  required
                  minLength={3}
                  maxLength={200}
                  value={editForm.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  className={cn(fieldClass, 'mt-1.5')}
                  placeholder="Enter project title"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Short description</label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={editForm.short_description}
                  onChange={(event) => updateField('short_description', event.target.value)}
                  className={cn(fieldClass, 'mt-1.5 resize-y')}
                  placeholder="Describe your project..."
                />
                <p className={cn('mt-1 text-xs', muted)}>{editForm.short_description.length}/2000 characters</p>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Project type</label>
                <input
                  maxLength={100}
                  value={editForm.project_type}
                  onChange={(event) => updateField('project_type', event.target.value)}
                  className={cn(fieldClass, 'mt-1.5')}
                  placeholder="e.g. Research, Web Application"
                />
              </div>

              {editError && (
                <div className="flex items-start gap-2 rounded-xl border border-neutral-200 p-3 text-sm text-neutral-700 dark:border-white/10 dark:text-neutral-200">
                  <AlertCircle size={16} className={cn('mt-0.5 shrink-0', ICON.red)} />
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeEdit} disabled={updateMutation.isPending} className={secondaryButton}>
                  Cancel
                </button>

                <button type="submit" disabled={updateMutation.isPending} className={primaryButton}>
                  {updateMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <Modal onClose={closeDelete} labelledBy="delete-project-title">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-neutral-950 sm:p-6">
            <div className={cn(iconBox, 'h-11 w-11', TONES.red)}>
              <Trash2 size={20} />
            </div>

            <h2 id="delete-project-title" className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
              Delete this project?
            </h2>

            <p className={cn('mt-2 break-words text-sm leading-6', muted)}>
              Are you sure you want to delete{' '}
              <strong className="text-neutral-900 dark:text-white">{deleteTarget.title || 'this project'}</strong>?
              This action may permanently remove the project and associated records, depending on your backend rules.
            </p>

            {deleteError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-neutral-200 p-3 text-sm text-neutral-700 dark:border-white/10 dark:text-neutral-200">
                <AlertCircle size={16} className={cn('mt-0.5 shrink-0', ICON.red)} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeDelete} disabled={deleteMutation.isPending} className={secondaryButton}>
                Cancel
              </button>

              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-60"
              >
                {deleteMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                Delete project
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}