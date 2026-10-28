-- Phase 3: project files table + storage guidance

CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  file_kind TEXT NOT NULL DEFAULT 'other'
    CHECK (file_kind IN (
      'proposal', 'requirements', 'srs', 'design', 'diagram', 'screenshot',
      'image', 'video', 'report', 'presentation', 'dataset', 'archive', 'other'
    )),
  visibility TEXT NOT NULL DEFAULT 'team'
    CHECK (visibility IN ('private', 'team', 'faculty', 'public')),
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_files_project ON public.project_files(project_id);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view project files" ON public.project_files;
CREATE POLICY "Members can view project files"
  ON public.project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_files.project_id
        AND pm.student_id = auth.uid()
        AND pm.membership_status = 'active'
    )
  );

-- Storage: create a private bucket named "project-files" in Supabase Dashboard
-- Storage → New bucket → name: project-files → Public: OFF
-- Then add policy: authenticated users can upload/download only paths under their project membership.
