
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  FileText,
  FolderKanban,
  FolderOpen,
  GraduationCap,
  History,
  Inbox,
  Layers,
  ListChecks,
  Lock,
  MapPin,
  MessageSquare,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Target,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Workflow,
  X,
} from 'lucide-react';

import PublicHeader from '../../components/layout/PublicHeader';
import PublicFooter from '../../components/layout/PublicFooter';
import { cn } from '../../lib/utils';

/* ------------------------------------------------------------------ */
/* Design tokens (same as Groups / Meetings pages)                    */
/* ------------------------------------------------------------------ */

const card =
  'rounded-2xl border border-neutral-200/90 bg-white dark:border-white/10 dark:bg-neutral-950';

const primaryBtn =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:ring-offset-neutral-950';

const secondaryBtn =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-white/[0.05]';

const TONES = {
  blue: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
};

const TONE_TEXT = {
  blue: 'text-sky-600 dark:text-sky-400',
  violet: 'text-violet-600 dark:text-violet-400',
  green: 'text-emerald-600 dark:text-emerald-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
  neutral: 'text-neutral-500 dark:text-neutral-400',
};

function IconTile({ icon: Icon, tone = 'blue', size = 'normal' }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        size === 'small' ? 'h-9 w-9' : 'h-11 w-11',
        TONES[tone] || TONES.blue,
      )}
    >
      <Icon size={size === 'small' ? 17 : 20} strokeWidth={1.8} />
    </span>
  );
}

function SectionHeading({ title, description, align = 'left' }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-sm leading-6 text-neutral-600 dark:text-neutral-400 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function Section({ id, children, muted = false }) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 border-b border-neutral-200 py-20 dark:border-white/10 sm:py-24',
        muted && 'bg-neutral-50 dark:bg-white/[0.02]',
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Content                                                            */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: FolderKanban,
    tone: 'blue',
    title: 'Project management',
    description:
      'Create projects, organise milestones and assign tasks from one structured dashboard.',
  },
  {
    icon: Users,
    tone: 'violet',
    title: 'Team collaboration',
    description:
      'Coordinate responsibilities with teammates in a shared workspace with role-aware access.',
  },
  {
    icon: FileText,
    tone: 'orange',
    title: 'Documentation and files',
    description:
      'Keep proposals, reports and supporting documents together, with every version preserved.',
  },
  {
    icon: ClipboardCheck,
    tone: 'green',
    title: 'Faculty review',
    description:
      'Submit work for review, receive structured feedback and follow revisions through to approval.',
  },
];

const fileTypes = ['PDF', 'DOCX', 'PPT', 'PPTX', 'XLSX', 'ZIP', 'PNG', 'JPG'];

const roleTabs = [
  {
    id: 'student',
    tone: 'blue',
    label: 'Students',
    icon: GraduationCap,
    headline: 'Know exactly what to do this week.',
    description:
      'Your dashboard shows upcoming milestones, tasks assigned to you and the status of every submission, so nothing slips past a deadline.',
    points: [
      'Personal task list across all your projects',
      'Milestone deadlines at a glance',
      'Upload and replace documents without losing history',
      'Supervisor feedback shown next to the submission it belongs to',
    ],
    panel: [
      {
        icon: ListChecks,
        tone: 'blue',
        title: 'My tasks',
        subtitle: 'Open tasks and what is due soon',
      },
      {
        icon: CalendarDays,
        tone: 'violet',
        title: 'Next milestone',
        subtitle: 'Deadline and progress',
      },
      {
        icon: MessageSquare,
        tone: 'green',
        title: 'New feedback',
        subtitle: 'Comments from your supervisor',
      },
    ],
  },
  {
    id: 'lead',
    tone: 'violet',
    label: 'Team leads',
    icon: Users,
    headline: 'Keep the whole team moving together.',
    description:
      'Invite teammates, split the work and watch progress roll up into one project view, instead of chasing updates in chat.',
    points: [
      'Invite members and set role-aware access',
      'Assign tasks and see who is blocked',
      'Project-level progress across every milestone',
      'Decide when the project is ready to submit',
    ],
    panel: [
      {
        icon: UserCheck,
        tone: 'violet',
        title: 'Team members',
        subtitle: 'Who is active, who is invited',
      },
      {
        icon: BarChart3,
        tone: 'blue',
        title: 'Project progress',
        subtitle: 'Milestones completed so far',
      },
      {
        icon: Upload,
        tone: 'orange',
        title: 'Ready to submit',
        subtitle: 'Final files awaiting approval',
      },
    ],
  },
  {
    id: 'faculty',
    tone: 'green',
    label: 'Faculty',
    icon: ClipboardCheck,
    headline: 'Review work without the email thread.',
    description:
      'Every submission arrives with its files, history and team context. Approve, request changes or reject with a reason, all recorded against the submission.',
    points: [
      'One review queue for every project you supervise',
      'Structured decisions: approve, request changes, reject',
      'Feedback tied to a specific version of the work',
      'Full revision history for evaluation',
    ],
    panel: [
      {
        icon: Search,
        tone: 'green',
        title: 'Review queue',
        subtitle: 'Submissions waiting for you',
      },
      {
        icon: Eye,
        tone: 'violet',
        title: 'Submission details',
        subtitle: 'Files, team and version history',
      },
      {
        icon: History,
        tone: 'orange',
        title: 'Revision history',
        subtitle: 'Earlier rounds of feedback',
      },
    ],
  },
];

