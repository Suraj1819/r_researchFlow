
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  FolderOpen,
  FolderPlus,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  Users,
  AlertCircle,
  Filter,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  BookOpen,
  Building2,
  ChevronRight,
  CircleCheck,
  CircleAlert,
  CalendarClock,
  Layers3,
  UserRound,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate, cn } from '../../lib/utils';

const card =
  'rounded-2xl border border-neutral-200/90 bg-white dark:border-white/10 dark:bg-neutral-950';

const input =
  'mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/[0.04]';

function IconTile({ icon: Icon, tone = 'blue', size = 'normal' }) {
  const tones = {
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
  };

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        size === 'small' ? 'h-9 w-9' : 'h-11 w-11',
        tones[tone] || tones.blue,
      )}
    >
      <Icon size={size === 'small' ? 17 : 20} strokeWidth={1.8} />
    </span>
  );
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone, description }) {
  return (
    <div className={cn(card, 'min-w-0 p-5 transition-colors hover:border-neutral-300 dark:hover:border-white/20')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-neutral-900 dark:text-white">
            {value}
          </p>
        </div>
        <IconTile icon={Icon} tone={tone} />
      </div>
      {description && (
        <p className="mt-3 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      )}
    </div>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className={cn(card, 'px-5 py-14 text-center sm:py-16')}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400">
        {hasFilters ? <Search size={24} /> : <FolderOpen size={24} />}
      </div>

      <h3 className="mt-4 text-base font-semibold text-neutral-900 dark:text-white">
        {hasFilters ? 'No matching groups' : 'No submission groups yet'}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500 dark:text-neutral-400">
        {hasFilters
          ? 'Try another search term or clear your filters to see all groups.'
          : 'Create a submission group to organise student projects by academic year, branch and semester.'}
      </p>

      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]"
        >
          <X size={15} />
          Clear filters
        </button>
      ) : (
        <Link
          to="/faculty/groups/new"
          className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <FolderPlus size={16} />
          Create first group
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}

function DeadlineBadge({ deadline, getDeadlineState }) {
  const state = getDeadlineState(deadline);
  if (!state) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        state.style,
      )}
    >
      {state.label === 'Deadline passed' ? (
        <CircleAlert size={13} />
      ) : state.label === 'Due today' ? (
        <Clock3 size={13} />
      ) : (
        <CircleCheck size={13} />
      )}
      {state.label}
    </span>
  );
}

const initialForm = {
  title: '',
  description: '',
  academic_year: '',
  session_year: '',
  branch: '',
  semester: '',
  coordinator_name: '',
  starts_at: '',
  submission_deadline: '',
  is_published: true,
};

