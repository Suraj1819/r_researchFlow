import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Code2,
  Filter,
  FolderKanban,
  GraduationCap,
  Layers,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../features/auth/AuthContext';
import { cn } from '../../lib/utils';

/* -------------------------------------------------------
   Styles (neutral cards, coloured icons)
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
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-300',
};

const ICON = {
  sky: 'text-sky-600 dark:text-sky-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  amber: 'text-amber-600 dark:text-amber-300',
  violet: 'text-violet-600 dark:text-violet-300',
};

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200';

const secondaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-white/[0.05]';

const fieldClass =
  'min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:focus:border-white/40 dark:focus:ring-white/10';

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

const DIFFICULTY = {
  easy: { label: 'Easy', tone: 'emerald', order: 0 },
  medium: { label: 'Intermediate', tone: 'sky', order: 1 },
  hard: { label: 'Hard', tone: 'amber', order: 2 },
  advanced: { label: 'Advanced', tone: 'violet', order: 3 },
};

function normalizeDifficulty(value) {
  const difficulty = String(value || 'medium').toLowerCase().trim();

  if (difficulty.includes('beginner') || difficulty === 'easy') return 'easy';
  if (difficulty.includes('intermediate') || difficulty === 'medium') return 'medium';
  if (difficulty.includes('advanced')) return 'advanced';
  if (difficulty.includes('hard') || difficulty.includes('expert')) return 'hard';

  return DIFFICULTY[difficulty] ? difficulty : 'medium';
}

function getDifficulty(idea) {
  return normalizeDifficulty(idea.difficulty || idea.level || idea.difficulty_level);
}

function getCategory(idea) {
  const value = typeof idea.category === 'object' ? idea.category?.name : idea.category;
  return value || idea.category_name || '';
}

function getTechnologies(idea) {
  if (Array.isArray(idea.technologies)) return idea.technologies;
  if (Array.isArray(idea.tech_stack)) return idea.tech_stack;
  return [];
}

function techName(technology) {
  return typeof technology === 'string'
    ? technology
    : technology?.name || technology?.title || 'Technology';
}

function getIdeas(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.ideas)) return response.ideas;
  if (Array.isArray(response?.data?.ideas)) return response.data.ideas;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

/* -------------------------------------------------------
   Components
------------------------------------------------------- */

function SummaryCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <div className={cn(card, 'flex min-w-0 items-start justify-between gap-3 p-5')}>
      <div className="min-w-0">
        <p className={cn('text-sm', muted)}>{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          {value}
        </p>
        <p className={cn('mt-1 text-xs', muted)}>{hint}</p>
      </div>

      <span className={cn(iconBox, 'h-11 w-11', TONES[tone])}>
        <Icon size={19} />
      </span>
    </div>
  );
}

function IdeaSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className={cn(card, 'h-32 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')} />
        ))}
      </div>

      <div className={cn(card, 'h-36 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className={cn(card, 'h-64 animate-pulse bg-neutral-50 dark:bg-white/[0.02]')} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ filtered, onClear }) {
  return (
    <div className={cn(card, 'border-dashed px-5 py-14 text-center')}>
      <div className={cn(iconBox, 'mx-auto h-14 w-14 rounded-2xl', filtered ? TONES.sky : TONES.violet)}>
        {filtered ? <Search size={24} /> : <Lightbulb size={24} />}
      </div>

      <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
        {filtered ? 'No matching ideas' : 'No project ideas available'}
      </h3>

      <p className={cn('mx-auto mt-2 max-w-md text-sm leading-6', muted)}>
        {filtered
          ? 'Try a different search term, category or difficulty level.'
          : 'Project ideas will appear here when they are available.'}
      </p>

      {filtered && (
        <button type="button" onClick={onClear} className={cn(secondaryButton, 'mt-5')}>
          <X size={15} />
          Clear filters
        </button>
      )}
    </div>
  );
}

function IdeaCard({ idea, onUse, isPending }) {
  const difficulty = getDifficulty(idea);
  const meta = DIFFICULTY[difficulty];
  const technologies = getTechnologies(idea);
  const category = getCategory(idea);

  const title = idea.title || idea.name || 'Untitled idea';
  const description =
    idea.problem_statement ||
    idea.description ||
    idea.short_description ||
    'Explore this idea and develop it into a project.';

  return (
    <article className={cn(card, 'flex min-w-0 flex-col overflow-hidden p-5')}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn(iconBox, 'h-11 w-11', TONES[meta.tone])}>
          <Lightbulb size={21} />
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-white/10 dark:text-neutral-200">
          <Target size={12} className={ICON[meta.tone]} />
          {meta.label}
        </span>
      </div>

      <div className="mt-4 min-w-0 flex-1">
        <h3 className="break-words text-base font-semibold text-neutral-900 dark:text-white">
          {title}
        </h3>

        <p className={cn('mt-2 line-clamp-3 break-words text-sm leading-6', muted)}>
          {description}
        </p>

        {category && (
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <Layers size={15} className={cn('shrink-0', ICON.amber)} />
            <span className="break-words">{category}</span>
          </div>
        )}

        {technologies.length > 0 && (
          <div className="mt-4">
            <div className={cn('mb-2 flex items-center gap-1.5 text-xs font-medium', muted)}>
              <Code2 size={13} className={ICON.violet} />
              Suggested technologies
            </div>

            <div className="flex flex-wrap gap-1.5">
              {technologies.slice(0, 5).map((technology, index) => (
                <span
                  key={`${techName(technology)}-${index}`}
                  className="max-w-full truncate rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 dark:border-white/10 dark:text-neutral-300"
                >
                  {techName(technology)}
                </span>
              ))}

              {technologies.length > 5 && (
                <span className={cn('rounded-lg border border-neutral-200 px-2.5 py-1 text-xs dark:border-white/10', muted)}>
                  +{technologies.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-neutral-100 pt-4 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={() => onUse(idea)}
          disabled={isPending}
          className={cn(primaryButton, 'w-full')}
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />}
          Use this idea
          {!isPending && <ArrowRight size={15} />}
        </button>
      </div>
    </article>
  );
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */

const DIFFICULTY_FILTERS = [
  { value: 'all', label: 'All levels' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Intermediate' },
  { value: 'hard', label: 'Hard' },
  { value: 'advanced', label: 'Advanced' },
];

export default function IdeasPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated ?? true;

  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort, setSort] = useState('default');

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['ideas'],
    queryFn: () => api.listIdeas(),
    enabled: isAuthenticated,
  });

  const ideas = useMemo(() => getIdeas(data), [data]);

  const categories = useMemo(
    () => [...new Set(ideas.map(getCategory).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [ideas],
  );

  const stats = useMemo(
    () => ({
      total: ideas.length,
      easy: ideas.filter((idea) => getDifficulty(idea) === 'easy').length,
      medium: ideas.filter((idea) => getDifficulty(idea) === 'medium').length,
      advanced: ideas.filter((idea) => ['hard', 'advanced'].includes(getDifficulty(idea))).length,
      categories: categories.length,
    }),
    [ideas, categories],
  );

  const filteredIdeas = useMemo(() => {
    const term = search.trim().toLowerCase();

    const list = ideas.filter((idea) => {
      if (difficultyFilter !== 'all' && getDifficulty(idea) !== difficultyFilter) return false;
      if (categoryFilter !== 'all' && getCategory(idea) !== categoryFilter) return false;
      if (!term) return true;

      const searchable = [
        idea.title,
        idea.name,
        idea.problem_statement,
        idea.description,
        idea.short_description,
        getCategory(idea),
        ...getTechnologies(idea).map(techName),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(term);
    });

    if (sort === 'az') {
      return [...list].sort((a, b) =>
        String(a.title || a.name || '').localeCompare(String(b.title || b.name || '')),
      );
    }

    if (sort === 'easiest') {
      return [...list].sort((a, b) => DIFFICULTY[getDifficulty(a)].order - DIFFICULTY[getDifficulty(b)].order);
    }

    if (sort === 'hardest') {
      return [...list].sort((a, b) => DIFFICULTY[getDifficulty(b)].order - DIFFICULTY[getDifficulty(a)].order);
    }

    return list;
  }, [ideas, search, difficultyFilter, categoryFilter, sort]);

  const useIdeaMutation = useMutation({
    mutationFn: (ideaId) => api.useIdea(ideaId),
    onSuccess: (response) => {
      toast.success('Project created from idea');

      if (response?.project?.id) {
        navigate(`/app/projects/${response.project.id}/setup`);
      } else {
        navigate('/app/projects');
      }
    },
    onError: (mutationError) => {
      toast.error(mutationError?.message || 'Could not use this idea');
    },
  });

  const hasFilters =
    Boolean(search.trim()) || difficultyFilter !== 'all' || categoryFilter !== 'all';

  function clearFilters() {
    setSearch('');
    setDifficultyFilter('all');
    setCategoryFilter('all');
  }

  async function handleRefresh() {
    const result = await refetch();
    if (result.isError) toast.error('Could not refresh project ideas');
  }

  const dash = isLoading || isError;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8 sm:space-y-8">
      {/* Header */}
      <section>
        <div className={cn('mb-3 flex flex-wrap items-center gap-2 text-sm', muted)}>
          <Lightbulb size={20} className={ICON.amber} />
          <span>Ideas Library</span>
          <ChevronRight size={14} />
          <span className="text-neutral-800 dark:text-neutral-200">Project ideas</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              Project ideas
            </h1>
            <p className={cn('mt-2 max-w-2xl text-sm leading-6', muted)}>
              Discover project topics, explore technologies and turn a promising idea into your next project.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button type="button" onClick={handleRefresh} disabled={isFetching} className={secondaryButton}>
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>

            <Link to="/app/projects/new" className={primaryButton}>
              <Plus size={16} />
              New project
            </Link>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <SummaryCard label="Total ideas" value={dash ? '—' : stats.total} hint="Available project topics" icon={Lightbulb} tone="violet" />
        <SummaryCard label="Easy ideas" value={dash ? '—' : stats.easy} hint="A good starting point" icon={Sparkles} tone="emerald" />
        <SummaryCard label="Intermediate" value={dash ? '—' : stats.medium} hint="Build practical skills" icon={Code2} tone="sky" />
        <SummaryCard
          label="Categories"
          value={dash ? '—' : stats.categories}
          hint={`${dash ? '—' : stats.advanced} hard or advanced`}
          icon={FolderKanban}
          tone="amber"
        />
      </section>

      {/* Error */}
      {isError && (
        <div className={cn(card, 'flex items-start gap-3 p-4 text-sm')}>
          <span className={cn(iconBox, 'h-9 w-9', TONES.red)}>
            <AlertCircle size={17} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-neutral-900 dark:text-white">Unable to load project ideas</p>
            <p className={cn('mt-1 break-words', muted)}>
              {error?.message || 'Something went wrong while loading ideas.'}
            </p>
            <button type="button" onClick={handleRefresh} disabled={isFetching} className={cn(secondaryButton, 'mt-3 min-h-9 px-3 text-xs')}>
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <section className={cn(card, 'space-y-4 p-4 sm:p-5')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={cn(iconBox, 'h-9 w-9', TONES.sky)}>
              <Filter size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Find an idea</h2>
              <p className={cn('text-sm', muted)}>Search topics or filter by category and difficulty.</p>
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            >
              <X size={14} />
              Clear all
            </button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_180px]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, description, category or technology..."
              className={cn(fieldClass, 'pl-9')}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className={fieldClass}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className={fieldClass}
            aria-label="Sort ideas"
          >
            <option value="default">Default order</option>
            <option value="az">Title A to Z</option>
            <option value="easiest">Easiest first</option>
            <option value="hardest">Hardest first</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('mr-1 inline-flex items-center gap-1.5 text-xs font-medium', muted)}>
            <Target size={14} className={ICON.amber} />
            Difficulty
          </span>

          {DIFFICULTY_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setDifficultyFilter(item.value)}
              aria-pressed={difficultyFilter === item.value}
              className={cn(
                'min-h-9 rounded-xl px-3.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400',
                difficultyFilter === item.value
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Ideas */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className={cn(iconBox, 'h-9 w-9', TONES.emerald)}>
            <BookOpen size={17} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
              Explore ideas
            </h2>
            <p className={cn('text-sm', muted)}>
              {isLoading ? 'Loading project ideas...' : `${filteredIdeas.length} of ${ideas.length} ideas`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <IdeaSkeleton />
        ) : isError ? null : filteredIdeas.length === 0 ? (
          <EmptyState filtered={hasFilters} onClear={clearFilters} />
        ) : (
          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredIdeas.map((idea, index) => (
              <IdeaCard
                key={idea.id ?? idea.slug ?? `${idea.title || idea.name}-${index}`}
                idea={idea}
                onUse={(item) => {
                  if (!item.id) {
                    toast.error('This idea does not have a valid ID');
                    return;
                  }

                  useIdeaMutation.mutate(item.id);
                }}
                isPending={useIdeaMutation.isPending && useIdeaMutation.variables === idea.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}