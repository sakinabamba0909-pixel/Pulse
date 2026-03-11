import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/app/onboarding');
  }

  return (
    <div data-theme="dark" style={{
      minHeight: '100vh', background: '#0B0E11', color: '#E8ECF1',
      fontFamily: "'DM Sans', sans-serif", display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease' }}>
        <p style={{ fontSize: 40, marginBottom: 16 }}>◉</p>
        <h1 style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 32, fontWeight: 400, marginBottom: 8,
        }}>
          Welcome, {profile.name}.
        </h1>
        <p style={{ color: '#8B95A3', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
          Your Pulse is ready. The full app UI is coming next.
        </p>
        <div style={{
          display: 'inline-flex', flexDirection: 'column', gap: 8,
          background: '#13171C', borderRadius: 16, border: '1px solid #232A33',
          padding: 20, textAlign: 'left',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#5A6577', letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 4 }}>Your profile</p>
          {[
            { l: 'Response mode', v: profile.response_mode },
            { l: 'Tone', v: profile.tone },
            { l: 'Briefing', v: `${profile.briefing_time} · ${profile.briefing_format}` },
            { l: 'Wake time', v: profile.wake_time },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 40 }}>
              <span style={{ fontSize: 12, color: '#5A6577' }}>{r.l}</span>
              <span style={{ fontSize: 12, color: '#E8ECF1', fontWeight: 500 }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