export default function GroupsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [editingGroup, setEditingGroup] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [editError, setEditError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['groups'],
    queryFn: api.listGroups,
  });

  const groups = data?.groups || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.updateGroup(id, payload),
    onSuccess: async () => {
      setEditingGroup(null);
      setEditError('');
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (err) => {
      setEditError(err.message || 'Failed to update group.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteGroup(id),
    onSuccess: async () => {
      setDeleteTarget(null);
      setDeleteError('');
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (err) => {
      setDeleteError(err.message || 'Failed to delete group.');
    },
  });

  const academicYears = useMemo(
    () =>
      [...new Set(groups.map((group) => group.academic_year).filter(Boolean))]
        .sort((a, b) => String(b).localeCompare(String(a))),
    [groups],
  );

  const branches = useMemo(
    () =>
      [...new Set(groups.map((group) => group.branch).filter(Boolean))].sort(),
    [groups],
  );

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();

    return groups.filter((group) => {
      const matchesSearch =
        !term ||
        [
          group.title,
          group.name,
          group.academic_year,
          group.session_year,
          group.branch,
          group.coordinator_name,
          group.creator?.full_name,
          group.description,
          group.semester,
        ].some((value) =>
          String(value || '').toLowerCase().includes(term),
        );

      const matchesYear =
        yearFilter === 'all' ||
        String(group.academic_year) === yearFilter;

      const matchesBranch =
        branchFilter === 'all' || group.branch === branchFilter;

      return matchesSearch && matchesYear && matchesBranch;
    });
  }, [groups, search, yearFilter, branchFilter]);

  const hasFilters =
    Boolean(search.trim()) ||
    yearFilter !== 'all' ||
    branchFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setYearFilter('all');
    setBranchFilter('all');
  };

  function openEdit(group) {
    setEditingGroup(group);
    setEditError('');

    setEditForm({
      title: group.title || group.name || '',
      description: group.description || '',
      academic_year: group.academic_year || '',
      session_year: group.session_year || '',
      branch: group.branch || '',
      semester: group.semester || '',
      coordinator_name: group.coordinator_name || '',
      starts_at: group.starts_at?.slice(0, 10) || '',
      submission_deadline: group.submission_deadline?.slice(0, 10) || '',
      is_published: group.is_published !== false,
    });
  }

  function closeEdit() {
    if (updateMutation.isPending) return;
    setEditingGroup(null);
    setEditError('');
  }

  function updateField(name, value) {
    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleEditSubmit(event) {
    event.preventDefault();
    setEditError('');

    if (editForm.title.trim().length < 3) {
      setEditError('Title must contain at least 3 characters.');
      return;
    }

    if (editForm.academic_year.trim().length < 2) {
      setEditError('Please enter a valid academic year.');
      return;
    }

    if (
      editForm.starts_at &&
      editForm.submission_deadline &&
      editForm.submission_deadline < editForm.starts_at
    ) {
      setEditError('Submission deadline cannot be before the start date.');
      return;
    }

    updateMutation.mutate({
      id: editingGroup.id,
      payload: {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        academic_year: editForm.academic_year.trim(),
        session_year:
          editForm.session_year.trim() ||
          editForm.academic_year.trim(),
        branch: editForm.branch.trim() || null,
        semester: editForm.semester.trim() || null,
        coordinator_name: editForm.coordinator_name.trim() || null,
        starts_at: editForm.starts_at || null,
        submission_deadline: editForm.submission_deadline || null,
        is_published: editForm.is_published,
      },
    });
  }

  const getDeadlineState = (deadline) => {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadlineDay = new Date(
      deadlineDate.getFullYear(),
      deadlineDate.getMonth(),
      deadlineDate.getDate(),
    );

    if (deadlineDay < today) {
      return {
        label: 'Deadline passed',
        style: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
      };
    }

    if (deadlineDay.getTime() === today.getTime()) {
      return {
        label: 'Due today',
        style: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
      };
    }

    return {
      label: 'Upcoming deadline',
      style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    };
  };

  const publishedCount = groups.filter(
    (group) => group.is_published !== false,
  ).length;

  const upcomingDeadlines = groups.filter((group) => {
    const state = getDeadlineState(group.submission_deadline);
    return state?.label === 'Upcoming deadline' || state?.label === 'Due today';
  }).length;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 pb-8">
      <section>
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"
        >
          <GraduationCap size={17} className="shrink-0" />
          <Link
            to="/faculty"
            className="transition hover:text-neutral-900 dark:hover:text-white"
          >
            Faculty workspace
          </Link>
          <ChevronRight size={14} className="text-neutral-400" />
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            Submission groups
          </span>
        </nav>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <Layers3 size={14} />
              ACADEMIC PROJECT MANAGEMENT
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
              Submission groups
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400 sm:text-base">
              Manage academic groups, organise project submissions, and keep
              track of coordinators, academic sessions and deadlines from one place.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-white/[0.05]"
            >
              <RefreshCw
                size={15}
                className={isFetching ? 'animate-spin' : ''}
              />
              Refresh
            </button>

            <Link
              to="/faculty/groups/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <FolderPlus size={16} />
              New group
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {deleteError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1">{deleteError}</p>
          <button
            type="button"
            onClick={() => setDeleteError('')}
            aria-label="Dismiss error"
            className="rounded-md p-0.5 transition hover:bg-red-100 dark:hover:bg-red-500/10"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total groups"
          value={groups.length}
          description="All groups available to your faculty account"
          icon={FolderOpen}
          tone="blue"
        />
        <StatCard
          label="Academic years"
          value={academicYears.length}
          description="Distinct academic years represented"
          icon={GraduationCap}
          tone="violet"
        />
        <StatCard
          label="Branches covered"
          value={branches.length}
          description="Branches represented across groups"
          icon={Users}
          tone="green"
        />
      </section>

      <section className={cn(card, 'p-4 sm:p-5')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <IconTile icon={SlidersHorizontal} tone="neutral" size="small" />
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Find a group
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Search and filter the available submission groups
              </p>
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-9 items-center gap-1.5 self-start text-xs font-medium text-neutral-500 transition hover:text-neutral-900 dark:hover:text-white sm:self-auto"
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search groups, coordinators..."
              aria-label="Search submission groups"
              className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:ring-white/[0.04]"
            />
          </div>

          <select
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
            aria-label="Filter by academic year"
            className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="all">All academic years</option>
            {academicYears.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
            aria-label="Filter by branch"
            className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="all">All branches</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Active filters:
            </span>
            {search.trim() && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:bg-white/[0.07] dark:text-neutral-300">
                <Search size={12} />
                {search.trim()}
              </span>
            )}
            {yearFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:bg-white/[0.07] dark:text-neutral-300">
                <CalendarDays size={12} />
                {yearFilter}
              </span>
            )}
            {branchFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:bg-white/[0.07] dark:text-neutral-300">
                <GraduationCap size={12} />
                {branchFilter}
              </span>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="All groups"
          description={
            isLoading
              ? 'Loading submission groups...'
              : `${filteredGroups.length} of ${groups.length} groups`
          }
          action={
            !isLoading && groups.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <FolderOpen size={14} />
                {groups.length} total
              </span>
            ) : null
          }
        />

        {!isLoading && !error && groups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">
              <CircleCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
              {publishedCount} published
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300">
              <CalendarClock size={13} className="text-sky-600 dark:text-sky-400" />
              {upcomingDeadlines} upcoming or due today
            </span>
          </div>
        )}

        {isLoading ? (
          <div className={cn(card, 'flex min-h-56 flex-col items-center justify-center gap-3')}>
            <Loader2 size={25} className="animate-spin text-neutral-400" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Loading submission groups...
            </p>
          </div>
        ) : error ? (
          <div className={cn(card, 'px-5 py-12 text-center')}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
              <AlertCircle size={22} />
            </div>
            <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
              Could not load groups
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {error.message || 'Something went wrong while fetching groups.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : filteredGroups.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((group) => {
              const title = group.title || group.name || 'Untitled group';
              const coordinator =
                group.coordinator_name ||
                group.creator?.full_name ||
                'Not assigned';

              return (
                <article
                  key={group.id}
                  className={cn(
                    card,
                    'group flex min-w-0 flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:hover:border-white/20',
                  )}
                >
                  <Link
                    to={`/faculty/groups/${group.id}`}
                    className="flex min-w-0 flex-1 flex-col p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-400 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <IconTile icon={FolderOpen} tone="violet" />
                      <ArrowUpRight
                        size={17}
                        className="mt-1 shrink-0 text-neutral-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:group-hover:text-white"
                      />
                    </div>

                    <div className="mt-4">
                      <h3 className="break-words text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
                        {title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
                        {group.description || 'No description has been added for this group.'}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.academic_year && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                          <GraduationCap size={13} />
                          {group.academic_year}
                        </span>
                      )}
                      {group.session_year && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                          <CalendarDays size={13} />
                          {group.session_year}
                        </span>
                      )}
                      {group.semester && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300">
                          <BookOpen size={13} />
                          Semester {group.semester}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 space-y-3 border-t border-neutral-100 pt-4 dark:border-white/[0.07]">
                      {group.branch && (
                        <div className="flex min-w-0 items-start gap-2.5 text-sm">
                          <GraduationCap size={15} className="mt-0.5 shrink-0 text-neutral-400" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                              Branch
                            </p>
                            <p className="mt-0.5 break-words text-neutral-700 dark:text-neutral-300">
                              {group.branch}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex min-w-0 items-start gap-2.5 text-sm">
                        <UserRound size={15} className="mt-0.5 shrink-0 text-neutral-400" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                            Coordinator
                          </p>
                          <p className="mt-0.5 break-words text-neutral-700 dark:text-neutral-300">
                            {coordinator}
                          </p>
                        </div>
                      </div>

                      {group.submission_deadline && (
                        <div className="flex min-w-0 items-start gap-2.5 text-sm">
                          <CalendarDays size={15} className="mt-0.5 shrink-0 text-neutral-400" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                              Submission deadline
                            </p>
                            <p className="mt-0.5 break-words font-medium text-neutral-800 dark:text-neutral-200">
                              {formatDate(group.submission_deadline)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <DeadlineBadge
                        deadline={group.submission_deadline}
                        getDeadlineState={getDeadlineState}
                      />
                      {group.is_published === false ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300">
                          <Clock3 size={13} />
                          Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          <CheckCircle2 size={13} />
                          Published
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 text-sm dark:border-white/[0.07]">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        View group details
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-neutral-400 transition group-hover:translate-x-1 group-hover:text-neutral-900 dark:group-hover:text-white"
                      />
                    </div>
                  </Link>

                  <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50/70 px-5 py-3 dark:border-white/[0.07] dark:bg-white/[0.02]">
                    <span className="text-xs text-neutral-400">
                      Group actions
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(group)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-white/[0.06]"
                      >
                        <Edit3 size={13} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError('');
                          setDeleteTarget(group);
                        }}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-400/20 dark:bg-neutral-950 dark:text-red-300 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && !error && filteredGroups.length > 0 && (
          <p className="text-xs text-neutral-400">
            Showing {filteredGroups.length} of {groups.length} submission groups
          </p>
        )}
      </section>

      <footer className="flex flex-col gap-2 border-t border-neutral-200 pt-4 text-xs text-neutral-400 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <span>ResearchFlow · Faculty workspace</span>
        <span>Academic project management</span>
      </footer>

      {editingGroup && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEdit();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-group-title"
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-950 sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-neutral-100 bg-white p-5 dark:border-white/10 dark:bg-neutral-950 sm:p-6">
              <div className="flex items-start gap-3">
                <IconTile icon={Edit3} tone="violet" />
                <div>
                  <h2 id="edit-group-title" className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Edit submission group
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Update the academic details and submission schedule.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                disabled={updateMutation.isPending}
                aria-label="Close edit form"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5 p-5 sm:p-6">
              <div>
                <label htmlFor="group-title" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Group title <span className="text-red-500">*</span>
                </label>
                <input
                  id="group-title"
                  required
                  minLength={3}
                  maxLength={200}
                  value={editForm.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  className={input}
                  placeholder="e.g. Final Year Projects 2026"
                />
              </div>

              <div>
                <label htmlFor="group-description" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Description
                </label>
                <textarea
                  id="group-description"
                  rows={3}
                  maxLength={2000}
                  value={editForm.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  className={cn(input, 'resize-y')}
                  placeholder="Describe the purpose of this group..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="academic-year" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Academic year <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="academic-year"
                    required
                    minLength={2}
                    maxLength={30}
                    value={editForm.academic_year}
                    onChange={(event) => updateField('academic_year', event.target.value)}
                    className={input}
                    placeholder="2026-27"
                  />
                </div>

                <div>
                  <label htmlFor="session-year" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Session year
                  </label>
                  <input
                    id="session-year"
                    maxLength={30}
                    value={editForm.session_year}
                    onChange={(event) => updateField('session_year', event.target.value)}
                    className={input}
                    placeholder="2026-27"
                  />
                </div>

                <div>
                  <label htmlFor="group-branch" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Branch
                  </label>
                  <input
                    id="group-branch"
                    maxLength={80}
                    value={editForm.branch}
                    onChange={(event) => updateField('branch', event.target.value)}
                    className={input}
                    placeholder="Computer Science Engineering"
                  />
                </div>

                <div>
                  <label htmlFor="group-semester" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Semester
                  </label>
                  <input
                    id="group-semester"
                    maxLength={30}
                    value={editForm.semester}
                    onChange={(event) => updateField('semester', event.target.value)}
                    className={input}
                    placeholder="7"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="coordinator-name" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Coordinator name
                  </label>
                  <input
                    id="coordinator-name"
                    maxLength={120}
                    value={editForm.coordinator_name}
                    onChange={(event) => updateField('coordinator_name', event.target.value)}
                    className={input}
                    placeholder="Faculty coordinator"
                  />
                </div>

                <div>
                  <label htmlFor="group-start-date" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Start date
                  </label>
                  <input
                    id="group-start-date"
                    type="date"
                    value={editForm.starts_at}
                    onChange={(event) => updateField('starts_at', event.target.value)}
                    className={input}
                  />
                </div>

                <div>
                  <label htmlFor="group-deadline" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Submission deadline
                  </label>
                  <input
                    id="group-deadline"
                    type="date"
                    min={editForm.starts_at || undefined}
                    value={editForm.submission_deadline}
                    onChange={(event) => updateField('submission_deadline', event.target.value)}
                    className={input}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4 transition hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/[0.03]">
                <input
                  type="checkbox"
                  checked={editForm.is_published}
                  onChange={(event) => updateField('is_published', event.target.checked)}
                  className="mt-1 h-4 w-4 accent-neutral-900"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-white">
                    Publish group
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      editForm.is_published
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
                    )}>
                      {editForm.is_published ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                    Published groups are visible to students. Unpublished groups remain drafts.
                  </span>
                </span>
              </label>

              {editError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={updateMutation.isPending}
                  className="min-h-11 rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {updateMutation.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {updateMutation.isPending ? 'Saving changes...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleteMutation.isPending
            ) {
              setDeleteTarget(null);
              setDeleteError('');
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-group-title"
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-neutral-950 sm:p-6"
          >
            <IconTile icon={Trash2} tone="red" />
            <h2 id="delete-group-title" className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
              Delete this group?
            </h2>
            <p className="mt-2 break-words text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Are you sure you want to delete{' '}
              <strong className="text-neutral-900 dark:text-white">
                {deleteTarget.title || deleteTarget.name || 'this group'}
              </strong>
              ? This action cannot be undone. Associated student submissions
              and membership records may also be affected.
            </p>

            {deleteError && (
              <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError('');
                }}
                disabled={deleteMutation.isPending}
                className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteMutation.isPending && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                {deleteMutation.isPending ? 'Deleting...' : 'Delete group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
