import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FolderOpen,
  Hash,
  CheckSquare,
  Bell,
  Lightbulb,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Plus,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Mail,
} from 'lucide-react';

import { useAuth } from '../../features/auth/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

const TONES = {
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  emerald:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  violet:
    'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  orange:
    'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  neutral:
    'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
};

const ICON = {
  sky: 'text-sky-600 dark:text-sky-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  amber: 'text-amber-600 dark:text-amber-300',
  violet: 'text-violet-600 dark:text-violet-300',
  orange: 'text-orange-600 dark:text-orange-300',
  neutral: 'text-neutral-500 dark:text-neutral-400',
};

const PRIMARY_NAV = [
  { to: '/app/dashboard', label: 'Overview', icon: LayoutDashboard, tone: 'sky' },
  { to: '/app/projects', label: 'My Projects', icon: FolderOpen, tone: 'violet' },
  { to: '/app/groups', label: 'My Groups', icon: Users, tone: 'emerald' },
  { to: '/app/projects/new', label: 'New Project', icon: Plus, tone: 'amber' },
  { to: '/app/projects/join', label: 'Join by ID', icon: Hash, tone: 'sky' },
];

const SECONDARY_NAV = [
  { to: '/app/ideas', label: 'Ideas Library', icon: Lightbulb, tone: 'amber' },
  { to: '/app/tasks', label: 'My Tasks', icon: CheckSquare, tone: 'emerald' },
  { to: '/app/invitations', label: 'Invitations', icon: Mail, tone: 'sky' },
  { to: '/app/notifications', label: 'Notifications', icon: Bell, tone: 'orange' },
];

const ACCOUNT_NAV = [
  { to: '/app/profile', label: 'Profile', icon: User, tone: 'violet' },
  { to: '/app/settings', label: 'Settings', icon: Settings, tone: 'neutral' },
];

const WIDTH_KEY = 'rf-sidebar-width';
const COLLAPSE_KEY = 'rf-sidebar-collapsed';

/** Icon-only rail width */
const SIDEBAR_ICON = 72;
/** Below this → snap to icon-only */
const SIDEBAR_ICON_SNAP = 140;
/** Minimum expanded labels width */
const SIDEBAR_MIN_EXPANDED = 200;
const SIDEBAR_MAX = 380;
const SIDEBAR_DEFAULT = 248;

const scrollbarClass = 'rf-scrollbar overflow-y-auto overflow-x-hidden';

function clampDragWidth(n) {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_ICON, Math.round(n)));
}

