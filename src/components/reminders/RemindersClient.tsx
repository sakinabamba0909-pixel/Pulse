'use client';

import { useState, useCallback } from 'react';

/* ═══ PALETTE ═══ */
var P = {
  bg:"#F7F3F0", bgWarm:"#F2EBE6",
  green:"#C2DC80", greenDark:"#7A9E35", greenSoft:"rgba(194,220,128,0.18)", greenBorder:"rgba(194,220,128,0.35)",
  pink:"#EA9CAF", pinkDark:"#B85A74", pinkSoft:"rgba(234,156,175,0.15)", pinkBorder:"rgba(234,156,175,0.30)",
  orchid:"#D56989", orchidDark:"#8F3552", orchidSoft:"rgba(213,105,137,0.12)", orchidBorder:"rgba(213,105,137,0.25)",
  lilac:"#F3EEF1", lilacDark:"#9B8FA0",
  ink:"#2D2026", inkSoft:"#6B5860", inkMuted:"#A8949C", inkFaint:"#D4C8CD",
  border:"rgba(45,32,38,0.07)", divider:"rgba(45,32,38,0.05)",
  shadow:"0 1px 2px rgba(45,32,38,0.03),0 6px 24px rgba(45,32,38,0.05)",
};

/* ═══ TYPES ═══ */
interface ReminderData {
  id: string;
  task_id: string | null;
  remind_at: string;
  channel: string;
  message: string | null;
  status: 'pending' | 'sent' | 'dismissed' | 'snoozed';
  created_at: string;
  task?: {
    id: string;
    title: string;
    due_at: string | null;
    priority: string;
    project?: { id: string; name: string; color: string } | null;
  } | null;
}

interface ProjectData {
  id: string;
  name: string;
  color: string;
  [key: string]: any;
}

/* ═══ HELPERS ═══ */
function isOverdue(remindAt: string): boolean {
  return new Date(remindAt) < new Date();
}

function isSoon(remindAt: string): boolean {
  var d = new Date(remindAt);
  var now = new Date();
  return !isOverdue(remindAt) && (d.getTime() - now.getTime()) < 90 * 60000;
}

function relLabel(remindAt: string): string {
  var d = new Date(remindAt);
  var now = new Date();
  var ms = d.getTime() - now.getTime();
  var m = Math.round(ms / 60000);
  if (m <= -60) return Math.abs(Math.round(m / 60)) + 'h overdue';
  if (m < 0) return Math.abs(m) + 'm overdue';
  if (m === 0) return 'right now';
  if (m < 60) return 'in ' + m + 'm';
  if (m < 1440) return 'in ' + Math.round(m / 60) + 'h';
  return 'in ' + Math.round(m / 1440) + 'd';
}

