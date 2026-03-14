import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#F5F4F2',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <Sidebar name={profile?.name || ''} />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