function NavSection({ title, items, iconOnly, onNavigate, unreadCount = 0 }) {
  return (
    <div className={cn('mb-5', iconOnly && 'mb-3')}>
      {title && !iconOnly ? (
        <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
          {title}
        </p>
      ) : null}

      {title && iconOnly ? (
        <div className="mx-auto mb-2 h-px w-6 bg-neutral-200 dark:bg-white/10" />
      ) : null}

      <ul className={cn('space-y-0.5', iconOnly && 'space-y-1')}>
        {items.map(({ to, label, icon: Icon, tone = 'neutral' }) => {
          const isNotifications = to === '/app/notifications';
          const showBadge = isNotifications && unreadCount > 0;

          return (
            <li key={to}>
              <NavLink
                to={to}
                end={
                  to === '/app/dashboard' ||
                  to === '/app/groups' ||
                  to === '/app/projects'
                }
                onClick={onNavigate}
                title={
                  iconOnly
                    ? `${label}${showBadge ? ` (${unreadCount} unread)` : ''}`
                    : undefined
                }
                aria-label={
                  isNotifications
                    ? `${label}${showBadge ? `, ${unreadCount} unread` : ''}`
                    : label
                }
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center rounded-xl text-sm font-medium transition-colors duration-150',
                    iconOnly
                      ? 'mx-auto h-10 w-10 justify-center'
                      : 'gap-3 px-2.5 py-2',
                    isActive
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-white/10 dark:text-white'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {!iconOnly ? (
                      <span
                        className={cn(
                          'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
                          TONES[tone],
                          isActive &&
                            'ring-1 ring-neutral-200/80 dark:ring-white/15',
                        )}
                      >
                        <Icon size={15} strokeWidth={1.75} />
                        {showBadge ? (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-neutral-950">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="relative flex shrink-0 items-center justify-center">
                        <Icon
                          size={18}
                          strokeWidth={1.75}
                          className={ICON[tone]}
                        />
                        {showBadge ? (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-neutral-950">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        ) : null}
                      </span>
                    )}

                    {!iconOnly ? (
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate transition-opacity duration-200',
                          'opacity-100',
                        )}
                      >
                        {label}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function AppLayout() {
  const { profile, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [mobileOpen, setMobileOpen] = useState(false);

  /** Explicit collapse from button (true = force icon rail) */
  const [forceCollapsed, setForceCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(WIDTH_KEY));
      if (Number.isFinite(stored) && stored >= SIDEBAR_ICON) {
        return clampDragWidth(stored);
      }
    } catch {
      /* ignore */
    }
    return SIDEBAR_DEFAULT;
  });

  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startW: 0 });

  /** Icon-only when forced OR width dragged narrow */
  const iconOnly = forceCollapsed || sidebarWidth < SIDEBAR_ICON_SNAP;
  const desktopWidth = forceCollapsed
    ? SIDEBAR_ICON
    : iconOnly
      ? SIDEBAR_ICON
      : sidebarWidth;

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.listNotifications(false),
    enabled: Boolean(user),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    staleTime: 5000,
    retry: 1,
  });

  const unreadCount = Array.isArray(notificationsData?.notifications)
    ? notificationsData.notifications.filter((n) => !n.is_read).length
    : 0;

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, forceCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [forceCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(WIDTH_KEY, String(sidebarWidth));
    } catch {
      /* ignore */
    }
  }, [sidebarWidth]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const onPointerMove = useCallback((event) => {
    if (!dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    const next = clampDragWidth(dragRef.current.startW + delta);
    setSidebarWidth(next);
    /* Dragging out of icon range clears force-collapse */
    if (next >= SIDEBAR_MIN_EXPANDED) {
      setForceCollapsed(false);
    }
  }, []);

  const stopResize = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    /* Smooth snap: narrow → icon rail, mid → min expanded */
    setSidebarWidth((w) => {
      if (w < SIDEBAR_ICON_SNAP) {
        setForceCollapsed(true);
        return SIDEBAR_ICON;
      }
      if (w < SIDEBAR_MIN_EXPANDED) {
        setForceCollapsed(false);
        return SIDEBAR_MIN_EXPANDED;
      }
      setForceCollapsed(false);
      return w;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('pointercancel', stopResize);
    };
  }, [onPointerMove, stopResize]);

  function startResize(event) {
    event.preventDefault();
    const startW = forceCollapsed ? SIDEBAR_ICON : sidebarWidth;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startW,
    };
    setIsResizing(true);
    setForceCollapsed(false);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function handleResizeDoubleClick() {
    setForceCollapsed(false);
    setSidebarWidth(SIDEBAR_DEFAULT);
  }

  function toggleCollapse() {
    if (forceCollapsed || iconOnly) {
      setForceCollapsed(false);
      setSidebarWidth((w) =>
        w < SIDEBAR_MIN_EXPANDED ? SIDEBAR_DEFAULT : w,
      );
    } else {
      setForceCollapsed(true);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      queryClient.removeQueries({ queryKey: ['notifications'] });
      navigate('/auth', { replace: true });
    } catch {
      /* keep page */
    }
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  function SidebarBody({ isMobile = false }) {
    const showIconsOnly = isMobile ? false : iconOnly;
    const displayName = profile?.full_name || 'Student';
    const initial = (displayName || user?.email || '?').charAt(0).toUpperCase();

    return (
      <div className="flex h-full flex-col">
        <div
          className={cn(
            'flex shrink-0 items-center border-b border-neutral-200 dark:border-white/10',
            showIconsOnly ? 'flex-col gap-2 px-2 py-3' : 'gap-3 px-3.5 py-3.5',
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            <GraduationCap size={20} strokeWidth={1.75} />
          </span>

          {!showIconsOnly ? (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
                ResearchFlow
              </p>
              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                Student workspace
              </p>
            </div>
          ) : null}

          {!isMobile ? (
            <button
              type="button"
              onClick={toggleCollapse}
              className={cn(
                'flex shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-800 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white',
                showIconsOnly ? 'h-8 w-8' : 'h-9 w-9',
              )}
              title={showIconsOnly ? 'Expand sidebar' : 'Minimize sidebar'}
              aria-label={showIconsOnly ? 'Expand sidebar' : 'Minimize sidebar'}
            >
              {showIconsOnly ? (
                <PanelLeftOpen size={15} />
              ) : (
                <PanelLeftClose size={15} />
              )}
            </button>
          ) : null}
        </div>

        <nav
          className={cn(
            'flex-1 py-3',
            scrollbarClass,
            showIconsOnly ? 'px-1.5' : 'px-2.5',
          )}
        >
          <NavSection
            title="Workspace"
            items={PRIMARY_NAV}
            iconOnly={showIconsOnly}
            onNavigate={closeMobile}
            unreadCount={unreadCount}
          />
          <NavSection
            title="Discover"
            items={SECONDARY_NAV}
            iconOnly={showIconsOnly}
            onNavigate={closeMobile}
            unreadCount={unreadCount}
          />
          <NavSection
            title="Account"
            items={ACCOUNT_NAV}
            iconOnly={showIconsOnly}
            onNavigate={closeMobile}
            unreadCount={unreadCount}
          />
        </nav>

        <div
          className={cn(
            'shrink-0 border-t border-neutral-200 dark:border-white/10',
            showIconsOnly ? 'space-y-2 p-2' : 'p-3',
          )}
        >
          {!showIconsOnly ? (
            <div className="mb-2.5 flex items-center gap-2.5 rounded-xl px-1 py-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200 dark:bg-white/10 dark:ring-white/10">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-200">
                    {initial}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                  {displayName}
                </p>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {user?.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200 dark:bg-white/10 dark:ring-white/10">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-200">
                  {initial}
                </span>
              )}
            </div>
          )}

          <div
            className={cn(
              'flex gap-1.5',
              showIconsOnly ? 'flex-col items-center' : '',
            )}
          >
            <button
              type="button"
              onClick={toggleTheme}
              className={cn(
                'flex items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/[0.05]',
                showIconsOnly ? 'h-9 w-9' : 'h-9 flex-1',
              )}
              title={
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
              }
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={15} className={ICON.amber} />
              ) : (
                <Moon size={15} className={ICON.violet} />
              )}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className={cn(
                'flex items-center justify-center rounded-xl border border-neutral-200 text-red-600 transition hover:border-red-200 hover:bg-red-50 dark:border-white/10 dark:text-red-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/10',
                showIconsOnly ? 'h-9 w-9' : 'h-9 flex-1',
              )}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <style>{`
        .rf-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .rf-scrollbar:hover {
          scrollbar-color: #a3a3a3 transparent;
        }
        .dark .rf-scrollbar:hover {
          scrollbar-color: #737373 transparent;
        }
        .rf-scrollbar::-webkit-scrollbar { width: 4px; }
        .rf-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .rf-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 9999px;
        }
        .rf-scrollbar:hover::-webkit-scrollbar-thumb { background: #a3a3a3; }
        .dark .rf-scrollbar:hover::-webkit-scrollbar-thumb { background: #737373; }
      `}</style>

      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/95 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 dark:border-white/10"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            <GraduationCap size={16} strokeWidth={1.75} />
          </span>
          <span className="truncate font-semibold tracking-tight">
            ResearchFlow
          </span>
        </div>

        <NavLink
          to="/app/projects/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-neutral-900 px-3 text-xs font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          <Plus size={14} />
          New
        </NavLink>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,17.5rem)] flex-col border-r border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-950">
            <button
              type="button"
              onClick={closeMobile}
              className="absolute right-3 top-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 dark:border-white/10"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            <SidebarBody isMobile />
          </aside>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[1600px]">
        <div
          className={cn(
            'sticky top-0 hidden h-screen shrink-0 lg:flex',
            isResizing && 'select-none',
          )}
          style={{
            width: desktopWidth,
            transition: isResizing
              ? 'none'
              : 'width 280ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <aside
            className="h-full min-w-0 flex-1 overflow-hidden border-r border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-950"
            style={{
              width: desktopWidth,
              transition: isResizing
                ? 'none'
                : 'width 280ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <SidebarBody />
          </aside>

          {/* Resize handle — always available so you can drag out of icon mode */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuemin={SIDEBAR_ICON}
            aria-valuemax={SIDEBAR_MAX}
            aria-valuenow={desktopWidth}
            tabIndex={0}
            onPointerDown={startResize}
            onDoubleClick={handleResizeDoubleClick}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setForceCollapsed(false);
                setSidebarWidth((w) =>
                  clampDragWidth(Math.max(SIDEBAR_ICON, (forceCollapsed ? SIDEBAR_ICON : w) - 20)),
                );
              }
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                setForceCollapsed(false);
                setSidebarWidth((w) =>
                  clampDragWidth((forceCollapsed ? SIDEBAR_ICON : w) + 20),
                );
              }
            }}
            title="Drag to resize · Double-click to reset"
            className="group relative z-20 -ml-1.5 w-3 shrink-0 cursor-col-resize touch-none"
          >
            <span
              className={cn(
                'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors duration-150',
                'bg-transparent group-hover:bg-neutral-300 dark:group-hover:bg-white/20',
                isResizing && 'bg-violet-500 dark:bg-violet-400',
              )}
            />
            <span
              className={cn(
                'absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150',
                'bg-neutral-300 opacity-0 group-hover:opacity-100 dark:bg-white/25',
                isResizing &&
                  'h-12 bg-violet-500 opacity-100 dark:bg-violet-400',
              )}
            />
          </div>
        </div>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}