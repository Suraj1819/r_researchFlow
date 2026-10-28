import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Clock3,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  Users,
  Video,
  X,
  XCircle,
} from 'lucide-react';

import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

/* ---------- Shared design tokens (same as Groups page) ---------- */

const card =
  'rounded-2xl border border-neutral-200/90 bg-white dark:border-white/10 dark:bg-neutral-950';

const input =
  'mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/[0.04]';

const searchInput =
  'min-h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:ring-white/[0.04]';

const labelClass = 'text-sm font-medium text-neutral-700 dark:text-neutral-300';

const primaryBtn =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';

const secondaryBtn =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-white/[0.05]';

const smallBtn =
  'inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-white/[0.06]';

const TABS = [
  { id: 'meetings', label: 'Meetings', icon: CalendarDays },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'notes', label: 'Supervision notes', icon: ClipboardList },
];

const STATUS_STYLES = {
  scheduled: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  completed:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  pending:
    'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  accepted:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  declined: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

/* ---------- Helpers ---------- */

function getErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
}

function toArray(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function formatDate(value) {
  if (!value) return 'Date not set';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getInitials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase() || '?'
  );
}

/* ---------- Small UI pieces ---------- */

function IconTile({ icon: Icon, tone = 'blue', size = 'normal' }) {
  const tones = {
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    violet:
      'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
    green:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    orange:
      'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    neutral:
      'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
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

function StatCard({ label, value, icon, tone, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        card,
        'min-w-0 p-5 text-left transition-colors hover:border-neutral-300 dark:hover:border-white/20',
        active && 'border-neutral-900 dark:border-white/60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-neutral-900 dark:text-white">
            {value}
          </p>
        </div>
        <IconTile icon={icon} tone={tone} />
      </div>
      {description && (
        <p className="mt-3 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      )}
    </button>
  );
}

function Avatar({ name, src, size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-12 w-12 text-sm',
  };

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 font-semibold text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
        sizes[size],
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'User'}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || 'pending').toLowerCase();
  const Icon =
    normalized === 'cancelled' || normalized === 'declined'
      ? XCircle
      : normalized === 'completed' || normalized === 'accepted'
        ? CheckCircle2
        : normalized === 'scheduled'
          ? CircleCheck
          : Clock3;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        STATUS_STYLES[normalized] || STATUS_STYLES.pending,
      )}
    >
      <Icon size={13} />
      {normalized.replaceAll('_', ' ')}
    </span>
  );
}

