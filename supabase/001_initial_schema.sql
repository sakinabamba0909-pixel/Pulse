-- ============================================================
-- BRIEFLY — Lifestyle OS
-- Complete Database Schema v3
-- Run this in Supabase SQL Editor (or as a migration)
-- ============================================================

-- IMPORTANT: Run this AFTER enabling auth in your Supabase project.
-- This script will:
--   1. Drop any existing Briefly tables (clean slate)
--   2. Create all tables with proper relationships
--   3. Set up Row Level Security (RLS) on every table
--   4. Create indexes for performance
--   5. Create helper functions and triggers

-- ============================================================
-- 0. CLEANUP (remove old tables if they exist)
-- ============================================================
DROP TABLE IF EXISTS commitments CASCADE;
DROP TABLE IF EXISTS decisions CASCADE;
DROP TABLE IF EXISTS insights CASCADE;
DROP TABLE IF EXISTS action_log CASCADE;
DROP TABLE IF EXISTS email_drafts CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS sources CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS ai_tool_projects CASCADE;
DROP TABLE IF EXISTS ai_tool_connections CASCADE;
DROP TABLE IF EXISTS news_preferences CASCADE;
DROP TABLE IF EXISTS email_connections CASCADE;
DROP TABLE IF EXISTS calendar_connections CASCADE;
DROP TABLE IF EXISTS entries CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================================
-- 1. USER PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  response_mode TEXT NOT NULL DEFAULT 'hybrid' CHECK (response_mode IN ('voice', 'text', 'hybrid')),
  tone TEXT DEFAULT 'warm' CHECK (tone IN ('warm', 'calm', 'pro', 'hype')),
  pushiness TEXT DEFAULT 'balanced' CHECK (pushiness IN ('gentle', 'balanced', 'firm')),
  wake_time TIME DEFAULT '07:00',
  wind_down_time TIME DEFAULT '22:00',
  briefing_time TIME DEFAULT '08:00',
  briefing_format TEXT DEFAULT 'written' CHECK (briefing_format IN ('alarm', 'written', 'both')),
  timezone TEXT DEFAULT 'America/Montreal',
  texts_access BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. NEWS PREFERENCES
-- ============================================================
CREATE TABLE news_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  tone TEXT DEFAULT 'balanced' CHECK (tone IN ('positive', 'balanced', 'full')),
  outlets TEXT[] DEFAULT '{}',  -- array of outlet IDs: 'ap', 'reuters', 'bbc', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE news_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own news prefs" ON news_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 3. PROJECTS
-- ============================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'studies', 'health', 'home', 'career', 'family', 'travel',
    'finance', 'creative', 'social', 'mindfulness', 'general'
  )),
  goal_id UUID NULL,  -- linked after goals table is created
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  color TEXT DEFAULT '#6EE7A0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(user_id, status);