const steps = [
  {
    icon: BookOpen,
    tone: 'blue',
    title: 'Create a project',
    description: 'Define your topic, objectives and scope in one workspace.',
  },
  {
    icon: Users,
    tone: 'violet',
    title: 'Build your team',
    description:
      'Invite collaborators and a faculty supervisor, then assign responsibilities.',
  },
  {
    icon: Workflow,
    tone: 'orange',
    title: 'Plan milestones',
    description:
      'Break the project into milestones and tasks with owners and deadlines.',
  },
  {
    icon: FileText,
    tone: 'green',
    title: 'Work and document',
    description:
      'Upload drafts, reports and resources into one library as the project grows.',
  },
  {
    icon: ClipboardCheck,
    tone: 'blue',
    title: 'Submit for review',
    description: 'Share your work with faculty and follow the review process.',
  },
  {
    icon: Award,
    tone: 'violet',
    title: 'Revise and get approved',
    description:
      'Address feedback, resubmit and finish with a complete project record.',
  },
];

const reviewStages = [
  {
    title: 'Draft',
    tone: 'neutral',
    description: 'The team prepares files and finishes milestone work.',
  },
  {
    title: 'Submitted',
    tone: 'blue',
    description: 'The lead submits and the supervisor is notified.',
  },
  {
    title: 'Under review',
    tone: 'violet',
    description: 'The supervisor reads the work and prepares feedback.',
  },
  {
    title: 'Changes requested',
    tone: 'orange',
    description:
      'Feedback is attached to the submission and the team revises.',
  },
  {
    title: 'Approved',
    tone: 'green',
    description: 'The decision is recorded and the project is complete.',
  },
];

const capabilities = [
  {
    icon: Bell,
    tone: 'orange',
    title: 'Deadline visibility',
    description:
      'Upcoming milestones and submission deadlines stay visible on your dashboard.',
  },
  {
    icon: History,
    tone: 'violet',
    title: 'Version history',
    description:
      'Every upload is kept, so you can compare drafts and return to an earlier version.',
  },
  {
    icon: MessageSquare,
    tone: 'blue',
    title: 'Comments and feedback',
    description:
      'Discussion stays attached to the file, task or submission it is about.',
  },
  {
    icon: BarChart3,
    tone: 'green',
    title: 'Progress overview',
    description:
      'See completed milestones, open tasks and overall progress at a glance.',
  },
  {
    icon: Search,
    tone: 'orange',
    title: 'Search',
    description:
      'Find a document, task or comment across projects without digging through folders.',
  },
  {
    icon: Download,
    tone: 'red',
    title: 'Evaluation-ready records',
    description:
      'Keep reports and submission records organised for grading and review.',
  },
];

const useCases = [
  {
    icon: Target,
    tone: 'blue',
    title: 'Final-year major projects',
    description:
      'Manage supervisor approvals, progress reports and final submissions in one place.',
    points: ['Milestone tracking', 'Supervisor feedback', 'Final submission'],
  },
  {
    icon: Layers,
    tone: 'violet',
    title: 'Research collaborations',
    description:
      'Coordinate multi-author work with shared documents, version history and a clear review flow.',
    points: ['Shared document library', 'Version history', 'Review workflow'],
  },
  {
    icon: ListChecks,
    tone: 'green',
    title: 'Course assignments',
    description:
      'Divide tasks, attach files and submit team assignments with clear deadlines.',
    points: ['Task division', 'Deadline visibility', 'Evaluation-ready records'],
  },
];

