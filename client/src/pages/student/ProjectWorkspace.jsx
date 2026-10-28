import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, Loader2, RefreshCw, FolderKanban, LayoutDashboard, CheckSquare, Users, Code2, FileText, Link2, Activity,
  Plus, Upload, Download, Trash2, Search, CalendarDays, Flag, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, Target, ExternalLink, ChevronDown, ChevronRight, AlertCircle, UserCircle, BookOpen,
  Github, PencilLine, Rocket, Eye, Layers, UserPlus, X, File as FileIcon, Image as ImageIcon,
  FileArchive, FileVideo, FileSpreadsheet, ListChecks, Zap,
  GraduationCap,
  GrabIcon,
  House,
  TreePalm,
  GraduationCapIcon,
  GitGraph,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../features/auth/AuthContext';
import { cn, formatDate } from '../../lib/utils';

/* ───────────────────────── CONFIG ───────────────────────── */

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60';
const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950';
const soft = 'text-neutral-500 dark:text-neutral-400';
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

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';
const secondaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]';

/* Primary navigation (like Achievements "Library") */
const PRIMARY_NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, kind: 'tab', tone: 'sky' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, kind: 'tab', tone: 'emerald' },
  { id: 'team', label: 'Team', icon: Users, kind: 'tab', tone: 'violet' },
];

/* Secondary navigation (like Achievements "Vaults") */
const VAULT_NAV = [
  { id: 'tech', label: 'Technologies', icon: Code2, kind: 'tab', tone: 'sky' },
  { id: 'files', label: 'Files', icon: FileText, kind: 'tab', tone: 'amber' },
  { id: 'links', label: 'Links', icon: Link2, kind: 'tab', tone: 'violet' },
  { id: 'activity', label: 'Activity', icon: Activity, kind: 'tab', tone: 'orange' },
];

const ALL_NAV_ITEMS = [...PRIMARY_NAV, ...VAULT_NAV];

