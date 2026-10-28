import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  X,
  Search,
  Users,
  Code2,
  FileText,
  ClipboardList,
  Send,
  Loader2,
  GraduationCap,
  Hash,
  CalendarDays,
  Target,
  Link2,
  BookOpen,
  UserPlus,
  GitBranch,
  Rocket,
  Video,
  PenTool,
  Layers,
  ClipboardCheck,
  Flag,
  Globe,
  Lock,
  Info,
  Circle,
  CheckCircle2,
  Trash2,
  Sparkles,
  Eye,
  Clock3,
} from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  step1Schema,
  PROJECT_TYPES,
  STAGES,
  DURATION_PRESETS,
} from '../../schemas/project';

/* -------------------------------------------------------
   Styles (neutral cards, coloured icons)
------------------------------------------------------- */

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/[0.04]';

const innerCard =
  'rounded-xl border border-neutral-200 bg-neutral-50/50 dark:border-white/10 dark:bg-white/[0.03]';

const muted = 'text-neutral-500 dark:text-neutral-400';

const labelClass =
  'mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300';

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white/40 dark:focus:ring-white/10';

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';

const secondaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]';

const iconBox = 'flex shrink-0 items-center justify-center rounded-xl';

const TONES = {
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  pink: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
};

const ICON = {
  sky: 'text-sky-600 dark:text-sky-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  amber: 'text-amber-600 dark:text-amber-300',
  violet: 'text-violet-600 dark:text-violet-300',
  pink: 'text-pink-600 dark:text-pink-300',
  indigo: 'text-indigo-600 dark:text-indigo-300',
  red: 'text-red-600 dark:text-red-300',
  neutral: 'text-neutral-500 dark:text-neutral-400',
};

/* -------------------------------------------------------
   Constants
------------------------------------------------------- */

const STEPS = [
  {
    id: 1,
    label: 'Basics',
    icon: FileText,
    tone: 'sky',
    hint: 'Title, problem and objectives',
  },
  {
    id: 2,
    label: 'Technologies',
    icon: Code2,
    tone: 'violet',
    hint: 'Stack and tools you will use',
  },
  {
    id: 3,
    label: 'Team',
    icon: Users,
    tone: 'emerald',
    hint: 'Invite teammates by reg. no.',
  },
  {
    id: 4,
    label: 'Planning',
    icon: ClipboardList,
    tone: 'amber',
    hint: 'Modules and work structure',
  },
  {
    id: 5,
    label: 'Links',
    icon: Link2,
    tone: 'pink',
    hint: 'Repos, demo and design URLs',
  },
  {
    id: 6,
    label: 'Review',
    icon: Send,
    tone: 'indigo',
    hint: 'Check everything and submit',
  },
];

const VISIBILITY_OPTIONS = [
  {
    value: 'private',
    label: 'Private',
    desc: 'Only you can see this project. No teammate notifications.',
    icon: Lock,
    tone: 'neutral',
  },
  {
    value: 'team',
    label: 'Team only',
    desc: 'Access is limited to the creator and accepted team members.',
    icon: Users,
    tone: 'emerald',
  },
  {
    value: 'faculty',
    label: 'Faculty',
    desc: 'For projects that require a faculty supervisor.',
    icon: GraduationCap,
    tone: 'violet',
  },
];

const LINK_TYPE_META = {
  github: { label: 'GitHub', icon: GitBranch, tone: 'neutral' },
  demo: { label: 'Live demo', icon: Rocket, tone: 'sky' },
  docs: { label: 'Documentation', icon: BookOpen, tone: 'indigo' },
  design: { label: 'Design', icon: PenTool, tone: 'pink' },
  video: { label: 'Video', icon: Video, tone: 'amber' },
  other: { label: 'Other', icon: Globe, tone: 'neutral' },
};

const MEMBER_ROLES = [
  'Team Lead',
  'Developer',
  'Designer',
  'Researcher',
  'Tester',
  'Documentation',
  'Other',
];

const BRANCH_SUGGESTIONS = [
  'CSE',
  'IT',
  'ECE',
  'EEE',
  'ME',
  'CE',
  'AI & DS',
  'Other',
];

const MAX_TEAM_MEMBERS = 4;

const emptyMember = () => ({
  registration_number: '',
  roll_number: '',
  branch: '',
  role: '',
  status: 'idle',
});

const defaultForm = {
  title: 'Untitled project',
  short_description: '',
  problem_statement: '',
  objectives: [''],
  project_type: 'major',
  ownership_mode: 'team',
  category_id: null,
  stage: 'planning',
  duration_preset: '3-6',
  duration_min_months: 3,
  duration_max_months: 6,
  start_date: '',
  target_end_date: '',
  visibility: 'team',
};

const normalizeReg = (value) => String(value || '').trim().toLowerCase();

/* -------------------------------------------------------
   Small components
------------------------------------------------------- */

function SectionHeading({ icon: Icon, title, description, tone = 'neutral' }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className={cn(iconBox, 'h-11 w-11', TONES[tone])}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
          {title}
        </h3>
        <p className={cn('mt-0.5 text-sm', muted)}>{description}</p>
      </div>
    </div>
  );
}

