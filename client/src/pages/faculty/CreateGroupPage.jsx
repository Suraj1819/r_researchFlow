import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  GraduationCap,
  Hash,
  Info,
  Layers,
  Loader2,
  RefreshCw,
  RotateCcw,
  Users,
  UserRound,
} from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

/* -------------------------------------------------------
   Design system
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
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
};

const ICON = {
  sky: 'text-sky-600 dark:text-sky-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  amber: 'text-amber-600 dark:text-amber-300',
  violet: 'text-violet-600 dark:text-violet-300',
  orange: 'text-orange-600 dark:text-orange-300',
  neutral: 'text-neutral-500 dark:text-neutral-400',
};

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]';

const input =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white/40 dark:focus:ring-white/10';

const labelCls =
  'mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300';

const hint = 'mt-1.5 text-xs leading-5 text-neutral-500 dark:text-neutral-400';

function SectionHeading({ icon: Icon, title, description, number, tone = 'violet' }) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn(iconBox, 'h-10 w-10', TONES[tone])}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            {title}
          </h2>
          {number && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400">
              STEP {number}
            </span>
          )}
        </div>
        {description && (
          <p className={cn('mt-1 text-sm leading-6', muted)}>{description}</p>
        )}
      </div>
    </div>
  );
}

function Field({
  label: fieldLabel,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  hintText,
  min,
  max,
  step,
  icon: Icon,
  tone = 'neutral',
}) {
  return (
    <div className="min-w-0">
      <label className={labelCls} htmlFor={name}>
        <span className="inline-flex items-center gap-1.5">
          {Icon ? <Icon size={14} className={ICON[tone]} /> : null}
          {fieldLabel}
        </span>
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className={input}
      />
      {hintText && <p className={hint}>{hintText}</p>}
    </div>
  );
}

function TextAreaField({
  label: fieldLabel,
  name,
  value,
  onChange,
  placeholder,
  hintText,
  rows = 4,
  icon: Icon,
  tone = 'neutral',
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={name}>
        <span className="inline-flex items-center gap-1.5">
          {Icon ? <Icon size={14} className={ICON[tone]} /> : null}
          {fieldLabel}
        </span>
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={cn(input, 'min-h-24 resize-y leading-6')}
      />
      {hintText && <p className={hint}>{hintText}</p>}
    </div>
  );
}

function SummaryItem({ icon: Icon, label: itemLabel, value, tone = 'neutral' }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className={cn(iconBox, 'h-9 w-9', TONES[tone])}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className={cn('text-xs', muted)}>{itemLabel}</p>
        <p className="mt-1 break-words text-sm font-medium text-neutral-900 dark:text-white">
          {value || 'Not specified'}
        </p>
      </div>
    </div>
  );
}

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const emptyForm = {
    title: '',
    description: '',
    academic_year: '',
    session_year: '',
    semester: '',
    branch: '',
    coordinator_name: '',
    starts_at: '',
    submission_deadline: '',
  };

  const [form, setForm] = useState({
    title: '',
    description: '',
    academic_year: '',
    session_year: '',
    semester: '',
    branch: '',
    coordinator_name: '',
    starts_at: '',
    submission_deadline: '',
  });

  const set = (key) => (event) => {
    setForm((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));
  };

  const filledCount = [
    form.title,
    form.academic_year,
    form.session_year,
    form.semester,
    form.branch,
    form.coordinator_name,
    form.starts_at,
    form.submission_deadline,
    form.description,
  ].filter((v) => String(v || '').trim()).length;

  const resetForm = () => {
    setForm({ ...emptyForm });
  };

  const handleRefresh = async () => {
    if (refreshing || saving) return;
    setRefreshing(true);
    try {
      // Soft page refresh: clear form if empty-ish, always scroll top
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setRefreshing(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error('Please enter a group title');
      return;
    }

    if (!form.academic_year.trim()) {
      toast.error('Please enter the academic year');
      return;
    }

    if (
      form.starts_at &&
      form.submission_deadline &&
      new Date(form.submission_deadline) < new Date(form.starts_at)
    ) {
      toast.error('Submission deadline cannot be before the start date');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      academic_year: form.academic_year.trim(),
      session_year: form.session_year.trim() || null,
      semester: form.semester.trim() || null,
      branch: form.branch.trim() || null,
      coordinator_name: form.coordinator_name.trim() || null,
      starts_at: form.starts_at
        ? new Date(form.starts_at).toISOString()
        : null,
      submission_deadline: form.submission_deadline
        ? new Date(form.submission_deadline).toISOString()
        : null,
    };

    setSaving(true);

    try {
      const response = await api.createGroup(payload);

      if (!response?.group?.id) {
        throw new Error('Group was created, but its ID was not returned');
      }

      toast.success('Group created successfully. Matching students notified.');
      navigate(`/faculty/groups/${response.group.id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Top breadcrumb — same size/style as FacultyDashboard */}
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
          <span className="text-neutral-900 dark:text-white">Create</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetForm}
            disabled={saving || refreshing}
            className={cn(secondaryButton, 'min-h-11 gap-2 px-4 text-sm')}
          >
            <RotateCcw size={16} />
            Clear form
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={saving || refreshing}
            className={cn(secondaryButton, 'min-h-11 gap-2 px-4 text-sm font-semibold')}
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Create submission group
          </h1>
          <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
            Configure the academic batch, submission timeline and instructions
            for students submitting their projects.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300">
            <span className={cn(iconBox, 'h-6 w-6 rounded-lg', TONES.emerald)}>
              <Users size={13} />
            </span>
            Student group
          </div>
          <p className={cn('text-xs', muted)}>
            {filledCount}/9 fields filled
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-300"
          style={{ width: `${Math.round((filledCount / 9) * 100)}%` }}
        />
      </div>

      {/* Guidance banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-500/20 dark:bg-sky-500/[0.06]">
        <span className={cn(iconBox, 'mt-0.5 h-8 w-8', TONES.sky)}>
          <Info size={15} />
        </span>
        <div>
          <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">
            Before creating the group
          </p>
          <p className="mt-1 text-sm leading-6 text-sky-800 dark:text-sky-200/80">
            Enter the correct academic year and session so eligible students
            can identify the appropriate submission group. Check the deadline
            before notifying students.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Section 1 */}
        <section className={cn(card, 'space-y-5 p-5 sm:p-6')}>
          <SectionHeading
            icon={ClipboardList}
            title="Group information"
            description="Set the title and explain what students need to submit."
            number="01"
            tone="violet"
          />

          <div className="border-t border-neutral-100 dark:border-white/[0.06]" />

          <Field
            label="Group title"
            name="title"
            value={form.title}
            onChange={set('title')}
            placeholder="e.g. Final Year Major Project Submission"
            required
            hintText="Choose a clear title that students can recognize easily."
            icon={Hash}
            tone="violet"
          />

          <TextAreaField
            label="Description and instructions"
            name="description"
            value={form.description}
            onChange={set('description')}
            placeholder="Explain submission requirements, required documents, naming conventions and other instructions..."
            hintText="Mention the expected deliverables, report format and any important submission rules."
            rows={5}
            icon={FileText}
            tone="sky"
          />
        </section>

        {/* Section 2 */}
        <section className={cn(card, 'space-y-5 p-5 sm:p-6')}>
          <SectionHeading
            icon={GraduationCap}
            title="Academic details"
            description="Define the batch, session, semester and branch for this group."
            number="02"
            tone="emerald"
          />

          <div className="border-t border-neutral-100 dark:border-white/[0.06]" />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Academic year"
              name="academic_year"
              value={form.academic_year}
              onChange={set('academic_year')}
              placeholder="e.g. 2024-28"
              required
              hintText="Example: the students' B.Tech batch."
              icon={GraduationCap}
              tone="emerald"
            />

            <Field
              label="Session year"
              name="session_year"
              value={form.session_year}
              onChange={set('session_year')}
              placeholder="e.g. 2026-27"
              hintText="The academic session in which submissions are due."
              icon={CalendarDays}
              tone="amber"
            />

            <div>
              <label className={labelCls} htmlFor="semester">
                <span className="inline-flex items-center gap-1.5">
                  <Layers size={14} className={ICON.sky} />
                  Semester
                </span>
              </label>
              <select
                id="semester"
                name="semester"
                value={form.semester}
                onChange={set('semester')}
                className={input}
              >
                <option value="">Select semester</option>
                {Array.from({ length: 8 }, (_, index) => (
                  <option key={index + 1} value={String(index + 1)}>
                    Semester {index + 1}
                  </option>
                ))}
              </select>
              <p className={hint}>Select the semester relevant to this submission.</p>
            </div>

            <div>
              <label className={labelCls} htmlFor="branch">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={14} className={ICON.violet} />
                  Branch / Department
                </span>
              </label>
              <select
                id="branch"
                name="branch"
                value={form.branch}
                onChange={set('branch')}
                className={input}
              >
                <option value="">Select branch</option>
                <option value="CSE">Computer Science Engineering (CSE)</option>
                <option value="CSE (IoT)">CSE (IoT)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics and Communication (ECE)</option>
                <option value="EE">Electrical Engineering (EE)</option>
                <option value="ME">Mechanical Engineering (ME)</option>
                <option value="CE">Civil Engineering (CE)</option>
                <option value="Other">Other</option>
              </select>
              <p className={hint}>
                Leave blank if the group is for multiple branches.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className={cn(card, 'space-y-5 p-5 sm:p-6')}>
          <SectionHeading
            icon={UserRound}
            title="Coordinator details"
            description="Add the faculty member or coordinator responsible for this group."
            number="03"
            tone="sky"
          />

          <div className="border-t border-neutral-100 dark:border-white/[0.06]" />

          <Field
            label="Coordinator name"
            name="coordinator_name"
            value={form.coordinator_name}
            onChange={set('coordinator_name')}
            placeholder="e.g. Prof. Amit Kumar"
            hintText="Optional. Name students should contact for submission queries."
            icon={UserRound}
            tone="sky"
          />
        </section>

        {/* Section 4 */}
        <section className={cn(card, 'space-y-5 p-5 sm:p-6')}>
          <SectionHeading
            icon={CalendarDays}
            title="Submission schedule"
            description="Set when submissions begin and the final submission deadline."
            number="04"
            tone="amber"
          />

          <div className="border-t border-neutral-100 dark:border-white/[0.06]" />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Start date and time"
              name="starts_at"
              type="datetime-local"
              value={form.starts_at}
              onChange={set('starts_at')}
              hintText="Optional. When the submission period begins."
              icon={Clock3}
              tone="sky"
            />

            <Field
              label="Submission deadline"
              name="submission_deadline"
              type="datetime-local"
              value={form.submission_deadline}
              onChange={set('submission_deadline')}
              min={form.starts_at || undefined}
              hintText="Optional. The final date and time for submitting a project."
              icon={CalendarDays}
              tone="amber"
            />
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.06]">
            <span className={cn(iconBox, 'mt-0.5 h-8 w-8', TONES.amber)}>
              <Clock3 size={15} />
            </span>
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Review the schedule before publishing
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200/80">
                The deadline is included in the group configuration. Whether
                late submissions are blocked depends on server-side rules.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Summary */}
        <section className={cn(card, 'space-y-4 p-5 sm:p-6')}>
          <SectionHeading
            icon={FileText}
            title="Group summary"
            description="Check the main details before creating the group."
            number="05"
            tone="emerald"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryItem
              icon={ClipboardList}
              label="Group title"
              value={form.title.trim()}
              tone="violet"
            />
            <SummaryItem
              icon={GraduationCap}
              label="Academic year"
              value={form.academic_year.trim()}
              tone="emerald"
            />
            <SummaryItem
              icon={CalendarDays}
              label="Session"
              value={form.session_year.trim()}
              tone="amber"
            />
            <SummaryItem
              icon={Layers}
              label="Semester / Branch"
              value={
                [form.semester ? `Semester ${form.semester}` : '', form.branch]
                  .filter(Boolean)
                  .join(' · ') || ''
              }
              tone="sky"
            />
            <SummaryItem
              icon={UserRound}
              label="Coordinator"
              value={form.coordinator_name.trim()}
              tone="sky"
            />
            <SummaryItem
              icon={Clock3}
              label="Deadline"
              value={
                form.submission_deadline
                  ? new Date(form.submission_deadline).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : ''
              }
              tone="orange"
            />
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]">
            <div className="flex items-start gap-3">
              <span className={cn(iconBox, 'mt-0.5 h-8 w-8', TONES.emerald)}>
                <CheckCircle2 size={15} />
              </span>
              <div>
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                  Student notifications
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-800 dark:text-emerald-200/80">
                  Matching students will be notified when the group is created.
                  Eligibility depends on academic year, session and branch.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky actions */}
        <div className="sticky bottom-3 z-10 rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-neutral-950/95 sm:p-4">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Link to="/faculty/groups" className={secondaryButton}>
                <ArrowLeft size={15} />
                Cancel
              </Link>
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className={secondaryButton}
              >
                <RotateCcw size={15} />
                Clear
              </button>
            </div>

            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating group...
                </>
              ) : (
                <>
                  Create group
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}