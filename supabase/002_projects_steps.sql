-- ============================================================
-- PULSE — Projects & Steps Migration
-- Adds scheduling columns to projects, creates project_steps,
-- and links tasks to steps.
-- ============================================================

-- ============================================================
-- 1. ADD COLUMNS TO PROJECTS
-- ============================================================
ALTER TABLE projects
  ADD COLUMN scheduling_preferences JSONB DEFAULT '{}',
  ADD COLUMN connected_ai_context TEXT NULL,
  ADD COLUMN start_date DATE NULL,
  ADD COLUMN target_date DATE NULL;

-- ============================================================
-- 2. CREATE PROJECT_STEPS TABLE
-- ============================================================
CREATE TABLE project_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'done')),
  estimated_hours NUMERIC(5,1) NULL,
  dependency_step_id UUID NULL REFERENCES project_steps(id) ON DELETE SET NULL,
  scheduled_start TIMESTAMPTZ NULL,
  scheduled_end TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. RLS ON PROJECT_STEPS
-- ============================================================
ALTER TABLE project_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own project steps"
  ON project_steps FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. INDEXES ON PROJECT_STEPS
-- ============================================================
CREATE INDEX idx_project_steps_project ON project_steps(project_id);
CREATE INDEX idx_project_steps_user_project ON project_steps(user_id, project_id);

-- ============================================================
-- 5. ADD STEP_ID TO TASKS
-- ============================================================
ALTER TABLE tasks
  ADD COLUMN step_id UUID REFERENCES project_steps(id) ON DELETE SET NULL;

-- ============================================================
-- 6. TRIGGER FOR UPDATED_AT ON PROJECT_STEPS
-- ============================================================
CREATE TRIGGER trg_project_steps_updated
  BEFORE UPDATE ON project_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
