import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Copy,
  FolderKanban,
  FolderOpen,
  GraduationCap,
  Hash,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  X,
  Filter,
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
   Status helpers
------------------------------------------------------- */

const completedStatuses = ['completed', 'approved', 'submitted'];
const inactiveStatuses = ['inactive', 'closed', 'rejected', 'cancelled', 'archived'];

function getGroups(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.groups)) return data.groups;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.groups)) return data.data.groups;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  return [];
}

function getGroupName(group) {
  return (
    group.name ||
    group.group_name ||
    group.title ||
    group.project_title ||
    'Untitled Group'
  );
}

function getGroupId(group) {
  return group.id ?? group.group_id ?? group._id ?? null;
}

function getStatus(group) {
  return String(group.status || group.state || 'active')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');
}

function getSupervisor(group) {
  const faculty =
    group.faculty ||
    group.supervisor ||
    group.faculty_name ||
    group.supervisor_name ||
    group.mentor ||
    group.coordinator_name ||
    group.faculty_details ||
    group.assigned_faculty;

  if (typeof faculty === 'string') {
    return faculty.trim() || 'Not assigned';
  }

  return (
    faculty?.full_name ||
    faculty?.name ||
    faculty?.display_name ||
    faculty?.coordinator_name ||
    faculty?.email ||
    'Not assigned'
  );
}

function getMemberCount(group) {
  const arrays = [
    group.members,
    group.students,
    group.group_members,
    group.groupMembers,
  ];

  for (const members of arrays) {
    if (Array.isArray(members)) return members.length;
  }

  const count =
    group.member_count ??
    group.members_count ??
    group.total_members ??
    group.total_students ??
    group.student_count ??
    group.students_count ??
    group.membersCount;

  return count === null || count === undefined || count === ''
    ? null
    : Number.isFinite(Number(count))
      ? Number(count)
      : null;
}

function getBranch(group) {
  return (
    group.branch ||
    group.department ||
    group.stream ||
    group.discipline ||
    ''
  );
}

function getSemester(group) {
  const sem = group.semester ?? group.sem;
  if (sem === null || sem === undefined || sem === '') return null;
  return String(sem);
}

function getAcademicSession(group) {
  return (
    group.academic_year ||
    group.academic_session ||
    group.session ||
    group.academicYear ||
    group.academicSession ||
    ''
  );
}

function getDeadline(group) {
  return (
    group.submission_deadline ||
    group.deadline ||
    group.due_date ||
    group.ends_at ||
    group.end_date ||
    null
  );
}

function getUpdatedAt(group) {
  return (
    group.updated_at ||
    group.updatedAt ||
    group.modified_at ||
    group.created_at ||
    group.createdAt ||
    null
  );
}

function isDeadlineExpired(deadline) {
  if (!deadline) return false;

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  const dateOnly =
    typeof deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deadline);

  if (dateOnly) {
    date.setHours(23, 59, 59, 999);
  }

  return date.getTime() < now.getTime();
}

