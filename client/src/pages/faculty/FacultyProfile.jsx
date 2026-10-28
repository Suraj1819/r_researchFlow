import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  User,
  Camera,
  Loader2,
  UserRound,
  Save,
  ChevronRight,
  RefreshCw,
  Edit3,
  X,
  Mail,
  Link2,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Eye,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60';

const muted = 'text-neutral-500 dark:text-neutral-400';

const iconBox = 'flex shrink-0 items-center justify-center rounded-xl';

const TONES = {
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  emerald:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber:
    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
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

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]';

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white/40 dark:focus:ring-white/10';

const labelClass =
  'mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300';

const getFormValues = (profile) => ({
  full_name: profile?.full_name || '',
  bio: profile?.bio || '',
  github_url: profile?.github_url || '',
  linkedin_url: profile?.linkedin_url || '',
  portfolio_url: profile?.portfolio_url || '',
});

const professionalLinks = [
  {
    key: 'github_url',
    label: 'GitHub',
    icon: Github,
    tone: 'neutral',
    placeholder: 'https://github.com/username',
  },
  {
    key: 'linkedin_url',
    label: 'LinkedIn',
    icon: Linkedin,
    tone: 'sky',
    placeholder: 'https://linkedin.com/in/username',
  },
  {
    key: 'portfolio_url',
    label: 'Portfolio',
    icon: Globe,
    tone: 'violet',
    placeholder: 'https://your-portfolio.com',
  },
];

