import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const GOAL_META: Record<string, { icon: string; label: string; desc: string }> = {
  fitness:  { icon: '💪', label: 'Health & Fitness',      desc: 'Improve health and fitness'              },
  language: { icon: '🗣️', label: 'Language Learning',     desc: 'Learn a new language'                   },
  career:   { icon: '📈', label: 'Career Growth',         desc: 'Advance my career'                       },
  finance:  { icon: '💰', label: 'Financial Goals',       desc: 'Get better with finances'                },
  social:   { icon: '👥', label: 'Relationships',         desc: 'Stay connected with people I care about' },
  creative: { icon: '🎨', label: 'Creative Projects',     desc: 'Complete a creative project'             },
  organize: { icon: '🏠', label: 'Life Organization',     desc: 'Get more organized'                      },
  mindful:  { icon: '🧘', label: 'Mindfulness',           desc: 'Build a mindfulness practice'            },
};

export default async function GoalsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at');

  return (
    <div style={{ padding: '64px 40px', fontFamily: "'Outfit', sans-serif", color: '#2A2D35' }}>
      <p style={{ fontSize: 12, color: '#8890A0', marginBottom: 8, letterSpacing: 0.2 }}>Goals</p>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 400, letterSpacing: -0.5, margin: '0 0 6px' }}>
        What you&apos;re working towards.
      </h1>
      <p style={{ fontSize: 15, color: '#8890A0', marginBottom: 48 }}>
        {goals && goals.length > 0
          ? `${goals.length} area${goals.length !== 1 ? 's' : ''} in focus.`
          : 'Add goals to start tracking your progress.'}
      </p>

      {goals && goals.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, maxWidth: 740 }}>
          {goals.map(g => {
            const meta = GOAL_META[g.category] || { icon: '◈', label: g.title, desc: '' };
            return (
              <div key={g.id} style={{
                background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 20, padding: '22px 22px',
              }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 14 }}>{meta.icon}</span>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#2A2D35', marginBottom: 4 }}>{meta.label}</p>
                <p style={{ fontSize: 13, color: '#8890A0', lineHeight: 1.5 }}>{g.title}</p>
                <div style={{
                  marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 20,
                  background: 'rgba(139,126,200,0.10)', border: '1px solid rgba(45,184,122,0.2)',
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8B7EC8' }} />
                  <span style={{ fontSize: 11, color: '#8B7EC8', fontWeight: 500 }}>Active</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20,
          padding: '48px 40px', textAlign: 'center', maxWidth: 480,
        }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>◎</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#2A2D35', marginBottom: 6 }}>No goals yet</p>
          <p style={{ fontSize: 14, color: '#8890A0', lineHeight: 1.6 }}>
            Your goals from onboarding will appear here once set.
          </p>
        </div>
      )}
    </div>
  );
}
