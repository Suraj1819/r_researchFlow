import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownUp,
  ArrowUpRight,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  CircleDot,
  Clock3,
  Filter,
  Flag,
  Inbox,
  Layers,
  ListChecks,
  RefreshCw,
  RotateCcw,
  Search,
  Target,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';

/* -------------------------------------------------------
   Styles (neutral cards, coloured icons) — matches Projects page
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
   Status / Priority config
------------------------------------------------------- */

const STATUS = {
  todo: {
    label: 'To do',
    icon: CircleDot,
    tone: 'neutral',
    bar: 'bg-neutral-400 dark:bg-neutral-500',
  },
  in_progress: {
    label: 'In progress',
    icon: Clock3,
    tone: 'sky',
    bar: 'bg-sky-500',
  },
  blocked: {
    label: 'Blocked',
    icon: AlertTriangle,
    tone: 'orange',
    bar: 'bg-orange-500',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    tone: 'emerald',
    bar: 'bg-emerald-500',
  },
};

const PRIORITY = {
  low: {
    label: 'Low',
    tone: 'neutral',
    rank: 4,
  },
  medium: {
    label: 'Medium',
    tone: 'sky',
    rank: 3,
  },
  high: {
    label: 'High',
    tone: 'amber',
    rank: 2,
  },
  urgent: {
    label: 'Urgent',
    tone: 'red',
    rank: 1,
  },
};

const DUE_STYLE = {
  overdue:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  today:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300',
  soon:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  normal:
    'border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-white/10 dark:bg-white/10 dark:text-neutral-300',
};

function normalizeStatus(status) {
  return String(status || 'todo').toLowerCase().trim().replace(/[\s-]+/g, '_');
}

function getDueInfo(date, status) {
  if (!date) return null;
  const due = new Date(date);
  if (Number.isNaN(due.getTime())) return null;

  if (normalizeStatus(status) === 'completed') {
    return { label: formatDate(date), tone: 'normal' };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const days = Math.round((dueDay - today) / 86400000);

  if (days < 0) {
    return {
      label: `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`,
      tone: 'overdue',
    };
  }

  if (days === 0) return { label: 'Due today', tone: 'today' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'soon' };

  return {
    label: days <= 7 ? `Due in ${days} days` : formatDate(date),
    tone: days <= 7 ? 'soon' : 'normal',
  };
}

function isOverdue(task) {
  return getDueInfo(task.due_date, task.status)?.tone === 'overdue';
}

/* -------------------------------------------------------
   Components
------------------------------------------------------- */

function SelectFilter({ label, value, onChange, options, icon: Icon }) {
  return (
    <label className="relative block min-w-0">
      <span className={cn('mb-1.5 block text-xs font-medium', muted)}>{label}</span>
      <div className="relative">
        <Icon
          size={16}
          className={cn('pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2', ICON.sky)}
        />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(fieldClass, 'appearance-none pl-10 pr-9')}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ArrowDownUp
          size={14}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
        />
      </div>
    </label>
  );
}

function StatCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <div className={cn(card, 'flex min-w-0 items-start justify-between gap-3 p-5')}>
      <div className="min-w-0">
        <p className={cn('text-sm', muted)}>{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          {value}
        </p>
        {hint && <p className={cn('mt-1 text-xs', muted)}>{hint}</p>}
      </div>

      <div className={cn(iconBox, 'h-11 w-11', TONES[tone])}>
        <Icon size={19} />
      </div>
    </div>
  );
}

function StatusBadge({ statusKey }) {
  const meta = STATUS[statusKey] || STATUS.todo;
  const Icon = meta.icon;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-white/10 dark:text-neutral-200">
      <Icon size={12} className={ICON[meta.tone]} />
      {meta.label}
    </span>
  );
}

function PriorityBadge({ priorityKey }) {
  const meta = PRIORITY[priorityKey] || PRIORITY.medium;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium dark:border-white/10',
        TONES[meta.tone],
      )}
    >
      <Flag size={11} className={ICON[meta.tone]} />
      {meta.label}
    </span>
  );
}

