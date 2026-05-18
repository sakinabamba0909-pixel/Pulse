-- ============================================================
-- PULSE — Extra columns needed by the app
-- Run AFTER 001_initial_schema.sql and 002_projects_steps.sql
-- ============================================================

-- Tasks: add missing columns used by the app
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule JSONB NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocked_by_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_delegated BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delegated_to TEXT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delegated_at TIMESTAMPTZ NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS streak_count INT DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminders JSONB NULL;

-- Reminders: add missing columns
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS recurrence_rule JSONB NULL;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ NULL;

-- Index for parent_task_id (subtasks)
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_pinned ON tasks(user_id, is_pinned) WHERE is_pinned = TRUE;
