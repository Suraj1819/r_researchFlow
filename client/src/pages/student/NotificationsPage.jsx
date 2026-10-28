import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Bell,
  CheckCheck,
  RefreshCw,
  Circle,
  Check,
  Inbox,
  Users,
  UserPlus,
  FolderOpen,
  AlertCircle,
  Clock,
  Activity,
  CircleCheck,
  X,
  ChevronRight,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function getNotificationStyle(type) {
  if (type === 'submission_group') {
    return {
      icon: Users,
      label: 'Submission group',
      tone: 'violet',
    };
  }

  if (type === 'invitation') {
    return {
      icon: UserPlus,
      label: 'Project invitation',
      tone: 'violet',
    };
  }

  if (type === 'project' || type === 'project_update') {
    return {
      icon: FolderOpen,
      label: 'Project update',
      tone: 'sky',
    };
  }

  return {
    icon: Bell,
    label: 'General notification',
    tone: 'neutral',
  };
}

/* -------------------------------------------------------
   Components
------------------------------------------------------- */

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

function NotificationSkeleton() {
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

function ConfirmModal({
  title,
  description,
  confirmLabel = 'Delete',
  isPending,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onCancel();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="notification-dialog-title"
        aria-describedby="notification-dialog-description"
        className={cn(card, 'w-full max-w-md p-6 shadow-2xl')}
      >
        <div className={cn(iconBox, 'h-12 w-12', TONES.red)}>
          <Trash2 size={22} />
        </div>

        <h2
          id="notification-dialog-title"
          className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white"
        >
          {title}
        </h2>

        <p
          id="notification-dialog-description"
          className={cn('mt-2 break-words text-sm leading-6', muted)}
        >
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className={secondaryButton}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            {isPending ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.listNotifications(false),
  });

  const items = useMemo(
    () => (Array.isArray(data?.notifications) ? data.notifications : []),
    [data],
  );

  const unreadCount = items.filter((item) => !item.is_read).length;
  const readCount = items.length - unreadCount;

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const markRead = useMutation({
    mutationFn: (id) => api.markNotificationRead(id),
    onSuccess: refresh,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: refresh,
  });

  const respondToInvitation = useMutation({
    mutationFn: ({ invitationId, accept }) => {
      if (!invitationId) {
        throw new Error(
          'Invitation ID nahi mila. Page refresh karke dobara try karein.',
        );
      }

      return accept
        ? api.acceptInvitation(invitationId)
        : api.declineInvitation(invitationId);
    },

    onMutate: async ({ invitationId, accept }) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousData = queryClient.getQueryData(['notifications']);

      queryClient.setQueryData(['notifications'], (old) => {
        if (!old || !Array.isArray(old.notifications)) return old;

        return {
          ...old,
          notifications: old.notifications.map((item) => {
            if (
              String(item.metadata?.invitation_id) !== String(invitationId)
            ) {
              return item;
            }

            return {
              ...item,
              metadata: {
                ...item.metadata,
                invitation_status: accept ? 'accepted' : 'declined',
              },
            };
          }),
        };
      });

      return { previousData };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications'], context.previousData);
      }
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['project-members'] }),
        queryClient.invalidateQueries({ queryKey: ['my-invitations'] }),
      ]);
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id) => api.deleteNotification(id),
    onSuccess: () => {
      setDeleteTarget(null);
      refresh();
    },
  });

  const deleteAllNotifications = useMutation({
    mutationFn: () => api.deleteAllNotifications(),
    onSuccess: () => {
      setShowDeleteAll(false);
      refresh();
    },
  });

  const mutationError =
    respondToInvitation.error ||
    deleteAllNotifications.error ||
    deleteNotification.error ||
    markAllRead.error ||
    markRead.error;

  const dismissMutationError = () => {
    respondToInvitation.reset();
    deleteAllNotifications.reset();
    deleteNotification.reset();
    markAllRead.reset();
    markRead.reset();
  };

  const anyDeletePending =
    deleteNotification.isPending || deleteAllNotifications.isPending;

  const handleCancelDelete = () => {
    if (anyDeletePending) return;
    setDeleteTarget(null);
    setShowDeleteAll(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteNotification.mutate(deleteTarget.id);
  };

  const confirmDeleteAll = () => {
    if (items.length === 0) return;
    deleteAllNotifications.mutate();
  };

  const dash = isLoading || Boolean(error);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      {/* Header */}
      <section>
        <div className={cn('mb-3 flex flex-wrap items-center gap-2 text-sm', muted)}>
          <Bell size={16} className={ICON.violet} />
          <span>Student workspace</span>
          <ChevronRight size={14} />
          <span className="text-neutral-800 dark:text-neutral-200">Notifications</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
                Notifications
              </h1>

              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              Keep track of project updates, invitations, submissions and team activity.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className={secondaryButton}
            >
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending || anyDeletePending}
                className={primaryButton}
              >
                {markAllRead.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCheck size={15} />
                )}
                Mark all read
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteAll(true)}
              disabled={items.length === 0 || anyDeletePending}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10"
            >
              {deleteAllNotifications.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
              Delete all
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Total notifications"
          value={dash ? '—' : items.length}
          hint="All recent activity"
          icon={Bell}
          tone="sky"
        />
        <StatCard
          label="Unread"
          value={dash ? '—' : unreadCount}
          hint={unreadCount > 0 ? 'Waiting for your attention' : 'You are all caught up'}
          icon={Circle}
          tone="violet"
        />
        <StatCard
          label="Already read"
          value={dash ? '—' : readCount}
          hint="Notifications you have checked"
          icon={CircleCheck}
          tone="emerald"
        />
        <StatCard
          label="Project activity"
          value={
            dash
              ? '—'
              : items.filter((item) =>
                  [
                    'project',
                    'project_update',
                    'submission_group',
                    'invitation',
                  ].includes(item.type),
                ).length
          }
          hint="Projects, invitations and groups"
          icon={Activity}
          tone="amber"
        />
      </section>

      {/* Mutation error */}
      {mutationError && (
        <div
          role="alert"
          className={cn(card, 'flex items-start gap-3 p-4 text-sm')}
        >
          <span className={cn(iconBox, 'h-9 w-9', TONES.red)}>
            <AlertCircle size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-neutral-900 dark:text-white">
              Could not update notifications
            </p>
            <p className={cn('mt-1 break-words', muted)}>
              {mutationError.message || 'Please try again.'}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissMutationError}
            aria-label="Dismiss error"
            className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Load error */}
      {error && !isLoading && (
        <section className={cn(card, 'flex flex-col items-center px-5 py-12 text-center')}>
          <div className={cn(iconBox, 'h-14 w-14', TONES.red)}>
            <AlertCircle size={26} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
            Unable to load notifications
          </h2>
          <p className={cn('mt-2 max-w-md break-words text-sm leading-6', muted)}>
            {error.message || 'Something went wrong. Please try again.'}
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
        </section>
      )}

      {/* Loading */}
      {isLoading && (
        <section className="space-y-3" aria-label="Loading notifications">
          <div className="flex items-center gap-2 pb-1">
            <Loader2 size={16} className={cn('animate-spin', ICON.violet)} />
            <p className={cn('text-sm', muted)}>Loading notifications...</p>
          </div>
          <NotificationSkeleton />
          <NotificationSkeleton />
          <NotificationSkeleton />
        </section>
      )}

      {/* Empty */}
      {!isLoading && !error && items.length === 0 && (
        <section
          className={cn(
            card,
            'flex min-h-72 flex-col items-center justify-center border-dashed px-5 py-12 text-center',
          )}
        >
          <div className={cn(iconBox, 'h-16 w-16 rounded-2xl', TONES.violet)}>
            <Inbox size={28} />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-neutral-900 dark:text-white">
            You're all caught up
          </h2>
          <p className={cn('mt-2 max-w-sm text-sm leading-6', muted)}>
            There are no notifications right now. Project invitations, updates,
            submission groups and faculty activity will appear here.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className={cn(secondaryButton, 'mt-5')}
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            Check again
          </button>
        </section>
      )}

      {/* List */}
      {!isLoading && !error && items.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={cn(iconBox, 'h-9 w-9', TONES.emerald)}>
              <Activity size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                Recent activity
              </h2>
              <p className={cn('text-sm', muted)}>
                Your latest updates, invitations and announcements.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300">
              <Bell size={13} className={ICON.sky} />
              {items.length} {items.length === 1 ? 'notification' : 'notifications'}
            </span>
          </div>

          <ul className="space-y-3">
            {items.map((item) => {
              const unread = !item.is_read;
              const style = getNotificationStyle(item.type);
              const NotificationIcon = style.icon;

              const invitationId = item.metadata?.invitation_id;
              const invitationStatus = String(
                item.metadata?.invitation_status || 'pending',
              ).toLowerCase();

              const isInvitationNotification = item.type === 'invitation';
              const isInvitation =
                isInvitationNotification &&
                Boolean(invitationId) &&
                invitationStatus === 'pending';

              const invitationAccepted = invitationStatus === 'accepted';

              const responding =
                respondToInvitation.isPending &&
                String(respondToInvitation.variables?.invitationId) ===
                  String(invitationId);

              const projectUrl = item.project_id
                ? `/app/projects/${item.project_id}`
                : null;

              const groupUrl = item.metadata?.group_id
                ? `/app/groups/${item.metadata.group_id}`
                : null;

              const destination = groupUrl || projectUrl;

              const deleting =
                deleteNotification.isPending &&
                deleteNotification.variables === item.id;

              const markingRead =
                markRead.isPending && markRead.variables === item.id;

              return (
                <li
                  key={item.id}
                  className={cn(
                    card,
                    'relative overflow-hidden p-4 transition hover:border-neutral-300 dark:hover:border-white/20 sm:p-5',
                    unread &&
                      'border-l-[3px] border-l-violet-500 bg-violet-50/30 dark:border-l-violet-400 dark:bg-violet-500/[0.025]',
                  )}
                >
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    <div className={cn(iconBox, 'h-11 w-11', TONES[style.tone])}>
                      <NotificationIcon size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span className={cn('text-[11px] font-medium', muted)}>
                              {style.label}
                            </span>
                            {unread && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300">
                                <Circle size={6} className="fill-current" />
                                NEW
                              </span>
                            )}
                          </div>
                          <h3
                            className={cn(
                              'break-words text-sm leading-6 text-neutral-900 dark:text-white sm:text-[15px]',
                              unread ? 'font-semibold' : 'font-medium',
                            )}
                          >
                            {item.title || 'Notification'}
                          </h3>
                        </div>

                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center gap-1.5 text-[11px]',
                            muted,
                          )}
                        >
                          <Clock size={13} className={ICON.sky} />
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {item.message && (
                        <p
                          className={cn(
                            'mt-2 whitespace-pre-wrap break-words text-sm leading-6',
                            muted,
                          )}
                        >
                          {item.message}
                        </p>
                      )}

                      {isInvitation && (
                        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-500/20 dark:bg-violet-500/[0.06]">
                          <div className="flex items-start gap-2">
                            <span className={cn(iconBox, 'h-8 w-8', TONES.violet)}>
                              <UserPlus size={14} />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                Project team invitation
                              </p>
                              <p className={cn('mt-1 text-xs', muted)}>
                                Accept to join the project team, or reject this
                                invitation.
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={
                                respondToInvitation.isPending || anyDeletePending
                              }
                              onClick={() =>
                                respondToInvitation.mutate({
                                  invitationId,
                                  accept: true,
                                })
                              }
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {responding &&
                              respondToInvitation.variables?.accept ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                              Accept
                            </button>

                            <button
                              type="button"
                              disabled={
                                respondToInvitation.isPending || anyDeletePending
                              }
                              onClick={() =>
                                respondToInvitation.mutate({
                                  invitationId,
                                  accept: false,
                                })
                              }
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              {responding &&
                              !respondToInvitation.variables?.accept ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <X size={14} />
                              )}
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {destination &&
                          (!isInvitationNotification || invitationAccepted) && (
                            <Link
                              to={destination}
                              onClick={() => {
                                if (unread) markRead.mutate(item.id);
                              }}
                              className={cn(primaryButton, 'min-h-9 px-3.5 text-xs')}
                            >
                              {groupUrl ? 'Open group' : 'Open project'}
                              <ExternalLink size={13} />
                            </Link>
                          )}

                        {unread ? (
                          <button
                            type="button"
                            onClick={() => markRead.mutate(item.id)}
                            disabled={
                              markRead.isPending ||
                              anyDeletePending ||
                              respondToInvitation.isPending
                            }
                            className={cn(secondaryButton, 'min-h-9 px-3 text-xs')}
                          >
                            {markingRead ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Check size={13} />
                            )}
                            Mark as read
                          </button>
                        ) : (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 text-xs font-medium',
                              ICON.emerald,
                            )}
                          >
                            <CheckCheck size={13} />
                            Read
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          disabled={
                            anyDeletePending ||
                            markRead.isPending ||
                            markAllRead.isPending ||
                            respondToInvitation.isPending
                          }
                          aria-label={`Delete ${item.title || 'notification'}`}
                          title="Delete notification"
                          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          {deleting ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(deleteTarget || showDeleteAll) && (
        <ConfirmModal
          title={
            showDeleteAll
              ? 'Delete all notifications?'
              : 'Delete notification?'
          }
          description={
            showDeleteAll
              ? `You are about to permanently delete all ${items.length} notifications. This action cannot be undone.`
              : `Are you sure you want to delete "${deleteTarget?.title || 'this notification'}"? This action cannot be undone.`
          }
          confirmLabel={showDeleteAll ? 'Delete all' : 'Delete'}
          isPending={anyDeletePending}
          onCancel={handleCancelDelete}
          onConfirm={showDeleteAll ? confirmDeleteAll : confirmDelete}
        />
      )}
    </div>
  );
}