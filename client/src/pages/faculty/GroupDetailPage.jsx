import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileDown,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Github,
  Globe,
  GraduationCap,
  Hourglass,
  Linkedin,
  Loader2,
  MessageSquare,
  Phone,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate, cn } from '../../lib/utils';

const PAGE_SIZE = 10;

/* ────────────────────────── STYLES ────────────────────────── */

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60';
const muted = 'text-neutral-500 dark:text-neutral-400';

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-100 dark:hover:bg-white/[0.08]';
const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200';

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
const MEMBER_TONES = ['sky', 'violet', 'emerald', 'amber', 'orange', 'rose'];

const statusStyles = {
  submitted:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  resubmitted:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
  under_review:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300',
  under_revision:
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

/* ────────────────────────── STATUS HELPERS ────────────────────────── */

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function formatStatus(value) {
  const n = normalizeStatus(value) || 'submitted';
  return n
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* Resubmission state → one of: none | pending | approved | rejected */
function getResubState(submission) {
  const s = normalizeStatus(submission?.resubmission_status);
  if (['pending', 'requested', 'resubmission_requested'].includes(s)) return 'pending';
  if (['approved', 'accepted'].includes(s)) return 'approved';
  if (s === 'rejected') return 'rejected';
  return 'none';
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status) || 'submitted';
  const Icon =
    normalized === 'approved' || normalized === 'accepted'
      ? CheckCircle2
      : normalized === 'rejected'
        ? XCircle
        : normalized === 'pending'
          ? Clock3
          : normalized === 'submitted'
            ? CircleCheck
            : normalized === 'changes_requested'
              ? AlertCircle
              : ShieldCheck;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
        statusStyles[normalized] || statusStyles.draft,
      )}
    >
      <Icon size={13} />
      {formatStatus(normalized)}
    </span>
  );
}

/* Big pill for resubmission state (same look as student page) */
function ResubPill({ state, size = 'md' }) {
  const base =
    size === 'sm'
      ? 'min-h-9 gap-1.5 rounded-lg px-2.5 py-1.5 text-xs'
      : 'min-h-11 gap-2 rounded-xl px-4 py-2.5 text-sm';
  const iconSize = size === 'sm' ? 13 : 16;

  if (state === 'pending') {
    return (
      <span
        className={cn(
          'inline-flex select-none items-center justify-center border border-amber-300 bg-amber-100 font-semibold text-amber-800 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
          base,
        )}
        title="Student has requested permission to resubmit"
      >
        <Hourglass size={iconSize} className="animate-pulse" />
        Student request pending
      </span>
    );
  }
  if (state === 'approved') {
    return (
      <span
        className={cn(
          'inline-flex select-none items-center justify-center border border-emerald-300 bg-emerald-50 font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
          base,
        )}
        title="You approved the request — student can now resubmit"
      >
        <Hourglass size={iconSize} className="animate-pulse" />
        Waiting for resubmission
      </span>
    );
  }
  if (state === 'rejected') {
    return (
      <span
        className={cn(
          'inline-flex select-none items-center justify-center border border-red-300 bg-red-50 font-semibold text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
          base,
        )}
        title="You rejected the resubmission request"
      >
        <AlertCircle size={iconSize} />
        Request rejected
      </span>
    );
  }
  return null;
}

/* ────────────────────────── SMALL COMPONENTS ────────────────────────── */

function SummaryCard({ icon: Icon, label, value, hint, tone = 'slate' }) {
  const tones = {
    slate: 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-300',
    blue: TONES.sky,
    violet: TONES.violet,
    emerald: TONES.emerald,
    amber: TONES.amber,
  };
  return (
    <div className={cn(card, 'flex min-w-0 items-start justify-between gap-3 p-5')}>
      <div className="min-w-0">
        <p className={cn('text-sm', muted)}>{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          {value}
        </p>
        {hint ? <p className={cn('mt-1 text-xs', muted)}>{hint}</p> : null}
      </div>
      <span className={cn('shrink-0 rounded-xl p-3', tones[tone])}>
        <Icon size={19} />
      </span>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description, number, action, tone = 'slate' }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TONES[tone] || TONES.slate)}>
          <Icon size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-neutral-900 dark:text-white">{title}</h2>
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
      {action}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, tone = 'slate' }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', TONES[tone] || TONES.slate)}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className={cn('text-xs', muted)}>{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {value || 'Not specified'}
        </p>
      </div>
    </div>
  );
}

/* Read-only field card (project type, domain, objectives, etc.) */
function DetailBlock({ icon: Icon, label, value, tone = 'slate' }) {
  return (
    <div className="min-w-0 rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mb-2 flex items-center gap-2">
        {Icon ? (
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', TONES[tone] || TONES.slate)}>
            <Icon size={14} />
          </span>
        ) : null}
        <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>{label}</p>
      </div>
      {value ? (
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-neutral-800 dark:text-neutral-200">
          {value}
        </p>
      ) : (
        <p className={cn('text-sm', muted)}>Not provided</p>
      )}
    </div>
  );
}

function ProgressCard({ icon: Icon, title, description, complete, tone = 'sky' }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/[0.03]">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          complete ? TONES.emerald : TONES[tone] || TONES.slate,
        )}
      >
        {complete ? <CheckCircle2 size={19} /> : <Icon size={19} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</p>
        <p className={cn('mt-1 text-xs leading-5', muted)}>{description}</p>
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
        <span className={cn('font-medium', muted)}>Submission completeness</span>
        <span className="font-semibold tabular-nums text-neutral-900 dark:text-white">
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

function ResourceLink({ href, label, icon: Icon = Globe }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200 dark:hover:bg-white/[0.08]"
    >
      <Icon size={15} className="shrink-0 text-neutral-500" />
      <span className="truncate">{label}</span>
      <ArrowUpRight size={13} className="shrink-0 text-neutral-400" />
    </a>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
      <div className="rounded-2xl bg-neutral-100 p-3.5 text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
        <FileText size={24} />
      </div>
      <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className={cn('mt-1.5 max-w-md text-sm', muted)}>{description}</p>
    </div>
  );
}

/* ──────────────────────── AUTO REFRESH ──────────────────────── */

const AUTO_REFRESH_INTERVAL = 10; // seconds
const AUTO_REFRESH_MS = AUTO_REFRESH_INTERVAL * 1000;

/* Reusable hook — polls invalidateQueries on a fixed interval.
   Returns a stable toggle plus the time remaining before next tick. */
