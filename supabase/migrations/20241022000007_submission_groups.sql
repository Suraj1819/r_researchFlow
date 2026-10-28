-- Phase 7: Faculty Project Submission Groups (idempotent)

CREATE TABLE IF NOT EXISTS public.submission_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  academic_year TEXT NOT NULL,
  semester TEXT,
  branch TEXT,
  session_year TEXT,
  coordinator_name TEXT,
  starts_at TIMESTAMPTZ,
  submission_deadline TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_groups_year ON public.submission_groups(academic_year);
CREATE INDEX IF NOT EXISTS idx_submission_groups_session ON public.submission_groups(session_year);
CREATE INDEX IF NOT EXISTS idx_submission_groups_creator ON public.submission_groups(created_by);

DROP TRIGGER IF EXISTS submission_groups_updated_at ON public.submission_groups;
CREATE TRIGGER submission_groups_updated_at
  BEFORE UPDATE ON public.submission_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.submission_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.submission_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_sgm_group ON public.submission_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_sgm_student ON public.submission_group_members(student_id);

CREATE TABLE IF NOT EXISTS public.group_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.submission_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  member_names TEXT[] DEFAULT '{}',
  project_title TEXT NOT NULL,
  project_summary TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  github_url TEXT,
  linkedin_url TEXT,
  demo_url TEXT,
  phone TEXT,
  ppt_path TEXT,
  ppt_name TEXT,
  ppt_mime TEXT,
  ppt_size BIGINT,
  extra_links JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_group_submissions_group ON public.group_submissions(group_id);

DROP TRIGGER IF EXISTS group_submissions_updated_at ON public.group_submissions;
CREATE TRIGGER group_submissions_updated_at
  BEFORE UPDATE ON public.group_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.submission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage submission groups" ON public.submission_groups;
CREATE POLICY "Staff manage submission groups"
  ON public.submission_groups FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('faculty', 'reviewer', 'coordinator', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('faculty', 'reviewer', 'coordinator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Students read published groups" ON public.submission_groups;
CREATE POLICY "Students read published groups"
  ON public.submission_groups FOR SELECT TO authenticated
  USING (is_published = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "Members manage own group membership" ON public.submission_group_members;
CREATE POLICY "Members manage own group membership"
  ON public.submission_group_members FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Staff read group members" ON public.submission_group_members;
CREATE POLICY "Staff read group members"
  ON public.submission_group_members FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('faculty', 'reviewer', 'coordinator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Students manage own group submission" ON public.group_submissions;
CREATE POLICY "Students manage own group submission"
  ON public.group_submissions FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Staff read all group submissions" ON public.group_submissions;
CREATE POLICY "Staff read all group submissions"
  ON public.group_submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('faculty', 'reviewer', 'coordinator', 'admin')
    )
  );
