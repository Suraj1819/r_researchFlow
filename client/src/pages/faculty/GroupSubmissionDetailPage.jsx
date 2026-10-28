import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  FolderKanban,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Loader2,
  MessageSquare,
  Phone,
  ShieldCheck,
  Users,
  UserRound,
  X,
  XCircle,
  CalendarDays,
  Layers,
  Target,
  BookOpen,
  Lightbulb,
  ListChecks,
  Hash,
  Mail,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate, cn } from '../../lib/utils';

/* -------------------------------------------------------
   Design system — same as other pages
------------------------------------------------------- */

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60';

const muted = 'text-neutral-500 dark:text-neutral-400';

const iconBox = 'flex shrink-0 items-center justify-center rounded-xl';

const TONES = {
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
};

const ICON = {
  sky: 'text-sky-600 dark:text-sky-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  amber: 'text-amber-600 dark:text-amber-300',
  violet: 'text-violet-600 dark:text-violet-300',
  orange: 'text-orange-600 dark:text-orange-300',
  red: 'text-red-600 dark:text-red-300',
  neutral: 'text-neutral-500 dark:text-neutral-400',
};

const secondaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-100 dark:hover:bg-white/[0.08]';

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200';

const statusStyles = {
  submitted:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
  under_review:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300',
  in_review:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300',
  changes_requested:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300',
  approved:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  accepted:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  pending:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  rejected:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  draft:
    'border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-neutral-300',
};

function normalizeStatus(value) {
  return String(value || 'submitted')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function formatStatus(value) {
  return normalizeStatus(value)
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
        statusStyles[normalized] || statusStyles.draft,
      )}
    >
      {normalized === 'approved' || normalized === 'accepted' ? (
        <CheckCircle2 size={13} />
      ) : normalized === 'rejected' ? (
        <XCircle size={13} />
      ) : normalized === 'pending' || normalized === 'under_review' || normalized === 'in_review' ? (
        <Clock size={13} />
      ) : normalized === 'submitted' ? (
        <FileText size={13} />
      ) : null}
      {formatStatus(normalized)}
    </span>
  );
}

