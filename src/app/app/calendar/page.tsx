import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarClient from '@/components/calendar/CalendarClient'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all tasks with project info (for calendar events)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, due_at, duration_minutes, scheduled_start, scheduled_end, project_id, step_id, project:projects(id, name, color)')
    .eq('user_id', user.id)
    .order('due_at', { ascending: true })

  // Fetch active projects (for the "link to project" dropdown in add-event)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, color')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Check if Google Calendar is connected
  const { data: calConn } = await supabase
    .from('calendar_connections')
    .select('id')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .eq('is_active', true)
    .single()

  return (
    <CalendarClient
      tasks={tasks || []}
      projects={projects || []}
      calendarConnected={!!calConn}
    />
  )
}
