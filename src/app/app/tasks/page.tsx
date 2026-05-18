import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TasksClient from '@/components/tasks/TasksClient'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [tasksRes, projectsRes, subtasksRes, relationshipsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, project:projects(id, name, color, category)')
      .eq('user_id', user.id)
      .is('parent_task_id', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('id, title, status, parent_task_id')
      .eq('user_id', user.id)
      .not('parent_task_id', 'is', null),
    supabase
      .from('relationships')
      .select('id, person_name, category')
      .eq('user_id', user.id)
      .order('person_name'),
  ])

  return (
    <TasksClient
      initialTasks={tasksRes.data ?? []}
      initialProjects={projectsRes.data ?? []}
      initialSubtasks={subtasksRes.data ?? []}
      initialRelationships={relationshipsRes.data ?? []}
    />
  )
}
