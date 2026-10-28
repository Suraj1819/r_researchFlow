import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Hash,
  Search,
  ArrowRight,
  Users,
  CalendarDays,
  Layers,
  Eye,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserPlus,
  ShieldCheck,
  Info,
  RotateCcw,
  ChevronRight,
  FolderOpen,
  FileCode2,
  Clock3,
  Crown,
  CalendarCheck,
  CircleHelp,
  Plus,
  Loader2,
  FolderKanban,
  ArrowUpRight,
  GraduationCap,
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
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
};

const ICON = {
  sky: 'text-sky-600 dark:text-sky-300',
  violet: 'text-violet-600 dark:text-violet-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  amber: 'text-amber-600 dark:text-amber-300',
  orange: 'text-orange-600 dark:text-orange-300',
  red: 'text-red-600 dark:text-red-300',
  rose: 'text-rose-600 dark:text-rose-300',
  neutral: 'text-neutral-500 dark:text-neutral-400',
};

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';

const secondaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]';

const fieldClass =
  'min-h-12 w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white/40 dark:focus:ring-white/10';

/* Pick the right tone for a member based on role */
function getMemberTone(role) {
  const r = String(role || '').toLowerCase();
  if (r.includes('leader') || r.includes('supervisor')) return 'amber';
  if (r.includes('frontend')) return 'sky';
  if (r.includes('backend')) return 'violet';
  if (r.includes('design')) return 'rose';
  if (r.includes('research')) return 'emerald';
  if (r.includes('test')) return 'orange';
  return 'neutral';
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', tone: 'neutral' },
  awaiting_members: { label: 'Awaiting members', tone: 'amber' },
  pending: { label: 'Pending', tone: 'amber' },
  submitted: { label: 'Submitted', tone: 'sky' },
  under_review: { label: 'Under review', tone: 'violet' },
  in_review: { label: 'In review', tone: 'violet' },
  approved: { label: 'Approved', tone: 'emerald' },
  active: { label: 'Active', tone: 'emerald' },
  changes_requested: { label: 'Changes requested', tone: 'orange' },
  rejected: { label: 'Rejected', tone: 'red' },
  completed: { label: 'Completed', tone: 'sky' },
  archived: { label: 'Archived', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'neutral' },
};

function normalizeStatusKey(raw) {
  if (!raw) return 'draft';
  const s = String(raw).toLowerCase().trim().replace(/\s+/g, '_').replace(/-/g, '_');
  // common aliases from backend
  if (['submit', 'submission'].includes(s)) return 'submitted';
  if (['review', 'reviewing'].includes(s)) return 'under_review';
  if (['approve', 'accepted'].includes(s)) return 'approved';
  if (['waiting', 'awaiting', 'waiting_members'].includes(s)) return 'awaiting_members';
  if (['change_requested', 'changes', 'revision'].includes(s)) return 'changes_requested';
  if (STATUS_CONFIG[s]) return s;
  return s;
}

const STAGE_LABELS = {
  ideation: 'Ideation',
  planning: 'Planning',
  development: 'Development',
  review: 'Review',
  deployment: 'Deployment',
  maintenance: 'Maintenance',
};

function getProjectFromResponse(response) {
  if (!response) return null;
  if (response.project) return response.project;
  if (response.data?.project) return response.data.project;
  if (response.data && !Array.isArray(response.data)) {
    return response.data;
  }
  return response;
}

function normalizeMember(member, index = 0) {
  const profile = member?.profile || member?.user || member?.student || {};

  return {
    id:
      member?.user_id ||
      member?.student_id ||
      member?.id ||
      profile?.id ||
      `member-${index}`,
    name:
      member?.name ||
      member?.full_name ||
      profile?.full_name ||
      profile?.name ||
      profile?.username ||
      member?.username ||
      'Team member',
    email: member?.email || profile?.email || '',
    role: member?.role || member?.member_role || 'Member',
    avatar:
      member?.avatar_url ||
      member?.avatar ||
      profile?.avatar_url ||
      profile?.avatar ||
      '',
    isLeader:
      member?.is_leader === true ||
      member?.role === 'leader' ||
      member?.role === 'supervisor',
  };
}

