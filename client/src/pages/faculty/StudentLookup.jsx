
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Search,
  Loader2,
  GraduationCap,
  Link2,
  UserRound,
  ChevronRight,
  RefreshCw,
  Mail,
  BookOpen,
  CalendarDays,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Hash,
  Building2,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

const card =
  'rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60';

const muted = 'text-neutral-500 dark:text-neutral-400';

const iconBox =
  'flex shrink-0 items-center justify-center rounded-xl';

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
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white/40 dark:focus:ring-white/10';

const labelClass =
  'mb-1.5 block text-xs font-medium text-neutral-700 dark:text-neutral-300';

const professionalLinks = [
  {
    key: 'github_url',
    label: 'GitHub',
    icon: Github,
    tone: 'neutral',
  },
  {
    key: 'linkedin_url',
    label: 'LinkedIn',
    icon: Linkedin,
    tone: 'sky',
  },
  {
    key: 'portfolio_url',
    label: 'Portfolio',
    icon: Globe,
    tone: 'violet',
  },
];

const getString = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (
    typeof value === 'object' ||
    typeof value === 'function'
  ) {
    return '';
  }

  return String(value);
};

const normalize = (value) =>
  getString(value).trim().toLowerCase();

const isRecord = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value);

const getStudentArray = (response) => {
  if (Array.isArray(response)) return response;

  if (!isRecord(response)) return [];

  const possibleArrays = [
    response.students,
    response.profiles,
    response.results,
    response.data,
    response.users,
    response.items,
    response.data?.students,
    response.data?.profiles,
    response.data?.results,
    response.data?.users,
    response.data?.items,
    response.data?.data,
  ];

  for (const items of possibleArrays) {
    if (Array.isArray(items)) return items;
  }

  const possibleStudents = [
    response.student,
    response.profile,
    response.user,
    response.data?.student,
    response.data?.profile,
    response.data?.user,
    response.data?.data?.student,
    response.data?.data?.profile,
  ];

  for (const item of possibleStudents) {
    if (isRecord(item)) return [item];
  }

  // Some APIs return a single student object directly.
  if (
    response.registration_number !== undefined ||
    response.roll_number !== undefined
  ) {
    return [response];
  }

  return [];
};

const getDepartment = (student) => {
  const department =
    student?.department_name ??
    student?.department?.name ??
    student?.department ??
    student?.department_id;

  return typeof department === 'object'
    ? getString(department?.name ?? department?.department_name)
    : getString(department);
};

const getInitials = (name) => {
  const words = getString(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return 'ST';

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

function DetailCard({ icon: Icon, tone, label, value }) {
  return (
    <div className={cn(card, 'flex min-w-0 items-center gap-4 p-5')}>
      <div className={cn(iconBox, 'h-11 w-11', TONES[tone])}>
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <p className={cn('text-sm', muted)}>{label}</p>
        <p className="mt-0.5 break-words font-semibold text-neutral-900 dark:text-white">
          {getString(value) || '—'}
        </p>
      </div>
    </div>
  );
}

function InformationField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className={labelClass}>{label}</p>
      <div className="min-h-11 break-words rounded-xl bg-neutral-50 px-3.5 py-3 text-sm text-neutral-800 dark:bg-white/[0.04] dark:text-neutral-200">
        {getString(value) || '—'}
      </div>
    </div>
  );
}

function ProfileLinkCard({ item, value }) {
  const Icon = item.icon;

  const safeUrl = (() => {
    const url = getString(value).trim();

    if (!url) return '';

    try {
      const parsed = new URL(
        /^https?:\/\//i.test(url) ? url : `https://${url}`
      );

      return ['http:', 'https:'].includes(parsed.protocol)
        ? parsed.href
        : '';
    } catch {
      return '';
    }
  })();

  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={cn(iconBox, 'h-9 w-9', TONES[item.tone])}>
          <Icon size={16} />
        </span>

        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {item.label}
        </span>
      </div>

      {safeUrl ? (
        <div className="space-y-3">
          <p className="break-all text-sm text-neutral-600 dark:text-neutral-300">
            {safeUrl.replace(/^https?:\/\//i, '')}
          </p>

          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(secondaryButton, 'min-h-9 w-full text-xs')}
          >
            Open profile
            <ExternalLink size={12} />
          </a>
        </div>
      ) : (
        <p className={cn('text-sm', muted)}>Not provided</p>
      )}
    </div>
  );
}

