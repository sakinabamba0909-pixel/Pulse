import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HeroSection from '@/components/home/HeroSection';
import TodayStrip from '@/components/home/TodayStrip';
import FocusSection from '@/components/home/FocusSection';
import type { FocusTask } from '@/components/home/FocusSection';
import ProjectsSection from '@/components/home/ProjectsSection';
import type { ProjectData } from '@/components/home/ProjectsSection';
import BottomRow from '@/components/home/BottomRow';

export const dynamic = 'force-dynamic';

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

function formatTime(time: string | null): string {
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AppPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: goals }, { data: relationships }, { data: rawTasks }, { data: rawProjects }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('goals').select('id,title,category,status').eq('user_id', user.id).eq('status', 'active'),
    supabase.from('relationships').select('id,person_name,category,contact_frequency,last_contact_at').eq('user_id', user.id).order('person_name'),
    supabase.from('tasks')
      .select('id,title,priority,due_at,is_pinned,is_delegated,duration_minutes,blocked_by_task_id,project:projects(name,color)')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .is('parent_task_id', null)
      .order('is_pinned', { ascending: false })
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(50),
    supabase.from('projects')
      .select('id,name,color,status,project_steps(id,name,status,step_number)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(6),
  ]);

  if (!profile?.onboarding_completed) redirect('/app/onboarding');

  const now = new Date();
  const tz = profile.timezone || 'America/New_York';
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD in user's tz
  const allTasks = (rawTasks ?? []).filter((t: any) => !t.blocked_by_task_id)
  // Only today's tasks for the Focus section (pinned + due today + no due date)
  const focusTasks = allTasks.filter((t: any) => t.is_pinned || !t.due_at || t.due_at?.startsWith(todayStr))
  const focusCount = focusTasks.length
  const hour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(now));
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: tz });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });

  const tone      = profile.tone      || 'warm';
  const greeting  = getGreeting(tone, hour);

  // Urgent task count
  const urgentCount = (rawTasks ?? []).filter((t: any) => t.priority === 'urgent').length;

  // Pulse AI messages
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

  // Today's schedule for TodayStrip
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
    const isCurrent = Math.abs(taskHour - currentHourFrac) < 1;
    return { time: timeLabel, label: t.title, color: PRIORITY_COLORS[t.priority] ?? '#D56989', isCurrent };
  });

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

  // Projects data
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

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: '#2D2026', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(45,32,38,0.12); border-radius: 2px; }
        button { font-family: 'Outfit', sans-serif; }
        button:active { transform: scale(0.97); }
      `}</style>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 44px 60px' }}>
        <div style={{ paddingTop: 48 }}>

          <HeroSection
            greeting={greeting}
            name={profile.name}
            dateStr={dateStr}
            timeStr={timeStr}
            urgentCount={urgentCount}
            pulseMessages={pulseMessages}
          />

          {scheduleEvents.length > 0 && (
            <TodayStrip events={scheduleEvents} dateLabel={shortDate} />
          )}

          <FocusSection tasks={focusTasks.map((t: any): FocusTask => {
            const proj = Array.isArray(t.project) ? t.project[0] : t.project;
            return {
              id: t.id,
              title: t.title,
              priority: t.priority,
              due_at: t.due_at,
              projectName: proj?.name,
              projectColor: proj?.color,
              isPinned: t.is_pinned,
            };
          })} />

          <ProjectsSection projects={projectsData} />

          <BottomRow
            rhythm={[
              { icon: '☀', time: formatTime(profile.wake_time), label: 'Wake' },
              { icon: '◉', time: formatTime(profile.briefing_time), label: 'Briefing' },
              { icon: '🌙', time: formatTime(profile.wind_down_time), label: 'Wind down' },
            ]}
            stats={[
              { val: String(focusCount), label: 'today', color: '#EA9CAF' },
              { val: String(projectsData.length), label: 'projects', color: '#C2DC80' },
              { val: '12', label: 'streak', color: '#D56989' },
            ]}
          />

        </div>
      </div>
    </div>
  );
}
