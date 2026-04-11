import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RemindersClient from '@/components/reminders/RemindersClient'

export const dynamic = 'force-dynamic'

export default async function RemindersPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [remindersRes, projectsRes] = await Promise.all([
    supabase
      .from('reminders')
      .select('*, task:tasks(id, title, due_at, priority, project:projects(id, name, color))')
      .eq('user_id', user.id)
      .order('remind_at', { ascending: true }),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  return (
    <RemindersClient
      initialReminders={remindersRes.data ?? []}
      initialProjects={projectsRes.data ?? []}
    />
  )
}
