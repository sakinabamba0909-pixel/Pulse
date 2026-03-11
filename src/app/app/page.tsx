import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Orb from '@/components/Orb';

export const dynamic = 'force-dynamic';

// ─── Constants ───────────────────────────────────────────────────────────────

const GOAL_META: Record<string, { icon: string; label: string }> = {
  fitness:  { icon: '💪', label: 'Health'       },
  language: { icon: '🗣️', label: 'Language'     },
  career:   { icon: '📈', label: 'Career'        },
  finance:  { icon: '💰', label: 'Finance'       },
  social:   { icon: '👥', label: 'Social'        },
  creative: { icon: '🎨', label: 'Creative'      },
  organize: { icon: '🏠', label: 'Organization'  },
  mindful:  { icon: '🧘', label: 'Mindfulness'   },
};

const OUTLET_NAMES: Record<string, string> = {
  ap: 'AP News', reuters: 'Reuters', bbc: 'BBC', nyt: 'NY Times',
  cnn: 'CNN', wsj: 'WSJ', npr: 'NPR', guardian: 'The Guardian',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(name: string, tone: string, hour: number): string {
  const t = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  if (tone === 'hype') {
    return t === 'morning'   ? `Rise and shine, ${name}! 🔥`
         : t === 'afternoon' ? `Keep going, ${name}! ⚡`
                             : `Evening check-in, ${name}! 🌟`;
  }
  if (tone === 'warm') {
    return t === 'morning'   ? `Good morning, ${name}. ☀`
         : t === 'afternoon' ? `Good afternoon, ${name}. 🌤`
                             : `Good evening, ${name}. 🌙`;
  }
  // calm / pro
  return `Good ${t}, ${name}.`;
}

function getSubtitle(tone: string, pushiness: string, goalCount: number, peopleCount: number): string {
  if (tone === 'calm') return 'Your day is ready.';
  if (tone === 'hype') return "Let's make today count.";
  if (tone === 'pro')  return pushiness === 'firm'
    ? `${goalCount} goal${goalCount !== 1 ? 's' : ''} · ${peopleCount} connection${peopleCount !== 1 ? 's' : ''} · on track.`
    : 'Your daily overview is ready.';
  // warm
  return peopleCount > 0
    ? 'Your goals and people are right here.'
    : 'Everything you care about, in one place.';
}

function getSectionLabel(section: 'goals' | 'people' | 'world', tone: string, pushiness: string): string {
  const labels: Record<string, Record<string, string>> = {
    goals:  { calm: 'Focus',   warm: 'Goals',   pro: 'Objectives', hype: 'Mission'   },
    people: { calm: 'People',  warm: 'People',  pro: 'Network',    hype: 'Your Crew' },
    world:  { calm: 'World',   warm: 'World',   pro: 'Briefing',   hype: 'What\'s Up' },
  };
  return labels[section][tone] || labels[section]['warm'];
}

function formatTime(time: string | null): string {
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getBriefingIcon(format: string): string {
  return format === 'alarm' ? '🔔 Spoken alarm'
       : format === 'written' ? '📖 Written briefing'
       : format === 'both' ? '🔔 Alarm + 📖 Written'
       : format;
}

function getNudgeText(frequency: string, lastContact: string | null, pushiness: string): { text: string; warm: boolean } | null {
  const thresholds: Record<string, number> = { daily: 2, weekly: 9, biweekly: 16, monthly: 35 };
  const threshold = thresholds[frequency?.toLowerCase()] ?? 9;
  const days = lastContact ? Math.floor((Date.now() - new Date(lastContact).getTime()) / 86400000) : null;

  if (days === null) {
    return pushiness === 'gentle' ? null : { text: 'Say hello', warm: false };
  }
  if (days >= threshold) {
    if (pushiness === 'gentle')   return null;
    if (pushiness === 'balanced') return { text: `${days}d ago`, warm: false };
    if (pushiness === 'firm')     return { text: `${days}d — reach out`, warm: true };
  }
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AppPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: goals }, { data: relationships }, { data: news }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('goals').select('id,title,category,status').eq('user_id', user.id).eq('status', 'active'),
    supabase.from('relationships').select('id,person_name,category,contact_frequency,last_contact_at').eq('user_id', user.id).order('person_name'),
    supabase.from('news_preferences').select('*').eq('user_id', user.id).single(),
  ]);

  if (!profile?.onboarding_completed) redirect('/app/onboarding');

  const now = new Date();
  const tz = profile.timezone || 'America/New_York';
  const hour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(now));
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: tz });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });

  const tone      = profile.tone      || 'warm';
  const pushiness = profile.pushiness || 'balanced';
  const greeting  = getGreeting(profile.name, tone, hour);
  const subtitle  = getSubtitle(tone, pushiness, goals?.length ?? 0, relationships?.length ?? 0);

  // ─── Palette ───
  const C = {
    bg:          '#0B0E11',
    card:        '#0F1318',
    cardBorder:  'rgba(255,255,255,0.055)',
    cardHover:   '#111820',
    text:        '#E8ECF1',
    muted:       '#516070',
    faint:       'rgba(255,255,255,0.035)',
    divider:     'rgba(255,255,255,0.04)',
    accent:      '#6EE7A0',
    accentDim:   'rgba(110,231,160,0.1)',
    accentBorder:'rgba(110,231,160,0.18)',
    amber:       '#F5A623',
    amberDim:    'rgba(245,166,35,0.1)',
    amberBorder: 'rgba(245,166,35,0.2)',
  };

  const cardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: 22,
    padding: '22px 24px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: C.muted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 18,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(110,231,160,0); }
          50%       { box-shadow: 0 0 20px 4px rgba(110,231,160,0.06); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 0; width: 0; }
      `}</style>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 24px 100px' }}>

        {/* ──────────────────── Hero greeting ──────────────────── */}
        <div style={{ paddingTop: 80, paddingBottom: 52, animation: 'fadeUp 0.65s cubic-bezier(0.4,0,0.2,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ animation: 'pulseGlow 4s ease infinite', borderRadius: '50%' }}>
              <Orb size={56} dark />
            </div>
            <div>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 6, letterSpacing: 0.2 }}>
                {dateStr} &nbsp;·&nbsp; {timeStr}
              </p>
              <h1 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 36, fontWeight: 400, lineHeight: 1.1,
                letterSpacing: -0.5, color: C.text, margin: 0,
              }}>
                {greeting}
              </h1>
              <p style={{ fontSize: 15, color: C.muted, marginTop: 6, fontWeight: 400 }}>
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* ──────────────────── Row 1: Your Day + Goals ──────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14,
          animation: 'fadeUp 0.65s cubic-bezier(0.4,0,0.2,1) 0.08s both',
        }}>
          {/* Your Day card */}
          <div style={cardStyle}>
            <p style={labelStyle}>Your Day</p>
            {[
              { icon: '☀', label: 'Wake',       value: formatTime(profile.wake_time)      },
              { icon: '◉', label: 'Briefing',   value: formatTime(profile.briefing_time)  },
              { icon: '🌙', label: 'Wind down', value: formatTime(profile.wind_down_time) },
            ].map((row, i, arr) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0',
                borderBottom: i < arr.length - 1 ? `1px solid ${C.divider}` : 'none',
              }}>
                <span style={{ fontSize: 12, color: C.muted }}>{row.icon}&nbsp; {row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text, fontVariantNumeric: 'tabular-nums' }}>
                  {row.value}
                </span>
              </div>
            ))}
            {profile.briefing_format && (
              <div style={{
                marginTop: 14, padding: '7px 12px', borderRadius: 10,
                background: C.accentDim, border: `1px solid ${C.accentBorder}`,
              }}>
                <span style={{ fontSize: 11, color: C.accent, fontWeight: 500 }}>
                  {getBriefingIcon(profile.briefing_format)}
                </span>
              </div>
            )}
          </div>

          {/* Goals card */}
          <div style={cardStyle}>
            <p style={labelStyle}>{getSectionLabel('goals', tone, pushiness)}</p>
            {goals && goals.length > 0 ? (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                  {goals.map(g => {
                    const meta = GOAL_META[g.category] || { icon: '◈', label: g.category };
                    return (
                      <div key={g.id} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 11px', borderRadius: 20,
                        background: C.faint, border: `1px solid ${C.cardBorder}`,
                      }}>
                        <span style={{ fontSize: 13 }}>{meta.icon}</span>
                        <span style={{ fontSize: 12, color: C.text }}>{meta.label}</span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 12, color: C.muted }}>
                  {goals.length} area{goals.length !== 1 ? 's' : ''} in focus
                </p>
              </>
            ) : (
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                No active goals yet.<br />
                <span style={{ color: C.accent, fontWeight: 500 }}>Add some in settings →</span>
              </p>
            )}
          </div>
        </div>

        {/* ──────────────────── People ──────────────────── */}
        {relationships && relationships.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 14, animation: 'fadeUp 0.65s cubic-bezier(0.4,0,0.2,1) 0.16s both' }}>
            <p style={labelStyle}>{getSectionLabel('people', tone, pushiness)}</p>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2, marginLeft: -2, paddingLeft: 2 }}>
              {relationships.map(r => {
                const nudge = getNudgeText(r.contact_frequency, r.last_contact_at, pushiness);
                const initials = r.person_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                const firstName = r.person_name.split(' ')[0];
                return (
                  <div key={r.id} style={{
                    flexShrink: 0, textAlign: 'center',
                    background: C.faint, border: `1px solid ${C.cardBorder}`,
                    borderRadius: 18, padding: '16px 14px', minWidth: 100,
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: C.accentDim, border: `1.5px solid ${C.accentBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 10px',
                      fontSize: 13, fontWeight: 600, color: C.accent,
                    }}>
                      {initials}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                      {firstName}
                    </p>
                    <p style={{ fontSize: 10, color: C.muted, marginBottom: nudge ? 8 : 0, textTransform: 'capitalize' }}>
                      {r.contact_frequency || 'weekly'}
                    </p>
                    {nudge && (
                      <div style={{
                        padding: '3px 8px', borderRadius: 8,
                        background: nudge.warm ? C.amberDim : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${nudge.warm ? C.amberBorder : C.cardBorder}`,
                      }}>
                        <span style={{ fontSize: 10, color: nudge.warm ? C.amber : C.muted, fontWeight: 500 }}>
                          {nudge.text}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ──────────────────── World news ──────────────────── */}
        {news?.enabled && (
          <div style={{ ...cardStyle, animation: 'fadeUp 0.65s cubic-bezier(0.4,0,0.2,1) 0.24s both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ ...labelStyle, marginBottom: 0 }}>{getSectionLabel('world', tone, pushiness)}</p>
              <span style={{
                fontSize: 10, fontWeight: 500, color: C.muted,
                padding: '4px 10px', borderRadius: 20,
                background: C.faint, border: `1px solid ${C.cardBorder}`,
              }}>
                {news.tone === 'positive' ? '☀ Positive' : news.tone === 'full' ? '🌐 Full reality' : '⚖ Balanced'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
              {tone === 'calm'
                ? 'World news included in your briefing.'
                : tone === 'hype'
                ? 'World news ready in your morning briefing! 🌍'
                : tone === 'pro'
                ? 'Global briefing included with your morning summary.'
                : 'Your morning briefing will include world news.'}
              {news.outlets?.length > 0 && (
                <span style={{ color: C.accent }}>
                  {' '}From {news.outlets.slice(0, 3).map((o: string) => OUTLET_NAMES[o] || o).join(', ')}
                  {news.outlets.length > 3 ? ` +${news.outlets.length - 3}` : ''}.
                </span>
              )}
            </p>
          </div>
        )}

        {/* ──────────────────── Footer status bar ──────────────────── */}
        <div style={{
          marginTop: 48, paddingTop: 20, borderTop: `1px solid ${C.divider}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          animation: 'fadeUp 0.5s ease 0.4s both',
        }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'Mode',  value: { voice: '🔊 Voice', text: '💬 Text', hybrid: '🔊💬 Hybrid' }[profile.response_mode as string] || '—' },
              { label: 'Style', value: { warm: 'Warm',  calm: 'Calm', pro: 'Pro', hype: 'Hyped' }[tone]  || '—' },
              { label: 'Push',  value: { gentle: 'Gentle', balanced: 'Balanced', firm: 'Firm' }[pushiness] || '—' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: C.muted }}>{item.label}</span>
                <span style={{ fontSize: 11, color: C.text, fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent }} />
            <p style={{ fontSize: 11, color: C.muted }}>Pulse</p>
          </div>
        </div>

      </div>
    </div>
  );
}
