-- Phase 5: RLS hardening, helper policies, indexes
-- Run after phases 1–4

-- ---------------------------------------------------------------------------
-- Ensure faculty/admin can list submitted projects for review queue
-- (Service role bypasses RLS; these help if you ever query via anon key)
-- ---------------------------------------------------------------------------

-- Allow faculty/reviewer/coordinator/admin to SELECT projects in review statuses
DROP POLICY IF EXISTS "Faculty can view submitted projects" ON public.projects;
CREATE POLICY "Faculty can view submitted projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = projects.id
        AND pm.student_id = auth.uid()
        AND pm.membership_status = 'active'
    )
    OR (
      status IN ('submitted', 'under_review', 'changes_requested', 'approved', 'rejected')
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('faculty', 'reviewer', 'coordinator', 'admin')
      )
    )
  );

-- Faculty can insert reviews
DROP POLICY IF EXISTS "Faculty can insert reviews" ON public.project_reviews;
CREATE POLICY "Faculty can insert reviews"
  ON public.project_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('faculty', 'reviewer', 'coordinator', 'admin')
    )
  );

-- Project members can read revisions
DROP POLICY IF EXISTS "Members can view revisions" ON public.project_revisions;
CREATE POLICY "Members can view revisions"
  ON public.project_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_revisions.project_id
        AND pm.student_id = auth.uid()
        AND pm.membership_status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('faculty', 'reviewer', 'coordinator', 'admin')
    )
  );

-- Leaders can insert revisions (resubmit path also uses service role)
DROP POLICY IF EXISTS "Leaders can insert revisions" ON public.project_revisions;
CREATE POLICY "Leaders can insert revisions"
  ON public.project_revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_revisions.project_id
        AND pm.student_id = auth.uid()
        AND pm.team_role = 'leader'
        AND pm.membership_status = 'active'
    )
  );

-- Faculty/admin can manage ideas
DROP POLICY IF EXISTS "Faculty manage ideas" ON public.project_ideas;
CREATE POLICY "Faculty manage ideas"
  ON public.project_ideas FOR ALL
  TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('faculty', 'coordinator', 'admin')
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('faculty', 'coordinator', 'admin')
    )
  );

-- Audit logs: users can read their own actions; admin can read all (via service role typically)
DROP POLICY IF EXISTS "Users read own audit actions" ON public.audit_logs;
CREATE POLICY "Users read own audit actions"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    actor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('coordinator', 'admin')
    )
  );

-- Useful indexes for review queue and dashboards
CREATE INDEX IF NOT EXISTS idx_projects_status_submitted
  ON public.projects (status, submitted_at)
  WHERE status IN ('submitted', 'under_review', 'changes_requested');

CREATE INDEX IF NOT EXISTS idx_profiles_role_active
  ON public.profiles (role)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- Storage bucket setup (run in Dashboard or via Storage API — SQL is advisory)
-- ---------------------------------------------------------------------------
-- 1. Storage → New bucket → Name: project-files → Public: OFF
-- 2. Policies (example — adjust in Dashboard):
--
--    Policy name: Members can upload
--    Allowed operation: INSERT
--    Target roles: authenticated
--    WITH CHECK: bucket_id = 'project-files'
--
--    Policy name: Members can download own project paths
--    Allowed operation: SELECT
--    Target roles: authenticated
--    USING: bucket_id = 'project-files'
--
-- Prefer short-lived signed URLs from the Express API (service role) for production.
