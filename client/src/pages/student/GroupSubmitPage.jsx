import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  Download,
  File,
  Image as ImageIcon,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleCheck,
  CheckSquare,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  FileWarning,
  FolderKanban,
  Github,
  Globe,
  GraduationCap,
  Hourglass,
  Loader2,
  LockKeyhole,
  Linkedin,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  SendHorizonal,
  ShieldCheck,
  Trash2,
  UnlockKeyhole,
  Upload,
  UploadCloud,
  UserRound,
  Users,
  X,
  Phone,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.04]';

const muted = 'text-neutral-500 dark:text-neutral-400';

const input =
  'min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white/30';

const label =
  'mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200';

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-100 dark:hover:bg-white/[0.08]';

const dangerButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-500/10';

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

const REJECTION_DISPLAY_DURATION = 30 * 60 * 1000;

const emptyMember = (role = '') => ({
  name: '',
  registration_no: '',
  roll_no: '',
  email: '',
  phone: '',
  branch: '',
  semester: '',
  role,
});

const initialForm = () => ({
  team_name: '',
  member_names: '',
  project_title: '',
  project_summary: '',
  project_domain: '',
  project_type: 'Major Project',
  problem_statement: '',
  objectives: '',
  methodology: '',
  expected_outcome: '',
  technologies: '',
  github_url: '',
  linkedin_url: '',
  demo_url: '',
  phone: '',
  faculty_name: '',
  department: '',
  start_date: '',
  members: [
    emptyMember('Team Leader'),
    emptyMember('Developer'),
    emptyMember('Designer / Researcher'),
    emptyMember('Member'),
  ],
});

function errorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function getRejectionTimestamp(submission) {
  if (!submission) return null;

  const candidates = [
    submission.rejected_at,
    submission.rejection_at,
    submission.rejection_date,
    submission.reviewed_at,
    submission.reviewedAt,
    submission.status_updated_at,
    submission.statusUpdatedAt,
    submission.updated_at,
    submission.updatedAt,
  ];

  for (const value of candidates) {
    if (!value) continue;
    const timestamp = new Date(value).getTime();
    if (Number.isFinite(timestamp) && timestamp > 0) {
      return timestamp;
    }
  }

  return null;
}

function getStatusInfo(submission, now = Date.now()) {
  if (!submission) {
    return {
      key: 'draft',
      label: 'Draft',
      description: 'Your project has not been submitted yet.',
    };
  }

  const acceptedStatuses = new Set([
    'accepted',
    'approved',
    'accepted_final',
    'approved_final',
    'final_accepted',
    'final_approved',
  ]);

  const rejectedStatuses = new Set([
    'rejected',
    'declined',
    'not_approved',
    'disapproved',
  ]);

  const originalStatuses = [
    submission.status,
    submission.project_status,
    submission.review_status,
    submission.approval_status,
    submission.faculty_status,
    submission.faculty_decision,
    submission.review_decision,
    submission.decision,
    submission.review?.status,
    submission.review?.decision,
    submission.faculty_review?.status,
    submission.faculty_review?.decision,
    submission.latest_review?.status,
    submission.latest_review?.decision,
  ]
    .map(normalizeStatus)
    .filter(Boolean);

  if (originalStatuses.some((status) => acceptedStatuses.has(status))) {
    return {
      key: 'accepted',
      label: 'Accepted (Final)',
      description: 'Your project has been accepted by faculty.',
    };
  }

  if (originalStatuses.some((status) => rejectedStatuses.has(status))) {
    const rejectedAt = getRejectionTimestamp(submission);

    if (rejectedAt && now - rejectedAt >= REJECTION_DISPLAY_DURATION) {
      return {
        key: 'submitted',
        label: 'Submitted',
        description: 'Your project has been submitted to faculty.',
      };
    }

    return {
      key: 'rejected',
      label: 'Rejected',
      description: 'Faculty has rejected this submission.',
    };
  }

  const status = normalizeStatus(submission.status);

  if (
    ['submitted', 'under_review', 'under_revision', 'resubmitted'].includes(
      status,
    )
  ) {
    return {
      key: 'submitted',
      label: 'Submitted',
      description: 'Your project has been submitted to faculty.',
    };
  }

  return {
    key: 'draft',
    label: 'Draft',
    description: 'Your project has not been submitted yet.',
  };
}

function getFacultyFeedback(submission) {
  if (!submission) return '';

  const candidates = [
    submission.resubmission_feedback,
    submission.resubmissionFeedback,
    submission.faculty_feedback,
    submission.facultyFeedback,
    submission.review_feedback,
    submission.reviewFeedback,
    submission.review_comment,
    submission.reviewComment,
    submission.faculty_comment,
    submission.facultyComment,
    submission.rejection_reason,
    submission.rejectionReason,
    submission.feedback,
    submission.review?.feedback,
    submission.review?.comment,
    submission.resubmission_review?.feedback,
    submission.resubmission_review?.comment,
  ];

  const message = candidates.find(
    (value) => typeof value === 'string' && value.trim(),
  );

  return message?.trim() || '';
}

/* ------------------------------------------------------------------ */
/* Summary parser (inline — no external file needed)                  */
/* The form saves everything into ONE text blob (project_summary).    */
/* These helpers split it back into separate fields.                  */
/* ------------------------------------------------------------------ */
const SUMMARY_LABELS = [
  'Problem statement',
  'Objectives',
  'Methodology',
  'Expected outcome',
  'Domain',
  'Project type',
  'Technology stack',
  'Faculty supervisor',
  'Department',
  'Project start date',
  'Team member',
];
const LABEL_ALT = SUMMARY_LABELS.join('|');

const SECTION_MAP = [
  ['problem_statement', 'Problem statement'],
  ['objectives', 'Objectives'],
  ['methodology', 'Methodology'],
  ['expected_outcome', 'Expected outcome'],
  ['project_domain', 'Domain'],
  ['project_type', 'Project type'],
  ['technologies', 'Technology stack'],
  ['faculty_name', 'Faculty supervisor'],
  ['department', 'Department'],
  ['start_date', 'Project start date'],
];

const MEMBER_KEYS = {
  name: 'name',
  'registration no': 'registration_no',
  'registration number': 'registration_no',
  'roll no': 'roll_no',
  'roll number': 'roll_no',
  email: 'email',
  phone: 'phone',
  branch: 'branch',
  semester: 'semester',
  role: 'role',
};

/* If the blob is duplicated, the LAST (latest) value wins */
function parseSummarySections(raw) {
  const result = { project_summary: '' };
  if (!raw || typeof raw !== 'string') return result;

  for (const [key, lbl] of SECTION_MAP) {
    const re = new RegExp(
      `(?:^|\\n\\n)${lbl}:[ \\t]*([\\s\\S]*?)(?=\\n\\n(?:${LABEL_ALT})\\b|$)`,
      'gi',
    );
    let last = null;
    let m;
    while ((m = re.exec(raw))) last = m;
    if (last?.[1]?.trim()) result[key] = last[1].trim();
  }

  const idx = raw.search(new RegExp(`(?:^|\\n\\n)(?:${LABEL_ALT})\\b`, 'i'));
  result.project_summary = idx === -1 ? raw.trim() : raw.slice(0, idx).trim();
  return result;
}

/* Reads members only from the LAST "Team member 1.." set, de-duplicated */
function parseMembersFromSummary(raw) {
  if (!raw || typeof raw !== 'string') return [];

  const starts = [...raw.matchAll(/Team member\s*1\s*:/gi)];
  const from = starts.length ? starts[starts.length - 1].index : 0;
  const chunk = raw.slice(from);

  const seen = new Map();
  const re =
    /Team member\s*\d+\s*:\s*\n([\s\S]*?)(?=\n\s*\nTeam member\s*\d+\s*:|$)/gi;
  let m;
  while ((m = re.exec(chunk))) {
    const obj = {};
    m[1].split('\n').forEach((line) => {
      const i = line.indexOf(':');
      if (i < 0) return;
      const k = line.slice(0, i).trim().toLowerCase();
      const v = line.slice(i + 1).trim();
      if (MEMBER_KEYS[k] && v) obj[MEMBER_KEYS[k]] = v;
    });
    if (!obj.name) continue;
    const key = (obj.registration_no || obj.roll_no || obj.email || obj.name).toLowerCase();
    seen.set(key, obj);
  }
  return [...seen.values()];
}

