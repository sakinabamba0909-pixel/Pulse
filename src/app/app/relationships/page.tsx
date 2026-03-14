import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const FREQ_LABEL: Record<string, string> = {
  daily: 'Every day', weekly: 'Every week',
  biweekly: 'Every 2 weeks', monthly: 'Every month',
};

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default async function RelationshipsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: people } = await supabase
    .from('relationships')
    .select('*')
    .eq('user_id', user.id)
    .order('person_name');

  const family  = people?.filter(p => p.category === 'family')  || [];
  const friends = people?.filter(p => p.category !== 'family')  || [];

  const Group = ({ title, items }: { title: string; items: typeof people }) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A949E', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
          {title}
        </p>
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {items.map(p => {
            const initials = p.person_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
            const days = daysSince(p.last_contact_at);
            return (
              <div key={p.id} style={{
                background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: 18, padding: '18px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(45,184,122,0.09)', border: '1.5px solid rgba(45,184,122,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#2DB87A',
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.person_name}
                  </p>
                  <p style={{ fontSize: 12, color: '#8A949E' }}>
                    {FREQ_LABEL[p.contact_frequency?.toLowerCase()] || p.contact_frequency}
                  </p>
                  {days !== null && (
                    <p style={{ fontSize: 11, color: '#ABABAB', marginTop: 2 }}>
                      Last contact {days === 0 ? 'today' : `${days}d ago`}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="page-shell" style={{ padding: '64px 40px', fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A' }}>
      <p style={{ fontSize: 12, color: '#8A949E', marginBottom: 8, letterSpacing: 0.2 }}>People</p>
      <h1 className="page-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, letterSpacing: -0.5, margin: '0 0 6px' }}>
        The people who matter.
      </h1>
      <p style={{ fontSize: 15, color: '#8A949E', marginBottom: 48 }}>
        {people && people.length > 0
          ? `${people.length} connection${people.length !== 1 ? 's' : ''} tracked.`
          : 'Add people to stay in touch with who matters most.'}
      </p>

      {people && people.length > 0 ? (
        <div style={{ maxWidth: 740 }}>
          <Group title="Family" items={family} />
          <Group title="Friends & Others" items={friends} />
        </div>
      ) : (
        <div style={{
          background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20,
          padding: '48px 40px', textAlign: 'center', maxWidth: 480,
        }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>◑</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>No people added yet</p>
          <p style={{ fontSize: 14, color: '#8A949E', lineHeight: 1.6 }}>
            People you selected during onboarding will show up here.
          </p>
        </div>
      )}
    </div>
  );
}