function SectionHeading({ icon: Icon, title, description, number, tone = 'neutral' }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className={cn(iconBox, 'h-10 w-10', TONES[tone])}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-neutral-900 dark:text-white">
            {title}
          </h2>
          {number ? (
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-white/[0.08] dark:text-neutral-400">
              {number}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className={cn('mt-1 text-sm leading-6', muted)}>{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, tone = 'neutral' }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className={cn(iconBox, 'h-9 w-9', TONES[tone])}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className={cn('text-xs', muted)}>{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function DetailBlock({ label, value, icon: Icon, tone = 'neutral' }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="min-w-0">
      <div className={cn('mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide', muted)}>
        {Icon ? (
          <span className={cn(iconBox, 'h-5 w-5 rounded-md', TONES[tone])}>
            <Icon size={11} />
          </span>
        ) : null}
        {label}
      </div>
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-neutral-800 dark:text-neutral-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function ResourceLink({ href, label, icon: Icon = ExternalLink, tone = 'sky' }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200 dark:hover:bg-white/[0.08]"
    >
      <span className={cn(iconBox, 'h-7 w-7 rounded-lg', TONES[tone])}>
        <Icon size={14} />
      </span>
      <span className="truncate">{label}</span>
      <ArrowUpRight size={13} className="shrink-0 text-neutral-400" />
    </a>
  );
}

function getStudent(submission) {
  return submission?.student || submission?.profiles || {};
}

function getStudentName(submission) {
  const s = getStudent(submission);
  return s.full_name || submission?.student_name || 'Unknown student';
}

function getProjectTitle(submission) {
  return (
    submission?.project_title ||
    submission?.title ||
    submission?.project?.title ||
    'Untitled project'
  );
}

function getMembers(submission) {
  if (Array.isArray(submission?.members) && submission.members.length) {
    return submission.members;
  }
  if (Array.isArray(submission?.team_members) && submission.team_members.length) {
    return submission.team_members;
  }
  if (Array.isArray(submission?.member_names)) {
    return submission.member_names.map((name) =>
      typeof name === 'string' ? { name } : name,
    );
  }
  if (
    typeof submission?.member_names === 'string' &&
    submission.member_names.trim()
  ) {
    return submission.member_names
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }
  return [];
}

function getSummary(submission) {
  return (
    submission?.project_summary ||
    submission?.summary ||
    submission?.description ||
    submission?.project?.description ||
    ''
  );
}

function parseSummarySections(raw) {
  if (!raw || typeof raw !== 'string') return {};
  const sections = {};
  const patterns = [
    ['problem_statement', /Problem statement:\s*([\s\S]*?)(?=\n\n[A-Z]|\n\nTeam member|$)/i],
    ['objectives', /Objectives:\s*([\s\S]*?)(?=\n\n[A-Z]|\n\nTeam member|$)/i],
    ['methodology', /Methodology:\s*([\s\S]*?)(?=\n\n[A-Z]|\n\nTeam member|$)/i],
    ['expected_outcome', /Expected outcome:\s*([\s\S]*?)(?=\n\n[A-Z]|\n\nTeam member|$)/i],
    ['project_domain', /Domain:\s*([^\n]+)/i],
    ['project_type', /Project type:\s*([^\n]+)/i],
    ['technologies', /Technology stack:\s*([^\n]+)/i],
    ['faculty_name', /Faculty supervisor:\s*([^\n]+)/i],
    ['department', /Department:\s*([^\n]+)/i],
    ['start_date', /Project start date:\s*([^\n]+)/i],
  ];
  for (const [key, re] of patterns) {
    const m = raw.match(re);
    if (m?.[1]?.trim()) sections[key] = m[1].trim();
  }
  const firstLabel = raw.search(
    /\n\n(?:Problem statement|Objectives|Methodology|Expected outcome|Domain|Project type|Technology stack|Faculty supervisor|Department|Project start date|Team member)/i,
  );
  if (firstLabel > 0) {
    sections.project_summary = raw.slice(0, firstLabel).trim();
  } else if (!Object.keys(sections).length) {
    sections.project_summary = raw.trim();
  }
  return sections;
}

function getField(submission, key, parsed) {
  return submission?.[key] || submission?.project?.[key] || parsed?.[key] || '';
}

function getPresentation(submission) {
  if (!submission) return { name: '', url: '' };
  const nameCandidates = [
    submission.ppt_name,
    submission.pptName,
    submission.presentation_name,
    submission.presentationName,
    submission.file_name,
    submission.fileName,
    submission.presentation?.name,
    submission.ppt?.name,
    submission.attachment?.name,
  ];
  const urlCandidates = [
    submission.ppt_url,
    submission.pptUrl,
    submission.presentation_url,
    submission.presentationUrl,
    submission.file_url,
    submission.fileUrl,
    submission.download_url,
    submission.downloadUrl,
    submission.attachment_url,
    submission.attachmentUrl,
    submission.presentation?.url,
    submission.ppt?.url,
    submission.attachment?.url,
    submission.files?.ppt,
    submission.files?.presentation,
  ];
  let name = nameCandidates.find((v) => typeof v === 'string' && v.trim()) || '';
  let url = urlCandidates.find((v) => typeof v === 'string' && v.trim()) || '';
  if (!url) {
    const pathCandidates = [
      submission.ppt_path,
      submission.pptPath,
      submission.presentation_path,
      submission.file_path,
      submission.filePath,
    ];
    const p = pathCandidates.find((v) => typeof v === 'string' && v.trim());
    if (p) {
      if (/^https?:\/\//i.test(p)) url = p;
      else name = name || p.split('/').pop() || p;
    }
  }
  if (url && !/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    name = name || url;
    url = '';
  }
  if (!name && url) {
    try {
      name = decodeURIComponent(url.split('?')[0].split('/').pop() || 'Presentation');
    } catch {
      name = 'Presentation';
    }
  }
  return { name: name || '', url: url || '' };
}

function ResubmissionPanel({ submission, groupId }) {
  const [feedback, setFeedback] = useState('');
  const [decision, setDecision] = useState('');
  const queryClient = useQueryClient();
  const resubmissionStatus = normalizeStatus(
    submission.resubmission_status || 'none',
  );

  const reviewMutation = useMutation({
    mutationFn: (payload) =>
      api.reviewGroupResubmission(groupId, submission.id, payload),
    onSuccess: async (_, variables) => {
      toast.success(
        variables.decision === 'approved'
          ? 'Resubmission request approved.'
          : 'Resubmission request rejected.',
      );
      setDecision('');
      setFeedback('');
      await queryClient.invalidateQueries({
        queryKey: ['faculty-group', groupId],
      });
      await queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to review request.');
    },
  });

  if (!['pending', 'approved', 'rejected'].includes(resubmissionStatus)) {
    return null;
  }

  const isPending = resubmissionStatus === 'pending';
  const isApproved = resubmissionStatus === 'approved';

  const handleReview = (event) => {
    event.preventDefault();
    if (!decision) return;
    if (decision === 'rejected' && feedback.trim().length < 1) {
      toast.error('Please provide feedback before rejecting.');
      return;
    }
    reviewMutation.mutate({ decision, feedback: feedback.trim() });
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        isPending
          ? 'border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/5'
          : isApproved
            ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5'
            : 'border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/5',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              iconBox,
              'h-8 w-8',
              isPending ? TONES.amber : isApproved ? TONES.emerald : TONES.red,
            )}
          >
            <MessageSquare size={15} />
          </span>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Resubmission Request
          </h4>
        </div>
        <StatusBadge status={resubmissionStatus} />
      </div>

      {submission.resubmission_requested_at ? (
        <p className={cn('mt-2 text-xs', muted)}>
          Requested {formatDate(submission.resubmission_requested_at)}
        </p>
      ) : null}

      {submission.resubmission_reason ? (
        <div className="mt-3">
          <p className={cn('text-xs font-medium', muted)}>Student&apos;s reason</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-800 dark:text-neutral-200">
            {submission.resubmission_reason}
          </p>
        </div>
      ) : (
        <p className={cn('mt-3 text-sm', muted)}>No reason was provided.</p>
      )}

      {submission.resubmission_feedback ? (
        <div className="mt-3 rounded-lg border border-neutral-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-black/10">
          <p className={cn('text-xs font-medium', muted)}>Faculty feedback</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-800 dark:text-neutral-200">
            {submission.resubmission_feedback}
          </p>
        </div>
      ) : null}

      {isPending ? (
        <div className="mt-4 border-t border-amber-200/80 pt-4 dark:border-amber-500/20">
          {!decision ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <CheckCircle2 size={15} />
                Approve
              </button>
              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-500/10"
              >
                <XCircle size={15} />
                Reject
              </button>
            </div>
          ) : (
            <form onSubmit={handleReview} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {decision === 'approved'
                    ? 'Approve this request?'
                    : 'Reject this request'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDecision('');
                    setFeedback('');
                  }}
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
              {decision === 'rejected' ? (
                <div>
                  <label
                    htmlFor={`feedback-${submission.id}`}
                    className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Feedback for student <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id={`feedback-${submission.id}`}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    required
                    placeholder="Explain what needs to be corrected..."
                    className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
                  />
                </div>
              ) : (
                <p className={cn('text-sm', muted)}>
                  The student will be allowed to resubmit after approval.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={
                    reviewMutation.isPending ||
                    (decision === 'rejected' && !feedback.trim())
                  }
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-white disabled:opacity-60',
                    decision === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700',
                  )}
                >
                  {reviewMutation.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : decision === 'approved' ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <XCircle size={15} />
                  )}
                  Confirm {decision === 'approved' ? 'Approval' : 'Rejection'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecision('');
                    setFeedback('');
                  }}
                  disabled={reviewMutation.isPending}
                  className="rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium dark:border-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {isApproved ? (
        <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-300">
          The student can resubmit the submission.
        </p>
      ) : null}
    </div>
  );
}

export default function GroupSubmissionDetailPage() {
  const { groupId, submissionId } = useParams();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['faculty-group', groupId],
    queryFn: () => api.getGroup(groupId),
    enabled: Boolean(groupId),
  });

  const payload = data?.data || data || {};
  const group = payload.group || payload;
  const submissions = Array.isArray(payload.submissions)
    ? payload.submissions
    : Array.isArray(group.submissions)
      ? group.submissions
      : [];

  const submission = useMemo(() => {
    if (!submissionId) return null;
    return (
      submissions.find(
        (s) =>
          String(s.id) === String(submissionId) ||
          String(s.submission_id) === String(submissionId),
      ) || null
    );
  }, [submissions, submissionId]);

  const groupName =
    group?.name || group?.group_name || group?.title || 'Group';

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <Loader2 size={20} className="animate-spin" />
          Loading submission...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link
          to={`/faculty/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300"
        >
          <ArrowLeft size={16} />
          Back to group
        </Link>
        <div className={cn(card, 'mt-6 p-6')}>
          <div className={cn(iconBox, 'mx-auto h-12 w-12', TONES.red)}>
            <XCircle size={22} />
          </div>
          <h2 className="mt-4 text-center font-semibold text-neutral-900 dark:text-white">
            Unable to load submission
          </h2>
          <p className={cn('mt-1 text-center text-sm', muted)}>
            {error?.message || 'Something went wrong.'}
          </p>
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={() => refetch()} className={primaryButton}>
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link
          to={`/faculty/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300"
        >
          <ArrowLeft size={16} />
          Back to group
        </Link>
        <div className={cn(card, 'mt-6 p-8 text-center')}>
          <div className={cn(iconBox, 'mx-auto h-12 w-12', TONES.neutral)}>
            <FileText size={22} />
          </div>
          <h2 className="mt-4 font-semibold text-neutral-900 dark:text-white">
            Submission not found
          </h2>
          <p className={cn('mt-2 text-sm', muted)}>
            This submission may have been removed or the link is invalid.
          </p>
          <Link
            to={`/faculty/groups/${groupId}`}
            className={cn(primaryButton, 'mt-5 inline-flex')}
          >
            Back to group
          </Link>
        </div>
      </div>
    );
  }

  const student = getStudent(submission);
  const members = getMembers(submission);
  const rawSummary = getSummary(submission);
  const parsed = parseSummarySections(rawSummary);
  const projectTitle = getProjectTitle(submission);
  const presentation = getPresentation(submission);
  const status = submission.status || 'submitted';
  const projectId = submission.project_id || submission.project?.id;

  const domain = getField(submission, 'project_domain', parsed);
  const projectType = getField(submission, 'project_type', parsed);
  const technologies = getField(submission, 'technologies', parsed);
  const facultyName = getField(submission, 'faculty_name', parsed);
  const department = getField(submission, 'department', parsed);
  const startDate = getField(submission, 'start_date', parsed);
  const problem = getField(submission, 'problem_statement', parsed);
  const objectives = getField(submission, 'objectives', parsed);
  const methodology = getField(submission, 'methodology', parsed);
  const expected = getField(submission, 'expected_outcome', parsed);
  const summaryText =
    getField(submission, 'project_summary', parsed) ||
    (!problem && !objectives ? rawSummary : '');

  const github = submission.github_url || submission.github_link;
  const demo = submission.demo_url || submission.live_url;
  const linkedin = submission.linkedin_url;
  const docs = submission.documentation_url || submission.docs_url;

  const studentEmail = student.email || submission.email || '';
  const studentReg =
    student.registration_number ||
    student.registration_no ||
    submission.registration_number ||
    '';
  const studentBranch = student.branch || submission.branch || '';
  const studentSemester = student.semester || submission.semester || '';

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      {/* Breadcrumb — same size as FacultyDashboard */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Link
            to="/faculty"
            className="inline-flex items-center gap-2 transition hover:text-neutral-900 dark:hover:text-white"
          >
            <GraduationCap size={17} />
            Faculty workspace
          </Link>
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <Link
            to="/faculty/groups"
            className="transition hover:text-neutral-900 dark:hover:text-white"
          >
            Submission groups
          </Link>
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <Link
            to={`/faculty/groups/${groupId}`}
            className="max-w-[10rem] truncate transition hover:text-neutral-900 dark:hover:text-white sm:max-w-xs"
          >
            {groupName}
          </Link>
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <span className="text-neutral-900 dark:text-white">Submission</span>
        </nav>
        <button
          type="button"
          disabled={refreshing}
          onClick={handleRefresh}
          className={cn(secondaryButton, 'min-h-11 gap-2 px-4 text-sm font-semibold')}
        >
          <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div>
        <Link
          to={`/faculty/groups/${groupId}`}
          className={cn(
            'inline-flex items-center gap-2 text-sm transition hover:text-neutral-900 dark:hover:text-white',
            muted,
          )}
        >
          <ArrowLeft size={16} />
          Back to group
        </Link>
      </div>

      {/* Header */}
      <section className={cn(card, 'overflow-hidden')}>
        <div className="border-b border-neutral-200 p-5 dark:border-white/10 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-3">
              <div className={cn(iconBox, 'h-12 w-12 rounded-2xl', TONES.violet)}>
                <FolderKanban size={22} />
              </div>
              <div className="min-w-0">
                <p className={cn('mb-1 text-xs font-medium uppercase tracking-wide', muted)}>
                  Student submission
                </p>
                <h1 className="break-words text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
                  {projectTitle}
                </h1>
                <p className={cn('mt-2 text-sm', muted)}>
                  {getStudentName(submission)}
                  {studentReg ? ` · ${studentReg}` : ''}
                  {submission.team_name ? ` · ${submission.team_name}` : ''}
                </p>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-2 divide-x divide-neutral-100 border-b border-neutral-100 dark:divide-white/[0.06] dark:border-white/[0.06] sm:grid-cols-4">
          {[
            {
              icon: Clock,
              label: 'Submitted',
              value: submission.submitted_at
                ? formatDate(submission.submitted_at)
                : '—',
              tone: 'amber',
            },
            {
              icon: Users,
              label: 'Team size',
              value:
                members.length > 0
                  ? `${members.length} member${members.length !== 1 ? 's' : ''}`
                  : '—',
              tone: 'emerald',
            },
            {
              icon: Phone,
              label: 'Contact',
              value: submission.phone || student.phone || '—',
              tone: 'sky',
            },
            {
              icon: Layers,
              label: 'Domain',
              value: domain || projectType || '—',
              tone: 'violet',
            },
          ].map((item) => (
            <div key={item.label} className="px-4 py-3.5">
              <div className={cn('flex items-center gap-2 text-xs font-medium uppercase tracking-wide', muted)}>
                <span className={cn(iconBox, 'h-6 w-6 rounded-md', TONES[item.tone])}>
                  <item.icon size={12} />
                </span>
                {item.label}
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-neutral-900 dark:text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Resubmission */}
      {submission.resubmission_status &&
      normalizeStatus(submission.resubmission_status) !== 'none' ? (
        <section className={cn(card, 'p-5 sm:p-6')}>
          <ResubmissionPanel submission={submission} groupId={groupId} />
        </section>
      ) : null}

      {/* 01 Student profile card */}
      <section className={cn(card, 'p-5 sm:p-6')}>
        <SectionHeading
          icon={UserRound}
          title="Submitted by"
          description="Primary student who submitted this project."
          number="01"
          tone="sky"
        />
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-start gap-3">
            <div className={cn(iconBox, 'h-12 w-12 rounded-2xl', TONES.sky)}>
              <UserRound size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {getStudentName(submission)}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {studentReg ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash size={14} className={ICON.neutral} />
                    <span className={muted}>Reg</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {studentReg}
                    </span>
                  </div>
                ) : null}
                {studentEmail ? (
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <Mail size={14} className={ICON.sky} />
                    <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                      {studentEmail}
                    </span>
                  </div>
                ) : null}
                {(submission.phone || student.phone) ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className={ICON.emerald} />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {submission.phone || student.phone}
                    </span>
                  </div>
                ) : null}
                {studentBranch ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 size={14} className={ICON.violet} />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {studentBranch}
                    </span>
                  </div>
                ) : null}
                {studentSemester ? (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap size={14} className={ICON.amber} />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      Semester {studentSemester}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 Team */}
      <section className={cn(card, 'p-5 sm:p-6')}>
        <SectionHeading
          icon={Users}
          title="Team information"
          description="Team name and member details from the submission form."
          number="02"
          tone="emerald"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoItem
            icon={Users}
            label="Team name"
            value={submission.team_name || '—'}
            tone="emerald"
          />
          <InfoItem
            icon={UserRound}
            label="Submitted by"
            value={getStudentName(submission)}
            tone="sky"
          />
        </div>

        {members.length > 0 ? (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2 dark:border-white/[0.06]">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Team members
              </h3>
              <span
                className={cn(
                  'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold',
                  TONES.emerald,
                )}
              >
                {members.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {members.map((member, index) => {
                const name =
                  typeof member === 'string'
                    ? member
                    : member.full_name ||
                      member.name ||
                      `Member ${index + 1}`;
                const reg =
                  typeof member === 'object'
                    ? member.registration_no || member.registration_number || ''
                    : '';
                const roll =
                  typeof member === 'object'
                    ? member.roll_no || member.roll_number || ''
                    : '';
                const email = typeof member === 'object' ? member.email || '' : '';
                const phone = typeof member === 'object' ? member.phone || '' : '';
                const branch =
                  typeof member === 'object' ? member.branch || '' : '';
                const semester =
                  typeof member === 'object' ? member.semester || '' : '';
                const role = typeof member === 'object' ? member.role || '' : '';

                return (
                  <div
                    key={member.id || member.student_id || `${name}-${index}`}
                    className="rounded-xl border border-neutral-200 p-4 dark:border-white/10"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className={cn(iconBox, 'h-9 w-9', TONES.emerald)}>
                        <UserRound size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                          {name}
                        </h4>
                        <p className={cn('text-xs', muted)}>
                          {role || `Member ${index + 1}`}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      {reg ? (
                        <div>
                          <p className={cn('text-xs', muted)}>Registration</p>
                          <p className="mt-0.5 font-medium text-neutral-800 dark:text-neutral-200">
                            {reg}
                          </p>
                        </div>
                      ) : null}
                      {roll ? (
                        <div>
                          <p className={cn('text-xs', muted)}>Roll</p>
                          <p className="mt-0.5 font-medium text-neutral-800 dark:text-neutral-200">
                            {roll}
                          </p>
                        </div>
                      ) : null}
                      {email ? (
                        <div className="sm:col-span-2">
                          <p className={cn('text-xs', muted)}>Email</p>
                          <p className="mt-0.5 break-all font-medium text-neutral-800 dark:text-neutral-200">
                            {email}
                          </p>
                        </div>
                      ) : null}
                      {phone ? (
                        <div>
                          <p className={cn('text-xs', muted)}>Phone</p>
                          <p className="mt-0.5 font-medium text-neutral-800 dark:text-neutral-200">
                            {phone}
                          </p>
                        </div>
                      ) : null}
                      {branch ? (
                        <div>
                          <p className={cn('text-xs', muted)}>Branch</p>
                          <p className="mt-0.5 font-medium text-neutral-800 dark:text-neutral-200">
                            {branch}
                          </p>
                        </div>
                      ) : null}
                      {semester ? (
                        <div>
                          <p className={cn('text-xs', muted)}>Semester</p>
                          <p className="mt-0.5 font-medium text-neutral-800 dark:text-neutral-200">
                            {semester}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-neutral-200 p-6 text-center dark:border-white/10">
            <div className={cn(iconBox, 'mx-auto h-10 w-10', TONES.neutral)}>
              <Users size={18} />
            </div>
            <p className={cn('mt-2 text-sm', muted)}>
              No team member details were included in this submission.
            </p>
          </div>
        )}
      </section>

      {/* 03 Project overview */}
      <section className={cn(card, 'p-5 sm:p-6')}>
        <SectionHeading
          icon={FolderKanban}
          title="Project overview"
          description="Title, domain, problem, objectives and approach."
          number="03"
          tone="violet"
        />
        <div className="space-y-4">
          <DetailBlock
            label="Project title"
            value={projectTitle}
            icon={FolderKanban}
            tone="violet"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailBlock label="Project domain" value={domain} icon={Layers} tone="sky" />
            <DetailBlock label="Project type" value={projectType} icon={ListChecks} tone="emerald" />
            <DetailBlock label="Start date" value={startDate} icon={CalendarDays} tone="amber" />
            <DetailBlock label="Technology stack" value={technologies} icon={BookOpen} tone="violet" />
          </div>
          <DetailBlock label="Project summary" value={summaryText} icon={FileText} tone="neutral" />
          <DetailBlock label="Problem statement" value={problem} icon={Target} tone="orange" />
          <DetailBlock label="Objectives" value={objectives} icon={Lightbulb} tone="amber" />
          <DetailBlock label="Methodology" value={methodology} icon={ListChecks} tone="sky" />
          <DetailBlock label="Expected outcome" value={expected} icon={CheckCircle2} tone="emerald" />
        </div>
      </section>

      {(facultyName || department) && (
        <section className={cn(card, 'p-5 sm:p-6')}>
          <SectionHeading
            icon={GraduationCap}
            title="Faculty and department"
            number="04"
            tone="amber"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailBlock
              label="Faculty supervisor"
              value={facultyName}
              icon={GraduationCap}
              tone="amber"
            />
            <DetailBlock
              label="Department"
              value={department}
              icon={Building2}
              tone="violet"
            />
          </div>
        </section>
      )}

      {(github || demo || linkedin || docs) && (
        <section className={cn(card, 'p-5 sm:p-6')}>
          <SectionHeading icon={Globe} title="Project links" number="05" tone="sky" />
          <div className="flex flex-wrap gap-2">
            <ResourceLink href={github} label="GitHub" icon={Github} tone="neutral" />
            <ResourceLink href={demo} label="Live demo" icon={Globe} tone="sky" />
            <ResourceLink href={linkedin} label="LinkedIn" icon={Linkedin} tone="sky" />
            <ResourceLink href={docs} label="Documentation" icon={FileText} tone="violet" />
          </div>
        </section>
      )}

      {(presentation.name || presentation.url) && (
        <section className={cn(card, 'p-5 sm:p-6')}>
          <SectionHeading
            icon={FileText}
            title="Project presentation"
            description="File uploaded by the student."
            number="06"
            tone="orange"
          />
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/70 p-4 dark:border-white/15 dark:bg-white/[0.02]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className={cn(iconBox, 'h-11 w-11', TONES.orange)}>
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-neutral-900 dark:text-white">
                    {presentation.name || 'Presentation file'}
                  </p>
                  <p className={cn('mt-1 text-xs', muted)}>PDF, PPT or PPTX</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={13} />
                    Available
                  </p>
                </div>
              </div>
              {presentation.url ? (
                <a
                  href={presentation.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(secondaryButton, 'shrink-0')}
                >
                  <Download size={15} />
                  Open / Download
                </a>
              ) : (
                <span className={cn('text-xs', muted)}>
                  Download URL not returned by API
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      <section className={cn(card, 'p-5 sm:p-6')}>
        <SectionHeading
          icon={ShieldCheck}
          title="Submission status"
          number="07"
          tone="emerald"
        />
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          {submission.updated_at ? (
            <span className={cn('text-sm', muted)}>
              Updated {formatDate(submission.updated_at)}
            </span>
          ) : null}
        </div>
        {projectId ? (
          <div className="mt-4">
            <Link
              to={`/faculty/reviews/${projectId}`}
              className={cn(primaryButton, 'inline-flex')}
            >
              Open project review
              <ArrowUpRight size={15} />
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}