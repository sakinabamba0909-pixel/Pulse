import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProjectsClient from '@/components/projects/ProjectsClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at');

  const projectIds = (projects || []).map(p => p.id);

  const { data: steps } = projectIds.length > 0
    ? await supabase
        .from('project_steps')
        .select('*')
        .in('project_id', projectIds)
        .order('step_number')
    : { data: [] };

  const { data: tasks } = projectIds.length > 0
    ? await supabase
        .from('tasks')
        .select('id, project_id, step_id, title, status, due_at, duration_minutes')
        .in('project_id', projectIds)
    : { data: [] };

  return (
    <ProjectsClient
      projects={projects || []}
      steps={steps || []}
      tasks={tasks || []}
    />
  );
}