function StudentProfile({ student }) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const department = getDepartment(student);

  const avatarUrl = getString(student?.avatar_url);

  const otherFields = [
    ['User ID', student?.id],
    ['Role', student?.role],
    ['Email', student?.email],
    ['Phone', student?.phone ?? student?.phone_number],
    ['Department ID', student?.department_id],
    ['Academic Year', student?.academic_year],
    ['Semester', student?.semester],
    ['Created At', student?.created_at],
    ['Updated At', student?.updated_at],
  ].filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      value !== ''
  );

  return (
    <div className="space-y-6">
      <section className={cn(card, 'overflow-hidden')}>
        <div className="h-28 bg-gradient-to-r from-violet-500/15 via-sky-500/15 to-emerald-500/15 dark:from-violet-500/10 dark:via-sky-500/10 dark:to-emerald-500/10 sm:h-36" />

        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="absolute -top-14 left-5 sm:-top-16 sm:left-8">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-neutral-100 text-3xl font-semibold text-neutral-500 shadow-xl ring-1 ring-neutral-200 dark:border-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-white/10 sm:h-32 sm:w-32">
              {avatarUrl && !avatarFailed ? (
                <img
                  src={avatarUrl}
                  alt={getString(student?.full_name) || 'Student profile'}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                getInitials(student?.full_name)
              )}
            </div>
          </div>

          <div className="pt-16 sm:pt-20">
            <h2 className="break-words text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              {getString(student?.full_name) || 'Student'}
            </h2>

            <div className={cn('mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm', muted)}>
              <span className="capitalize">
                {getString(student?.role) || 'Student'}
              </span>

              {student?.email && (
                <>
                  <span>·</span>
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Mail size={13} className={ICON.sky} />
                    <span className="break-all">{student.email}</span>
                  </span>
                </>
              )}
            </div>

            {student?.bio ? (
              <p className="mt-4 max-w-3xl whitespace-pre-wrap break-words text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {student.bio}
              </p>
            ) : (
              <p className={cn('mt-4 text-sm', muted)}>
                No bio provided.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailCard
          icon={BookOpen}
          tone="sky"
          label="Registration No."
          value={student?.registration_number}
        />

        <DetailCard
          icon={Hash}
          tone="violet"
          label="Roll Number"
          value={student?.roll_number}
        />

        <DetailCard
          icon={CalendarDays}
          tone="emerald"
          label="Academic Year"
          value={student?.academic_year}
        />

        <DetailCard
          icon={GraduationCap}
          tone="amber"
          label="Semester"
          value={student?.semester}
        />
      </section>

      <section className={cn(card, 'p-5 sm:p-6')}>
        <div className="mb-5 flex items-center gap-3">
          <div className={cn(iconBox, 'h-10 w-10', TONES.violet)}>
            <GraduationCap size={18} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Academic Information
            </h3>
            <p className={cn('text-xs', muted)}>
              Student identifiers and academic details
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InformationField label="Full Name" value={student?.full_name} />
          <InformationField label="Email Address" value={student?.email} />
          <InformationField label="Registration Number" value={student?.registration_number} />
          <InformationField label="Roll Number" value={student?.roll_number} />
          <InformationField label="Academic Year" value={student?.academic_year} />
          <InformationField label="Semester" value={student?.semester} />
          <InformationField label="Department" value={department} />
          <InformationField label="Department ID" value={student?.department_id} />
        </div>
      </section>

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
              Public profiles and portfolio
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {professionalLinks.map((item) => (
            <ProfileLinkCard
              key={item.key}
              item={item}
              value={getString(student?.[item.key])}
            />
          ))}
        </div>
      </section>

      {otherFields.length > 0 && (
        <section className={cn(card, 'p-5 sm:p-6')}>
          <div className="mb-5 flex items-center gap-3">
            <div className={cn(iconBox, 'h-10 w-10', TONES.orange)}>
              <ClipboardList size={18} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Additional Profile Information
              </h3>
              <p className={cn('text-xs', muted)}>
                Other fields returned by the API
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherFields.map(([label, value]) => (
              <InformationField
                key={label}
                label={label}
                value={value}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function StudentLookup() {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (event) => {
    event.preventDefault();

    const registration = registrationNumber.trim();
    const roll = rollNumber.trim();

    if (!registration || !roll) {
      toast.error('Enter both registration number and roll number.');
      return;
    }

    setLoading(true);
    setSearched(true);
    setStudent(null);

    try {
      
      const response = await api.getStudentByIdentifiers(
  registration,
  roll,
);
      const students = getStudentArray(response);

      const match = students.find((item) => {
        const registrationMatches =
          normalize(item?.registration_number) === normalize(registration);

        const rollMatches =
          normalize(item?.roll_number) === normalize(roll);

        return registrationMatches && rollMatches;
      });

      if (!match) {
        toast.error(
          'No student found matching both registration number and roll number.'
        );
        return;
      }

      setStudent(match);
      toast.success('Student profile loaded.');
    } catch (error) {
      console.error('[Student Lookup] Search failed:', error);

      toast.error(error?.message || 'Unable to fetch student details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (loading) return;

    setRegistrationNumber('');
    setRollNumber('');
    setStudent(null);
    setSearched(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      <section>
        <div className={cn('mb-3 flex flex-wrap items-center gap-2 text-sm', muted)}>
          <UserRound size={16} className={ICON.violet} />
          <span>Faculty workspace</span>
          <ChevronRight size={14} />
          <span className="text-neutral-800 dark:text-neutral-200">
            Student Lookup
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              Student Lookup
            </h1>

            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              Find a student using their registration number and roll number
              to view the profile and academic information returned by the system.
            </p>
          </div>

          {student && (
            <button
              type="button"
              onClick={handleReset}
              className={secondaryButton}
            >
              <RefreshCw size={15} />
              New search
            </button>
          )}
        </div>
      </section>

      <section className={cn(card, 'p-5 sm:p-6')}>
        <div className="mb-5 flex items-center gap-3">
          <div className={cn(iconBox, 'h-10 w-10', TONES.sky)}>
            <Search size={18} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Search Student
            </h2>
            <p className={cn('text-xs', muted)}>
              Both identifiers must match the same student.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="registration-number" className={labelClass}>
                Registration Number
              </label>

              <input
                id="registration-number"
                type="text"
                autoComplete="off"
                value={registrationNumber}
                onChange={(event) => setRegistrationNumber(event.target.value)}
                placeholder="Enter registration number"
                className={inputClass}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="roll-number" className={labelClass}>
                Roll Number
              </label>

              <input
                id="roll-number"
                type="text"
                autoComplete="off"
                value={rollNumber}
                onChange={(event) => setRollNumber(event.target.value)}
                placeholder="Enter roll number"
                className={inputClass}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className={primaryButton}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Find student
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className={secondaryButton}
            >
              <RefreshCw size={15} />
              Clear
            </button>
          </div>
        </form>
      </section>

      {loading && (
        <section className={cn(card, 'flex flex-col items-center px-5 py-16 text-center')}>
          <div className={cn(iconBox, 'h-14 w-14', TONES.sky)}>
            <Loader2 size={26} className="animate-spin" />
          </div>

          <h2 className="mt-4 font-semibold text-neutral-900 dark:text-white">
            Fetching student details
          </h2>

          <p className={cn('mt-2 text-sm', muted)}>
            Searching the student directory...
          </p>
        </section>
      )}

      {!loading && student && (
        <>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 size={17} />
            <span>Student found. Displaying available profile information.</span>
          </div>

          <StudentProfile
            key={student.id || `${student.registration_number}-${student.roll_number}`}
            student={student}
          />
        </>
      )}

      {!loading && searched && !student && (
        <section className={cn(card, 'px-5 py-12 text-center sm:px-8')}>
          <div className={cn(iconBox, 'mx-auto h-14 w-14', TONES.amber)}>
            <AlertCircle size={25} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
            Student not found
          </h2>

          <p className={cn('mx-auto mt-2 max-w-md text-sm leading-6', muted)}>
            No result matched both identifiers. Check the registration number
            and roll number and try again.
          </p>

          <button
            type="button"
            onClick={() => setSearched(false)}
            className={cn(secondaryButton, 'mt-5')}
          >
            <Search size={15} />
            Try again
          </button>
        </section>
      )}

      {!loading && !searched && !student && (
        <section className={cn(card, 'px-5 py-12 text-center sm:px-8')}>
          <div className={cn(iconBox, 'mx-auto h-14 w-14', TONES.violet)}>
            <UserRound size={25} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
            Search for a student
          </h2>

          <p className={cn('mx-auto mt-2 max-w-md text-sm leading-6', muted)}>
            Enter both identifiers above. Once a matching student is found,
            their available profile details will appear here.
          </p>
        </section>
      )}
    </div>
  );
}
