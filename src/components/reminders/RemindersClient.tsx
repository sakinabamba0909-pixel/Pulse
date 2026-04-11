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

var NOTE_COLORS = ['#FDE8EF', '#FEF3E2', '#EEF8DE', '#F0EEFA', '#FDDDE7'];

function noteColor(r: ReminderData, idx: number): string {
  var priority = r.task?.priority;
  if (priority === 'urgent') return '#FDDDE7';
  if (priority === 'high') return '#FEF3E2';
  if (priority === 'low') return '#EEF8DE';
  return NOTE_COLORS[idx % NOTE_COLORS.length];
}

function pinColorFor(r: ReminderData): string {
  if (r.task?.project?.color) return r.task.project.color;
  var priority = r.task?.priority;
  if (priority === 'urgent') return P.orchidDark;
  if (priority === 'high') return '#D4A47A';
  if (priority === 'low') return P.greenDark;
  return P.orchid;
}

var ROTATIONS = [-2.1, 1.4, -1.0, 2.0, -0.8, 1.8, -1.5, 0.7, -2.2, 1.1, -0.5, 1.6];

function reminderTitle(r: ReminderData): string {
  return r.task?.title || r.message || 'Reminder';
}
function reminderSub(r: ReminderData): string | null {
  if (r.task?.title && r.message) return r.message;
  return null;
}
function reminderProject(r: ReminderData): { name: string; color: string } | null {
  if (r.task?.project) return r.task.project;
  return null;
}

