import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  UserRound,
  GraduationCap,
  BriefcaseBusiness,
  Palette,
  Bell,
  ShieldCheck,
  Accessibility,
  Camera,
  Save,
  Loader2,
  Check,
  Sun,
  Moon,
  Monitor,
  Mail,
  Globe,
  Github,
  Linkedin,
  Link as LinkIcon,
  Eye,
  EyeOff,
  BellRing,
  MessageSquare,
  CalendarDays,
  FileText,
  LockKeyhole,
  RotateCcw,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

import { useAuth } from '../../features/auth/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

/* -------------------------------------------------------
   Styles (neutral cards, coloured icons) — matches Projects page
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

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]';

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white/40 dark:focus:ring-white/10';

const labelClass =
  'mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300';

const DEFAULT_PREFERENCES = {
  notifications: {
    email: true,
    projectUpdates: true,
    feedback: true,
    deadlines: true,
    announcements: true,
  },
  privacy: {
    showProfile: true,
    showGithub: true,
    showLinkedin: true,
    showPortfolio: true,
  },
  accessibility: {
    reducedMotion: false,
    compactMode: false,
  },
};

function readPreferences() {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const saved = localStorage.getItem('rf-settings-preferences');
    if (!saved) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(saved);
    return {
      notifications: {
        ...DEFAULT_PREFERENCES.notifications,
        ...parsed.notifications,
      },
      privacy: { ...DEFAULT_PREFERENCES.privacy, ...parsed.privacy },
      accessibility: {
        ...DEFAULT_PREFERENCES.accessibility,
        ...parsed.accessibility,
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function readValue(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
}

/* -------------------------------------------------------
   Components
------------------------------------------------------- */

function SectionHeading({ icon: Icon, title, description, tone = 'neutral' }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className={cn(iconBox, 'h-10 w-10', TONES[tone])}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {title}
        </h3>
        <p className={cn('mt-0.5 text-xs', muted)}>{description}</p>
      </div>
    </div>
  );
}

function PreferenceToggle({ icon: Icon, title, description, checked, onChange, tone = 'neutral' }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className={cn(iconBox, 'mt-0.5 h-8 w-8', TONES[tone])}>
            <Icon size={15} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {title}
          </p>
          {description && (
            <p className={cn('mt-1 text-xs leading-5', muted)}>{description}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950',
          checked
            ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
            : 'border-neutral-300 bg-neutral-200 dark:border-white/15 dark:bg-white/10',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform dark:ring-white/10',
            checked
              ? 'translate-x-[22px] dark:bg-neutral-900'
              : 'translate-x-0.5 bg-white',
          )}
        />
      </button>
    </div>
  );
}