function getDeadlineInfo(group) {
  const deadline = getDeadline(group);
  if (!deadline) return null;

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;

  const status = getStatus(group);

  if (isDeadlineExpired(deadline) && !completedStatuses.includes(status)) {
    return {
      label: 'Expired',
      dateLabel: formatDate(deadline),
      tone: 'expired',
      expired: true,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const days = Math.round((dueDay - today) / 86400000);

  if (completedStatuses.includes(status)) {
    return {
      label: formatDate(deadline),
      dateLabel: null,
      tone: 'normal',
      expired: false,
    };
  }

  if (days === 0) {
    return {
      label: 'Due today',
      dateLabel: formatDate(deadline),
      tone: 'today',
      expired: false,
    };
  }

  if (days === 1) {
    return {
      label: 'Due tomorrow',
      dateLabel: formatDate(deadline),
      tone: 'soon',
      expired: false,
    };
  }

  return {
    label: days <= 7 ? `Due in ${days} days` : formatDate(deadline),
    dateLabel: days <= 7 ? formatDate(deadline) : null,
    tone: days <= 7 ? 'soon' : 'normal',
    expired: false,
  };
}

const deadlineStyles = {
  expired:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  today:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300',
  soon:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  normal:
    'border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-white/10 dark:bg-white/10 dark:text-neutral-300',
};

/* -------------------------------------------------------
   Components
------------------------------------------------------- */

function StatusBadge({ status }) {
  const expired = status === 'expired';
  const completed = completedStatuses.includes(status);
  const inactive = inactiveStatuses.includes(status);

  const tone = expired
    ? 'red'
    : completed
      ? 'emerald'
      : inactive
        ? 'neutral'
        : 'sky';

  const label = expired
    ? 'Expired'
    : status
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

  const Icon = expired
    ? AlertCircle
    : completed
      ? CheckCircle2
      : inactive
        ? CircleDot
        : ShieldCheck;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-white/10 dark:text-neutral-200">
      <Icon size={12} className={ICON[tone]} />
      {label}
    </span>
  );
}

function CopyGroupId({ id }) {
  const [copied, setCopied] = useState(false);

  if (id === null || id === undefined || id === '') return null;

  async function handleCopy(event) {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(String(id));
      setCopied(true);
      toast.success('Group ID copied');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy Group ID');
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy Group ID"
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 font-mono text-xs text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.06]"
    >
      <Hash size={12} className={cn('shrink-0', ICON.sky)} />
      <span className="truncate">{String(id)}</span>
      {copied ? (
        <Check size={12} className="shrink-0 text-emerald-500" />
      ) : (
        <Copy size={12} className="shrink-0 text-neutral-400" />
      )}
    </button>
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

function GroupCard({ group }) {
  const id = getGroupId(group);
  const name = getGroupName(group);
  const status = getStatus(group);
  const memberCount = getMemberCount(group);
  const supervisor = getSupervisor(group);
  const deadline = getDeadlineInfo(group);
  const updatedAt = getUpdatedAt(group);

  const branch = getBranch(group);
  const semester = getSemester(group);
  const academicSession = getAcademicSession(group);

  const isExpired = deadline?.expired === true;
  const displayStatus = isExpired ? 'expired' : status;

  const description =
    group.description ||
    group.short_description ||
    group.project_description ||
    '';

  const projectTitle =
    group.project_title ||
    group.project?.title ||
    group.project?.name ||
    '';

  const cardTone = isExpired
    ? 'red'
    : completedStatuses.includes(status)
      ? 'emerald'
      : inactiveStatuses.includes(status)
        ? 'neutral'
        : 'violet';

  return (
    <article
      className={cn(
        card,
        'group flex min-w-0 h-full flex-col p-5 transition hover:border-neutral-300 dark:hover:border-white/20',
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className={cn(iconBox, 'h-11 w-11', TONES[cardTone])}>
          <FolderOpen size={21} />
        </div>

        <StatusBadge status={displayStatus} />
      </div>

      <div className="mt-4 min-w-0">
        <h3 className="break-words text-base font-semibold text-neutral-900 dark:text-white">
          {name}
        </h3>

        {description && (
          <p className={cn('mt-2 line-clamp-2 break-words text-sm leading-6', muted)}>
            {description}
          </p>
        )}
      </div>

      <div className="mt-5 space-y-3 border-t border-neutral-100 pt-4 dark:border-white/[0.06]">
        {projectTitle && (
          <div className="flex min-w-0 items-start gap-2.5 text-sm">
            <FolderKanban size={15} className={cn('mt-0.5 shrink-0', ICON.violet)} />
            <div className="min-w-0">
              <p className={cn('text-xs', muted)}>Project</p>
              <p className="mt-1 break-words font-medium text-neutral-700 dark:text-neutral-300">
                {projectTitle}
              </p>
            </div>
          </div>
        )}

        <div className="flex min-w-0 items-start gap-2.5 text-sm">
          <UserRound size={15} className={cn('mt-0.5 shrink-0', ICON.sky)} />
          <div className="min-w-0">
            <p className={cn('text-xs', muted)}>Supervisor</p>
            <p className="mt-1 break-words font-medium text-neutral-700 dark:text-neutral-300">
              {supervisor}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-2.5 text-sm">
          <UsersRound size={15} className={cn('mt-0.5 shrink-0', ICON.emerald)} />
          <div className="min-w-0">
            <p className={cn('text-xs', muted)}>Team members</p>
            <p className="mt-1 break-words font-medium text-neutral-700 dark:text-neutral-300">
              {memberCount === null
                ? 'Not available'
                : `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`}
            </p>
          </div>
        </div>

        {branch && (
          <div className="flex min-w-0 items-start gap-2.5 text-sm">
            <GraduationCap size={15} className={cn('mt-0.5 shrink-0', ICON.amber)} />
            <div className="min-w-0">
              <p className={cn('text-xs', muted)}>Branch</p>
              <p className="mt-1 break-words font-medium text-neutral-700 dark:text-neutral-300">
                {branch}
              </p>
            </div>
          </div>
        )}

        {semester && (
          <div className="flex min-w-0 items-start gap-2.5 text-sm">
            <BookOpen size={15} className={cn('mt-0.5 shrink-0', ICON.violet)} />
            <div className="min-w-0">
              <p className={cn('text-xs', muted)}>Semester</p>
              <p className="mt-1 break-words font-medium text-neutral-700 dark:text-neutral-300">
                Semester {semester}
              </p>
            </div>
          </div>
        )}

        {academicSession && (
          <div className="flex min-w-0 items-start gap-2.5 text-sm">
            <CalendarRange size={15} className={cn('mt-0.5 shrink-0', ICON.sky)} />
            <div className="min-w-0">
              <p className={cn('text-xs', muted)}>Academic session</p>
              <p className="mt-1 break-words font-medium text-neutral-700 dark:text-neutral-300">
                {academicSession}
              </p>
            </div>
          </div>
        )}

        <div className="flex min-w-0 items-start gap-2.5 text-sm">
          <CalendarDays size={15} className={cn('mt-0.5 shrink-0', ICON.orange)} />
          <div className="min-w-0">
            <p className={cn('text-xs', muted)}>
              {deadline ? 'Deadline' : 'Deadline status'}
            </p>
            {deadline ? (
              <>
                <p
                  className={cn(
                    'mt-1 inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                    deadlineStyles[deadline.tone],
                  )}
                >
                  <Clock3 size={12} className="shrink-0" />
                  <span className="break-words">{deadline.label}</span>
                </p>
                {deadline.dateLabel && (
                  <p className={cn('mt-1 text-xs', muted)}>{deadline.dateLabel}</p>
                )}
              </>
            ) : (
              <p className="mt-1 font-medium text-neutral-700 dark:text-neutral-300">
                No deadline set
              </p>
            )}
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-2.5 text-sm">
          <Clock3 size={15} className={cn('mt-0.5 shrink-0', ICON.neutral)} />
          <div className="min-w-0">
            <p className={cn('text-xs', muted)}>Last updated</p>
            <p className="mt-1 break-words font-medium text-neutral-700 dark:text-neutral-300">
              {updatedAt ? formatDate(updatedAt) : 'Not available'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-neutral-100 pt-4 dark:border-white/[0.06]">
        <div className="mb-3">
          <CopyGroupId id={id} />
        </div>

        {isExpired ? (
          <span
            aria-disabled="true"
            className="inline-flex min-h-10 w-full cursor-not-allowed select-none items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          >
            <AlertCircle size={15} />
            Expired
          </span>
        ) : id !== null ? (
          <Link
            to={`/app/groups/${encodeURIComponent(id)}`}
            className={cn(primaryButton, 'w-full')}
          >
            Open Group
            <ArrowUpRight size={15} />
          </Link>
        ) : (
          <span className="inline-flex min-h-10 w-full cursor-not-allowed select-none items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-400 dark:border-white/10 dark:text-neutral-500">
            Open Group
          </span>
        )}
      </div>
    </article>
  );
}

function EmptyState({ filtered, onClear }) {
  return (
    <div className={cn(card, 'border-dashed px-5 py-14 text-center sm:py-16')}>
      <div
        className={cn(
          iconBox,
          'mx-auto h-14 w-14 rounded-2xl',
          filtered ? TONES.sky : TONES.violet,
        )}
      >
        {filtered ? <Search size={25} /> : <Users size={25} />}
      </div>

      <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
        {filtered ? 'No groups match your filters' : 'No groups assigned yet'}
      </h3>

      <p className={cn('mx-auto mt-2 max-w-md text-sm leading-6', muted)}>
        {filtered
          ? 'Try another search term or change the status filter.'
          : 'Groups assigned to you by your faculty will appear here.'}
      </p>

      {filtered && (
        <button type="button" onClick={onClear} className={cn(secondaryButton, 'mt-5')}>
          <RotateCcw size={15} />
          Clear filters
        </button>
      )}
    </div>
  );
}

function GroupSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      <div className="space-y-2">
        <div className="h-4 w-36 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
        <div className="h-9 w-48 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-neutral-100 dark:bg-white/[0.06]" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className={cn(card, 'h-28 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')}
          />
        ))}
      </div>

      <div className={cn(card, 'h-40 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className={cn(card, 'h-64 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */

export default function StudentGroupsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['student-groups'],
    queryFn: () => api.listGroups(),
  });

  const groups = useMemo(() => getGroups(data), [data]);

  const stats = useMemo(() => {
    const result = {
      total: groups.length,
      active: 0,
      completed: 0,
      inactive: 0,
    };

    groups.forEach((group) => {
      const status = getStatus(group);

      if (completedStatuses.includes(status)) {
        result.completed += 1;
      } else if (inactiveStatuses.includes(status)) {
        result.inactive += 1;
      } else {
        result.active += 1;
      }
    });

    return result;
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return groups.filter((group) => {
      const name = getGroupName(group).toLowerCase();
      const id = String(getGroupId(group) ?? '').toLowerCase();
      const supervisor = getSupervisor(group).toLowerCase();
      const status = getStatus(group);

      const matchesSearch =
        !query ||
        name.includes(query) ||
        id.includes(query) ||
        supervisor.includes(query);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' &&
          !completedStatuses.includes(status) &&
          !inactiveStatuses.includes(status)) ||
        (filter === 'completed' && completedStatuses.includes(status));

      return matchesSearch && matchesFilter;
    });
  }, [groups, search, filter]);

  const hasFilters = Boolean(search.trim()) || filter !== 'all';

  function clearFilters() {
    setSearch('');
    setFilter('all');
  }

  if (isLoading) return <GroupSkeleton />;

  const dash = Boolean(isError);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      {/* Header */}
      <section>
        <div className={cn('mb-3 flex flex-wrap items-center gap-2 text-sm', muted)}>
          <UsersRound size={16} className={ICON.violet} />
          <span>Student workspace</span>
          <ChevronRight size={14} />
          <span className="text-neutral-800 dark:text-neutral-200">My Groups</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              My Groups
            </h1>
            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              View your assigned groups, supervisors, members and project deadlines.
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
              Unable to load your groups
            </p>
            <p className={cn('mt-1 break-words', muted)}>
              {error?.message || 'Something went wrong while loading groups.'}
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
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <StatCard
          label="Total groups"
          value={dash ? '—' : stats.total}
          hint="Groups assigned to you"
          icon={Users}
          tone="sky"
        />
        <StatCard
          label="Active groups"
          value={dash ? '—' : stats.active}
          hint="Currently in progress"
          icon={FolderKanban}
          tone="violet"
        />
        <StatCard
          label="Completed"
          value={dash ? '—' : stats.completed}
          hint="Completed or submitted"
          icon={CheckCircle2}
          tone="emerald"
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
              Find a group
            </h2>
            <p className={cn('text-sm', muted)}>
              Search by group name, group ID or supervisor.
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-500"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search groups, IDs or supervisors..."
              aria-label="Search groups"
              className={cn(fieldClass, 'pl-9 pr-10')}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All groups' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
            ].map((option) => {
              const selected = filter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  aria-pressed={selected}
                  className={cn(
                    'inline-flex min-h-11 whitespace-nowrap items-center rounded-xl px-3.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 sm:text-sm',
                    selected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-4 dark:border-white/[0.06]">
          <span className={cn('text-sm', muted)}>
            {filteredGroups.length} of {groups.length} groups
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {stats.inactive} inactive or closed
          </span>
        </div>
      </section>

      {/* Groups list */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className={cn(iconBox, 'h-9 w-9', TONES.emerald)}>
            <FolderKanban size={17} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
              Your groups
            </h2>
            <p className={cn('text-sm', muted)}>
              {filteredGroups.length} of {groups.length} groups
            </p>
          </div>
        </div>

        {!isError && filteredGroups.length === 0 ? (
          <EmptyState filtered={hasFilters} onClear={clearFilters} />
        ) : !isError ? (
          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((group, index) => (
              <GroupCard key={getGroupId(group) ?? index} group={group} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}