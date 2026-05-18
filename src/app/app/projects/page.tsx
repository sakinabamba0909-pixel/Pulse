import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProjectsClient from '@/components/projects/ProjectsClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: projects }, { data: completedProjects }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at'),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false }),
  ]);

  const allIds = [...(projects || []), ...(completedProjects || [])].map(p => p.id);

  const { data: steps } = allIds.length > 0
    ? await supabase
        .from('project_steps')
        .select('*')
        .in('project_id', allIds)
        .order('step_number')
    : { data: [] };

  const { data: tasks } = allIds.length > 0
    ? await supabase
        .from('tasks')
        .select('id, project_id, step_id, title, status, due_at, duration_minutes')
        .in('project_id', allIds)
    : { data: [] };

  return (
    <ProjectsClient
      projects={projects || []}
      completedProjects={completedProjects || []}
      steps={steps || []}
      tasks={tasks || []}
    />
  );
}
