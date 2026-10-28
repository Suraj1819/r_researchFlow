
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  AlertCircle,
  AudioLines,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileArchive,
  FileAudio,
  FileCheck2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FolderKanban,
  Github,
  GraduationCap,
  Hourglass,
  Layers,
  ListChecks,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Target,
  UserRound,
  XCircle,
  FolderOpen,
  LayoutDashboard,
} from 'lucide-react';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import { formatDate, cn } from '../../lib/utils';
import MarkdownText from '../../components/MarkdownText';

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.04]';

const muted = 'text-neutral-500 dark:text-neutral-400';

const TONES = {
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  slate: 'bg-neutral-100 text-neutral-700 dark:bg-white/[0.07] dark:text-neutral-300',
};

const DASHBOARD_PATH = '/faculty/dashboard';

function getProjectReviewState(p) {
  if (!p) return 'locked';

  const status = String(p.status || '').toLowerCase();

  if (
    ['approved', 'accepted', 'accepted_final', 'final_approved'].includes(status)
  ) {
    return 'approved';
  }

  if (
    ['rejected', 'declined', 'not_approved', 'disapproved'].includes(status)
  ) {
    return 'rejected';
  }

  if (status === 'changes_requested') return 'changes_requested';

  if (
    ['submitted', 'under_review', 'under_revision', 'resubmitted'].includes(
      status,
    )
  ) {
    return 'awaiting_decision';
  }

  return 'locked';
}

function ReviewStatePill({ state, size = 'md' }) {
  const base =
    size === 'sm'
      ? 'inline-flex min-h-9 select-none items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm'
      : 'inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm';

  const iconSize = size === 'sm' ? 13 : 16;

  if (state === 'awaiting_decision') {
    return (
      <span
        className={cn(
          base,
          'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
        )}
        title="Project is awaiting your review decision"
      >
        <Hourglass size={iconSize} className="animate-pulse" />
        Awaiting your decision
      </span>
    );
  }

  if (state === 'changes_requested') {
    return (
      <span
        className={cn(
          base,
          'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300',
        )}
        title="You have requested changes — awaiting student resubmission"
      >
        <Hourglass size={iconSize} className="animate-pulse" />
        Waiting for resubmission
      </span>
    );
  }

  if (state === 'approved') {
    return (
      <span
        className={cn(
          base,
          'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
        )}
        title="Project approved by faculty"
      >
        <BadgeCheck size={iconSize} />
        Approved
      </span>
    );
  }

  if (state === 'rejected') {
    return (
      <span
        className={cn(
          base,
          'border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
        )}
        title="Project was rejected by faculty"
      >
        <XCircle size={iconSize} />
        Rejected
      </span>
    );
  }

  if (state === 'under_review') {
    return (
      <span
        className={cn(
          base,
          'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300',
        )}
        title="Project is currently under review"
      >
        <Clock size={iconSize} className="animate-pulse" />
        Under review
      </span>
    );
  }

  return null;
}

const REVIEWABLE_STATUSES = [
  'submitted',
  'under_review',
  'changes_requested',
];

const STATUS_STYLE = {
  submitted:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
  under_review:
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300',
  changes_requested:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300',
  approved:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  rejected:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
};

function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium capitalize',
        STATUS_STYLE[status] ||
          'border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-300',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {(status || 'unknown').replaceAll('_', ' ')}
    </span>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
  count,
  action,
  tone = 'slate',
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            TONES[tone] || TONES.slate,
          )}
        >
          <Icon size={19} strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
              {title}
            </h2>

            {count !== undefined && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-300">
                {count}
              </span>
            )}
          </div>

          {description && (
            <p className={cn('mt-1 text-sm leading-6', muted)}>
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone, detail }) {
  return (
    <div
      className={cn(
        card,
        'flex items-start justify-between gap-3 p-4 sm:p-5',
      )}
    >
      <div className="min-w-0">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {label}
        </p>

        <p className="mt-2 break-words text-2xl font-semibold capitalize tracking-tight text-neutral-900 dark:text-white">
          {value}
        </p>

        {detail && (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {detail}
          </p>
        )}
      </div>

      <div className={cn('shrink-0 rounded-xl p-3', tone)}>
        <Icon size={19} />
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon: Icon, tone = 'slate' }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <dt className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {Icon ? (
          <span
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md',
              TONES[tone] || TONES.slate,
            )}
          >
            <Icon size={13} strokeWidth={1.8} />
          </span>
        ) : null}
        <span>{label}</span>
      </dt>

      <dd className="break-words text-sm font-medium capitalize text-neutral-800 dark:text-neutral-200">
        {value || '—'}
      </dd>
    </div>
  );
}

