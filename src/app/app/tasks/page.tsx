import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TasksClient from '@/components/tasks/TasksClient'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [tasksRes, projectsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, project:projects(id, name, color, category)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  return (
    <TasksClient
      initialTasks={tasksRes.data ?? []}
      initialProjects={projectsRes.data ?? []}
      initialRelationships={[]}
    />
  )
}
