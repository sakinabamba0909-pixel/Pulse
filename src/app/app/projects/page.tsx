import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProjectsClient from '@/components/projects/ProjectsClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <ProjectsClient />;
}