-- ============================================================
-- 4. GOALS
-- ============================================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  target_date TIMESTAMPTZ NULL,
  duration_months INT NULL,
  hours_per_week NUMERIC(4,1) NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'canceled')),
  realism_note TEXT NULL,          -- "2 months too short, agreed on 10 months"
  plan_json JSONB NULL,            -- modules, milestones, structured plan
  remind_cadence TEXT DEFAULT 'daily' CHECK (remind_cadence IN ('daily', '3x_week', 'weekly', 'biweekly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from projects to goals
ALTER TABLE projects ADD CONSTRAINT fk_projects_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL;

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(user_id, status);

-- ============================================================
-- 5. ENTRIES (voice/text transcripts — the raw input log)
-- ============================================================
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL DEFAULT 'text' CHECK (source_type IN ('voice', 'text', 'email', 'system')),
  content TEXT NOT NULL,                -- raw transcript or text
  parsed_json JSONB NULL,              -- structured output from AI brain
  speech_reply TEXT NULL,              -- what Briefly said back
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own entries" ON entries FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_entries_user ON entries(user_id);
CREATE INDEX idx_entries_created ON entries(user_id, created_at DESC);

-- ============================================================
-- 6. TASKS
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'canceled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  due_at TIMESTAMPTZ NULL,
  duration_minutes INT NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due ON tasks(user_id, due_at) WHERE status = 'pending';

-- ============================================================
-- 7. REMINDERS
-- ============================================================
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  channel TEXT DEFAULT 'push' CHECK (channel IN ('push', 'voice', 'email', 'sms')),
  message TEXT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed', 'snoozed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reminders" ON reminders FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_reminders_pending ON reminders(user_id, remind_at) WHERE status = 'pending';

-- ============================================================
-- 8. RELATIONSHIPS (people the user wants to track)
-- ============================================================
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  category TEXT DEFAULT 'friend' CHECK (category IN ('family', 'friend', 'colleague', 'professional', 'other')),
  contact_frequency TEXT DEFAULT 'weekly' CHECK (contact_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'as_needed')),
  last_contact_at TIMESTAMPTZ NULL,
  last_contact_method TEXT NULL,       -- 'text', 'call', 'email', 'in_person'
  phone_number TEXT NULL,
  email_address TEXT NULL,
  birthday DATE NULL,
  important_dates JSONB DEFAULT '[]',  -- [{label: "Anniversary", date: "2026-06-15"}]
  notes TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own relationships" ON relationships FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_relationships_user ON relationships(user_id);

-- ============================================================
-- 9. COMMITMENTS (promises made to/from people)
-- ============================================================
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  promise_text TEXT NOT NULL,          -- "Find cybersecurity job listings"
  person_name TEXT NOT NULL,           -- denormalized for quick display
  direction TEXT DEFAULT 'to' CHECK (direction IN ('to', 'from')),  -- promise TO someone or FROM someone
  deadline TIMESTAMPTZ NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'broken', 'canceled')),
  task_ids UUID[] DEFAULT '{}',        -- linked tasks
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own commitments" ON commitments FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_commitments_user ON commitments(user_id);
CREATE INDEX idx_commitments_status ON commitments(user_id, status);

-- ============================================================
-- 10. DECISIONS (decision journal)
-- ============================================================
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  options JSONB DEFAULT '[]',          -- [{label: "Accept offer", pros: [...], cons: [...]}]
  choice TEXT NULL,                    -- the selected option
  reasoning TEXT NULL,
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  outcome TEXT NULL CHECK (outcome IN ('positive', 'neutral', 'negative', NULL)),
  outcome_notes TEXT NULL,
  review_at TIMESTAMPTZ NULL,          -- when to review this decision
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own decisions" ON decisions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_decisions_user ON decisions(user_id);

-- ============================================================
-- 11. DOCUMENTS (generated docs, study packs, job listings, etc.)
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  doc_type TEXT DEFAULT 'general' CHECK (doc_type IN (
    'general', 'study_pack', 'research', 'email_draft', 'job_listings',
    'plan', 'summary', 'report'
  )),
  content_markdown TEXT NULL,
  content_json JSONB NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'sent', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own documents" ON documents FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_documents_user ON documents(user_id);

-- ============================================================
-- 12. SOURCES (citations for research/docs)
-- ============================================================
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT NULL,
  snippet TEXT NULL,
  credibility_score NUMERIC(3,2) NULL, -- 0.00 to 1.00
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sources" ON sources FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_sources_document ON sources(document_id);

-- ============================================================
-- 13. EMAIL CONNECTIONS (OAuth tokens for Gmail/Outlook)
-- ============================================================
CREATE TABLE email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email_address TEXT NOT NULL,
  access_token_encrypted TEXT NULL,    -- encrypted at rest
  refresh_token_encrypted TEXT NULL,   -- encrypted at rest
  token_expires_at TIMESTAMPTZ NULL,
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own email connections" ON email_connections FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 14. CALENDAR CONNECTIONS
-- ============================================================
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  access_token_encrypted TEXT NULL,
  refresh_token_encrypted TEXT NULL,
  token_expires_at TIMESTAMPTZ NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own calendar connections" ON calendar_connections FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 15. AI TOOL CONNECTIONS
-- ============================================================
CREATE TABLE ai_tool_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tool TEXT NOT NULL CHECK (tool IN ('claude', 'chatgpt', 'gemini', 'copilot')),
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tool)
);

ALTER TABLE ai_tool_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own AI tool connections" ON ai_tool_connections FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 16. AI TOOL PROJECTS (projects tracked across AI tools)
-- ============================================================
CREATE TABLE ai_tool_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES ai_tool_connections(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  tool TEXT NOT NULL,
  name TEXT NOT NULL,
  external_id TEXT NULL,               -- ID in the external tool if available
  chat_count INT DEFAULT 0,
  progress_percent INT DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'stale', 'completed', 'archived')),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  insights JSONB DEFAULT '[]',         -- AI-generated insights about project status
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_tool_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own AI tool projects" ON ai_tool_projects FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_ai_projects_user ON ai_tool_projects(user_id);

