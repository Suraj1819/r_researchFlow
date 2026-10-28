-- Phase 4: reviews, rubrics, ideas

CREATE TABLE IF NOT EXISTS public.review_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '[]',
  -- criteria: [{ "key": "novelty", "label": "Novelty", "max_score": 10 }, ...]
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  revision INT NOT NULL DEFAULT 1,
  decision TEXT NOT NULL DEFAULT 'pending'
    CHECK (decision IN ('pending', 'changes_requested', 'approved', 'rejected')),
  overall_comment TEXT,
  rubric_id UUID REFERENCES public.review_rubrics(id) ON DELETE SET NULL,
  scores JSONB DEFAULT '{}',
  -- scores: { "novelty": 8, "implementation": 7, ... }
  requested_changes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_project ON public.project_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.project_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_decision ON public.project_reviews(decision);

CREATE TABLE IF NOT EXISTS public.project_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  revision_number INT NOT NULL,
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE (project_id, revision_number)
);

CREATE TABLE IF NOT EXISTS public.project_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  problem_statement TEXT,
  description TEXT,
  suggested_features TEXT[] DEFAULT '{}',
  recommended_technologies TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard', 'advanced')),
  estimated_duration TEXT,
  expected_outcome TEXT,
  category_id UUID REFERENCES public.project_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ideas_published ON public.project_ideas(is_published);

CREATE TABLE IF NOT EXISTS public.project_idea_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.project_ideas(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idea_id, student_id)
);

DROP TRIGGER IF EXISTS review_rubrics_updated_at ON public.review_rubrics;
CREATE TRIGGER review_rubrics_updated_at
  BEFORE UPDATE ON public.review_rubrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS project_reviews_updated_at ON public.project_reviews;
CREATE TRIGGER project_reviews_updated_at
  BEFORE UPDATE ON public.project_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS project_ideas_updated_at ON public.project_ideas;
CREATE TRIGGER project_ideas_updated_at
  BEFORE UPDATE ON public.project_ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.review_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_idea_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read rubrics" ON public.review_rubrics;
CREATE POLICY "Authenticated read rubrics"
  ON public.review_rubrics FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Faculty read reviews they own or project members" ON public.project_reviews;
CREATE POLICY "Faculty read reviews they own or project members"
  ON public.project_reviews FOR SELECT TO authenticated
  USING (
    reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_reviews.project_id
        AND pm.student_id = auth.uid()
        AND pm.membership_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Published ideas are public" ON public.project_ideas;
CREATE POLICY "Published ideas are public"
  ON public.project_ideas FOR SELECT
  USING (is_published = true OR author_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own bookmarks" ON public.project_idea_bookmarks;
CREATE POLICY "Users manage own bookmarks"
  ON public.project_idea_bookmarks FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Default rubric
INSERT INTO public.review_rubrics (name, description, criteria, is_default) VALUES
(
  'Standard Academic Rubric',
  'Default evaluation criteria for student projects',
  '[
    {"key":"problem_definition","label":"Problem Definition","max_score":10},
    {"key":"methodology","label":"Methodology & Design","max_score":15},
    {"key":"implementation","label":"Implementation Quality","max_score":20},
    {"key":"innovation","label":"Innovation / Novelty","max_score":10},
    {"key":"documentation","label":"Documentation","max_score":15},
    {"key":"presentation","label":"Presentation & Demo","max_score":10},
    {"key":"teamwork","label":"Team Collaboration","max_score":10},
    {"key":"overall","label":"Overall Impact","max_score":10}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- Sample ideas
INSERT INTO public.project_ideas (title, problem_statement, description, suggested_features, recommended_technologies, difficulty, estimated_duration, expected_outcome, is_published)
VALUES
(
  'Campus Lost & Found Portal',
  'Students lose personal items on campus with no centralized reporting system.',
  'A web portal where students can report lost items and claim found ones, with image matching and notification alerts.',
  ARRAY['Report lost/found items','Image upload','Category filters','Claim workflow','Email notifications'],
  ARRAY['React','Node.js','PostgreSQL','Supabase Storage'],
  'medium',
  '3-6 months',
  'A working portal deployed for campus use with admin moderation.',
  true
),
(
  'Smart Attendance with QR Codes',
  'Manual attendance is time-consuming and prone to proxy attendance.',
  'Generate session QR codes that students scan; system validates location/time and logs attendance.',
  ARRAY['Faculty QR generation','Student scan','Geofence validation','Attendance reports','Export CSV'],
  ARRAY['React Native','Node.js','PostgreSQL','QR libraries'],
  'medium',
  '3-6 months',
  'Mobile-friendly attendance system with analytics dashboard.',
  true
)
ON CONFLICT DO NOTHING;