function TaskCard({ task }) {
  const statusKey = normalizeStatus(task.status);
  const status = STATUS[statusKey] || STATUS.todo;
  const priorityKey = String(task.priority || 'medium').toLowerCase();
  const due = getDueInfo(task.due_date, statusKey);
  const projectName = task.project?.title || 'Project';
  const projectCode = task.project?.project_code;
  const overdue = isOverdue(task);

  return (
    <Link
      to={`/app/projects/${task.project_id}?tab=tasks`}
      className={cn(
        card,
        'group block min-w-0 p-5 transition hover:border-neutral-300 dark:hover:border-white/20',
        overdue && 'border-red-200 dark:border-red-500/30',
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className={cn(iconBox, 'mt-0.5 h-10 w-10', TONES[status.tone])}>
          <status.icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="break-words text-base font-semibold leading-6 text-neutral-900 dark:text-white">
              {task.title || 'Untitled task'}
            </h3>
            <PriorityBadge priorityKey={priorityKey} />
          </div>

          {task.description && (
            <p className={cn('mt-1.5 line-clamp-2 break-words text-sm leading-6', muted)}>
              {task.description}
            </p>
          )}

          <div className={cn('mt-3 flex min-w-0 items-center gap-2 text-sm', muted)}>
            <Target size={15} className={cn('shrink-0', ICON.violet)} />
            <span className="truncate font-medium text-neutral-700 dark:text-neutral-300">
              {projectName}
            </span>
            {projectCode && (
              <span className="shrink-0 font-mono text-xs text-neutral-400">
                {projectCode}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4 dark:border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge statusKey={statusKey} />

              {due && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                    DUE_STYLE[due.tone],
                  )}
                >
                  <Clock3 size={12} />
                  {due.label}
                </span>
              )}
            </div>

            <ArrowUpRight
              size={16}
              className="shrink-0 text-neutral-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:group-hover:text-white"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ filtered = false, onClear }) {
  return (
    <div className={cn(card, 'border-dashed px-5 py-14 text-center sm:py-16')}>
      <div
        className={cn(
          iconBox,
          'mx-auto h-14 w-14 rounded-2xl',
          filtered ? TONES.sky : TONES.violet,
        )}
      >
        {filtered ? <Search size={25} /> : <CheckSquare size={25} />}
      </div>

      <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
        {filtered ? 'No tasks match your filters' : 'No tasks assigned yet'}
      </h3>

      <p className={cn('mx-auto mt-2 max-w-md text-sm leading-6', muted)}>
        {filtered
          ? 'Try another search term or clear the filters to see your tasks.'
          : 'Tasks assigned to your account by your project team will appear here.'}
      </p>

      {filtered ? (
        <button type="button" onClick={onClear} className={cn(secondaryButton, 'mt-5')}>
          <RotateCcw size={15} />
          Clear filters
        </button>
      ) : (
        <Link to="/app/projects" className={cn(primaryButton, 'mt-5')}>
          Browse projects
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
          <div className="h-9 w-48 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-neutral-100 dark:bg-white/[0.06]" />
        </div>
        <div className="h-11 w-28 animate-pulse rounded-xl bg-neutral-100 dark:bg-white/[0.06]" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className={cn(card, 'h-28 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')}
          />
        ))}
      </div>

      <div className={cn(card, 'h-56 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')} />

      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className={cn(card, 'h-40 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */

export default function MyTasksPage() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: api.listMyTasks,
  });

  const tasks = Array.isArray(data?.tasks)
    ? data.tasks
    : Array.isArray(data)
      ? data
      : [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sort, setSort] = useState('due_asc');
  const [showCompleted, setShowCompleted] = useState(true);

  const stats = useMemo(() => {
    const result = {
      total: tasks.length,
      todo: 0,
      in_progress: 0,
      blocked: 0,
      completed: 0,
      overdue: 0,
    };

    tasks.forEach((task) => {
      const status = normalizeStatus(task.status);
      if (Object.hasOwn(result, status)) {
        result[status] += 1;
      }
      if (isOverdue(task)) result.overdue += 1;
    });

    result.active = result.total - result.completed;
    return result;
  }, [tasks]);

  const projects = useMemo(() => {
    const projectMap = new Map();

    tasks.forEach((task) => {
      if (!task.project_id) return;
      if (!projectMap.has(task.project_id)) {
        projectMap.set(task.project_id, {
          id: task.project_id,
          title: task.project?.title || 'Project',
          code: task.project?.project_code || '',
        });
      }
    });

    return [...projectMap.values()];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = tasks.filter((task) => {
      const status = normalizeStatus(task.status);
      const priority = String(task.priority || 'medium').toLowerCase();

      if (!showCompleted && status === 'completed') return false;
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (priorityFilter !== 'all' && priority !== priorityFilter) return false;
      if (projectFilter !== 'all' && String(task.project_id) !== projectFilter) {
        return false;
      }

      if (query) {
        const searchable = [
          task.title,
          task.description,
          task.project?.title,
          task.project?.project_code,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      return true;
    });

    const dueTime = (task) => {
      if (!task.due_date) return null;
      const time = new Date(task.due_date).getTime();
      return Number.isNaN(time) ? null : time;
    };

    const createdTime = (task) => {
      if (!task.created_at) return 0;
      const time = new Date(task.created_at).getTime();
      return Number.isNaN(time) ? 0 : time;
    };

    return result.sort((a, b) => {
      if (sort === 'priority_desc') {
        return (
          (PRIORITY[String(a.priority || 'medium').toLowerCase()]?.rank || 3) -
          (PRIORITY[String(b.priority || 'medium').toLowerCase()]?.rank || 3)
        );
      }

      if (sort === 'created_desc') return createdTime(b) - createdTime(a);
      if (sort === 'created_asc') return createdTime(a) - createdTime(b);

      const aDue = dueTime(a);
      const bDue = dueTime(b);

      if (aDue === null && bDue === null) return 0;
      if (aDue === null) return 1;
      if (bDue === null) return -1;

      return sort === 'due_desc' ? bDue - aDue : aDue - bDue;
    });
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    projectFilter,
    sort,
    showCompleted,
  ]);

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    projectFilter !== 'all' ||
    !showCompleted ||
    sort !== 'due_asc';

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
    setShowCompleted(true);
    setSort('due_asc');
  }

  if (isLoading) return <TaskSkeleton />;

  const dash = Boolean(isError);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      {/* Header */}
      <section>
        <div className={cn('mb-3 flex flex-wrap items-center gap-2 text-sm', muted)}>
          <CheckSquare size={20} className={ICON.emerald} />
          <span>Student workspace</span>
          <ChevronRight size={14} />
          <span className="text-neutral-800 dark:text-neutral-200">My Tasks</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              My Tasks
            </h1>
            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              Track your assigned work, manage deadlines and see what needs your attention.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className={secondaryButton}
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </section>

      {/* Error */}
      {isError && (
        <div className={cn(card, 'flex items-start gap-3 p-4 text-sm')}>
          <span className={cn(iconBox, 'h-9 w-9', TONES.red)}>
            <AlertCircle size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-neutral-900 dark:text-white">
              Unable to load your tasks
            </p>
            <p className={cn('mt-1 break-words', muted)}>
              {error?.message || 'Something went wrong while loading tasks.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className={cn(secondaryButton, 'mt-3 min-h-9 text-xs')}
            >
              <RotateCcw size={13} className={isFetching ? 'animate-spin' : ''} />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Assigned to me"
          value={dash ? '—' : stats.total}
          hint="Across all projects"
          icon={Inbox}
          tone="sky"
        />
        <StatCard
          label="Active tasks"
          value={dash ? '—' : stats.active}
          hint={`${stats.todo} waiting to start`}
          icon={ListChecks}
          tone="violet"
        />
        <StatCard
          label="In progress"
          value={dash ? '—' : stats.in_progress}
          hint={`${stats.blocked} blocked`}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Overdue"
          value={dash ? '—' : stats.overdue}
          hint={stats.overdue ? 'Needs your attention' : 'No overdue tasks'}
          icon={AlertTriangle}
          tone={stats.overdue ? 'red' : 'emerald'}
        />
      </section>

      {/* Filters */}
      <section className={cn(card, 'space-y-4 p-4 sm:p-5')}>
        <div className="flex items-center gap-3">
          <span className={cn(iconBox, 'h-9 w-9', TONES.sky)}>
            <Filter size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Find a task
            </h2>
            <p className={cn('text-sm', muted)}>
              Search and filter tasks assigned to your account.
            </p>
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

        <div>
          <label className={cn('mb-1.5 block text-xs font-medium', muted)}>Search</label>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-500"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, description, project or project ID..."
              className={cn(fieldClass, 'pl-10')}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SelectFilter
            label="Status"
            icon={CircleDot}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All statuses' },
              ...Object.entries(STATUS).map(([value, item]) => ({
                value,
                label: item.label,
              })),
            ]}
          />

          <SelectFilter
            label="Priority"
            icon={Flag}
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: 'all', label: 'All priorities' },
              ...Object.entries(PRIORITY).map(([value, item]) => ({
                value,
                label: item.label,
              })),
            ]}
          />

          <SelectFilter
            label="Project"
            icon={Target}
            value={projectFilter}
            onChange={setProjectFilter}
            options={[
              { value: 'all', label: 'All projects' },
              ...projects.map((project) => ({
                value: String(project.id),
                label: project.code || project.title,
              })),
            ]}
          />

          <SelectFilter
            label="Sort tasks"
            icon={ArrowDownUp}
            value={sort}
            onChange={setSort}
            options={[
              { value: 'due_asc', label: 'Nearest due date' },
              { value: 'due_desc', label: 'Furthest due date' },
              { value: 'priority_desc', label: 'Highest priority' },
              { value: 'created_desc', label: 'Recently created' },
              { value: 'created_asc', label: 'Oldest first' },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4 dark:border-white/[0.06]">
          <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm', muted)}>
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(event) => setShowCompleted(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400 dark:border-white/20 dark:bg-neutral-900"
            />
            <span className="text-neutral-600 dark:text-neutral-300">Show completed tasks</span>
          </label>

          <span className={cn('text-sm', muted)}>
            {filteredTasks.length} of {tasks.length} tasks
          </span>
        </div>
      </section>

      {/* Tasks list */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className={cn(iconBox, 'h-9 w-9', TONES.emerald)}>
            <ListChecks size={17} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
              Your tasks
            </h2>
            <p className={cn('text-sm', muted)}>
              {filteredTasks.length} of {tasks.length} tasks
            </p>
          </div>
        </div>

        {!isError && tasks.length === 0 ? (
          <EmptyState />
        ) : !isError && filteredTasks.length === 0 ? (
          <EmptyState filtered onClear={clearFilters} />
        ) : !isError ? (
          <div className="space-y-6">
            {Object.entries(STATUS).map(([statusKey, config]) => {
              const groupTasks = filteredTasks.filter(
                (task) => normalizeStatus(task.status) === statusKey,
              );

              if (!groupTasks.length) return null;
              const StatusIcon = config.icon;

              return (
                <div key={statusKey} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(iconBox, 'h-7 w-7', TONES[config.tone])}>
                      <StatusIcon size={14} />
                    </span>
                    <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      {config.label}
                    </h2>
                    <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                      {groupTasks.length}
                    </span>
                    <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
                  </div>

                  <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                    {groupTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredTasks.some((task) => !STATUS[normalizeStatus(task.status)]) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={cn(iconBox, 'h-7 w-7', TONES.neutral)}>
                    <Layers size={14} />
                  </span>
                  <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    Other statuses
                  </h2>
                  <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredTasks
                    .filter((task) => !STATUS[normalizeStatus(task.status)])
                    .map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}