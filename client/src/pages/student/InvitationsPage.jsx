
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  Mail,
  CheckCheck,
  RefreshCw,
  Circle,
  Check,
  Inbox,
  UserPlus,
  FolderOpen,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
  CalendarDays,
  UserRound,
  MessageSquareText,
  XCircle,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { api } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';

/* -------------------------------------------------------
   Styles — same as Notifications page
------------------------------------------------------- */

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60';

const muted = 'text-neutral-500 dark:text-neutral-400';

const iconBox =
  'flex shrink-0 items-center justify-center rounded-xl';

const TONES = {
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  emerald:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber:
    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  orange:
    'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  violet:
    'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  neutral:
    'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
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

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

const FILTERS = [
  { value: 'all', label: 'All invitations' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
];

function getInvitationStatus(status) {
  switch (status) {
    case 'pending':
      return {
        label: 'Awaiting response',
        tone: 'amber',
        icon: Clock,
      };

    case 'accepted':
      return {
        label: 'Accepted',
        tone: 'emerald',
        icon: CheckCircle2,
      };

    case 'declined':
      return {
        label: 'Declined',
        tone: 'neutral',
        icon: XCircle,
      };

    default:
      return {
        label: status || 'Unknown',
        tone: 'neutral',
        icon: Mail,
      };
  }
}

function getInitials(name) {
  if (!name || name === 'Someone') return '?';

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/* -------------------------------------------------------
   Components
------------------------------------------------------- */

function StatCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <div
      className={cn(
        card,
        'flex min-w-0 items-start justify-between gap-3 p-5',
      )}
    >
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

function InvitationSkeleton() {
  return (
    <div className={cn(card, 'animate-pulse p-5')}>
      <div className="flex gap-4">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-neutral-100 dark:bg-white/10" />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-3 w-28 rounded bg-neutral-100 dark:bg-white/10" />
          <div className="h-4 w-3/4 rounded bg-neutral-100 dark:bg-white/10" />
          <div className="h-3 w-full max-w-lg rounded bg-neutral-100 dark:bg-white/10" />
          <div className="h-3 w-2/3 rounded bg-neutral-100 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */

export default function InvitationsPage() {
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['invitations'],
    queryFn: api.listMyInvitations,
  });

  const invitations = useMemo(
    () =>
      Array.isArray(data?.invitations)
        ? data.invitations
        : [],
    [data],
  );

  const counts = useMemo(
    () => ({
      all: invitations.length,
      pending: invitations.filter((item) => item.status === 'pending').length,
      accepted: invitations.filter((item) => item.status === 'accepted').length,
      declined: invitations.filter((item) => item.status === 'declined').length,
    }),
    [invitations],
  );

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['invitations'] });

  const acceptMutation = useMutation({
    mutationFn: (invitationId) => api.acceptInvitation(invitationId),

    onSuccess: async () => {
      toast.success('Invitation accepted successfully');

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['invitations'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['my-projects'] }),
        queryClient.invalidateQueries({ queryKey: ['project-members'] }),
      ]);
    },

    onError: (err) => {
      toast.error(err.message || 'Failed to accept invitation');
    },
  });

  const declineMutation = useMutation({
    mutationFn: (invitationId) => api.declineInvitation(invitationId),

    onSuccess: async () => {
      toast.success('Invitation declined');

      await queryClient.invalidateQueries({
        queryKey: ['invitations'],
      });
    },

    onError: (err) => {
      toast.error(err.message || 'Failed to decline invitation');
    },
  });

  const filteredInvitations = useMemo(() => {
    const term = search.trim().toLowerCase();

    return invitations.filter((invitation) => {
      const matchesStatus =
        activeFilter === 'all' ||
        invitation.status === activeFilter;

      const matchesSearch =
        !term ||
        (invitation.project?.title || '').toLowerCase().includes(term) ||
        (invitation.inviter?.full_name || '').toLowerCase().includes(term) ||
        (invitation.message || '').toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [invitations, activeFilter, search]);

  const isResponding =
    acceptMutation.isPending || declineMutation.isPending;

  const hasError = Boolean(error);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      {/* Header */}

      <section>
        <div className={cn('mb-3 flex flex-wrap items-center gap-2 text-sm', muted)}>
          <Mail size={16} className={ICON.violet} />
          <span>Student workspace</span>
          <ChevronRight size={14} />
          <span className="text-neutral-800 dark:text-neutral-200">
            Invitations
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
                Invitations
              </h1>

              {!isLoading && !hasError && counts.pending > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  <Circle size={7} className="fill-current" />
                  {counts.pending} pending
                </span>
              )}
            </div>

            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              Review project invitations, discover who invited you, and manage
              your team collaboration requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className={secondaryButton}
          >
            <RefreshCw
              size={15}
              className={isFetching ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>
      </section>

      {/* Statistics */}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Total invitations"
          value={isLoading || hasError ? '—' : counts.all}
          hint="All received invitations"
          icon={Inbox}
          tone="sky"
        />

        <StatCard
          label="Pending"
          value={isLoading || hasError ? '—' : counts.pending}
          hint="Awaiting your response"
          icon={Clock}
          tone="amber"
        />

        <StatCard
          label="Accepted"
          value={isLoading || hasError ? '—' : counts.accepted}
          hint="Projects you joined"
          icon={CheckCircle2}
          tone="emerald"
        />

        <StatCard
          label="Declined"
          value={isLoading || hasError ? '—' : counts.declined}
          hint="Invitations declined"
          icon={XCircle}
          tone="neutral"
        />
      </section>

      {/* Main invitation section */}

      <section className={cn(card, 'overflow-hidden')}>
        <div className="border-b border-neutral-200 p-5 dark:border-white/10 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(iconBox, 'h-9 w-9', TONES.violet)}>
                  <UserPlus size={17} />
                </span>

                <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                  Received invitations
                </h2>
              </div>

              <p className={cn('mt-2 text-sm', muted)}>
                Invitations sent to you by project owners and team members.
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects, people..."
                className="min-h-10 w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
              />
            </div>
          </div>

          {/* Filters */}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Filter size={15} className="mr-1 text-neutral-400" />

            {FILTERS.map((filter) => {
              const selected = activeFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition sm:text-sm',
                    selected
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]',
                  )}
                >
                  {filter.label}

                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:text-xs',
                      selected
                        ? 'bg-white/15 text-white dark:bg-neutral-900/10 dark:text-neutral-900'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.08] dark:text-neutral-300',
                    )}
                  >
                    {counts[filter.value]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}

        {isLoading && (
          <div className="space-y-3 p-4 sm:p-5">
            <div className={cn('flex items-center gap-2 pb-1 text-sm', muted)}>
              <Loader2 size={16} className="animate-spin" />
              Loading invitations...
            </div>

            <InvitationSkeleton />
            <InvitationSkeleton />
            <InvitationSkeleton />
          </div>
        )}

        {/* Error */}

        {!isLoading && hasError && (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <div className={cn(iconBox, 'h-14 w-14', TONES.red)}>
              <AlertCircle size={26} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
              Unable to load invitations
            </h2>

            <p className={cn('mt-2 max-w-md break-words text-sm leading-6', muted)}>
              {error?.message ||
                'Something went wrong while fetching your invitations.'}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className={cn(primaryButton, 'mt-5')}
            >
              {isFetching ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}

        {!isLoading && !hasError && invitations.length === 0 && (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
            <div className={cn(iconBox, 'h-16 w-16 rounded-2xl', TONES.violet)}>
              <Mail size={28} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-neutral-900 dark:text-white">
              No invitations yet
            </h2>

            <p className={cn('mt-2 max-w-sm text-sm leading-6', muted)}>
              When someone invites you to join a project, the invitation will
              appear here. You can review the project details before responding.
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className={cn(secondaryButton, 'mt-5')}
            >
              <RefreshCw
                size={15}
                className={isFetching ? 'animate-spin' : ''}
              />
              Check again
            </button>
          </div>
        )}

        {/* No filter matches */}

        {!isLoading &&
          !hasError &&
          invitations.length > 0 &&
          filteredInvitations.length === 0 && (
            <div className="flex flex-col items-center px-5 py-14 text-center">
              <div className={cn(iconBox, 'h-12 w-12', TONES.neutral)}>
                <Search size={22} />
              </div>

              <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
                No matching invitations
              </h3>

              <p className={cn('mt-2 text-sm', muted)}>
                Try another search term or select a different status.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setActiveFilter('all');
                }}
                className="mt-4 text-sm font-medium text-neutral-900 underline underline-offset-4 dark:text-white"
              >
                Clear filters
              </button>
            </div>
          )}

        {/* Invitation cards */}

        {!isLoading && !hasError && filteredInvitations.length > 0 && (
          <ul className="space-y-3 p-4 sm:p-5">
            {filteredInvitations.map((invitation) => {
              const status = getInvitationStatus(invitation.status);
              const StatusIcon = status.icon;
              const inviterName =
                invitation.inviter?.full_name || 'Someone';

              const isAccepting =
                acceptMutation.isPending &&
                acceptMutation.variables === invitation.id;

              const isDeclining =
                declineMutation.isPending &&
                declineMutation.variables === invitation.id;

              const responding = isAccepting || isDeclining;

              return (
                <li
                  key={invitation.id}
                  className={cn(
                    card,
                    'relative overflow-hidden p-4 transition hover:border-neutral-300 dark:hover:border-white/20 sm:p-5',
                    invitation.status === 'pending' &&
                      'border-l-[3px] border-l-amber-400 dark:border-l-amber-400',
                  )}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
                    {/* Project icon */}

                    <div className={cn(iconBox, 'h-12 w-12', TONES.violet)}>
                      <FolderOpen size={21} />
                    </div>

                    {/* Invitation information */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={cn('text-[11px] font-medium', muted)}>
                              Project invitation
                            </span>

                            {invitation.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                                <Circle size={6} className="fill-current" />
                                ACTION REQUIRED
                              </span>
                            )}
                          </div>

                          <h3 className="break-words text-base font-semibold leading-6 text-neutral-900 dark:text-white sm:text-lg">
                            {invitation.project?.title || 'Untitled project'}
                          </h3>
                        </div>

                        <span
                          className={cn(
                            'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                            TONES[status.tone],
                          )}
                        >
                          <StatusIcon size={13} />
                          {status.label}
                        </span>
                      </div>

                      {/* Inviter and date */}

                      <div className={cn('mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm', muted)}>
                        <span className="inline-flex items-center gap-2">
                          <span className={cn(iconBox, 'h-7 w-7', TONES.neutral)}>
                            <UserRound size={13} />
                          </span>
                          <span>
                            <span className="block text-[10px] uppercase tracking-wide">
                              Invited by
                            </span>
                            <span className="font-medium text-neutral-700 dark:text-neutral-200">
                              {inviterName}
                            </span>
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <span className={cn(iconBox, 'h-7 w-7', TONES.neutral)}>
                            <CalendarDays size={13} />
                          </span>
                          <span>
                            <span className="block text-[10px] uppercase tracking-wide">
                              Invitation date
                            </span>
                            <span className="font-medium text-neutral-700 dark:text-neutral-200">
                              {formatDate(invitation.created_at)}
                            </span>
                          </span>
                        </span>
                      </div>

                      {/* Message */}

                      {invitation.message && (
                        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3.5 dark:border-white/10 dark:bg-white/[0.025] sm:p-4">
                          <div className="flex items-center gap-2">
                            <MessageSquareText
                              size={15}
                              className={ICON.violet}
                            />
                            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                              Message from inviter
                            </p>
                          </div>

                          <p className={cn('mt-2 whitespace-pre-wrap break-words text-sm leading-6', muted)}>
                            {invitation.message}
                          </p>
                        </div>
                      )}

                      {/* Pending explanation */}

                      {invitation.status === 'pending' && (
                        <p className={cn('mt-3 text-xs leading-5', muted)}>
                          Review this invitation and choose whether to join the
                          project team.
                        </p>
                      )}

                      {invitation.status === 'accepted' && (
                        <p className={cn('mt-3 flex items-center gap-2 text-xs font-medium', ICON.emerald)}>
                          <CheckCircle2 size={14} />
                          You accepted this invitation.
                        </p>
                      )}

                      {invitation.status === 'declined' && (
                        <p className={cn('mt-3 flex items-center gap-2 text-xs', muted)}>
                          <XCircle size={14} />
                          You declined this invitation.
                        </p>
                      )}

                      {/* Actions */}

                      {invitation.status === 'pending' && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isResponding}
                            onClick={() => acceptMutation.mutate(invitation.id)}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                          >
                            {isAccepting ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Check size={15} />
                            )}
                            {isAccepting ? 'Accepting...' : 'Accept invitation'}
                          </button>

                          <button
                            type="button"
                            disabled={isResponding}
                            onClick={() => declineMutation.mutate(invitation.id)}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]"
                          >
                            {isDeclining ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <X size={15} />
                            )}
                            {isDeclining ? 'Declining...' : 'Decline'}
                          </button>
                        </div>
                      )}

                      {invitation.status === 'accepted' &&
                        invitation.project?.id && (
                          <div className="mt-4">
                            <Link
                              to={`/app/projects/${invitation.project.id}`}
                              className={cn(secondaryButton, 'min-h-9 px-3 text-xs')}
                            >
                              Open project
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                        )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer */}

        {!isLoading && !hasError && invitations.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-neutral-200 bg-neutral-50/70 px-5 py-4 text-sm dark:border-white/10 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
            <span className={muted}>
              Showing {filteredInvitations.length} of {invitations.length}{' '}
              invitations
            </span>

            {counts.pending > 0 ? (
              <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', ICON.amber)}>
                <Clock size={14} />
                {counts.pending} awaiting your response
              </span>
            ) : (
              <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', ICON.emerald)}>
                <CheckCheck size={14} />
                You are all caught up
              </span>
            )}
          </div>
        )}
      </section>

      {/* Bottom information card */}

      {!isLoading && !hasError && counts.pending > 0 && (
        <section className={cn(card, 'flex items-start gap-3.5 p-4 sm:p-5')}>
          <div className={cn(iconBox, 'h-10 w-10', TONES.violet)}>
            <Users size={19} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Grow your project team
            </h3>

            <p className={cn('mt-1 text-sm leading-6', muted)}>
              You have {counts.pending} invitation
              {counts.pending !== 1 ? 's' : ''} awaiting your response. Accept
              an invitation to join a project, subject to its access rules.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}