/* ═══ STICKY NOTE ═══ */
function StickyNote({ r, color, pin, rot, stagger, onDismiss, onSnooze }: {
  r: ReminderData; color: string; pin: string; rot: number; stagger: number;
  onDismiss: (id: string) => void; onSnooze: (id: string, opt: string) => void;
}) {
  var [lifted, setLifted] = useState(false);
  var [gone, setGone] = useState(false);
  var [snoozeOpen, setSnoozeOpen] = useState(false);
  var over = isOverdue(r.remind_at);
  var soon = isSoon(r.remind_at);
  var rel = relLabel(r.remind_at);
  var isDone = r.status === 'dismissed' || r.status === 'sent';
  var title = reminderTitle(r);
  var sub = reminderSub(r);
  var project = reminderProject(r);

  function handleDismiss() {
    setLifted(false);
    setGone(true);
    setTimeout(function () { onDismiss(r.id); }, 320);
  }

  if (gone) return (
    <div style={{ width: 200, height: 210, flexShrink: 0, opacity: 0, transition: 'opacity 0.3s' }} />
  );

  return (
    <div
      onMouseEnter={function () { setLifted(true); }}
      onMouseLeave={function () { setLifted(false); setSnoozeOpen(false); }}
      style={{
        width: 200, flexShrink: 0,
        position: 'relative',
        animation: 'noteIn 0.55s cubic-bezier(0.22,1,0.36,1) ' + (stagger * 0.07) + 's both',
        zIndex: lifted ? 30 : 1,
      }}
    >
      {/* PIN */}
      <div style={{
        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
        zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center',
        filter: 'drop-shadow(0 2px 3px rgba(45,32,38,0.18))',
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%,' + pin + 'CC,' + pin + ')',
          boxShadow: '0 0 0 2px rgba(255,255,255,0.6), 0 2px 4px rgba(45,32,38,0.25)',
        }} />
        <div style={{ width: 1.5, height: 10, background: 'rgba(45,32,38,0.25)', marginTop: -1 }} />
      </div>

      {/* NOTE BODY */}
      <div style={{
        marginTop: 8,
        background: isDone
          ? 'rgba(240,238,236,0.6)'
          : over
            ? 'linear-gradient(160deg,' + color + ',#FFF0F4)'
            : color,
        borderRadius: 4,
        padding: '18px 16px 14px',
        boxShadow: lifted
          ? '0 20px 50px rgba(45,32,38,0.18), 0 4px 12px rgba(45,32,38,0.10)'
          : over
            ? '0 4px 16px rgba(213,105,137,0.20), 0 1px 3px rgba(45,32,38,0.08)'
            : '0 3px 10px rgba(45,32,38,0.10), 0 1px 3px rgba(45,32,38,0.06)',
        transform: lifted
          ? 'rotate(0deg) translateY(-8px) scale(1.04)'
          : 'rotate(' + rot + 'deg)',
        transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease',
        cursor: 'default',
        minHeight: 190,
        display: 'flex', flexDirection: 'column' as const,
        opacity: isDone ? 0.45 : 1,
        backgroundImage: isDone ? 'none' : 'repeating-linear-gradient(0deg,transparent,transparent 23px,rgba(45,32,38,0.04) 24px)',
      }}>
        {/* time badge */}
        <div style={{
          position: 'absolute', top: 14, right: 12,
          fontSize: 9, fontWeight: 600,
          color: over ? P.orchidDark : soon ? '#9A6A00' : P.inkMuted,
          letterSpacing: 0.3,
          background: over ? 'rgba(213,105,137,0.15)' : soon ? 'rgba(212,164,122,0.2)' : 'rgba(45,32,38,0.06)',
          padding: '2px 7px', borderRadius: 20,
        }}>
          {rel.toUpperCase()}
        </div>

        {/* title */}
        <p style={{
          fontSize: 15, fontWeight: 500, color: P.ink,
          letterSpacing: -0.3, lineHeight: 1.35,
          marginBottom: 4, marginTop: 2,
          textDecoration: isDone ? 'line-through' : 'none',
          opacity: isDone ? 0.5 : 1,
          paddingRight: 36,
        }}>{title}</p>

        {sub && <p style={{ fontSize: 11, color: P.inkSoft, fontWeight: 300, lineHeight: 1.4, marginBottom: 6 }}>{sub}</p>}

        {/* rule line */}
        <div style={{ height: 1, background: 'rgba(45,32,38,0.08)', margin: '8px 0' }} />

        {/* project tag */}
        {project && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 'auto' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
            <p style={{ fontSize: 10, color: P.inkSoft, fontWeight: 300 }}>{project.name}</p>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* date + time */}
        <p style={{ fontSize: 10, color: P.inkMuted, fontWeight: 300, marginTop: 10 }}>
          {fmtDate(r.remind_at)} &middot; {fmtTime(r.remind_at)}
        </p>

        {/* hover actions */}
        {lifted && !isDone && (
          <div style={{
            display: 'flex', gap: 5, marginTop: 10,
            animation: 'fadeUp 0.2s ease both',
            position: 'relative',
          }}>
            <button onClick={function (e) { e.stopPropagation(); setSnoozeOpen(!snoozeOpen); }} style={{
              flex: 1, padding: '6px 0', borderRadius: 20,
              background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(45,32,38,0.10)',
              fontSize: 10, color: P.inkMuted, cursor: 'pointer', fontWeight: 300,
            }}>snooze</button>
            <button onClick={function (e) { e.stopPropagation(); handleDismiss(); }} style={{
              flex: 1, padding: '6px 0', borderRadius: 20,
              background: 'rgba(45,32,38,0.07)', border: '1px solid rgba(45,32,38,0.10)',
              fontSize: 10, color: P.inkSoft, cursor: 'pointer', fontWeight: 500,
            }}>done &#10003;</button>

            {snoozeOpen && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                background: 'rgba(247,243,240,0.97)', backdropFilter: 'blur(20px)',
                border: '1px solid ' + P.border, borderRadius: 12,
                padding: 5, zIndex: 50,
                boxShadow: '0 8px 28px rgba(45,32,38,0.14)',
                animation: 'fadeUp 0.2s ease both',
              }}>
                {[['15 minutes', '15m'], ['1 hour', '1h'], ['Tomorrow morning', 'tmr']].map(function (s) {
                  return <button key={s[1]} onClick={function (e) { e.stopPropagation(); onSnooze(r.id, s[1]); setSnoozeOpen(false); }} style={{
                    display: 'block', width: '100%', textAlign: 'left' as const,
                    padding: '8px 12px', borderRadius: 8,
                    background: 'transparent', border: 'none',
                    fontSize: 12, color: P.inkSoft, cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif", fontWeight: 300,
                  }}
                    onMouseEnter={function (e) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.8)'; }}
                    onMouseLeave={function (e) { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >{s[0]}</button>;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ ADD SHEET ═══ */
function AddSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (message: string, remindAt: string) => void }) {
  var [step, setStep] = useState(0);
  var [title, setTitle] = useState('');
  var [when, setWhen] = useState<number | null>(null);
  var [freq, setFreq] = useState<string | null>(null);
  var [saving, setSaving] = useState(false);

  function computeRemindAt(whenIdx: number): string {
    var now = new Date();
    var d: Date;
    switch (whenIdx) {
      case 0: d = new Date(now.getTime() + 30 * 60000); break;
      case 1: d = new Date(now.getTime() + 60 * 60000); break;
      case 2: d = new Date(now); d.setHours(19, 0, 0, 0); if (d <= now) d.setDate(d.getDate() + 1); break;
      case 3: d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); break;
      case 4: d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(14, 0, 0, 0); break;
      default: d = new Date(now.getTime() + 60 * 60000);
    }
    return d.toISOString();
  }

  async function handlePin() {
    if (!title.trim() || when === null) return;
    setSaving(true);
    await onAdd(title.trim(), computeRemindAt(when));
    setSaving(false);
    onClose();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 38, backdropFilter: 'blur(3px)', background: 'rgba(45,32,38,0.06)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 340, zIndex: 39, animation: 'slideIn 0.28s cubic-bezier(0.4,0,0.2,1) both' }}>
        <div style={{ height: '100%', background: 'rgba(247,243,240,0.92)', backdropFilter: 'blur(36px)', borderLeft: '1px solid ' + P.border, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid ' + P.divider }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: P.inkMuted, fontSize: 13, cursor: 'pointer', marginBottom: 14, padding: 0, fontFamily: "'Outfit',sans-serif" }}>{'\u2190'} Close</button>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 300, color: P.ink, letterSpacing: -0.8 }}>
              {['What?', 'When?', 'How often?'][step]}
            </h2>
            <div style={{ display: 'flex', gap: 5, marginTop: 12 }}>
              {[0, 1, 2].map(function (s) {
                return <div key={s} style={{ height: 2, borderRadius: 2, background: s <= step ? P.orchid : P.inkFaint, flex: s === step ? 2 : 1, transition: 'all 0.3s' }} />;
              })}
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {step === 0 && (
              <div style={{ animation: 'fadeUp 0.35s ease both' }}>
                <input
                  autoFocus value={title} onChange={function (e) { setTitle(e.target.value); }}
                  onKeyDown={function (e) { if (e.key === 'Enter' && title.trim()) setStep(1); }}
                  placeholder="Remind me to..."
                  style={{ width: '100%', border: 'none', borderBottom: '2px solid ' + (title ? P.orchid : P.inkFaint), background: 'transparent', fontSize: 17, fontWeight: 300, color: P.ink, outline: 'none', padding: '6px 0', marginBottom: 20, fontFamily: "'Outfit',sans-serif", transition: 'border-color 0.2s' }}
                />
                {['Call contractor about permits', 'Submit permit application', 'French speaking practice'].map(function (t, i) {
                  return <button key={i} onClick={function () { setTitle(t); }} style={{ display: 'block', width: '100%', textAlign: 'left' as const, padding: '10px 13px', borderRadius: 12, background: title === t ? P.pinkSoft : 'rgba(255,255,255,0.4)', border: '1px solid ' + (title === t ? P.pinkBorder : P.divider), cursor: 'pointer', fontSize: 13, color: title === t ? P.ink : P.inkSoft, fontWeight: title === t ? 500 : 300, marginBottom: 7, transition: 'all 0.2s' }}>{t}</button>;
                })}
              </div>
            )}

            {step === 1 && (
              <div style={{ animation: 'fadeUp 0.35s ease both', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[['In 30 minutes', 'soon'], ['In 1 hour', 'focused time'], ['This evening', '7:00 PM'], ['Tomorrow morning', '8:00 AM'], ['Tomorrow afternoon', '2:00 PM']].map(function (w, i) {
                  var sel = when === i;
                  return <button key={i} onClick={function () { setWhen(i); }} style={{ padding: '13px 15px', borderRadius: 15, background: sel ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.35)', border: '1px solid ' + (sel ? P.orchidBorder : P.divider), cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><p style={{ fontSize: 13, fontWeight: sel ? 500 : 300, color: P.ink }}>{w[0]}</p><p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 300 }}>{w[1]}</p></div>
                    {sel && <span style={{ color: P.orchid, fontSize: 14 }}>{'\u2713'}</span>}
                  </button>;
                })}
              </div>
            )}

            {step === 2 && (
              <div style={{ animation: 'fadeUp 0.35s ease both', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[['Just once', null], ['Daily', 'daily'], ['Weekdays', 'weekdays'], ['Weekly', 'weekly']].map(function (f) {
                  var sel = freq === f[1];
                  return <button key={String(f[1])} onClick={function () { setFreq(f[1]); }} style={{ padding: '13px 15px', borderRadius: 15, background: sel ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.35)', border: '1px solid ' + (sel ? P.greenBorder : P.divider), cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: sel ? 500 : 300, color: P.ink }}>{f[0]}</p>
                    {sel && <span style={{ color: P.green, fontSize: 14 }}>{'\u2713'}</span>}
                  </button>;
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 24px 24px', borderTop: '1px solid ' + P.divider, display: 'flex', gap: 8 }}>
            {step > 0 && <button onClick={function () { setStep(step - 1); }} style={{ padding: '11px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.4)', border: '1px solid ' + P.border, fontSize: 13, color: P.inkMuted, cursor: 'pointer' }}>{'\u2190'}</button>}
            <button
              onClick={function () { step < 2 ? setStep(step + 1) : handlePin(); }}
              disabled={(step === 0 && !title.trim()) || (step === 2 && saving)}
              style={{
                flex: 1, padding: '12px', borderRadius: 14,
                background: (step === 0 && !title.trim()) ? 'rgba(212,200,205,0.3)' : 'linear-gradient(135deg,' + P.orchid + ',' + P.pink + ')',
                color: (step === 0 && !title.trim()) ? P.inkFaint : 'white',
                border: 'none', fontSize: 14, fontWeight: 500,
                cursor: (step === 0 && !title.trim()) ? 'not-allowed' : 'pointer',
                boxShadow: (step === 0 && !title.trim()) ? 'none' : '0 4px 20px rgba(213,105,137,0.3)',
                fontFamily: "'Outfit',sans-serif", transition: 'all 0.2s',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {step === 2 ? (saving ? 'Pinning...' : 'Pin it \u2713') : 'Continue \u2192'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export default function RemindersClient({ initialReminders, initialProjects }: {
  initialReminders: ReminderData[];
  initialProjects: ProjectData[];
}) {
  var [reminders, setReminders] = useState(initialReminders);
  var [showAdd, setShowAdd] = useState(false);

  // Categorize
  var overdue = reminders.filter(r => (r.status === 'pending' || r.status === 'snoozed') && isOverdue(r.remind_at));
  var upcoming = reminders.filter(r => (r.status === 'pending' || r.status === 'snoozed') && !isOverdue(r.remind_at));
  var done = reminders.filter(r => r.status === 'dismissed' || r.status === 'sent');

  // Board order: overdue sorted by time, then upcoming sorted by time, then done
  var board = [
    ...overdue.sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()),
    ...upcoming.sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()),
    ...done,
  ];

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

          {/* ── HEADER ── */}
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

          {/* ── PINBOARD ── */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '32px 24px',
            alignItems: 'flex-start',
            animation: 'fadeUp 0.6s ease 0.1s both',
            paddingBottom: 80,
          }}>
            {board.map(function (r, i) {
              return <StickyNote
                key={r.id}
                r={r}
                color={noteColor(r, i)}
                pin={pinColorFor(r)}
                rot={ROTATIONS[i % ROTATIONS.length]}
                stagger={i}
                onDismiss={dismiss}
                onSnooze={snooze}
              />;
            })}

            {/* ADD NEW — ghost sticky */}
            <button onClick={function () { setShowAdd(true); }} style={{
              width: 200, minHeight: 190,
              marginTop: 8,
              background: 'rgba(255,255,255,0.28)',
              backdropFilter: 'blur(8px)',
              border: '1.5px dashed ' + P.inkFaint,
              borderRadius: 4,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: P.inkFaint,
              transform: 'rotate(1.2deg)',
              transition: 'all 0.2s',
              boxShadow: 'none',
            }}
              onMouseEnter={function (e) {
                e.currentTarget.style.transform = 'rotate(0deg) scale(1.03)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.50)';
                e.currentTarget.style.borderColor = P.orchid;
                e.currentTarget.style.color = P.orchid;
              }}
              onMouseLeave={function (e) {
                e.currentTarget.style.transform = 'rotate(1.2deg)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.28)';
                e.currentTarget.style.borderColor = P.inkFaint;
                e.currentTarget.style.color = P.inkFaint;
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 200, lineHeight: 1, marginBottom: 8 }}>+</span>
              <p style={{ fontSize: 12, fontWeight: 300, letterSpacing: 0.2 }}>new reminder</p>
            </button>
          </div>

          {/* Empty state */}
          {board.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 40px',
              animation: 'fadeUp 0.6s ease 0.1s both',
            }}>
              <p style={{ fontSize: 32, marginBottom: 16 }}>{'\u25F7'}</p>
              <p style={{ fontSize: 16, fontWeight: 500, color: P.ink, marginBottom: 6 }}>All clear</p>
              <p style={{ fontSize: 14, color: P.inkMuted, lineHeight: 1.6, fontWeight: 300 }}>
                Pin a reminder and it will appear here as a sticky note.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Add sheet */}
      {showAdd && <AddSheet onClose={function () { setShowAdd(false); }} onAdd={addReminder} />}
    </div>
  );
}