function ResourceLink({ href, children, icon: Icon }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
    >
      {Icon && <Icon size={14} />}
      {children}
      <ExternalLink size={12} />
    </a>
  );
}

function EmptySection({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center px-5 py-9 text-center">
      <div className="rounded-2xl bg-neutral-100 p-3.5 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400">
        <Icon size={22} />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-neutral-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
    </div>
  );
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/[0.06] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
        <AlertCircle size={17} className="mt-0.5 shrink-0" />
        <span>{message}</span>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/20 dark:text-red-300"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      )}
    </div>
  );
}

function getFileName(file) {
  return file.original_name || file.file_name || file.name || 'Unnamed file';
}

function getFileExtension(filename) {
  if (!filename) return '';
  const match = String(filename).match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : '';
}

function getFileVisual(file) {
  const mime = String(file.mime_type || '').toLowerCase();
  const ext = getFileExtension(getFileName(file));

  if (
    mime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
  ) {
    return { Icon: FileImage, tone: 'rose' };
  }

  if (
    mime.startsWith('video/') ||
    ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)
  ) {
    return { Icon: FileVideo, tone: 'violet' };
  }

  if (
    mime.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)
  ) {
    return { Icon: FileAudio, tone: 'amber' };
  }

  if (mime === 'application/pdf' || ext === 'pdf') {
    return { Icon: FileCheck2, tone: 'red' };
  }

  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    ['xls', 'xlsx', 'csv', 'ods'].includes(ext)
  ) {
    return { Icon: FileSpreadsheet, tone: 'emerald' };
  }

  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    ['ppt', 'pptx', 'odp', 'key'].includes(ext)
  ) {
    return { Icon: FileText, tone: 'orange' };
  }

  if (
    mime.includes('word') ||
    mime.includes('document') ||
    ['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext)
  ) {
    return { Icon: FileText, tone: 'sky' };
  }

  if (
    mime.includes('zip') ||
    mime.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return { Icon: FileArchive, tone: 'amber' };
  }

  return { Icon: FileText, tone: 'slate' };
}