function useAutoRefresh(enabled, onTick) {
  const [remaining, setRemaining] = useState(AUTO_REFRESH_INTERVAL);

  useEffect(() => {
    if (!enabled) {
      setRemaining(AUTO_REFRESH_INTERVAL);
      return undefined;
    }
    setRemaining(AUTO_REFRESH_INTERVAL);
    const startedAt = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, AUTO_REFRESH_INTERVAL - elapsed);
      setRemaining(left);
      if (left === 0) {
        onTick?.();
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [enabled, onTick]);

  return { remaining };
}

/* Reusable toggle button — shows "Auto: On / Off" with live pulse dot */
function AutoRefreshToggle({ enabled, onToggle, remaining }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={enabled ? `Auto-refresh every ${AUTO_REFRESH_INTERVAL}s — click to turn off` : `Turn on auto-refresh every ${AUTO_REFRESH_INTERVAL}s`}
      className={cn(
        'inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        enabled
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20'
          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300 dark:hover:bg-white/[0.08]',
      )}
      aria-pressed={enabled}
    >
      {enabled ? (
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <Radio size={15} />
      )}
      <span>Auto</span>
      {enabled ? (
        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
          {remaining}s
        </span>
      ) : null}
    </button>
  );
}

/* Last-refreshed timestamp pill — shows "Updated Xs ago" */
function LastRefreshedBadge({ lastRefreshedAt }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!lastRefreshedAt) return null;
  const diff = Math.max(0, Math.floor((Date.now() - lastRefreshedAt) / 1000));
  const label =
    diff < 5 ? 'just now' : diff < 60 ? `${diff}s ago` : `${Math.floor(diff / 60)}m ${diff % 60}s ago`;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
      <Radio size={12} />
      <span className="tabular-nums">{label}</span>
    </span>
  );
}

/* ────────────────────────── DATA EXTRACTION ────────────────────────── */

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

/* The student form saves everything as ONE text blob in project_summary.
   This splits it back into clean separate fields. */
function parseSummarySections(raw) {
  const result = { project_summary: '' };
  if (!raw || typeof raw !== 'string') return result;

  for (const [key, label] of SECTION_MAP) {
    const re = new RegExp(
      `(?:^|\\n\\n)${label}:[ \\t]*([\\s\\S]*?)(?=\\n\\n(?:${LABEL_ALT})\\b|$)`,
      'i',
    );
    const m = raw.match(re);
    if (m?.[1]?.trim()) result[key] = m[1].trim();
  }

  const idx = raw.search(new RegExp(`(?:^|\\n\\n)(?:${LABEL_ALT})\\b`, 'i'));
  result.project_summary = idx === -1 ? raw.trim() : raw.slice(0, idx).trim();

  return result;
}

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

function parseMembersFromSummary(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const out = [];
  const re = /Team member\s*\d+:\s*\n([\s\S]*?)(?=\n\s*\nTeam member\s*\d+:|$)/gi;
  let m;
  while ((m = re.exec(raw))) {
    const obj = {};
    m[1].split('\n').forEach((line) => {
      const i = line.indexOf(':');
      if (i < 0) return;
      const k = line.slice(0, i).trim().toLowerCase();
      const v = line.slice(i + 1).trim();
      if (MEMBER_KEYS[k] && v) obj[MEMBER_KEYS[k]] = v;
    });
    if (Object.keys(obj).length) out.push(obj);
  }
  return out;
}

function getStudent(s) {
  return s.student || s.profiles || {};
}

function getSubmissionId(submission) {
  if (!submission) return null;
  const candidates = [
    submission.id,
    submission.submission_id,
    submission.submissionId,
    submission._id,
    submission.uuid,
  ];
  for (const v of candidates) {
    if (v !== null && v !== undefined && String(v).trim() !== '') return String(v);
  }
  return null;
}

function getPresentation(submission) {
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
  const sizeRaw = [submission.ppt_size, submission.file_size, submission.presentation?.size].find(
    (v) => v !== undefined && v !== null,
  );
  const size = Number(sizeRaw);
  return {
    name,
    url,
    size: Number.isFinite(size) && size > 0 ? size : null,
    uploadedAt: submission.ppt_uploaded_at || submission.uploaded_at || null,
  };
}

