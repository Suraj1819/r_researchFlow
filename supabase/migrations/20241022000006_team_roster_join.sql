-- Phase 6: Manual team roster + join by project code (no invitations required)

-- Roster entries filled by leader at project creation (may not have accounts yet)
CREATE TABLE IF NOT EXISTS public.project_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  registration_number TEXT,
  roll_number TEXT,
  department TEXT,
  academic_year TEXT,
  semester TEXT,
  responsibility TEXT,
  is_leader BOOLEAN NOT NULL DEFAULT false,
  linked_student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roster_project ON public.project_roster(project_id);
CREATE INDEX IF NOT EXISTS idx_roster_email ON public.project_roster(email);
CREATE INDEX IF NOT EXISTS idx_roster_reg ON public.project_roster(registration_number);

DROP TRIGGER IF EXISTS project_roster_updated_at ON public.project_roster;
CREATE TRIGGER project_roster_updated_at
  BEFORE UPDATE ON public.project_roster
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.project_roster ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view roster entries" ON public.project_roster;
CREATE POLICY "Members can view roster entries"
  ON public.project_roster FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_roster.project_id
        AND pm.student_id = auth.uid()
        AND pm.membership_status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_roster.project_id AND p.created_by = auth.uid()
    )
  );

-- Ensure project_code is always present and searchable
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_code_unique
  ON public.projects (project_code)
  WHERE project_code IS NOT NULL;

-- Allow users to insert/upsert their own profile (fixes signup when trigger is slow)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
