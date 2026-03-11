import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const CATEGORY_META: Record<string, { icon: string }> = {
  fitness:  { icon: '💪' }, language: { icon: '🗣️' }, career:  { icon: '📈' },
  finance:  { icon: '💰' }, social:   { icon: '👥' }, creative: { icon: '🎨' },
  organize: { icon: '🏠' }, mindful:  { icon: '🧘' },
};

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

  return (
    <div style={{ padding: '64px 40px', fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A' }}>
      <p style={{ fontSize: 12, color: '#8A949E', marginBottom: 8, letterSpacing: 0.2 }}>Projects</p>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, letterSpacing: -0.5, margin: '0 0 6px' }}>
        Things in motion.
      </h1>
      <p style={{ fontSize: 15, color: '#8A949E', marginBottom: 48 }}>
        {projects && projects.length > 0
          ? `${projects.length} project${projects.length !== 1 ? 's' : ''} active.`
          : 'Your ongoing projects and initiatives live here.'}
      </p>

      {projects && projects.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, maxWidth: 740 }}>
          {projects.map(p => {
            const meta = CATEGORY_META[p.category] || { icon: '▦' };
            return (
              <div key={p.id} style={{
                background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: 20, padding: '22px 22px',
              }}>
                <span style={{ fontSize: 26, display: 'block', marginBottom: 14 }}>{meta.icon}</span>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>{p.name}</p>
                {p.category && (
                  <p style={{ fontSize: 12, color: '#8A949E', textTransform: 'capitalize' }}>{p.category}</p>
                )}
                <div style={{
                  marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 20,
                  background: 'rgba(45,184,122,0.09)', border: '1px solid rgba(45,184,122,0.2)',
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2DB87A' }} />
                  <span style={{ fontSize: 11, color: '#2DB87A', fontWeight: 500 }}>Active</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20,
          padding: '48px 40px', textAlign: 'center', maxWidth: 480,
        }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>▦</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>No projects yet</p>
          <p style={{ fontSize: 14, color: '#8A949E', lineHeight: 1.6 }}>
            Projects linked to your goals will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