function Field({ label, required, error, hint, children, className }) {
  return (
    <div className={className}>
      {label && (
        <label className={labelClass}>
          {label}
          {required && <span className="ml-0.5 text-neutral-400">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : (
        hint && <p className={cn('mt-1.5 text-xs', muted)}>{hint}</p>
      )}
    </div>
  );
}

function InfoNote({ icon: Icon = Info, tone = 'sky', title, children }) {
  return (
    <div className={cn(innerCard, 'flex items-start gap-3 p-4')}>
      <div className={cn(iconBox, 'h-9 w-9', TONES[tone])}>
        <Icon size={16} />
      </div>
      <div className={cn('min-w-0 text-sm leading-6', muted)}>
        {title && (
          <p className="mb-0.5 font-medium text-neutral-900 dark:text-white">
            {title}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone =
    status === 'accepted' || status === 'sent'
      ? TONES.emerald
      : status === 'pending'
        ? TONES.amber
        : status === 'declined' || status === 'expired'
          ? TONES.red
          : TONES.neutral;

  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        tone,
      )}
    >
      {status}
    </span>
  );
}

function SummaryItem({ done, label, value }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        {done ? (
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
        ) : (
          <Circle
            size={16}
            className="shrink-0 text-neutral-300 dark:text-neutral-600"
          />
        )}
        <span className="truncate text-neutral-700 dark:text-neutral-200">
          {label}
        </span>
      </span>
      <span className={cn('shrink-0 text-xs', muted)}>{value}</span>
    </li>
  );
}

function MiniStat({ label, value, tone = 'neutral' }) {
  return (
    <div className={cn(innerCard, 'flex items-start justify-between gap-3 p-4')}>
      <div className="min-w-0">
        <p className={cn('text-xs font-medium', muted)}>{label}</p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-neutral-900 dark:text-white">
          {value}
        </p>
      </div>
      <span className={cn(iconBox, 'h-9 w-9', TONES[tone] || TONES.neutral)}>
        <Circle size={14} />
      </span>
    </div>
  );
}

/* -------------------------------------------------------
   Main wizard
------------------------------------------------------- */

export default function ProjectWizard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [currentId, setCurrentId] = useState(projectId || null);

  const [techSearch, setTechSearch] = useState('');
  const [selectedTechs, setSelectedTechs] = useState([]);

  const [invitations, setInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [members, setMembers] = useState(() =>
    Array.from({ length: MAX_TEAM_MEMBERS }, emptyMember),
  );
  const [inviting, setInviting] = useState(false);

  const [links, setLinks] = useState([
    { label: '', url: '', link_type: 'github' },
  ]);
  const [modules, setModules] = useState([{ title: '', description: '' }]);

  const { data: projectData, isLoading: loadingProject } = useQuery({
    queryKey: ['project', currentId],
    queryFn: () => api.getProject(currentId),
    enabled: !!currentId,
  });

  const { data: techCatalog, isLoading: loadingTechnologies } = useQuery({
    queryKey: ['technologies', techSearch],
    queryFn: () =>
      api.listTechnologies(techSearch ? { search: techSearch } : {}),
  });

  useEffect(() => {
    if (!projectData?.project) return;

    const p = projectData.project;

    setForm({
      title: p.title || 'Untitled project',
      short_description: p.short_description || '',
      problem_statement: p.problem_statement || '',
      objectives: p.objectives?.length ? p.objectives : [''],
      project_type: p.project_type || 'major',
      ownership_mode: p.ownership_mode || 'team',
      category_id: p.category_id || null,
      stage: p.stage || 'planning',
      duration_preset: 'custom',
      duration_min_months: p.duration_min_months ?? 3,
      duration_max_months: p.duration_max_months ?? 6,
      start_date: p.start_date || '',
      target_end_date: p.target_end_date || '',
      visibility: p.visibility || 'team',
    });

    if (p.technologies?.length) {
      setSelectedTechs(
        p.technologies.map((t) => ({
          id: t.technology?.id || t.technology_id,
          name: t.technology?.name || 'Technology',
          category: t.technology?.category || '',
          usage_status: t.usage_status,
          purpose: t.purpose,
        })),
      );
    } else {
      setSelectedTechs([]);
    }
  }, [projectData]);

  const loadInvitations = async () => {
    if (!currentId || form.ownership_mode !== 'team') {
      setInvitations([]);
      return [];
    }

    setLoadingInvitations(true);

    try {
      const response = await api.listProjectInvitations(currentId);
      const list = response.invitations || [];
      setInvitations(list);
      return list;
    } catch (err) {
      console.error('Failed to load project invitations:', err);
      return [];
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    loadInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, form.ownership_mode]);

  useEffect(() => {
    if (!invitations.length) return;

    const invited = new Set(
      invitations
        .filter((item) => ['pending', 'accepted'].includes(item.status))
        .map((item) => normalizeReg(item.invitee?.registration_number)),
    );

    setMembers((previous) =>
      previous.map((member) =>
        member.status === 'idle' &&
        invited.has(normalizeReg(member.registration_number))
          ? { ...member, status: 'sent' }
          : member,
      ),
    );
  }, [invitations]);

  const updateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const updateMember = (index, key, value) => {
    setMembers((previous) =>
      previous.map((member, i) =>
        i === index
          ? {
              ...member,
              [key]: value,
              status: key === 'registration_number' ? 'idle' : member.status,
            }
          : member,
      ),
    );
  };

  const clearMember = (index) => {
    setMembers((previous) =>
      previous.map((member, i) => (i === index ? emptyMember() : member)),
    );
  };

  const handleDurationPreset = (preset) => {
    const found = DURATION_PRESETS.find((d) => d.value === preset);
    updateField('duration_preset', preset);

    if (found && found.min !== null) {
      updateField('duration_min_months', found.min);
      updateField('duration_max_months', found.max);
    }
  };

  const saveDraft = async (showToast = true, redirectToProjects = false) => {
    if (redirectToProjects) setSavingDraft(true);
    else setSaving(true);

    try {
      const payload = {
        title: form.title,
        short_description: form.short_description || null,
        problem_statement: form.problem_statement || null,
        objectives: form.objectives.filter((objective) => objective.trim()),
        project_type: form.project_type,
        ownership_mode: form.ownership_mode,
        category_id: form.category_id || null,
        stage: form.stage,
        duration_min_months: form.duration_min_months,
        duration_max_months: form.duration_max_months,
        start_date: form.start_date || null,
        target_end_date: form.target_end_date || null,
        visibility:
          form.ownership_mode === 'solo' ? 'private' : form.visibility,
      };

      if (currentId) {
        await api.updateProject(currentId, payload);
        if (showToast) toast.success('Draft saved');
      } else {
        const response = await api.createDraft(payload);
        const newId = response?.project?.id;

        if (!newId) {
          throw new Error(
            'The draft was created, but no project ID was returned.',
          );
        }

        setCurrentId(newId);
        navigate(`/app/projects/${newId}/setup`, { replace: true });

        if (showToast) toast.success('Draft created');
      }

      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (redirectToProjects) navigate('/app/projects');
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to save draft');
      if (err.fieldErrors) setErrors(err.fieldErrors);
      return false;
    } finally {
      if (redirectToProjects) setSavingDraft(false);
      else setSaving(false);
    }
  };

  const validateStep1 = () => {
    const result = step1Schema.safeParse({
      ...form,
      objectives: form.objectives.filter((objective) => objective.trim()),
    });

    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const goNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      const saved = await saveDraft(false);
      if (!saved) return;
    }

    if ((step === 2 || step === 3) && currentId) {
      const saved = await saveDraft(false);
      if (!saved) return;
    }

    setStep((previous) => Math.min(6, previous + 1));
  };

  const goBack = () => setStep((previous) => Math.max(1, previous - 1));

  const addTech = async (technology) => {
    if (selectedTechs.some((item) => item.id === technology.id)) return;

    if (!currentId) {
      toast.error('Save the draft first.');
      return;
    }

    try {
      const response = await api.addProjectTechnology(currentId, {
        technology_id: technology.id,
        usage_status: 'planned',
      });

      const saved = response.technology;

      setSelectedTechs((previous) => [
        ...previous,
        {
          id: saved.technology.id,
          name: saved.technology.name,
          category: saved.technology.category,
          usage_status: saved.usage_status,
        },
      ]);

      await queryClient.invalidateQueries({ queryKey: ['project', currentId] });
    } catch (err) {
      toast.error(err.message || 'Failed to add technology');
    }
  };

  const removeTech = async (technologyId) => {
    if (!currentId) return;

    try {
      await api.removeProjectTechnology(currentId, technologyId);
      setSelectedTechs((previous) =>
        previous.filter((item) => item.id !== technologyId),
      );
      await queryClient.invalidateQueries({ queryKey: ['project', currentId] });
    } catch (err) {
      toast.error(err.message || 'Failed to remove technology');
    }
  };

  const sendMemberInvites = async () => {
    if (!currentId || form.ownership_mode !== 'team')
      return { sent: 0, skipped: 0 };

    const alreadyInvited = new Set(
      invitations
        .filter((item) => ['pending', 'accepted'].includes(item.status))
        .map((item) => normalizeReg(item.invitee?.registration_number)),
    );

    const seen = new Set();
    const next = [...members];
    let sent = 0;
    let skipped = 0;

    for (let index = 0; index < next.length; index += 1) {
      const member = next[index];
      const registrationNumber = member.registration_number.trim();
      const key = normalizeReg(registrationNumber);

      if (!registrationNumber || member.status === 'sent') continue;

      if (seen.has(key)) {
        next[index] = { ...member, status: 'skipped' };
        skipped += 1;
        continue;
      }

      seen.add(key);

      if (alreadyInvited.has(key)) {
        next[index] = { ...member, status: 'sent' };
        continue;
      }

      try {
        await api.inviteMember(currentId, {
          registration_number: registrationNumber,
          roll_number: member.roll_number.trim() || undefined,
          branch: member.branch.trim() || undefined,
          role: member.role || undefined,
        });

        next[index] = { ...member, status: 'sent' };
        sent += 1;
      } catch (err) {
        console.warn(
          '[ProjectWizard] Invitation skipped:',
          registrationNumber,
          err?.code || err?.message || err,
        );
        next[index] = { ...member, status: 'skipped' };
        skipped += 1;
      }
    }

    setMembers(next);
    await loadInvitations();

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['project', currentId] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);

    return { sent, skipped };
  };

  const handleSendInvites = async () => {
    if (!currentId) {
      toast.error('Save the project draft before inviting teammates.');
      return;
    }

    const filled = members.filter((member) =>
      member.registration_number.trim(),
    );

    if (!filled.length) {
      toast.error('Enter at least one registration number.');
      return;
    }

    setInviting(true);

    try {
      const { sent } = await sendMemberInvites();

      if (sent > 0) {
        toast.success(
          `${sent} invitation${sent === 1 ? '' : 's'} sent.`,
        );
      } else {
        toast.message('No new invitations to send.');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentId) {
      toast.error('Create the project draft before submitting.');
      return;
    }

    if (!validateStep1()) {
      setStep(1);
      return;
    }

    setSaving(true);

    try {
      const saved = await saveDraft(false);
      if (!saved) return;

      try {
        await sendMemberInvites();
      } catch (err) {
        console.warn(
          '[ProjectWizard] Invitations could not be processed:',
          err,
        );
      }

      const response = await api.submitProject(currentId);
      const submittedProjectId = response?.project?.id || currentId;

      toast.success('Project submitted successfully.');

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['project', currentId] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);

      navigate(`/app/projects/${submittedProjectId}`);
    } catch (err) {
      toast.error(err.message || 'Project submission failed.');

      if (err.fieldErrors) {
        Object.values(err.fieldErrors).forEach((message) =>
          toast.error(message),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingProject && currentId) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-[1600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const progressPercent = Math.round(
    ((step - 1) / (STEPS.length - 1)) * 100,
  );
  const CurrentStepIcon = STEPS[step - 1].icon;
  const currentStepTone = STEPS[step - 1].tone;
  const pendingInvites = invitations.filter(
    (item) => item.status === 'pending',
  );
  const acceptedInvites = invitations.filter(
    (item) => item.status === 'accepted',
  );
  const filledMembers = members.filter((member) =>
    member.registration_number.trim(),
  );

  const basicsDone =
    form.title.trim().length > 0 &&
    form.short_description.trim().length >= 30 &&
    form.problem_statement.trim().length >= 50 &&
    form.objectives.some((objective) => objective.trim());

  const busy = saving || savingDraft;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      {/* Header */}
      <section>
        <div className={cn('mb-3 flex flex-wrap items-center gap-2 text-sm', muted)}>
          <Plus size={20} className={ICON.amber} />
          <span>Student workspace</span>
          <ChevronRight size={14} />
          <Link
            to="/app/projects"
            className="hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Projects
          </Link>
          <ChevronRight size={14} />
          <span className="text-neutral-800 dark:text-neutral-200">
            {currentId ? 'Continue setup' : 'New project'}
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              {currentId ? 'Continue project setup' : 'Create a new project'}
            </h1>
            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              Six steps to define your project, add teammates and prepare your
              submission.
            </p>
          </div>

          {currentId && (
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-neutral-200 px-3.5 py-2.5 text-xs text-neutral-600 dark:border-white/10 dark:text-neutral-300">
              <Hash size={13} className={ICON.sky} />
              <span className="font-mono">{String(currentId).slice(0, 8)}</span>
            </div>
          )}
        </div>
      </section>

      {/* Stepper */}
      <section className={cn(card, 'p-4 sm:p-5')}>
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-200">
            <span className={cn(iconBox, 'h-7 w-7', TONES[currentStepTone])}>
              <CurrentStepIcon size={14} />
            </span>
            Step {step} of {STEPS.length} · {STEPS[step - 1].label}
          </span>
          <span className={muted}>{progressPercent}% complete</span>
        </div>

                <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STEPS.map((item) => {
            const Icon = item.icon;
            const done = step > item.id;
            const active = step === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (done || active) setStep(item.id);
                }}
                disabled={!done && !active}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex min-w-0 flex-col gap-2 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 sm:flex-row sm:items-center',
                  active
                    ? 'border-neutral-300 bg-neutral-50 shadow-sm dark:border-white/20 dark:bg-white/[0.06]'
                    : done
                      ? 'border-neutral-200 hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/[0.04]'
                      : 'cursor-not-allowed border-neutral-200/70 opacity-55 dark:border-white/[0.07]',
                )}
              >
                <span
                  className={cn(
                    iconBox,
                    'h-9 w-9',
                    active || done ? TONES[item.tone] : TONES.neutral,
                  )}
                >
                  {done && !active ? (
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Icon size={16} />
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-xs font-semibold',
                      active
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-700 dark:text-neutral-200',
                    )}
                  >
                    {item.id}. {item.label}
                  </span>
                  <span className={cn('mt-0.5 block truncate text-[11px] leading-4', muted)}>
                    {item.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Step content */}
        <div className={cn(card, 'overflow-hidden')}>
          {/* ───────── STEP 1: Basics ───────── */}
          {step === 1 && (
            <div className="space-y-5 p-5 sm:p-6">
              {/* Card: Core details */}
              <div className={cn(innerCard, 'p-5')}>
                <SectionHeading
                  icon={FileText}
                  tone="sky"
                  title="Project basics"
                  description="Define the title, scope and key details of your project."
                />

                <div className="space-y-4">
                  <Field label="Project title" required error={errors.title}>
                    <input
                      value={form.title}
                      onChange={(event) =>
                        updateField('title', event.target.value)
                      }
                      className={cn(
                        inputClass,
                        errors.title && 'border-red-400',
                      )}
                      placeholder="e.g. Smart Campus Navigation System"
                    />
                  </Field>

                  <Field
                    label="Short description"
                    required
                    error={errors.short_description}
                    hint={`${form.short_description.length}/500 · 30 to 500 characters`}
                  >
                    <textarea
                      rows={3}
                      value={form.short_description}
                      onChange={(event) =>
                        updateField('short_description', event.target.value)
                      }
                      className={cn(
                        inputClass,
                        'resize-y',
                        errors.short_description && 'border-red-400',
                      )}
                      placeholder="Summarise the project in a few lines"
                    />
                  </Field>

                  <Field
                    label="Problem statement"
                    required
                    error={errors.problem_statement}
                    hint={`${form.problem_statement.length} characters · minimum 50`}
                  >
                    <textarea
                      rows={5}
                      value={form.problem_statement}
                      onChange={(event) =>
                        updateField('problem_statement', event.target.value)
                      }
                      className={cn(
                        inputClass,
                        'resize-y',
                        errors.problem_statement && 'border-red-400',
                      )}
                      placeholder="Describe the problem this project addresses"
                    />
                  </Field>
                </div>
              </div>

              {/* Card: Objectives */}
              <div className={cn(innerCard, 'p-5')}>
                <SectionHeading
                  icon={Target}
                  tone="emerald"
                  title="Objectives"
                  description="List the concrete goals this project aims to achieve."
                />

                <Field required error={errors.objectives}>
                  <div className="space-y-2">
                    {form.objectives.map((objective, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <Target
                            size={15}
                            className={cn(
                              'absolute left-3.5 top-1/2 -translate-y-1/2',
                              ICON.emerald,
                            )}
                          />
                          <input
                            value={objective}
                            onChange={(event) => {
                              const next = [...form.objectives];
                              next[index] = event.target.value;
                              updateField('objectives', next);
                            }}
                            className={cn(inputClass, 'pl-9')}
                            placeholder={`Objective ${index + 1}`}
                          />
                        </div>

                        {form.objectives.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              updateField(
                                'objectives',
                                form.objectives.filter((_, i) => i !== index),
                              )
                            }
                            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-white dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/[0.05]"
                            aria-label="Remove objective"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateField('objectives', [...form.objectives, ''])
                    }
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                  >
                    <Plus size={14} /> Add objective
                  </button>
                </Field>
              </div>

              {/* Card: Classification */}
              <div className={cn(innerCard, 'p-5')}>
                <SectionHeading
                  icon={Layers}
                  tone="violet"
                  title="Classification"
                  description="Help reviewers understand your project type and ownership."
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Project type">
                    <select
                      className={inputClass}
                      value={form.project_type}
                      onChange={(event) =>
                        updateField('project_type', event.target.value)
                      }
                    >
                      {PROJECT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Ownership">
                    <select
                      className={inputClass}
                      value={form.ownership_mode}
                      onChange={(event) => {
                        const ownership = event.target.value;
                        setForm((previous) => ({
                          ...previous,
                          ownership_mode: ownership,
                          visibility:
                            ownership === 'solo'
                              ? 'private'
                              : previous.visibility === 'private'
                                ? 'team'
                                : previous.visibility,
                        }));
                      }}
                    >
                      <option value="solo">Solo</option>
                      <option value="team">
                        Team (you + up to 4 members)
                      </option>
                    </select>
                  </Field>

                  <Field label="Lifecycle stage" className="sm:col-span-2">
                    <select
                      className={inputClass}
                      value={form.stage}
                      onChange={(event) =>
                        updateField('stage', event.target.value)
                      }
                    >
                      {STAGES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-5">
                  <label className={labelClass}>Visibility *</label>
                  <p className={cn('mb-3 text-xs', muted)}>
                    Visibility does not automatically assign a faculty
                    supervisor.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {VISIBILITY_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const selected = form.visibility === option.value;
                      const disabled =
                        form.ownership_mode === 'solo' &&
                        option.value !== 'private';

                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            updateField('visibility', option.value)
                          }
                          aria-pressed={selected}
                          className={cn(
                            'rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-40',
                            selected
                              ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                iconBox,
                                'h-8 w-8',
                                selected
                                  ? 'bg-white/15 text-white dark:bg-neutral-900/10 dark:text-neutral-900'
                                  : TONES[option.tone],
                              )}
                            >
                              <Icon size={15} />
                            </span>
                            <span className="text-sm font-semibold">
                              {option.label}
                            </span>
                          </div>
                          <p
                            className={cn(
                              'mt-2 text-xs leading-5',
                              selected
                                ? 'text-neutral-300 dark:text-neutral-600'
                                : muted,
                            )}
                          >
                            {option.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card: Timeline */}
              <div className={cn(innerCard, 'p-5')}>
                <SectionHeading
                  icon={CalendarDays}
                  tone="amber"
                  title="Timeline"
                  description="Set an expected duration and target dates."
                />

                <div className="mb-4">
                  <label className={labelClass}>Expected duration</label>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_PRESETS.map((duration) => (
                      <button
                        key={duration.value}
                        type="button"
                        onClick={() => handleDurationPreset(duration.value)}
                        aria-pressed={
                          form.duration_preset === duration.value
                        }
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400',
                          form.duration_preset === duration.value
                            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]',
                        )}
                      >
                        {duration.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Start date">
                    <input
                      type="date"
                      value={form.start_date || ''}
                      onChange={(event) =>
                        updateField('start_date', event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Expected completion"
                    error={errors.target_end_date}
                  >
                    <input
                      type="date"
                      value={form.target_end_date || ''}
                      onChange={(event) =>
                        updateField('target_end_date', event.target.value)
                      }
                      className={cn(
                        inputClass,
                        errors.target_end_date && 'border-red-400',
                      )}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ───────── STEP 2: Technologies ───────── */}
          {step === 2 && (
            <div className="space-y-5 p-5 sm:p-6">
              <div className={cn(innerCard, 'p-5')}>
                <SectionHeading
                  icon={Code2}
                  tone="violet"
                  title="Technologies"
                  description="Select the tools, frameworks and platforms you plan to use."
                />

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-500" />
                  <input
                    className={cn(inputClass, 'pl-9')}
                    placeholder="Search technologies…"
                    value={techSearch}
                    onChange={(event) => setTechSearch(event.target.value)}
                  />
                </div>
              </div>

              {selectedTechs.length > 0 && (
                <div className={cn(innerCard, 'p-5')}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={cn(iconBox, 'h-8 w-8', TONES.emerald)}>
                      <Check size={15} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                        Selected technologies
                      </p>
                      <p className={cn('text-xs', muted)}>
                        {selectedTechs.length} selected
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedTechs.map((technology) => (
                      <span
                        key={technology.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 dark:border-white/10 dark:bg-transparent dark:text-neutral-200"
                      >
                        <Code2 size={11} className={ICON.violet} />
                        {technology.name}
                        <button
                          type="button"
                          onClick={() => removeTech(technology.id)}
                          className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
                          aria-label={`Remove ${technology.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className={cn(innerCard, 'overflow-hidden')}>
                <div className="border-b border-neutral-200 px-5 py-3 dark:border-white/10">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Technology catalog
                  </p>
                  <p className={cn('text-xs', muted)}>
                    Click a technology to add it to your project
                  </p>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {loadingTechnologies ? (
                    <div className="flex items-center justify-center gap-2 p-8 text-sm text-neutral-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading
                      technologies...
                    </div>
                  ) : (
                    (techCatalog?.technologies || [])
                      .filter(
                        (technology) =>
                          !selectedTechs.some(
                            (selected) => selected.id === technology.id,
                          ),
                      )
                      .slice(0, 40)
                      .map((technology) => (
                        <button
                          key={technology.id}
                          type="button"
                          onClick={() => addTech(technology)}
                          className="flex w-full items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3 text-left text-sm last:border-b-0 hover:bg-white dark:border-white/[0.06] dark:hover:bg-white/[0.04]"
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={cn(iconBox, 'h-8 w-8', TONES.violet)}
                            >
                              <Code2 size={14} />
                            </span>
                            <span className="font-medium text-neutral-800 dark:text-neutral-100">
                              {technology.name}
                            </span>
                          </span>
                          <span className={cn('text-xs', muted)}>
                            {technology.category}
                          </span>
                        </button>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ───────── STEP 3: Team ───────── */}
          {step === 3 && (
            <div className="space-y-5 p-5 sm:p-6">
              <div className={cn(innerCard, 'p-5')}>
                <SectionHeading
                  icon={Users}
                  tone="emerald"
                  title="Team members"
                  description="Add up to 4 teammates. Registered students get an invitation notification."
                />

                {form.ownership_mode === 'solo' ? (
                  <InfoNote icon={Check} tone="emerald" title="Solo project">
                    Only the creator will have access, and teammates cannot be
                    invited. Change the ownership to Team in step 1 to add
                    members.
                  </InfoNote>
                ) : (
                  <InfoNote title="How invitations work">
                    Enter the details of each teammate. When you send
                    invitations, every registration number that matches a
                    registered student receives a notification. Numbers that
                    are not found are skipped, and you can still submit the
                    project.
                  </InfoNote>
                )}
              </div>

              {form.ownership_mode === 'team' && (
                <>
                  <div className="space-y-4">
                    {members.map((member, index) => (
                      <div
                        key={index}
                        className={cn(innerCard, 'p-5')}
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h3 className="flex items-center gap-2.5 text-sm font-semibold text-neutral-900 dark:text-white">
                            <span
                              className={cn(iconBox, 'h-9 w-9', TONES.emerald)}
                            >
                              <UserPlus size={16} />
                            </span>
                            Member {index + 1}
                          </h3>

                          <div className="flex items-center gap-2">
                            {member.status === 'sent' && (
                              <StatusBadge status="sent" />
                            )}
                            {member.status === 'skipped' && (
                              <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300">
                                Not found, skipped
                              </span>
                            )}

                            {(member.registration_number ||
                              member.roll_number ||
                              member.branch ||
                              member.role) && (
                              <button
                                type="button"
                                onClick={() => clearMember(index)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-white dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/[0.05]"
                                aria-label={`Clear member ${index + 1}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Registration number">
                            <input
                              value={member.registration_number}
                              onChange={(event) =>
                                updateMember(
                                  index,
                                  'registration_number',
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                              placeholder="Exact registration number"
                              disabled={inviting}
                            />
                          </Field>

                          <Field label="Roll number">
                            <input
                              value={member.roll_number}
                              onChange={(event) =>
                                updateMember(
                                  index,
                                  'roll_number',
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                              placeholder="e.g. 21"
                              disabled={inviting}
                            />
                          </Field>

                          <Field label="Branch">
                            <input
                              value={member.branch}
                              onChange={(event) =>
                                updateMember(
                                  index,
                                  'branch',
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                              placeholder="e.g. CSE"
                              list="branch-options"
                              disabled={inviting}
                            />
                          </Field>

                          <Field label="Role in project">
                            <select
                              value={member.role}
                              onChange={(event) =>
                                updateMember(index, 'role', event.target.value)
                              }
                              className={inputClass}
                              disabled={inviting}
                            >
                              <option value="">Select a role</option>
                              {MEMBER_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </Field>
                        </div>
                      </div>
                    ))}

                    <datalist id="branch-options">
                      {BRANCH_SUGGESTIONS.map((branch) => (
                        <option key={branch} value={branch} />
                      ))}
                    </datalist>
                  </div>

                  <div
                    className={cn(
                      innerCard,
                      'flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between',
                    )}
                  >
                    <p className={cn('text-sm leading-6', muted)}>
                      {filledMembers.length
                        ? `${filledMembers.length} member${filledMembers.length === 1 ? '' : 's'} added. Invitations also go out automatically when you submit.`
                        : 'Fill in at least one registration number to send invitations.'}
                    </p>

                    <button
                      type="button"
                      onClick={handleSendInvites}
                      disabled={inviting || !filledMembers.length}
                      className={cn(primaryButton, 'shrink-0')}
                    >
                      {inviting ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Send size={15} />
                      )}
                      {inviting ? 'Sending...' : 'Send invitations'}
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Pending" value={pendingInvites.length} tone="amber" />
                    <MiniStat
                      label="Accepted"
                      value={acceptedInvites.length}
                      tone="emerald"
                    />
                    <MiniStat
                      label="Total invitations"
                      value={invitations.length}
                      tone="sky"
                    />
                  </div>

                  <div className={cn(innerCard, 'p-5')}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={cn(iconBox, 'h-9 w-9', TONES.violet)}>
                          <Users size={16} />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                            Invitation history
                          </h3>
                          <p className={cn('text-xs', muted)}>
                            Track who has been invited
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={loadInvitations}
                        disabled={loadingInvitations}
                        className="text-xs font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-300 dark:hover:text-white"
                      >
                        {loadingInvitations ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>

                    {loadingInvitations && invitations.length === 0 ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-white/10 dark:bg-transparent">
                        <Loader2 size={15} className="animate-spin" /> Loading
                        invitations...
                      </div>
                    ) : invitations.length === 0 ? (
                      <div
                        className={cn(
                          'rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm dark:border-white/10 dark:bg-transparent',
                          muted,
                        )}
                      >
                        No invitations have been sent yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {invitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-transparent sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={cn(iconBox, 'h-9 w-9', TONES.violet)}
                              >
                                <Users size={16} />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                                  {invitation.invitee?.full_name ||
                                    'Registered student'}
                                </p>
                                <p className={cn('mt-0.5 text-xs', muted)}>
                                  Reg. no:{' '}
                                  {invitation.invitee?.registration_number ||
                                    'Not available'}
                                  {invitation.created_at &&
                                    ` · Sent ${new Date(invitation.created_at).toLocaleDateString()}`}
                                </p>
                              </div>
                            </div>

                            <StatusBadge status={invitation.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ───────── STEP 4: Planning ───────── */}
          {step === 4 && (
            <div className="space-y-5 p-5 sm:p-6">
              <div className={cn(innerCard, 'p-5')}>
                <SectionHeading
                  icon={ClipboardList}
                  tone="amber"
                  title="Project planning"
                  description="Define high-level modules. You can add detailed tasks later."
                />

                <InfoNote tone="amber">
                  Modules help structure your work. Permanent storage requires
                  a backend save endpoint — for now they are kept in this form.
                </InfoNote>
              </div>

              <div className="space-y-4">
                {modules.map((module, index) => (
                  <div key={index} className={cn(innerCard, 'p-5')}>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                        <span className={cn(iconBox, 'h-9 w-9', TONES.amber)}>
                          <ClipboardList size={15} />
                        </span>
                        Module {index + 1}
                      </h3>

                      {modules.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setModules((previous) =>
                              previous.filter((_, i) => i !== index),
                            )
                          }
                          className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Field label="Title">
                        <input
                          value={module.title}
                          onChange={(event) =>
                            setModules((previous) =>
                              previous.map((item, i) =>
                                i === index
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className={inputClass}
                          placeholder="e.g. Authentication module"
                        />
                      </Field>

                      <Field label="Description">
                        <textarea
                          rows={2}
                          value={module.description}
                          onChange={(event) =>
                            setModules((previous) =>
                              previous.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      description: event.target.value,
                                    }
                                  : item,
                              ),
                            )
                          }
                          className={cn(inputClass, 'resize-y')}
                          placeholder="What will this module do?"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setModules((previous) => [
                    ...previous,
                    { title: '', description: '' },
                  ])
                }
                className={cn(secondaryButton, 'w-full sm:w-auto')}
              >
                <Plus size={15} /> Add module
              </button>
            </div>
          )}

          {/* ───────── STEP 5: Links ───────── */}
          {step === 5 && (
            <div className="space-y-5 p-5 sm:p-6">
              <div className={cn(innerCard, 'p-5')}>
                <SectionHeading
                  icon={Link2}
                  tone="pink"
                  title="Project links"
                  description="Add GitHub, demo, documentation or design links."
                />

                <InfoNote tone="pink">
                  Links are currently held in this form's state. Permanent
                  storage requires a backend save endpoint.
                </InfoNote>
              </div>

              <div className="space-y-4">
                {links.map((link, index) => {
                  const meta =
                    LINK_TYPE_META[link.link_type] || LINK_TYPE_META.other;
                  const TypeIcon = meta.icon;
                  const patch = (key, value) =>
                    setLinks((previous) =>
                      previous.map((item, i) =>
                        i === index ? { ...item, [key]: value } : item,
                      ),
                    );

                  return (
                    <div key={index} className={cn(innerCard, 'p-5')}>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                          <span
                            className={cn(iconBox, 'h-9 w-9', TONES[meta.tone])}
                          >
                            <TypeIcon size={15} />
                          </span>
                          Link {index + 1}
                          <span
                            className={cn(
                              'ml-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                              TONES[meta.tone],
                            )}
                          >
                            {meta.label}
                          </span>
                        </h3>

                        {links.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setLinks((previous) =>
                                previous.filter((_, i) => i !== index),
                              )
                            }
                            className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Label">
                          <input
                            value={link.label}
                            onChange={(event) =>
                              patch('label', event.target.value)
                            }
                            className={inputClass}
                            placeholder="GitHub repo"
                          />
                        </Field>

                        <Field label="URL">
                          <input
                            type="url"
                            value={link.url}
                            onChange={(event) =>
                              patch('url', event.target.value)
                            }
                            className={inputClass}
                            placeholder="https://…"
                          />
                        </Field>

                        <Field label="Type">
                          <select
                            className={inputClass}
                            value={link.link_type}
                            onChange={(event) =>
                              patch('link_type', event.target.value)
                            }
                          >
                            {Object.entries(LINK_TYPE_META).map(
                              ([value, item]) => (
                                <option key={value} value={value}>
                                  {item.label}
                                </option>
                              ),
                            )}
                          </select>
                        </Field>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() =>
                  setLinks((previous) => [
                    ...previous,
                    { label: '', url: '', link_type: 'github' },
                  ])
                }
                className={cn(secondaryButton, 'w-full sm:w-auto')}
              >
                <Plus size={15} /> Add link
              </button>
            </div>
          )}

          {/* ───────── STEP 6: Review ───────── */}
          {step === 6 && (
            <div className="space-y-5 p-5 sm:p-6">
              <div className={cn(innerCard, 'p-5')}>
                <SectionHeading
                  icon={Send}
                  tone="indigo"
                  title="Review and submit"
                  description="Check your project details before submitting."
                />
              </div>

              {/* Summary grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: 'Title',
                    value: form.title,
                    icon: FileText,
                    tone: 'sky',
                  },
                  {
                    label: 'Type / ownership',
                    value: `${form.project_type} · ${form.ownership_mode}`,
                    icon: Flag,
                    tone: 'violet',
                  },
                  {
                    label: 'Visibility',
                    value:
                      form.visibility === 'private'
                        ? 'Private, creator only'
                        : form.visibility === 'team'
                          ? 'Team only'
                          : 'Faculty visibility',
                    icon: Eye,
                    tone: 'neutral',
                  },
                  {
                    label: 'Technologies',
                    value: `${selectedTechs.length} selected`,
                    icon: Code2,
                    tone: 'violet',
                  },
                  {
                    label: 'Team members',
                    value:
                      form.ownership_mode === 'solo'
                        ? 'Solo project'
                        : `${filledMembers.length} of ${MAX_TEAM_MEMBERS}`,
                    icon: Users,
                    tone: 'emerald',
                  },
                  {
                    label: 'Invitations',
                    value:
                      form.ownership_mode === 'solo'
                        ? 'Solo project'
                        : `${acceptedInvites.length} accepted · ${pendingInvites.length} pending`,
                    icon: UserPlus,
                    tone: 'emerald',
                  },
                  {
                    label: 'Planning modules',
                    value: `${modules.filter((m) => m.title.trim()).length} added`,
                    icon: ClipboardList,
                    tone: 'amber',
                  },
                  {
                    label: 'Links',
                    value: `${links.filter((l) => l.url.trim()).length} added`,
                    icon: Link2,
                    tone: 'pink',
                  },
                ].map((row) => {
                  const Icon = row.icon;

                  return (
                    <div
                      key={row.label}
                      className={cn(innerCard, 'flex items-center gap-3 p-4')}
                    >
                      <span className={cn(iconBox, 'h-10 w-10', TONES[row.tone])}>
                        <Icon size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className={cn('text-xs', muted)}>{row.label}</p>
                        <p className="mt-0.5 truncate text-sm font-medium text-neutral-900 dark:text-white">
                          {row.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {form.ownership_mode === 'team' && filledMembers.length > 0 && (
                <div className={cn(innerCard, 'p-5')}>
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className={cn(iconBox, 'h-9 w-9', TONES.emerald)}>
                      <Users size={16} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                        Team members
                      </h3>
                      <p className={cn('text-xs', muted)}>
                        {filledMembers.length} member
                        {filledMembers.length === 1 ? '' : 's'} added
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white dark:divide-white/[0.06] dark:border-white/10 dark:bg-transparent">
                    {filledMembers.map((member, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                            {member.registration_number}
                          </p>
                          <p className={cn('text-xs', muted)}>
                            {[
                              member.branch,
                              member.roll_number && `Roll ${member.roll_number}`,
                              member.role,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'No extra details'}
                          </p>
                        </div>

                        {member.status === 'sent' && (
                          <StatusBadge status="sent" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.ownership_mode === 'team' && (
                <InfoNote icon={Info} tone="sky" title="Team invitations">
                  Invitations are sent to registered students when you submit.
                  Registration numbers that are not found are skipped, and your
                  project is submitted either way. Members join the team after
                  they accept.
                </InfoNote>
              )}

              <InfoNote icon={ClipboardCheck} tone="emerald">
                By submitting, you confirm that the project information is
                accurate. A faculty supervisor must be assigned through the
                supported supervisor workflow.
              </InfoNote>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 p-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={busy}
                  className={cn(secondaryButton, 'w-full sm:w-auto')}
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => saveDraft(true, true)}
                disabled={busy}
                className={secondaryButton}
              >
                {savingDraft ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save draft
              </button>

              {step < 6 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={busy}
                  className={primaryButton}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Continue
                  {!saving && <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={busy}
                  className={primaryButton}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit project
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <aside className={cn(card, 'p-5 xl:sticky xl:top-6')}>
          <div className="flex items-center gap-2.5">
            <span className={cn(iconBox, 'h-9 w-9', TONES.sky)}>
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Project summary
              </h2>
              <p className={cn('text-xs', muted)}>Your progress at a glance.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-neutral-200 p-3 dark:border-white/10">
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
              {form.title || 'Untitled project'}
            </p>
            <p className={cn('mt-0.5 text-xs capitalize', muted)}>
              {form.project_type} · {form.ownership_mode}
            </p>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className={muted}>Setup progress</span>
              <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                {progressPercent}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <ul className="mt-3 divide-y divide-neutral-100 dark:divide-white/[0.06]">
            <SummaryItem
              done={basicsDone}
              label="Basics"
              value={basicsDone ? 'Complete' : 'Incomplete'}
            />
            <SummaryItem
              done={selectedTechs.length > 0}
              label="Technologies"
              value={`${selectedTechs.length}`}
            />
            <SummaryItem
              done={
                form.ownership_mode === 'solo' || filledMembers.length > 0
              }
              label="Team"
              value={
                form.ownership_mode === 'solo'
                  ? 'Solo'
                  : `${filledMembers.length}/${MAX_TEAM_MEMBERS}`
              }
            />
            <SummaryItem
              done={modules.some((m) => m.title.trim())}
              label="Modules"
              value={`${modules.filter((m) => m.title.trim()).length}`}
            />
            <SummaryItem
              done={links.some((l) => l.url.trim())}
              label="Links"
              value={`${links.filter((l) => l.url.trim()).length}`}
            />
          </ul>

          {form.ownership_mode === 'team' && (
            <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs">
                <Clock3 size={13} className={ICON.amber} />
                <span className={muted}>
                  {acceptedInvites.length} accepted · {pendingInvites.length}{' '}
                  pending
                </span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}