const PRIORITY = {
  low: { label: 'Low', className: 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300' },
  medium: { label: 'Medium', className: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
  high: { label: 'High', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  urgent: { label: 'Urgent', className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' },
};

const HEALTH = {
  on_track: { label: 'On Track', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', dot: 'bg-emerald-500' },
  at_risk: { label: 'At Risk', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', dot: 'bg-amber-500' },
  delayed: { label: 'Delayed', className: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300', dot: 'bg-orange-500' },
  blocked: { label: 'Blocked', className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300', dot: 'bg-red-500' },
  completed: { label: 'Completed', className: 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200', dot: 'bg-neutral-500' },
};

const KANBAN = [
  { id: 'todo', label: 'To Do', accent: 'bg-neutral-400', tone: 'neutral', empty: 'Nothing queued yet' },
  { id: 'in_progress', label: 'In Progress', accent: 'bg-sky-500', tone: 'sky', empty: 'No active work' },
  { id: 'blocked', label: 'Blocked', accent: 'bg-orange-500', tone: 'orange', empty: 'No blockers' },
  { id: 'completed', label: 'Completed', accent: 'bg-emerald-500', tone: 'emerald', empty: 'Nothing completed yet' },
];

const LINK_TYPES = {
  github: { label: 'GitHub', icon: Github },
  demo: { label: 'Demo', icon: Rocket },
  docs: { label: 'Docs', icon: BookOpen },
  design: { label: 'Design', icon: PencilLine },
  video: { label: 'Video', icon: FileVideo },
  other: { label: 'Other', icon: ExternalLink },
};

const FILE_ICONS = [
  { test: (m) => m?.startsWith('image/'), Icon: ImageIcon },
  { test: (m) => m?.startsWith('video/'), Icon: FileVideo },
  { test: (m) => m?.includes('pdf'), Icon: FileText },
  { test: (m) => m?.includes('sheet') || m?.includes('csv') || m?.includes('excel'), Icon: FileSpreadsheet },
  { test: (m) => m?.includes('zip') || m?.includes('rar'), Icon: FileArchive },
  { test: () => true, Icon: FileIcon },
];

const getFileIcon = (mime) => FILE_ICONS.find((c) => c.test(mime)) || FILE_ICONS.at(-1);

function relativeDue(dueDate) {
  if (!dueDate) return null;
  const days = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'overdue' };
  if (days === 0) return { text: 'Due today', tone: 'today' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'soon' };
  if (days <= 7) return { text: `In ${days}d`, tone: 'soon' };
  return { text: formatDate(dueDate), tone: 'normal' };
}

const DUE_TONE = {
  overdue: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  today: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  soon: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  normal: 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300',
};

function formatBytes(b = 0) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function Avatar({ name, src, size = 28 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
      style={{ width: size, height: size }}
      title={name}
    >
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : (
        <span className="text-xs font-semibold">{(name || '?')[0]?.toUpperCase()}</span>
      )}
    </span>
  );
}

function EmptyState({ icon: Icon, title, hint, tone = 'neutral' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className={cn(iconBox, 'h-12 w-12 rounded-2xl', TONES[tone])}>
        <Icon size={22} />
      </div>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{title}</p>
      {hint && <p className={cn('max-w-sm text-xs', muted)}>{hint}</p>}
    </div>
  );
}

function ProgressBar({ value }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.08]">
      <div className="h-full rounded-full bg-neutral-900 transition-all dark:bg-white" style={{ width: `${v}%` }} />
    </div>
  );
}

/* ───────────────────────── SIDEBAR (copied from Achievements style) ───────────────────────── */

function SidebarNavItem({ item, active, onClick, count, mobile }) {
  const Icon = item.icon;
  const tone = item.tone || 'neutral';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex shrink-0 items-center gap-2.5 text-left text-sm transition-colors',
        mobile ? 'rounded-full border px-3.5 py-1.5 text-xs font-medium' : 'w-full rounded-xl px-3 py-2',
        focus,
        active
          ? mobile
            ? 'border-neutral-300 bg-neutral-100 font-medium text-neutral-900 dark:border-white/20 dark:bg-white/10 dark:text-white'
            : 'bg-neutral-100 font-medium text-neutral-900 dark:bg-white/10 dark:text-white'
          : mobile
            ? 'border-neutral-200 bg-white dark:border-white/10 dark:bg-white/5'
            : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-white/5'
      )}
    >
      {mobile ? (
        <Icon size={13} className={cn('shrink-0', ICON[tone])} />
      ) : (
        <span className={cn(iconBox, 'h-7 w-7 rounded-lg', TONES[tone])}>
          <Icon size={14} />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {typeof count === 'number' && count > 0 && (
        <span className={cn('shrink-0 text-[11px] tabular-nums', soft)}>{count}</span>
      )}
    </button>
  );
}

function WorkspaceSidebar({ activeTab, onSelect, counts, mobile = false, projectCode, status, isLeader, memberCount }) {
  if (mobile) {
    return (
      <nav
        aria-label="Workspace navigation"
        className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ALL_NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            active={activeTab === item.id}
            onClick={() => onSelect(item.id)}
            count={counts[item.id]}
            mobile
          />
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label="Workspace navigation" className="flex flex-col gap-0.5">
      <p className="flex items-center gap-2 px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <span className={cn(iconBox, 'h-5 w-5 rounded-md', TONES.sky)}><LayoutDashboard size={11} /></span>
        Library
      </p>
      {PRIMARY_NAV.map((item) => (
        <SidebarNavItem
          key={item.id}
          item={item}
          active={activeTab === item.id}
          onClick={() => onSelect(item.id)}
          count={counts[item.id]}
        />
      ))}
      <div className="my-2 h-px bg-neutral-200 dark:bg-white/10" />
      <p className="flex items-center gap-2 px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <span className={cn(iconBox, 'h-5 w-5 rounded-md', TONES.violet)}><Layers size={11} /></span>
        Project
      </p>
      {VAULT_NAV.map((item) => (
        <SidebarNavItem
          key={item.id}
          item={item}
          active={activeTab === item.id}
          onClick={() => onSelect(item.id)}
          count={counts[item.id]}
        />
      ))}

      {/* Project info footer (like Achievements cloud storage footer) */}
      <div className="mt-3 border-t border-neutral-200 px-3 pt-3 dark:border-white/10">
        {projectCode && (
          <>
            <p className={cn('flex items-center gap-2 text-xs', soft)}>
              <Layers size={14} /> {projectCode}
            </p>
            <p className={cn('mt-1.5 text-xs capitalize', soft)}>
              {status?.replaceAll('_', ' ')} · {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </p>
          </>
        )}
        <p
          className={cn(
            'mt-3 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium',
            isLeader
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', isLeader ? 'bg-emerald-500' : 'bg-neutral-400')} />
          {isLeader ? 'Leader' : 'Member'}
        </p>
      </div>
    </nav>
  );
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const [tab, setTab] = useState('overview');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Task state
  const [taskSearch, setTaskSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [assignMenuTaskId, setAssignMenuTaskId] = useState(null);
  const [focusedColumn, setFocusedColumn] = useState('all'); // all | todo | in_progress | blocked | completed
  const [refreshing, setRefreshing] = useState(false);

  // Files / Links
  const [fileSearch, setFileSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newLink, setNewLink] = useState({ label: '', url: '', link_type: 'github', description: '' });

  /* Queries */
  const { data: projectRes, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: !!projectId,
  });

  const { data: progressRes } = useQuery({
    queryKey: ['progress', projectId],
    queryFn: () => api.getProgress(projectId),
    enabled: !!projectId,
  });

  const { data: tasksRes, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.listTasks(projectId),
    enabled: !!projectId && (tab === 'tasks' || tab === 'overview'),
  });

  const { data: filesRes, refetch: refetchFiles } = useQuery({
    queryKey: ['files', projectId],
    queryFn: () => api.listFiles(projectId),
    enabled: !!projectId && tab === 'files',
  });

  const { data: linksRes, refetch: refetchLinks } = useQuery({
    queryKey: ['links', projectId],
    queryFn: () => api.listLinks(projectId),
    enabled: !!projectId && tab === 'links',
  });

  const { data: activityRes } = useQuery({
    queryKey: ['activity', projectId],
    queryFn: () => api.listActivity(projectId),
    enabled: !!projectId && tab === 'activity',
  });

  /* Mutations */
  const createTaskMutation = useMutation({
    mutationFn: (data) => api.createTask(projectId, data),
    onSuccess: (_d, vars) => {
      const assignee = members.find((m) => m.student_id === vars.assigned_to);
      toast.success(
        vars.assigned_to && assignee
          ? `Task created & assigned to ${assignee.student?.full_name || 'member'}`
          : 'Task created'
      );
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setNewTaskPriority('medium');
      refetchTasks();
      queryClient.invalidateQueries({ queryKey: ['progress', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
    onError: (e) => toast.error(e.message || 'Could not create task'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => api.updateTask(projectId, taskId, data),
    onSuccess: (_d, vars) => {
      refetchTasks();
      queryClient.invalidateQueries({ queryKey: ['progress', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      setAssignMenuTaskId(null);

      if (vars.data?.assigned_to !== undefined) {
        const a = members.find((m) => m.student_id === vars.data.assigned_to);
        toast.success(vars.data.assigned_to && a ? `Assigned to ${a.student?.full_name}` : 'Task unassigned');
      } else if (vars.data?.status) {
        const labels = { todo: 'To Do', in_progress: 'In Progress', blocked: 'Blocked', completed: 'Completed' };
        toast.success(`Moved to ${labels[vars.data.status] || vars.data.status}`);
      }
    },
    onError: (e) => toast.error(e.message || 'Could not update task'),
  });

  /* Handlers */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Max 20 MB');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const urlRes = await api.getUploadUrl(projectId, {
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        file_kind: 'other',
      });
      if (!urlRes.signed_url) {
        toast.error(urlRes.error || 'Storage not ready');
        return;
      }
      const up = await fetch(urlRes.signed_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!up.ok) throw new Error('Upload failed');
      await api.confirmUpload(projectId, {
        storage_path: urlRes.storage_path,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        file_kind: 'other',
      });
      toast.success(`Uploaded “${file.name}”`);
      refetchFiles();
      queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await api.getDownloadUrl(projectId, id);
      window.open(res.url, '_blank');
    } catch (e) {
      toast.error(e.message || 'Download failed');
    }
  };

  const handleDeleteFile = async (id) => {
    if (!confirm('Delete this file permanently?')) return;
    try {
      await api.deleteFile(projectId, id);
      toast.success('File deleted');
      refetchFiles();
    } catch (e) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  const handleAddLink = async () => {
    if (!newLink.label || !newLink.url) return;
    try {
      await api.createLink(projectId, newLink);
      toast.success(`Link “${newLink.label}” added`);
      setNewLink({ label: '', url: '', link_type: 'github', description: '' });
      refetchLinks();
      queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
    } catch (e) {
      toast.error(e?.message || 'Could not add link');
    }
  };

  /* Derived */
  const p = projectRes?.project;
  const progress = progressRes?.progress;
  const allTasks = tasksRes?.tasks || [];
  const members = useMemo(
    () => (p?.members || []).filter((m) => m.membership_status === 'active'),
    [p]
  );
  const isLeader = members.some((m) => m.student_id === user?.id && m.team_role === 'leader');

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (taskSearch) {
        const q = taskSearch.toLowerCase();
        if (!t.title?.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
      }
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && t.assignee) return false;
        if (assigneeFilter !== 'unassigned' && t.assignee?.id !== assigneeFilter) return false;
      }
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [allTasks, taskSearch, priorityFilter, assigneeFilter, statusFilter]);

  const daysLeft = useMemo(() => {
    if (!p?.end_date) return null;
    return Math.ceil((new Date(p.end_date) - new Date()) / 86400000);
  }, [p]);

  const health = HEALTH[progress?.health] || HEALTH.on_track;

  const openTasks = allTasks.filter((t) => t.status !== 'completed');
  const overdueTasks = openTasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date(new Date().toDateString())
  );
  const unassignedTasks = openTasks.filter((t) => !t.assignee);

  const memberWorkload = useMemo(() => {
    return members.map((m) => {
      const assigned = allTasks.filter((t) => t.assignee?.id === m.student_id);
      const done = assigned.filter((t) => t.status === 'completed').length;
      return {
        member: m,
        total: assigned.length,
        done,
        inProgress: assigned.filter((t) => t.status === 'in_progress').length,
        blocked: assigned.filter((t) => t.status === 'blocked').length,
        completion: assigned.length ? Math.round((done / assigned.length) * 100) : 0,
      };
    });
  }, [members, allTasks]);

  const totalFileSize = useMemo(
    () => (filesRes?.files || []).reduce((s, f) => s + (f.size_bytes || 0), 0),
    [filesRes]
  );

  /* Sidebar counts */
  const counts = useMemo(
    () => ({
      overview: undefined,
      tasks: allTasks.length || 0,
      team: members.length || 0,
      tech: (p?.technologies || []).length || 0,
      files: (filesRes?.files || []).length || 0,
      links: (linksRes?.links || []).length || 0,
      activity: (activityRes?.activity || []).length || 0,
    }),
    [allTasks.length, members.length, p, filesRes, linksRes, activityRes]
  );

  /* Loading / Not found */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
        <div className="h-8 w-64 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
        <div className={cn(card, 'h-44 animate-pulse')} />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={cn(card, 'h-24 animate-pulse')} />
          ))}
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className={cn(card, 'mx-auto max-w-lg p-12 text-center')}>
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-base font-semibold text-red-600">Project not found</p>
        <p className="mt-1 text-sm text-neutral-500">You may no longer have access.</p>
        <Link
          to="/app/projects"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-white/10"
        >
          <ArrowLeft size={16} /> Back to projects
        </Link>
      </div>
    );
  }

  /* ───────────────────────── RENDER ───────────────────────── */

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
      {/* Breadcrumb + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex min-w-0 items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          <GraduationCap size={16} className={ICON.violet} />
          <Link to="/app/projects" className="hover:text-neutral-800 dark:hover:text-neutral-200">
            Projects
          </Link>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 -rotate-90" />
          {/* <span className={cn(iconBox, 'h-6 w-6 shrink-0 rounded-md', TONES.violet)}>
            <FolderKanban size={12} />
          </span> */}
          <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">{p.title}</span>
        </nav>
        <button
          type="button"
          disabled={refreshing}
          onClick={async () => {
            if (refreshing) return;
            setRefreshing(true);
            try {
              // Force network refetch from backend (not local cache only)
              await Promise.all([
                queryClient.refetchQueries({
                  queryKey: ['project', projectId],
                  type: 'active',
                }),
                queryClient.refetchQueries({
                  queryKey: ['progress', projectId],
                  type: 'active',
                }),
                queryClient.refetchQueries({
                  queryKey: ['tasks', projectId],
                  type: 'all',
                }),
                queryClient.refetchQueries({
                  queryKey: ['files', projectId],
                  type: 'all',
                }),
                queryClient.refetchQueries({
                  queryKey: ['links', projectId],
                  type: 'all',
                }),
                queryClient.refetchQueries({
                  queryKey: ['activity', projectId],
                  type: 'all',
                }),
              ]);
            } finally {
              setRefreshing(false);
            }
          }}
          className={cn(secondaryButton, 'min-h-9 shrink-0 px-3 text-xs')}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Header (unchanged) */}
      <section className={cn(card, 'overflow-hidden')}>
        <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Link
              to="/app/projects"
              className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]"
            >
              <ArrowLeft size={16} />
            </Link>
            {/* Project icon — left of title */}
            <div className={cn(iconBox, 'mt-0.5 h-11 w-11 shrink-0', TONES.violet)}>
              <FolderKanban size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
                  {p.title}
                </h1>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', health.className)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', health.dot)} />
                  {health.label}
                </span>
                {p.stage && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                    <Layers size={12} />
                    <span className="capitalize">{p.stage.replace('_', ' ')}</span>
                  </span>
                )}
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
                <span className="font-mono text-xs">{p.project_code}</span>
                <span>·</span>
                <span className="capitalize">{p.status?.replaceAll('_', ' ')}</span>
                {p.start_date && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={13} />
                      {formatDate(p.start_date)}
                      {p.end_date ? ` → ${formatDate(p.end_date)}` : ''}
                    </span>
                  </>
                )}
              </p>
              {p.short_description && (
                <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">
                  {p.short_description}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {['draft', 'awaiting_members', 'changes_requested'].includes(p.status) && (
              <Link
                to={`/app/projects/${p.id}/setup`}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 px-3.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]"
              >
                <PencilLine size={15} /> Edit setup
              </Link>
            )}
          </div>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-2 divide-x divide-neutral-100 border-t border-neutral-100 dark:divide-white/[0.06] dark:border-white/[0.06] sm:grid-cols-4">
          {[
            { icon: Users, label: 'Members', value: members.length, hint: `${members.filter((m) => m.team_role === 'leader').length} leader`, tone: 'emerald' },
            { icon: CheckSquare, label: 'Tasks', value: allTasks.length || progress?.total_tasks || 0, hint: `${progress?.completed_tasks || 0} done`, tone: 'sky' },
            { icon: Target, label: 'Progress', value: `${progress?.task_progress ?? 0}%`, hint: `${progress?.completed_milestones || 0}/${progress?.total_milestones || 0} milestones`, tone: 'violet' },
            {
              icon: CalendarDays,
              label: 'Deadline',
              value: daysLeft === null ? '—' : daysLeft < 0 ? `${Math.abs(daysLeft)}d over` : `${daysLeft}d left`,
              hint: p.end_date ? formatDate(p.end_date) : 'No end date',
              tone: daysLeft !== null && daysLeft < 0 ? 'red' : daysLeft !== null && daysLeft <= 7 ? 'amber' : 'amber',
              valueTone: daysLeft !== null && daysLeft < 0 ? 'text-red-600' : daysLeft !== null && daysLeft <= 7 ? 'text-amber-600' : '',
            },
          ].map((item) => (
            <div key={item.label} className="px-4 py-3.5">
              <div className={cn('flex items-center gap-2 text-xs font-medium uppercase tracking-wide', muted)}>
                <span className={cn(iconBox, 'h-6 w-6 rounded-md', TONES[item.tone])}>
                  <item.icon size={13} />
                </span>
                {item.label}
              </div>
              <p className={cn('mt-2 text-lg font-semibold text-neutral-900 dark:text-white', item.valueTone)}>{item.value}</p>
              <p className={cn('mt-0.5 text-xs', muted)}>{item.hint}</p>
            </div>
          ))}
        </div>

        {/* Detailed progress bar */}
        <div className="border-t border-neutral-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={cn(iconBox, 'h-7 w-7 rounded-lg', TONES.violet)}>
                <TrendingUp size={14} />
              </span>
              <div>
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200">
                  Overall progress
                </p>
                <p className={cn('text-[11px]', muted)}>
                  {progress?.completed_tasks || 0} of {progress?.total_tasks || allTasks.length || 0} tasks complete
                  {(progress?.total_milestones || 0) > 0 && (
                    <> · {progress?.completed_milestones || 0}/{progress?.total_milestones || 0} milestones</>
                  )}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-white">
              {progress?.task_progress ?? 0}%
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.08]">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                (progress?.task_progress ?? 0) >= 80
                  ? 'bg-emerald-500'
                  : (progress?.task_progress ?? 0) >= 40
                    ? 'bg-sky-500'
                    : (progress?.task_progress ?? 0) > 0
                      ? 'bg-amber-500'
                      : 'bg-neutral-300 dark:bg-white/20',
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress?.task_progress ?? 0))}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Open', value: openTasks.length, tone: 'sky' },
              { label: 'Overdue', value: overdueTasks.length, tone: overdueTasks.length ? 'red' : 'neutral' },
              { label: 'Unassigned', value: unassignedTasks.length, tone: unassignedTasks.length ? 'amber' : 'neutral' },
              { label: 'Done', value: progress?.completed_tasks || 0, tone: 'emerald' },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', 
                  s.tone === 'sky' ? 'bg-sky-500' :
                  s.tone === 'red' ? 'bg-red-500' :
                  s.tone === 'amber' ? 'bg-amber-500' :
                  s.tone === 'emerald' ? 'bg-emerald-500' : 'bg-neutral-400'
                )} />
                <span className={cn('text-[11px]', muted)}>{s.label}</span>
                <span className="ml-auto text-xs font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two-column layout: sticky sidebar (Achievements style) + content ── */}
      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
        {/* LEFT SIDEBAR — copied from Achievements */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-5 overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className={cn(card, 'p-3')}>
              <WorkspaceSidebar
                activeTab={tab}
                onSelect={setTab}
                counts={counts}
                projectCode={p.project_code}
                status={p.status}
                isLeader={isLeader}
                memberCount={members.length}
              />
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="min-w-0 space-y-5">
          {/* Mobile section nav (Achievements style pills) */}
          <div className="lg:hidden">
            <WorkspaceSidebar
              mobile
              activeTab={tab}
              onSelect={setTab}
              counts={counts}
            />
          </div>

          {/* ═══════════════ OVERVIEW ═══════════════ */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                <section className={cn(card, 'p-5 sm:p-6')}>
                  <div className="mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-neutral-400" />
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Overall progress</h2>
                  </div>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03]">
                      <p className="text-3xl font-semibold text-neutral-900 dark:text-white">
                        {progress?.task_progress ?? 0}%
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">Complete</p>
                    </div>
                    <div className="min-w-0 flex-1 space-y-4">
                      <div>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="text-neutral-500">Tasks</span>
                          <span className="font-semibold">
                            {progress?.completed_tasks || 0}/{progress?.total_tasks || allTasks.length}
                          </span>
                        </div>
                        <ProgressBar value={progress?.task_progress ?? 0} />
                      </div>
                      {progress?.total_milestones > 0 && (
                        <div>
                          <div className="mb-1.5 flex justify-between text-sm">
                            <span className="text-neutral-500">Milestones</span>
                            <span className="font-semibold">
                              {progress.completed_milestones}/{progress.total_milestones}
                            </span>
                          </div>
                          <ProgressBar
                            value={
                              progress.total_milestones
                                ? (progress.completed_milestones / progress.total_milestones) * 100
                                : 0
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className={cn(card, 'p-5 sm:p-6')}>
                  <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Quick insights</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-2.5 dark:bg-white/[0.03]">
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">Open tasks</span>
                      <span className="font-semibold">{openTasks.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-red-50 px-3.5 py-2.5 dark:bg-red-500/10">
                      <span className="text-sm text-red-700 dark:text-red-300">Overdue</span>
                      <span className="font-semibold text-red-700 dark:text-red-300">{overdueTasks.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3.5 py-2.5 dark:bg-amber-500/10">
                      <span className="text-sm text-amber-700 dark:text-amber-300">Unassigned</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-300">{unassignedTasks.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-2.5 dark:bg-white/[0.03]">
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">Team size</span>
                      <span className="font-semibold">{members.length}</span>
                    </div>
                  </div>
                </section>
              </div>

              <section className={cn(card, 'p-5 sm:p-6')}>
                <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Task status breakdown</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {KANBAN.map((col) => {
                    const count = allTasks.filter((t) => t.status === col.id).length;
                    return (
                      <div key={col.id} className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', col.accent)} />
                          <span className="text-xs font-medium text-neutral-500">{col.label}</span>
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* ═══════════════ TASKS ═══════════════ */}
          {tab === 'tasks' && (
            <div className="space-y-5">
              <section className={cn(card, 'p-4 sm:p-5')}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <label className="mb-1.5 block text-xs font-medium text-neutral-500">Task title</label>
                    <input
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                      placeholder="What needs to be done?"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                  </div>
                  {isLeader && (
                    <>
                      <div className="w-full sm:w-44">
                        <label className="mb-1.5 block text-xs font-medium text-neutral-500">Assign to</label>
                        <select
                          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                          value={newTaskAssignee}
                          onChange={(e) => setNewTaskAssignee(e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.student_id} value={m.student_id}>
                              {m.student?.full_name || 'Member'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-36">
                        <label className="mb-1.5 block text-xs font-medium text-neutral-500">Priority</label>
                        <select
                          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value)}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                    onClick={() =>
                      createTaskMutation.mutate({
                        title: newTaskTitle.trim(),
                        priority: newTaskPriority,
                        assigned_to: newTaskAssignee || undefined,
                      })
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                  >
                    {createTaskMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {isLeader && newTaskAssignee ? 'Create & assign' : 'Create task'}
                  </button>
                </div>
              </section>

              <section className={cn(card, 'flex flex-wrap items-center gap-3 p-3.5')}>
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                    placeholder="Search tasks…"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                  />
                </div>
                <select
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                >
                  <option value="all">Anyone</option>
                  <option value="unassigned">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.student_id} value={m.student_id}>
                      {m.student?.full_name || 'Member'}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {KANBAN.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <span className="ml-auto text-xs text-neutral-400">
                  {filteredTasks.length} of {allTasks.length}
                </span>
              </section>

              {/* Status navigation buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFocusedColumn('all')}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition',
                    focusedColumn === 'all'
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]',
                  )}
                >
                  All
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                    focusedColumn === 'all' ? 'bg-white/20' : 'bg-neutral-100 dark:bg-white/10',
                  )}>
                    {filteredTasks.length}
                  </span>
                </button>
                {KANBAN.map((col) => {
                  const n = filteredTasks.filter((t) => t.status === col.id).length;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setFocusedColumn(col.id)}
                      className={cn(
                        'inline-flex min-h-9 items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition',
                        focusedColumn === col.id
                          ? cn('border-transparent text-neutral-900 dark:text-white', TONES[col.tone])
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]',
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full', col.accent)} />
                      {col.label}
                      <span className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                        focusedColumn === col.id ? 'bg-black/10 dark:bg-white/15' : 'bg-neutral-100 dark:bg-white/10',
                      )}>
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className={cn(
                  'grid gap-4',
                  focusedColumn === 'all'
                    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
                    : 'grid-cols-1',
                )}
              >
                {KANBAN.filter((col) => focusedColumn === 'all' || focusedColumn === col.id).map((col) => {
                  const colTasks = filteredTasks.filter((t) => t.status === col.id);
                  const headerTone =
                    col.id === 'todo'
                      ? 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04]'
                      : col.id === 'in_progress'
                        ? 'border-sky-200 bg-sky-50/80 dark:border-sky-500/20 dark:bg-sky-500/[0.08]'
                        : col.id === 'blocked'
                          ? 'border-orange-200 bg-orange-50/80 dark:border-orange-500/20 dark:bg-orange-500/[0.08]'
                          : 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]';
                  return (
                    <div
                      key={col.id}
                      className={cn(
                        'flex min-h-[300px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-neutral-900/50',
                        col.id === 'todo' && 'border-neutral-200 dark:border-white/10',
                        col.id === 'in_progress' && 'border-sky-200/80 dark:border-sky-500/25',
                        col.id === 'blocked' && 'border-orange-200/80 dark:border-orange-500/25',
                        col.id === 'completed' && 'border-emerald-200/80 dark:border-emerald-500/25',
                      )}
                    >
                      {/* Column header — unique colour per status */}
                      <div className={cn('flex items-center justify-between border-b px-3.5 py-3', headerTone)}>
                        <div className="flex items-center gap-2.5">
                          <span className={cn(iconBox, 'h-8 w-8 rounded-xl shadow-sm', TONES[col.tone])}>
                            {col.id === 'todo' && <ListChecks size={15} />}
                            {col.id === 'in_progress' && <Clock size={15} />}
                            {col.id === 'blocked' && <AlertTriangle size={15} />}
                            {col.id === 'completed' && <CheckCircle2 size={15} />}
                          </span>
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-800 dark:text-neutral-100">
                              {col.label}
                            </h3>
                            <p className={cn('text-[10px] font-medium', muted)}>
                              {colTasks.length} {colTasks.length === 1 ? 'task' : 'tasks'}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold tabular-nums shadow-sm',
                          TONES[col.tone],
                        )}>
                          {colTasks.length}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
                        {colTasks.map((t) => {
                          const pr = PRIORITY[t.priority] || PRIORITY.medium;
                          const due = relativeDue(t.due_date);
                          return (
                            <div
                              key={t.id}
                              className="group rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium leading-snug text-neutral-900 dark:text-white">
                                  {t.title}
                                </p>
                                <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase', pr.className)}>
                                  {pr.label}
                                </span>
                              </div>
                              {t.description && (
                                <p className="mt-1.5 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                                  {t.description}
                                </p>
                              )}
                              {due && (
                                <span className={cn('mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium', DUE_TONE[due.tone])}>
                                  <Clock size={11} /> {due.text}
                                </span>
                              )}
                              <div className="mt-2.5 flex items-center justify-between border-t border-neutral-100 pt-2.5 dark:border-white/[0.06]">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  {t.assignee ? (
                                    <>
                                      <Avatar name={t.assignee.full_name} src={t.assignee.avatar_url} size={20} />
                                      <span className="truncate text-xs text-neutral-500">
                                        {t.assignee.full_name?.split(' ')[0]}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-neutral-400">Unassigned</span>
                                  )}
                                </div>
                                {isLeader && (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setAssignMenuTaskId((id) => (id === t.id ? null : t.id))}
                                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
                                    >
                                      <UserPlus size={12} />
                                      {t.assignee ? 'Reassign' : 'Assign'}
                                    </button>
                                    {assignMenuTaskId === t.id && (
                                      <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-neutral-900">
                                        <div className="mb-1 flex items-center justify-between px-2 py-1">
                                          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                                            Assign to
                                          </span>
                                          <button type="button" onClick={() => setAssignMenuTaskId(null)}>
                                            <X size={12} className="text-neutral-400" />
                                          </button>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateTaskMutation.mutate({ taskId: t.id, data: { assigned_to: null } })
                                          }
                                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-neutral-100 dark:hover:bg-white/[0.05]"
                                        >
                                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-[10px] dark:bg-white/10">—</span>
                                          Unassigned
                                        </button>
                                        {members.map((m) => (
                                          <button
                                            key={m.student_id}
                                            type="button"
                                            onClick={() =>
                                              updateTaskMutation.mutate({
                                                taskId: t.id,
                                                data: { assigned_to: m.student_id },
                                              })
                                            }
                                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-neutral-100 dark:hover:bg-white/[0.05]"
                                          >
                                            <Avatar name={m.student?.full_name} src={m.student?.avatar_url} size={20} />
                                            <span className="truncate">{m.student?.full_name || 'Member'}</span>
                                            {t.assignee?.id === m.student_id && (
                                              <CheckCircle2 size={12} className="ml-auto text-emerald-500" />
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {col.id !== 'completed' && (
                                <div className="mt-2 flex flex-wrap gap-1 opacity-0 transition group-hover:opacity-100">
                                  {KANBAN.filter((c) => c.id !== col.id).map((c) => (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() =>
                                        updateTaskMutation.mutate({ taskId: t.id, data: { status: c.id } })
                                      }
                                      className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
                                    >
                                      → {c.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {colTasks.length === 0 && (
                          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-3 py-8 dark:border-white/10 dark:bg-white/[0.02]">
                            <span className={cn(iconBox, 'h-9 w-9 rounded-xl', TONES[col.tone])}>
                              {col.id === 'todo' && <ListChecks size={16} />}
                              {col.id === 'in_progress' && <Clock size={16} />}
                              {col.id === 'blocked' && <AlertTriangle size={16} />}
                              {col.id === 'completed' && <CheckCircle2 size={16} />}
                            </span>
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                              {col.empty}
                            </p>
                            {col.id === 'todo' && isLeader && (
                              <p className={cn('text-center text-[10px]', muted)}>
                                Use the form above to create a task
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════════ TEAM ═══════════════ */}
          {tab === 'team' && (
            <div className="space-y-5">
              {p.project_code && (
                <section className={cn(card, 'flex flex-wrap items-center justify-between gap-4 p-5')}>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Project join code</p>
                    <p className="mt-1 font-mono text-xl font-bold text-neutral-900 dark:text-white">{p.project_code}</p>
                    <p className="mt-1 text-xs text-neutral-500">Share with teammates so they can join.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(p.project_code);
                      toast.success('Code copied');
                    }}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-white/10 dark:bg-neutral-900"
                  >
                    Copy code
                  </button>
                </section>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {memberWorkload.map(({ member: m, total, done, inProgress, completion }) => (
                  <div key={m.id} className={cn(card, 'p-5')}>
                    <div className="flex items-start gap-3">
                      <Avatar name={m.student?.full_name} src={m.student?.avatar_url} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-neutral-900 dark:text-white">
                          {m.student?.full_name || 'Member'}
                        </p>
                        <p className="text-xs text-neutral-500">{m.student?.registration_number || '—'}</p>
                        <span
                          className={cn(
                            'mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                            m.team_role === 'leader'
                              ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
                              : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
                          )}
                        >
                          {m.team_role}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-neutral-50 py-2 dark:bg-white/[0.03]">
                        <p className="text-sm font-bold">{total}</p>
                        <p className="text-[10px] uppercase text-neutral-500">Total</p>
                      </div>
                      <div className="rounded-xl bg-sky-50 py-2 dark:bg-sky-500/10">
                        <p className="text-sm font-bold text-sky-700 dark:text-sky-300">{inProgress}</p>
                        <p className="text-[10px] uppercase text-sky-600">Active</p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 py-2 dark:bg-emerald-500/10">
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{done}</p>
                        <p className="text-[10px] uppercase text-emerald-600">Done</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-neutral-500">Completion</span>
                        <span className="font-semibold">{completion}%</span>
                      </div>
                      <ProgressBar value={completion} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════ TECH ═══════════════ */}
          {tab === 'tech' && (
            <div className="space-y-5">
              {(p.technologies || []).length === 0 ? (
                <section className={cn(card)}>
                  <EmptyState
                    icon={Code2}
                    title="No technologies added"
                    hint="Add your tech stack from Edit setup so reviewers can see what you are using."
                  />
                </section>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(p.technologies || []).map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-sm dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <Code2 size={14} className="text-neutral-500" />
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {t.technology?.name || 'Unknown'}
                      </span>
                      {t.usage_status && (
                        <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium capitalize text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                          {t.usage_status}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ FILES ═══════════════ */}
          {tab === 'files' && (
            <div className="space-y-4">
              <section className={cn(card, 'flex flex-wrap items-center gap-3 p-3.5')}>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900">
                  <Upload size={15} />
                  {uploading ? 'Uploading…' : 'Upload file'}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
                <div className="relative min-w-[180px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                    placeholder="Search files…"
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                  />
                </div>
                <span className="text-xs text-neutral-500">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-200">{formatBytes(totalFileSize)}</span> total
                </span>
              </section>

              <section className={cn(card, 'overflow-hidden')}>
                {(filesRes?.files || []).filter(
                  (f) => !fileSearch || f.original_name?.toLowerCase().includes(fileSearch.toLowerCase())
                ).length > 0 ? (
                  <ul className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
                    {(filesRes?.files || [])
                      .filter((f) => !fileSearch || f.original_name?.toLowerCase().includes(fileSearch.toLowerCase()))
                      .map((f) => {
                        const { Icon } = getFileIcon(f.mime_type);
                        return (
                          <li
                            key={f.id}
                            className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-white/[0.03]"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-white/[0.06]">
                                <Icon size={18} />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                                  {f.original_name}
                                </p>
                                <p className="text-xs text-neutral-400">
                                  {f.uploader?.full_name || 'Unknown'} · {formatDate(f.created_at)}
                                  {f.size_bytes && ` · ${formatBytes(f.size_bytes)}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleDownload(f.id)}
                                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
                              >
                                <Download size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(f.id)}
                                className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <EmptyState icon={FileText} title="No files yet" hint="Upload PDFs, images, docs or zips (max 20 MB)." />
                )}
              </section>
            </div>
          )}

          {/* ═══════════════ LINKS ═══════════════ */}
          {tab === 'links' && (
            <div className="space-y-4">
              <section className={cn(card, 'p-5')}>
                <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Add a new link</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <input
                    className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                    placeholder="Label"
                    value={newLink.label}
                    onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  />
                  <input
                    className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                    placeholder="https://…"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  />
                  <select
                    className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                    value={newLink.link_type}
                    onChange={(e) => setNewLink({ ...newLink, link_type: e.target.value })}
                  >
                    {Object.entries(LINK_TYPES).map(([value, { label }]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <input
                    className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                    placeholder="Description (optional)"
                    value={newLink.description}
                    onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={!newLink.label || !newLink.url}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                  >
                    <Plus size={15} /> Add link
                  </button>
                </div>
              </section>

              {(linksRes?.links || []).length === 0 ? (
                <section className={cn(card)}>
                  <EmptyState icon={Link2} title="No links yet" hint="Add GitHub repos, demos, docs or design files." />
                </section>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(linksRes?.links || []).map((l) => {
                    const cfg = LINK_TYPES[l.link_type] || LINK_TYPES.other;
                    const Icon = cfg.icon;
                    return (
                      <a
                        key={l.id}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(card, 'flex items-start gap-3 p-4 transition hover:border-neutral-300 dark:hover:border-white/20')}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[0.05]">
                          <Icon size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-neutral-900 dark:text-white">{l.label}</p>
                          {l.description && (
                            <p className="mt-0.5 text-xs text-neutral-500">{l.description}</p>
                          )}
                          <p className="mt-1 truncate text-xs text-sky-600 dark:text-sky-400">{l.url}</p>
                        </div>
                        <ExternalLink size={14} className="shrink-0 text-neutral-400" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ ACTIVITY ═══════════════ */}
          {tab === 'activity' && (
            <section className={cn(card, 'p-5')}>
              {(activityRes?.activity || []).length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No activity yet"
                  hint="Updates to tasks, files, members and reviews will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {(activityRes?.activity || []).map((a) => (
                    <div key={a.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-white/[0.06]">
                        <Activity size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-neutral-700 dark:text-neutral-200">
                          <span className="font-semibold">{a.actor?.full_name || 'Someone'}</span>{' '}
                          <span className="text-neutral-500">
                            {a.action?.replace(/\./g, ' ').replace(/_/g, ' ')}
                          </span>
                          {a.metadata?.title && (
                            <span className="font-medium"> — {a.metadata.title}</span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400">{formatDate(a.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}