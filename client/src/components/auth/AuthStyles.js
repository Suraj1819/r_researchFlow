import { cn } from '../../lib/utils';

/* Shared styles for every auth screen (login, register, forgot password...).
   Only icons, chips, and focus rings are coloured. Text stays neutral. */
export const ACCENTS = {
  sky: {
    chip: 'bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
    soft: 'border-sky-200 bg-sky-50/60 dark:border-sky-500/20 dark:bg-sky-500/5',
    icon: 'text-sky-600 dark:text-sky-400',
    focus:
      'focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:focus:border-sky-400 dark:focus:ring-sky-400/10',
  },
  emerald: {
    chip: 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
    soft: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5',
    icon: 'text-emerald-600 dark:text-emerald-400',
    focus:
      'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10',
  },
  violet: {
    chip: 'bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
    soft: 'border-violet-200 bg-violet-50/60 dark:border-violet-500/20 dark:bg-violet-500/5',
    icon: 'text-violet-600 dark:text-violet-400',
    focus:
      'focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:focus:border-violet-400 dark:focus:ring-violet-400/10',
  },
  amber: {
    chip: 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
    soft: 'border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5',
    icon: 'text-amber-600 dark:text-amber-400',
    focus:
      'focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:focus:border-amber-400 dark:focus:ring-amber-400/10',
  },
};

export const labelClass = 'text-sm font-medium text-neutral-800 dark:text-neutral-200';

export function inputClasses(accent, hasError) {
  return cn(
    'w-full rounded-xl border bg-white px-4 py-2.5 [@media(max-height:700px)]:py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-600',
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-red-500/40'
      : cn(
          'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700',
          ACCENTS[accent].focus,
        ),
  );
}