const comparison = {
  without: [
    'Scattered documents and chat threads',
    'No shared view of milestones and deadlines',
    'Feedback collected manually over email',
    'Lost versions of proposals and reports',
    'Hard to bring new teammates up to speed',
  ],
  with: [
    'One workspace for proposals, files and tasks',
    'Shared milestones with progress visibility',
    'Structured faculty feedback tied to submissions',
    'Versioned documents in a single library',
    'Role-aware invites so teammates can join quickly',
  ],
};

const security = [
  {
    icon: Lock,
    tone: 'blue',
    title: 'Authenticated access',
    description: 'Account-level authentication protects the platform.',
  },
  {
    icon: ShieldCheck,
    tone: 'violet',
    title: 'Role-aware permissions',
    description:
      'Team leads, members and supervisors see only what their role allows.',
  },
  {
    icon: Users,
    tone: 'orange',
    title: 'Invite-only workspaces',
    description:
      'Only invited teammates and the assigned supervisor can open a project.',
  },
  {
    icon: RefreshCw,
    tone: 'green',
    title: 'You stay in control',
    description:
      'Leave a workspace at any time. Decisions and history stay traceable.',
  },
];

const faqs = [
  {
    q: 'Who is ResearchFlow built for?',
    a: 'It is built for students, research teams and faculty members in academic institutions. Students and teams get a structured workspace; faculty get a focused review pipeline with feedback, revision tracking and approvals.',
  },
  {
    q: 'Can I invite teammates and supervisors to a project?',
    a: 'Yes. Each project has a shared workspace where you can invite teammates with role-aware access and add a faculty supervisor who can review your submissions and leave structured feedback.',
  },
  {
    q: 'What file types can I upload?',
    a: 'You can upload project documents, proposals, reports and presentations in common formats including PDF, DOCX, PPT and PPTX. Each file is organised inside the project workspace and tied to the relevant milestone or submission.',
  },
  {
    q: 'How does the faculty review process work?',
    a: 'When you submit a project, your supervisor receives a review request. They can approve, request changes with feedback, or reject with a reason. All decisions are tracked against the submission, so revisions are never lost.',
  },
  {
    q: 'What happens after a supervisor requests changes?',
    a: 'The feedback is attached to that submission. Your team updates the files and resubmits. The supervisor sees the new version alongside earlier rounds, so the full revision history stays in one place.',
  },
  {
    q: 'Can I use ResearchFlow for a single course assignment?',
    a: 'Yes. A project can be as small as one team assignment or as large as a multi-month research collaboration. Create a project, add your teammates, split the tasks and submit when you are ready.',
  },
  {
    q: 'What are submission groups?',
    a: 'A submission group is a container faculty create for a cohort. It holds the academic year, branch, semester, coordinator and submission deadline, and can stay a draft until it is published to students.',
  },
  {
    q: 'How do supervision meetings work?',
    a: 'Faculty schedule a meeting with a date, time and format (online with a link, or in person with a location) and invite students. Students respond to the invitation, and faculty can mark the meeting completed or cancelled and add a supervision note afterwards.',
  },
  {
    q: 'Can faculty and students message each other?',
    a: 'Yes. Faculty can start a private conversation with a student about project progress, feedback or supervision, and continue it from the Messages tab.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'Access is role-aware. Only invited teammates and the assigned supervisor can view or interact with a project workspace, and you can leave a workspace at any time.',
  },
];

const trustItems = [
  { icon: FolderOpen, tone: 'violet', label: 'Submission groups' },
  { icon: CalendarDays, tone: 'orange', label: 'Supervision meetings' },
  { icon: MessageSquare, tone: 'green', label: 'Student messaging' },
  { icon: ClipboardCheck, tone: 'blue', label: 'Structured faculty review' },
];

const modules = [
  {
    icon: FolderKanban,
    tone: 'blue',
    title: 'Projects and milestones',
    description: 'Plan work, set milestones and keep every task assigned to an owner.',
  },
  {
    icon: FolderOpen,
    tone: 'violet',
    title: 'Submission groups',
    description:
      'Organise projects by academic year, branch and semester, each with its own deadline.',
  },
  {
    icon: CalendarDays,
    tone: 'orange',
    title: 'Supervision meetings',
    description:
      'Schedule online or in-person meetings and invite students in one step.',
  },
  {
    icon: MessageSquare,
    tone: 'green',
    title: 'Private messaging',
    description:
      'Talk to students directly about progress, feedback and next steps.',
  },
  {
    icon: FileText,
    tone: 'violet',
    title: 'Supervision notes',
    description:
      'Record what was discussed, the agreed next steps and a follow-up date.',
  },
  {
    icon: ClipboardCheck,
    tone: 'green',
    title: 'Faculty review',
    description:
      'Approve, request changes or reject, with feedback tied to the submission.',
  },
  {
    icon: History,
    tone: 'blue',
    title: 'Document library',
    description:
      'Keep every file and every version together, linked to its milestone.',
  },
  {
    icon: Bell,
    tone: 'orange',
    title: 'Notifications',
    description:
      'Students are notified about meeting invitations and submission updates.',
  },
];