export default function ReviewDetailPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();

  const [decision, setDecision] = useState('approved');
  const [comment, setComment] = useState('');
  const [changes, setChanges] = useState('');
  const [scores, setScores] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);
  const [expandedReviewIds, setExpandedReviewIds] = useState(() => new Set());
  const [reviewTouched, setReviewTouched] = useState(false);

  const {
    data: projectRes,
    isLoading,
    error: projectError,
    refetch: refetchProject,
    isFetching: projectFetching,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: Boolean(projectId),
  });

  const {
    data: reviewsRes,
    isLoading: reviewsLoading,
    isError: reviewsError,
    error: reviewsErrorObject,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ['reviews', projectId],
    queryFn: () => api.getProjectReviews(projectId),
    enabled: Boolean(projectId),
  });

  const {
    data: rubricsRes,
    isLoading: rubricsLoading,
    isError: rubricsError,
    refetch: refetchRubrics,
  } = useQuery({
    queryKey: ['rubrics'],
    queryFn: () => api.listRubrics(),
  });

  const {
    data: filesRes,
    isLoading: filesLoading,
    isError: filesError,
    error: filesErrorObject,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ['files', projectId],
    queryFn: () => api.listFiles(projectId),
    enabled: Boolean(projectId),
  });

  const submitMutation = useMutation({
    mutationFn: (payload) => api.submitReview(projectId, payload),

    onSuccess: async () => {
      toast.success('Review submitted successfully');

      setComment('');
      setChanges('');
      setScores({});

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['review-queue'] }),
        queryClient.invalidateQueries({ queryKey: ['reviews', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['group'] }),
      ]);
    },

    onError: (error) => {
      toast.error(error.message || 'Could not submit review');
    },
  });

  const p = projectRes?.project;
  const rubric = rubricsRes?.rubrics?.[0] || null;
  const criteria = Array.isArray(rubric?.criteria) ? rubric.criteria : [];
  const reviews = Array.isArray(reviewsRes?.reviews) ? reviewsRes.reviews : [];
  const files = Array.isArray(filesRes?.files) ? filesRes.files : [];

  useEffect(() => {
    if (reviewTouched || reviews.length === 0) return;

    setExpandedReviewIds((previous) => {
      if (previous.size > 0) return previous;
      return new Set([reviews[0].id]);
    });
  }, [reviews, reviewTouched]);

  const toggleReview = (id) => {
    setReviewTouched(true);

    setExpandedReviewIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const isReviewExpanded = (id) => expandedReviewIds.has(id);

  const expandAllReviews = () => {
    setReviewTouched(true);
    setExpandedReviewIds(new Set(reviews.map((review) => review.id)));
  };

  const collapseAllReviews = () => {
    setReviewTouched(true);
    setExpandedReviewIds(new Set());
  };

  const canReview = REVIEWABLE_STATUSES.includes(p?.status);

  const scoredTotal = useMemo(
    () =>
      criteria.reduce((total, criterion) => {
        const value = scores[criterion.key];
        return total + (value === undefined || value === '' ? 0 : Number(value));
      }, 0),
    [criteria, scores],
  );

  const maxTotal = useMemo(
    () =>
      criteria.reduce(
        (total, criterion) => total + Number(criterion.max_score || 0),
        0,
      ),
    [criteria],
  );

  const completedScores = criteria.filter((criterion) => {
    const value = scores[criterion.key];
    return value !== undefined && value !== '';
  }).length;

  const handleScoreChange = (key, value, maxScore) => {
    if (value === '') {
      setScores((previous) => ({ ...previous, [key]: '' }));
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) return;

    setScores((previous) => ({
      ...previous,
      [key]: Math.min(Number(maxScore), Math.max(0, numericValue)),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!p || !canReview || submitMutation.isPending) return;

    if (rubricsError) {
      toast.error(
        'The evaluation rubric failed to load. Please retry before submitting.',
      );
      return;
    }

    if (criteria.length > 0 && completedScores !== criteria.length) {
      toast.error('Please score every rubric criterion before submitting');
      return;
    }

    const hasInvalidScores = criteria.some((criterion) => {
      const value = scores[criterion.key];

      if (value === undefined || value === '') return false;

      const numericValue = Number(value);
      const maxScore = Number(criterion.max_score);

      return (
        !Number.isFinite(numericValue) ||
        !Number.isFinite(maxScore) ||
        numericValue < 0 ||
        numericValue > maxScore
      );
    });

    if (hasInvalidScores) {
      toast.error('Please check your rubric scores');
      return;
    }

    if (comment.length > 5000 || changes.length > 5000) {
      toast.error('Feedback must not exceed 5,000 characters');
      return;
    }

    if (decision === 'changes_requested' && !changes.trim()) {
      toast.error('Please specify the changes required');
      return;
    }

    const cleanScores = {};

    for (const criterion of criteria) {
      const value = scores[criterion.key];

      if (value !== undefined && value !== '') {
        cleanScores[criterion.key] = Number(value);
      }
    }

    submitMutation.mutate({
      decision,
      overall_comment: comment.trim() || null,
      requested_changes:
        decision === 'changes_requested' ? changes.trim() : null,
      rubric_id: rubric?.id || null,
      scores: cleanScores,
    });
  };

  const handleDownload = async (file) => {
    if (downloadingId) return;

    try {
      setDownloadingId(file.id);

      const res = await api.getDownloadUrl(projectId, file.id);
      const url = res?.url || res?.signedUrl || res?.signed_url;

      if (!url) {
        throw new Error('Download link is not available');
      }

      const opened = window.open(url, '_blank', 'noopener,noreferrer');

      if (!opened) {
        toast.error(
          'Browser blocked the download. Allow pop-ups and try again.',
        );
      }
    } catch (error) {
      toast.error(error.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchProject(),
      refetchFiles(),
      refetchReviews(),
      refetchRubrics(),
    ]);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 text-neutral-500 dark:text-neutral-400">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading project details...</p>
      </div>
    );
  }

  if (projectError || !p) {
    return (
      <div className={cn(card, 'px-5 py-12 text-center sm:p-12')}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle size={23} />
        </div>

        <h2 className="mt-4 font-semibold text-neutral-900 dark:text-white">
          Project unavailable
        </h2>

        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {projectError?.message || 'Project not found or access denied.'}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => refetchProject()}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium dark:border-white/10"
          >
            <RefreshCw size={15} />
            Retry
          </button>

          <Link
            to={DASHBOARD_PATH}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            <ArrowLeft size={15} />
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-8 sm:space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"
      >
        <Link
          to={DASHBOARD_PATH}
          className="inline-flex items-center gap-1.5 transition hover:text-neutral-900 dark:hover:text-white"
        >
          <GraduationCap size={15} />
          Faculty workspace
        </Link>

        <span aria-hidden="true">/</span>

        <Link
          to={DASHBOARD_PATH}
          className="transition hover:text-neutral-900 dark:hover:text-white"
        >
          Reviews
        </Link>

        <span aria-hidden="true">/</span>

        <span className="max-w-[180px] truncate text-neutral-800 dark:text-neutral-200">
          {p.project_code || 'Project details'}
        </span>
      </nav>

      <Link
        to={DASHBOARD_PATH}
        className={cn(
          'inline-flex items-center gap-2 text-sm transition hover:text-neutral-900 dark:hover:text-white',
          muted,
        )}
      >
        <ArrowLeft size={16} />
        Back to review queue
      </Link>

      <section className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-violet-50 via-white to-sky-50 px-4 py-4 dark:border-white/10 dark:from-violet-500/[0.08] dark:via-white/[0.03] dark:to-sky-500/[0.08] sm:px-5 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/20">
                <FolderKanban size={15} />
              </span>
              Faculty workspace
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              Project Review
            </h1>

            <p className={cn('mt-1 max-w-2xl text-sm leading-6', muted)}>
              Review the proposal, inspect supporting files, assess the rubric
              and submit feedback.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={projectFetching}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200 dark:hover:bg-white/[0.08] sm:self-center"
            title="Refresh project, files, reviews and rubrics"
          >
            <RefreshCw
              size={15}
              className={projectFetching ? 'animate-spin' : ''}
            />
            {projectFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </section>

      <section className={cn(card, 'overflow-hidden')}>
        <div className="border-b border-neutral-200 p-4 dark:border-white/10 sm:p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                <FolderOpen size={23} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <p className={cn('mb-1 text-xs font-medium uppercase tracking-wider', muted)}>
                  Project details
                </p>

                <h2 className="break-words text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
                  {p.title || 'Untitled project'}
                </h2>

                <p className={cn('mt-2 text-sm leading-6', muted)}>
                  {p.team?.name || p.team_name || 'Team'}{' '}
                  {p.created_at ? `· Submitted ${formatDate(p.created_at)}` : ''}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={p.status} />
                  <ReviewStatePill state={getProjectReviewState(p)} size="sm" />

                  {p.project_code && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                      <GraduationCap size={13} />
                      {p.project_code}
                    </span>
                  )}

                  {p.current_revision != null && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      <FileCheck2 size={13} />
                      Revision {p.current_revision}
                    </span>
                  )}
                </div>

                <p className={cn('mt-3 max-w-3xl text-sm leading-6', muted)}>
                  {p.short_description
                    ? 'Review the submitted proposal, supporting materials and evaluation criteria below.'
                    : 'Review the submitted project details, supporting materials and evaluation criteria below.'}
                </p>
              </div>
            </div>

            <Link
              to={DASHBOARD_PATH}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200 dark:hover:bg-white/[0.08]"
            >
              <ArrowLeft size={15} />
              Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
          <InfoItem
            icon={Clock}
            tone="amber"
            label="Submitted at"
            value={p.submitted_at ? formatDate(p.submitted_at) : '—'}
          />

          <InfoItem
            icon={MessageSquare}
            tone="sky"
            label="Reviews recorded"
            value={`${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`}
          />

          <InfoItem
            icon={FileText}
            tone="orange"
            label="Attachments"
            value={
              filesLoading
                ? 'Loading...'
                : `${files.length} ${files.length === 1 ? 'file' : 'files'}`
            }
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Current status"
          value={(p.status || 'unknown').replaceAll('_', ' ')}
          icon={ShieldCheck}
          tone={TONES.sky}
        />

        <StatCard
          label="Revision"
          value={p.current_revision ?? '—'}
          icon={FileCheck2}
          detail="Current project version"
          tone={TONES.violet}
        />

        <StatCard
          label="Project files"
          value={files.length}
          icon={FileText}
          detail={filesLoading ? 'Loading files...' : 'Uploaded attachments'}
          tone={TONES.orange}
        />

        <StatCard
          label="Previous reviews"
          value={reviews.length}
          icon={MessageSquare}
          detail={reviewsLoading ? 'Loading review history...' : 'Recorded decisions'}
          tone={TONES.emerald}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading
          icon={FolderKanban}
          title="Project overview"
          description="Understand the problem, proposed solution and project scope."
          tone="sky"
        />

        <div className={cn(card, 'space-y-5 p-4 sm:p-5')}>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Project summary
            </h3>

            <div className="mt-3 break-words text-sm leading-7 text-neutral-700 dark:text-neutral-300">
              {p.short_description ? (
                <MarkdownText>{p.short_description}</MarkdownText>
              ) : (
                <p className="text-neutral-400">No summary provided.</p>
              )}
            </div>
          </div>

          {p.problem_statement && (
            <div className="border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                <Target size={16} className="text-orange-500" />
                Problem statement
              </h3>

              <div className="mt-3 break-words text-sm leading-7 text-neutral-600 dark:text-neutral-400">
                <MarkdownText>{p.problem_statement}</MarkdownText>
              </div>
            </div>
          )}

          {Array.isArray(p.objectives) && p.objectives.length > 0 && (
            <div className="border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                <ListChecks size={16} className="text-emerald-600 dark:text-emerald-400" />
                Project objectives
              </h3>

              <ol className="mt-3 space-y-3">
                {p.objectives.map((objective, index) => (
                  <li
                    key={`${index}-${objective}`}
                    className="flex items-start gap-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      {index + 1}
                    </span>

                    <span className="min-w-0 break-words pt-0.5">
                      {typeof objective === 'string'
                        ? objective
                        : objective?.title ||
                          objective?.description ||
                          JSON.stringify(objective)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Project information
            </h3>

            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem icon={Layers} tone="violet" label="Project type" value={p.project_type} />
              <InfoItem icon={ClipboardList} tone="sky" label="Stage" value={p.stage} />
              <InfoItem icon={ShieldCheck} tone="amber" label="Project code" value={p.project_code} />
              <InfoItem icon={Eye} tone="emerald" label="Visibility" value={p.visibility} />
            </dl>
          </div>

          {(p.github_url || p.demo_url) && (
            <div className="border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
                Project links
              </h3>

              <div className="flex flex-wrap gap-2">
                <ResourceLink href={p.github_url} icon={Github}>
                  GitHub repository
                </ResourceLink>

                <ResourceLink href={p.demo_url} icon={Eye}>
                  Live demo
                </ResourceLink>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          icon={FileText}
          title="Project files"
          description="Review the reports, presentations, documents and images submitted by the team."
          count={files.length}
          tone="orange"
          action={
            <button
              type="button"
              onClick={() => refetchFiles()}
              disabled={filesLoading}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]"
            >
              <RefreshCw size={13} className={filesLoading ? 'animate-spin' : ''} />
              Refresh files
            </button>
          }
        />

        <div className={cn(card, 'overflow-hidden')}>
          {filesLoading ? (
            <div className="flex items-center justify-center gap-3 py-12 text-sm text-neutral-500 dark:text-neutral-400">
              <Loader2 size={19} className="animate-spin" />
              Loading project files...
            </div>
          ) : filesError ? (
            <div className="p-4 sm:p-5">
              <ErrorMessage
                message={filesErrorObject?.message || 'Failed to load project files.'}
                onRetry={refetchFiles}
              />
            </div>
          ) : files.length === 0 ? (
            <EmptySection
              icon={FileText}
              title="No files uploaded"
              description="There are no attachments available for review yet."
            />
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
              {files.map((file) => {
                const { Icon: FileIcon, tone: fileTone } = getFileVisual(file);
                const ext = getFileExtension(getFileName(file));

                return (
                  <div
                    key={file.id}
                    className="flex flex-col gap-3 p-4 transition hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                          TONES[fileTone] || TONES.slate,
                        )}
                      >
                        <FileIcon size={21} strokeWidth={1.8} />
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-neutral-900 dark:text-white">
                          {getFileName(file)}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                          {ext && (
                            <span
                              className={cn(
                                'rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                TONES[fileTone] || TONES.slate,
                              )}
                            >
                              {ext}
                            </span>
                          )}

                          {file.file_kind && <span>{file.file_kind}</span>}
                          {file.file_kind && file.mime_type && <span>·</span>}
                          <span>{file.mime_type || 'File'}</span>

                          {file.size_bytes != null && (
                            <>
                              <span>·</span>
                              <span>
                                {file.size_bytes < 1024 * 1024
                                  ? `${Math.max(1, Math.round(file.size_bytes / 1024))} KB`
                                  : `${(file.size_bytes / (1024 * 1024)).toFixed(1)} MB`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      disabled={Boolean(downloadingId)}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 transition hover:bg-white disabled:opacity-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.06]"
                    >
                      {downloadingId === file.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Download size={15} className="text-sky-600 dark:text-sky-400" />
                      )}

                      {downloadingId === file.id ? 'Preparing...' : 'Download'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          icon={Clock3}
          title="Review history"
          description="Previous faculty decisions and feedback for this project."
          count={reviews.length}
          tone="amber"
          action={
            reviews.length > 0 ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={expandAllReviews}
                  disabled={expandedReviewIds.size === reviews.length}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300 dark:hover:bg-white/[0.08]"
                >
                  <ChevronDown size={13} className="text-violet-600 dark:text-violet-400" />
                  Expand all
                </button>

                <button
                  type="button"
                  onClick={collapseAllReviews}
                  disabled={expandedReviewIds.size === 0}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300 dark:hover:bg-white/[0.08]"
                >
                  <ChevronDown size={13} className="rotate-180 text-violet-600 dark:text-violet-400" />
                  Collapse all
                </button>
              </div>
            ) : null
          }
        />

        <div className={cn(card, 'overflow-hidden')}>
          {reviewsLoading ? (
            <div className="flex items-center justify-center gap-3 py-10 text-sm text-neutral-500">
              <Loader2 size={18} className="animate-spin" />
              Loading review history...
            </div>
          ) : reviewsError ? (
            <div className="p-4 sm:p-5">
              <ErrorMessage
                message={reviewsErrorObject?.message || 'Failed to load review history.'}
                onRetry={refetchReviews}
              />
            </div>
          ) : reviews.length === 0 ? (
            <EmptySection
              icon={MessageSquare}
              title="No previous reviews"
              description="Submitted decisions and feedback will appear here."
            />
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
              {reviews.map((review) => {
                const expanded = isReviewExpanded(review.id);
                const reviewPanelId = `review-panel-${review.id}`;

                return (
                  <article key={review.id} className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleReview(review.id)}
                      aria-expanded={expanded}
                      aria-controls={reviewPanelId}
                      className={cn(
                        'flex w-full flex-col gap-3 p-4 text-left transition hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] sm:flex-row sm:items-start sm:justify-between sm:px-5',
                        expanded && 'bg-neutral-50/70 dark:bg-white/[0.02]',
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', TONES.violet)}>
                          <UserRound size={18} strokeWidth={1.8} />
                        </div>

                        <div className="min-w-0">
                          <p className="break-words font-medium text-neutral-900 dark:text-white">
                            {review.reviewer?.full_name || 'Faculty reviewer'}
                          </p>

                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            Revision {review.revision ?? '—'}
                            {review.created_at && <> · {formatDate(review.created_at)}</>}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={review.decision} />
                        <ChevronDown
                          size={16}
                          className={cn(
                            'shrink-0 text-neutral-400 transition-transform duration-200',
                            expanded && 'rotate-180',
                          )}
                        />
                      </div>
                    </button>

                    {expanded && (
                      <div
                        id={reviewPanelId}
                        className="space-y-3 px-4 pb-4 pt-2 sm:px-5"
                      >
                        {review.rubric?.name && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Rubric: {review.rubric.name}
                          </p>
                        )}

                        {review.scores &&
                          Object.keys(review.scores).length > 0 && (
                            <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                Rubric scores
                              </p>

                              <div className="flex flex-wrap gap-2">
                                {Object.entries(review.scores).map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300"
                                  >
                                    {key.replaceAll('_', ' ')}: {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {review.overall_comment && (
                          <div className="rounded-xl bg-neutral-50 p-4 dark:bg-white/[0.03]">
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                              Reviewer feedback
                            </p>

                            <p className="whitespace-pre-line break-words text-sm leading-6 text-neutral-700 dark:text-neutral-300">
                              {review.overall_comment}
                            </p>
                          </div>
                        )}

                        {review.requested_changes && (
                          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-500/20 dark:bg-orange-500/[0.06]">
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                              Requested changes
                            </p>

                            <p className="whitespace-pre-line break-words text-sm leading-6 text-orange-800 dark:text-orange-200">
                              {review.requested_changes}
                            </p>
                          </div>
                        )}

                        {!review.rubric?.name &&
                          (!review.scores ||
                            Object.keys(review.scores).length === 0) &&
                          !review.overall_comment &&
                          !review.requested_changes && (
                            <p className="rounded-xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                              No additional feedback was recorded for this review.
                            </p>
                          )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {canReview ? (
        <section className="space-y-4">
          <SectionHeading
            icon={ClipboardCheck}
            title="Submit your review"
            description="Evaluate the submission and provide a clear, actionable decision."
            tone="emerald"
          />

          <form
            onSubmit={handleSubmit}
            className={cn(card, 'space-y-6 p-5 sm:p-6')}
          >
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    Evaluation rubric
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {rubricsLoading
                      ? 'Loading evaluation criteria...'
                      : rubric?.name || 'No rubric configured'}
                  </p>
                </div>

                {criteria.length > 0 && (
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    {completedScores}/{criteria.length} scored
                  </span>
                )}
              </div>

              {rubricsLoading ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 size={16} className="animate-spin" />
                  Loading rubric...
                </div>
              ) : rubricsError ? (
                <div className="mt-4">
                  <ErrorMessage
                    message="Could not load the evaluation rubric. Retry before submitting a scored review."
                    onRetry={refetchRubrics}
                  />
                </div>
              ) : criteria.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {criteria.map((criterion) => (
                    <div
                      key={criterion.key}
                      className="overflow-hidden rounded-xl border border-neutral-200 dark:border-white/10"
                    >
                      <div className="flex items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', TONES.sky)}>
                          <Target size={14} strokeWidth={1.8} />
                        </span>

                        <p className="break-words text-sm font-semibold text-neutral-900 dark:text-white">
                          {criterion.label || criterion.key}
                        </p>

                        <span className="ml-auto rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-300">
                          Max {criterion.max_score}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          {criterion.description && (
                            <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                              {criterion.description}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <input
                            type="number"
                            min={0}
                            max={criterion.max_score}
                            step="1"
                            required
                            aria-label={`${criterion.label || criterion.key} score`}
                            value={scores[criterion.key] ?? ''}
                            onChange={(event) =>
                              handleScoreChange(
                                criterion.key,
                                event.target.value,
                                criterion.max_score,
                              )
                            }
                            placeholder="Score"
                            className="min-h-10 w-24 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white/30"
                          />

                          <span className="text-xs text-neutral-400">
                            / {criterion.max_score}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-50 p-4 dark:bg-white/[0.04]">
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        Total score
                      </p>

                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Based on entered rubric scores
                      </p>
                    </div>

                    <p className="text-xl font-semibold text-neutral-900 dark:text-white">
                      {scoredTotal}
                      <span className="text-sm font-normal text-neutral-400">
                        {' '}/ {maxTotal}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                  No evaluation criteria are available. You can still submit a
                  decision with written feedback.
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Review decision
              </h3>

              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Choose the outcome that best reflects your assessment.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    value: 'approved',
                    title: 'Approve',
                    description: 'The submission meets requirements.',
                    icon: CheckCircle2,
                    active:
                      'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/[0.08]',
                    iconTone:
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                  },
                  {
                    value: 'changes_requested',
                    title: 'Request changes',
                    description: 'The team needs to make revisions.',
                    icon: RefreshCw,
                    active:
                      'border-orange-300 bg-orange-50 dark:border-orange-500/40 dark:bg-orange-500/[0.08]',
                    iconTone:
                      'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
                  },
                  {
                    value: 'rejected',
                    title: 'Reject',
                    description: 'The submission does not meet requirements.',
                    icon: XCircle,
                    active:
                      'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/[0.08]',
                    iconTone:
                      'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
                  },
                ].map((option) => {
                  const Icon = option.icon;
                  const selected = decision === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDecision(option.value)}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-xl border p-4 text-left transition',
                        selected
                          ? option.active
                          : 'border-neutral-200 hover:border-neutral-300 dark:border-white/10 dark:hover:border-white/20',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className={cn('rounded-lg p-2', option.iconTone)}>
                          <Icon size={17} />
                        </div>

                        <span
                          className={cn(
                            'h-4 w-4 rounded-full border',
                            selected
                              ? 'border-neutral-900 bg-neutral-900 ring-2 ring-neutral-900 ring-offset-2 dark:border-white dark:bg-white dark:ring-white dark:ring-offset-neutral-900'
                              : 'border-neutral-300 dark:border-neutral-600',
                          )}
                        />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-neutral-900 dark:text-white">
                        {option.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Written feedback
              </h3>

              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Explain your decision so the team understands the outcome.
              </p>

              <label
                htmlFor="review-comment"
                className="mb-2 mt-4 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Overall comment
              </label>

              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={5000}
                placeholder="Summarise the strengths, issues and recommendations..."
                rows={4}
                className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white/30"
              />

              <p className="mt-1 text-right text-xs text-neutral-400">
                {comment.length}/5000
              </p>

              {decision === 'changes_requested' && (
                <div className="mt-4">
                  <label
                    htmlFor="requested-changes"
                    className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Required changes <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    id="requested-changes"
                    value={changes}
                    onChange={(event) => setChanges(event.target.value)}
                    maxLength={5000}
                    placeholder="List the specific improvements required before resubmission..."
                    rows={4}
                    required
                    className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white/30"
                  />

                  <p className="mt-1 text-right text-xs text-neutral-400">
                    {changes.length}/5000
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-neutral-100 pt-5 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                Review the scores and feedback before submitting. Your decision
                will update the project status and appear in the review history.
              </p>

              <Button
                type="submit"
                loading={submitMutation.isPending}
                disabled={
                  submitMutation.isPending ||
                  (rubricsLoading && !rubricsRes) ||
                  rubricsError
                }
              >
                <span className="inline-flex items-center gap-2">
                  {submitMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ClipboardCheck size={16} />
                  )}

                  {submitMutation.isPending ? 'Submitting...' : 'Submit review'}
                </span>
              </Button>
            </div>
          </form>
        </section>
      ) : (
        <section className={cn(card, 'flex items-start gap-4 p-5 sm:p-6')}>
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', TONES.emerald)}>
            <CheckCircle2 size={21} strokeWidth={1.8} />
          </div>

          <div>
            <h2 className="font-semibold text-neutral-900 dark:text-white">
              Review submission is closed
            </h2>

            <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              This project currently has a{' '}
              <span className="font-medium">
                {(p.status || 'final').replaceAll('_', ' ')}
              </span>{' '}
              status, so the review form is not available.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
