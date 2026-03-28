'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

var FONT_URL =
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300&display=swap';

var T = {
  ink: '#2D2A26', inkSoft: '#5C5650', inkMuted: '#9E958B', inkFaint: '#C9C1B8',
  accent: '#9B7EC8', accentSoft: 'rgba(155,126,200,0.10)', accentMid: 'rgba(155,126,200,0.18)',
  accentBorder: 'rgba(155,126,200,0.25)', accentText: '#7B5EA8', accentGlow: 'rgba(155,126,200,0.15)',
  rose: '#D4849A', roseSoft: 'rgba(212,132,154,0.10)',
  peach: '#D4A47A', peachSoft: 'rgba(212,164,122,0.10)',
  sky: '#7AABC8', skySoft: 'rgba(122,171,200,0.10)',
  sage: '#7EB89B', sageSoft: 'rgba(126,184,155,0.10)',
  urgent: '#D4727A', urgentSoft: 'rgba(212,114,122,0.10)',
  border: 'rgba(0,0,0,0.05)', borderHover: 'rgba(0,0,0,0.08)',
  borderGlow: 'rgba(155,126,200,0.18)', divider: 'rgba(0,0,0,0.04)',
  shadow: '0 1px 2px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.03)',
  shadowHover: '0 2px 8px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.05)',
  shadowGlow: '0 0 24px rgba(155,126,200,0.08), 0 4px 16px rgba(0,0,0,0.03)',
};

var DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
var PX_PER_HOUR = 72;

