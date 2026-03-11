import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { RecurrenceRule } from '@/lib/tasks/types'

function nextOccurrence(due_at: string, rule: RecurrenceRule): string {
  // Never schedule next occurrence in the past
  const now = new Date()
  const base = new Date(due_at)
  const d = base > now ? new Date(base) : new Date(now)

  switch (rule.type) {
    case 'daily':    d.setDate(d.getDate() + 1); break
    case 'weekdays': {
      d.setDate(d.getDate() + 1)
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
      break
    }
    case 'weekly':   d.setDate(d.getDate() + 7); break
    case 'biweekly': d.setDate(d.getDate() + 14); break
    case 'monthly':  d.setMonth(d.getMonth() + 1); break
    case 'custom': {
      // 3x/week: roughly every 2 weekdays
      d.setDate(d.getDate() + 2)
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
      break
    }
    default: d.setDate(d.getDate() + (rule.interval ?? 7)); break
  }
  return d.toISOString()
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Fetch the task
  const { data: task, error: fetchErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const now = new Date().toISOString()

  // Mark done
  await supabase.from('tasks').update({
    status: 'done',
    completed_at: now,
    updated_at: now,
  }).eq('id', id)

  // If recurring, create next occurrence (don't create a backlog)
  let nextTask = null
  if (task.is_recurring && task.recurrence_rule && task.due_at) {
    const nextDue = nextOccurrence(task.due_at, task.recurrence_rule as RecurrenceRule)
    const { data: created } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: task.title,
      description: task.description,
      project_id: task.project_id,
      goal_id: task.goal_id,
      priority: task.priority,
      due_at: nextDue,
      duration_minutes: task.duration_minutes,
      is_recurring: true,
      recurrence_rule: task.recurrence_rule,
      relationship_id: task.relationship_id,
      reminders: task.reminders,
      streak_count: (task.streak_count ?? 0) + 1,
      status: 'pending',
    }).select('*').single()
    nextTask = created
  }

  // Unblock any tasks waiting on this one
  await supabase.from('tasks')
    .update({ blocked_by_task_id: null })
    .eq('blocked_by_task_id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true, nextTask })
}