const groupPoints = [
  'Group projects by academic year, branch and semester',
  'Assign a coordinator and set the submission deadline',
  'Keep a group as a draft until it is ready, then publish it to students',
  'Search and filter groups as your department grows',
];

const meetingPoints = [
  'Schedule online meetings with a link, or in-person with a location',
  'Invite one or many students and see who has accepted, declined or not yet replied',
  'Mark sessions completed or cancelled as they happen',
  'Record a supervision note with next steps and a follow-up date',
];

const matrix = [
  { feature: 'Personal task list and deadlines', student: true, lead: true, faculty: false },
  { feature: 'Invite teammates and a supervisor', student: false, lead: true, faculty: false },
  { feature: 'Upload and version documents', student: true, lead: true, faculty: false },
  { feature: 'Submit a project for review', student: false, lead: true, faculty: false },
  { feature: 'Respond to meeting invitations', student: true, lead: true, faculty: false },
  { feature: 'Private messaging', student: true, lead: true, faculty: true },
  { feature: 'Create and publish submission groups', student: false, lead: false, faculty: true },
  { feature: 'Schedule meetings and invite students', student: false, lead: false, faculty: true },
  { feature: 'Review and decide on submissions', student: false, lead: false, faculty: true },
  { feature: 'Write supervision notes and follow-ups', student: false, lead: false, faculty: true },
];