/* ═══ GANZFELD LIGHT ═══ */
function GanzfeldLight() {
  var phaseRef = useRef(0);
  var colorsRef = useRef({
    a: [30, 40, 91], b: [280, 35, 90], c: [50, 35, 93], d: [10, 30, 94],
  });
  var [colors, setColors] = useState(colorsRef.current);
  var frameRef = useRef(null);

  useEffect(function () {
    function tick() {
      phaseRef.current += 0.002;
      var t = phaseRef.current;
      var drift = Math.sin(t) * 4;
      var drift2 = Math.cos(t * 0.7) * 3;
      var c = colorsRef.current;
      setColors({
        a: [c.a[0] + drift, c.a[1], c.a[2]],
        b: [c.b[0] + drift2, c.b[1], c.b[2]],
        c: [c.c[0] - drift, c.c[1], c.c[2]],
        d: [c.d[0] + drift2, c.d[1], c.d[2]],
      });
      frameRef.current = requestAnimationFrame(tick);
    }
    tick();
    return function () { cancelAnimationFrame(frameRef.current); };
  }, []);

  function hsl(arr, alpha) {
    return 'hsla(' + Math.round(arr[0]) + ',' + Math.round(arr[1]) + '%,' + Math.round(arr[2]) + '%,' + alpha + ')';
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#F0EBE6' }} />
      <div style={{ position: 'absolute', inset: '-20%', background: 'radial-gradient(ellipse 120% 100% at 15% 10%, ' + hsl(colors.a, 0.35) + ' 0%, ' + hsl(colors.a, 0.12) + ' 40%, transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: '-20%', background: 'radial-gradient(ellipse 100% 120% at 75% 25%, ' + hsl(colors.b, 0.3) + ' 0%, ' + hsl(colors.b, 0.1) + ' 35%, transparent 65%)' }} />
      <div style={{ position: 'absolute', inset: '-20%', background: 'radial-gradient(ellipse 140% 80% at 50% 95%, ' + hsl(colors.c, 0.25) + ' 0%, ' + hsl(colors.c, 0.08) + ' 40%, transparent 65%)' }} />
      <div style={{ position: 'absolute', inset: '-30%', background: 'radial-gradient(ellipse 60% 50% at 55% 35%, ' + hsl(colors.d, 0.18) + ' 0%, transparent 60%)' }} />
    </div>
  );
}

/* ═══ ORB ═══ */
function Orb({ size }) {
  var s = size || 24;
  return (
    <div style={{
      width: s, height: s, borderRadius: '50%', flexShrink: 0,
      background: 'radial-gradient(circle at 40% 40%, rgba(212,168,200,0.7), rgba(155,126,200,0.4), rgba(155,126,200,0))',
      boxShadow: '0 0 12px rgba(155,126,200,0.25)',
    }} />
  );
}

/* ═══ HELPERS ═══ */
function getMonday(d) {
  var date = new Date(d);
  date.setHours(0, 0, 0, 0);
  var day = date.getDay();
  var diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(d, n) {
  var r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtHour(h) {
  if (h === 12) return '12 PM';
  if (h < 12) return h + ' AM';
  return (h - 12) + ' PM';
}

function fmtSlotLabel(h) {
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h % 12 || 12;
  var mins = (h % 1 !== 0) ? '30' : '00';
  return h12 + ':' + mins + ' ' + ampm;
}

function fmtTime(d) {
  var h = d.getHours();
  var m = d.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h % 12 || 12;
  return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
}

/* Convert tasks into calendar event objects */
function buildCalendarEvents(tasks) {
  return tasks
    .filter(function (t) { return t.scheduled_start || t.due_at; })
    .map(function (t) {
      var start = new Date(t.scheduled_start || t.due_at);
      var dur = t.duration_minutes || 60;
      var end = t.scheduled_end ? new Date(t.scheduled_end) : new Date(start.getTime() + dur * 60000);
      var proj = t.project;
      var color = proj && proj.color ? proj.color : T.accent;
      var type = proj ? 'project' : 'task';
      return {
        id: t.id,
        title: t.title,
        start: start,
        end: end,
        startHour: start.getHours() + start.getMinutes() / 60,
        endHour: end.getHours() + end.getMinutes() / 60,
        color: color,
        type: type,
        project: proj ? proj.name : null,
        projectId: proj ? proj.id : null,
        status: t.status,
        taskData: t,
      };
    });
}

/* ═══ EVENT DETAIL PANEL ═══ */
function EventDetailPanel({ event, projects, onClose, onRefresh }) {
  var isGcal = event.type === 'gcal';
  var [editing, setEditing] = useState(false);
  var [title, setTitle] = useState(event.title);
  var [date, setDate] = useState(event.start.toISOString().split('T')[0]);
  var [startTime, setStartTime] = useState(
    event.start.getHours().toString().padStart(2, '0') + ':' + event.start.getMinutes().toString().padStart(2, '0')
  );
  var [endTime, setEndTime] = useState(
    event.end.getHours().toString().padStart(2, '0') + ':' + event.end.getMinutes().toString().padStart(2, '0')
  );
  var [projectId, setProjectId] = useState(event.projectId || '');
  var [saving, setSaving] = useState(false);
  var [confirmDelete, setConfirmDelete] = useState(false);

  var durationMins = Math.round((event.end - event.start) / 60000);

  async function handleSave() {
    if (isGcal) return;
    setSaving(true);
    var scheduledStart = new Date(date + 'T' + startTime + ':00');
    var scheduledEnd = new Date(date + 'T' + endTime + ':00');
    var dur = Math.round((scheduledEnd - scheduledStart) / 60000);
    var body = { title: title, scheduled_start: scheduledStart.toISOString(), scheduled_end: scheduledEnd.toISOString(), duration_minutes: dur > 0 ? dur : 60 };
    if (projectId) body.project_id = projectId;
    await fetch('/api/tasks/' + event.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    onRefresh();
  }

  async function handleComplete() {
    if (isGcal) return;
    await fetch('/api/tasks/' + event.id + '/complete', { method: 'POST' });
    onRefresh();
  }

  async function handleDelete() {
    if (isGcal) return;
    await fetch('/api/tasks/' + event.id, { method: 'DELETE' });
    onRefresh();
  }

  // Panel project info
  var projMatch = projects.find(function (p) { return p.id === event.projectId; });
  var statusLabel = event.status === 'done' ? 'Completed' : event.status === 'pending' ? 'Pending' : event.status || '—';

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 370,
      background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
      borderLeft: '1px solid ' + T.border,
      boxShadow: '-8px 0 40px rgba(0,0,0,0.06)',
      zIndex: 30, display: 'flex', flexDirection: 'column',
      animation: 'slideR 0.3s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 22px 16px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid ' + T.divider,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
          background: isGcal ? T.inkFaint : event.color,
          boxShadow: isGcal ? 'none' : '0 0 8px ' + event.color + '55',
        }} />
        <span style={{
          flex: 1, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: 0.8, color: T.inkMuted,
        }}>
          {isGcal ? 'Google Calendar' : event.project || 'Task'}
        </span>
        <button onClick={onClose} style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(0,0,0,0.04)', border: 'none',
          fontSize: 15, color: T.inkMuted, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{'\u2715'}</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
        {/* Title */}
        {editing ? (
          <input value={title} onChange={function (e) { setTitle(e.target.value); }} style={{
            width: '100%', fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif",
            color: T.ink, background: 'rgba(0,0,0,0.03)', border: '1px solid ' + T.accentBorder,
            borderRadius: 10, padding: '10px 14px', marginBottom: 16, boxSizing: 'border-box',
          }} />
        ) : (
          <h3 style={{
            fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500,
            color: T.ink, letterSpacing: -0.3, marginBottom: 16, lineHeight: 1.35,
          }}>{event.title}</h3>
        )}

        {/* Info rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Date & Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, width: 22, textAlign: 'center', color: T.inkMuted }}>◷</span>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <input type="date" value={date} onChange={function (e) { setDate(e.target.value); }} style={{
                  fontSize: 13, color: T.ink, background: 'rgba(0,0,0,0.03)', border: '1px solid ' + T.border,
                  borderRadius: 8, padding: '7px 10px', fontFamily: "'Outfit', sans-serif",
                }} />
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="time" value={startTime} onChange={function (e) { setStartTime(e.target.value); }} style={{
                    fontSize: 13, color: T.ink, background: 'rgba(0,0,0,0.03)', border: '1px solid ' + T.border,
                    borderRadius: 8, padding: '7px 10px', flex: 1, fontFamily: "'Outfit', sans-serif",
                  }} />
                  <span style={{ fontSize: 11, color: T.inkFaint }}>→</span>
                  <input type="time" value={endTime} onChange={function (e) { setEndTime(e.target.value); }} style={{
                    fontSize: 13, color: T.ink, background: 'rgba(0,0,0,0.03)', border: '1px solid ' + T.border,
                    borderRadius: 8, padding: '7px 10px', flex: 1, fontFamily: "'Outfit', sans-serif",
                  }} />
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>
                  {DAYS_SHORT[(event.start.getDay() + 6) % 7]}, {MONTH_NAMES[event.start.getMonth()]} {event.start.getDate()}
                </p>
                <p style={{ fontSize: 12, color: T.inkMuted, marginTop: 2 }}>
                  {fmtTime(event.start)} – {fmtTime(event.end)}
                  <span style={{ marginLeft: 8, fontSize: 11, color: T.inkFaint }}>({durationMins} min)</span>
                </p>
              </div>
            )}
          </div>

          {/* Project */}
          {(event.project || editing) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, width: 22, textAlign: 'center', color: T.inkMuted }}>▦</span>
              {editing ? (
                <select value={projectId} onChange={function (e) { setProjectId(e.target.value); }} style={{
                  fontSize: 13, color: T.ink, background: 'rgba(0,0,0,0.03)', border: '1px solid ' + T.border,
                  borderRadius: 8, padding: '7px 10px', flex: 1, fontFamily: "'Outfit', sans-serif",
                }}>
                  <option value="">No project</option>
                  {projects.map(function (p) {
                    return <option key={p.id} value={p.id}>{p.name}</option>;
                  })}
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {projMatch && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: projMatch.color || T.accent,
                    }} />
                  )}
                  <p style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{event.project}</p>
                </div>
              )}
            </div>
          )}

          {/* Status (non-gcal) */}
          {!isGcal && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, width: 22, textAlign: 'center', color: T.inkMuted }}>
                {event.status === 'done' ? '✓' : '◻'}
              </span>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 8,
                background: event.status === 'done' ? T.sageSoft : T.accentSoft,
                border: '1px solid ' + (event.status === 'done' ? T.sage + '30' : T.accentBorder),
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: event.status === 'done' ? T.sage : T.accent,
                }} />
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: event.status === 'done' ? T.sage : T.accentText,
                }}>{statusLabel}</span>
              </div>
            </div>
          )}

          {/* Google Calendar badge */}
          {isGcal && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(0,0,0,0.02)', border: '1px solid ' + T.divider,
              marginTop: 4,
            }}>
              <span style={{ fontSize: 14 }}>📅</span>
              <span style={{ fontSize: 12, color: T.inkMuted, fontWeight: 500 }}>
                Synced from Google Calendar
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      {!isGcal && (
        <div style={{
          padding: '16px 22px', borderTop: '1px solid ' + T.divider,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: 'linear-gradient(135deg,' + T.accent + ',' + T.rose + ')',
                color: '#FFF', border: 'none', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1,
              }}>{saving ? 'Saving…' : 'Save changes'}</button>
              <button onClick={function () { setEditing(false); setTitle(event.title); }} style={{
                padding: '10px 16px', borderRadius: 10,
                background: 'rgba(0,0,0,0.04)', border: '1px solid ' + T.border,
                fontSize: 13, fontWeight: 500, color: T.inkMuted, cursor: 'pointer',
              }}>Cancel</button>
            </div>
          ) : (
            <>
              {/* Action buttons row */}
              <div style={{ display: 'flex', gap: 8 }}>
                {event.status !== 'done' && (
                  <button onClick={handleComplete} style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    background: T.sageSoft, border: '1px solid ' + T.sage + '30',
                    fontSize: 13, fontWeight: 600, color: T.sage, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>✓ Done</button>
                )}
                <button onClick={function () { setEditing(true); }} style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  background: T.accentSoft, border: '1px solid ' + T.accentBorder,
                  fontSize: 13, fontWeight: 600, color: T.accentText, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>Edit</button>
              </div>

              {/* Delete */}
              {confirmDelete ? (
                <div style={{
                  display: 'flex', gap: 8, padding: '8px 12px', borderRadius: 10,
                  background: T.urgentSoft, border: '1px solid ' + T.urgent + '30',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 12, color: T.urgent, fontWeight: 500, flex: 1 }}>Delete this task?</span>
                  <button onClick={handleDelete} style={{
                    padding: '5px 14px', borderRadius: 8,
                    background: T.urgent, color: '#FFF', border: 'none',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>Yes</button>
                  <button onClick={function () { setConfirmDelete(false); }} style={{
                    padding: '5px 14px', borderRadius: 8,
                    background: 'rgba(0,0,0,0.04)', border: '1px solid ' + T.border,
                    fontSize: 12, fontWeight: 500, color: T.inkMuted, cursor: 'pointer',
                  }}>No</button>
                </div>
              ) : (
                <button onClick={function () { setConfirmDelete(true); }} style={{
                  padding: '9px 0', borderRadius: 10,
                  background: 'transparent', border: '1px solid ' + T.border,
                  fontSize: 12, fontWeight: 500, color: T.inkFaint, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>Delete task</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export default function CalendarClient({ tasks, projects, calendarConnected }) {
  var router = useRouter();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  // Core state
  var [calView, setCalView] = useState('week'); // 'day' | 'week' | 'month'
  var [weekStart, setWeekStart] = useState(getMonday(new Date()));
  var [selectedEvent, setSelectedEvent] = useState(null);
  var [showAddModal, setShowAddModal] = useState(false);
  var [showPulseBar, setShowPulseBar] = useState(true);
  var [slotContext, setSlotContext] = useState(null); // { date, hour } for grid clicks
  var [floatHovered, setFloatHovered] = useState(false);
  var [hoverSlot, setHoverSlot] = useState(null); // { colIdx, hour }
  var scrollRef = useRef(null);

  // Scroll to current hour on mount
  useEffect(function () {
    if (scrollRef.current) {
      var now = new Date();
      var scrollTo = (now.getHours() - 8 - 1) * PX_PER_HOUR;
      scrollRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, [calView]);

  // Google calendar events (fetched client-side)
  var [gcalEvents, setGcalEvents] = useState([]);
  var [gcalLoaded, setGcalLoaded] = useState(false);

  // Build pulse task events from server data
  var pulseEvents = buildCalendarEvents(tasks);

  // Fetch Google Calendar events for the visible range
  useEffect(function () {
    if (!calendarConnected) { setGcalLoaded(true); return; }
    var start = weekStart;
    var end = addDays(weekStart, calView === 'day' ? 1 : calView === 'week' ? 7 : 35);
    fetch('/api/calendar/events?start=' + start.toISOString() + '&end=' + end.toISOString())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var mapped = (data.events || []).map(function (e) {
          var s = new Date(e.start);
          var en = new Date(e.end);
          return {
            id: 'gcal_' + e.id,
            title: e.title,
            start: s,
            end: en,
            startHour: s.getHours() + s.getMinutes() / 60,
            endHour: en.getHours() + en.getMinutes() / 60,
            color: T.inkFaint,
            type: 'gcal',
            project: null,
            projectId: null,
            status: null,
            taskData: null,
          };
        });
        setGcalEvents(mapped);
        setGcalLoaded(true);
      })
      .catch(function () { setGcalLoaded(true); });
  }, [weekStart, calView, calendarConnected]);

  // All events combined
  var allEvents = pulseEvents.concat(gcalEvents);

  // Navigation
  var goToday = function () { setWeekStart(getMonday(new Date())); };
  var goPrev = function () {
    if (calView === 'day') setWeekStart(addDays(weekStart, -1));
    else if (calView === 'week') setWeekStart(addDays(weekStart, -7));
    else setWeekStart(addDays(weekStart, -28));
  };
  var goNext = function () {
    if (calView === 'day') setWeekStart(addDays(weekStart, 1));
    else if (calView === 'week') setWeekStart(addDays(weekStart, 7));
    else setWeekStart(addDays(weekStart, 28));
  };

  // Columns for current view
  var columns = [];
  var numDays = calView === 'day' ? 1 : calView === 'week' ? 7 : 0;
  for (var i = 0; i < numDays; i++) {
    columns.push(addDays(weekStart, i));
  }

  // Header title
  var headerTitle = '';
  if (calView === 'day') {
    headerTitle = DAYS_SHORT[(weekStart.getDay() + 6) % 7] + ', ' + MONTH_NAMES[weekStart.getMonth()] + ' ' + weekStart.getDate() + ', ' + weekStart.getFullYear();
  } else if (calView === 'week') {
    var endDate = addDays(weekStart, 6);
    headerTitle = MONTH_NAMES[weekStart.getMonth()] + (weekStart.getMonth() !== endDate.getMonth() ? ' – ' + MONTH_NAMES[endDate.getMonth()] : '') + ' ' + weekStart.getFullYear();
  } else {
    headerTitle = MONTH_NAMES[weekStart.getMonth()] + ' ' + weekStart.getFullYear();
  }

  // Open modal from empty slot click
  function openModalFromSlot(slot) {
    setSlotContext(slot);
    setShowAddModal(true);
  }
  function closeModal() {
    setShowAddModal(false);
    setSlotContext(null);
  }

  // Compute now-line position
  var now = new Date();
  var nowHour = now.getHours() + now.getMinutes() / 60;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", color: T.ink, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <link href={FONT_URL} rel="stylesheet" />
      <style>{
        '::selection { background: ' + T.accentMid + '; color: ' + T.accentText + '; }' +
        '::-webkit-scrollbar { width: 4px; height: 4px; }' +
        '::-webkit-scrollbar-thumb { background: ' + T.inkFaint + '; border-radius: 2px; }' +
        '@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }' +
        '@keyframes slideR { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }' +
        '@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }' +
        '@keyframes glowPulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.9; } }' +
        '@keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.1); } }' +
        '@keyframes floatBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }' +
        "button { font-family: 'Outfit', sans-serif; } button:active { transform: scale(0.97); }" +
        'input:focus, textarea:focus { outline: none; }'
      }</style>

      <GanzfeldLight />

      {/* ═══ TOP BAR ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 28px',
        background: 'rgba(255,255,255,0.28)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid ' + T.border,
        flexShrink: 0, zIndex: 10, position: 'relative',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={goToday} style={{ padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.65)', border: '1px solid ' + T.border, fontSize: 12, fontWeight: 600, color: T.accentText, cursor: 'pointer' }}>Today</button>
          <button onClick={goPrev} style={{ padding: '7px 11px', borderRadius: 10, background: 'transparent', border: '1px solid ' + T.border, fontSize: 13, color: T.inkMuted, cursor: 'pointer' }}>{'\u2039'}</button>
          <button onClick={goNext} style={{ padding: '7px 11px', borderRadius: 10, background: 'transparent', border: '1px solid ' + T.border, fontSize: 13, color: T.inkMuted, cursor: 'pointer' }}>{'\u203A'}</button>
        </div>

        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 400, color: T.ink, letterSpacing: -0.3, flex: 1 }}>{headerTitle}</h2>

        <div style={{ display: 'flex', gap: 3, background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 3 }}>
          {[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }].map(function (v) {
            var active = calView === v.id;
            return (
              <button key={v.id} onClick={function () { setCalView(v.id); if (v.id === 'day') setWeekStart(new Date(today)); else if (v.id === 'week') setWeekStart(getMonday(today)); }} style={{
                padding: '6px 14px', borderRadius: 9,
                background: active ? 'rgba(255,255,255,0.85)' : 'transparent',
                border: active ? '1px solid ' + T.accentBorder : '1px solid transparent',
                fontSize: 12, fontWeight: active ? 600 : 400,
                color: active ? T.accentText : T.inkMuted, cursor: 'pointer',
                boxShadow: active ? T.shadow : 'none', transition: 'all 0.2s',
              }}>{v.label}</button>
            );
          })}
        </div>

        <button onClick={function () { setSlotContext(null); setShowAddModal(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', borderRadius: 12,
          background: 'linear-gradient(135deg,' + T.accent + ',' + T.rose + ')',
          color: '#FFF', border: 'none', fontSize: 13, fontWeight: 600,
          boxShadow: '0 3px 16px rgba(155,126,200,0.35)', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 18, fontWeight: 300 }}>+</span> Add event
        </button>
      </div>

      {/* ═══ CALENDAR BODY ═══ */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative', zIndex: 1 }}>

        {/* ═══ WEEK / DAY VIEW ═══ */}
        {(calView === 'week' || calView === 'day') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>

            {/* Day headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '56px repeat(' + columns.length + ', 1fr)',
              borderBottom: '1px solid ' + T.border,
              background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(20px)',
              flexShrink: 0, zIndex: 10,
            }}>
              <div style={{ borderRight: '1px solid ' + T.divider }} />
              {columns.map(function (col, ci) {
                var isToday = sameDay(col, today);
                var isWeekend = col.getDay() === 0 || col.getDay() === 6;
                var dayLabel = DAYS_SHORT[(col.getDay() + 6) % 7];
                return (
                  <div key={ci} style={{
                    padding: '10px 6px 12px', textAlign: 'center',
                    borderRight: ci < columns.length - 1 ? '1px solid ' + T.divider : 'none',
                    background: isToday ? 'rgba(155,126,200,0.04)' : 'transparent',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: isWeekend ? T.inkFaint : T.inkMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>{dayLabel}</p>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', margin: '0 auto',
                      background: isToday ? 'linear-gradient(135deg,' + T.accent + ',' + T.rose + ')' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <p style={{ fontSize: 14, fontWeight: isToday ? 700 : 500, color: isToday ? '#FFF' : isWeekend ? T.inkFaint : T.ink }}>{col.getDate()}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scrollable time grid */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(' + columns.length + ', 1fr)', minHeight: HOURS.length * PX_PER_HOUR }}>

                {/* Hour labels */}
                <div style={{ borderRight: '1px solid ' + T.divider }}>
                  {HOURS.map(function (h) {
                    return (
                      <div key={h} style={{ height: PX_PER_HOUR, borderBottom: '1px solid ' + T.divider, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '4px 8px 0' }}>
                        <span style={{ fontSize: 10, color: T.inkFaint, fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtHour(h)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Day columns */}
                {columns.map(function (col, ci) {
                  var isToday = sameDay(col, today);
                  var isWeekend = col.getDay() === 0 || col.getDay() === 6;
                  var colStr = col.toISOString().split('T')[0];

                  // Filter events for this column
                  var dayEvents = allEvents.filter(function (ev) {
                    return sameDay(ev.start, col);
                  });

                  var showGhost = hoverSlot && hoverSlot.colIdx === ci;
                  var ghostTop = showGhost ? (hoverSlot.hour - 8) * PX_PER_HOUR : 0;

                  function snapToSlot(yPx) {
                    var rawHour = yPx / PX_PER_HOUR + 8;
                    return Math.floor(rawHour * 2) / 2;
                  }

                  return (
                    <div
                      key={ci}
                      onMouseMove={function (e) {
                        var rect = e.currentTarget.getBoundingClientRect();
                        var y = e.clientY - rect.top + (scrollRef.current ? scrollRef.current.scrollTop : 0);
                        var snapped = snapToSlot(y);
                        if (snapped < 8) snapped = 8;
                        if (snapped > 19.5) snapped = 19.5;
                        setHoverSlot({ colIdx: ci, hour: snapped });
                      }}
                      onMouseLeave={function () { setHoverSlot(null); }}
                      onClick={function (e) {
                        if (e.target !== e.currentTarget && e.target.closest('[data-event]')) return;
                        var rect = e.currentTarget.getBoundingClientRect();
                        var y = e.clientY - rect.top + (scrollRef.current ? scrollRef.current.scrollTop : 0);
                        var snapped = snapToSlot(y);
                        if (snapped < 8) snapped = 8;
                        if (snapped > 19.5) snapped = 19.5;
                        openModalFromSlot({ date: col, hour: snapped });
                      }}
                      style={{
                        position: 'relative',
                        borderRight: ci < columns.length - 1 ? '1px solid ' + T.divider : 'none',
                        background: isWeekend ? 'rgba(0,0,0,0.012)' : isToday ? 'rgba(155,126,200,0.018)' : 'transparent',
                        cursor: 'crosshair',
                      }}
                    >
                      {/* Hour grid lines */}
                      {HOURS.map(function (h) {
                        return <div key={h} style={{ height: PX_PER_HOUR, borderBottom: '1px solid ' + T.divider, pointerEvents: 'none' }} />;
                      })}

                      {/* Half-hour dashed lines */}
                      {HOURS.map(function (h) {
                        return <div key={'hh' + h} style={{
                          position: 'absolute', left: 0, right: 0,
                          top: (h - 8) * PX_PER_HOUR + PX_PER_HOUR / 2,
                          borderBottom: '1px dashed rgba(0,0,0,0.03)',
                          pointerEvents: 'none',
                        }} />;
                      })}

                      {/* Ghost slot preview on hover */}
                      {showGhost && (
                        <div style={{
                          position: 'absolute', left: 3, right: 3,
                          top: ghostTop, height: PX_PER_HOUR - 2,
                          borderRadius: 8, zIndex: 3, pointerEvents: 'none',
                          background: 'linear-gradient(135deg, rgba(155,126,200,0.10), rgba(212,132,154,0.06))',
                          border: '1.5px dashed rgba(155,126,200,0.35)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          transition: 'top 0.08s ease',
                        }}>
                          <span style={{ fontSize: 14, color: T.accent, opacity: 0.8, fontWeight: 300, lineHeight: 1 }}>+</span>
                          <span style={{ fontSize: 10, color: T.accentText, fontWeight: 600 }}>{fmtSlotLabel(hoverSlot.hour)}</span>
                        </div>
                      )}

                      {/* Now line */}
                      {isToday && (
                        <div style={{
                          position: 'absolute', left: 0, right: 0,
                          top: (nowHour - 8) * PX_PER_HOUR,
                          zIndex: 5, pointerEvents: 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: 9, height: 9, borderRadius: '50%', background: T.accent, boxShadow: '0 0 8px rgba(155,126,200,0.6)', flexShrink: 0 }} />
                            <div style={{ flex: 1, height: 1.5, background: T.accent, opacity: 0.55 }} />
                          </div>
                        </div>
                      )}

                      {/* Events */}
                      {dayEvents.map(function (ev) {
                        var top = (ev.startHour - 8) * PX_PER_HOUR;
                        var height = Math.max((ev.endHour - ev.startHour) * PX_PER_HOUR - 3, 18);
                        var isGcal = ev.type === 'gcal';
                        var isProject = ev.type === 'project';
                        var bgColor = isGcal ? 'rgba(0,0,0,0.04)' : ev.color + '18';
                        var borderLeft = (isProject || ev.type === 'task') ? '2.5px solid ' + ev.color : 'none';

                        return (
                          <div
                            data-event="true"
                            key={ev.id}
                            onClick={function (e) { e.stopPropagation(); setSelectedEvent(ev); }}
                            style={{
                              position: 'absolute', left: 3, right: 3,
                              top: top, height: height,
                              borderRadius: 8,
                              background: bgColor,
                              border: '1px solid ' + (isGcal ? T.border : ev.color + '35'),
                              borderLeft: borderLeft,
                              padding: '4px 7px',
                              cursor: 'pointer', overflow: 'hidden',
                              transition: 'all 0.18s', zIndex: 4,
                            }}
                            onMouseEnter={function (e) {
                              e.currentTarget.style.transform = 'scale(1.015)';
                              e.currentTarget.style.boxShadow = T.shadowHover;
                              e.currentTarget.style.zIndex = '6';
                            }}
                            onMouseLeave={function (e) {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.zIndex = '4';
                            }}
                          >
                            <p style={{
                              fontSize: height > 42 ? 11 : 9.5,
                              fontWeight: 600,
                              color: isGcal ? T.inkSoft : ev.color,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              lineHeight: 1.3,
                            }}>{ev.title}</p>
                            {height > 44 && ev.project && (
                              <p style={{ fontSize: 9, color: ev.color, opacity: 0.75, marginTop: 1 }}>{ev.project}</p>
                            )}
                            {height > 58 && (
                              <p style={{ fontSize: 9, color: T.inkMuted, marginTop: 2 }}>{fmtTime(ev.start)} – {fmtTime(ev.end)}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Month view placeholder — step 7 fills this */}
        {calView === 'month' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 14, color: T.inkMuted }}>Month view coming soon</p>
          </div>
        )}
      </div>

      {/* ═══ FLOATING PILL BUTTON ═══ */}
      {!showAddModal && !selectedEvent && (
        <button
          onClick={function () { setSlotContext(null); setShowAddModal(true); }}
          onMouseEnter={function () { setFloatHovered(true); }}
          onMouseLeave={function () { setFloatHovered(false); }}
          style={{
            position: 'fixed', bottom: showPulseBar ? 100 : 32, right: 36, zIndex: 25,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: floatHovered ? '13px 24px' : '13px 20px',
            borderRadius: 28,
            background: 'linear-gradient(135deg,' + T.accent + ',' + T.rose + ')',
            color: '#FFF', border: 'none',
            fontSize: 14, fontWeight: 600,
            boxShadow: floatHovered
              ? '0 8px 32px rgba(155,126,200,0.45), 0 2px 8px rgba(0,0,0,0.12)'
              : '0 4px 20px rgba(155,126,200,0.38), 0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            transform: floatHovered ? 'translateY(-3px)' : 'translateY(0)',
            animation: 'floatBob 4s ease infinite',
          }}
        >
          <span style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 300, lineHeight: 1, flexShrink: 0,
          }}>+</span>
          New event
          <span style={{ fontSize: 16, opacity: 0.75, animation: 'glowPulse 3s ease infinite' }}>{'\u2726'}</span>
        </button>
      )}

      {/* ═══ EVENT DETAIL PANEL ═══ */}
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          projects={projects}
          onClose={function () { setSelectedEvent(null); }}
          onRefresh={function () { router.refresh(); setSelectedEvent(null); }}
        />
      )}

      {/* Add event modal placeholder — step 5 */}
      {/* Pulse bar placeholder — step 6 */}
    </div>
  );
}