function fmtTime(remindAt: string): string {
  return new Date(remindAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtDate(remindAt: string): string {
  return new Date(remindAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* Note background colors based on priority / project */
var NOTE_COLORS = ['#FDE8EF', '#FEF3E2', '#EEF8DE', '#F0EEFA', '#FDDDE7'];

function noteColor(r: ReminderData, idx: number): string {
  var priority = r.task?.priority;
  if (priority === 'urgent') return '#FDDDE7';
  if (priority === 'high') return '#FEF3E2';
  if (priority === 'low') return '#EEF8DE';
  return NOTE_COLORS[idx % NOTE_COLORS.length];
}

function pinColor(r: ReminderData): string {
  if (r.task?.project?.color) return r.task.project.color;
  var priority = r.task?.priority;
  if (priority === 'urgent') return P.orchidDark;
  if (priority === 'high') return '#D4A47A';
  if (priority === 'low') return P.greenDark;
  return P.orchid;
}

/* Slight random-looking rotation based on index */
var ROTATIONS = [-2.1, 1.4, -1.0, 2.0, -0.8, 1.8, -1.5, 0.7, -2.2, 1.1, -0.5, 1.6];
function noteRotation(idx: number): number {
  return ROTATIONS[idx % ROTATIONS.length];
}

/* ═══ MAIN COMPONENT ═══ */
export default function RemindersClient({ initialReminders, initialProjects }: {
  initialReminders: ReminderData[];
  initialProjects: ProjectData[];
}) {
  var [reminders, setReminders] = useState(initialReminders);

  // Categorize
  var overdue = reminders.filter(r => (r.status === 'pending' || r.status === 'snoozed') && isOverdue(r.remind_at));
  var upcoming = reminders.filter(r => (r.status === 'pending' || r.status === 'snoozed') && !isOverdue(r.remind_at));
  var done = reminders.filter(r => r.status === 'dismissed' || r.status === 'sent');

  // Dismiss
  var dismiss = useCallback(async (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'dismissed' as const } : r));
    await fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'dismissed' }),
    }).catch(() => {});
  }, []);

  // Snooze
  var snooze = useCallback(async (id: string, option: string) => {
    var now = new Date();
    var newTime: Date;
    if (option === '15m') { newTime = new Date(now.getTime() + 15 * 60000); }
    else if (option === '1h') { newTime = new Date(now.getTime() + 60 * 60000); }
    else { newTime = new Date(now); newTime.setDate(newTime.getDate() + 1); newTime.setHours(8, 0, 0, 0); }

    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'snoozed' as const, remind_at: newTime.toISOString() } : r));
    await fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'snoozed', remind_at: newTime.toISOString() }),
    }).catch(() => {});
  }, []);

  // Add new reminder
  var addReminder = useCallback(async (message: string, remindAt: string) => {
    var res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, remind_at: remindAt, channel: 'push' }),
    });
    var data = await res.json();
    if (!data.error) {
      setReminders(prev => [...prev, data]);
    }
  }, []);

  // Title for a reminder
  function reminderTitle(r: ReminderData): string {
    return r.task?.title || r.message || 'Reminder';
  }

  // Subtitle
  function reminderSub(r: ReminderData): string | null {
    if (r.task?.title && r.message) return r.message;
    return null;
  }

  // Project info
  function reminderProject(r: ReminderData): { name: string; color: string } | null {
    if (r.task?.project) return r.task.project;
    return null;
  }

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", color: P.ink }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes noteIn{from{opacity:0;transform:translateY(24px) scale(0.92)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes glowPulse{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        button{font-family:'Outfit',sans-serif}
        button:active{transform:scale(0.97)}
        input:focus{outline:none}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(45,32,38,0.12);border-radius:2px}
        ::selection{background:rgba(213,105,137,0.2);color:#2D2026}
      `}</style>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 44px' }}>
        <div style={{ paddingTop: 48 }}>

          {/* Header placeholder — Step 2 */}
          <div style={{ marginBottom: 44, animation: 'fadeUp 0.7s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, color: P.inkMuted, letterSpacing: 0.5, fontWeight: 300, marginBottom: 10 }}>Reminders</p>
                <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 46, fontWeight: 200, letterSpacing: -1.5, color: P.ink, lineHeight: 0.95 }}>
                  Things to<br />
                  <em style={{ fontStyle: 'italic', color: P.orchid }}>remember.</em>
                </h1>
              </div>
              <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', paddingBottom: 4 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 200, color: P.orchid, lineHeight: 1, letterSpacing: -1 }}>{overdue.length}</p>
                  <p style={{ fontSize: 9, color: P.inkMuted, fontWeight: 300, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>overdue</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 200, color: P.pink, lineHeight: 1, letterSpacing: -1 }}>{upcoming.length}</p>
                  <p style={{ fontSize: 9, color: P.inkMuted, fontWeight: 300, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>coming up</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 200, color: P.green, lineHeight: 1, letterSpacing: -1 }}>{done.length}</p>
                  <p style={{ fontSize: 9, color: P.inkMuted, fontWeight: 300, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>done</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pinboard placeholder — Steps 3-6 */}
          <p style={{ fontSize: 14, color: P.inkMuted, fontWeight: 300 }}>
            {overdue.length + upcoming.length} active reminders · {done.length} completed
          </p>

        </div>
      </div>
    </div>
  );
}
