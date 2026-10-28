
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  FolderPlus,
  Loader2,
  RefreshCw,
  Search,
  Users,
  Activity,
  GraduationCap,
  CalendarDays,
  Layers3,
  Code2,
  UserRound,
  Hash,
  ChevronDown,
  ChevronUp,
  Filter,
  ClipboardCheck,
  BookOpen,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate, cn } from '../../lib/utils';

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.025]';

const STATUS = {
  submitted: {
    label: 'Submitted',
    style: 'bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
    dot: 'bg-sky-500',
    icon: FileText,
  },
  under_review: {
    label: 'Under review',
    style: 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
    dot: 'bg-violet-500',
    icon: Clock3,
  },
  changes_requested: {
    label: 'Changes requested',
    style: 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300',
    dot: 'bg-amber-500',
    icon: AlertCircle,
  },
  approved: {
    label: 'Approved',
    style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    style: 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300',
    dot: 'bg-red-500',
    icon: AlertCircle,
  },
};

function StatusBadge({ status }) {
  const item = STATUS[status];
  const Icon = item?.icon || AlertCircle;

  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
        item?.style || 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300',
      )}
    >
      <Icon size={12} />
      {item?.label || status?.replaceAll('_', ' ') || 'Unknown'}
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
          <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, accent, description }) {
  const accents = {
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  };

  return (
    <article className={cn(card, 'min-w-0 p-5 transition-colors hover:border-neutral-300 dark:hover:border-white/20')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {title}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-neutral-900 dark:text-white">
            {value}
          </p>
        </div>
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', accents[accent] || accents.blue)}>
          <Icon size={21} strokeWidth={1.8} />
        </span>
      </div>
      {description && (
        <p className="mt-3 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      )}
    </article>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <span className="rounded-2xl bg-neutral-100 p-3.5 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400">
        <Icon size={23} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-neutral-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function getProjectTitle(project) {
  return project.title || project.name || 'Untitled project';
}

function getStudentName(project) {
  return (
    project.student_name ||
    project.creator?.full_name ||
    project.creator?.name ||
    project.created_by_name ||
    'Student details unavailable'
  );
}

function getMembers(project) {
  const members = project.members || project.project_members || [];

  return members.filter(
    (member) =>
      !member.membership_status ||
      member.membership_status === 'active',
  );
}

function getMemberName(member) {
  return (
    member.student?.full_name ||
    member.profile?.full_name ||
    member.full_name ||
    member.student_name ||
    member.name ||
    'Unnamed member'
  );
}

function getTechnologies(project) {
  const technologies =
    project.technologies ||
    project.project_technologies ||
    [];

  return technologies
    .map((item) => {
      if (typeof item === 'string') return item;

      return (
        item.technology?.name ||
        item.technology_name ||
        item.name ||
        null
      );
    })
    .filter(Boolean);
}

function getStage(project) {
  return project.stage?.name || project.stage || null;
}

function getCategory(project) {
  return (
    project.category?.name ||
    project.category_name ||
    project.project_type ||
    null
  );
}

function DetailItem({ icon: Icon, label, value }) {
  if (value === null || value === undefined || value === '') return null;

  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm text-neutral-700 dark:text-neutral-300">
          {value}
        </p>
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false);
  const [teamExpanded, setTeamExpanded] = useState(false);

  const members = getMembers(project);
  const technologies = getTechnologies(project);
  const title = getProjectTitle(project);
  const studentName = getStudentName(project);
  const category = getCategory(project);
  const stage = getStage(project);
  const description =
    project.short_description ||
    project.description ||
    project.problem_statement ||
    '';

  const submittedDate =
    project.submitted_at ||
    project.created_at ||
    null;

  const leader = members.find(
    (member) =>
      member.team_role === 'leader' ||
      member.role === 'leader',
  );

  const memberCount =
    project.member_count ??
    project.active_member_count ??
    (members.length || null);

  return (
    <article className="p-4 transition-colors hover:bg-neutral-50/60 dark:hover:bg-white/[0.015] sm:p-5 lg:p-6">
      <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
          <FolderKanban size={21} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {project.project_code && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-300">
                    <Hash size={11} />
                    {project.project_code}
                  </span>
                )}
                {category && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {category}
                  </span>
                )}
              </div>

              <h3 className="mt-2 break-words text-base font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-lg">
                {title}
              </h3>

              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Submitted by{' '}
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {studentName}
                </span>
              </p>
            </div>

            <StatusBadge status={project.status} />
          </div>

          {description && (
            <p className={cn('mt-4 max-w-4xl break-words text-sm leading-6 text-neutral-600 dark:text-neutral-300', !expanded && 'line-clamp-2')}>
              {description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2.5 text-xs text-neutral-500 dark:text-neutral-400">
            {submittedDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} />
                {formatDate(submittedDate)}
              </span>
            )}
            {memberCount !== null && memberCount !== undefined && (
              <span className="inline-flex items-center gap-1.5">
                <Users size={13} />
                {memberCount} {Number(memberCount) === 1 ? 'member' : 'members'}
              </span>
            )}
            {stage && (
              <span className="inline-flex items-center gap-1.5">
                <Layers3 size={13} />
                {stage}
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-4 rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-white/[0.07] dark:bg-white/[0.025] sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem icon={UserRound} label="Submitted by" value={studentName} />
            <DetailItem
              icon={GraduationCap}
              label="Team leader"
              value={leader ? getMemberName(leader) : project.team_leader_name}
            />
            <DetailItem icon={Layers3} label="Category" value={category} />
            <DetailItem icon={Activity} label="Project stage" value={stage} />
            <DetailItem
              icon={Users}
              label="Team size"
              value={
                memberCount !== null && memberCount !== undefined
                  ? `${memberCount} active ${Number(memberCount) === 1 ? 'member' : 'members'}`
                  : null
              }
            />
            <DetailItem
              icon={Clock3}
              label="Revision"
              value={project.current_revision ? `Revision ${project.current_revision}` : null}
            />
          </div>

          {technologies.length > 0 && (
            <div className="mt-5">
              <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                <Code2 size={14} className="text-neutral-400" />
                Technology stack
              </div>
              <div className="flex flex-wrap gap-2">
                {technologies.map((technology, index) => (
                  <span
                    key={`${technology}-${index}`}
                    className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:border-white/10 dark:bg-white/[0.025] dark:text-neutral-300"
                  >
                    {technology}
                  </span>
                ))}
              </div>
            </div>
          )}

          {members.length > 0 && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setTeamExpanded((value) => !value)}
                aria-expanded={teamExpanded}
                className="inline-flex min-h-8 items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
              >
                <Users size={14} />
                {teamExpanded ? 'Hide team members' : `View team members (${members.length})`}
                {teamExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {teamExpanded && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {members.map((member, index) => (
                    <div
                      key={member.id || member.student_id || index}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-neutral-200 p-3 dark:border-white/10"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                        <UserRound size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {getMemberName(member)}
                        </p>
                        <p className="mt-1 text-[10px] capitalize text-neutral-500 dark:text-neutral-400">
                          {(member.team_role || member.role || 'member').replaceAll('_', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {expanded && (
            <div className="mt-5 rounded-xl border border-neutral-200 p-4 dark:border-white/10">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen size={15} className="text-neutral-400" />
                <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Additional project information
                </h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem icon={FileText} label="Project type" value={project.project_type} />
                <DetailItem
                  icon={CalendarDays}
                  label="Submission date"
                  value={submittedDate ? formatDate(submittedDate) : null}
                />
                <DetailItem icon={UserRound} label="Created by" value={studentName} />
                <DetailItem icon={Hash} label="Project ID" value={project.id} />
                <DetailItem
                  icon={ClipboardCheck}
                  label="Revision"
                  value={project.current_revision ?? null}
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 border-t border-neutral-200 pt-4 dark:border-white/[0.07] sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              className="inline-flex min-h-9 items-center gap-2 self-start text-xs font-semibold text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              {expanded ? 'Show less details' : 'View all project details'}
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <Link
              to={`/faculty/reviews/${project.id}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Open project review
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FacultyDashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['review-queue'],
    queryFn: () => api.getReviewQueue(),
  });

  const {
    data: groupsRes,
    isLoading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups,
  } = useQuery({
    queryKey: ['groups'],
    queryFn: api.listGroups,
  });

  const projects = data?.projects || [];
  const groups = groupsRes?.groups || [];

  const submitted = projects.filter((project) => project.status === 'submitted');
  const underReview = projects.filter((project) => project.status === 'under_review');
  const changesRequested = projects.filter((project) => project.status === 'changes_requested');
  const approved = projects.filter((project) => project.status === 'approved');

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter;

      const searchable = [
        project.title,
        project.name,
        project.project_code,
        project.student_name,
        project.creator?.full_name,
        project.group_name,
        project.short_description,
        project.description,
        project.category?.name,
        project.category_name,
        project.project_type,
        getStage(project),
        ...getTechnologies(project),
        ...getMembers(project).map(getMemberName),
      ];

      const matchesSearch =
        !term ||
        searchable.some((value) =>
          String(value || '').toLowerCase().includes(term),
        );

      return matchesStatus && matchesSearch;
    });
  }, [projects, search, statusFilter]);

  return (
    <div className="w-full space-y-9 pb-8 sm:space-y-10">
      <section id="overview" className="scroll-mt-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <Link
                to="/faculty"
                className="inline-flex items-center gap-2 transition hover:text-neutral-900 dark:hover:text-white"
              >
                <GraduationCap size={17} />
                Faculty workspace
              </Link>
              <span className="text-neutral-300 dark:text-neutral-600">/</span>
              <span className="text-neutral-900 dark:text-white">Dashboard</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
              Review dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-500 dark:text-neutral-400 sm:text-base">
              Manage academic submissions, track review progress, and access student project details from one place.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:min-w-[190px] sm:items-stretch">
            <button
              type="button"
              onClick={() => {
                refetch();
                refetchGroups();
              }}
              disabled={isFetching}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.025] dark:text-neutral-200 dark:hover:bg-white/[0.06]"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>

            <Link
              to="/faculty/groups/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <FolderPlus size={16} />
              New group
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section id="statistics" className="scroll-mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total submissions"
            value={projects.length}
            description="Projects in your review queue"
            icon={FileText}
            accent="blue"
          />
          <StatCard
            title="Awaiting review"
            value={submitted.length}
            description="New submissions to evaluate"
            icon={CalendarDays}
            accent="amber"
          />
          <StatCard
            title="Under review"
            value={underReview.length}
            description="Currently being assessed"
            icon={Activity}
            accent="violet"
          />
          <StatCard
            title="Changes requested"
            value={changesRequested.length}
            description="Waiting for student updates"
            icon={AlertCircle}
            accent="emerald"
          />
        </div>
      </section>

      <section id="review-queue" className="scroll-mt-6 space-y-4">
        <SectionHeading
          title="Review queue"
          description="Search submissions, filter by status, and open projects for review."
          action={
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.025] dark:text-neutral-300 dark:hover:bg-white/[0.06]"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Refresh list
            </button>
          }
        />

        <div className={cn(card, 'overflow-hidden')}>
          <div className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search projects, students, technologies..."
                  aria-label="Search projects"
                  className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-500/10 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-violet-400/40"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  <Filter size={14} />
                  Filter status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter projects by status"
                  className="min-h-11 min-w-44 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-violet-300 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  <option value="all">All statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under review</option>
                  <option value="changes_requested">Changes requested</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                {(search || statusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('all');
                    }}
                    className="min-h-10 rounded-lg px-3 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Showing{' '}
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {filteredProjects.length}
                </span>{' '}
                of {projects.length} submissions
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  {submitted.length} submitted
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  {underReview.length} under review
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {approved.length} approved
                </span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
              <Loader2 size={19} className="animate-spin text-violet-500" />
              Loading submissions...
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertCircle}
              title="Unable to load submissions"
              description={error.message || 'Check your connection and try again.'}
              action={
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
                >
                  Try again
                </button>
              }
            />
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={projects.length === 0 ? 'No submissions yet' : 'No matching projects'}
              description={
                projects.length === 0
                  ? 'Student submissions will appear here when they are ready for review.'
                  : 'Try another search term or choose a different status.'
              }
              action={
                projects.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('all');
                    }}
                    className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 dark:border-white/10 dark:text-neutral-300"
                  >
                    Reset filters
                  </button>
                ) : null
              }
            />
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-white/[0.07]">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="submission-overview" className="scroll-mt-6 space-y-4">
        <SectionHeading
          title="Submission progress"
          description="A quick summary of approved projects and current workflow."
        />

        <div className={cn(card, 'p-4 sm:p-5')}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <CheckCircle2 size={19} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Approved projects
                </h3>
                <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                  Projects currently marked as approved in your review queue.
                </p>
              </div>
            </div>

            <p className="text-2xl font-semibold tabular-nums text-neutral-900 dark:text-white">
              {approved.length}
              <span className="ml-1 text-sm font-normal text-neutral-400">
                / {projects.length}
              </span>
            </p>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${projects.length ? (approved.length / projects.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section id="submission-groups" className="scroll-mt-6 space-y-4">
        <SectionHeading
          title="Submission groups"
          description="Groups available to your faculty account."
          action={
            <Link
              to="/faculty/groups"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
            >
              View all groups
              <ArrowRight size={15} />
            </Link>
          }
        />

        {groupsLoading ? (
          <div className={cn(card, 'flex min-h-32 items-center justify-center gap-3 text-sm text-neutral-500 dark:text-neutral-400')}>
            <Loader2 size={18} className="animate-spin text-violet-500" />
            Loading groups...
          </div>
        ) : groupsError ? (
          <div className={card}>
            <EmptyState
              icon={AlertCircle}
              title="Unable to load groups"
              description={groupsError.message || 'Please try again.'}
              action={
                <button
                  type="button"
                  onClick={() => refetchGroups()}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 dark:border-white/10 dark:text-neutral-300"
                >
                  Try again
                </button>
              }
            />
          </div>
        ) : groups.length === 0 ? (
          <div className={card}>
            <EmptyState
              icon={Users}
              title="No submission groups"
              description="Create a group to organise student submissions."
              action={
                <Link
                  to="/faculty/groups/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
                >
                  <FolderPlus size={15} />
                  Create group
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.slice(0, 6).map((group) => (
              <Link
                key={group.id}
                to={`/faculty/groups/${group.id}`}
                className={cn(
                  card,
                  'group flex min-w-0 flex-col p-5 transition hover:border-violet-200 hover:bg-neutral-50/60 dark:hover:border-violet-400/20 dark:hover:bg-white/[0.04]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-xl bg-violet-50 p-2.5 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                    <Users size={19} />
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-neutral-400 transition group-hover:text-neutral-800 dark:group-hover:text-white"
                  />
                </div>

                <h3 className="mt-4 break-words text-sm font-semibold text-neutral-900 dark:text-white">
                  {group.name || group.title || 'Untitled group'}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {group.description || 'Open this group to view its details and related submissions.'}
                </p>

                <div className="mt-5 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-white/[0.07] dark:text-neutral-400">
                  <span>Open group details</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="flex flex-col gap-2 border-t border-neutral-200 pt-4 text-xs text-neutral-400 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <GraduationCap size={15} />
          ResearchFlow · Faculty workspace
        </span>
        <span>Project review and submission management</span>
      </footer>
    </div>
  );
}