function InlineAlert({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300"
    >
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <p className="min-w-0 flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="rounded-md p-0.5 transition hover:bg-red-100 dark:hover:bg-red-500/10"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-5 py-14 text-center sm:py-16">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400">
        <Icon size={24} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-900 dark:text-white">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function LoadingBox({ text, className }) {
  return (
    <div
      className={cn(
        card,
        'flex min-h-56 flex-col items-center justify-center gap-3',
        className,
      )}
    >
      <Loader2 size={25} className="animate-spin text-neutral-400" />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{text}</p>
    </div>
  );
}

function Modal({ title, subtitle, icon, tone = 'violet', onClose, children, id }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-950 sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-neutral-100 bg-white p-5 dark:border-white/10 dark:bg-neutral-950 sm:p-6">
          <div className="flex items-start gap-3">
            <IconTile icon={icon} tone={tone} />
            <div>
              <h2
                id={id}
                className="text-lg font-semibold text-neutral-900 dark:text-white"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children, className }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

function StudentResults({ query, students, onPick, isPicked }) {
  return (
    <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-neutral-200 dark:border-white/10">
      {query.isFetching ? (
        <p className="p-3 text-xs text-neutral-500">Searching students...</p>
      ) : query.isError ? (
        <p className="p-3 text-xs text-red-500">{getErrorMessage(query.error)}</p>
      ) : students.length === 0 ? (
        <p className="p-3 text-xs text-neutral-500">No matching students found.</p>
      ) : (
        students.map((student) => {
          const studentId = student.id || student.student_id;

          return (
            <button
              type="button"
              key={studentId}
              disabled={!studentId || isPicked?.(studentId)}
              onClick={() => onPick({ ...student, id: studentId })}
              className="flex w-full items-center gap-3 border-b border-neutral-100 px-3 py-2.5 text-left last:border-0 hover:bg-neutral-50 disabled:opacity-40 dark:border-white/5 dark:hover:bg-white/[0.05]"
            >
              <Avatar
                name={student.full_name || student.name}
                src={student.avatar_url}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {student.full_name || student.name || 'Student'}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {student.registration_number ||
                    student.roll_number ||
                    student.email ||
                    ''}
                </p>
              </div>
              <Plus size={15} className="text-neutral-400" />
            </button>
          );
        })
      )}
    </div>
  );
}

/* ---------- Meeting form ---------- */

function MeetingForm({ onClose, onSubmit, loading }) {
  const today = new Date().toLocaleDateString('en-CA');

  const [form, setForm] = useState({
    title: '',
    agenda: '',
    studentIds: [],
    meetingDate: today,
    startTime: '10:00',
    endTime: '10:30',
    meetingMode: 'online',
    meetingLink: '',
    location: '',
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [formError, setFormError] = useState('');

  const studentsQuery = useQuery({
    queryKey: ['meeting-student-search', studentSearch],
    queryFn: () => api.searchStudents(studentSearch),
    enabled: studentSearch.trim().length >= 2,
    staleTime: 10000,
    retry: 1,
  });

  const students = toArray(studentsQuery.data, 'students');

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addStudent(student) {
    if (selectedStudents.some((item) => item.id === student.id)) return;

    setSelectedStudents((current) => [...current, student]);
    setForm((current) => ({
      ...current,
      studentIds: [...current.studentIds, student.id],
    }));
    setStudentSearch('');
    setFormError('');
  }

  function removeStudent(studentId) {
    setSelectedStudents((current) =>
      current.filter((student) => student.id !== studentId),
    );
    setForm((current) => ({
      ...current,
      studentIds: current.studentIds.filter((id) => id !== studentId),
    }));
  }

  function submit(event) {
    event.preventDefault();
    setFormError('');

    if (form.title.trim().length < 3) {
      setFormError('Title must contain at least 3 characters.');
      return;
    }

    if (!form.studentIds.length) {
      setFormError('Add at least one student to invite.');
      return;
    }

    if (form.endTime <= form.startTime) {
      setFormError('End time must be later than start time.');
      return;
    }

    if (
      form.meetingMode === 'online' &&
      form.meetingLink.trim() &&
      !/^https?:\/\/.+/i.test(form.meetingLink.trim())
    ) {
      setFormError('Meeting link must start with http:// or https://.');
      return;
    }

    onSubmit({
      title: form.title.trim(),
      agenda: form.agenda.trim(),
      studentIds: form.studentIds,
      meetingDate: form.meetingDate,
      startTime: form.startTime,
      endTime: form.endTime,
      meetingMode: form.meetingMode,
      meetingLink: form.meetingLink.trim() || null,
      location: form.location.trim() || null,
    });
  }

  return (
    <Modal
      id="schedule-meeting-title"
      icon={CalendarDays}
      title="Schedule a meeting"
      subtitle="Set the agenda and invite students to your meeting."
      onClose={loading ? () => {} : onClose}
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Meeting title" htmlFor="meeting-title">
          <input
            id="meeting-title"
            className={input}
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="e.g. Final-year project review"
            maxLength={180}
            required
          />
        </Field>

        <Field label="Agenda" htmlFor="meeting-agenda">
          <textarea
            id="meeting-agenda"
            rows={3}
            className={cn(input, 'resize-y')}
            value={form.agenda}
            onChange={(event) => update('agenda', event.target.value)}
            placeholder="What should students prepare or discuss?"
            maxLength={5000}
          />
        </Field>

        <div>
          <label htmlFor="meeting-students" className={labelClass}>
            Invite students
          </label>
          <div className="relative mt-1.5">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              id="meeting-students"
              className={searchInput}
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Search students by name or identifier"
            />
          </div>

          {studentSearch.trim().length >= 2 && (
            <StudentResults
              query={studentsQuery}
              students={students}
              onPick={addStudent}
              isPicked={(id) => selectedStudents.some((item) => item.id === id)}
            />
          )}

          {selectedStudents.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedStudents.map((student) => (
                <span
                  key={student.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 py-1 pl-2.5 pr-1.5 text-xs font-medium text-neutral-700 dark:bg-white/[0.07] dark:text-neutral-300"
                >
                  {student.full_name || student.name || 'Student'}
                  <button
                    type="button"
                    onClick={() => removeStudent(student.id)}
                    aria-label="Remove student"
                    className="rounded-md p-0.5 hover:bg-neutral-200 dark:hover:bg-white/10"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" htmlFor="meeting-date">
            <input
              id="meeting-date"
              type="date"
              className={input}
              min={today}
              value={form.meetingDate}
              onChange={(event) => update('meetingDate', event.target.value)}
              required
            />
          </Field>

          <Field label="Start time" htmlFor="meeting-start">
            <input
              id="meeting-start"
              type="time"
              className={input}
              value={form.startTime}
              onChange={(event) => update('startTime', event.target.value)}
              required
            />
          </Field>

          <Field label="End time" htmlFor="meeting-end">
            <input
              id="meeting-end"
              type="time"
              className={input}
              value={form.endTime}
              onChange={(event) => update('endTime', event.target.value)}
              required
            />
          </Field>
        </div>

        <div>
          <span className={labelClass}>Meeting format</span>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            {[
              { id: 'online', label: 'Online meeting', icon: Video, tone: 'blue' },
              { id: 'in_person', label: 'In person', icon: MapPin, tone: 'orange' },
            ].map(({ id, label, icon, tone }) => (
              <button
                type="button"
                key={id}
                onClick={() => update('meetingMode', id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition',
                  form.meetingMode === id
                    ? 'border-neutral-900 bg-neutral-50 dark:border-white/60 dark:bg-white/[0.04]'
                    : 'border-neutral-200 hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/[0.03]',
                )}
              >
                <IconTile icon={icon} tone={tone} size="small" />
                <span className="font-medium text-neutral-900 dark:text-white">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {form.meetingMode === 'online' ? (
          <Field label="Meeting link (optional)" htmlFor="meeting-link">
            <input
              id="meeting-link"
              type="url"
              className={input}
              value={form.meetingLink}
              onChange={(event) => update('meetingLink', event.target.value)}
              placeholder="https://meet.google.com/..."
            />
          </Field>
        ) : (
          <Field label="Location" htmlFor="meeting-location">
            <input
              id="meeting-location"
              className={input}
              value={form.location}
              onChange={(event) => update('location', event.target.value)}
              placeholder="e.g. Department seminar room"
              required
            />
          </Field>
        )}

        <InlineAlert message={formError} />

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={loading} className={secondaryBtn}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={cn(primaryBtn, 'px-5')}>
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CalendarDays size={15} />
            )}
            {loading ? 'Scheduling...' : 'Schedule meeting'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Message composer ---------- */

function MessageComposer({ onSend, loading, disabled = false }) {
  const [message, setMessage] = useState('');

  function submit(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading || disabled) return;
    onSend(text, () => setMessage(''));
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 border-t border-neutral-200 p-3 dark:border-white/10 sm:p-4"
    >
      <textarea
        className={cn(input, 'mt-0 max-h-32 resize-y')}
        rows={1}
        maxLength={5000}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Write a message..."
        aria-label="Message"
        disabled={disabled || loading}
      />
      <button
        type="submit"
        disabled={!message.trim() || loading || disabled}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white transition hover:bg-neutral-700 disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {loading ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <Send size={17} />
        )}
      </button>
    </form>
  );
}

/* ---------- Note form ---------- */

function NoteForm({ onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    studentId: '',
    meetingId: '',
    projectId: '',
    summary: '',
    nextSteps: '',
    followUpDate: '',
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const studentsQuery = useQuery({
    queryKey: ['note-student-search', studentSearch],
    queryFn: () => api.searchStudents(studentSearch),
    enabled: studentSearch.trim().length >= 2,
    staleTime: 10000,
    retry: 1,
  });

  const students = toArray(studentsQuery.data, 'students');

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.studentId) return;

    onSubmit({
      studentId: form.studentId,
      meetingId: form.meetingId.trim() || null,
      projectId: form.projectId.trim() || null,
      summary: form.summary.trim(),
      nextSteps: form.nextSteps.trim() || null,
      followUpDate: form.followUpDate || null,
    });
  }

  return (
    <Modal
      id="add-note-title"
      icon={FileText}
      title="Add supervision note"
      subtitle="Record discussion outcomes and the next steps."
      onClose={loading ? () => {} : onClose}
    >
      <form onSubmit={submit} className="space-y-5">
        {selectedStudent ? (
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <Avatar
              name={selectedStudent.full_name || selectedStudent.name}
              src={selectedStudent.avatar_url}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                {selectedStudent.full_name || selectedStudent.name}
              </p>
              <p className="text-xs text-neutral-500">Selected student</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedStudent(null);
                update('studentId', '');
              }}
              aria-label="Remove selected student"
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div>
            <label htmlFor="note-student" className={labelClass}>
              Find student <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                id="note-student"
                className={searchInput}
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Search student name or registration number"
              />
            </div>

            {studentSearch.trim().length >= 2 && (
              <StudentResults
                query={studentsQuery}
                students={students}
                onPick={(student) => {
                  setSelectedStudent(student);
                  update('studentId', student.id);
                  setStudentSearch('');
                }}
              />
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meeting ID (optional)" htmlFor="note-meeting">
            <input
              id="note-meeting"
              className={input}
              value={form.meetingId}
              onChange={(event) => update('meetingId', event.target.value)}
              placeholder="Meeting UUID"
            />
          </Field>

          <Field label="Project ID (optional)" htmlFor="note-project">
            <input
              id="note-project"
              className={input}
              value={form.projectId}
              onChange={(event) => update('projectId', event.target.value)}
              placeholder="Project UUID"
            />
          </Field>
        </div>

        <Field label="Discussion summary" htmlFor="note-summary">
          <textarea
            id="note-summary"
            rows={4}
            className={cn(input, 'resize-y')}
            value={form.summary}
            onChange={(event) => update('summary', event.target.value)}
            placeholder="What was discussed? What feedback was given?"
            maxLength={10000}
            required
          />
        </Field>

        <Field label="Next steps" htmlFor="note-next">
          <textarea
            id="note-next"
            rows={3}
            className={cn(input, 'resize-y')}
            value={form.nextSteps}
            onChange={(event) => update('nextSteps', event.target.value)}
            placeholder="Tasks, deliverables and action items"
            maxLength={10000}
          />
        </Field>

        <Field label="Follow-up date (optional)" htmlFor="note-followup">
          <input
            id="note-followup"
            type="date"
            className={input}
            value={form.followUpDate}
            onChange={(event) => update('followUpDate', event.target.value)}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={loading} className={secondaryBtn}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !form.studentId}
            className={cn(primaryBtn, 'px-5')}
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            {loading ? 'Saving note...' : 'Save supervision note'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Meeting card ---------- */

function MeetingCard({ meeting, onOpen, onStatusChange, updating }) {
  const participants = meeting.participants || meeting.students || [];
  const status = String(meeting.status || 'scheduled').toLowerCase();
  const isInPerson = meeting.meeting_mode === 'in_person';

  return (
    <article
      className={cn(
        card,
        'group flex min-w-0 flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:hover:border-white/20',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(meeting)}
        className="flex min-w-0 flex-1 flex-col p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-400"
      >
        <div className="flex items-start justify-between gap-3">
          <IconTile icon={CalendarDays} tone="violet" />
          <ArrowUpRight
            size={17}
            className="mt-1 shrink-0 text-neutral-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:group-hover:text-white"
          />
        </div>

        <div className="mt-4">
          <h3 className="break-words text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
            {meeting.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
            {meeting.agenda || 'No agenda has been added for this meeting.'}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
            <CalendarDays size={13} />
            {formatDate(meeting.meeting_date)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            <Clock3 size={13} />
            {formatTime(meeting.start_time)}
            {meeting.end_time && ` – ${formatTime(meeting.end_time)}`}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300">
            {isInPerson ? <MapPin size={13} /> : <Video size={13} />}
            {isInPerson ? 'In person' : 'Online'}
          </span>
        </div>

        <div className="mt-5 space-y-3 border-t border-neutral-100 pt-4 dark:border-white/[0.07]">
          {isInPerson && meeting.location && (
            <div className="flex min-w-0 items-start gap-2.5 text-sm">
              <MapPin size={15} className="mt-0.5 shrink-0 text-neutral-400" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                  Location
                </p>
                <p className="mt-0.5 break-words text-neutral-700 dark:text-neutral-300">
                  {meeting.location}
                </p>
              </div>
            </div>
          )}

          <div className="flex min-w-0 items-start gap-2.5 text-sm">
            <Users size={15} className="mt-0.5 shrink-0 text-neutral-400" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                Invited students
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {participants.length || meeting.participant_count || 0}
                </span>
                <div className="flex -space-x-2">
                  {participants.slice(0, 4).map((participant) => {
                    const student =
                      participant.student || participant.profile || participant;

                    return (
                      <span
                        key={
                          participant.student_id ||
                          student.id ||
                          student.full_name
                        }
                        title={student.full_name || student.name}
                        className="rounded-full ring-2 ring-white dark:ring-neutral-950"
                      >
                        <Avatar
                          name={student.full_name || student.name}
                          src={student.avatar_url}
                          size="sm"
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 text-sm dark:border-white/[0.07]">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            View meeting details
          </span>
          <ChevronRight
            size={16}
            className="text-neutral-400 transition group-hover:translate-x-1 group-hover:text-neutral-900 dark:group-hover:text-white"
          />
        </div>
      </button>

      <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50/70 px-5 py-3 dark:border-white/[0.07] dark:bg-white/[0.02]">
        <span className="text-xs text-neutral-400">Meeting actions</span>
        {status === 'scheduled' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(meeting, 'completed')}
              className={smallBtn}
            >
              <CheckCircle2 size={13} />
              Complete
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(meeting, 'cancelled')}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-400/20 dark:bg-neutral-950 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              <XCircle size={13} />
              Cancel
            </button>
          </div>
        ) : (
          <span className="text-xs text-neutral-400 capitalize">{status}</span>
        )}
      </div>
    </article>
  );
}

/* ---------- Meeting details ---------- */

function MeetingDetails({ meeting, onClose }) {
  const queryClient = useQueryClient();
  const [noteOpen, setNoteOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['supervision-meeting', meeting.id],
    queryFn: () => api.getSupervisionMeeting(meeting.id),
    enabled: Boolean(meeting.id),
    retry: 1,
  });

  const detail = detailQuery.data?.meeting || detailQuery.data || meeting;
  const participants = detail.participants || detail.students || [];
  const isInPerson = detail.meeting_mode === 'in_person';

  const noteMutation = useMutation({
    mutationFn: (payload) =>
      api.createSupervisionNote({
        ...payload,
        meetingId: payload.meetingId || meeting.id || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-notes'] });
      setNoteOpen(false);
    },
  });

  const infoTiles = [
    {
      icon: CalendarDays,
      tone: 'blue',
      label: 'Date',
      value: formatDate(detail.meeting_date),
    },
    {
      icon: Clock3,
      tone: 'violet',
      label: 'Time',
      value: `${formatTime(detail.start_time)} – ${formatTime(detail.end_time)}`,
    },
    {
      icon: isInPerson ? MapPin : Video,
      tone: 'orange',
      label: 'Format',
      value: isInPerson ? 'In person' : 'Online',
      extra: (
        <>
          {detail.location && (
            <p className="mt-1 text-xs text-neutral-500">{detail.location}</p>
          )}
          {detail.meeting_link && (
            <a
              href={detail.meeting_link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 break-all text-xs font-medium text-neutral-900 hover:underline dark:text-white"
            >
              Open meeting link
              <ArrowUpRight size={13} />
            </a>
          )}
        </>
      ),
    },
    {
      icon: Users,
      tone: 'green',
      label: 'Invitations',
      value: `${participants.length} participants`,
    },
  ];

  return (
    <>
      <Modal
        id="meeting-details-title"
        icon={CalendarDays}
        title="Meeting details"
        subtitle="Meeting information and student invitations."
        onClose={onClose}
      >
        {detailQuery.isFetching && (
          <div className="mb-4 flex items-center gap-2 text-xs text-neutral-500">
            <Loader2 size={14} className="animate-spin" />
            Refreshing meeting details...
          </div>
        )}

        {detailQuery.isError && (
          <p className="mb-4 text-xs text-orange-600 dark:text-orange-300">
            Could not refresh meeting details. Showing available meeting data.
          </p>
        )}

        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {detail.title}
              </h3>
              <StatusBadge status={detail.status || 'scheduled'} />
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              {detail.agenda || 'No agenda has been added for this meeting.'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {infoTiles.map(({ icon, tone, label, value, extra }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-xl border border-neutral-200 p-3.5 dark:border-white/10"
              >
                <IconTile icon={icon} tone={tone} size="small" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                    {label}
                  </p>
                  <p className="mt-0.5 break-words text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {value}
                  </p>
                  {extra}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
              Invited students
            </h4>

            {participants.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No participant details are available.
              </p>
            ) : (
              <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 dark:divide-white/5 dark:border-white/10">
                {participants.map((participant) => {
                  const student =
                    participant.student || participant.profile || participant;

                  return (
                    <div
                      key={participant.student_id || student.id}
                      className="flex items-center gap-3 p-3"
                    >
                      <Avatar
                        name={student.full_name || student.name}
                        src={student.avatar_url}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                          {student.full_name || student.name || 'Student'}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {student.registration_number ||
                            student.roll_number ||
                            student.email ||
                            ''}
                        </p>
                      </div>
                      <StatusBadge status={participant.response || 'pending'} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {noteMutation.isError && (
            <InlineAlert message={getErrorMessage(noteMutation.error)} />
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={secondaryBtn}>
              Close
            </button>
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className={cn(primaryBtn, 'px-5')}
            >
              <FileText size={15} />
              Add supervision note
            </button>
          </div>
        </div>
      </Modal>

      {noteOpen && (
        <NoteForm
          onClose={() => setNoteOpen(false)}
          loading={noteMutation.isPending}
          onSubmit={(payload) => noteMutation.mutate(payload)}
        />
      )}
    </>
  );
}

/* ---------- Meetings tab ---------- */

function MeetingsTab() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mutationError, setMutationError] = useState('');

  const meetingsQuery = useQuery({
    queryKey: ['supervision-meetings'],
    queryFn: () => api.listSupervisionMeetings(),
    staleTime: 15000,
    retry: 1,
  });

  const meetings = toArray(meetingsQuery.data, 'meetings');

  const createMutation = useMutation({
    mutationFn: (payload) => api.createSupervisionMeeting(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setCreateOpen(false);
      setMutationError('');
    },
    onError: (error) => setMutationError(getErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.updateSupervisionMeeting(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-meetings'] });
      setMutationError('');
    },
    onError: (error) => setMutationError(getErrorMessage(error)),
  });

  const filteredMeetings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return meetings.filter((meeting) => {
      const matchesStatus =
        filter === 'all' ||
        String(meeting.status || 'scheduled').toLowerCase() === filter;

      const matchesSearch =
        !query ||
        [meeting.title, meeting.agenda, meeting.location]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [meetings, filter, search]);

  const counts = useMemo(
    () => ({
      all: meetings.length,
      scheduled: meetings.filter((item) => item.status === 'scheduled').length,
      completed: meetings.filter((item) => item.status === 'completed').length,
      cancelled: meetings.filter((item) => item.status === 'cancelled').length,
    }),
    [meetings],
  );

  const hasFilters = Boolean(search.trim()) || filter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setFilter('all');
  };

  return (
    <div className="space-y-8">
      <InlineAlert message={mutationError} onDismiss={() => setMutationError('')} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="All meetings"
          value={counts.all}
          description="Every supervision session you have created"
          icon={CalendarDays}
          tone="blue"
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <StatCard
          label="Scheduled"
          value={counts.scheduled}
          description="Upcoming sessions waiting to happen"
          icon={CalendarClock}
          tone="violet"
          active={filter === 'scheduled'}
          onClick={() => setFilter('scheduled')}
        />
        <StatCard
          label="Completed"
          value={counts.completed}
          description="Sessions marked as completed"
          icon={CheckCircle2}
          tone="green"
          active={filter === 'completed'}
          onClick={() => setFilter('completed')}
        />
        <StatCard
          label="Cancelled"
          value={counts.cancelled}
          description="Sessions that were called off"
          icon={XCircle}
          tone="red"
          active={filter === 'cancelled'}
          onClick={() => setFilter('cancelled')}
        />
      </section>

      <section className={cn(card, 'p-4 sm:p-5')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <IconTile icon={SlidersHorizontal} tone="neutral" size="small" />
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Find a meeting
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Search and filter your supervision meetings
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

        <div className="mt-4 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search meetings, agenda, location..."
            aria-label="Search meetings"
            className={searchInput}
          />
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
            {filter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs capitalize text-neutral-700 dark:bg-white/[0.07] dark:text-neutral-300">
                <CalendarClock size={12} />
                {filter}
              </span>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="All meetings"
          description={
            meetingsQuery.isLoading
              ? 'Loading meetings...'
              : `${filteredMeetings.length} of ${meetings.length} meetings`
          }
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => meetingsQuery.refetch()}
                disabled={meetingsQuery.isFetching}
                className={secondaryBtn}
              >
                <RefreshCw
                  size={15}
                  className={meetingsQuery.isFetching ? 'animate-spin' : ''}
                />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className={primaryBtn}
              >
                <Plus size={16} />
                Schedule meeting
                <ArrowUpRight size={15} />
              </button>
            </div>
          }
        />

        {meetingsQuery.isLoading ? (
          <LoadingBox text="Loading meetings..." />
        ) : meetingsQuery.isError ? (
          <div className={card}>
            <EmptyState
              icon={AlertCircle}
              title="Could not load meetings"
              description={getErrorMessage(meetingsQuery.error)}
              action={
                <button
                  type="button"
                  onClick={() => meetingsQuery.refetch()}
                  className={primaryBtn}
                >
                  <RefreshCw size={15} />
                  Try again
                </button>
              }
            />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className={card}>
            <EmptyState
              icon={hasFilters ? Search : CalendarDays}
              title={hasFilters ? 'No matching meetings' : 'No meetings scheduled'}
              description={
                hasFilters
                  ? 'Try another search term or clear your filters to see all meetings.'
                  : 'Schedule a supervision meeting and invite students to join.'
              }
              action={
                hasFilters ? (
                  <button type="button" onClick={clearFilters} className={secondaryBtn}>
                    <X size={15} />
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className={primaryBtn}
                  >
                    <Plus size={16} />
                    Schedule first meeting
                    <ArrowUpRight size={15} />
                  </button>
                )
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onOpen={setSelectedMeeting}
                updating={statusMutation.isPending}
                onStatusChange={(item, status) => {
                  setMutationError('');
                  statusMutation.mutate({ id: item.id, status });
                }}
              />
            ))}
          </div>
        )}

        {!meetingsQuery.isLoading &&
          !meetingsQuery.isError &&
          filteredMeetings.length > 0 && (
            <p className="text-xs text-neutral-400">
              Showing {filteredMeetings.length} of {meetings.length} meetings
            </p>
          )}
      </section>

      {createOpen && (
        <MeetingForm
          onClose={() => {
            setCreateOpen(false);
            setMutationError('');
          }}
          loading={createMutation.isPending}
          onSubmit={(payload) => {
            setMutationError('');
            createMutation.mutate(payload);
          }}
        />
      )}

      {selectedMeeting && (
        <MeetingDetails
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      )}
    </div>
  );
}

/* ---------- Messages tab ---------- */

function MessagesTab() {
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [sendError, setSendError] = useState('');

  const conversationsQuery = useQuery({
    queryKey: ['supervision-conversations'],
    queryFn: () => api.listSupervisionConversations(),
    staleTime: 10000,
    refetchInterval: 20000,
    retry: 1,
  });

  const conversations = toArray(conversationsQuery.data, 'conversations');

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const student = conversation.student || conversation;
      const name = student.full_name || student.name || '';
      const email = student.email || '';

      return (
        !query ||
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query)
      );
    });
  }, [conversations, search]);

  const studentsQuery = useQuery({
    queryKey: ['message-student-search', studentSearch],
    queryFn: () => api.searchStudents(studentSearch),
    enabled: studentSearch.trim().length >= 2,
    staleTime: 10000,
    retry: 1,
  });

  const students = toArray(studentsQuery.data, 'students');

  const messagesQuery = useQuery({
    queryKey: ['supervision-messages', selectedStudent?.id],
    queryFn: () => api.listSupervisionMessages(selectedStudent.id),
    enabled: Boolean(selectedStudent?.id),
    refetchInterval: 10000,
    retry: 1,
  });

  const messages = toArray(messagesQuery.data, 'messages');

  const sendMutation = useMutation({
    mutationFn: (message) =>
      api.sendSupervisionMessage({
        recipientId: selectedStudent.id,
        message,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['supervision-messages', selectedStudent?.id],
      });
      queryClient.invalidateQueries({ queryKey: ['supervision-conversations'] });
      setSendError('');
    },
    onError: (error) => setSendError(getErrorMessage(error)),
  });

  function chooseStudent(student) {
    const id = student.id || student.student_id;
    if (!id) return;

    setSelectedStudent({
      ...student,
      id,
      full_name: student.full_name || student.name || 'Student',
    });
    setStudentSearch('');
    setSendError('');
  }

  return (
    <div className={cn(card, 'min-h-[560px] overflow-hidden')}>
      <div className="grid min-h-[560px] grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)]">
        <aside
          className={cn(
            'border-b border-neutral-200 dark:border-white/10 md:border-b-0 md:border-r',
            selectedStudent && 'hidden md:block',
          )}
        >
          <div className="border-b border-neutral-100 p-4 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <IconTile icon={MessageSquare} tone="blue" size="small" />
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Student messages
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Private conversations with students
                </p>
              </div>
            </div>

            <div className="relative mt-4">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                className={searchInput}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
              />
            </div>
          </div>

          <div className="p-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                className={searchInput}
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Start a new conversation"
                aria-label="Find a student to message"
              />
            </div>

            {studentSearch.trim().length >= 2 && (
              <StudentResults
                query={studentsQuery}
                students={students}
                onPick={chooseStudent}
              />
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto px-2 pb-3">
            {conversationsQuery.isLoading ? (
              <p className="flex items-center gap-2 p-4 text-xs text-neutral-500">
                <Loader2 size={14} className="animate-spin" />
                Loading conversations...
              </p>
            ) : conversationsQuery.isError ? (
              <p className="p-4 text-xs text-red-500">
                {getErrorMessage(conversationsQuery.error)}
              </p>
            ) : filteredConversations.length === 0 ? (
              <p className="p-4 text-xs leading-5 text-neutral-500">
                No conversations yet. Search for a student above to start one.
              </p>
            ) : (
              filteredConversations.map((conversation) => {
                const student = conversation.student || conversation;
                const id = student.id || conversation.student_id;

                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => chooseStudent({ ...student, id })}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl p-3 text-left transition',
                      selectedStudent?.id === id
                        ? 'bg-neutral-100 dark:bg-white/[0.07]'
                        : 'hover:bg-neutral-50 dark:hover:bg-white/[0.04]',
                    )}
                  >
                    <Avatar
                      name={student.full_name || student.name}
                      src={student.avatar_url}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                        {student.full_name || student.name || 'Student'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {conversation.last_message || 'Open conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section
          className={cn(
            'flex min-h-[560px] min-w-0 flex-col',
            !selectedStudent && 'hidden md:flex',
          )}
        >
          {selectedStudent ? (
            <>
              <div className="flex items-center gap-3 border-b border-neutral-100 p-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/[0.05] md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={16} />
                </button>
                <Avatar
                  name={selectedStudent.full_name}
                  src={selectedStudent.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                    {selectedStudent.full_name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {selectedStudent.registration_number ||
                      selectedStudent.roll_number ||
                      selectedStudent.email ||
                      'Student'}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50/60 p-4 dark:bg-white/[0.02]">
                {messagesQuery.isLoading ? (
                  <div className="flex h-40 items-center justify-center gap-2 text-xs text-neutral-500">
                    <Loader2 size={15} className="animate-spin" />
                    Loading messages...
                  </div>
                ) : messagesQuery.isError ? (
                  <InlineAlert message={getErrorMessage(messagesQuery.error)} />
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="Start the conversation"
                    description="Send a message to discuss project progress, feedback or supervision."
                  />
                ) : (
                  messages.map((message) => {
                    const isMine =
                      message.sender_role === 'faculty' || message.is_mine === true;

                    return (
                      <div
                        key={message.id}
                        className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[75%]',
                            isMine
                              ? 'rounded-br-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                              : 'rounded-bl-md border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900',
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-5">
                            {message.message}
                          </p>
                          <p
                            className={cn(
                              'mt-1.5 text-[10px]',
                              isMine
                                ? 'text-neutral-300 dark:text-neutral-500'
                                : 'text-neutral-400',
                            )}
                          >
                            {message.created_at
                              ? new Date(message.created_at).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })
                              : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {sendError && (
                <p className="border-t border-red-200 px-4 py-2 text-xs text-red-600 dark:border-red-400/20 dark:text-red-300">
                  {sendError}
                </p>
              )}

              <MessageComposer
                loading={sendMutation.isPending}
                onSend={(message, clear) => {
                  setSendError('');
                  sendMutation.mutate(message, { onSuccess: clear });
                }}
              />
            </>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="Your messages"
              description="Select a student conversation or search for a student to start messaging."
            />
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- Notes tab ---------- */

function NotesTab() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const notesQuery = useQuery({
    queryKey: ['supervision-notes'],
    queryFn: () => api.listSupervisionNotes(),
    staleTime: 15000,
    retry: 1,
  });

  const notes = toArray(notesQuery.data, 'notes');

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notes.filter((note) => {
      const student = note.student || note.profile || {};
      const studentName = student.full_name || note.student_name || '';

      return (
        !query ||
        studentName.toLowerCase().includes(query) ||
        String(note.summary || '').toLowerCase().includes(query) ||
        String(note.next_steps || note.nextSteps || '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [notes, search]);

  const createMutation = useMutation({
    mutationFn: (payload) => api.createSupervisionNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-notes'] });
      setCreateOpen(false);
      setErrorMessage('');
    },
    onError: (error) => setErrorMessage(getErrorMessage(error)),
  });

  const followUps = notes.filter((note) => note.follow_up_date).length;

  return (
    <div className="space-y-8">
      <InlineAlert message={errorMessage} onDismiss={() => setErrorMessage('')} />

      <section className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Total notes"
          value={notes.length}
          description="Supervision notes you have recorded"
          icon={ClipboardList}
          tone="violet"
          onClick={() => setSearch('')}
        />
        <StatCard
          label="Follow-ups planned"
          value={followUps}
          description="Notes with a follow-up date"
          icon={CalendarClock}
          tone="orange"
        />
      </section>

      <section className={cn(card, 'p-4 sm:p-5')}>
        <div className="flex items-center gap-2.5">
          <IconTile icon={SlidersHorizontal} tone="neutral" size="small" />
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Find a note
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Search by student or note content
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            className={searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student or note content"
            aria-label="Search supervision notes"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="All notes"
          description={
            notesQuery.isLoading
              ? 'Loading supervision notes...'
              : `${filteredNotes.length} of ${notes.length} notes`
          }
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={primaryBtn}
            >
              <Plus size={16} />
              Add note
              <ArrowUpRight size={15} />
            </button>
          }
        />

        {notesQuery.isLoading ? (
          <LoadingBox text="Loading supervision notes..." />
        ) : notesQuery.isError ? (
          <div className={card}>
            <EmptyState
              icon={AlertCircle}
              title="Could not load supervision notes"
              description={getErrorMessage(notesQuery.error)}
              action={
                <button
                  type="button"
                  onClick={() => notesQuery.refetch()}
                  className={primaryBtn}
                >
                  <RefreshCw size={15} />
                  Try again
                </button>
              }
            />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className={card}>
            <EmptyState
              icon={search ? Search : ClipboardList}
              title={search ? 'No matching notes' : 'No supervision notes yet'}
              description={
                search
                  ? 'Try another search term to see more notes.'
                  : 'Record a supervision session and keep the agreed next steps in one place.'
              }
              action={
                search ? (
                  <button type="button" onClick={() => setSearch('')} className={secondaryBtn}>
                    <X size={15} />
                    Clear search
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className={primaryBtn}
                  >
                    <Plus size={16} />
                    Add first note
                    <ArrowUpRight size={15} />
                  </button>
                )
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredNotes.map((note) => {
              const student = note.student || note.profile || {};
              const name = student.full_name || note.student_name || 'Student';
              const nextSteps = note.next_steps || note.nextSteps;

              return (
                <article
                  key={note.id}
                  className={cn(
                    card,
                    'flex min-w-0 flex-col p-5 transition duration-200 hover:border-neutral-300 dark:hover:border-white/20',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={name} src={student.avatar_url} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
                        {name}
                      </h3>
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        Created {formatDate(note.created_at)}
                      </p>
                    </div>
                    {note.follow_up_date && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
                        <CalendarClock size={13} />
                        {formatDate(note.follow_up_date)}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 space-y-4 border-t border-neutral-100 pt-4 dark:border-white/[0.07]">
                    <div className="flex min-w-0 items-start gap-2.5 text-sm">
                      <FileText size={15} className="mt-0.5 shrink-0 text-neutral-400" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                          Discussion summary
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap break-words leading-6 text-neutral-700 dark:text-neutral-300">
                          {note.summary}
                        </p>
                      </div>
                    </div>

                    {nextSteps && (
                      <div className="flex min-w-0 items-start gap-2.5 text-sm">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                            Next steps
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap break-words leading-6 text-neutral-700 dark:text-neutral-300">
                            {nextSteps}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!notesQuery.isLoading && !notesQuery.isError && filteredNotes.length > 0 && (
          <p className="text-xs text-neutral-400">
            Showing {filteredNotes.length} of {notes.length} supervision notes
          </p>
        )}
      </section>

      {createOpen && (
        <NoteForm
          onClose={() => {
            setCreateOpen(false);
            setErrorMessage('');
          }}
          loading={createMutation.isPending}
          onSubmit={(payload) => {
            setErrorMessage('');
            createMutation.mutate(payload);
          }}
        />
      )}
    </div>
  );
}



/* ---------- Page ---------- */

export default function MeetingsPage() {
  const [activeTab, setActiveTab] = useState('meetings');
  const active = TABS.find((tab) => tab.id === activeTab);

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
            Meetings & supervision
          </span>
        </nav>

        <div className="max-w-3xl">
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <Layers3 size={14} />
            ACADEMIC PROJECT MANAGEMENT
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
            Meetings & supervision
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400 sm:text-base">
            Coordinate with students, organise supervision meetings and keep
            project follow-ups documented from one place.
          </p>
        </div>
      </section>

      <div
        role="tablist"
        aria-label="Meetings sections"
        className={cn(card, 'flex gap-1 overflow-x-auto p-1.5')}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition sm:flex-1',
              activeTab === id
                ? 'bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900'
                : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-white/[0.05]',
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div key={activeTab} role="tabpanel" aria-label={active?.label}>
        {activeTab === 'meetings' && <MeetingsTab />}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'notes' && <NotesTab />}
      </div>

      <footer className="flex flex-col gap-2 border-t border-neutral-200 pt-4 text-xs text-neutral-400 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <span>ResearchFlow · Faculty workspace</span>
        <span>Academic project management</span>
      </footer>
    </div>
  );
}