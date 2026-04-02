import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WorldSection from '@/components/home/WorldSection';
import HeroSection from '@/components/home/HeroSection';
import TodayStrip from '@/components/home/TodayStrip';
import FocusSection from '@/components/home/FocusSection';
import type { FocusTask } from '@/components/home/FocusSection';
import ProjectsSection from '@/components/home/ProjectsSection';
import type { ProjectData } from '@/components/home/ProjectsSection';

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

function getGreeting(tone: string, hour: number): string {
  const t = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  if (tone === 'hype') {
    return t === 'morning'   ? 'Rise & shine'
         : t === 'afternoon' ? 'Keep going'
                             : 'Evening check-in';
  }
  return `Good ${t}`;
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

  const [{ data: profile }, { data: goals }, { data: relationships }, { data: news }, { data: rawTasks }, { data: rawProjects }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('goals').select('id,title,category,status').eq('user_id', user.id).eq('status', 'active'),
    supabase.from('relationships').select('id,person_name,category,contact_frequency,last_contact_at').eq('user_id', user.id).order('person_name'),
    supabase.from('news_preferences').select('*').eq('user_id', user.id).single(),
    supabase.from('tasks')
      .select('id,title,priority,due_at,is_pinned,is_delegated,duration_minutes,blocked_by_task_id,project:projects(name,color)')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .is('parent_task_id', null)
      .order('is_pinned', { ascending: false })
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(12),
    supabase.from('projects')
      .select('id,name,color,status,project_steps(id,name,status,step_number)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(6),
  ]);

  if (!profile?.onboarding_completed) redirect('/app/onboarding');

  // Compute today's focus tasks (pinned first, then today by priority, max 3)
  const priorityRank = (p: string) => ({ urgent: 0, high: 1, normal: 2, low: 3 }[p] ?? 2)
  const todayStr = new Date().toISOString().split('T')[0]
  const focusTasks = (() => {
    const tasks = (rawTasks ?? []).filter(t => !t.blocked_by_task_id)
    const pinned = tasks.filter((t: any) => t.is_pinned)
    if (pinned.length >= 3) return pinned.slice(0, 3)
    const todayTasks = tasks
      .filter((t: any) => !t.is_pinned && t.due_at?.startsWith(todayStr))
      .sort((a: any, b: any) => priorityRank(a.priority) - priorityRank(b.priority))
    return [...pinned, ...todayTasks].slice(0, 3)
  })()

  const now = new Date();
  const tz = profile.timezone || 'America/New_York';
  const hour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(now));
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: tz });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });

  const tone      = profile.tone      || 'warm';
  const pushiness = profile.pushiness || 'balanced';
  const greeting  = getGreeting(tone, hour);

  // Urgent task count for HeroSection
  const urgentCount = (rawTasks ?? []).filter((t: any) => t.priority === 'urgent').length;

  // Generate contextual Pulse AI messages
  const pulseMessages: string[] = [];
  if (urgentCount > 0) pulseMessages.push(`You have ${urgentCount} urgent task${urgentCount !== 1 ? 's' : ''} — focus on those first.`);
  if (goals && goals.length > 0) pulseMessages.push(`${goals.length} goal${goals.length !== 1 ? 's' : ''} in focus — keep the momentum going.`);
  if (relationships && relationships.length > 0) {
    const overdue = relationships.filter(r => {
      const thresholds: Record<string, number> = { daily: 2, weekly: 9, biweekly: 16, monthly: 35 };
      const threshold = thresholds[r.contact_frequency?.toLowerCase()] ?? 9;
      const days = r.last_contact_at ? Math.floor((Date.now() - new Date(r.last_contact_at).getTime()) / 86400000) : null;
      return days !== null && days >= threshold;
    });
    if (overdue.length > 0) pulseMessages.push(`${overdue[0].person_name} might appreciate a quick check-in.`);
  }
  if (pulseMessages.length === 0) pulseMessages.push('Your schedule looks manageable today.');

  // Build today's schedule for TodayStrip
  const PRIORITY_COLORS: Record<string, string> = {
    urgent: '#D4727A', high: '#D4A47A', normal: '#D56989', low: '#D4C8CD',
  };
  const todayTasks = (rawTasks ?? [])
    .filter((t: any) => t.due_at?.startsWith(todayStr))
    .sort((a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

  const scheduleEvents = todayTasks.map((t: any) => {
    const d = new Date(t.due_at);
    const h = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(d));
    const m = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, minute: '2-digit' }).format(d));
    const timeLabel = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    const taskHour = h + m / 60;
    const currentHourFrac = hour + new Date().getMinutes() / 60;
    const isCurrent = Math.abs(taskHour - currentHourFrac) < 1; // within 1 hour
    return {
      time: timeLabel,
      label: t.title,
      color: PRIORITY_COLORS[t.priority] ?? '#D56989',
      isCurrent,
    };
  });

  // Add wake/wind-down anchors if no tasks overlap those times
  if (profile.wake_time) {
    const wakeH = parseInt(profile.wake_time.split(':')[0]);
    if (!scheduleEvents.some((e: any) => e.time.startsWith(String(wakeH % 12 || 12)))) {
      scheduleEvents.unshift({ time: formatTime(profile.wake_time), label: 'Wake', color: '#D4C8CD', isCurrent: false });
    }
  }
  if (profile.wind_down_time) {
    const windH = parseInt(profile.wind_down_time.split(':')[0]);
    if (!scheduleEvents.some((e: any) => e.time.startsWith(String(windH % 12 || 12)))) {
      scheduleEvents.push({ time: formatTime(profile.wind_down_time), label: 'Wind down', color: '#D4C8CD', isCurrent: false });
    }
  }

  const shortDate = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: tz });

  // Build projects data for ProjectsSection
  const projectsData: ProjectData[] = (rawProjects ?? []).map((p: any) => {
    const steps = p.project_steps ?? [];
    const total = steps.length;
    const doneCount = steps.filter((s: any) => s.status === 'done').length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const activeStep = steps
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .find((s: any) => s.status === 'active' || s.status === 'pending');
    return {
      name: p.name,
      color: p.color || '#D56989',
      pct,
      step: activeStep?.name || (doneCount === total && total > 0 ? 'Complete' : 'No steps yet'),
    };
  });

  // ─── Palette (pink/green/orchid) ───
  const C = {
    bg:          '#F7F3F0',
    bgWarm:      '#F2EBE6',
    card:        'rgba(255,255,255,0.52)',
    cardBorder:  'rgba(45,32,38,0.07)',
    text:        '#2D2026',
    muted:       '#A8949C',
    inkSoft:     '#6B5860',
    faint:       'rgba(45,32,38,0.03)',
    divider:     'rgba(45,32,38,0.05)',
    orchid:      '#D56989',
    orchidSoft:  'rgba(213,105,137,0.12)',
    orchidBorder:'rgba(213,105,137,0.25)',
    green:       '#C2DC80',
    greenSoft:   'rgba(194,220,128,0.18)',
    greenBorder: 'rgba(194,220,128,0.35)',
    pink:        '#EA9CAF',
    pinkSoft:    'rgba(234,156,175,0.15)',
    pinkBorder:  'rgba(234,156,175,0.30)',
    amber:       '#D4A47A',
    amberDim:    'rgba(212,164,122,0.10)',
    amberBorder: 'rgba(212,164,122,0.25)',
  };

  const cardStyle: React.CSSProperties = {
    background: C.card, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${C.cardBorder}`,
    borderRadius: 22,
    padding: '22px 24px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: C.muted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 18,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: C.text, fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(213,105,137,0); }
          50%       { box-shadow: 0 0 16px 4px rgba(213,105,137,0.1); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 0; width: 0; }
      `}</style>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 24px 100px' }}>

        {/* ──────────────────── Hero greeting ──────────────────── */}
        <div style={{ paddingTop: 64 }}>
          <HeroSection
            greeting={greeting}
            name={profile.name}
            dateStr={dateStr}
            timeStr={timeStr}
            urgentCount={urgentCount}
            pulseMessages={pulseMessages}
          />
        </div>

        {/* ──────────────────── Today Strip timeline ──────────────────── */}
        {scheduleEvents.length > 0 && (
          <TodayStrip events={scheduleEvents} dateLabel={shortDate} />
        )}

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
                background: C.orchidSoft, border: `1px solid ${C.orchidBorder}`,
              }}>
                <span style={{ fontSize: 11, color: C.orchid, fontWeight: 500 }}>
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
                <span style={{ color: C.orchid, fontWeight: 500 }}>Add some in settings →</span>
              </p>
            )}
          </div>
        </div>

        {/* ──────────────────── Focus Tasks ──────────────────── */}
        <FocusSection tasks={focusTasks.map((t: any): FocusTask => {
          const proj = Array.isArray(t.project) ? t.project[0] : t.project;
          return {
            id: t.id,
            title: t.title,
            priority: t.priority,
            projectName: proj?.name,
            projectColor: proj?.color,
            isUrgent: t.priority === 'urgent',
          };
        })} />

        {/* ──────────────────── Projects ──────────────────── */}
        <ProjectsSection projects={projectsData} />

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
                      background: C.orchidSoft, border: `1.5px solid ${C.orchidBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 10px',
                      fontSize: 13, fontWeight: 600, color: C.orchid,
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
          <div style={{ animation: 'fadeUp 0.65s cubic-bezier(0.4,0,0.2,1) 0.24s both' }}>
            <WorldSection tone={tone} sectionLabel={getSectionLabel('world', tone, pushiness)} />
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
              { label: 'Style', value: ({ warm: 'Warm', calm: 'Calm', pro: 'Pro', hype: 'Hyped' } as Record<string, string>)[tone] || '—' },
              { label: 'Push',  value: ({ gentle: 'Gentle', balanced: 'Balanced', firm: 'Firm' } as Record<string, string>)[pushiness] || '—' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: C.muted }}>{item.label}</span>
                <span style={{ fontSize: 11, color: C.text, fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.orchid }} />
            <p style={{ fontSize: 11, color: C.muted }}>Pulse</p>
          </div>
        </div>

      </div>
    </div>
  );
}