function normalizeSubmission(submission) {
  const form = initialForm();
  if (!submission) return form;

  const rawSummary = submission.project_summary || '';
  const parsed = parseSummarySections(rawSummary);
  const parsedMembers = parseMembersFromSummary(rawSummary);

  const storedMembers = parsedMembers.length
    ? parsedMembers
    : Array.isArray(submission.members)
      ? submission.members
      : [];

  const names = Array.isArray(submission.member_names)
    ? submission.member_names
    : typeof submission.member_names === 'string'
      ? submission.member_names.split(',').map((n) => n.trim())
      : [];

  const count = Math.max(form.members.length, storedMembers.length);

  return {
    ...form,
    team_name: submission.team_name || '',
    member_names: names.join(', '),
    project_title: submission.project_title || '',
    project_summary: parsed.project_summary,
    project_domain: parsed.project_domain || submission.project_domain || '',
    project_type: parsed.project_type || submission.project_type || 'Major Project',
    problem_statement: parsed.problem_statement || submission.problem_statement || '',
    objectives: parsed.objectives || submission.objectives || '',
    methodology: parsed.methodology || submission.methodology || '',
    expected_outcome: parsed.expected_outcome || submission.expected_outcome || '',
    technologies: parsed.technologies || submission.technologies || '',
    github_url: submission.github_url || '',
    linkedin_url: submission.linkedin_url || '',
    demo_url: submission.demo_url || '',
    phone: submission.phone || '',
    faculty_name: parsed.faculty_name || submission.faculty_name || '',
    department: parsed.department || submission.department || '',
    start_date: parsed.start_date || submission.start_date || '',
    members: Array.from({ length: count }, (_, index) => ({
      ...(form.members[index] || emptyMember('Member')),
      ...(storedMembers[index] || {}),
      name: storedMembers[index]?.name || names[index] || '',
    })),
  };
}

function getMembershipState(data) {
  const candidates = [
    data?.isMember,
    data?.is_member,
    data?.is_joined,
    data?.joined,
    data?.membership,
    data?.group?.isMember,
    data?.group?.is_member,
    data?.group?.is_joined,
    data?.data?.isMember,
    data?.data?.is_member,
    data?.data?.is_joined,
    data?.data?.joined,
  ];

  for (const value of candidates) {
    if (typeof value === 'boolean') return value;

    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (['true', 'joined', 'member', 'active'].includes(normalized)) {
        return true;
      }
      if (['false', 'not_joined', 'inactive'].includes(normalized)) {
        return false;
      }
    }
  }

  const memberLists = [
    data?.members,
    data?.group?.members,
    data?.data?.members,
    data?.data?.group?.members,
  ];

  for (const members of memberLists) {
    if (!Array.isArray(members)) continue;
    if (
      members.some(
        (member) =>
          member?.is_current_user === true ||
          member?.isCurrentUser === true,
      )
    ) {
      return true;
    }
  }

  return false;
}

function getPptUrl(submission) {
  if (!submission) return '';
  const candidates = [
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
  ];
  return candidates.find((value) => typeof value === 'string' && value.trim()) || '';
}

function getPptSize(submission) {
  if (!submission) return null;
  const candidates = [
    submission.ppt_size,
    submission.pptSize,
    submission.file_size,
    submission.fileSize,
    submission.size,
    submission.presentation?.size,
    submission.ppt?.size,
    submission.attachment?.size,
  ];
  const value = candidates.find((v) => v !== undefined && v !== null);
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function getPptUploadedAt(submission) {
  if (!submission) return null;
  const candidates = [
    submission.ppt_uploaded_at,
    submission.pptUploadedAt,
    submission.uploaded_at,
    submission.uploadedAt,
    submission.presentation_uploaded_at,
    submission.file_uploaded_at,
  ];
  for (const v of candidates) {
    if (!v) continue;
    const d = new Date(v).getTime();
    if (Number.isFinite(d) && d > 0) return v;
  }
  return null;
}

function getFileExtension(filename) {
  if (!filename) return '';
  const match = String(filename).match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : '';
}

function formatFileSize(bytes) {
  if (!bytes || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFormProgress(form, submission) {
  const checks = [
    Boolean(form.team_name.trim()),
    Boolean(form.project_title.trim()),
    form.members.some((m) => m.name.trim()),
    Boolean(form.project_summary.trim()),
    Boolean(form.problem_statement.trim()),
    Boolean(form.objectives.trim()),
    Boolean(form.methodology.trim()),
    Boolean(form.expected_outcome.trim()),
    Boolean(form.technologies.trim()),
    Boolean(form.github_url.trim() || form.demo_url.trim()),
    Boolean(form.faculty_name.trim()),
    Boolean(form.department.trim()),
    Boolean(submission?.ppt_name),
  ];
  const done = checks.filter(Boolean).length;
  return {
    done,
    total: checks.length,
    percent: Math.round((done / checks.length) * 100),
  };
}

function getSubmissionId(submission) {
  if (!submission) return null;
  const candidates = [
    submission.id,
    submission.submission_id,
    submission.submissionId,
    submission._id,
    submission.uuid,
    submission.submission?.id,
    submission.submission?.submission_id,
  ];
  for (const v of candidates) {
    if (v !== null && v !== undefined && String(v).trim() !== '') {
      return String(v);
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Small reusable components                                          */
/* ------------------------------------------------------------------ */
function SectionHeading({ icon: Icon, title, description, number, action, tone = 'slate' }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TONES[tone] || TONES.slate)}>
          <Icon size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-neutral-900 dark:text-white">
              {title}
            </h2>
            {number && (
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-white/[0.08] dark:text-neutral-400">
                {number}
              </span>
            )}
          </div>

          {description && (
            <p className={`mt-1 text-sm leading-6 ${muted}`}>{description}</p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

function Field({ label: fieldLabel, required, children, hint }) {
  return (
    <div className="min-w-0">
      <label className={label}>
        {fieldLabel}
        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {hint && <p className={`mt-1.5 text-xs leading-5 ${muted}`}>{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    accepted:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    rejected:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
    pending:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    submitted:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    under_review:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300',
    changes_requested:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300',
    awaiting_members:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    draft:
      'border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-neutral-300',
  };

  const Icon =
    status.key === 'accepted'
      ? CheckCircle2
      : status.key === 'rejected'
        ? AlertCircle
        : status.key === 'pending'
          ? Clock3
          : status.key === 'submitted'
            ? CircleCheck
            : status.key === 'under_review'
              ? Clock3
              : status.key === 'changes_requested'
                ? AlertCircle
                : ClipboardList;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
        styles[status.key] || styles.draft,
      )}
    >
      <Icon size={13} />
      {status.label}
    </span>
  );
}

function InfoItem({ icon: Icon, label: itemLabel, value, tone = 'slate' }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', TONES[tone] || TONES.slate)}>
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className={`text-xs ${muted}`}>{itemLabel}</p>
        <p className="mt-1 break-words text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {value || 'Not specified'}
        </p>
      </div>
    </div>
  );
}

function ProgressCard({ icon: Icon, title, description, complete, tone = 'sky' }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/[0.03]">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          complete
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : TONES[tone] || TONES.slate,
        )}
      >
        {complete ? <CheckCircle2 size={19} /> : <Icon size={19} />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          {title}
        </p>
        <p className={`mt-1 text-xs leading-5 ${muted}`}>{description}</p>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, description, icon: Icon, tone = 'neutral', children, footer }) {
  if (!open) return null;

  const toneClass = {
    neutral: 'bg-neutral-100 text-neutral-700 dark:bg-white/[0.07] dark:text-neutral-200',
    danger: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-neutral-900/40 backdrop-blur-sm dark:bg-black/60"
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(card, 'relative mx-auto w-full max-w-md p-6 shadow-2xl')}
      >
        <div className="flex items-start gap-3">
          {Icon && (
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                toneClass[tone],
              )}
            >
              <Icon size={20} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className={`mt-1 text-sm leading-6 ${muted}`}>{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-white/[0.06] dark:hover:text-neutral-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {children && <div className="mt-4">{children}</div>}

        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ percent, done, total }) {
  const tone =
    percent === 100
      ? 'bg-emerald-500'
      : percent >= 60
        ? 'bg-sky-500'
        : percent >= 30
          ? 'bg-amber-500'
          : 'bg-neutral-400';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className={`font-medium ${muted}`}>Submission progress</span>
        <span className="font-semibold text-neutral-900 tabular-nums dark:text-white">
          {done}/{total} · {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
        <div
          className={cn('h-full rounded-full transition-all duration-500', tone)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-36 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
        <div className="h-9 w-64 max-w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-white/10" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-neutral-100 dark:bg-white/[0.06]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className={cn(card, 'h-28 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')}
          />
        ))}
      </div>

      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className={cn(card, 'h-64 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')}
        />
      ))}
    </div>
  );
}