export default function FacultyProfile() {
  const { profile, user, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [viewPhotoOpen, setViewPhotoOpen] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const fileRef = useRef(null);
  const photoMenuRef = useRef(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: getFormValues(null),
  });

  useEffect(() => {
    if (profile) {
      reset(getFormValues(profile));
    }
  }, [profile, reset]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        photoMenuRef.current &&
        !photoMenuRef.current.contains(event.target)
      ) {
        setPhotoMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !deletingPhoto) {
        setPhotoMenuOpen(false);
        setViewPhotoOpen(false);
        setConfirmDeleteOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [deletingPhoto]);

  const onSave = async (values) => {
    if (!values.full_name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        full_name: values.full_name.trim(),
        bio: values.bio.trim() || null,
        github_url: values.github_url.trim() || null,
        linkedin_url: values.linkedin_url.trim() || null,
        portfolio_url: values.portfolio_url.trim() || null,
      };

      await api.updateProfile(payload);
      await refreshProfile?.();

      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onAvatar = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !user) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Choose a JPG, PNG, or WebP image');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB');
      event.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/avatar.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

      let avatarUrl;

      if (uploadError) {
        const reader = new FileReader();

        const dataUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Could not read image'));
          reader.readAsDataURL(file);
        });

        if (String(dataUrl).length > 500_000) {
          throw new Error(
            'Storage upload failed. Please use an image under 300 KB or configure the avatars bucket.'
          );
        }

        avatarUrl = dataUrl;
      } else {
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(path);

        avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
      }

      await api.updateProfile({ avatar_url: avatarUrl });
      await refreshProfile?.();

      setPhotoMenuOpen(false);
      setViewPhotoOpen(false);

      toast.success('Profile photo updated');
    } catch (error) {
      console.error('Faculty avatar upload failed:', error);
      toast.error(error?.message || 'Photo upload failed');
    } finally {
      setUploading(false);

      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  // Delete is called only after the custom modal's Delete button is pressed.
  // There is deliberately no window.confirm() or native confirm() here.
  const onDeleteAvatar = async () => {
    if (!user || !profile?.avatar_url || deletingPhoto) return;

    setDeletingPhoto(true);

    try {
      const avatarUrl = profile.avatar_url;

      if (
        avatarUrl.includes('/storage/v1/object/public/avatars/') ||
        avatarUrl.includes('/storage/v1/object/sign/avatars/')
      ) {
        const url = new URL(avatarUrl);
        const marker = '/avatars/';
        const markerIndex = url.pathname.indexOf(marker);

        if (markerIndex !== -1) {
          const storagePath = decodeURIComponent(
            url.pathname.slice(markerIndex + marker.length)
          );

          if (storagePath) {
            const { error } = await supabase.storage
              .from('avatars')
              .remove([storagePath]);

            if (error) throw error;
          }
        }
      }

      await api.updateProfile({ avatar_url: null });
      await refreshProfile?.();

      setPhotoMenuOpen(false);
      setViewPhotoOpen(false);
      setConfirmDeleteOpen(false);

      toast.success('Profile photo deleted');
    } catch (error) {
      console.error('Faculty avatar deletion failed:', error);
      toast.error(error?.message || 'Could not delete profile photo');
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await refreshProfile?.();
      toast.success('Profile refreshed');
    } catch {
      toast.error('Could not refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  const cancelEdit = () => {
    reset(getFormValues(profile));
    setIsEditing(false);
  };

  const openDeleteConfirmation = () => {
    setPhotoMenuOpen(false);
    setViewPhotoOpen(false);
    setConfirmDeleteOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      <section>
        <div
          className={cn(
            'mb-3 flex flex-wrap items-center gap-2 text-sm',
            muted
          )}
        >
          <UserRound size={16} className={ICON.violet} />
          <span>Faculty workspace</span>
          <ChevronRight size={14} />
          <span className="text-neutral-800 dark:text-neutral-200">
            Profile
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              My Profile
            </h1>
            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              Manage your personal information, bio and professional links.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className={secondaryButton}
            >
              <RefreshCw
                size={15}
                className={refreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={primaryButton}
              >
                <Edit3 size={15} />
                Edit profile
              </button>
            ) : (
              <button
                type="button"
                onClick={cancelEdit}
                className={secondaryButton}
              >
                <X size={15} />
                Cancel
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Profile header and photo actions */}
      <section className={cn(card, 'overflow-hidden')}>
        <div className="h-28 bg-gradient-to-r from-violet-500/15 via-sky-500/15 to-emerald-500/15 dark:from-violet-500/10 dark:via-sky-500/10 dark:to-emerald-500/10 sm:h-36" />

        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div
            ref={photoMenuRef}
            className="absolute -top-14 left-5 sm:-top-16 sm:left-8"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setPhotoMenuOpen((open) => !open)}
                className="block h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl ring-1 ring-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-neutral-900 dark:ring-white/10 sm:h-32 sm:w-32"
                aria-label="Open profile photo options"
                aria-expanded={photoMenuOpen}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile?.full_name || 'Faculty profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400 dark:bg-white/10 dark:text-neutral-500">
                    <User size={48} />
                  </div>
                )}
              </button>

              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md transition hover:bg-neutral-50 disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300"
                title="Upload photo"
                aria-label="Upload profile photo"
              >
                {uploading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Camera size={15} />
                )}
              </button>

              {photoMenuOpen && (
                <div className="absolute left-1/2 top-full z-30 mt-3 w-48 -translate-x-1/2 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-neutral-900">
                  {profile?.avatar_url && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoMenuOpen(false);
                        setViewPhotoOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/[0.06]"
                    >
                      <Eye size={16} className={ICON.sky} />
                      See profile
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => {
                      setPhotoMenuOpen(false);
                      fileRef.current?.click();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-200 dark:hover:bg-white/[0.06]"
                  >
                    <Camera size={16} className={ICON.violet} />
                    Upload photo
                  </button>

                  {profile?.avatar_url && (
                    <button
                      type="button"
                      disabled={deletingPhoto}
                      onClick={openDeleteConfirmation}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                      Delete photo
                    </button>
                  )}
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onAvatar}
              />
            </div>
          </div>

          <div className="pt-16 sm:pt-20">
            {isEditing ? (
              <div className="max-w-md">
                <label className={labelClass}>Full name</label>
                <input
                  className={inputClass}
                  placeholder="Your full name"
                  {...register('full_name', {
                    required: 'Full name is required',
                  })}
                />
              </div>
            ) : (
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
                {profile?.full_name || 'Faculty Name'}
              </h2>
            )}

            <div
              className={cn(
                'mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm',
                muted
              )}
            >
              <span className="inline-flex items-center gap-1.5 capitalize">
                <UserRound size={14} className={ICON.violet} />
                {profile?.role || 'Faculty'}
              </span>

              {user?.email && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={14} className={ICON.sky} />
                    <span className="break-all">{user.email}</span>
                  </span>
                </>
              )}
            </div>

            <div className="mt-4 max-w-2xl">
              {isEditing ? (
                <div>
                  <label className={labelClass}>Bio</label>
                  <textarea
                    className={cn(inputClass, 'min-h-24 resize-y')}
                    maxLength={500}
                    placeholder="Write a short introduction about yourself..."
                    {...register('bio')}
                  />
                </div>
              ) : (
                <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {profile?.bio ||
                    'No bio added yet. Click “Edit profile” to add one.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact details */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className={cn(card, 'flex items-center gap-4 p-5')}>
          <div className={cn(iconBox, 'h-11 w-11', TONES.sky)}>
            <Mail size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <p className={cn('text-sm', muted)}>Email address</p>
            <p className="mt-0.5 break-all font-semibold text-neutral-900 dark:text-white">
              {user?.email || '—'}
            </p>
            <p className={cn('mt-1 text-xs', muted)}>
              Linked to your account
            </p>
          </div>
        </div>

        <div className={cn(card, 'flex items-center gap-4 p-5')}>
          <div className={cn(iconBox, 'h-11 w-11', TONES.emerald)}>
            <Link2 size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <p className={cn('text-sm', muted)}>Professional links</p>
            <p className="mt-0.5 font-semibold text-neutral-900 dark:text-white">
              {professionalLinks.filter((item) => profile?.[item.key]).length}{' '}
              links added
            </p>
            <p className={cn('mt-1 text-xs', muted)}>
              GitHub, LinkedIn and Portfolio
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        {/* Professional links */}
        <section className={cn(card, 'p-5 sm:p-6')}>
          <div className="mb-5 flex items-center gap-3">
            <div className={cn(iconBox, 'h-10 w-10', TONES.emerald)}>
              <Link2 size={18} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Professional Links
              </h3>
              <p className={cn('text-xs', muted)}>
                Share your work and professional profiles
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {professionalLinks.map((item) => {
              const Icon = item.icon;
              const value = profile?.[item.key];

              return (
                <div
                  key={item.key}
                  className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span
                      className={cn(iconBox, 'h-9 w-9', TONES[item.tone])}
                    >
                      <Icon size={16} />
                    </span>

                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {item.label}
                    </span>
                  </div>

                  {isEditing ? (
                    <input
                      className={inputClass}
                      type="url"
                      placeholder={item.placeholder}
                      {...register(item.key, {
                        validate: (value) => {
                          if (!value?.trim()) return true;

                          try {
                            const url = new URL(value.trim());

                            return (
                              ['http:', 'https:'].includes(url.protocol) ||
                              'Use a valid HTTP or HTTPS URL'
                            );
                          } catch {
                            return 'Enter a valid URL including https://';
                          }
                        },
                      })}
                    />
                  ) : value ? (
                    <div className="space-y-3">
                      <p className="truncate text-sm text-neutral-600 dark:text-neutral-300">
                        {value.replace(/^https?:\/\//, '')}
                      </p>

                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          secondaryButton,
                          'min-h-9 w-full text-xs'
                        )}
                      >
                        Open
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ) : (
                    <p className={cn('text-sm', muted)}>Not provided</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {isEditing && (
          <div className="sticky bottom-4 z-10 flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className={secondaryButton}
            >
              <X size={15} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className={cn(primaryButton, 'min-h-11 px-6 shadow-lg')}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save changes
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Full-screen photo preview */}
      {viewPhotoOpen && profile?.avatar_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setViewPhotoOpen(false)}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setViewPhotoOpen(false)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close profile photo"
          >
            <X size={20} />
          </button>

          <div
            className="w-full max-w-lg text-center"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Profile photo preview"
          >
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'Faculty profile photo'}
              className="mx-auto max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />

            <p className="mt-4 text-base font-medium text-white">
              {profile.full_name || 'Faculty'}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setViewPhotoOpen(false);
                  fileRef.current?.click();
                }}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
              >
                <Camera size={16} />
                Change photo
              </button>

              <button
                type="button"
                onClick={openDeleteConfirmation}
                disabled={deletingPhoto}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app delete confirmation modal */}
      {confirmDeleteOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deletingPhoto
            ) {
              setConfirmDeleteOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-photo-title"
            className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-neutral-900"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Trash2 size={22} />
            </div>

            <h2
              id="confirm-delete-photo-title"
              className="mt-4 text-center text-lg font-semibold text-neutral-900 dark:text-white"
            >
              Delete profile photo?
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Are you sure you want to delete your profile photo? You can
              upload a new one anytime.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={deletingPhoto}
                onClick={() => setConfirmDeleteOpen(false)}
                className={secondaryButton}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingPhoto}
                onClick={onDeleteAvatar}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingPhoto ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}