function normalizeProject(rawProject) {
  if (!rawProject) return null;

  const rawMembers =
    rawProject.members ||
    rawProject.project_members ||
    rawProject.team_members ||
    rawProject.team ||
    rawProject.students ||
    [];

  let members = Array.isArray(rawMembers)
    ? rawMembers.map(normalizeMember)
    : [];

  // If API only sends a count, keep empty list but preserve count below
  const memberCountHint =
    rawProject.member_count ??
    rawProject.members_count ??
    rawProject.team_size ??
    rawProject.total_members ??
    null;

  const leader =
    rawProject.leader ||
    rawProject.project_leader ||
    rawProject.created_by_user ||
    members.find((member) => member.isLeader) ||
    null;

  return {
    ...rawProject,
    id: rawProject.id || rawProject.project_id,
    project_id: rawProject.project_id || rawProject.id,
    title:
      rawProject.title ||
      rawProject.project_title ||
      rawProject.name ||
      'Untitled project',
    description: rawProject.description || rawProject.summary || '',
    code:
      rawProject.project_code ||
      rawProject.code ||
      rawProject.join_code ||
      '',
    status: normalizeStatusKey(
      rawProject.status ||
        rawProject.project_status ||
        rawProject.workflow_status ||
        rawProject.approval_status ||
        'draft',
    ),
    project_type:
      rawProject.project_type ||
      rawProject.type ||
      rawProject.category ||
      'Academic project',
    stage: rawProject.stage || rawProject.current_stage || 'ideation',
    created_at: rawProject.created_at || rawProject.createdAt || null,
    updated_at: rawProject.updated_at || rawProject.updatedAt || null,
    start_date: rawProject.start_date || rawProject.startDate || null,
    end_date: rawProject.end_date || rawProject.endDate || null,
    members,
    leader: leader ? normalizeMember(leader) : null,
    max_members:
      rawProject.max_members ||
      rawProject.max_team_size ||
      null,
    member_count:
      members.length > 0
        ? members.length
        : memberCountHint != null
          ? Number(memberCountHint) || 0
          : 0,
  };
}

function displayDate(value) {
  if (!value) return 'Not specified';

  try {
    return formatDate(value);
  } catch {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not specified';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

/* -------------------------------------------------------
   Components
------------------------------------------------------- */

function StatusBadge({ status }) {
  const key = normalizeStatusKey(status);
  const config = STATUS_CONFIG[key] || {
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    tone: 'neutral',
  };

  const dot =
    config.tone === 'emerald'
      ? 'bg-emerald-500'
      : config.tone === 'amber'
        ? 'bg-amber-500'
        : config.tone === 'orange'
          ? 'bg-orange-500'
          : config.tone === 'sky'
            ? 'bg-sky-500'
            : config.tone === 'violet'
              ? 'bg-violet-500'
              : config.tone === 'red'
                ? 'bg-red-500'
                : 'bg-neutral-400';

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium capitalize text-neutral-700 dark:border-white/10 dark:text-neutral-200">
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {config.label}
    </span>
  );
}

function Avatar({ name, src, size = 'md' }) {
  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 text-[11px]'
      : size === 'lg'
        ? 'h-12 w-12 text-sm'
        : 'h-10 w-10 text-xs';

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 font-semibold text-neutral-600 dark:border-white/10 dark:bg-white/[0.08] dark:text-neutral-300',
        sizeClass,
      )}
      title={name || 'Team member'}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Team member'}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