function formatFileSize(bytes) {
  if (!bytes || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filename) {
  const m = String(filename || '').match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : '';
}

function safeFormatDate(value) {
  if (!value) return '';
  try {
    return formatDate(value) || String(value);
  } catch {
    return String(value);
  }
}

function getFacultyFeedback(s) {
  const candidates = [
    s.resubmission_feedback,
    s.faculty_feedback,
    s.review_feedback,
    s.review_comment,
    s.faculty_comment,
    s.rejection_reason,
    s.feedback,
    s.review?.feedback,
    s.review?.comment,
  ];
  return candidates.find((v) => typeof v === 'string' && v.trim())?.trim() || '';
}

/* One place to read EVERYTHING from a submission in clean form */
function extractSubmission(sub) {
  const rawSummary =
    sub.project_summary || sub.summary || sub.description || sub.project?.description || '';
  const parsed = parseSummarySections(rawSummary);
  const pick = (k) => parsed[k] || sub[k] || sub.project?.[k] || '';

  let members = parseMembersFromSummary(rawSummary);
  if (!members.length) {
    if (Array.isArray(sub.members) && sub.members.length) members = sub.members;
    else if (Array.isArray(sub.team_members) && sub.team_members.length) members = sub.team_members;
    else if (Array.isArray(sub.member_names))
      members = sub.member_names.map((n) => (typeof n === 'string' ? { name: n } : n));
    else if (typeof sub.member_names === 'string' && sub.member_names.trim())
      members = sub.member_names
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
        .map((name) => ({ name }));
  }
  members = members.map((m) => (typeof m === 'string' ? { name: m } : m));

  const student = getStudent(sub);

  return {
    id: getSubmissionId(sub),
    projectId: sub.project_id || sub.project?.id,
    title: sub.project_title || sub.title || sub.project?.title || 'Untitled project',
    teamName: sub.team_name || '',
    studentName: student.full_name || sub.student_name || 'Unknown student',
    registration: student.registration_number || student.registration_no || '',
    roll: student.roll_number || student.roll_no || '',
    email: student.email || '',
    phone: sub.phone || '',
    status: sub.status || 'submitted',
    submittedAt: sub.submitted_at,
    updatedAt: sub.updated_at,
    members,
    summary: parsed.project_summary,
    domain: pick('project_domain'),
    projectType: pick('project_type'),
    startDate: pick('start_date'),
    technologies: pick('technologies'),
    problem: pick('problem_statement'),
    objectives: pick('objectives'),
    methodology: pick('methodology'),
    expected: pick('expected_outcome'),
    faculty: pick('faculty_name'),
    department: pick('department'),
    github: sub.github_url || sub.github_link || '',
    demo: sub.demo_url || sub.live_url || '',
    linkedin: sub.linkedin_url || '',
    docs: sub.documentation_url || sub.docs_url || '',
    presentation: getPresentation(sub),
    feedback: getFacultyFeedback(sub),
    resubState: getResubState(sub),
    resubReason: sub.resubmission_reason || '',
    resubFeedback: sub.resubmission_feedback || '',
    resubRequestedAt: sub.resubmission_requested_at,
    reviewedAt: sub.reviewed_at,
  };
}

function getCompleteness(d) {
  const checks = [
    Boolean(d.teamName),
    Boolean(d.title && d.title !== 'Untitled project'),
    d.members.length > 0,
    Boolean(d.summary),
    Boolean(d.problem),
    Boolean(d.objectives),
    Boolean(d.methodology),
    Boolean(d.expected),
    Boolean(d.technologies),
    Boolean(d.github || d.demo),
    Boolean(d.faculty),
    Boolean(d.department),
    Boolean(d.presentation.name),
  ];
  const done = checks.filter(Boolean).length;
  return { done, total: checks.length, percent: Math.round((done / checks.length) * 100) };
}

/* ──────────────────────────── CSV EXPORT ──────────────────────────── */

function escapeCsv(value) {
  const str = value == null ? '' : String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function memberLine(m, i) {
  const parts = [
    m.name || m.full_name,
    m.registration_no || m.registration_number,
    m.roll_no || m.roll_number,
    m.email,
    m.phone,
    m.branch,
    m.semester ? `Sem ${m.semester}` : '',
    m.role,
  ].filter(Boolean);
  return `${i + 1}. ${parts.join(' · ')}`;
}

function buildCsv(submissions) {
  const headers = [
    'Index', 'Project Title', 'Team Name', 'Student Name', 'Registration', 'Roll',
    'Student Email', 'Contact Phone', 'Status', 'Submitted At', 'Last Updated',
    'Team Members Count', 'Team Members', 'Project Domain', 'Project Type',
    'Start Date', 'Technology Stack', 'Project Summary', 'Problem Statement',
    'Objectives', 'Methodology', 'Expected Outcome', 'GitHub', 'Live Demo',
    'LinkedIn', 'Documentation', 'Faculty Supervisor', 'Department',
    'Presentation Name', 'Presentation URL', 'Resubmission Status',
    'Resubmission Reason', 'Resubmission Feedback', 'Faculty Feedback',
  ];

  const rows = submissions.map((sub, i) => {
    const d = extractSubmission(sub);
    return [
      i + 1, d.title, d.teamName, d.studentName, d.registration, d.roll, d.email,
      d.phone, formatStatus(d.status), safeFormatDate(d.submittedAt),
      safeFormatDate(d.updatedAt), d.members.length,
      d.members.map(memberLine).join('\n'), d.domain, d.projectType, d.startDate,
      d.technologies, d.summary, d.problem, d.objectives, d.methodology, d.expected,
      d.github, d.demo, d.linkedin, d.docs, d.faculty, d.department,
      d.presentation.name, d.presentation.url,
      d.resubState === 'none' ? '' : d.resubState, d.resubReason, d.resubFeedback,
      d.feedback,
    ].map(escapeCsv);
  });

  return [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function downloadBlob(content, filename, mime) {
  try {
    const blob = new Blob([content], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1500);
    return true;
  } catch (err) {
    console.error('Download failed', err);
    return false;
  }
}

const safeName = (n) => String(n || 'group').replace(/[^\w\-]+/g, '_').slice(0, 40);

function exportCsv(submissions, name) {
  if (!submissions?.length) {
    toast.error('No submissions to export');
    return;
  }
  const ok = downloadBlob(
    '\uFEFF' + buildCsv(submissions),
    `${safeName(name)}-submissions.csv`,
    'text/csv;charset=utf-8;',
  );
  if (ok) toast.success(`Exported ${submissions.length} submission(s) to CSV`);
  else toast.error('Could not start CSV download');
}

/* ──────────────────────────── PDF EXPORT ──────────────────────────── */

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPdfHtml(submissions, groupName) {
  const block = (label, value) =>
    value
      ? `<div class="block"><div class="lbl">${esc(label)}</div><div class="val">${esc(value)}</div></div>`
      : '';
  const meta = (label, value) =>
    value
      ? `<div class="meta-item"><span class="ml">${esc(label)}:</span> <span>${esc(value)}</span></div>`
      : '';

  const cards = submissions
    .map((sub, i) => {
      const d = extractSubmission(sub);
      const memberCards = d.members
        .map(
          (m, idx) => `
        <div class="member">
          <div class="mname">${idx + 1}. ${esc(m.name || m.full_name || 'Member')}${
            m.role ? ` <span class="role">${esc(m.role)}</span>` : ''
          }</div>
          <div class="mgrid">
            ${meta('Reg', m.registration_no || m.registration_number)}
            ${meta('Roll', m.roll_no || m.roll_number)}
            ${meta('Branch', m.branch)}
            ${meta('Semester', m.semester)}
            ${meta('Email', m.email)}
            ${meta('Phone', m.phone)}
          </div>
        </div>`,
        )
        .join('');

      return `
      <article class="card">
        <div class="head">
          <h2>${i + 1}. ${esc(d.title)}</h2>
          <p class="sub">${esc(d.studentName)}${d.registration ? ` · ${esc(d.registration)}` : ''} · ${esc(formatStatus(d.status))}</p>
        </div>

        <div class="st">Project Information</div>
        <div class="grid">
          ${meta('Team', d.teamName)}${meta('Type', d.projectType)}${meta('Domain', d.domain)}
          ${meta('Start Date', d.startDate)}${meta('Tech Stack', d.technologies)}
          ${meta('Faculty', d.faculty)}${meta('Department', d.department)}
          ${meta('Contact', d.phone)}${meta('Submitted', safeFormatDate(d.submittedAt))}
        </div>

        ${d.summary ? `<div class="st">Project Summary</div>${block('Overview', d.summary)}` : ''}
        ${block('Problem Statement', d.problem)}
        ${block('Objectives', d.objectives)}
        ${block('Methodology', d.methodology)}
        ${block('Expected Outcome', d.expected)}

        ${memberCards ? `<div class="st">Team Members (${d.members.length})</div>${memberCards}` : ''}

        <div class="st">Links &amp; Files</div>
        <div class="grid">
          ${meta('GitHub', d.github)}${meta('Live Demo', d.demo)}
          ${meta('LinkedIn', d.linkedin)}${meta('Docs', d.docs)}
          ${meta('Presentation', d.presentation.name)}
        </div>

        ${d.feedback || d.resubState !== 'none' ? `<div class="st">Review &amp; Resubmission</div>
          ${meta('Resubmission', d.resubState === 'none' ? '' : formatStatus(d.resubState))}
          ${block('Student reason', d.resubReason)}
          ${block('Faculty feedback', d.feedback)}` : ''}
      </article>`;
    })
    .join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<title>${esc(groupName || 'Submissions')} — Submissions</title>
<style>
*{box-sizing:border-box}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#171717;padding:24px;max-width:900px;margin:0 auto;line-height:1.5}
h1{font-size:24px;margin:0 0 6px}h2{font-size:18px;margin:0 0 4px}
.sub,.top{color:#666;font-size:13px;margin:0 0 16px}
.card{margin-bottom:28px;padding:24px;border:1px solid #e5e5e5;border-radius:12px}
.head{border-bottom:1px solid #eee;padding-bottom:12px;margin-bottom:12px}
.st{font-size:13px;font-weight:700;text-transform:uppercase;color:#444;margin:18px 0 8px;border-bottom:1px solid #f0f0f0;padding-bottom:4px}
.grid,.mgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:13px}
.meta-item{padding:6px 8px;background:#fafafa;border-radius:6px;word-break:break-word}
.ml{font-weight:600;color:#555}
.block{background:#fafafa;border:1px solid #eee;border-radius:8px;padding:10px 12px;margin-top:8px}
.lbl{font-size:11px;font-weight:700;color:#666;text-transform:uppercase;margin-bottom:3px}
.val{font-size:13px;white-space:pre-wrap}
.member{border:1px solid #eee;border-radius:8px;padding:10px 12px;margin-top:8px;break-inside:avoid}
.mname{font-weight:600;font-size:14px;margin-bottom:6px}.role{font-size:11px;font-weight:600;background:#eef;color:#446;border-radius:4px;padding:1px 6px;margin-left:6px}
.toolbar{margin-bottom:20px;padding:14px;background:#f5f5f5;border-radius:8px;text-align:center;font-size:14px}
.toolbar button{margin-left:12px;padding:8px 16px;border-radius:6px;border:1px solid #ccc;cursor:pointer;background:#fff;font-weight:600}
@media print{body{padding:0}.toolbar{display:none!important}.card{margin-bottom:20px}}
</style></head><body>
<div class="toolbar"><strong>Print / Save PDF</strong><button onclick="window.print()">Click to Print / Save as PDF</button></div>
<h1>${esc(groupName || 'Group')} — Submissions</h1>
<p class="top">${submissions.length} submission(s) · Exported ${esc(new Date().toLocaleString())}</p>
${cards}
</body></html>`;
}

function exportPdf(submissions, name) {
  if (!submissions?.length) {
    toast.error('No submissions to export');
    return;
  }
  const html = buildPdfHtml(submissions, name);
  let win = null;
  try {
    win = window.open('', '_blank');
  } catch {
    win = null;
  }
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        /* user can click the button */
      }
    }, 500);
    toast.success('PDF preview opened — use Print → Save as PDF');
    return;
  }
  const ok = downloadBlob(html, `${safeName(name)}-submissions.html`, 'text/html;charset=utf-8');
  if (ok) toast.success('Popup blocked — HTML downloaded. Open it and Print → Save as PDF.');
  else toast.error('Could not export PDF. Allow pop-ups and try again.');
}

/* ──────────────────────── RESUBMISSION PANEL ──────────────────────── */

function ResubmissionPanel({ submission, groupId, data }) {
  const [feedback, setFeedback] = useState('');
  const [decision, setDecision] = useState('');
  const queryClient = useQueryClient();
  const state = data.resubState;
  const submissionId = getSubmissionId(submission);

  const reviewMutation = useMutation({
    mutationFn: (payload) => api.reviewGroupResubmission(groupId, submissionId, payload),
    onSuccess: async (_, variables) => {
      toast.success(
        variables.decision === 'approved'
          ? 'Resubmission request approved.'
          : 'Resubmission request rejected.',
      );
      setDecision('');
      setFeedback('');
      await queryClient.invalidateQueries({ queryKey: ['faculty-group', groupId] });
      await queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
    onError: (error) => toast.error(error.message || 'Unable to review request.'),
  });

  if (state === 'none') return null;

  const isPending = state === 'pending';
  const isApproved = state === 'approved';

  const handleReview = (e) => {
    e.preventDefault();
    if (!decision) return;
    if (decision === 'rejected' && !feedback.trim()) {
      toast.error('Please provide feedback before rejecting.');
      return;
    }
    reviewMutation.mutate({ decision, feedback: feedback.trim() });
  };

  const cancel = () => {
    setDecision('');
    setFeedback('');
  };

  return (
    <section
      className={cn(
        'rounded-2xl border p-5 sm:p-6',
        isPending
          ? 'border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/[0.05]'
          : isApproved
            ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/[0.05]'
            : 'border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/[0.05]',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              isPending ? TONES.amber : isApproved ? TONES.emerald : TONES.red,
            )}
          >
            {isPending ? <MessageSquare size={19} /> : isApproved ? <Hourglass size={19} /> : <XCircle size={19} />}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-neutral-900 dark:text-white">
              {isPending
                ? 'Student requested resubmission'
                : isApproved
                  ? 'Waiting for resubmission'
                  : 'Resubmission request rejected'}
            </h2>
            <p className={cn('mt-1 text-sm leading-6', muted)}>
              {isPending
                ? 'The student wants to edit and submit again. Approve or reject below.'
                : isApproved
                  ? 'You approved this request. The student can now edit and resubmit the project.'
                  : 'You rejected this request. The submission stays locked for the student.'}
            </p>
          </div>
        </div>
        <ResubPill state={state} size="sm" />
      </div>

      {data.resubRequestedAt ? (
        <p className={cn('mt-4 text-xs', muted)}>Requested {safeFormatDate(data.resubRequestedAt)}</p>
      ) : null}

      <div className="mt-3 rounded-xl border border-neutral-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-black/10">
        <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>Student&apos;s reason</p>
        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-800 dark:text-neutral-200">
          {data.resubReason || 'No reason was provided.'}
        </p>
      </div>

      {data.resubFeedback ? (
        <div className="mt-3 rounded-xl border border-neutral-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-black/10">
          <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>Your feedback</p>
          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-800 dark:text-neutral-200">
            {data.resubFeedback}
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
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} />
                Approve
              </button>
              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-500/30 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-500/10"
              >
                <XCircle size={16} />
                Reject
              </button>
            </div>
          ) : (
            <form onSubmit={handleReview} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {decision === 'approved' ? 'Approve this request?' : 'Reject this request'}
                </p>
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Cancel decision"
                >
                  <X size={16} />
                </button>
              </div>

              {decision === 'rejected' ? (
                <div>
                  <label
                    htmlFor={`feedback-${submissionId}`}
                    className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Feedback for student <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id={`feedback-${submissionId}`}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    required
                    placeholder="Explain why the request is rejected..."
                    className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-neutral-900 outline-none focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                  />
                  <p className={cn('mt-1 text-right text-xs', muted)}>{feedback.length}/2000</p>
                </div>
              ) : (
                <p className={cn('text-sm', muted)}>
                  The student will be allowed to edit and resubmit after approval.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={reviewMutation.isPending || (decision === 'rejected' && !feedback.trim())}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60',
                    decision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700',
                  )}
                >
                  {reviewMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : decision === 'approved' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Confirm {decision === 'approved' ? 'approval' : 'rejection'}
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  disabled={reviewMutation.isPending}
                  className={secondaryButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </section>
  );
}

/* ──────────────────────── SUBMISSION DETAIL VIEW ──────────────────────── */

function SubmissionDetailView({ submission, groupId, groupName, onBack }) {
  const d = useMemo(() => extractSubmission(submission), [submission]);
  const progress = getCompleteness(d);
  const [exporting, setExporting] = useState(null);
  const status = normalizeStatus(d.status);
  const isAccepted = ['approved', 'accepted'].includes(status);
  const isRejected = status === 'rejected';

  /* Auto-refresh — invalidate the parent faculty-group query so the
     selected submission's latest state is pulled in (used by faculty
     while waiting on a resubmission decision or status change). */
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);

  const doManualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['faculty-group', groupId] });
      setLastRefreshedAt(Date.now());
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, groupId]);

  const onAutoTick = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['faculty-group', groupId] });
    setLastRefreshedAt(Date.now());
  }, [queryClient, groupId]);

  const { remaining: autoRemaining } = useAutoRefresh(autoRefresh, onAutoTick);

  const runExport = (type) => {
    setExporting(type);
    try {
      if (type === 'csv') exportCsv([submission], d.title);
      else exportPdf([submission], d.title);
    } finally {
      setExporting(null);
    }
  };

  const progressItems = [
    {
      title: 'Team information',
      description: d.teamName
        ? `${d.members.length} member(s) · ${d.teamName}`
        : 'Team details missing',
      complete: Boolean(d.teamName && d.members.length),
      icon: Users,
      tone: 'sky',
    },
    {
      title: 'Project details',
      description: d.summary || d.problem ? 'Project details provided' : 'Project details missing',
      complete: Boolean(d.summary || d.problem),
      icon: FolderKanban,
      tone: 'violet',
    },
    {
      title: 'Presentation',
      description: d.presentation.name ? 'Presentation uploaded' : 'No presentation uploaded',
      complete: Boolean(d.presentation.name),
      icon: FileText,
      tone: 'amber',
    },
    {
      title: 'Faculty review',
      description: isAccepted ? 'Accepted (Final)' : isRejected ? 'Rejected' : 'Awaiting your review',
      complete: isAccepted,
      icon: ShieldCheck,
      tone: 'emerald',
    },
  ];

  const ext = getFileExtension(d.presentation.name);

  return (
    <div className="w-full min-w-0 space-y-6 pb-8">
      {/* Breadcrumb + title */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Link to="/faculty/groups" className="transition hover:text-neutral-900 dark:hover:text-white">
            All groups
          </Link>
          <ChevronRight size={14} />
          <button type="button" onClick={onBack} className="transition hover:text-neutral-900 dark:hover:text-white">
            {groupName}
          </button>
          <ChevronRight size={14} />
          <span className="text-neutral-800 dark:text-neutral-200">Submission</span>
        </div>

        <button
          type="button"
          onClick={onBack}
          className={cn('mb-4 inline-flex items-center gap-2 text-sm transition hover:text-neutral-900 dark:hover:text-white', muted)}
        >
          <ArrowLeft size={16} />
          Back to group
        </button>

        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <FolderKanban size={15} className="text-sky-600 dark:text-sky-400" />
          Faculty workspace
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
              Project Submission
            </h1>
            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              Review the team details, project documentation and presentation submitted by the student.
            </p>
            {/* Last refreshed + Live indicator */}
            <div className="mt-3 flex items-center gap-3">
              <LastRefreshedBadge lastRefreshedAt={lastRefreshedAt} />
              {autoRefresh ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              ) : null}
            </div>
          </div>

          {/* Action buttons: Refresh status + Auto-refresh toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={doManualRefresh}
              disabled={refreshing}
              className={secondaryButton}
              title="Refresh this submission's state"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh status'}
            </button>
            <AutoRefreshToggle
              enabled={autoRefresh}
              onToggle={() => setAutoRefresh((v) => !v)}
              remaining={autoRemaining}
            />
          </div>
        </div>
      </section>

      {/* Project header card */}
      <section className={cn(card, 'overflow-hidden')}>
        <div className="border-b border-neutral-200 p-5 dark:border-white/10 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                <FolderKanban size={23} />
              </div>
              <div className="min-w-0">
                <p className={cn('mb-1 text-xs', muted)}>Student submission</p>
                <h2 className="break-words text-xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
                  {d.title}
                </h2>
                <p className={cn('mt-2 text-sm', muted)}>
                  {d.studentName}
                  {d.teamName ? ` · ${d.teamName}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <StatusBadge status={d.status} />
              <ResubPill state={d.resubState} size="sm" />
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          <InfoItem
            icon={UserRound}
            label="Submitted by"
            tone="violet"
            value={[d.studentName, d.registration, d.roll].filter(Boolean).join(' · ')}
          />
          <InfoItem icon={Phone} label="Contact phone" tone="emerald" value={d.phone} />
          <InfoItem
            icon={CalendarDays}
            label="Submitted at"
            tone="amber"
            value={d.submittedAt ? safeFormatDate(d.submittedAt) : null}
          />
        </div>
      </section>

      {/* Overview */}
      <section className={cn(card, 'p-4 sm:p-5')}>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Submission overview</h2>
          <p className={cn('mt-1 text-sm', muted)}>Quick check of what the student has provided.</p>
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

      {/* Faculty review status */}
      <section className={cn(card, 'p-5 sm:p-6')}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                isAccepted ? TONES.emerald : isRejected ? TONES.red : TONES.violet,
              )}
            >
              {isAccepted ? <CheckCircle2 size={19} /> : isRejected ? <AlertCircle size={19} /> : <ClipboardList size={19} />}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-neutral-900 dark:text-white">
                {isRejected ? 'Submission rejected' : isAccepted ? 'Project accepted' : 'Faculty review status'}
              </h2>
              <p className={cn('mt-1 text-sm leading-6', muted)}>
                {isRejected
                  ? 'This submission was rejected.'
                  : isAccepted
                    ? 'This project is marked as accepted.'
                    : 'This submission is waiting for your review.'}
              </p>
            </div>
          </div>
          <StatusBadge status={d.status} />
        </div>

        {d.feedback ? (
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
              {d.feedback}
            </p>
            {d.reviewedAt ? (
              <p className={cn('mt-3 text-xs', muted)}>Reviewed on {safeFormatDate(d.reviewedAt)}</p>
            ) : null}
          </div>
        ) : null}

        {d.updatedAt ? (
          <p className={cn('mt-4 text-xs', muted)}>Last updated {safeFormatDate(d.updatedAt)}</p>
        ) : null}
      </section>

      {/* Resubmission request from student (same position as student's request card) */}
      <ResubmissionPanel submission={submission} groupId={groupId} data={d} />

      {/* 01 TEAM INFO */}
      <section className={cn(card, 'p-5 sm:p-6')}>
        <SectionHeading
          icon={Users}
          title="Team information"
          description="Team name and the details of each project member."
          number="01"
          tone="sky"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <DetailBlock icon={Users} tone="sky" label="Team name" value={d.teamName} />
          <DetailBlock icon={Phone} tone="emerald" label="Primary contact phone" value={d.phone} />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-b border-neutral-100 pb-3 dark:border-white/[0.06]">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Team members</h3>
          <span className={cn('text-xs', muted)}>{d.members.length} member(s)</span>
        </div>

        {d.members.length === 0 ? (
          <p className={cn('mt-4 text-sm', muted)}>No team members were added.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {d.members.map((m, index) => {
              const fields = [
                ['Registration number', m.registration_no || m.registration_number],
                ['Roll number', m.roll_no || m.roll_number],
                ['Email address', m.email],
                ['Phone number', m.phone],
                ['Branch', m.branch],
                ['Semester', m.semester ? `Semester ${m.semester}` : ''],
              ].filter(([, v]) => v);

              return (
                <div
                  key={m.id || m.student_id || `${m.name}-${index}`}
                  className="rounded-xl border border-neutral-200 p-4 dark:border-white/10 sm:p-5"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl',
                        TONES[MEMBER_TONES[index % MEMBER_TONES.length]],
                      )}
                    >
                      <UserRound size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                        {m.name || m.full_name || `Member ${index + 1}`}
                      </h3>
                      <p className={cn('mt-0.5 text-xs', muted)}>Member {index + 1}</p>
                    </div>
                    {m.role ? (
                      <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-white/[0.08] dark:text-neutral-300">
                        {m.role}
                      </span>
                    ) : null}
                  </div>

                  {fields.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {fields.map(([label, value]) => (
                        <div
                          key={label}
                          className="min-w-0 rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.02]"
                        >
                          <p className={cn('text-[11px] font-medium uppercase tracking-wide', muted)}>{label}</p>
                          <p className="mt-1 break-words text-sm font-medium text-neutral-800 dark:text-neutral-200">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 02 PROJECT OVERVIEW */}
      <section className={cn(card, 'p-5 sm:p-6')}>
        <SectionHeading
          icon={FolderKanban}
          title="Project overview"
          description="Title, domain, problem, objectives and technical approach."
          number="02"
          tone="violet"
        />
        <div className="space-y-5">
          <DetailBlock icon={FolderKanban} tone="violet" label="Project title" value={d.title} />

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailBlock icon={Globe} tone="sky" label="Project domain" value={d.domain} />
            <DetailBlock icon={ClipboardList} tone="violet" label="Project type" value={d.projectType} />
            <DetailBlock icon={CalendarDays} tone="amber" label="Project start date" value={d.startDate} />
            <DetailBlock icon={ShieldCheck} tone="emerald" label="Technology stack" value={d.technologies} />
          </div>

          <DetailBlock icon={FileText} tone="slate" label="Project summary" value={d.summary} />
          <DetailBlock icon={AlertCircle} tone="orange" label="Problem statement" value={d.problem} />
          <DetailBlock icon={CheckCircle2} tone="emerald" label="Objectives" value={d.objectives} />
          <DetailBlock icon={ClipboardList} tone="sky" label="Methodology" value={d.methodology} />
          <DetailBlock icon={BadgeCheck} tone="rose" label="Expected outcome" value={d.expected} />
        </div>
      </section>

      {/* 03 FACULTY */}
      <section className={cn(card, 'p-5 sm:p-6')}>
        <SectionHeading
          icon={GraduationCap}
          title="Faculty and department"
          description="Academic department and project supervisor."
          number="03"
          tone="emerald"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <DetailBlock icon={GraduationCap} tone="emerald" label="Faculty supervisor" value={d.faculty} />
          <DetailBlock icon={Users} tone="violet" label="Department" value={d.department} />
        </div>
      </section>

      {/* 04 LINKS */}
      <section className={cn(card, 'p-5 sm:p-6')}>
        <SectionHeading
          icon={Globe}
          title="Project links"
          description="Source code, live demo and professional profile links."
          number="04"
          tone="sky"
        />
        {d.github || d.demo || d.linkedin || d.docs ? (
          <div className="flex flex-wrap gap-2">
            <ResourceLink href={d.github} label="GitHub repository" icon={Github} />
            <ResourceLink href={d.demo} label="Live demo" icon={Globe} />
            <ResourceLink href={d.linkedin} label="LinkedIn" icon={Linkedin} />
            <ResourceLink href={d.docs} label="Documentation" icon={FileText} />
          </div>
        ) : (
          <p className={cn('text-sm', muted)}>No project links were provided.</p>
        )}
      </section>

      {/* 05 PRESENTATION */}
      <section className={cn(card, 'p-5 sm:p-6')}>
        <SectionHeading
          icon={FileText}
          title="Project presentation"
          description="Presentation uploaded by the student for review."
          number="05"
          tone="amber"
        />
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/70 p-5 dark:border-white/15 dark:bg-white/[0.02]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                  d.presentation.name ? TONES.emerald : TONES.amber,
                )}
              >
                {d.presentation.name ? <FileCheck2 size={21} /> : <FileText size={21} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-neutral-900 dark:text-white">
                  {d.presentation.name || 'No presentation uploaded'}
                </p>
                {d.presentation.name ? (
                  <p className={cn('mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5', muted)}>
                    {ext ? (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-neutral-600 dark:bg-white/[0.08] dark:text-neutral-300">
                        {ext}
                      </span>
                    ) : null}
                    {d.presentation.size ? <span>{formatFileSize(d.presentation.size)}</span> : null}
                    {d.presentation.uploadedAt ? (
                      <span>Uploaded {safeFormatDate(d.presentation.uploadedAt)}</span>
                    ) : null}
                  </p>
                ) : null}
                <p className={cn('mt-1 text-xs leading-5', muted)}>PDF, PPT or PPTX</p>
                {d.presentation.name ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={13} />
                    Presentation uploaded
                  </p>
                ) : null}
              </div>
            </div>

            {d.presentation.url ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <a href={d.presentation.url} target="_blank" rel="noreferrer" className={secondaryButton}>
                  <Eye size={15} />
                  View
                </a>
                <a href={d.presentation.url} target="_blank" rel="noreferrer" download className={primaryButton}>
                  <Download size={15} />
                  Download
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 06 REVIEW & EXPORT (same slot as student's "Review and submit") */}
      <section className={cn(card, 'overflow-hidden')}>
        <div className="border-b border-neutral-200 p-5 dark:border-white/10 sm:p-6">
          <SectionHeading
            icon={ShieldCheck}
            title="Review and export"
            description="Export this submission or open the full project review."
            number="06"
            tone="emerald"
          />
          <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4 dark:bg-white/[0.03]">
            <AlertCircle size={17} className={cn('mt-0.5 shrink-0', muted)} />
            <p className={cn('text-sm leading-6', muted)}>
              {d.resubState === 'pending'
                ? 'The student is waiting for your decision on the resubmission request.'
                : d.resubState === 'approved'
                  ? 'You approved the request. Waiting for the student to resubmit.'
                  : 'Use the buttons to export this submission as CSV or PDF.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          {d.resubState !== 'none' ? (
            <ResubPill state={d.resubState} />
          ) : (
            <span className="hidden sm:inline-block" aria-hidden="true" />
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={() => runExport('csv')} disabled={exporting !== null} className={secondaryButton}>
              {exporting === 'csv' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              Export CSV
            </button>
            <button type="button" onClick={() => runExport('pdf')} disabled={exporting !== null} className={secondaryButton}>
              {exporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              Export PDF
            </button>
            {d.projectId ? (
              <Link to={`/faculty/reviews/${d.projectId}`} className={primaryButton}>
                Open project review
                <ArrowUpRight size={16} />
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ──────────────────────── LIST CARD ──────────────────────── */

function SubmissionCard({ submission, groupId, index }) {
  const navigate = useNavigate();
  const d = useMemo(() => extractSubmission(submission), [submission]);

  const openDetail = () => {
    if (!d.id) {
      toast.error('Submission id missing from API response.');
      return;
    }
    navigate(`/faculty/groups/${groupId}?submission=${encodeURIComponent(d.id)}`);
  };

  return (
    <article
      className={cn(
        card,
        'group flex min-w-0 flex-col transition-colors duration-200 hover:border-neutral-300 dark:hover:border-white/20',
      )}
    >
      <button type="button" onClick={openDetail} className="flex min-w-0 flex-1 flex-col p-5 text-left">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-sm font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            {String(index).padStart(2, '0')}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-semibold leading-6 text-neutral-900 dark:text-white">
              {d.title}
            </h3>
            <p className={cn('mt-1 truncate text-xs', muted)}>
              {d.studentName}
              {d.registration ? ` · ${d.registration}` : d.roll ? ` · ${d.roll}` : ''}
            </p>
          </div>
          <StatusBadge status={d.status} />
        </div>

        {d.summary ? (
          <p className={cn('mt-4 line-clamp-2 break-words text-sm leading-6', muted)}>{d.summary}</p>
        ) : null}

        <div className="mt-5 space-y-3">
          {d.submittedAt ? (
            <div className={cn('flex items-center gap-2 text-sm', muted)}>
              <Clock3 size={15} className="shrink-0" />
              <span className="truncate">Submitted {safeFormatDate(d.submittedAt)}</span>
            </div>
          ) : null}
          {d.members.length > 0 ? (
            <div className={cn('flex items-center gap-2 text-sm', muted)}>
              <UsersRound size={15} className="shrink-0" />
              <span>
                {d.members.length} team member{d.members.length !== 1 ? 's' : ''}
              </span>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {d.teamName ? (
              <span className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-300">
                {d.teamName}
              </span>
            ) : null}
            {d.projectType ? (
              <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                {d.projectType}
              </span>
            ) : null}
            {d.resubState === 'pending' ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <MessageSquare size={12} />
                Resubmission request
              </span>
            ) : null}
            {d.resubState === 'approved' ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Hourglass size={12} />
                Waiting for resubmission
              </span>
            ) : null}
            {d.presentation.name || d.presentation.url ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-300">
                <FileText size={12} />
                PPT
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex-1 border-t border-neutral-100 pt-4 dark:border-white/[0.06]">
          <div className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition group-hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:group-hover:bg-neutral-200">
            View submission
            <ArrowUpRight size={16} />
          </div>
        </div>
      </button>
    </article>
  );
}

/* ──────────────────────── PAGE ──────────────────────── */

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const selectedSubmissionId = searchParams.get('submission');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(null);

  /* Auto-refresh state — every 10s invalidates the faculty-group query
     so the latest submissions and resubmission states are pulled in. */
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => Date.now());

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['faculty-group', groupId],
    queryFn: () => api.getGroup(groupId),
    enabled: Boolean(groupId),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const doManualRefresh = useCallback(async () => {
    await refetch();
    setLastRefreshedAt(Date.now());
  }, [refetch]);

  // Wrap invalidate in a stable callback so the auto-refresh effect
  // doesn't reset its timer on every render.
  const onAutoTick = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['faculty-group', groupId] });
    setLastRefreshedAt(Date.now());
  }, [queryClient, groupId]);

  const { remaining: autoRemaining } = useAutoRefresh(autoRefresh, onAutoTick);

  const payload = data?.data || data || {};
  const group = payload.group || payload;
  const submissions = Array.isArray(payload.submissions)
    ? payload.submissions
    : Array.isArray(group.submissions)
      ? group.submissions
      : [];

  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return null;
    const target = String(selectedSubmissionId);
    return (
      submissions.find((s) =>
        [s.id, s.submission_id, s.submissionId, s._id, s.uuid].some(
          (v) => v != null && String(v) === target,
        ),
      ) || null
    );
  }, [submissions, selectedSubmissionId]);

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return submissions.filter((submission) => {
      const d = extractSubmission(submission);
      const matchesSearch =
        !query ||
        [d.title, d.studentName, d.registration, d.roll, d.teamName, d.summary]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all' || normalizeStatus(submission.status) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, search, statusFilter]);

  const pendingRequests = useMemo(
    () => submissions.filter((s) => getResubState(s) === 'pending').length,
    [submissions],
  );
  const approvedSubmissions = useMemo(
    () => submissions.filter((s) => ['approved', 'accepted'].includes(normalizeStatus(s.status))).length,
    [submissions],
  );

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, groupId]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedSubmissions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSubmissions.slice(start, start + PAGE_SIZE);
  }, [filteredSubmissions, page]);

  const groupName = group.name || group.group_name || group.title || 'Submission Group';
  const groupCode = group.group_code || group.code || group.join_code;

  const runExport = (type) => {
    setExporting(type);
    try {
      if (type === 'csv') exportCsv(filteredSubmissions, groupName);
      else exportPdf(filteredSubmissions, groupName);
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className={cn('flex items-center gap-3 text-sm', muted)}>
          <Loader2 size={20} className="animate-spin" />
          Loading group details...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full min-w-0 space-y-6 pb-8">
        <Link
          to="/faculty/groups"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to groups
        </Link>
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Unable to load group</p>
            <p className="mt-1 break-words">{error?.message || 'Something went wrong while loading this group.'}</p>
            <button type="button" onClick={() => refetch()} className={cn(primaryButton, 'mt-3')}>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedSubmissionId) {
    if (!selectedSubmission) {
      return (
        <div className="w-full min-w-0 space-y-6 pb-8">
          <button
            type="button"
            onClick={() => navigate(`/faculty/groups/${groupId}`)}
            className={cn('inline-flex items-center gap-2 text-sm transition hover:text-neutral-900 dark:hover:text-white', muted)}
          >
            <ArrowLeft size={16} />
            Back to group
          </button>
          <div className={cn(card, 'border-dashed px-5 py-14 text-center')}>
            <FileText size={28} className="mx-auto text-neutral-400" />
            <h2 className="mt-4 font-semibold text-neutral-900 dark:text-white">Submission not found</h2>
            <p className={cn('mt-2 text-sm', muted)}>This submission is not in the current group data.</p>
            <button type="button" onClick={() => navigate(`/faculty/groups/${groupId}`)} className={cn(primaryButton, 'mt-5')}>
              Back to group
            </button>
          </div>
        </div>
      );
    }

    return (
      <SubmissionDetailView
        submission={selectedSubmission}
        groupId={groupId}
        groupName={groupName}
        onBack={() => navigate(`/faculty/groups/${groupId}`)}
      />
    );
  }

  return (
    <div className="w-full min-w-0 space-y-8 pb-8">
      {/* Header — breadcrumb synced with FacultyDashboard */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
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
          <span className="text-neutral-900 dark:text-white">Group</span>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
              {groupName}
            </h1>
            <p className={cn('mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6', muted)}>
              {group.description ||
                'Review student submissions, approve resubmission requests and export reports.'}
            </p>
            {/* Last refreshed indicator — professional touch */}
            <div className="mt-3 flex items-center gap-3">
              <LastRefreshedBadge lastRefreshedAt={lastRefreshedAt} />
              {autoRefresh ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              ) : null}
            </div>
          </div>

          {/* Action buttons: Refresh status + Auto-refresh toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {group.status ? <StatusBadge status={group.status} /> : null}
            <button
              type="button"
              onClick={doManualRefresh}
              disabled={isFetching}
              className={secondaryButton}
              title="Refresh submissions and resubmission states"
            >
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
              {isFetching ? 'Refreshing...' : 'Refresh status'}
            </button>
            <AutoRefreshToggle
              enabled={autoRefresh}
              onToggle={() => setAutoRefresh((v) => !v)}
              remaining={autoRemaining}
            />
          </div>
        </div>
      </section>

      {/* Meta row */}
      {(groupCode || group.created_at || group.submission_deadline || group.branch || group.academic_year) && (
        <section className={cn(card, 'p-4 sm:p-5')}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groupCode ? <InfoItem icon={ShieldCheck} label="Group code" value={groupCode} tone="sky" /> : null}
            {group.created_at ? (
              <InfoItem icon={CalendarDays} label="Created" tone="violet" value={formatDate(group.created_at)} />
            ) : null}
            {group.submission_deadline ? (
              <InfoItem icon={Clock3} label="Submission deadline" tone="amber" value={formatDate(group.submission_deadline)} />
            ) : null}
            {group.branch ? <InfoItem icon={Users} label="Branch" value={group.branch} tone="emerald" /> : null}
            {group.academic_year ? (
              <InfoItem icon={GraduationCap} label="Academic year" tone="rose" value={group.academic_year} />
            ) : null}
          </div>
        </section>
      )}

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={FileText} label="Total submissions" value={submissions.length} hint="All student submissions" tone="slate" />
        <SummaryCard icon={CheckCircle2} label="Approved" value={approvedSubmissions} hint="Approved projects" tone="emerald" />
        <SummaryCard icon={MessageSquare} label="Resubmission requests" value={pendingRequests} hint="Awaiting faculty decision" tone="amber" />
        <SummaryCard icon={Search} label="Matching results" value={filteredSubmissions.length} hint="Based on current filters" tone="blue" />
      </section>

      {/* Filters + export */}
      <section className={cn(card, 'space-y-4 p-4 sm:p-5')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Student submissions</h2>
            <p className={cn('mt-1 text-sm', muted)}>
              Search by project, student, team or roll number. Export as CSV or PDF.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runExport('csv')}
              disabled={!filteredSubmissions.length || exporting !== null}
              className={secondaryButton}
            >
              {exporting === 'csv' ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
              {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={() => runExport('pdf')}
              disabled={!filteredSubmissions.length || exporting !== null}
              className={secondaryButton}
            >
              {exporting === 'pdf' ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
              {exporting === 'pdf' ? 'Preparing PDF...' : 'Export PDF'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project, student, team or roll number..."
              aria-label="Search submissions"
              className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-10 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white/30"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200 sm:w-48"
            aria-label="Filter submissions by status"
          >
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under review</option>
            <option value="changes_requested">Changes requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-4 dark:border-white/[0.06]">
          <span className={cn('text-sm', muted)}>
            {filteredSubmissions.length
              ? `${(page - 1) * PAGE_SIZE + 1} – ${Math.min(page * PAGE_SIZE, filteredSubmissions.length)} of ${filteredSubmissions.length}`
              : '0'}{' '}
            submissions
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">{PAGE_SIZE} per page</span>
        </div>
      </section>

      {/* Cards grid */}
      {paginatedSubmissions.length === 0 ? (
        <EmptyState
          title={submissions.length === 0 ? 'No submissions yet' : 'No matching submissions'}
          description={
            submissions.length === 0
              ? 'Student submissions will appear here once they are submitted.'
              : 'Try a different search term or change the status filter.'
          }
        />
      ) : (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderKanban size={17} className="text-neutral-500 dark:text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Submissions</h2>
            <span className="rounded-lg bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
              {filteredSubmissions.length}
            </span>
            <div className="h-px flex-1 bg-neutral-200 dark:bg-white/10" />
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedSubmissions.map((submission, index) => (
              <SubmissionCard
                key={submission.id ?? `idx-${index}`}
                submission={submission}
                groupId={groupId}
                index={(page - 1) * PAGE_SIZE + index + 1}
              />
            ))}
          </div>
        </section>
      )}

      {filteredSubmissions.length > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={cn('text-sm', muted)}>
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((c) => Math.max(1, c - 1))}
              disabled={page === 1}
              className={cn(secondaryButton, 'disabled:opacity-40')}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
              disabled={page === totalPages}
              className={cn(secondaryButton, 'disabled:opacity-40')}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}