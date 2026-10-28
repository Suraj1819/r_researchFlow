-- ResearchFlow initial schema (idempotent — safe to re-run)
-- Run in Supabase SQL Editor after creating a project.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'faculty', 'reviewer', 'coordinator', 'admin')),
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  registration_number TEXT,
  roll_number TEXT,
  academic_year TEXT,
  semester TEXT,
  bio TEXT,
  avatar_url TEXT,
  skills TEXT[] DEFAULT '{}',
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_registration ON public.profiles(registration_number);

-- Auto-create profile on signup (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    registration_number,
    roll_number
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('faculty', 'reviewer', 'coordinator', 'admin')
        THEN 'student'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    END,
    NEW.raw_user_meta_data->>'registration_number',
    NEW.raw_user_meta_data->>'roll_number'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    registration_number = COALESCE(EXCLUDED.registration_number, public.profiles.registration_number),
    roll_number = COALESCE(EXCLUDED.roll_number, public.profiles.roll_number);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS departments_updated_at ON public.departments;
CREATE TRIGGER departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS project_categories_updated_at ON public.project_categories;
CREATE TRIGGER project_categories_updated_at
  BEFORE UPDATE ON public.project_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code TEXT UNIQUE,
  title TEXT NOT NULL DEFAULT 'Untitled project',
  short_description TEXT,
  problem_statement TEXT,
  objectives TEXT[] DEFAULT '{}',
  project_type TEXT NOT NULL DEFAULT 'major'
    CHECK (project_type IN (
      'mini', 'major', 'research', 'personal', 'hackathon', 'open_source'
    )),
  ownership_mode TEXT NOT NULL DEFAULT 'team'
    CHECK (ownership_mode IN ('solo', 'team')),
  category_id UUID REFERENCES public.project_categories(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'planning'
    CHECK (stage IN (
      'idea', 'planning', 'design', 'development', 'testing', 'completed', 'maintenance'
    )),
  duration_min_months INT,
  duration_max_months INT,
  start_date DATE,
  target_end_date DATE,
  visibility TEXT NOT NULL DEFAULT 'team'
    CHECK (visibility IN ('private', 'team', 'faculty', 'public')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'awaiting_members', 'submitted', 'under_review',
      'changes_requested', 'approved', 'rejected', 'archived'
    )),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ,
  current_revision INT NOT NULL DEFAULT 1,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (
    target_end_date IS NULL OR start_date IS NULL OR target_end_date >= start_date
  )
);

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON public.projects(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category_id);

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_role TEXT NOT NULL DEFAULT 'member'
    CHECK (team_role IN ('leader', 'member')),
  membership_status TEXT NOT NULL DEFAULT 'active'
    CHECK (membership_status IN ('active', 'removed', 'left')),
  responsibility TEXT,
  invited_by UUID REFERENCES public.profiles(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_student ON public.project_members(student_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON public.project_members(membership_status);

DROP TRIGGER IF EXISTS project_members_updated_at ON public.project_members;
CREATE TRIGGER project_members_updated_at
  BEFORE UPDATE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  message TEXT,
  expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_invitations_invitee ON public.project_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.project_invitations(status);

DROP TRIGGER IF EXISTS project_invitations_updated_at ON public.project_invitations;
CREATE TRIGGER project_invitations_updated_at
  BEFORE UPDATE ON public.project_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_technologies_category ON public.technologies(category);
CREATE INDEX IF NOT EXISTS idx_technologies_name ON public.technologies(name);

DROP TRIGGER IF EXISTS technologies_updated_at ON public.technologies;
CREATE TRIGGER technologies_updated_at
  BEFORE UPDATE ON public.technologies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.project_technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  technology_id UUID NOT NULL REFERENCES public.technologies(id) ON DELETE CASCADE,
  usage_status TEXT NOT NULL DEFAULT 'planned'
    CHECK (usage_status IN ('planned', 'in_use', 'replaced')),
  purpose TEXT,
  module_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, technology_id)
);

CREATE INDEX IF NOT EXISTS idx_project_tech_project ON public.project_technologies(project_id);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_technologies ENABLE ROW LEVEL SECURITY;

-- Profiles: read / update / insert own row (fixes signup 406)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated can read departments" ON public.departments;
CREATE POLICY "Authenticated can read departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can read categories" ON public.project_categories;
CREATE POLICY "Authenticated can read categories"
  ON public.project_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated can read technologies" ON public.technologies;
CREATE POLICY "Authenticated can read technologies"
  ON public.technologies FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Members can view their projects" ON public.projects;
CREATE POLICY "Members can view their projects"
  ON public.projects FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = id
        AND pm.student_id = auth.uid()
        AND pm.membership_status = 'active'
    )
    OR visibility = 'public'
  );

DROP POLICY IF EXISTS "Students can create projects" ON public.projects;
CREATE POLICY "Students can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Creator can update own draft projects" ON public.projects;
CREATE POLICY "Creator can update own draft projects"
  ON public.projects FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Project members can view roster" ON public.project_members;
CREATE POLICY "Project members can view roster"
  ON public.project_members FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.student_id = auth.uid()
        AND pm.membership_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can view own invitations" ON public.project_invitations;
CREATE POLICY "Users can view own invitations"
  ON public.project_invitations FOR SELECT
  USING (invitee_id = auth.uid() OR invited_by = auth.uid());

-- Seed
INSERT INTO public.departments (name, code) VALUES
  ('Computer Science and Engineering', 'CSE'),
  ('Information Technology', 'IT'),
  ('Electronics and Communication', 'ECE'),
  ('Electrical Engineering', 'EE'),
  ('Mechanical Engineering', 'ME')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.project_categories (name, slug, sort_order) VALUES
  ('Web Development', 'web-development', 1),
  ('Artificial Intelligence / Machine Learning', 'ai-ml', 2),
  ('Internet of Things / Embedded Systems', 'iot-embedded', 3),
  ('Computer Networks', 'computer-networks', 4),
  ('Cybersecurity', 'cybersecurity', 5),
  ('Mobile Application Development', 'mobile-apps', 6),
  ('Data Science / Analytics', 'data-science', 7),
  ('Cloud Computing / DevOps', 'cloud-devops', 8),
  ('Software Engineering', 'software-engineering', 9),
  ('Robotics / Automation', 'robotics', 10),
  ('Other / Interdisciplinary Research', 'other', 99)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.technologies (name, category) VALUES
  ('JavaScript', 'Programming languages'),
  ('TypeScript', 'Programming languages'),
  ('Python', 'Programming languages'),
  ('Java', 'Programming languages'),
  ('C++', 'Programming languages'),
  ('React', 'Frontend'),
  ('Vite', 'Frontend'),
  ('Next.js', 'Frontend'),
  ('Vue', 'Frontend'),
  ('Tailwind CSS', 'Frontend'),
  ('Node.js', 'Backend'),
  ('Express', 'Backend'),
  ('Django', 'Backend'),
  ('FastAPI', 'Backend'),
  ('PostgreSQL', 'Database and storage'),
  ('MongoDB', 'Database and storage'),
  ('Supabase', 'Database and storage'),
  ('React Native', 'Mobile'),
  ('Flutter', 'Mobile'),
  ('TensorFlow', 'AI and data'),
  ('PyTorch', 'AI and data'),
  ('scikit-learn', 'AI and data'),
  ('Docker', 'Cloud and DevOps'),
  ('AWS', 'Cloud and DevOps'),
  ('Git', 'Development and design tools'),
  ('GitHub', 'Development and design tools'),
  ('Figma', 'Development and design tools')
ON CONFLICT (name) DO NOTHING;