function MetaItem({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <div className="min-w-0 p-3 sm:p-4">
      <div className={cn('flex items-center gap-2 text-xs font-medium', muted)}>
        <span className={cn(iconBox, 'h-6 w-6', TONES[tone])}>
          <Icon size={13} />
        </span>
        <span>{label}</span>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {value || 'Not specified'}
      </p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description, action, tone = 'violet' }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className={cn(iconBox, 'h-11 w-11', TONES[tone])}>
          <Icon size={19} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            {title}
          </h2>
          {description && (
            <p className={cn('mt-1 text-sm leading-5', muted)}>{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

function ProjectPreviewCard({
  project,
  onJoin,
  onOpen,
  joining,
  isAlreadyMember,
  onReset,
}) {
  if (!project) return null;

  const members = project.members || [];
  const leader =
    project.leader || members.find((member) => member.isLeader) || null;

  const memberCount =
    members.length > 0
      ? members.length
      : project.member_count ?? 0;
  const stageLabel =
    STAGE_LABELS[project.stage] ||
    project.stage?.replaceAll('_', ' ') ||
    'Ideation';

  return (
    <div className={cn(card, 'min-w-0 overflow-hidden')}>
      <div className="border-b border-neutral-100 p-5 dark:border-white/[0.06] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className={cn(iconBox, 'h-11 w-11', TONES.sky)}>
            <FolderKanban size={20} />
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="mt-5">
          <p className={cn('text-xs font-medium uppercase tracking-[0.12em]', muted)}>
            Project details
          </p>
          <h2 className="mt-2 break-words text-xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
            {project.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
              <Hash size={12} />
              {project.code || project.id}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
              <Layers size={12} />
              {project.project_type}
            </span>
          </div>
        </div>

        <p className={cn('mt-4 whitespace-pre-line break-words text-sm leading-6', muted)}>
          {project.description || 'No project description has been provided.'}
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-neutral-200 border-b border-neutral-100 dark:divide-white/10 dark:border-white/[0.06]">
        <MetaItem
          icon={Users}
          label="Team members"
          tone="emerald"
          value={
            project.max_members
              ? `${memberCount} / ${project.max_members}`
              : `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`
          }
        />
        <MetaItem
          icon={CalendarDays}
          label="Created on"
          tone="amber"
          value={displayDate(project.created_at)}
        />
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Project team
            </h3>
            <span className={cn('text-xs', muted)}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>

          {members.length > 0 ? (
            <div className="mt-3 space-y-3">
              {members.slice(0, 4).map((member) => {
                const memberTone = getMemberTone(member.role);
                return (
                  <div key={member.id} className="flex min-w-0 items-center gap-3">
                    <Avatar name={member.name} src={member.avatar} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {member.name}
                      </p>
                      <p className={cn('mt-0.5 truncate text-xs', muted)}>
                        {member.isLeader ? 'Project leader' : member.role}
                      </p>
                    </div>
                    <span
                      className={cn(iconBox, 'h-7 w-7', TONES[memberTone])}
                      title={member.isLeader ? 'Project leader' : member.role}
                    >
                      {member.isLeader ? (
                        <Crown size={14} />
                      ) : (
                        <UserPlus size={14} />
                      )}
                    </span>
                  </div>
                );
              })}
              {members.length > 4 && (
                <p className={cn('text-xs', muted)}>
                  +{members.length - 4} more team members
                </p>
              )}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-neutral-200 p-4 dark:border-white/10">
              <div className="flex items-start gap-3">
                <Users size={18} className={cn('mt-0.5 shrink-0', ICON.neutral)} />
                <p className={cn('text-sm leading-5', muted)}>
                  Team member details are not available for this project yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {leader && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/[0.06]">
            <div className="flex items-center gap-3">
              <Avatar name={leader.name} src={leader.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Project leader
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {leader.name}
                </p>
              </div>
              <ShieldCheck size={17} className="shrink-0 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
            <div className={cn('flex items-center gap-2 text-xs', muted)}>
              <span className={cn(iconBox, 'h-6 w-6', TONES.violet)}>
                <Layers size={13} />
              </span>
              Current stage
            </div>
            <p className="mt-2 break-words text-sm font-semibold capitalize text-neutral-800 dark:text-neutral-200">
              {stageLabel}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
            <div className={cn('flex items-center gap-2 text-xs', muted)}>
              <span className={cn(iconBox, 'h-6 w-6', TONES.amber)}>
                <CalendarCheck size={13} />
              </span>
              Deadline
            </div>
            <p className="mt-2 break-words text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {displayDate(project.end_date)}
            </p>
          </div>
        </div>

        {isAlreadyMember ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  You are already a member
                </p>
                <p className="mt-1 text-sm leading-5 text-emerald-700 dark:text-emerald-400">
                  This project is already associated with your account.
                </p>
                <button
                  type="button"
                  onClick={onOpen}
                  className={cn(primaryButton, 'mt-3')}
                >
                  <FolderOpen size={15} />
                  Go to Project
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 dark:border-white/[0.06] sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              className={cn(secondaryButton, 'min-h-11 w-full')}
            >
              <RotateCcw size={15} />
              Reset
            </button>
            <button
              type="button"
              onClick={onJoin}
              disabled={joining}
              className={cn(primaryButton, 'min-h-11 w-full')}
            >
              {joining ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Join Project
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className={cn(card, 'animate-pulse overflow-hidden')}>
      <div className="space-y-4 border-b border-neutral-100 p-5 dark:border-white/[0.06] sm:p-6">
        <div className="h-11 w-11 rounded-xl bg-neutral-100 dark:bg-white/[0.08]" />
        <div className="h-3 w-28 rounded bg-neutral-100 dark:bg-white/[0.08]" />
        <div className="h-6 w-3/4 rounded bg-neutral-100 dark:bg-white/[0.08]" />
        <div className="h-4 w-full rounded bg-neutral-100 dark:bg-white/[0.08]" />
        <div className="h-4 w-2/3 rounded bg-neutral-100 dark:bg-white/[0.08]" />
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <div className="h-4 w-32 rounded bg-neutral-100 dark:bg-white/[0.08]" />
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-white/[0.08]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/2 rounded bg-neutral-100 dark:bg-white/[0.08]" />
              <div className="h-3 w-1/3 rounded bg-neutral-100 dark:bg-white/[0.08]" />
            </div>
          </div>
        ))}
        <div className="h-11 rounded-xl bg-neutral-100 dark:bg-white/[0.08]" />
      </div>
    </div>
  );
}

function RecentProjectRow({ project }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 px-5 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn(iconBox, 'h-10 w-10', TONES.sky)}>
          <FolderOpen size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
            {project.title}
          </p>
          <div className={cn('mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs', muted)}>
            <span className="inline-flex items-center gap-1">
              <Hash size={12} className={ICON.sky} />
              {project.code || project.id}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users size={12} className={ICON.emerald} />
              {project.member_count ?? (project.members || []).length} members
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
        <StatusBadge status={project.status} />
        <Link
          to={`/app/projects/${project.id}`}
          className={cn(secondaryButton, 'min-h-9 px-3 text-xs')}
        >
          <Eye size={14} />
          View
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */

export default function JoinProjectPage() {
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.listProjects(),
    retry: 1,
  });

  const allProjects = useMemo(() => {
    const response = projectsQuery.data;
    let list = [];
    if (Array.isArray(response)) list = response;
    else if (Array.isArray(response?.projects)) list = response.projects;
    else if (Array.isArray(response?.data?.projects)) list = response.data.projects;
    else if (Array.isArray(response?.data)) list = response.data;
    else if (Array.isArray(response?.items)) list = response.items;
    else if (Array.isArray(response?.data?.items)) list = response.data.items;
    else if (Array.isArray(response?.results)) list = response.results;

    return list.map(normalizeProject).filter(Boolean);
  }, [projectsQuery.data]);

  const recentProjects = allProjects.slice(0, 4);

  const isAlreadyMember = useMemo(() => {
    if (!preview) return false;

    return allProjects.some((project) => {
      const sameId =
        String(project.id) === String(preview.id) ||
        String(project.project_id) === String(preview.project_id);

      const sameCode =
        project.code &&
        preview.code &&
        project.code.toLowerCase() === preview.code.toLowerCase();

      return Boolean(sameId || sameCode);
    });
  }, [preview, allProjects]);

  const onCodeChange = (event) => {
    const value = event.target.value.replace(/\s/g, '').slice(0, 80);
    setCode(value);
    setLookupError('');
    setPreview(null);
  };

  const lookup = async (event) => {
    event?.preventDefault();

    const searchCode = code.trim();

    if (!searchCode) {
      setLookupError('Please enter a Project ID to continue.');
      return;
    }

    setLooking(true);
    setLookupError('');
    setPreview(null);

    try {
      let response;

      if (typeof api.getProjectByCode === 'function') {
        response = await api.getProjectByCode(searchCode);
      } else {
        throw new Error(
          'Project code lookup is not configured. Add getProjectByCode to api.js.',
        );
      }

      const project = normalizeProject(getProjectFromResponse(response));

      if (!project || (!project.id && !project.project_id && !project.code)) {
        throw new Error('No project was found with this Project ID.');
      }

      setPreview(project);
    } catch (error) {
      setLookupError(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to find this project. Check the Project ID and try again.',
      );
    } finally {
      setLooking(false);
    }
  };

  const openProject = (project = preview) => {
    if (!project) return;

    const projectId = project.project_id || project.id;

    if (!projectId) {
      toast.error('Project ID is missing. Cannot open the workspace.');
      return;
    }

    navigate(`/app/projects/${encodeURIComponent(projectId)}`);
  };

  const join = async () => {
    if (!preview || loading) return;

    if (isAlreadyMember) {
      openProject();
      return;
    }

    setLoading(true);

    try {
      let response;

      if (typeof api.joinProjectByCode === 'function') {
        response = await api.joinProjectByCode(preview.code || code.trim());
      } else if (typeof api.joinProject === 'function') {
        response = await api.joinProject(
          preview.project_id || preview.id || preview.code,
        );
      } else if (typeof api.requestToJoinProject === 'function') {
        response = await api.requestToJoinProject(
          preview.project_id || preview.id || preview.code,
        );
      } else {
        throw new Error('Project joining is not configured in api.js.');
      }

      toast.success(
        response?.message ||
          response?.data?.message ||
          'Your request to join the project was submitted.',
      );

      await projectsQuery.refetch();
      openProject(preview);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Unable to join this project. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCode('');
    setPreview(null);
    setLookupError('');
    setLooking(false);
    setLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      {/* Header */}
      <section>
        <div className={cn('mb-3 flex flex-wrap items-center gap-2 text-sm', muted)}>
          <GraduationCap size={20} className={ICON.violet} />
          
          <span>Student workspace</span>
           <ChevronRight size={14} />
          <span className={cn(iconBox, 'h-6 w-6 shrink-0 rounded-md', TONES.sky)}>
            <Hash size={19} />
          </span>
         
          <span className="text-neutral-800 dark:text-neutral-200">
            Join a project
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              Join a Project
            </h1>
            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              Enter your Project ID to verify project details, review the team,
              and join your project workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/app/projects" className={secondaryButton}>
              <FolderOpen size={16} />
              My projects
            </Link>
            <Link to="/app/projects/new" className={primaryButton}>
              <Plus size={16} />
              Create project
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Lookup form */}
        <section className={cn(card, 'min-w-0 overflow-hidden')}>
          <div className="border-b border-neutral-100 p-5 dark:border-white/[0.06] sm:p-6">
            <SectionHeading
              icon={KeyRound}
              title="Find your project"
              description="Use the Project ID shared by your project leader."
              tone="violet"
            />
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <form onSubmit={lookup} className="space-y-4">
              <div>
                <label
                  htmlFor="project-code"
                  className="mb-2 block text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Project ID
                </label>

                <div className="relative">
                  <Hash
                    size={17}
                    className={cn(
                      'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2',
                      ICON.sky,
                    )}
                  />
                  <input
                    id="project-code"
                    name="project-code"
                    type="text"
                    value={code}
                    onChange={onCodeChange}
                    placeholder="Enter your Project ID"
                    autoComplete="off"
                    disabled={looking || loading}
                    className={cn(
                      fieldClass,
                      lookupError &&
                        'border-red-300 dark:border-red-500/50',
                    )}
                  />
                </div>

                {lookupError && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/[0.08]">
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                    />
                    <p className="text-sm leading-5 text-red-700 dark:text-red-300">
                      {lookupError}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <button
                  type="submit"
                  disabled={looking || loading || !code.trim()}
                  className={cn(primaryButton, 'min-h-11 w-full')}
                >
                  {looking ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Searching project...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Find project
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={looking || loading}
                  onClick={reset}
                  className={cn(secondaryButton, 'min-h-11')}
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>
            </form>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-start gap-3">
                <span className={cn(iconBox, 'h-9 w-9', TONES.sky)}>
                  <Info size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    Where can I find the Project ID?
                  </p>
                  <p className={cn('mt-1 text-sm leading-5', muted)}>
                    Ask your project leader to share the Project ID with you.
                    Enter it above to view the project before joining.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn(iconBox, 'h-9 w-9', TONES.sky)}>
                  <Eye size={17} />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Review project details
                  </p>
                  <p className={cn('mt-0.5 text-xs leading-5', muted)}>
                    Check the title, status, and team before joining.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={cn(iconBox, 'h-9 w-9', TONES.emerald)}>
                  <ShieldCheck size={17} />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Verify the right project
                  </p>
                  <p className={cn('mt-0.5 text-xs leading-5', muted)}>
                    Confirm the project details before submitting your request.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={cn(iconBox, 'h-9 w-9', TONES.violet)}>
                  <Users size={17} />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Collaborate with your team
                  </p>
                  <p className={cn('mt-0.5 text-xs leading-5', muted)}>
                    Access your project workspace after joining successfully.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section className="min-w-0">
          {looking ? (
            <ProjectSkeleton />
          ) : preview ? (
            <ProjectPreviewCard
              project={preview}
              onJoin={join}
              onOpen={() => openProject(preview)}
              joining={loading}
              isAlreadyMember={isAlreadyMember}
              onReset={reset}
            />
          ) : (
            <div
              className={cn(
                card,
                'flex min-h-[400px] flex-col items-center justify-center border-dashed px-6 py-12 text-center sm:min-h-[480px]',
              )}
            >
              <div className={cn(iconBox, 'h-16 w-16 rounded-2xl', TONES.violet)}>
                <FileCode2 size={28} />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-neutral-900 dark:text-white">
                Project preview
              </h2>
              <p className={cn('mt-2 max-w-sm text-sm leading-6', muted)}>
                Your project details will appear here after you enter a valid
                Project ID and search.
              </p>
              <div className="mt-6 flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-400">
                <CircleHelp size={14} />
                Waiting for a Project ID
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Recent projects */}
      <section className={cn(card, 'min-w-0 overflow-hidden')}>
        <div className="flex flex-col gap-4 border-b border-neutral-100 p-5 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <SectionHeading
            icon={Clock3}
            title="Your recent projects"
            description="Projects already associated with your account."
            tone="amber"
          />
          <Link to="/app/projects" className={cn(secondaryButton, 'shrink-0')}>
            View all
            <ArrowRight size={15} />
          </Link>
        </div>

        {projectsQuery.isLoading ? (
          <div className="space-y-4 p-5 sm:p-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex animate-pulse items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-white/[0.08]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-neutral-100 dark:bg-white/[0.08]" />
                  <div className="h-3 w-1/2 rounded bg-neutral-100 dark:bg-white/[0.08]" />
                </div>
              </div>
            ))}
          </div>
        ) : recentProjects.length > 0 ? (
          <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
            {recentProjects.map((project) => (
              <RecentProjectRow
                key={project.id || project.project_id || project.code}
                project={project}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 py-10 text-center sm:px-6">
            <div className={cn(iconBox, 'h-12 w-12', TONES.neutral)}>
              <FolderOpen size={22} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900 dark:text-white">
              No projects found
            </h3>
            <p className={cn('mt-1 max-w-sm text-sm leading-5', muted)}>
              Your existing projects will appear here when they are available.
            </p>
            <Link to="/app/projects/new" className={cn(primaryButton, 'mt-4')}>
              <Plus size={15} />
              Create a project
            </Link>
          </div>
        )}
      </section>

      <footer className="flex flex-col gap-2 border-t border-neutral-200 pt-5 text-xs leading-5 text-neutral-500 dark:border-white/10 dark:text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <ShieldCheck size={14} className={ICON.emerald} />
          Check the project details before joining.
        </p>
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-1.5 font-medium text-neutral-700 hover:underline dark:text-neutral-300"
        >
          Back to My Projects
          <ArrowRight size={14} />
        </Link>
      </footer>
    </div>
  );
}