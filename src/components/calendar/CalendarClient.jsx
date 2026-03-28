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

        {/* Week / Day view placeholder — step 3 fills this */}
        {(calView === 'week' || calView === 'day') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 14, color: T.inkMuted }}>Week view loading... ({allEvents.length} events)</p>
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

      {/* Event detail panel placeholder — step 4 */}
      {/* Add event modal placeholder — step 5 */}
      {/* Pulse bar placeholder — step 6 */}
    </div>
  );
}
