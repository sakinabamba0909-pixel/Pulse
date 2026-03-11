// ============================================================
// Pulse — Database Types
// Auto-maps to Supabase tables
// ============================================================

export type ResponseMode = 'voice' | 'text' | 'hybrid';
export type Tone = 'warm' | 'calm' | 'pro' | 'hype';
export type Pushiness = 'gentle' | 'balanced' | 'firm';
export type BriefingFormat = 'alarm' | 'written' | 'both';
export type NewsTone = 'positive' | 'balanced' | 'full';
export type ProjectCategory = 'studies' | 'health' | 'home' | 'career' | 'family' | 'travel' | 'finance' | 'creative' | 'social' | 'mindfulness' | 'general';
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'canceled';
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'canceled';
export type CommitmentStatus = 'active' | 'in_progress' | 'completed' | 'broken' | 'canceled';
export type ActionType = 'create_task' | 'create_reminder' | 'create_event' | 'draft_email' | 'send_email' | 'create_goal' | 'create_project' | 'create_document' | 'research' | 'create_commitment' | 'update_relationship' | 'log_decision';
export type AiTool = 'claude' | 'chatgpt' | 'gemini' | 'copilot';

// ─── Table types ───

export interface UserProfile {
  id: string;
  name: string;
  response_mode: ResponseMode;
  tone: Tone;
  pushiness: Pushiness;
  wake_time: string;
  wind_down_time: string;
  briefing_time: string;
  briefing_format: BriefingFormat;
  timezone: string;
  texts_access: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface NewsPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  tone: NewsTone;
  outlets: string[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  category: ProjectCategory;
  goal_id: string | null;
  status: 'active' | 'paused' | 'completed' | 'archived';
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  category: string;
  target_date: string | null;
  duration_months: number | null;
  hours_per_week: number | null;
  status: GoalStatus;
  realism_note: string | null;
  plan_json: Record<string, unknown> | null;
  remind_cadence: string;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  project_id: string | null;
  source_type: 'voice' | 'text' | 'email' | 'system';
  content: string;
  parsed_json: Record<string, unknown> | null;
  speech_reply: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  goal_id: string | null;
  entry_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  duration_minutes: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  project_name?: string;
  project_color?: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  task_id: string | null;
  remind_at: string;
  channel: 'push' | 'voice' | 'email' | 'sms';
  message: string | null;
  status: 'pending' | 'sent' | 'dismissed' | 'snoozed';
  created_at: string;
}

export interface Relationship {
  id: string;
  user_id: string;
  person_name: string;
  category: 'family' | 'friend' | 'colleague' | 'professional' | 'other';
  contact_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'as_needed';
  last_contact_at: string | null;
  last_contact_method: string | null;
  phone_number: string | null;
  email_address: string | null;
  birthday: string | null;
  important_dates: Array<{ label: string; date: string }>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // computed
  contact_status?: 'ok' | 'overdue';
  days_since_contact?: number;
}

export interface Commitment {
  id: string;
  user_id: string;
  relationship_id: string | null;
  entry_id: string | null;
  promise_text: string;
  person_name: string;
  direction: 'to' | 'from';
  deadline: string | null;
  status: CommitmentStatus;
  task_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  user_id: string;
  entry_id: string | null;
  title: string;
  options: Array<{ label: string; pros: string[]; cons: string[] }>;
  choice: string | null;
  reasoning: string | null;
  confidence: 'low' | 'medium' | 'high';
  outcome: 'positive' | 'neutral' | 'negative' | null;
  outcome_notes: string | null;
  review_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  project_id: string | null;
  entry_id: string | null;
  title: string;
  doc_type: 'general' | 'study_pack' | 'research' | 'email_draft' | 'job_listings' | 'plan' | 'summary' | 'report';
  content_markdown: string | null;
  content_json: Record<string, unknown> | null;
  status: 'draft' | 'final' | 'sent' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ActionLog {
  id: string;
  user_id: string;
  entry_id: string | null;
  action_type: ActionType;
  payload: Record<string, unknown>;
  related_ids: Record<string, unknown>;
  status: 'success' | 'failed' | 'undone';
  undone_at: string | null;
  created_at: string;
}

export interface AiToolConnection {
  id: string;
  user_id: string;
  tool: AiTool;
  is_active: boolean;
  connected_at: string;
}

export interface AiToolProject {
  id: string;
  user_id: string;
  connection_id: string;
  project_id: string | null;
  tool: string;
  name: string;
  external_id: string | null;
  chat_count: number;
  progress_percent: number;
  status: 'active' | 'stale' | 'completed' | 'archived';
  last_active_at: string;
  insights: Array<string>;
  created_at: string;
  updated_at: string;
}

// ─── AI Brain types ───

export interface BrainInput {
  text: string;
  source_type: 'voice' | 'text';
  timezone: string;
  context: {
    active_project_id: string | null;
    selected_email_thread_id?: string;
    preferences: {
      auto_create_tasks: boolean;
      auto_create_calendar_events: 'auto' | 'ask';
      quiet_hours: [string, string];
    };
  };
}

export interface BrainOutput {
  speech_reply: string;
  project: { name: string; category: ProjectCategory; create_if_missing: boolean } | null;
  tasks: Array<{ title: string; due_at: string | null; duration_minutes: number | null; priority: TaskPriority }>;
  reminders: Array<{ task_ref: string; remind_at: string; channel: string }>;
  email_drafts: Array<{
    thread_id: string;
    to: string;
    subject: string;
    body_markdown: string;
    requires_approval: boolean;
    read_aloud: boolean;
  }>;
  research_requests: Array<{ query: string; scope: string }>;
  documents: Array<{ title: string; doc_type: string; content: string }>;
  goals: Array<{ title: string; proposed_duration_months: number }>;
  commitments: Array<{ person_name: string; promise_text: string; deadline: string | null }>;
  needs_confirmation: Array<{ question: string; options: string[] }>;
}

// ─── Onboarding types ───

export interface OnboardingData {
  name: string;
  response_mode: ResponseMode;
  contacts: Array<{ name: string; category: string; frequency: string }>;
  goals: string[];
  wake_time: string;
  wind_down_time: string;
  tone: Tone;
  pushiness: Pushiness;
  briefing_time: string;
  briefing_format: BriefingFormat;
  news_enabled: boolean;
  news_tone: NewsTone;
  news_outlets: string[];
  ai_tools: AiTool[];
  texts_access: boolean;
}
