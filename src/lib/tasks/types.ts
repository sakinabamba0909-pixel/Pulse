export type Priority = 'urgent' | 'normal' | 'low'
export type TaskStatus = 'pending' | 'done'

export interface RecurrenceRule {
  type: 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
  interval?: number
  days?: string[]
  count_per_week?: number
  week_of_month?: number
  day_of_week?: string
}

export interface TaskReminder {
  offset_minutes: number
  label: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  due_at?: string
  priority: Priority
  status: TaskStatus
  project_id?: string
  goal_id?: string
  parent_task_id?: string
  duration_minutes?: number
  is_recurring: boolean
  recurrence_rule?: RecurrenceRule
  blocked_by_task_id?: string
  is_delegated: boolean
  delegated_to?: string
  delegated_at?: string
  relationship_id?: string
  is_pinned: boolean
  scheduled_start?: string
  scheduled_end?: string
  streak_count: number
  reminders?: TaskReminder[]
  completed_at?: string
  created_at: string
  updated_at?: string
  // Joined
  project?: { id: string; name: string; color: string; category?: string }
  subtasks?: Task[]
  blocked_by?: { id: string; title: string; status: string }
  person?: { id: string; person_name: string }
}

export interface Project {
  id: string
  user_id: string
  name: string
  color: string
  category?: string
  status: string
  created_at: string
}

export interface Relationship {
  id: string
  person_name: string
  category?: string
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  urgent: { label: 'Urgent', color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)'  },
  normal: { label: 'Normal', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  low:    { label: 'Low',    color: '#9CA3AF', bg: 'rgba(156,163,175,0.08)',border: 'rgba(156,163,175,0.2)'},
}

export const DURATION_OPTIONS = [
  { label: '15m',  minutes: 15  },
  { label: '30m',  minutes: 30  },
  { label: '1h',   minutes: 60  },
  { label: '2h',   minutes: 120 },
  { label: '4h',   minutes: 240 },
]

export const RECURRENCE_OPTIONS = [
  { value: 'daily',    label: 'Daily'              },
  { value: 'weekdays', label: 'Weekdays'            },
  { value: 'custom',   label: '3× per week'        },
  { value: 'weekly',   label: 'Weekly'              },
  { value: 'biweekly', label: 'Every 2 weeks'       },
  { value: 'monthly',  label: 'Monthly'             },
]

export const REMINDER_PRESETS: TaskReminder[] = [
  { offset_minutes: -2880, label: '2 days before'  },
  { offset_minutes: -1440, label: '1 day before'   },
  { offset_minutes: -480,  label: 'Morning of'     },
  { offset_minutes: -60,   label: '1 hr before'    },
  { offset_minutes: -30,   label: '30 min before'  },
  { offset_minutes: -15,   label: '15 min before'  },
  { offset_minutes: 0,     label: 'At start time'  },
]
