import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: tasks }] = await Promise.all([
    supabase.from('user_profiles').select('name').eq('id', user.id).single(),
    supabase.from('tasks').select('id,is_pinned').eq('user_id', user.id).eq('status', 'pending').is('parent_task_id', null),
  ]);

  const taskCount = tasks?.length ?? 0;
  const focusCount = tasks?.filter((t: any) => t.is_pinned).length ?? 0;

  return (
    <AppShell
      userName={profile?.name || ''}
      taskCount={taskCount}
      focusCount={focusCount}
    >
      <div style={{
        display: 'flex', minHeight: '100vh',
        fontFamily: "'Outfit', sans-serif",
      }}>
        <Sidebar name={profile?.name || ''} />
        <main style={{ flex: 1, marginLeft: 210, minHeight: '100vh', position: 'relative' }}>
          {children}
        </main>
      </div>
    </AppShell>
  );
}