const gettingStarted = [
  {
    icon: GraduationCap,
    tone: 'blue',
    role: 'Students',
    steps: [
      'Create your account',
      'Join your team or open a project',
      'Track milestones and respond to meeting invitations',
    ],
  },
  {
    icon: UserPlus,
    tone: 'violet',
    role: 'Team leads',
    steps: [
      'Create the project and its milestones',
      'Invite teammates and your supervisor',
      'Submit for review when the work is ready',
    ],
  },
  {
    icon: ClipboardCheck,
    tone: 'green',
    role: 'Faculty',
    steps: [
      'Create a submission group for your cohort',
      'Schedule meetings and message students',
      'Review submissions and record supervision notes',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Components                                                         */
/* ------------------------------------------------------------------ */

function PreviewRow({ icon, title, subtitle, tone = 'blue' }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-neutral-950">
      <IconTile icon={icon} tone={tone} size="small" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
          {title}
        </p>
        <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </p>
      </div>
      <ArrowUpRight size={15} className="shrink-0 text-neutral-400" />
    </div>
  );
}

function FaqItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-200 py-5 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="text-sm font-semibold text-neutral-900 dark:text-white sm:text-base">
          {q}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300">
          {open ? <Minus size={15} /> : <Plus size={15} />}
        </span>
      </button>
      <div
        className={cn(
          'grid transition-all duration-300',
          open ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleShowcase() {
  const [activeId, setActiveId] = useState(roleTabs[0].id);
  const active = roleTabs.find((tab) => tab.id === activeId);

  return (
    <div className="mt-12">
      <div
        role="tablist"
        aria-label="Choose a role"
        className={cn(card, 'inline-flex max-w-full gap-1 overflow-x-auto p-1.5')}
      >
        {roleTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === activeId}
            onClick={() => setActiveId(id)}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition',
              id === activeId
                ? 'bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900'
                : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-white/[0.05]',
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        className={cn(card, 'mt-5 grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:gap-12')}
      >
        <div className="min-w-0">
          <IconTile icon={active.icon} tone={active.tone} />
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            {active.headline}
          </h3>
          <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            {active.description}
          </p>
          <ul className="mt-6 space-y-3">
            {active.points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 text-sm leading-6 text-neutral-700 dark:text-neutral-300"
              >
                <CheckCircle2
                  size={16}
                  className={cn('mt-1 shrink-0', TONE_TEXT[active.tone])}
                />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
          <p className="mb-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            What you see on your dashboard
          </p>
          <div className="space-y-2.5">
            {active.panel.map((row) => (
              <PreviewRow key={row.title} {...row} />
            ))}
          </div>
          <p className="mt-4 text-[11px] text-neutral-400">
            Illustrative preview. Not live project data.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 dark:bg-neutral-950 dark:text-white">
      <PublicHeader />

      <main>
        {/* ============== Hero ============== */}
        <section className="relative overflow-hidden border-b border-neutral-200 dark:border-white/10">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Academic project management
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl sm:leading-[1.1] dark:text-white">
                Plan, collaborate and review academic projects in one place.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-400 sm:text-lg sm:leading-8">
                ResearchFlow connects milestones, team work, documentation and
                faculty review — so students, leads and supervisors stay aligned
                from first draft to final approval.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/auth?tab=student-register" className={primaryBtn}>
                  Get started
                  <ArrowRight size={16} />
                </Link>
                <a href="#modules" className={secondaryBtn}>
                  Explore modules
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-2">
                {trustItems.map(({ icon: Icon, tone, label }) => (
                  <span
                    key={label}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium',
                      TONES[tone],
                    )}
                  >
                    <Icon size={13} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero product card */}
            <div className="min-w-0">
              <div
                className={cn(
                  card,
                  'mx-auto w-full max-w-md overflow-hidden shadow-[0_24px_80px_-35px_rgba(0,0,0,0.22)] dark:shadow-black/30 lg:max-w-none',
                )}
              >
                <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-white/[0.07]">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile icon={FolderKanban} tone="blue" size="small" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        Smart Campus Research
                      </p>
                      <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                        Final-year major project
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                    <CheckCircle2 size={12} />
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-px border-b border-neutral-100 bg-neutral-100 dark:border-white/[0.07] dark:bg-white/10">
                  {[
                    { label: 'Members', value: '4' },
                    { label: 'Tasks', value: '12' },
                    { label: 'In review', value: '2' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white px-4 py-4 dark:bg-neutral-950"
                    >
                      <p className="text-[11px] text-neutral-500">{item.label}</p>
                      <p className="mt-1 text-xl font-semibold tracking-tight">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 p-5">
                  {[
                    { title: 'Proposal & planning', pct: 100, tone: 'green' },
                    { title: 'Research & development', pct: 62, tone: 'blue' },
                    { title: 'Faculty review', pct: 20, tone: 'violet' },
                  ].map((row) => (
                    <div key={row.title}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          {row.title}
                        </span>
                        <span className="text-xs tabular-nums text-neutral-500">
                          {row.pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            row.tone === 'green' && 'bg-emerald-500',
                            row.tone === 'blue' && 'bg-sky-500',
                            row.tone === 'violet' && 'bg-violet-500',
                          )}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-neutral-100 p-4 dark:border-white/[0.07]">
                  <PreviewRow
                    icon={CalendarDays}
                    tone="orange"
                    title="Supervision meeting"
                    subtitle="Tomorrow · 10:00 – 10:30"
                  />
                  <PreviewRow
                    icon={MessageSquare}
                    tone="green"
                    title="New message"
                    subtitle="Feedback on Draft 2"
                  />
                </div>

                <div className="border-t border-neutral-100 bg-neutral-50/70 px-5 py-2.5 dark:border-white/[0.07] dark:bg-white/[0.02]">
                  <p className="text-[11px] text-neutral-400">
                    Illustrative preview. Not live project data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============== Modules ============== */}
        <Section id="modules" muted>
          <SectionHeading
            title="Everything your academic workflow needs."
            description="Projects, submission groups, meetings, messaging and review — connected in one platform."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map(({ icon, tone, title, description }) => (
              <article
                key={title}
                className={cn(
                  card,
                  'flex h-full min-w-0 flex-col p-5 transition duration-200 hover:border-neutral-300 hover:shadow-sm dark:hover:border-white/20',
                )}
              >
                <IconTile icon={icon} tone={tone} size="small" />
                <h3 className="mt-4 text-sm font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </Section>

        {/* ============== Features ============== */}
        <Section id="features">
          <SectionHeading
            title="Four pillars of the project workspace."
            description="Structure the work, bring the team together, keep documents in order and move cleanly through faculty review."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon, tone, title, description }) => (
              <article
                key={title}
                className={cn(
                  card,
                  'flex h-full min-w-0 flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:hover:border-white/20',
                )}
              >
                <IconTile icon={icon} tone={tone} />
                <h3 className="mt-5 text-base font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              </article>
            ))}
          </div>

          <div
            className={cn(
              card,
              'mt-6 flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center',
            )}
          >
            <div className="flex items-center gap-3">
              <IconTile icon={Upload} tone="blue" size="small" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Upload the files you already use
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Each file is tied to a milestone or submission.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fileTypes.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Section>

        {/* ============== Spotlight: Submission groups ============== */}
        <Section id="groups" muted>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="min-w-0">
              <IconTile icon={FolderOpen} tone="violet" />
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
                Submission groups for every cohort.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 dark:text-neutral-400 sm:text-base">
                Faculty create a group for an academic year, branch and semester,
                set a deadline and coordinator, then publish when students should
                start submitting.
              </p>
              <ul className="mt-6 space-y-3">
                {groupPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm leading-6 text-neutral-700 dark:text-neutral-300"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-1 shrink-0 text-violet-600 dark:text-violet-400"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0">
              <div
                className={cn(
                  card,
                  'mx-auto w-full max-w-md overflow-hidden shadow-[0_24px_80px_-35px_rgba(0,0,0,0.22)] dark:shadow-black/30 lg:max-w-none',
                )}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <IconTile icon={FolderOpen} tone="violet" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      Published
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight">
                    CSE Final Year · 2025–26
                  </h3>
                  <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                    Major project submissions · Semester 8
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { label: 'Academic year', value: '2025–26' },
                      { label: 'Branch', value: 'CSE' },
                      { label: 'Deadline', value: '15 Apr 2026' },
                      { label: 'Submissions', value: '28 teams' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-neutral-100 p-3 dark:border-white/[0.07]"
                      >
                        <p className="text-[11px] text-neutral-500">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200">
                      Coordinator
                    </p>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                      Dr. Priya Nair · IT Department
                    </p>
                  </div>
                </div>
                <div className="border-t border-neutral-100 bg-neutral-50/70 px-5 py-2.5 dark:border-white/[0.07] dark:bg-white/[0.02]">
                  <p className="text-[11px] text-neutral-400">
                    Illustrative preview. Not live project data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ============== Spotlight: Meetings & supervision ============== */}
        <Section id="supervision">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 min-w-0 lg:order-1">
              <div
                className={cn(
                  card,
                  'mx-auto w-full max-w-md overflow-hidden shadow-[0_24px_80px_-35px_rgba(0,0,0,0.22)] dark:shadow-black/30 lg:max-w-none',
                )}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <IconTile icon={CalendarDays} tone="violet" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                      <CheckCircle2 size={13} />
                      Scheduled
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight">
                    Project review meeting
                  </h3>
                  <p className="mt-1.5 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
                    Bring your latest draft and open questions.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                      <CalendarDays size={13} />
                      Date
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      <Clock3 size={13} />
                      Start – end time
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300">
                      <Video size={13} />
                      Online
                    </span>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-neutral-100 pt-4 dark:border-white/[0.07]">
                    {[
                      {
                        label: 'Student A',
                        status: 'Accepted',
                        style:
                          'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
                      },
                      {
                        label: 'Student B',
                        status: 'Pending',
                        style:
                          'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
                      },
                      {
                        label: 'Student C',
                        status: 'Declined',
                        style:
                          'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
                      },
                    ].map(({ label, status, style }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300">
                          {label
                            .split(' ')
                            .map((w) => w[0])
                            .join('')}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-neutral-800 dark:text-neutral-200">
                          {label}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium',
                            style,
                          )}
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-neutral-200 p-3.5 dark:border-white/10">
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                      <CheckCircle2
                        size={13}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                      Supervision note: next steps
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                      Action items and a follow-up date are saved with the
                      meeting.
                    </p>
                  </div>
                </div>
                <div className="border-t border-neutral-100 bg-neutral-50/70 px-5 py-2.5 dark:border-white/[0.07] dark:bg-white/[0.02]">
                  <p className="text-[11px] text-neutral-400">
                    Illustrative preview. Not live project data.
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 min-w-0 lg:order-2">
              <IconTile icon={CalendarDays} tone="orange" />
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
                Meetings, messages and notes in one supervision flow.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 dark:text-neutral-400 sm:text-base">
                Stop splitting supervision across calendars, chat apps and
                notebooks. Schedule the session, talk to students and keep a
                record of what was agreed, all connected to the same project.
              </p>
              <ul className="mt-6 space-y-3">
                {meetingPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm leading-6 text-neutral-700 dark:text-neutral-300"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-1 shrink-0 text-orange-600 dark:text-orange-400"
                    />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { icon: MapPin, label: 'In person' },
                  { icon: Video, label: 'Online' },
                  { icon: Send, label: 'Direct messages' },
                  { icon: Inbox, label: 'Invitations' },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:bg-white/[0.07] dark:text-neutral-300"
                  >
                    <Icon size={13} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ============== Roles ============== */}
        <Section>
          <SectionHeading
            title="One platform, three roles. Everyone sees what they need."
            description="Students, team leads and faculty work in the same project, each with a view built around their responsibilities."
          />
          <RoleShowcase />
        </Section>

        {/* ============== Use cases ============== */}
        <Section muted>
          <SectionHeading
            title="Designed around the way projects actually run."
            description="From a single course assignment to a multi-month research collaboration, ResearchFlow adapts to your workflow."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {useCases.map(({ icon, tone, title, description, points }) => (
              <article
                key={title}
                className={cn(
                  card,
                  'flex h-full min-w-0 flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:hover:border-white/20',
                )}
              >
                <IconTile icon={icon} tone={tone} />
                <h3 className="mt-5 text-base font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
                <ul className="mt-5 space-y-2.5 border-t border-neutral-100 pt-4 dark:border-white/[0.07]">
                  {points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2.5 text-sm text-neutral-700 dark:text-neutral-300"
                    >
                      <Check
                        size={15}
                        className={cn('shrink-0', TONE_TEXT[tone])}
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        {/* ============== Workflow ============== */}
        <Section id="workflow">
          <SectionHeading
            title="From first idea to final review."
            description="Follow a structured process that connects planning, teamwork, documentation and academic evaluation."
          />

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(({ icon, tone, title, description }, index) => (
              <li key={title} className={cn(card, 'flex h-full min-w-0 flex-col p-6')}>
                <div className="flex items-center justify-between gap-3">
                  <IconTile icon={icon} tone={tone} />
                  <span className="text-xs font-medium text-neutral-400">
                    Step {index + 1} of {steps.length}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        {/* ============== Review lifecycle ============== */}
        <Section muted>
          <SectionHeading
            title="Every submission has a clear status."
            description="Students always know where their work stands, and supervisors always know what needs attention next."
          />

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {reviewStages.map((stage, index) => {
              const last = index === reviewStages.length - 1;
              return (
                <li
                  key={stage.title}
                  className={cn(
                    card,
                    'flex h-full min-w-0 flex-col p-5',
                    last && 'border-emerald-300 dark:border-emerald-500/30',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                      TONES[stage.tone],
                    )}
                  >
                    {last ? <Check size={15} /> : index + 1}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">{stage.title}</h3>
                  <p className="mt-2 flex-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                    {stage.description}
                  </p>
                </li>
              );
            })}
          </ol>

          <p className="mt-6 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            Supervisors can approve, request changes with feedback, or reject
            with a reason. If changes are requested, the team revises and
            resubmits, and every round stays in the history.
          </p>
        </Section>

        {/* ============== Role matrix ============== */}
        <Section id="roles">
          <SectionHeading
            title="Clear permissions for every role."
            description="Each role gets the tools it needs and nothing it does not, so responsibilities stay clear."
          />

          <div className={cn(card, 'mt-12 overflow-x-auto')}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-white/[0.07]">
                  <th className="px-5 py-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Capability
                  </th>
                  {[
                    { label: 'Student', icon: GraduationCap, tone: 'blue' },
                    { label: 'Team lead', icon: Users, tone: 'violet' },
                    { label: 'Faculty', icon: ClipboardCheck, tone: 'green' },
                  ].map(({ label, icon: Icon, tone }) => (
                    <th key={label} className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        <Icon size={14} className={TONE_TEXT[tone]} />
                        {label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-neutral-100 last:border-0 dark:border-white/[0.07]"
                  >
                    <td className="px-5 py-3.5 text-neutral-700 dark:text-neutral-300">
                      {row.feature}
                    </td>
                    {[row.student, row.lead, row.faculty].map(
                      (allowed, index) => (
                        <td key={index} className="px-5 py-3.5 text-center">
                          {allowed ? (
                            <Check
                              size={17}
                              className="mx-auto text-emerald-600 dark:text-emerald-400"
                              aria-label="Included"
                            />
                          ) : (
                            <Minus
                              size={15}
                              className="mx-auto text-neutral-300 dark:text-neutral-600"
                              aria-label="Not included"
                            />
                          )}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ============== Get started ============== */}
        <Section id="get-started" muted>
          <SectionHeading
            title="Get started in three steps, whatever your role."
            description="Set up takes minutes. Pick your role and follow the path that fits."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {gettingStarted.map(({ icon, tone, role, steps: roleSteps }) => (
              <article
                key={role}
                className={cn(card, 'flex h-full min-w-0 flex-col p-6')}
              >
                <div className="flex items-center gap-3">
                  <IconTile icon={icon} tone={tone} />
                  <h3 className="text-base font-semibold tracking-tight">
                    {role}
                  </h3>
                </div>
                <ol className="mt-5 space-y-4 border-t border-neutral-100 pt-5 dark:border-white/[0.07]">
                  {roleSteps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3">
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          TONES[tone],
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="pt-0.5 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/auth?tab=student-register" className={primaryBtn}>
              Create an account
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/auth?tab=student-login" className={secondaryBtn}>
              Sign in
            </Link>
          </div>
        </Section>

        {/* ============== Capabilities ============== */}
        <Section>
          <SectionHeading
            title="Small details that keep projects on track."
            description="The everyday tools that reduce chasing, searching and guesswork."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon, tone, title, description }) => (
              <article
                key={title}
                className={cn(card, 'flex h-full min-w-0 flex-col p-6')}
              >
                <IconTile icon={icon} tone={tone} size="small" />
                <h3 className="mt-5 text-base font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </Section>

        {/* ============== Comparison ============== */}
        <Section muted>
          <SectionHeading
            title="Replace scattered tools with one workspace."
            description="Stop juggling chat apps, shared drives and email threads. Keep everything tied to the project it belongs to."
          />

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            <div className={cn(card, 'flex h-full flex-col p-6 sm:p-8')}>
              <div className="flex items-center gap-3">
                <IconTile icon={X} tone="red" size="small" />
                <h3 className="text-base font-semibold">Without ResearchFlow</h3>
              </div>
              <ul className="mt-6 space-y-3.5">
                {comparison.without.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-6 text-neutral-600 dark:text-neutral-400"
                  >
                    <X
                      size={15}
                      className="mt-1 shrink-0 text-red-500 dark:text-red-400"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={cn(
                card,
                'flex h-full flex-col border-emerald-300 p-6 dark:border-emerald-500/30 sm:p-8',
              )}
            >
              <div className="flex items-center gap-3">
                <IconTile icon={Check} tone="green" size="small" />
                <h3 className="text-base font-semibold">With ResearchFlow</h3>
              </div>
              <ul className="mt-6 space-y-3.5">
                {comparison.with.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-6 text-neutral-700 dark:text-neutral-200"
                  >
                    <Check
                      size={15}
                      className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* ============== Security ============== */}
        <Section>
          <SectionHeading
            title="Your project stays with your team."
            description="Research work is sensitive. Access is limited to the people you invite, with permissions that match their role."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {security.map(({ icon, tone, title, description }) => (
              <article
                key={title}
                className={cn(card, 'flex h-full min-w-0 flex-col p-6')}
              >
                <IconTile icon={icon} tone={tone} />
                <h3 className="mt-5 text-base font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </Section>

        {/* ============== FAQ ============== */}
        <section
          id="faq"
          className="scroll-mt-24 border-b border-neutral-200 py-20 dark:border-white/10 sm:py-24"
        >
          <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
            <SectionHeading
              align="center"
              title="Questions, answered."
              description="Everything you need to know before getting started."
            />
            <div className="mt-12 border-t border-neutral-200 dark:border-white/10">
              {faqs.map((faq, index) => (
                <FaqItem
                  key={faq.q}
                  q={faq.q}
                  a={faq.a}
                  defaultOpen={index === 0}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ============== CTA ============== */}
        <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto max-w-7xl rounded-3xl bg-neutral-900 px-6 py-14 text-center text-white dark:bg-white dark:text-neutral-900 sm:px-12 sm:py-16">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 dark:bg-neutral-900/10">
              <GraduationCap size={24} strokeWidth={1.8} />
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Give your research a clearer direction.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-300 dark:text-neutral-600 sm:text-base">
              Organise your work, coordinate your team and keep academic project
              activities connected in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth?tab=student-register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-700"
              >
                Create an account
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/auth?tab=student-login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-medium text-white transition hover:bg-white/10 dark:border-neutral-900/20 dark:text-neutral-900 dark:hover:bg-neutral-900/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}