export default function GroupSubmitPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [projectFiles, setProjectFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [joining, setJoining] = useState(false);
  const [requestingResubmission, setRequestingResubmission] = useState(false);
  const [resubmissionReason, setResubmissionReason] = useState('');
  const [, setStatusTick] = useState(0);

  const [showDeletePpt, setShowDeletePpt] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const response = await api.getGroup(groupId);

      if (response == null) {
        throw new Error(
          'getGroup returned no data. Check getGroup in lib/api.js.',
        );
      }

      return response;
    },
    enabled: Boolean(groupId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const responseData = data?.data ?? data;

  const group =
    responseData?.group ??
    responseData?.data?.group ??
    responseData?.groupData ??
    (responseData?.id || responseData?.group_id ? responseData : null);

  const submission =
    responseData?.submission ??
    responseData?.data?.submission ??
    responseData?.group_submission ??
    responseData?.data?.group_submission ??
    group?.submission ??
    group?.group_submission ??
    group?.project_submission ??
    null;

  const joined = getMembershipState(data);
  const statusInfo = getStatusInfo(submission);
  const facultyFeedback = getFacultyFeedback(submission);

  const rawSubmissionStatus = normalizeStatus(submission?.status);
  const resubmissionStatus = normalizeStatus(submission?.resubmission_status);

  const isSubmitted =
    statusInfo.key === 'submitted' ||
    ['submitted', 'under_review', 'under_revision', 'resubmitted'].includes(
      rawSubmissionStatus,
    );

  const isResubmissionPending = [
    'pending',
    'requested',
    'resubmission_requested',
  ].includes(resubmissionStatus);

  const isResubmissionApproved = ['approved', 'accepted'].includes(
    resubmissionStatus,
  );

  const isResubmissionRejected = resubmissionStatus === 'rejected';
  const isRejected = statusInfo.key === 'rejected';
  const isAccepted = statusInfo.key === 'accepted';

  const isLocked =
    (isSubmitted || isRejected) &&
    !isResubmissionApproved &&
    !isAccepted;

  const canRequestResubmission =
    (isSubmitted || isRejected) &&
    !isResubmissionPending &&
    !isResubmissionApproved &&
    !isAccepted;

  const pptName = submission?.ppt_name || '';
  const pptUrl = getPptUrl(submission);
  const pptSize = getPptSize(submission);
  const pptUploadedAt = getPptUploadedAt(submission);
  const pptExt = getFileExtension(pptName);

  const submissionId = getSubmissionId(submission);

  const progress = useMemo(
    () => getFormProgress(form, submission),
    [form, submission],
  );

  /* Reset the form only when the saved data REALLY changes
     (not on every background refetch, so unsaved edits are not lost). */
  const submissionKey = submission
    ? [
        submissionId,
        submission.updated_at,
        submission.status,
        submission.resubmission_status,
        submission.project_summary?.length,
        submission.ppt_name,
      ].join('|')
    : 'none';

  useEffect(() => {
    setForm(normalizeSubmission(submission));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionKey]);


  useEffect(() => {
    let active = true;
    const loadProjectFiles = async () => {
      if (!groupId || typeof api.listGroupFiles !== 'function') return;
      try {
        const response = await api.listGroupFiles(groupId);
        const payload = response?.data ?? response;
        const files = Array.isArray(payload) ? payload : (payload?.files ?? payload?.items ?? []);
        if (active) setProjectFiles(Array.isArray(files) ? files : []);
      } catch (err) {
        console.error('Unable to load group project files:', err);
      }
    };
    loadProjectFiles();
    return () => { active = false; };
  }, [groupId, submissionKey]);

  useEffect(() => {
    if (!submission || getStatusInfo(submission).key !== 'rejected') {
      return undefined;
    }

    const rejectedAt = getRejectionTimestamp(submission);
    if (!rejectedAt) return undefined;

    const remaining = rejectedAt + REJECTION_DISPLAY_DURATION - Date.now();

    if (remaining <= 0) {
      setStatusTick((tick) => tick + 1);
      return undefined;
    }

    const timeout = setTimeout(() => {
      setStatusTick((tick) => tick + 1);
    }, remaining);

    return () => clearTimeout(timeout);
  }, [submission]);

  const updateField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const updateMember = (index, key, value) => {
    setForm((previous) => ({
      ...previous,
      members: previous.members.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [key]: value } : member,
      ),
    }));
  };

  const addMember = () => {
    setForm((previous) => ({
      ...previous,
      members: [...previous.members, emptyMember('Member')],
    }));
  };

  const removeMember = (index) => {
    setForm((previous) => ({
      ...previous,
      members: previous.members.filter((_, i) => i !== index),
    }));
  };

  const invalidateAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['group', groupId] }),
      queryClient.invalidateQueries({ queryKey: ['faculty-group'] }),
      queryClient.invalidateQueries({ queryKey: ['student-groups'] }),
      queryClient.invalidateQueries({ queryKey: ['my-groups'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);

  const refreshGroup = async (showToast = false) => {
    try {
      const result = await refetch();
      await invalidateAll();

      if (showToast) toast.success('Latest submission status loaded');

      return result;
    } catch (err) {
      if (showToast) {
        toast.error(errorMessage(err, 'Unable to refresh submission status'));
      }

      return null;
    }
  };

  const join = async () => {
    setJoining(true);

    try {
      await api.joinGroup(groupId);
      toast.success('Group joined successfully');
      await refreshGroup();
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to join this group'));
    } finally {
      setJoining(false);
    }
  };

  const save = async (submit = false) => {
    if (!joined) {
      toast.error('Please join the group before submitting your project');
      return;
    }

    if (isLocked) {
      toast.error('Your submission is locked. Request faculty approval first.');
      return;
    }

    if (!form.team_name.trim()) {
      toast.error('Please enter your team name');
      return;
    }

    if (!form.project_title.trim()) {
      toast.error('Please enter your project title');
      return;
    }

    const memberNames = form.members
      .map((member) => member.name.trim())
      .filter(Boolean);

    if (submit && memberNames.length === 0 && !form.member_names.trim()) {
      toast.error('Please enter at least one team member');
      return;
    }

    if (submit && !submission?.ppt_name) {
      toast.error('Please upload your presentation before submitting');
      return;
    }

    /* form.project_summary is already CLEAN (parsed), so the blob
       never gets duplicated on save. */
    const projectDetails = [
      form.project_summary.trim(),
      form.problem_statement.trim()
        ? `Problem statement: ${form.problem_statement.trim()}`
        : '',
      form.objectives.trim() ? `Objectives: ${form.objectives.trim()}` : '',
      form.methodology.trim()
        ? `Methodology: ${form.methodology.trim()}`
        : '',
      form.expected_outcome.trim()
        ? `Expected outcome: ${form.expected_outcome.trim()}`
        : '',
      form.project_domain.trim()
        ? `Domain: ${form.project_domain.trim()}`
        : '',
      form.project_type.trim()
        ? `Project type: ${form.project_type.trim()}`
        : '',
      form.technologies.trim()
        ? `Technology stack: ${form.technologies.trim()}`
        : '',
      form.faculty_name.trim()
        ? `Faculty supervisor: ${form.faculty_name.trim()}`
        : '',
      form.department.trim()
        ? `Department: ${form.department.trim()}`
        : '',
      form.start_date.trim()
        ? `Project start date: ${form.start_date.trim()}`
        : '',
      ...form.members.map((member, index) => {
        const values = [
          member.name && `Name: ${member.name.trim()}`,
          member.registration_no &&
            `Registration No: ${member.registration_no.trim()}`,
          member.roll_no && `Roll No: ${member.roll_no.trim()}`,
          member.email && `Email: ${member.email.trim()}`,
          member.phone && `Phone: ${member.phone.trim()}`,
          member.branch && `Branch: ${member.branch.trim()}`,
          member.semester && `Semester: ${member.semester.trim()}`,
          member.role && `Role: ${member.role.trim()}`,
        ].filter(Boolean);

        return values.length
          ? `Team member ${index + 1}:\n${values.join('\n')}`
          : '';
      }),
    ]
      .filter(Boolean)
      .join('\n\n');

    setSaving(true);

    try {
      await api.saveGroupSubmission(groupId, {
        team_name: form.team_name.trim(),
        member_names: memberNames.length
          ? memberNames
          : form.member_names
              .split(',')
              .map((name) => name.trim())
              .filter(Boolean),
        project_title: form.project_title.trim(),
        project_summary: projectDetails || null,
        github_url: form.github_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        demo_url: form.demo_url.trim() || null,
        phone: form.phone.trim() || null,
        submit,
      });

      toast.success(
        submit ? 'Project submitted to faculty' : 'Draft saved successfully',
      );

      await invalidateAll();

      navigate('/app/groups');
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to save your project'), {
        duration: 6000,
      });
      console.error('Project submission failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const openSubmitConfirm = () => {
    if (!joined) {
      toast.error('Please join the group before submitting your project');
      return;
    }
    if (isLocked) {
      toast.error('Your submission is locked. Request faculty approval first.');
      return;
    }
    if (!form.team_name.trim()) {
      toast.error('Please enter your team name');
      return;
    }
    if (!form.project_title.trim()) {
      toast.error('Please enter your project title');
      return;
    }
    const memberNames = form.members
      .map((m) => m.name.trim())
      .filter(Boolean);
    if (memberNames.length === 0 && !form.member_names.trim()) {
      toast.error('Please enter at least one team member');
      return;
    }
    if (!submission?.ppt_name) {
      toast.error('Please upload your presentation before submitting');
      return;
    }
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = () => {
    setShowSubmitConfirm(false);
    save(true);
  };

  const requestResubmission = async () => {
    const reason = resubmissionReason.trim();

    if (reason.length < 10) {
      toast.error('Please enter a reason of at least 10 characters');
      return;
    }

    setRequestingResubmission(true);

    try {
      if (typeof api.requestGroupResubmission !== 'function') {
        throw new Error(
          'requestGroupResubmission is missing from your API module',
        );
      }

      await api.requestGroupResubmission(groupId, reason);

      toast.success('Resubmission request sent to faculty');
      setResubmissionReason('');
      await refreshGroup();
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to request resubmission'), {
        duration: 6000,
      });
    } finally {
      setRequestingResubmission(false);
    }
  };

  const onPpt = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isLocked) {
      toast.error(
        'Your submission is locked until faculty approves your request',
      );
      event.target.value = '';
      return;
    }

    if (!/\.(ppt|pptx|pdf)$/i.test(file.name)) {
      toast.error('Choose a PPT, PPTX or PDF file');
      event.target.value = '';
      return;
    }

    setUploading(true);

    try {
      await api.uploadGroupPpt(groupId, file);
      toast.success('Presentation uploaded successfully');
      await refreshGroup();
    } catch (err) {
      toast.error(errorMessage(err, 'Presentation upload failed'));
      console.error('Presentation upload failed:', err);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };


  const allowedProjectExtensions = [
    'ppt', 'pptx', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'zip',
    'png', 'jpg', 'jpeg', 'webp', 'gif', 'txt', 'md', 'cpp', 'c', 'h',
    'hpp', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'html', 'css', 'json',
    'xml', 'sql', 'mp4', 'webm', 'mp3', 'wav',
  ];

  const onProjectFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (isLocked) {
      toast.error('Your submission is locked until faculty approves your request.');
      event.target.value = '';
      return;
    }
    const invalidFile = files.find((file) => {
      const ext = getFileExtension(file.name);
      return !allowedProjectExtensions.includes(ext) || file.size > 50 * 1024 * 1024;
    });
    if (invalidFile) {
      const ext = getFileExtension(invalidFile.name);
      toast.error(!allowedProjectExtensions.includes(ext)
        ? `${invalidFile.name}: this file type is not supported.`
        : `${invalidFile.name}: maximum file size is 50 MB.`);
      event.target.value = '';
      return;
    }
    if (typeof api.uploadGroupFile !== 'function') {
      toast.error('Group file upload API is missing. Add uploadGroupFile to lib/api.js and the matching backend route.');
      event.target.value = '';
      return;
    }
    setUploading(true);
    try {
      let uploaded = 0;
      for (const file of files) {
        await api.uploadGroupFile(groupId, file);
        uploaded += 1;
      }
      toast.success(`${uploaded} project file(s) uploaded successfully.`);
      if (typeof api.listGroupFiles === 'function') {
        const response = await api.listGroupFiles(groupId);
        const payload = response?.data ?? response;
        const listed = Array.isArray(payload) ? payload : (payload?.files ?? payload?.items ?? []);
        setProjectFiles(Array.isArray(listed) ? listed : []);
      }
      await refreshGroup();
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to upload project files.'), { duration: 6000 });
      console.error('Project file upload failed:', err);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const getProjectFileName = (file) => file?.original_name || file?.file_name || file?.filename || file?.name || 'Project file';
  const getProjectFileId = (file) => file?.id || file?.file_id || file?.uuid || file?.storage_path || getProjectFileName(file);
  const getProjectFileUrl = (file) => file?.download_url || file?.downloadUrl || file?.url || file?.public_url || file?.signed_url || file?.signedUrl || '';
  const isPreviewableFile = (file) => {
    const ext = getFileExtension(getProjectFileName(file));
    return ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'txt', 'md', 'json', 'html'].includes(ext);
  };

  const downloadProjectFile = async (file) => {
    try {
      let url = getProjectFileUrl(file);
      if (typeof api.getGroupFileUrl === 'function') {
        const response = await api.getGroupFileUrl(groupId, getProjectFileId(file));
        const payload = response?.data ?? response;
        url = payload?.url || payload?.download_url || payload?.signedUrl || payload?.signed_url || url;
      }
      if (!url) throw new Error('Download URL is not available for this file.');
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = getProjectFileName(file);
      anchor.target = '_blank';
      anchor.rel = 'noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to download this file.'));
    }
  };

  const deleteProjectFile = async (file) => {
    if (isLocked) return;
    if (typeof api.deleteGroupFile !== 'function') {
      toast.error('Group file delete API is missing. Add deleteGroupFile to lib/api.js and the matching backend route.');
      return;
    }
    const id = getProjectFileId(file);
    setDeletingFileId(id);
    try {
      await api.deleteGroupFile(groupId, id);
      setProjectFiles((current) => current.filter((item) => getProjectFileId(item) !== id));
      if (previewFile && getProjectFileId(previewFile) === id) setPreviewFile(null);
      toast.success('Project file deleted.');
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to delete project file.'));
    } finally {
      setDeletingFileId(null);
    }
  };

  const downloadAllProjectFiles = async () => {
    if (!projectFiles.length) return;
    if (typeof api.downloadGroupFilesZip !== 'function') {
      toast.error('ZIP download API is missing. Add downloadGroupFilesZip to lib/api.js and the matching backend route.');
      return;
    }
    setDownloadingZip(true);
    try {
      const response = await api.downloadGroupFilesZip(groupId);
      const payload = response?.data ?? response;
      const blob = payload instanceof Blob ? payload : payload?.blob;
      const url = payload?.url || payload?.download_url || payload?.downloadUrl;
      if (blob instanceof Blob) {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = `group-${groupId}-project-files.zip`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
      } else if (url) {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `group-${groupId}-project-files.zip`;
        anchor.target = '_blank';
        anchor.rel = 'noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } else {
        throw new Error('ZIP download response did not include a file or URL.');
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to download project files as ZIP.'));
    } finally {
      setDownloadingZip(false);
    }
  };

  const deletePpt = async () => {
    if (!submissionId) {
      toast.error('Submission ID not found. Refresh the page and try again.');
      setShowDeletePpt(false);
      return;
    }

    setShowDeletePpt(false);
    setDeleting(true);

    try {
      if (typeof api.deleteGroupPpt !== 'function') {
        throw new Error('deleteGroupPpt is missing from your API module');
      }
      await api.deleteGroupPpt(groupId, submissionId);
      toast.success('Presentation deleted');
      await refreshGroup();
    } catch (err) {
      toast.error(errorMessage(err, 'Unable to delete presentation'), {
        duration: 6000,
      });
      console.error('Presentation delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setShowResetConfirm(false);
    setForm(normalizeSubmission(submission));
    toast.success('Form reset to the last saved version');
  };

  const progressItems = useMemo(
    () => [
      {
        title: 'Team information',
        description: form.team_name.trim()
          ? `${form.members.filter((member) => member.name.trim()).length} member(s) entered`
          : 'Add your team details',
        complete: Boolean(
          form.team_name.trim() &&
            form.members.some((member) => member.name.trim()),
        ),
        icon: Users,
        tone: 'sky',
      },
      {
        title: 'Project details',
        description: form.project_title.trim()
          ? 'Project title added'
          : 'Enter your project title',
        complete: Boolean(form.project_title.trim()),
        icon: FolderKanban,
        tone: 'violet',
      },
      {
        title: 'Presentation',
        description: submission?.ppt_name
          ? 'Presentation uploaded'
          : 'Upload PPT, PPTX or PDF',
        complete: Boolean(submission?.ppt_name),
        icon: FileText,
        tone: 'amber',
      },
      {
        title: 'Faculty submission',
        description: isAccepted
          ? 'Accepted (Final)'
          : isSubmitted
            ? 'Already submitted'
            : 'Ready for final review',
        complete: isAccepted || isSubmitted,
        icon: ShieldCheck,
        tone: 'emerald',
      },
    ],
    [form, submission, isAccepted, isSubmitted],
  );

  const submitChecklist = useMemo(
    () => [
      { label: 'Team name entered', done: Boolean(form.team_name.trim()) },
      { label: 'Project title entered', done: Boolean(form.project_title.trim()) },
      {
        label: 'At least one team member',
        done: form.members.some((m) => m.name.trim()),
      },
      {
        label: 'Project summary written',
        done: Boolean(form.project_summary.trim()),
      },
      { label: 'Presentation uploaded', done: Boolean(submission?.ppt_name) },
    ],
    [form, submission],
  );

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div className={cn(card, 'mx-auto mt-8 max-w-xl p-8 text-center')}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle size={24} />
        </div>
        <h1 className="mt-4 font-semibold text-neutral-900 dark:text-white">
          Unable to load project
        </h1>
        <p className={`mt-2 break-words text-sm leading-6 ${muted}`}>
          {errorMessage(error, 'An error occurred while loading this group.')}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className={cn(primaryButton, 'mt-5')}
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={cn(card, 'mx-auto mt-8 max-w-xl p-8 text-center')}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <FolderKanban size={24} />
        </div>
        <h1 className="mt-4 font-semibold text-neutral-900 dark:text-white">
          Group not found
        </h1>
        <p className={`mt-2 text-sm ${muted}`}>
          This group may have been removed or you may not have access to it.
        </p>
        <Link to="/app/groups" className={cn(primaryButton, 'mt-5')}>
          <ArrowLeft size={16} />
          Back to My Groups
        </Link>
      </div>
    );
  }

  const groupName =
    group.title || group.name || group.group_name || 'Project Group';

  return (
    <div className="w-full min-w-0 space-y-6 pb-8">
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Link
            to="/app/groups"
            className="inline-flex items-center gap-1.5 transition hover:text-neutral-900 dark:hover:text-white"
          >
            <ArrowLeft size={15} />
            My Groups
          </Link>
          <span>/</span>
          <span className="inline-flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
            <CheckSquare size={15} />
            Project Submission
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              <FolderKanban size={15} className="text-sky-600 dark:text-sky-400" />
              Student workspace
            </div>
            <h1 className="break-words text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
              Project Submission
            </h1>
            <p className={`mt-2 max-w-2xl text-sm leading-6 ${muted}`}>
              Manage your team details, document your project, upload your
              presentation and track faculty review.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refreshGroup(true)}
            disabled={isFetching}
            className={cn(secondaryButton, 'shrink-0 self-start sm:self-auto')}
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? 'Refreshing...' : 'Refresh status'}
          </button>
        </div>
      </section>

      <section className={cn(card, 'overflow-hidden')}>
        <div className="border-b border-neutral-200 p-5 dark:border-white/10 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                <FolderKanban size={23} />
              </div>

              <div className="min-w-0">
                <p className={`mb-1 text-xs ${muted}`}>Current project group</p>
                <h2 className="break-words text-xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
                  {groupName}
                </h2>
                {group.description && (
                  <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${muted}`}>
                    {group.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <StatusBadge status={statusInfo} />

              {isResubmissionPending ? (
                <span
                  className="inline-flex min-h-9 select-none items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-800 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                  title="Resubmission request is pending faculty approval"
                >
                  <Hourglass size={13} className="animate-pulse" />
                  Waiting for approval
                </span>
              ) : isResubmissionApproved || isAccepted ? (
                <span
                  className="inline-flex min-h-9 select-none items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                  title={
                    isAccepted
                      ? 'Project approved by faculty'
                      : 'Resubmission request approved — you can edit and resubmit'
                  }
                >
                  <BadgeCheck size={13} />
                  Approved You can resubmit
                </span>
              ) : isResubmissionRejected || isRejected ? (
                <span
                  className="inline-flex min-h-9 select-none items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                  title={
                    isRejected
                      ? 'Faculty has rejected this submission'
                      : 'Your resubmission request was rejected by faculty'
                  }
                >
                  <AlertCircle size={13} />
                  Approval Rejected
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          <InfoItem
            icon={CalendarDays}
            label="Submission deadline"
            tone="amber"
            value={
              group.submission_deadline
                ? formatDate(group.submission_deadline)
                : null
            }
          />
          <InfoItem icon={Users} label="Branch" tone="violet" value={group.branch} />
          <InfoItem
            icon={GraduationCap}
            label="Academic year"
            tone="emerald"
            value={group.academic_year}
          />
        </div>
      </section>

      {joined && (
        <section className={cn(card, 'p-4 sm:p-5')}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Submission overview
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>
              Track the main requirements before submitting your project.
            </p>
          </div>

          <div className="mb-5 rounded-xl border border-neutral-200 p-4 dark:border-white/10">
            <ProgressBar {...progress} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {progressItems.map((item) => (
              <ProgressCard key={item.title} {...item} />
            ))}
          </div>
        </section>
      )}

      <section className={cn(card, 'p-5 sm:p-6')}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                isAccepted
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : isRejected
                    ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                    : isResubmissionPending
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      : isResubmissionApproved
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                        : isSubmitted
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-300',
              )}
            >
              {isRejected ? (
                <AlertCircle size={19} />
              ) : isAccepted ? (
                <CheckCircle2 size={19} />
              ) : isResubmissionPending ? (
                <Clock3 size={19} />
              ) : isResubmissionApproved ? (
                <UnlockKeyhole size={19} />
              ) : isSubmitted ? (
                <CircleCheck size={19} />
              ) : (
                <ClipboardList size={19} />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="font-semibold text-neutral-900 dark:text-white">
                {isRejected
                  ? 'Submission rejected'
                  : isAccepted
                    ? 'Project accepted'
                    : isResubmissionPending
                      ? 'Resubmission request pending'
                      : 'Faculty review status'}
              </h2>
              <p className={`mt-1 text-sm leading-6 ${muted}`}>
                {statusInfo.description}
              </p>
            </div>
          </div>

          <StatusBadge status={statusInfo} />
        </div>

        {facultyFeedback ? (
          <div
            className={cn(
              'mt-5 rounded-xl border p-4',
              isRejected
                ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/[0.06]'
                : isAccepted
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]'
                  : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[0.02]',
            )}
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <MessageSquare size={16} />
              Faculty feedback
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-700 dark:text-neutral-300">
              {facultyFeedback}
            </p>
            {submission?.reviewed_at && (
              <p className={`mt-3 text-xs ${muted}`}>
                Reviewed on {formatDate(submission.reviewed_at)}
              </p>
            )}
          </div>
        ) : (
          (isRejected || isAccepted) && (
            <p className={`mt-4 text-sm ${muted}`}>
              {isRejected
                ? 'The server did not return a faculty feedback message.'
                : 'Your project is marked as accepted.'}
            </p>
          )
        )}

        {isResubmissionPending && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.05]">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
              <Clock3 size={16} />
              Waiting for faculty decision
            </p>
            {submission?.resubmission_reason && (
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-700 dark:text-neutral-300">
                Your reason: {submission.resubmission_reason}
              </p>
            )}
          </div>
        )}

        {isResubmissionRejected && (
          <p className="mt-4 text-sm text-red-700 dark:text-red-300">
            Your previous resubmission request was rejected. Check faculty
            feedback before requesting again.
          </p>
        )}
      </section>

      {!joined ? (
        <section className={cn(card, 'p-6 sm:p-8')}>
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
              <Users size={25} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
              Join this project group
            </h2>
            <p className={`mt-2 text-sm leading-6 ${muted}`}>
              You need to join this group before you can manage team details,
              upload the presentation or submit your project.
            </p>
            <button
              type="button"
              onClick={join}
              disabled={joining}
              className={cn(primaryButton, 'mt-5')}
            >
              {joining ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Users size={16} />
              )}
              {joining ? 'Joining group...' : 'Join group'}
            </button>
          </div>
        </section>
      ) : (
        <>
          {canRequestResubmission && (
            <section className={cn(card, 'p-5 sm:p-6')}>
              <SectionHeading
                icon={UnlockKeyhole}
                title="Request resubmission"
                description="Explain the changes you need to make and ask faculty for permission to submit again."
                tone="violet"
              />

              <Field label="Reason for resubmission" required>
                <textarea
                  className={`${input} min-h-28 resize-y leading-6`}
                  value={resubmissionReason}
                  onChange={(event) => setResubmissionReason(event.target.value)}
                  placeholder="Explain the changes you plan to make..."
                  maxLength={2000}
                  disabled={requestingResubmission}
                />
              </Field>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className={`text-xs ${muted}`}>
                  {resubmissionReason.length}/2000 characters · Minimum 10
                </p>
                <button
                  type="button"
                  onClick={requestResubmission}
                  disabled={requestingResubmission}
                  className={primaryButton}
                >
                  {requestingResubmission ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <SendHorizonal size={16} />
                  )}
                  Request approval
                </button>
              </div>
            </section>
          )}

          {isLocked && (
            <section className={cn(card, 'p-5 sm:p-6')}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <LockKeyhole size={19} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-neutral-900 dark:text-white">
                    Submission locked
                  </h2>
                  <p className={`mt-1 text-sm leading-6 ${muted}`}>
                    {isResubmissionPending
                      ? 'Your resubmission request is awaiting faculty approval. Refresh the status after the faculty decision.'
                      : 'Your submission cannot be edited until faculty approves your resubmission request.'}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className={cn(card, 'p-5 sm:p-6')}>
            <SectionHeading
              icon={Users}
              title="Team information"
              description="Enter your team name and the details of each project member."
              number="01"
              tone="sky"
              action={
                !isLocked && (
                  <button
                    type="button"
                    onClick={addMember}
                    className={cn(secondaryButton, 'shrink-0')}
                  >
                    <Plus size={16} />
                    Add member
                  </button>
                )
              }
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Team name" required>
                <input
                  className={input}
                  value={form.team_name}
                  onChange={(event) => updateField('team_name', event.target.value)}
                  placeholder="e.g. Team Innovators"
                  maxLength={120}
                  disabled={saving || isLocked}
                />
              </Field>

              <Field label="Primary contact phone">
                <div className="relative">
                  <Phone
                    size={16}
                    className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`}
                  />
                  <input
                    type="tel"
                    className={`${input} pl-10`}
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder="Contact number"
                    maxLength={20}
                    disabled={saving || isLocked}
                  />
                </div>
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-b border-neutral-100 pb-3 dark:border-white/[0.06]">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Team members
              </h3>
              <span className={`text-xs ${muted}`}>
                {form.members.filter((member) => member.name.trim()).length} of{' '}
                {form.members.length} filled
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {form.members.map((member, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-neutral-200 p-4 dark:border-white/10 sm:p-5"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl',
                        TONES[['sky', 'violet', 'emerald', 'amber', 'orange', 'rose'][index % 6]],
                      )}
                    >
                      <UserRound size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                        Member {index + 1}
                      </h3>
                      <p className={`mt-0.5 text-xs ${muted}`}>
                        {member.role || 'Team member'}
                      </p>
                    </div>
                    {!isLocked && form.members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                        title="Remove member"
                        aria-label={`Remove member ${index + 1}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <Field label="Full name" required={index === 0}>
                      <input
                        className={input}
                        value={member.name}
                        onChange={(event) =>
                          updateMember(index, 'name', event.target.value)
                        }
                        placeholder="Full name"
                        disabled={saving || isLocked}
                      />
                    </Field>

                    <Field label="Registration number">
                      <input
                        className={input}
                        value={member.registration_no}
                        onChange={(event) =>
                          updateMember(index, 'registration_no', event.target.value)
                        }
                        placeholder="Registration number"
                        disabled={saving || isLocked}
                      />
                    </Field>

                    <Field label="Roll number">
                      <input
                        className={input}
                        value={member.roll_no}
                        onChange={(event) =>
                          updateMember(index, 'roll_no', event.target.value)
                        }
                        placeholder="Roll number"
                        disabled={saving || isLocked}
                      />
                    </Field>

                    <Field label="Email address">
                      <input
                        type="email"
                        className={input}
                        value={member.email}
                        onChange={(event) =>
                          updateMember(index, 'email', event.target.value)
                        }
                        placeholder="Student email"
                        disabled={saving || isLocked}
                      />
                    </Field>

                    <Field label="Phone number">
                      <input
                        type="tel"
                        className={input}
                        value={member.phone}
                        onChange={(event) =>
                          updateMember(index, 'phone', event.target.value)
                        }
                        placeholder="Phone number"
                        disabled={saving || isLocked}
                      />
                    </Field>

                    <Field label="Branch">
                      <input
                        className={input}
                        value={member.branch}
                        onChange={(event) =>
                          updateMember(index, 'branch', event.target.value)
                        }
                        placeholder="e.g. CSE"
                        disabled={saving || isLocked}
                      />
                    </Field>

                    <Field label="Semester">
                      <select
                        className={input}
                        value={member.semester}
                        onChange={(event) =>
                          updateMember(index, 'semester', event.target.value)
                        }
                        disabled={saving || isLocked}
                      >
                        <option value="">Select semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                          <option key={semester} value={String(semester)}>
                            Semester {semester}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Project role">
                      <select
                        className={input}
                        value={member.role}
                        onChange={(event) =>
                          updateMember(index, 'role', event.target.value)
                        }
                        disabled={saving || isLocked}
                      >
                        <option value="">Select role</option>
                        {[
                          'Team Leader',
                          'Frontend Developer',
                          'Backend Developer',
                          'Developer',
                          'Designer',
                          'Designer / Researcher',
                          'Researcher',
                          'Tester',
                          'Member',
                        ].map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cn(card, 'p-5 sm:p-6')}>
            <SectionHeading
              icon={FolderKanban}
              title="Project overview"
              description="Describe the problem, objectives and technical approach."
              number="02"
              tone="violet"
            />

            <div className="space-y-5">
              <Field label="Project title" required>
                <input
                  className={input}
                  value={form.project_title}
                  onChange={(event) =>
                    updateField('project_title', event.target.value)
                  }
                  placeholder="Enter your project title"
                  maxLength={200}
                  disabled={saving || isLocked}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Project domain">
                  <input
                    className={input}
                    value={form.project_domain}
                    onChange={(event) =>
                      updateField('project_domain', event.target.value)
                    }
                    placeholder="Web development, AI/ML, IoT"
                    disabled={saving || isLocked}
                  />
                </Field>

                <Field label="Project type">
                  <select
                    className={input}
                    value={form.project_type}
                    onChange={(event) =>
                      updateField('project_type', event.target.value)
                    }
                    disabled={saving || isLocked}
                  >
                    <option>Major Project</option>
                    <option>Minor Project</option>
                    <option>Research Project</option>
                    <option>Prototype</option>
                    <option>Course Project</option>
                  </select>
                </Field>

                <Field label="Project start date">
                  <input
                    type="date"
                    className={input}
                    value={form.start_date}
                    onChange={(event) =>
                      updateField('start_date', event.target.value)
                    }
                    disabled={saving || isLocked}
                  />
                </Field>

                <Field label="Technology stack">
                  <input
                    className={input}
                    value={form.technologies}
                    onChange={(event) =>
                      updateField('technologies', event.target.value)
                    }
                    placeholder="React, Node.js, PostgreSQL"
                    disabled={saving || isLocked}
                  />
                </Field>
              </div>

              <Field label="Project summary">
                <textarea
                  className={`${input} min-h-28 resize-y leading-6`}
                  value={form.project_summary}
                  onChange={(event) =>
                    updateField('project_summary', event.target.value)
                  }
                  placeholder="Summarize your project and what it aims to achieve..."
                  disabled={saving || isLocked}
                />
              </Field>

              <Field label="Problem statement">
                <textarea
                  className={`${input} min-h-24 resize-y leading-6`}
                  value={form.problem_statement}
                  onChange={(event) =>
                    updateField('problem_statement', event.target.value)
                  }
                  placeholder="What problem are you solving, and why does it matter?"
                  disabled={saving || isLocked}
                />
              </Field>

              <Field label="Objectives">
                <textarea
                  className={`${input} min-h-24 resize-y leading-6`}
                  value={form.objectives}
                  onChange={(event) =>
                    updateField('objectives', event.target.value)
                  }
                  placeholder="List the main goals of your project..."
                  disabled={saving || isLocked}
                />
              </Field>

              <Field label="Methodology">
                <textarea
                  className={`${input} min-h-24 resize-y leading-6`}
                  value={form.methodology}
                  onChange={(event) =>
                    updateField('methodology', event.target.value)
                  }
                  placeholder="Explain your approach, tools and implementation plan..."
                  disabled={saving || isLocked}
                />
              </Field>

              <Field label="Expected outcome">
                <textarea
                  className={`${input} min-h-24 resize-y leading-6`}
                  value={form.expected_outcome}
                  onChange={(event) =>
                    updateField('expected_outcome', event.target.value)
                  }
                  placeholder="Describe the expected results or deliverables..."
                  disabled={saving || isLocked}
                />
              </Field>
            </div>
          </section>

          <section className={cn(card, 'p-5 sm:p-6')}>
            <SectionHeading
              icon={GraduationCap}
              title="Faculty and department"
              description="Add your academic department and project supervisor."
              number="03"
              tone="emerald"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Faculty supervisor">
                <input
                  className={input}
                  value={form.faculty_name}
                  onChange={(event) =>
                    updateField('faculty_name', event.target.value)
                  }
                  placeholder="Supervisor name"
                  disabled={saving || isLocked}
                />
              </Field>

              <Field label="Department">
                <input
                  className={input}
                  value={form.department}
                  onChange={(event) =>
                    updateField('department', event.target.value)
                  }
                  placeholder="e.g. Computer Science and Engineering"
                  disabled={saving || isLocked}
                />
              </Field>
            </div>
          </section>

          <section className={cn(card, 'p-5 sm:p-6')}>
            <SectionHeading
              icon={Globe}
              title="Project links"
              description="Provide links to your source code, live demo and professional profile."
              number="04"
              tone="sky"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="GitHub repository">
                <div className="relative">
                  <Github
                    size={16}
                    className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`}
                  />
                  <input
                    type="url"
                    className={`${input} pl-10`}
                    value={form.github_url}
                    onChange={(event) =>
                      updateField('github_url', event.target.value)
                    }
                    placeholder="https://github.com/username/project"
                    disabled={saving || isLocked}
                  />
                </div>
              </Field>

              <Field label="Live demo">
                <div className="relative">
                  <Globe
                    size={16}
                    className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`}
                  />
                  <input
                    type="url"
                    className={`${input} pl-10`}
                    value={form.demo_url}
                    onChange={(event) =>
                      updateField('demo_url', event.target.value)
                    }
                    placeholder="https://your-project.com"
                    disabled={saving || isLocked}
                  />
                </div>
              </Field>

              <Field label="LinkedIn profile">
                <div className="relative">
                  <Linkedin
                    size={16}
                    className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`}
                  />
                  <input
                    type="url"
                    className={`${input} pl-10`}
                    value={form.linkedin_url}
                    onChange={(event) =>
                      updateField('linkedin_url', event.target.value)
                    }
                    placeholder="https://linkedin.com/in/username"
                    disabled={saving || isLocked}
                  />
                </div>
              </Field>

              <Field label="Contact phone">
                <div className="relative">
                  <Phone
                    size={16}
                    className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`}
                  />
                  <input
                    type="tel"
                    className={`${input} pl-10`}
                    value={form.phone}
                    onChange={(event) =>
                      updateField('phone', event.target.value)
                    }
                    placeholder="Contact number"
                    disabled={saving || isLocked}
                  />
                </div>
              </Field>
            </div>
          </section>

          <section className={cn(card, 'p-5 sm:p-6')}>
            <SectionHeading
              icon={Upload}
              title="Project presentation"
              description="Upload the presentation faculty will use to review your project."
              number="05"
              tone="amber"
            />

            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/70 p-5 dark:border-white/15 dark:bg-white/[0.02]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                      pptName ? TONES.emerald : TONES.amber,
                    )}
                  >
                    {pptName ? <FileCheck2 size={21} /> : <FileText size={21} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-neutral-900 dark:text-white">
                      {pptName || 'No presentation uploaded'}
                    </p>

                    {pptName && (
                      <p className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 ${muted}`}>
                        {pptExt && (
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-neutral-600 dark:bg-white/[0.08] dark:text-neutral-300">
                            {pptExt}
                          </span>
                        )}
                        {pptSize !== null && <span>{formatFileSize(pptSize)}</span>}
                        {pptUploadedAt && (
                          <span>Uploaded {formatDate(pptUploadedAt)}</span>
                        )}
                      </p>
                    )}

                    <p className={`mt-1 text-xs leading-5 ${muted}`}>
                      PDF, PPT or PPTX · Upload your final presentation
                    </p>

                    {pptName && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={13} />
                        Presentation uploaded
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <label
                    className={cn(
                      secondaryButton,
                      isLocked || uploading ? 'cursor-not-allowed' : 'cursor-pointer',
                    )}
                  >
                    {uploading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : pptName ? (
                      <RefreshCw size={15} />
                    ) : (
                      <Upload size={16} />
                    )}
                    {uploading ? 'Uploading...' : pptName ? 'Replace' : 'Choose file'}
                    <input
                      type="file"
                      className="hidden"
                      accept=".ppt,.pptx,.pdf"
                      onChange={onPpt}
                      disabled={isLocked || uploading || saving}
                    />
                  </label>

                  {pptUrl && pptName && (
                    <a
                      href={pptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={secondaryButton}
                      title="View / Download"
                    >
                      <Eye size={15} />
                      View
                    </a>
                  )}

                  {pptName && !isLocked && (
                    <button
                      type="button"
                      onClick={() => setShowDeletePpt(true)}
                      disabled={deleting || uploading || !submissionId}
                      className={dangerButton}
                      title={
                        submissionId
                          ? 'Delete presentation'
                          : 'Submission ID missing — refresh the page'
                      }
                    >
                      {deleting ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {pptName && !pptUrl && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/[0.06] dark:text-amber-300">
                  <FileWarning size={14} className="mt-0.5 shrink-0" />
                  <span>
                    File name stored but download URL not returned by the API.
                    Contact faculty if you need to download the file.
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className={cn(card, 'p-5 sm:p-6')}>
            <SectionHeading
              icon={FolderKanban}
              title="Project files & resources"
              description="Upload supporting documents, source code, screenshots, videos, and other project files. Preview supported files, download them individually, or download everything as a ZIP."
              number="06"
              tone="violet"
              action={projectFiles.length > 0 ? (
                <button type="button" onClick={downloadAllProjectFiles} disabled={downloadingZip} className={secondaryButton}>
                  {downloadingZip ? <Loader2 size={15} className="animate-spin" /> : <Archive size={15} />}
                  {downloadingZip ? 'Preparing ZIP...' : 'Download all (.zip)'}
                </button>
              ) : null}
            />

            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/70 p-5 dark:border-white/15 dark:bg-white/[0.02]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">Supporting project files</p>
                  <p className={`mt-1 text-xs leading-5 ${muted}`}>Up to 50 MB per file. Multiple files can be selected at once.</p>
                </div>
                <label className={cn(secondaryButton, isLocked || uploading ? 'cursor-not-allowed' : 'cursor-pointer')}>
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  {uploading ? 'Uploading...' : 'Add files'}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".ppt,.pptx,.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.cpp,.c,.h,.hpp,.js,.jsx,.ts,.tsx,.py,.java,.html,.css,.json,.xml,.sql,.mp4,.webm,.mp3,.wav"
                    onChange={onProjectFiles}
                    disabled={isLocked || uploading || saving}
                  />
                </label>
              </div>
            </div>

            {projectFiles.length > 0 ? (
              <div className="mt-4 space-y-2">
                {projectFiles.map((file) => {
                  const fileId = getProjectFileId(file);
                  const fileName = getProjectFileName(file);
                  const fileExt = getFileExtension(fileName);
                  const fileSize = file?.size_bytes ?? file?.size ?? file?.file_size;
                  return (
                    <div key={String(fileId)} className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-3 dark:border-white/10 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                          {['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fileExt) ? <ImageIcon size={18} /> : <File size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium text-neutral-900 dark:text-white">{fileName}</p>
                          <p className={`mt-1 text-xs ${muted}`}>
                            {fileExt ? fileExt.toUpperCase() : 'FILE'}{fileSize ? ` · ${formatFileSize(Number(fileSize))}` : ''}{file?.created_at || file?.uploaded_at ? ` · Uploaded ${formatDate(file.created_at || file.uploaded_at)}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {isPreviewableFile(file) && (
                          <button type="button" onClick={() => setPreviewFile(file)} className={secondaryButton}>
                            <Eye size={14} /> Preview
                          </button>
                        )}
                        <button type="button" onClick={() => downloadProjectFile(file)} className={secondaryButton}>
                          <Download size={14} /> Download
                        </button>
                        {!isLocked && (
                          <button type="button" onClick={() => deleteProjectFile(file)} disabled={deletingFileId === fileId || uploading} className={dangerButton}>
                            {deletingFileId === fileId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`mt-4 rounded-xl border border-neutral-200 px-4 py-8 text-center text-sm ${muted} dark:border-white/10`}>
                <FolderKanban size={24} className="mx-auto mb-2 opacity-60" />
                No additional project files uploaded yet.
              </div>
            )}
          </section>

          {!isLocked && (
            <section className={cn(card, 'overflow-hidden border-red-200 dark:border-red-500/20')}>
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    <RotateCcw size={19} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Reset form
                    </h2>
                    <p className={`mt-1 text-xs leading-5 ${muted}`}>
                      Discard your unsaved changes and reload the last saved version.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={saving || uploading}
                  className={cn(dangerButton, 'shrink-0')}
                >
                  <RotateCcw size={15} />
                  Reset form
                </button>
              </div>
            </section>
          )}

          <section className={cn(card, 'overflow-hidden')}>
            <div className="border-b border-neutral-200 p-5 dark:border-white/10 sm:p-6">
              <SectionHeading
                icon={ShieldCheck}
                title="Review and submit"
                description="Check your project information before sending it to faculty."
                number="06"
                tone="emerald"
              />

              <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4 dark:bg-white/[0.03]">
                <AlertCircle size={17} className={`mt-0.5 shrink-0 ${muted}`} />
                <p className={`text-sm leading-6 ${muted}`}>
                  {isLocked
                    ? 'Your submission is locked while waiting for faculty approval.'
                    : 'Make sure your team information is correct and your presentation is uploaded before final submission.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              {isResubmissionPending ? (
                <span
                  className="inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                  title="Resubmission request is pending faculty approval"
                >
                  <Hourglass size={16} className="animate-pulse" />
                  Waiting for approval
                </span>
              ) : isResubmissionApproved || isAccepted ? (
                <span
                  className="inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                  title={
                    isAccepted
                      ? 'Project approved by faculty'
                      : 'Resubmission request approved — you can edit and resubmit'
                  }
                >
                  <BadgeCheck size={16} />
                  Approved You can resubmit
                </span>
              ) : isResubmissionRejected || isRejected ? (
                <span
                  className="inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                  title={
                    isRejected
                      ? 'Faculty has rejected this submission'
                      : 'Your resubmission request was rejected by faculty'
                  }
                >
                  <AlertCircle size={16} />
                  Approval Rejected
                </span>
              ) : (
                <span className="hidden sm:inline-block" aria-hidden="true" />
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => save(false)}
                  disabled={saving || uploading || isLocked}
                  className={secondaryButton}
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save draft
                </button>

                {isAccepted ? (
                  <span
                    className="inline-flex min-h-11 cursor-default select-none items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                    title="Project accepted by faculty"
                  >
                    <BadgeCheck size={16} />
                    Accepted
                  </span>
                ) : isLocked && !isResubmissionApproved ? (
                  <span
                    className="inline-flex min-h-11 cursor-default select-none items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md dark:border-emerald-400/40 dark:bg-emerald-500 dark:text-white"
                    title={
                      isResubmissionPending
                        ? 'Waiting for faculty to approve your resubmission request'
                        : 'Submission sent to faculty — waiting for review'
                    }
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CircleCheck size={16} />
                    )}
                    Submitted
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={openSubmitConfirm}
                    disabled={saving || uploading}
                    className={primaryButton}
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isResubmissionApproved ? (
                      <RotateCcw size={16} />
                    ) : (
                      <SendHorizonal size={16} />
                    )}
                    {isResubmissionApproved ? 'Resubmit to faculty' : 'Submit to faculty'}
                    {!saving && <ArrowUpRight size={16} />}
                  </button>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ============== Modals ============== */}

      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Preview ${getProjectFileName(previewFile)}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewFile(null); }}>
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-white/10 sm:px-5">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{getProjectFileName(previewFile)}</h2>
                <p className={`mt-0.5 text-xs ${muted}`}>File preview</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => downloadProjectFile(previewFile)} className={secondaryButton}><Download size={14} /> Download</button>
                <button type="button" onClick={() => setPreviewFile(null)} className={secondaryButton} aria-label="Close preview"><X size={16} /></button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-neutral-100 p-2 dark:bg-neutral-900 sm:p-4">
              {(() => {
                const ext = getFileExtension(getProjectFileName(previewFile));
                const url = getProjectFileUrl(previewFile);
                if (!url) return <div className="p-8 text-center text-sm text-neutral-600 dark:text-neutral-300">Preview URL is not available. Use Download if the API provides a download link.</div>;
                if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return <img src={url} alt={getProjectFileName(previewFile)} className="mx-auto max-h-[72vh] max-w-full rounded-lg object-contain" />;
                if (['pdf', 'txt', 'md', 'json', 'html'].includes(ext)) return <iframe src={url} title={`Preview ${getProjectFileName(previewFile)}`} className="h-[72vh] w-full rounded-lg border border-neutral-200 bg-white dark:border-white/10" />;
                return <div className="p-8 text-center text-sm text-neutral-600 dark:text-neutral-300">Preview is not supported for this file type. Download the file to open it.</div>;
              })()}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={showDeletePpt}
        onClose={() => setShowDeletePpt(false)}
        title="Delete presentation?"
        description="This will permanently remove the uploaded file. You can upload a new one anytime before the deadline."
        icon={AlertTriangle}
        tone="danger"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDeletePpt(false)}
              className={secondaryButton}
            >
              Cancel
            </button>
            <button type="button" onClick={deletePpt} className={dangerButton}>
              <Trash2 size={15} />
              Delete
            </button>
          </>
        }
      />

      <Modal
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title={isResubmissionApproved ? 'Resubmit to faculty?' : 'Submit to faculty?'}
        description="Once submitted, you cannot edit the form until faculty reviews it. Please verify the checklist below."
        icon={UploadCloud}
        tone="success"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(false)}
              className={secondaryButton}
            >
              Cancel
            </button>
            <button type="button" onClick={confirmSubmit} className={primaryButton}>
              <SendHorizonal size={15} />
              Confirm submission
            </button>
          </>
        }
      >
        <ul className="space-y-2">
          {submitChecklist.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2.5 text-sm text-neutral-700 dark:text-neutral-300"
            >
              {item.done ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
              )}
              {item.label}
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset form?"
        description="All your unsaved changes will be lost. The form will reload from the last saved version."
        icon={RotateCcw}
        tone="warning"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className={secondaryButton}
            >
              Cancel
            </button>
            <button type="button" onClick={resetForm} className={dangerButton}>
              <RotateCcw size={15} />
              Reset
            </button>
          </>
        }
      />
    </div>
  );
}