function ThemeOption({ value, currentTheme, onSelect, icon: Icon, title, description }) {
  const selected = currentTheme === value;

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={cn(
        'rounded-xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950',
        selected
          ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-white/[0.06]'
          : 'border-neutral-200 hover:border-neutral-300 dark:border-white/10 dark:hover:border-white/20',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            selected
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : TONES.neutral,
          )}
        >
          <Icon size={20} />
        </div>
        {selected && (
          <Check size={18} className="text-neutral-900 dark:text-white" />
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-neutral-900 dark:text-white">
        {title}
      </p>
      <p className={cn('mt-1 text-xs leading-5', muted)}>{description}</p>
    </button>
  );
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [preferences, setPreferences] = useState(readPreferences);
  const [showEmail, setShowEmail] = useState(false);

  const [profileVisible, setProfileVisible] = useState(() =>
    readValue('rf-profile-visible', true),
  );

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      full_name: '',
      bio: '',
      registration_number: '',
      roll_number: '',
      academic_year: '',
      semester: '',
      github_url: '',
      linkedin_url: '',
      portfolio_url: '',
    },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      full_name: profile.full_name || '',
      bio: profile.bio || '',
      registration_number: profile.registration_number || '',
      roll_number: profile.roll_number || '',
      academic_year: profile.academic_year || '',
      semester: profile.semester || '',
      github_url: profile.github_url || '',
      linkedin_url: profile.linkedin_url || '',
      portfolio_url: profile.portfolio_url || '',
    });
    setAvatarPreview(
      profile.avatar_url || profile.avatar || profile.profile_picture || '',
    );
  }, [profile, reset]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'rf-settings-preferences',
        JSON.stringify(preferences),
      );
    } catch {
      toast.error('Could not save preferences in this browser.');
    }
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem('rf-profile-visible', String(profileVisible));
    } catch {
      /* keep for session */
    }
  }, [profileVisible]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      'rf-reduced-motion',
      preferences.accessibility.reducedMotion,
    );
    document.documentElement.classList.toggle(
      'rf-compact-mode',
      preferences.accessibility.compactMode,
    );
    return () => {
      document.documentElement.classList.remove('rf-reduced-motion');
      document.documentElement.classList.remove('rf-compact-mode');
    };
  }, [preferences.accessibility]);

  const updatePreference = (group, key, value) => {
    setPreferences((current) => ({
      ...current,
      [group]: { ...current[group], [key]: value },
    }));
  };

  const saveProfile = async (values) => {
    setSaving(true);
    try {
      const payload = {
        full_name: values.full_name.trim(),
        bio: values.bio.trim(),
        registration_number: values.registration_number.trim(),
        roll_number: values.roll_number.trim(),
        academic_year: values.academic_year,
        semester: values.semester,
        github_url: values.github_url.trim(),
        linkedin_url: values.linkedin_url.trim(),
        portfolio_url: values.portfolio_url.trim(),
      };
      await api.updateProfile(payload);
      if (refreshProfile) await refreshProfile();
      reset(values);
      toast.success('Profile updated successfully.');
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error(
        error?.message || 'Unable to update your profile. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a JPG, PNG or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar size must be less than 2 MB.');
      event.target.value = '';
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result || ''));
      setUploadingAvatar(false);
      toast.success('Photo updated in this session. Save profile to keep it.');
    };
    reader.onerror = () => {
      setUploadingAvatar(false);
      toast.error('Could not read that image. Try another file.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const saveAllPreferences = () => {
    try {
      localStorage.setItem(
        'rf-settings-preferences',
        JSON.stringify(preferences),
      );
      localStorage.setItem('rf-profile-visible', String(profileVisible));
      toast.success('Your preferences have been saved.');
    } catch {
      toast.error('Could not save settings in this browser.');
    }
  };

  const resetPreferences = () => {
    setPreferences({
      notifications: { ...DEFAULT_PREFERENCES.notifications },
      privacy: { ...DEFAULT_PREFERENCES.privacy },
      accessibility: { ...DEFAULT_PREFERENCES.accessibility },
    });
    setProfileVisible(true);
    setTheme('light');
    try {
      localStorage.removeItem('rf-settings-preferences');
      localStorage.setItem('rf-profile-visible', 'true');
    } catch {
      /* state still reset */
    }
    toast.success('Preferences reset to defaults.');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserRound, tone: 'sky' },
    { id: 'appearance', label: 'Appearance', icon: Palette, tone: 'violet' },
    { id: 'notifications', label: 'Notifications', icon: Bell, tone: 'amber' },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheck, tone: 'emerald' },
    {
      id: 'accessibility',
      label: 'Accessibility',
      icon: Accessibility,
      tone: 'orange',
    },
  ];

  const displayName = profile?.full_name || 'Your profile';
  const email = profile?.email || profile?.user?.email || '';

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      {/* Header */}
      <section>
        <div className={cn('mb-3 flex flex-wrap items-center gap-2 text-sm', muted)}>
          <UserRound size={16} className={ICON.violet} />
          <span>Student workspace</span>
          <ChevronRight size={14} />
          <span className="text-neutral-800 dark:text-neutral-200">Settings</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              Settings
            </h1>
            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              Manage your profile, appearance, notifications, privacy and
              accessibility preferences.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (refreshProfile) refreshProfile();
                toast.success('Profile refreshed');
              }}
              className={secondaryButton}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
            <button
              type="button"
              onClick={resetPreferences}
              className={secondaryButton}
            >
              <RotateCcw size={15} />
              Reset preferences
            </button>
          </div>
        </div>
      </section>

      {/* Two column layout */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className={cn(card, 'p-4')}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-lg font-bold text-neutral-700 ring-1 ring-neutral-200 dark:bg-white/10 dark:text-neutral-200 dark:ring-white/10">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                  {displayName}
                </p>
                <p className={cn('mt-1 truncate text-xs', muted)}>
                  {email || 'Account settings'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 text-xs text-neutral-500 dark:bg-white/[0.04] dark:text-neutral-400">
              <span className={cn(iconBox, 'h-6 w-6', TONES.emerald)}>
                <ShieldCheck size={13} />
              </span>
              Personal workspace
            </div>
          </div>

          <nav
            aria-label="Settings navigation"
            className={cn(
              card,
              'flex gap-1.5 overflow-x-auto p-2 lg:flex-col lg:gap-1',
            )}
          >
            {tabs.map(({ id, label, icon: Icon, tone }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:w-full',
                    active
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-white/[0.05]',
                  )}
                >
                  {active ? (
                    <Icon size={17} />
                  ) : (
                    <span className={cn(iconBox, 'h-7 w-7', TONES[tone])}>
                      <Icon size={14} />
                    </span>
                  )}
                  {label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 space-y-5">
          {activeTab === 'profile' && (
            <>
              <section className={card}>
                <div className="p-5 sm:p-6">
                  <SectionHeading
                    icon={UserRound}
                    tone="sky"
                    title="Profile information"
                    description="Update the personal details displayed in your workspace."
                  />

                  <div className="flex flex-col gap-4 border-b border-neutral-100 pb-6 dark:border-white/[0.06] sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-2xl font-bold text-neutral-700 ring-1 ring-neutral-200 dark:bg-white/10 dark:text-neutral-200 dark:ring-white/10">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Your profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                        Profile photo
                      </p>
                      <p className={cn('mt-1 text-xs leading-5', muted)}>
                        JPG, PNG or WebP. Maximum file size: 2 MB.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarSelect}
                      />
                      <button
                        type="button"
                        disabled={uploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(secondaryButton, 'mt-3 min-h-10')}
                      >
                        {uploadingAvatar ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Camera size={16} className={ICON.sky} />
                        )}
                        {uploadingAvatar ? 'Reading...' : 'Change photo'}
                      </button>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSubmit(saveProfile)}
                    className="mt-6 space-y-5"
                  >
                    <div>
                      <label className={labelClass} htmlFor="full_name">
                        Full name
                      </label>
                      <input
                        id="full_name"
                        {...register('full_name', {
                          required: 'Full name is required.',
                        })}
                        className={inputClass}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="bio">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        {...register('bio')}
                        rows={4}
                        maxLength={500}
                        className={cn(inputClass, 'resize-y')}
                        placeholder="Tell us a little about yourself..."
                      />
                      <p className={cn('mt-1.5 text-xs', muted)}>
                        Keep it short and professional.
                      </p>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="account_email">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail
                          size={17}
                          className={cn(
                            'absolute left-3.5 top-1/2 -translate-y-1/2',
                            ICON.sky,
                          )}
                        />
                        <input
                          id="account_email"
                          type={showEmail ? 'text' : 'email'}
                          value={email}
                          readOnly
                          className={cn(inputClass, 'pl-10 pr-11')}
                          placeholder="Email linked to your account"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmail((v) => !v)}
                          aria-label={showEmail ? 'Hide email' : 'Show email'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        >
                          {showEmail ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                      <p className={cn('mt-1.5 text-xs', muted)}>
                        Your account email is read-only on this page.
                      </p>
                    </div>

                    <div className="flex justify-end border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
                      <button
                        type="submit"
                        disabled={saving || uploadingAvatar}
                        className={primaryButton}
                      >
                        {saving ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Save size={17} />
                        )}
                        {saving ? 'Saving profile...' : 'Save profile'}
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              <section className={card}>
                <div className="p-5 sm:p-6">
                  <SectionHeading
                    icon={GraduationCap}
                    tone="violet"
                    title="Academic information"
                    description="Keep your student information up to date."
                  />
                  <form
                    onSubmit={handleSubmit(saveProfile)}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          className={labelClass}
                          htmlFor="registration_number"
                        >
                          Registration number
                        </label>
                        <input
                          id="registration_number"
                          {...register('registration_number')}
                          className={inputClass}
                          placeholder="Registration number"
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="roll_number">
                          Roll number
                        </label>
                        <input
                          id="roll_number"
                          {...register('roll_number')}
                          className={inputClass}
                          placeholder="Roll number"
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="academic_year">
                          Academic year
                        </label>
                        <select
                          id="academic_year"
                          {...register('academic_year')}
                          className={inputClass}
                        >
                          <option value="">Select academic year</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="Final Year">Final Year</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="semester">
                          Semester
                        </label>
                        <select
                          id="semester"
                          {...register('semester')}
                          className={inputClass}
                        >
                          <option value="">Select semester</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <option key={n} value={String(n)}>
                              Semester {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
                      <button
                        type="submit"
                        disabled={saving}
                        className={primaryButton}
                      >
                        {saving ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Save size={17} />
                        )}
                        {saving ? 'Saving...' : 'Save academic details'}
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              <section className={card}>
                <div className="p-5 sm:p-6">
                  <SectionHeading
                    icon={BriefcaseBusiness}
                    tone="emerald"
                    title="Professional links"
                    description="Add your public developer profiles and portfolio."
                  />
                  <form
                    onSubmit={handleSubmit(saveProfile)}
                    className="space-y-5"
                  >
                    <div>
                      <label className={labelClass} htmlFor="github_url">
                        GitHub URL
                      </label>
                      <div className="relative">
                        <Github
                          size={17}
                          className={cn(
                            'absolute left-3.5 top-1/2 -translate-y-1/2',
                            ICON.neutral,
                          )}
                        />
                        <input
                          id="github_url"
                          {...register('github_url')}
                          type="url"
                          className={cn(inputClass, 'pl-10')}
                          placeholder="https://github.com/username"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="linkedin_url">
                        LinkedIn URL
                      </label>
                      <div className="relative">
                        <Linkedin
                          size={17}
                          className={cn(
                            'absolute left-3.5 top-1/2 -translate-y-1/2',
                            ICON.sky,
                          )}
                        />
                        <input
                          id="linkedin_url"
                          {...register('linkedin_url')}
                          type="url"
                          className={cn(inputClass, 'pl-10')}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="portfolio_url">
                        Portfolio URL
                      </label>
                      <div className="relative">
                        <Globe
                          size={17}
                          className={cn(
                            'absolute left-3.5 top-1/2 -translate-y-1/2',
                            ICON.violet,
                          )}
                        />
                        <input
                          id="portfolio_url"
                          {...register('portfolio_url')}
                          type="url"
                          className={cn(inputClass, 'pl-10')}
                          placeholder="https://yourportfolio.com"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
                      <button
                        type="submit"
                        disabled={saving}
                        className={primaryButton}
                      >
                        {saving ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Save size={17} />
                        )}
                        {saving ? 'Saving...' : 'Save links'}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </>
          )}

          {activeTab === 'appearance' && (
            <section className={card}>
              <div className="p-5 sm:p-6">
                <SectionHeading
                  icon={Palette}
                  tone="violet"
                  title="Appearance"
                  description="Choose how ResearchFlow looks on this device."
                />

                <p className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Color theme
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <ThemeOption
                    value="light"
                    currentTheme={theme}
                    onSelect={setTheme}
                    icon={Sun}
                    title="Light"
                    description="Bright and clean workspace."
                  />
                  <ThemeOption
                    value="dark"
                    currentTheme={theme}
                    onSelect={setTheme}
                    icon={Moon}
                    title="Dark"
                    description="A darker, low-glare interface."
                  />
                  <ThemeOption
                    value="system"
                    currentTheme={theme}
                    onSelect={setTheme}
                    icon={Monitor}
                    title="System"
                    description="Follow your device theme."
                  />
                </div>

                <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-start gap-3">
                    <span className={cn(iconBox, 'h-9 w-9', TONES.violet)}>
                      <Palette size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        Theme is applied automatically
                      </p>
                      <p className={cn('mt-1 text-xs leading-5', muted)}>
                        Your selected theme is saved in this browser and applies
                        throughout the app. System mode follows your device&apos;s
                        light or dark preference.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className={card}>
              <div className="p-5 sm:p-6">
                <SectionHeading
                  icon={Bell}
                  tone="amber"
                  title="Notifications"
                  description="Choose which updates you want to see in your workspace."
                />

                <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
                  <PreferenceToggle
                    icon={BellRing}
                    tone="amber"
                    title="Email notifications"
                    description="Allow email notifications where the app supports them."
                    checked={preferences.notifications.email}
                    onChange={(v) =>
                      updatePreference('notifications', 'email', v)
                    }
                  />
                  <PreferenceToggle
                    icon={FileText}
                    tone="sky"
                    title="Project updates"
                    description="Updates to projects you participate in."
                    checked={preferences.notifications.projectUpdates}
                    onChange={(v) =>
                      updatePreference('notifications', 'projectUpdates', v)
                    }
                  />
                  <PreferenceToggle
                    icon={MessageSquare}
                    tone="violet"
                    title="Feedback and comments"
                    description="Feedback from supervisors and project collaborators."
                    checked={preferences.notifications.feedback}
                    onChange={(v) =>
                      updatePreference('notifications', 'feedback', v)
                    }
                  />
                  <PreferenceToggle
                    icon={CalendarDays}
                    tone="orange"
                    title="Deadline reminders"
                    description="Reminders for upcoming project milestones and deadlines."
                    checked={preferences.notifications.deadlines}
                    onChange={(v) =>
                      updatePreference('notifications', 'deadlines', v)
                    }
                  />
                  <PreferenceToggle
                    icon={Bell}
                    tone="emerald"
                    title="Announcements"
                    description="Important notices and workspace announcements."
                    checked={preferences.notifications.announcements}
                    onChange={(v) =>
                      updatePreference('notifications', 'announcements', v)
                    }
                  />
                </div>

                <p
                  className={cn(
                    'mt-4 rounded-xl bg-neutral-50 p-3 text-xs leading-5 dark:bg-white/[0.03]',
                    muted,
                  )}
                >
                  These options save your preferences in this browser. Actual
                  email delivery and notification generation must also be
                  implemented by the application backend.
                </p>

                <div className="mt-5 flex justify-end border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={saveAllPreferences}
                    className={primaryButton}
                  >
                    <Save size={17} />
                    Save preferences
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'privacy' && (
            <section className={card}>
              <div className="p-5 sm:p-6">
                <SectionHeading
                  icon={ShieldCheck}
                  tone="emerald"
                  title="Privacy and visibility"
                  description="Manage your profile visibility and public links."
                />

                <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
                  <PreferenceToggle
                    icon={Eye}
                    tone="sky"
                    title="Profile visibility preference"
                    description="Your preference for making your profile visible."
                    checked={profileVisible}
                    onChange={setProfileVisible}
                  />
                  <PreferenceToggle
                    icon={Github}
                    tone="neutral"
                    title="Show GitHub link"
                    description="Allow your GitHub URL to be displayed where supported."
                    checked={preferences.privacy.showGithub}
                    onChange={(v) =>
                      updatePreference('privacy', 'showGithub', v)
                    }
                  />
                  <PreferenceToggle
                    icon={Linkedin}
                    tone="sky"
                    title="Show LinkedIn link"
                    description="Allow your LinkedIn URL to be displayed where supported."
                    checked={preferences.privacy.showLinkedin}
                    onChange={(v) =>
                      updatePreference('privacy', 'showLinkedin', v)
                    }
                  />
                  <PreferenceToggle
                    icon={LinkIcon}
                    tone="violet"
                    title="Show portfolio link"
                    description="Allow your portfolio URL to be displayed where supported."
                    checked={preferences.privacy.showPortfolio}
                    onChange={(v) =>
                      updatePreference('privacy', 'showPortfolio', v)
                    }
                  />
                </div>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <div className="flex items-start gap-3">
                    <span className={cn(iconBox, 'h-9 w-9', TONES.amber)}>
                      <LockKeyhole size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                        Important privacy note
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-400">
                        These visibility controls currently save preferences
                        only. To enforce profile and link visibility for other
                        users, the relevant profile pages and backend APIs must
                        read and apply these settings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={saveAllPreferences}
                    className={primaryButton}
                  >
                    <Save size={17} />
                    Save privacy settings
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'accessibility' && (
            <section className={card}>
              <div className="p-5 sm:p-6">
                <SectionHeading
                  icon={Accessibility}
                  tone="orange"
                  title="Accessibility"
                  description="Adjust motion and layout preferences for a more comfortable experience."
                />

                <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
                  <PreferenceToggle
                    icon={Accessibility}
                    tone="orange"
                    title="Reduce motion"
                    description="Reduce interface animation and transitions where supported."
                    checked={preferences.accessibility.reducedMotion}
                    onChange={(v) =>
                      updatePreference('accessibility', 'reducedMotion', v)
                    }
                  />
                  <PreferenceToggle
                    icon={Monitor}
                    tone="violet"
                    title="Compact layout"
                    description="Enable a compact-layout preference for supported components."
                    checked={preferences.accessibility.compactMode}
                    onChange={(v) =>
                      updatePreference('accessibility', 'compactMode', v)
                    }
                  />
                </div>

                <p className={cn('mt-4 text-xs leading-5', muted)}>
                  These preferences are saved locally. Individual app components
                  may need additional styling to fully support compact layout.
                </p>

                <div className="mt-5 flex justify-end border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={saveAllPreferences}
                    className={primaryButton}
                  >
                    <Save size={17} />
                    Save accessibility settings
                  </button>
                </div>
              </div>
            </section>
          )}

          <div className={cn(card, 'p-4')}>
            <div className="flex items-start gap-3">
              <span className={cn(iconBox, 'h-9 w-9', TONES.emerald)}>
                <ShieldCheck size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Your settings, your workspace
                </p>
                <p className={cn('mt-1 text-xs leading-5', muted)}>
                  Profile details are saved through your existing profile API.
                  Appearance and preference controls are stored locally in this
                  browser unless your backend is separately configured to sync
                  them.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}