-- ============================================================
-- 17. ACTION LOG (transparency + undo)
-- ============================================================
CREATE TABLE action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'create_task', 'create_reminder', 'create_event',
    'draft_email', 'send_email',
    'create_goal', 'create_project', 'create_document',
    'research', 'create_commitment',
    'update_relationship', 'log_decision'
  )),
  payload JSONB NOT NULL DEFAULT '{}', -- full details of what was created
  related_ids JSONB DEFAULT '{}',      -- {task_id: "...", reminder_ids: [...]}
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'undone')),
  undone_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE action_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own action log" ON action_log FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_action_log_user ON action_log(user_id, created_at DESC);
CREATE INDEX idx_action_log_entry ON action_log(entry_id);

-- ============================================================
-- 18. INSIGHTS (weekly/monthly reports)
-- ============================================================
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data_json JSONB NOT NULL,            -- structured analytics data
  summary TEXT NULL,                   -- human-readable summary
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own insights" ON insights FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_insights_user ON insights(user_id, period_start DESC);

-- ============================================================
-- 19. HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_user_profiles_updated BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_relationships_updated BEFORE UPDATE ON relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_commitments_updated BEFORE UPDATE ON commitments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_decisions_updated BEFORE UPDATE ON decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_email_connections_updated BEFORE UPDATE ON email_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_calendar_connections_updated BEFORE UPDATE ON calendar_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_tool_projects_updated BEFORE UPDATE ON ai_tool_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_news_preferences_updated BEFORE UPDATE ON news_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user_profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-mark task as completed
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = NOW();
  END IF;
  IF NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_completion BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION handle_task_completion();

-- ============================================================
-- 20. USEFUL VIEWS
-- ============================================================

-- Today's tasks for a user
CREATE OR REPLACE VIEW v_today_tasks AS
SELECT t.*, p.name as project_name, p.color as project_color
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.status IN ('pending', 'in_progress')
  AND (t.due_at IS NULL OR t.due_at::date <= CURRENT_DATE + INTERVAL '1 day')
ORDER BY
  CASE t.priority
    WHEN 'urgent' THEN 0
    WHEN 'high' THEN 1
    WHEN 'normal' THEN 2
    WHEN 'low' THEN 3
  END,
  t.due_at ASC NULLS LAST;

-- Overdue relationships (need attention)
CREATE OR REPLACE VIEW v_relationship_nudges AS
SELECT r.*,
  CASE
    WHEN r.contact_frequency = 'daily' AND (r.last_contact_at IS NULL OR r.last_contact_at < NOW() - INTERVAL '2 days') THEN 'overdue'
    WHEN r.contact_frequency = 'weekly' AND (r.last_contact_at IS NULL OR r.last_contact_at < NOW() - INTERVAL '10 days') THEN 'overdue'
    WHEN r.contact_frequency = 'biweekly' AND (r.last_contact_at IS NULL OR r.last_contact_at < NOW() - INTERVAL '18 days') THEN 'overdue'
    WHEN r.contact_frequency = 'monthly' AND (r.last_contact_at IS NULL OR r.last_contact_at < NOW() - INTERVAL '35 days') THEN 'overdue'
    ELSE 'ok'
  END as contact_status,
  EXTRACT(DAY FROM NOW() - COALESCE(r.last_contact_at, r.created_at)) as days_since_contact
FROM relationships r
ORDER BY
  CASE
    WHEN r.last_contact_at IS NULL THEN 0
    ELSE EXTRACT(EPOCH FROM NOW() - r.last_contact_at)
  END DESC;

-- Pending commitments
CREATE OR REPLACE VIEW v_active_commitments AS
SELECT c.*, r.person_name as relationship_person_name
FROM commitments c
LEFT JOIN relationships r ON c.relationship_id = r.id
WHERE c.status IN ('active', 'in_progress')
ORDER BY c.deadline ASC NULLS LAST;

-- ============================================================
-- DONE! Your Briefly database is ready.
-- ============================================================
