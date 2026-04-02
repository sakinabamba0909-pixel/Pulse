'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

var FONT_URL =
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300&display=swap';

var T = {
  ink: '#2D2A26',
  inkSoft: '#5C5650',
  inkMuted: '#9E958B',
  inkFaint: '#C9C1B8',
  accent: '#9B7EC8',
  accentSoft: 'rgba(155,126,200,0.10)',
  accentMid: 'rgba(155,126,200,0.18)',
  accentBorder: 'rgba(155,126,200,0.25)',
  accentText: '#7B5EA8',
  accentGlow: 'rgba(155,126,200,0.15)',
  rose: '#D4849A',
  roseSoft: 'rgba(212,132,154,0.10)',
  peach: '#D4A47A',
  peachSoft: 'rgba(212,164,122,0.10)',
  sky: '#7AABC8',
  skySoft: 'rgba(122,171,200,0.10)',
  sage: '#7EB89B',
  sageSoft: 'rgba(126,184,155,0.10)',
  urgent: '#D4727A',
  urgentSoft: 'rgba(212,114,122,0.10)',
  normal: '#7AABC8',
  normalSoft: 'rgba(122,171,200,0.10)',
  low: '#B5ADA5',
  lowSoft: 'rgba(181,173,165,0.10)',
  border: 'rgba(0,0,0,0.05)',
  borderHover: 'rgba(0,0,0,0.08)',
  borderGlow: 'rgba(155,126,200,0.18)',
  divider: 'rgba(0,0,0,0.04)',
  shadow:
    '0 1px 2px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.03)',
  shadowHover:
    '0 2px 8px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.05)',
  shadowGlow:
    '0 0 24px rgba(155,126,200,0.08), 0 4px 16px rgba(0,0,0,0.03)',
};

var MOODS = {
  projects: {
    a: [30, 40, 91],
    b: [280, 35, 90],
    c: [50, 35, 93],
    d: [10, 30, 94],
  },
};

/* ═══ GANZFELD LIGHT ═══ */
function GanzfeldLight() {
  var phaseRef = useRef(0);
  var [colors, setColors] = useState({
    a: [30, 40, 91],
    b: [280, 35, 90],
    c: [50, 35, 93],
    d: [10, 30, 94],
  });
  var currentRef = useRef({
    a: [30, 40, 91],
    b: [280, 35, 90],
    c: [50, 35, 93],
    d: [10, 30, 94],
  });
  var frameRef = useRef(null);

  useEffect(function () {
    function tick() {
      phaseRef.current += 0.002;
      var t = phaseRef.current;
      var drift = Math.sin(t) * 4;
      var drift2 = Math.cos(t * 0.7) * 3;
      var c = currentRef.current;
      setColors({
        a: [c.a[0] + drift, c.a[1], c.a[2]],
        b: [c.b[0] + drift2, c.b[1], c.b[2]],
        c: [c.c[0] - drift, c.c[1], c.c[2]],
        d: [c.d[0] + drift2, c.d[1], c.d[2]],
      });
      frameRef.current = requestAnimationFrame(tick);
    }
    tick();
    return function () {
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  function hsl(arr, alpha) {
    return (
      'hsla(' +
      Math.round(arr[0]) +
      ',' +
      Math.round(arr[1]) +
      '%,' +
      Math.round(arr[2]) +
      '%,' +
      alpha +
      ')'
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: '#F0EBE6' }} />
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          background:
            'radial-gradient(ellipse 120% 100% at 15% 10%, ' +
            hsl(colors.a, 0.35) +
            ' 0%, ' +
            hsl(colors.a, 0.12) +
            ' 40%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          background:
            'radial-gradient(ellipse 100% 120% at 75% 25%, ' +
            hsl(colors.b, 0.3) +
            ' 0%, ' +
            hsl(colors.b, 0.1) +
            ' 35%, transparent 65%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          background:
            'radial-gradient(ellipse 140% 80% at 50% 95%, ' +
            hsl(colors.c, 0.25) +
            ' 0%, ' +
            hsl(colors.c, 0.08) +
            ' 40%, transparent 65%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '-30%',
          background:
            'radial-gradient(ellipse 60% 50% at 55% 35%, ' +
            hsl(colors.d, 0.18) +
            ' 0%, transparent 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-40%',
          left: '-20%',
          right: '-20%',
          height: '80%',
          background:
            'linear-gradient(180deg, ' +
            hsl(
              [colors.a[0], colors.a[1] - 10, colors.a[2] + 3],
              0.2,
            ) +
            ' 0%, transparent 100%)',
        }}
      />
    </div>
  );
}

/* ═══ ORB ═══ */
function Orb({ size }) {
  var s = size || 24;
  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 40% 40%, rgba(212,168,200,0.7), rgba(155,126,200,0.4), rgba(155,126,200,0))',
        boxShadow: '0 0 12px rgba(155,126,200,0.25)',
        flexShrink: 0,
      }}
    />
  );
}

/* ═══ TYPING ANIMATION ═══ */
function TypeWriter({ text, speed, onDone }) {
  var [shown, setShown] = useState('');
  var idx = useRef(0);
  useEffect(
    function () {
      idx.current = 0;
      setShown('');
      var iv = setInterval(function () {
        if (idx.current < text.length) {
          setShown(text.slice(0, idx.current + 1));
          idx.current++;
        } else {
          clearInterval(iv);
          if (onDone) onDone();
        }
      }, speed || 25);
      return function () {
        clearInterval(iv);
      };
    },
    [text],
  );
  return (
    <>
      {shown}
      <span
        style={{
          opacity: shown.length < text.length ? 1 : 0,
          transition: 'opacity 0.3s',
          color: T.accent,
        }}
      >
        |
      </span>
    </>
  );
}

/* ═══ COLORS FOR PROJECTS ═══ */
// Golden-angle hue spacing ensures infinite visually-distinct colors
function hueToHSL(hue) {
  return 'hsl(' + Math.round(hue % 360) + ', 52%, 58%)';
}
function hueToHSLSoft(hue) {
  return 'hsla(' + Math.round(hue % 360) + ', 52%, 58%, 0.10)';
}
// 16 preset swatches covering the full hue wheel (evenly spaced)
var COLOR_SWATCHES = Array.from({ length: 16 }, function (_, i) {
  return hueToHSL(i * 22.5);
});
// Fallback: golden-angle offset per project index for auto-assign
function pickColor(index) {
  return hueToHSL(index * 137.5 + 150);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildProjectViews(projects, steps, tasks) {
  return projects.map(function (p, idx) {
    var pSteps = steps.filter(function (s) { return s.project_id === p.id; }).sort(function (a, b) { return a.step_number - b.step_number; });
    var pTasks = tasks.filter(function (t) { return t.project_id === p.id; });
    var doneSteps = pSteps.filter(function (s) { return s.status === 'done'; }).length;
    var doneTasks = pTasks.filter(function (t) { return t.status === 'done'; }).length;
    var totalTasks = pTasks.length;
    var progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    var currentStepObj = pSteps.find(function (s) { return s.status !== 'done'; });
    var currentStepLabel = currentStepObj ? 'Step ' + currentStepObj.step_number + ': ' + currentStepObj.name : (pSteps.length > 0 ? 'All steps complete' : 'No steps yet');
    var nextTaskObj = currentStepObj ? pTasks.find(function (t) { return t.step_id === currentStepObj.id && t.status !== 'done'; }) : null;
    var sparkline = [0, 0, 0, 0, 0, 0, 0];
    pTasks.forEach(function (t) {
      if (t.status === 'done' && t.due_at) {
        var daysAgo = Math.floor((Date.now() - new Date(t.due_at).getTime()) / 86400000);
        if (daysAgo >= 0 && daysAgo < 7) sparkline[6 - daysAgo]++;
      }
    });
    if (sparkline.every(function (v) { return v === 0; })) sparkline = [1, 1, 1, 1, 1, 1, 1];

    return {
      id: p.id, name: p.name, color: p.color || pickColor(idx), status: p.status || 'active',
      progress: progress,
      currentStep: currentStepLabel,
      nextTask: nextTaskObj ? nextTaskObj.title : (currentStepObj ? 'No pending tasks' : ''),
      totalSteps: pSteps.length, completedSteps: doneSteps,
      tasksTotal: totalTasks, tasksDone: doneTasks,
      sparkline: sparkline,
      startDate: formatDate(p.start_date), targetDate: formatDate(p.target_date),
      aiStatus: doneTasks === 0 && totalTasks === 0
        ? 'No tasks yet — generate a plan to get started.'
        : progress === 100
          ? 'All tasks complete! Nice work.'
          : doneTasks + ' of ' + totalTasks + ' tasks done (' + progress + '%). ' + (currentStepObj ? 'Currently on: ' + currentStepObj.name + '.' : ''),
      people: [],
      goal: null,
      rawSteps: pSteps,
      rawTasks: pTasks,
      raw: p,
    };
  });
}

var SCHED_PREFS = [
  { id: 'spread', label: 'Spread it out', desc: "Don't cluster too many project tasks in one day", icon: '\u27F7' },
  { id: 'morning', label: 'Mornings preferred', desc: 'Schedule project tasks before noon when possible', icon: '\u2600' },
  { id: 'afternoon', label: 'Afternoons preferred', desc: 'Keep mornings free, schedule after lunch', icon: '\uD83C\uDF24' },
  { id: 'packed', label: 'Packed days are fine', desc: "I don't mind full days if it means free days later", icon: '\uD83D\uDCE6' },
  { id: 'noweekend', label: 'No weekends', desc: 'Never schedule project tasks on Saturday or Sunday', icon: '\uD83D\uDECB' },
  { id: 'weekendok', label: 'Weekends OK for this project', desc: 'This project can use weekend time slots', icon: '\uD83D\uDCC5' },
];

/* ═══ SPARKLINE ═══ */
function Sparkline({ data, color, width, height }) {
  var w = width || 70,
    h = height || 24;
  var max = Math.max.apply(null, data.concat([1]));
  var points = data
    .map(function (v, i) {
      return (i / (data.length - 1)) * w + ',' + (h - (v / max) * h);
    })
    .join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <circle
        cx={((data.length - 1) / (data.length - 1)) * w}
        cy={h - (data[data.length - 1] / max) * h}
        r="3"
        fill={color}
        opacity="0.8"
      />
    </svg>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export default function ProjectsClient({ projects: rawProjects, completedProjects: rawCompleted, steps: rawSteps, tasks: rawTasks }) {
  var router = useRouter();
  var projects = rawProjects || [];
  var completed = rawCompleted || [];
  var steps = rawSteps || [];
  var tasks = rawTasks || [];
  var projectViews = buildProjectViews(projects, steps, tasks);
  var completedViews = buildProjectViews(completed, steps, tasks);

  var [view, setView] = useState('list');
  var [selectedProject, setSelectedProject] = useState(null);
  var [createMode, setCreateMode] = useState('manual');
  var [voiceState, setVoiceState] = useState('idle');
  var [transcript, setTranscript] = useState('');
  var [projectName, setProjectName] = useState('');
  var [projectColor, setProjectColor] = useState(hueToHSL(Math.random() * 360));
  var [projectDeadline, setProjectDeadline] = useState('');
  var [projectDesc, setProjectDesc] = useState('');
  var [importedContext, setImportedContext] = useState('');
  var [aiTyping, setAiTyping] = useState(false);
  var [aiMessage, setAiMessage] = useState('');
  var [showSteps, setShowSteps] = useState(false);
  var [showCalendar, setShowCalendar] = useState(false);
  var [selectedPrefs, setSelectedPrefs] = useState(['spread', 'afternoon', 'noweekend']);
  var [showPrefs, setShowPrefs] = useState(false);
  var [approvedSteps, setApprovedSteps] = useState({});
  var [showAddInfo, setShowAddInfo] = useState(false);
  var [addInfoText, setAddInfoText] = useState('');
  var [showReplan, setShowReplan] = useState(false);
  var [expandedStep, setExpandedStep] = useState(null);
  var [reminderFreq, setReminderFreq] = useState('1h');
  var [generatedSteps, setGeneratedSteps] = useState([]);
  var [generatedCalendar, setGeneratedCalendar] = useState([]);
  var [replanChanges, setReplanChanges] = useState([]);
  var [replanSpeech, setReplanSpeech] = useState('');
  var [saving, setSaving] = useState(false);
  var [rescheduleTask, setRescheduleTask] = useState(null);
  var [rescheduleDate, setRescheduleDate] = useState('');
  var [rescheduleTime, setRescheduleTime] = useState('');
  var [suggestedSlots, setSuggestedSlots] = useState([]);
  var [loadingSlots, setLoadingSlots] = useState(false);
  var [calendarConnected, setCalendarConnected] = useState(null);
  var [calendarChecked, setCalendarChecked] = useState(false);
  var [calendarChoice, setCalendarChoice] = useState(null); // 'pulse' | 'connect' | null

  // Plan task inline editing state
  var [planEditTask, setPlanEditTask] = useState(null); // { stepIdx, taskIdx }
  var [planEditDate, setPlanEditDate] = useState('');
  var [planEditTime, setPlanEditTime] = useState('');
  var [planEditSlots, setPlanEditSlots] = useState([]);
  var [planEditLoading, setPlanEditLoading] = useState(false);

  // Calendar preview state
  var [calPreviewMode, setCalPreviewMode] = useState('week'); // 'day' | '3day' | 'week' | 'month'
  var [calPreviewDate, setCalPreviewDate] = useState(new Date());
  var [calPreviewEvents, setCalPreviewEvents] = useState([]); // real calendar events
  var [calPreviewLoaded, setCalPreviewLoaded] = useState(false);

  // Auto-open project from URL param (e.g. ?project=uuid)
  var searchParams = useSearchParams();
  useEffect(function () {
    var projectId = searchParams.get('project');
    if (projectId && projectViews.length > 0) {
      var match = projectViews.find(function (p) { return p.id === projectId; });
      if (match) {
        setSelectedProject(match);
        setView('detail');
      }
    }
  }, [searchParams, projectViews.length]);

  // Check calendar connection on mount
  useEffect(function () {
    fetch('/api/calendar/check?start=' + new Date().toISOString() + '&end=' + new Date(Date.now() + 3600000).toISOString())
      .then(function (res) { return res.json(); })
      .then(function (data) {
        setCalendarConnected(data.connected || false);
        setCalendarChecked(true);
      })
      .catch(function () {
        setCalendarConnected(false);
        setCalendarChecked(true);
      });
  }, []);

  var openReschedule = function (task) {
    setRescheduleTask(task);
    setSuggestedSlots([]);
    if (task.due_at) {
      var d = new Date(task.due_at);
      setRescheduleDate(d.toISOString().split('T')[0]);
      setRescheduleTime(d.toTimeString().slice(0, 5));
    } else {
      setRescheduleDate('');
      setRescheduleTime('');
    }
  };

  var saveReschedule = function () {
    if (!rescheduleTask || !rescheduleDate) return;
    var dt = rescheduleTime ? rescheduleDate + 'T' + rescheduleTime + ':00' : rescheduleDate + 'T09:00:00';
    var iso = new Date(dt).toISOString();
    var dur = rescheduleTask.duration_minutes || 60;
    var endIso = new Date(new Date(dt).getTime() + dur * 60000).toISOString();
    fetch('/api/tasks/' + rescheduleTask.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ due_at: iso, scheduled_start: iso, scheduled_end: endIso }),
    })
      .then(function () {
        // Also create/update Google Calendar event if connected
        if (calendarConnected) {
          return fetch('/api/calendar/events/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tasks: [{
                title: rescheduleTask.title,
                scheduled_start: iso,
                scheduled_end: endIso,
              }],
            }),
          });
        }
      })
      .then(function () {
        setRescheduleTask(null);
        router.refresh();
      });
  };

  var pickSlot = function (slot) {
    var d = new Date(slot.start);
    setRescheduleDate(d.toISOString().split('T')[0]);
    setRescheduleTime(d.toTimeString().slice(0, 5));
  };

  var fetchSuggestedSlots = function () {
    if (!rescheduleTask) return;
    setLoadingSlots(true);
    var dur = rescheduleTask.duration_minutes || 60;
    fetch('/api/calendar/slots?duration=' + dur)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        setLoadingSlots(false);
        if (data.slots) {
          setSuggestedSlots(data.slots);
        } else {
          setSuggestedSlots([]);
        }
      })
      .catch(function () {
        setLoadingSlots(false);
        setSuggestedSlots([]);
      });
  };

  // ═══ PLAN TASK INLINE RESCHEDULE ═══
  var openPlanEdit = function (stepIdx, taskIdx) {
    var task = generatedSteps[stepIdx].tasks[taskIdx];
    setPlanEditTask({ stepIdx: stepIdx, taskIdx: taskIdx });
    setPlanEditSlots([]);
    if (task.scheduled_start) {
      var d = new Date(task.scheduled_start);
      setPlanEditDate(d.toISOString().split('T')[0]);
      setPlanEditTime(d.toTimeString().slice(0, 5));
    } else {
      setPlanEditDate('');
      setPlanEditTime('');
    }
  };

  var fetchPlanEditSlots = function () {
    if (!planEditTask) return;
    var task = generatedSteps[planEditTask.stepIdx].tasks[planEditTask.taskIdx];
    var dur = task.est_minutes || 60;
    setPlanEditLoading(true);
    fetch('/api/calendar/slots?duration=' + dur)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        setPlanEditLoading(false);
        setPlanEditSlots(data.slots || []);
      })
      .catch(function () { setPlanEditLoading(false); setPlanEditSlots([]); });
  };

  var pickPlanEditSlot = function (slot) {
    var d = new Date(slot.start);
    setPlanEditDate(d.toISOString().split('T')[0]);
    setPlanEditTime(d.toTimeString().slice(0, 5));
  };

  var savePlanEdit = function () {
    if (!planEditTask || !planEditDate) return;
    var si = planEditTask.stepIdx;
    var ti = planEditTask.taskIdx;
    var task = generatedSteps[si].tasks[ti];

    var dt = planEditTime ? planEditDate + 'T' + planEditTime + ':00' : planEditDate + 'T09:00:00';
    var newStart = new Date(dt);
    var dur = task.est_minutes || 60;
    var newEnd = new Date(newStart.getTime() + dur * 60000);
    var oldStart = task.scheduled_start ? new Date(task.scheduled_start) : null;
    var delta = oldStart ? newStart.getTime() - oldStart.getTime() : 0;

    // Build new steps with cascade
    var updated = generatedSteps.map(function (step, sIdx) {
      return Object.assign({}, step, {
        tasks: step.tasks.map(function (t, tIdx) {
          var isTarget = sIdx === si && tIdx === ti;
          var isAfter = sIdx > si || (sIdx === si && tIdx > ti);

          if (isTarget) {
            var startISO = newStart.toISOString();
            var endISO = newEnd.toISOString();
            var schedLabel = newStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + newStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            return Object.assign({}, t, { scheduled_start: startISO, scheduled_end: endISO, scheduled: schedLabel });
          }

          if (isAfter && delta !== 0 && t.scheduled_start) {
            var shifted = new Date(new Date(t.scheduled_start).getTime() + delta);
            var shiftedEnd = new Date(shifted.getTime() + (t.est_minutes || 60) * 60000);
            var sLabel = shifted.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + shifted.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            return Object.assign({}, t, { scheduled_start: shifted.toISOString(), scheduled_end: shiftedEnd.toISOString(), scheduled: sLabel });
          }

          return t;
        }),
      });
    });

    setGeneratedSteps(updated);

    // Rebuild calendar blocks from updated tasks
    var blocks = {};
    updated.forEach(function (step) {
      step.tasks.forEach(function (t) {
        if (t.scheduled_start) {
          var day = t.scheduled_start.split('T')[0];
          if (!blocks[day]) blocks[day] = { day: day, slots: [] };
          var d = new Date(t.scheduled_start);
          blocks[day].slots.push({
            start: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            end: t.scheduled_end ? new Date(t.scheduled_end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
            task: t.title,
            type: 'new',
          });
        }
      });
    });
    var sortedBlocks = Object.keys(blocks).sort().map(function (k) { return blocks[k]; });
    setGeneratedCalendar(sortedBlocks);

    setPlanEditTask(null);
  };

  // ═══ CALENDAR PREVIEW DATA ═══
  var fetchCalendarPreviewEvents = function () {
    if (!calendarConnected) { setCalPreviewLoaded(true); return; }
    // Determine the date range based on calPreviewMode
    var start = new Date(calPreviewDate);
    start.setHours(0, 0, 0, 0);
    var end = new Date(start);
    if (calPreviewMode === 'day') end.setDate(end.getDate() + 1);
    else if (calPreviewMode === '3day') end.setDate(end.getDate() + 3);
    else if (calPreviewMode === 'week') end.setDate(end.getDate() + 7);
    else end.setDate(end.getDate() + 35); // month

    fetch('/api/calendar/events?start=' + start.toISOString() + '&end=' + end.toISOString())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        setCalPreviewEvents(data.events || []);
        setCalPreviewLoaded(true);
      })
      .catch(function () { setCalPreviewLoaded(true); });
  };

  // Fetch calendar events when preview opens or mode/date changes
  useEffect(function () {
    if (showCalendar && calendarConnected) {
      fetchCalendarPreviewEvents();
    }
  }, [showCalendar, calPreviewMode, calPreviewDate, calendarConnected]);

  var buildSchedPrefs = function () {
    var prefs = {};
    selectedPrefs.forEach(function (id) {
      if (id === 'morning') prefs.preferred_time = 'morning';
      if (id === 'afternoon') prefs.preferred_time = 'afternoon';
      if (id === 'noweekend') prefs.no_weekends = true;
      if (id === 'weekendok') prefs.no_weekends = false;
      if (id === 'spread') prefs.style = 'spread';
      if (id === 'packed') prefs.style = 'packed';
    });
    return prefs;
  };

  var generatePlan = function () {
    setView('creating');
    setAiTyping(true);
    setAiMessage('');
    setShowSteps(false);
    setGeneratedSteps([]);
    setGeneratedCalendar([]);
    setApprovedSteps({});

    fetch('/api/projects/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectName,
        description: projectDesc || projectName,
        context: importedContext || undefined,
        deadline: projectDeadline || undefined,
        scheduling_preferences: buildSchedPrefs(),
        existing_tasks: tasks.filter(function (t) { return t.status !== 'done'; }),
        calendar_mode: calendarConnected ? 'google' : calendarChoice === 'pulse' ? 'pulse' : null,
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        setAiTyping(false);
        if (data.error) {
          setAiMessage('Error: ' + data.error);
          return;
        }
        if (data.steps) {
          var mapped = data.steps.map(function (s, i) {
            var totalMins = s.tasks.reduce(function (a, t) { return a + (t.est_minutes || 0); }, 0);
            var hrs = Math.round(totalMins / 60 * 10) / 10;
            return {
              id: 'gen_' + i,
              name: s.name,
              description: s.description,
              estimated_hours: s.estimated_hours || hrs,
              status: 'suggested',
              duration: (s.estimated_hours || hrs) + ' hrs',
              tasks: s.tasks.map(function (t, ti) {
                var estLabel = t.est_minutes >= 60 ? (Math.round(t.est_minutes / 60 * 10) / 10) + ' hrs' : t.est_minutes + ' min';
                var schedLabel = '';
                if (t.scheduled_start) {
                  var d = new Date(t.scheduled_start);
                  schedLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                }
                return {
                  id: 'gen_t_' + i + '_' + ti,
                  title: t.title,
                  est: estLabel,
                  est_minutes: t.est_minutes,
                  scheduled: schedLabel,
                  scheduled_start: t.scheduled_start,
                  scheduled_end: t.scheduled_end,
                };
              }),
            };
          });
          setGeneratedSteps(mapped);
          setAiMessage(data.speech_reply || "Here's the plan I've put together based on your description:");
          if (data.calendar_blocks) setGeneratedCalendar(data.calendar_blocks);
          // Auto-set calendar preview to start at the first scheduled task
          var firstDate = null;
          data.steps.forEach(function (s) {
            s.tasks.forEach(function (t) {
              if (t.scheduled_start && !firstDate) firstDate = new Date(t.scheduled_start);
            });
          });
          if (firstDate) setCalPreviewDate(firstDate);
          setShowCalendar(true);
          setTimeout(function () { setShowSteps(true); }, 400);
        } else {
          setAiMessage('Something went wrong generating the plan. Please try again.');
        }
      })
      .catch(function () {
        setAiTyping(false);
        setAiMessage('Failed to connect. Please check your connection and try again.');
      });
  };

  var togglePref = function (id) {
    setSelectedPrefs(function (prev) {
      return prev.indexOf(id) >= 0
        ? prev.filter(function (x) { return x !== id; })
        : prev.concat([id]);
    });
  };

  var toggleStepApproval = function (stepId) {
    setApprovedSteps(function (prev) {
      var next = Object.assign({}, prev);
      next[stepId] = !next[stepId];
      return next;
    });
  };

  var allApproved = generatedSteps.length > 0 && generatedSteps.every(function (s) {
    return approvedSteps[s.id];
  });

  var handleCreateAndSave = function () {
    if (saving) return;
    setSaving(true);

    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectName,
        category: 'general',
        color: projectColor,
        scheduling_preferences: buildSchedPrefs(),
        description: projectDesc || projectName,
        target_date: projectDeadline || undefined,
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (proj) {
        if (!proj || proj.error || !proj.id) {
          throw new Error(proj.error || 'Failed to create project');
        }
        return fetch('/api/projects/plan/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: proj.id,
            steps: generatedSteps.map(function (s) {
              return {
                name: s.name,
                description: s.description,
                estimated_hours: s.estimated_hours,
                tasks: s.tasks.map(function (t) {
                  return {
                    title: t.title,
                    est_minutes: t.est_minutes,
                    scheduled_start: t.scheduled_start,
                    scheduled_end: t.scheduled_end,
                  };
                }),
              };
            }),
          }),
        }).then(function (res) { return res.json(); });
      })
      .then(function (result) {
        if (result && result.error) {
          throw new Error(result.error);
        }
        // If Google Calendar is connected, create calendar events for scheduled tasks
        if (calendarConnected) {
          var scheduledTasks = [];
          generatedSteps.forEach(function (s) {
            s.tasks.forEach(function (t) {
              if (t.scheduled_start && t.scheduled_end) {
                scheduledTasks.push({
                  title: t.title,
                  scheduled_start: t.scheduled_start,
                  scheduled_end: t.scheduled_end,
                  description: 'Project: ' + projectName + ' — Step: ' + s.name,
                });
              }
            });
          });
          if (scheduledTasks.length > 0) {
            return fetch('/api/calendar/events/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tasks: scheduledTasks }),
            }).then(function () {
              setSaving(false);
              window.location.reload();
            });
          }
        }
        setSaving(false);
        window.location.reload();
      })
      .catch(function (err) {
        setSaving(false);
        setAiMessage('Error: ' + (err.message || 'Failed to save project. Please try again.'));
      });
  };

  var handleReplan = function () {
    if (!addInfoText.trim() || !selectedProject) return;
    setShowAddInfo(false);
    setShowReplan(false);
    setAiTyping(true);
    setReplanChanges([]);

    fetch('/api/projects/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        new_info: addInfoText,
        existing_steps: (selectedProject.rawSteps || []).map(function (s) {
          return { id: s.id, name: s.name, description: s.description, status: s.status, estimated_hours: s.estimated_hours };
        }),
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        setAiTyping(false);
        if (data.changes) {
          setReplanChanges(data.changes);
          setReplanSpeech(data.speech_reply || 'Here are the suggested changes:');
          setShowReplan(true);
        }
      })
      .catch(function () {
        setAiTyping(false);
      });
  };

  var [confirmDelete, setConfirmDelete] = useState(null); // project id or null
  var [showCompleted, setShowCompleted] = useState(false);
  var [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  var deleteProject = function (projectId) {
    fetch('/api/projects/' + projectId, { method: 'DELETE' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          setAiMessage('Error: ' + data.error);
          return;
        }
        setConfirmDelete(null);
        setSelectedProject(null);
        setView('list');
        router.refresh();
      });
  };

  var deleteAllCompleted = function () {
    Promise.all(completedViews.map(function (p) {
      return fetch('/api/projects/' + p.id, { method: 'DELETE' });
    })).then(function () {
      setConfirmDeleteAll(false);
      router.refresh();
    });
  };

  var openProject = function (p) {
    setSelectedProject(p);
    setView('detail');
  };

  var refreshAndStay = function (projectId) {
    router.refresh();
    // After refresh, props update — re-select the project
    setTimeout(function () {
      var updated = buildProjectViews(rawProjects || [], rawSteps || [], rawTasks || []);
      var found = updated.find(function (p) { return p.id === projectId; });
      if (found) setSelectedProject(found);
    }, 100);
  };

  // Keep selectedProject in sync when props change
  useEffect(function () {
    if (selectedProject && view === 'detail') {
      var updated = projectViews.find(function (p) { return p.id === selectedProject.id; });
      if (updated) setSelectedProject(updated);
    }
  }, [rawProjects, rawSteps, rawTasks]);

  var completeTask = function (taskId) {
    var pid = selectedProject && selectedProject.id;
    fetch('/api/tasks/' + taskId + '/complete', { method: 'POST' })
      .then(function () { router.refresh(); });
  };

  var completeStep = function (stepId) {
    var pid = selectedProject && selectedProject.id;
    fetch('/api/projects/steps/' + stepId + '/complete', { method: 'POST' })
      .then(function () { router.refresh(); });
  };

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", color: T.ink, minHeight: '100vh', position: 'relative' }}>
      <link href={FONT_URL} rel="stylesheet" />
      <style>{
        '::selection { background: ' + T.accentMid + '; color: ' + T.accentText + '; }' +
        '::-webkit-scrollbar { width: 4px; }' +
        '::-webkit-scrollbar-thumb { background: ' + T.inkFaint + '; border-radius: 2px; }' +
        '@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }' +
        '@keyframes slideR { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }' +
        '@keyframes glowPulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.9; } }' +
        '@keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.1); } }' +
        "button { font-family: 'Outfit', sans-serif; } button:active { transform: scale(0.97); }" +
        'input:focus, textarea:focus { outline: none; }'
      }</style>

      <GanzfeldLight />

      {/* MAIN */}
      <div style={{ padding: '0 0 120px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 36px' }}>

          {/* ═══ PROJECT LIST VIEW ═══ */}
          {view === 'list' && <>
            <div style={{ paddingTop: 60, paddingBottom: 32, animation: 'fadeUp 0.6s ease both' }}>
              <p style={{ fontSize: 12, color: T.inkMuted, marginBottom: 10, letterSpacing: 0.5, fontWeight: 500 }}>Projects</p>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 400, letterSpacing: -0.5, margin: '0 0 8px', lineHeight: 1.15 }}>Your missions.</h1>
              <p style={{ fontSize: 14, color: T.inkMuted }}>{projectViews.length} active project{projectViews.length !== 1 ? 's' : ''}</p>
            </div>

            {/* New Project Button */}
            <button onClick={function () { setView('create'); setProjectColor(hueToHSL(Math.random() * 360)); }} style={{
              width: '100%', padding: '20px 24px', borderRadius: 20,
              background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: '1.5px dashed ' + T.accentBorder, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: T.shadow, transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
              marginBottom: 28, animation: 'fadeUp 0.6s ease 0.1s both',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, ' + T.accent + ', ' + T.rose + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(155,126,200,0.3)' }}>
                <span style={{ color: '#FFF', fontSize: 22, fontWeight: 300 }}>+</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>New project</p>
                <p style={{ fontSize: 12, color: T.inkMuted }}>Tell Pulse what you{"'"}re working on — voice or text</p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 18, color: T.accent, opacity: 0.5, animation: 'glowPulse 3.5s ease infinite' }}>{'\u2726'}</span>
            </button>

            {/* Project Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projectViews.map(function (p, i) {
                var isDeleting = confirmDelete === p.id;
                return (
                  <div key={p.id} style={{
                    width: '100%', textAlign: 'left', borderRadius: 18,
                    background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid ' + (isDeleting ? T.urgent + '40' : T.border),
                    boxShadow: T.shadow, transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                    animation: 'fadeUp 0.5s ease ' + (0.15 + i * 0.08) + 's both', overflow: 'hidden',
                  }}>
                    <button onClick={function () { openProject(p); }} style={{ width: '100%', textAlign: 'left', padding: '20px 22px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 4, background: p.color, boxShadow: '0 0 8px ' + p.color + '40', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</span>
                            <span style={{ fontSize: 11, color: T.inkMuted }}>{p.completedSteps}/{p.totalSteps} steps</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, color: T.inkMuted }}>{p.currentStep}</span>
                            <span style={{ fontSize: 11, color: p.color, fontWeight: 500 }}>{p.progress}%</span>
                          </div>
                        </div>
                        <Sparkline data={p.sparkline} color={p.color} />
                      </div>
                      <div style={{ height: 3, background: 'rgba(0,0,0,0.04)', borderRadius: 2, marginTop: 14 }}>
                        <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, ' + p.color + ', ' + p.color + '80)', width: p.progress + '%', transition: 'width 0.6s', boxShadow: '0 0 8px ' + p.color + '30' }} />
                      </div>
                    </button>
                    {/* Delete zone */}
                    {isDeleting ? (
                      <div style={{ padding: '10px 22px 14px', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid ' + T.divider, animation: 'fadeUp 0.2s ease both' }}>
                        <span style={{ fontSize: 12, color: T.urgent, fontWeight: 500 }}>Delete this project and all its tasks?</span>
                        <button onClick={function () { deleteProject(p.id); }} style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 8, background: T.urgent, color: '#FFF', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                        <button onClick={function () { setConfirmDelete(null); }} style={{ padding: '5px 12px', borderRadius: 8, background: 'transparent', border: '1px solid ' + T.border, color: T.inkMuted, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ padding: '0 22px 10px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={function (e) { e.stopPropagation(); setConfirmDelete(p.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: 11, color: T.inkFaint, transition: 'color 0.2s' }} title="Delete project">{'\uD83D\uDDD1'}</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ═══ COMPLETED PROJECTS ═══ */}
            {completedViews.length > 0 && (
              <div style={{ marginTop: 40, animation: 'fadeUp 0.5s ease 0.3s both' }}>
                <button onClick={function () { setShowCompleted(!showCompleted); }} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0',
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                }}>
                  <span style={{ fontSize: 12, color: T.inkMuted, fontWeight: 500, letterSpacing: 0.5 }}>
                    Completed ({completedViews.length})
                  </span>
                  <span style={{ fontSize: 10, color: T.inkFaint, transition: 'transform 0.2s', transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)' }}>{'\u25B6'}</span>
                  <div style={{ flex: 1, height: 1, background: T.divider }} />
                  {showCompleted && (
                    confirmDeleteAll ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: T.urgent }}>Delete all?</span>
                        <button onClick={function (e) { e.stopPropagation(); deleteAllCompleted(); }} style={{ padding: '3px 10px', borderRadius: 6, background: T.urgent, color: '#FFF', border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Yes</button>
                        <button onClick={function (e) { e.stopPropagation(); setConfirmDeleteAll(false); }} style={{ padding: '3px 8px', borderRadius: 6, background: 'transparent', border: '1px solid ' + T.border, color: T.inkMuted, fontSize: 10, cursor: 'pointer' }}>No</button>
                      </span>
                    ) : (
                      <button onClick={function (e) { e.stopPropagation(); setConfirmDeleteAll(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px', fontSize: 10, color: T.inkFaint }}>
                        Clear all
                      </button>
                    )
                  )}
                </button>

                {showCompleted && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {completedViews.map(function (p, i) {
                      var isDeleting = confirmDelete === p.id;
                      return (
                        <div key={p.id} style={{
                          borderRadius: 14, background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(16px)',
                          border: '1px solid ' + (isDeleting ? T.urgent + '40' : T.border),
                          boxShadow: T.shadow, overflow: 'hidden', opacity: 0.75,
                          animation: 'fadeUp 0.3s ease ' + (i * 0.05) + 's both',
                        }}>
                          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 3, background: p.color, opacity: 0.5, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: T.inkSoft, textDecoration: 'line-through' }}>{p.name}</span>
                            <span style={{ fontSize: 11, color: T.sage, fontWeight: 500 }}>{'\u2713'} 100%</span>
                            {isDeleting ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button onClick={function () { deleteProject(p.id); }} style={{ padding: '3px 10px', borderRadius: 6, background: T.urgent, color: '#FFF', border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                                <button onClick={function () { setConfirmDelete(null); }} style={{ padding: '3px 8px', borderRadius: 6, background: 'transparent', border: '1px solid ' + T.border, color: T.inkMuted, fontSize: 10, cursor: 'pointer' }}>Cancel</button>
                              </span>
                            ) : (
                              <button onClick={function () { setConfirmDelete(p.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: 11, color: T.inkFaint }} title="Delete">{'\uD83D\uDDD1'}</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>}

          {/* ═══ PROJECT DETAIL VIEW ═══ */}
          {view === 'detail' && selectedProject && <>
            <div style={{ paddingTop: 50, animation: 'fadeUp 0.5s ease both' }}>
              <button onClick={function () { setView('list'); setSelectedProject(null); }} style={{ background: 'none', border: 'none', color: T.inkMuted, cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}>{'\u2190'} All projects</button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 5, background: selectedProject.color, boxShadow: '0 0 10px ' + selectedProject.color + '50' }} />
                <h1 style={{ flex: 1, fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 400, letterSpacing: -0.5 }}>{selectedProject.name}</h1>
                {confirmDelete === selectedProject.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: T.urgent, fontWeight: 500 }}>Delete?</span>
                    <button onClick={function () { deleteProject(selectedProject.id); }} style={{ padding: '5px 12px', borderRadius: 8, background: T.urgent, color: '#FFF', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Yes</button>
                    <button onClick={function () { setConfirmDelete(null); }} style={{ padding: '5px 10px', borderRadius: 8, background: 'transparent', border: '1px solid ' + T.border, color: T.inkMuted, fontSize: 11, cursor: 'pointer' }}>No</button>
                  </div>
                ) : (
                  <button onClick={function () { setConfirmDelete(selectedProject.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', fontSize: 13, color: T.inkFaint, borderRadius: 8, transition: 'color 0.2s' }} title="Delete project">{'\uD83D\uDDD1'}</button>
                )}
              </div>
              <p style={{ fontSize: 13, color: T.inkMuted, marginBottom: 28 }}>{selectedProject.startDate} {'\u2192'} {selectedProject.targetDate} {'\u00B7'} {selectedProject.tasksDone}/{selectedProject.tasksTotal} tasks {'\u00B7'} {selectedProject.completedSteps}/{selectedProject.totalSteps} steps</p>

              {/* AI Status Card */}
              <div style={{ padding: 1.5, borderRadius: 22, background: 'linear-gradient(135deg, ' + selectedProject.color + '40, rgba(212,132,154,0.15), transparent 70%)', marginBottom: 20, animation: 'fadeUp 0.5s ease 0.1s both' }}>
                <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: 21, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Orb size={20} />
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: T.accentText, textTransform: 'uppercase' }}>Pulse Status</span>
                  </div>
                  <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.65 }}>{selectedProject.aiStatus}</p>
                </div>
              </div>

              {/* Add Info Button */}
              <div style={{ marginBottom: 20, animation: 'fadeUp 0.5s ease 0.15s both' }}>
                {!showAddInfo ? (
                  <button onClick={function () { setShowAddInfo(true); }} style={{ padding: '12px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.4)', border: '1px solid ' + T.border, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(12px)', width: '100%', transition: 'all 0.3s' }}>
                    <span style={{ fontSize: 16, color: T.accent }}>{'\u2726'}</span>
                    <span style={{ fontSize: 13, color: T.inkSoft }}>Add new information to this project (voice or text)</span>
                  </button>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)', borderRadius: 18, border: '1px solid ' + T.borderGlow, padding: 20, boxShadow: T.shadowGlow }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.accentText, marginBottom: 10 }}>Update project</p>
                    <textarea value={addInfoText} onChange={function (e) { setAddInfoText(e.target.value); }} placeholder={'Tell Pulse anything new — "the contractor said tiles will take an extra week" or "I found cheaper fixtures at Home Depot"'} rows={3} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid ' + T.border, background: 'rgba(255,255,255,0.5)', fontSize: 14, color: T.ink, fontFamily: "'Outfit', sans-serif", resize: 'none', lineHeight: 1.6 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={handleReplan} disabled={!addInfoText.trim()} style={{ padding: '10px 20px', borderRadius: 12, background: addInfoText.trim() ? 'linear-gradient(135deg, ' + T.accent + ', ' + T.rose + ')' : 'rgba(155,126,200,0.2)', color: '#FFF', border: 'none', fontSize: 13, fontWeight: 600, cursor: addInfoText.trim() ? 'pointer' : 'not-allowed', boxShadow: addInfoText.trim() ? '0 4px 16px rgba(155,126,200,0.25)' : 'none' }}>Analyze & adapt plan</button>
                      <button onClick={function () { setShowAddInfo(false); setAddInfoText(''); }} style={{ padding: '10px 16px', borderRadius: 12, background: 'transparent', border: '1px solid ' + T.border, color: T.inkMuted, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Replan Suggestion */}
              {aiTyping && !showReplan && (
                <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)', borderRadius: 18, border: '1px solid ' + T.accentBorder, padding: 20, marginBottom: 20, animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Orb size={18} />
                    <div style={{ display: 'flex', gap: 5 }}>
                      {[0, 1, 2].map(function (i) { return <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, animation: 'pulse 1s ease ' + (i * 0.2) + 's infinite' }} />; })}
                    </div>
                    <span style={{ fontSize: 12, color: T.accentText, marginLeft: 4 }}>Analyzing...</span>
                  </div>
                </div>
              )}

              {showReplan && replanChanges.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px)', borderRadius: 18, border: '1px solid ' + T.accentBorder, padding: 20, marginBottom: 20, animation: 'fadeUp 0.4s ease both', boxShadow: T.shadowGlow }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Orb size={18} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.accentText }}>Pulse suggests changes</span>
                  </div>
                  <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.65, marginBottom: 14 }}>{replanSpeech}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {replanChanges.map(function (change, ci) {
                      var colors = [{ bg: T.peachSoft, border: T.peach }, { bg: T.skySoft, border: T.sky }, { bg: 'rgba(0,0,0,0.02)', border: T.border }];
                      var c = colors[ci % colors.length];
                      return (
                        <div key={ci} style={{ padding: '10px 14px', borderRadius: 12, background: c.bg, border: '1px solid ' + c.border + '30' }}>
                          <p style={{ fontSize: 13, color: T.ink }}><strong style={{ color: c.border }}>{change.type === 'modify_step' ? 'Modify' : change.type === 'add_step' ? 'Add' : 'Remove'}:</strong> {change.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={function () { setShowReplan(false); setAddInfoText(''); router.refresh(); }} style={{ padding: '10px 20px', borderRadius: 12, background: T.accent, color: '#FFF', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Approve changes</button>
                    <button onClick={function () { setShowReplan(false); setAddInfoText(''); }} style={{ padding: '10px 16px', borderRadius: 12, background: 'transparent', border: '1px solid ' + T.border, color: T.inkMuted, fontSize: 13, cursor: 'pointer' }}>Keep original plan</button>
                  </div>
                </div>
              )}

              {/* Steps Timeline */}
              <div style={{ animation: 'fadeUp 0.5s ease 0.2s both' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.inkMuted, letterSpacing: 0.5, marginBottom: 14, textTransform: 'uppercase' }}>Project Steps</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {(selectedProject.rawSteps || []).map(function (step, i) {
                    var done = step.status === 'done';
                    var firstPending = (selectedProject.rawSteps || []).find(function (s) { return s.status !== 'done'; });
                    var current = firstPending && firstPending.id === step.id;
                    var future = !done && !current;
                    var stepTasks = (selectedProject.rawTasks || []).filter(function (t) { return t.step_id === step.id; });
                    var doneTasks = stepTasks.filter(function (t) { return t.status === 'done'; });
                    var allTasksDone = stepTasks.length > 0 && doneTasks.length === stepTasks.length;
                    return (
                      <div key={step.id} style={{ display: 'flex', gap: 14 }}>
                        {/* Timeline line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                          <button onClick={function () { if (!done) completeStep(step.id); }} disabled={done} style={{ width: done ? 12 : current ? 14 : 10, height: done ? 12 : current ? 14 : 10, borderRadius: '50%', background: done ? 'linear-gradient(135deg, ' + T.accent + ', ' + T.rose + ')' : current ? selectedProject.color : 'rgba(0,0,0,0.06)', border: current ? '2px solid ' + selectedProject.color : 'none', boxShadow: current ? '0 0 12px ' + selectedProject.color + '40' : done ? '0 0 8px ' + T.accentGlow : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: done ? 'default' : 'pointer', padding: 0, transition: 'all 0.3s' }}>
                            {done && <span style={{ color: '#FFF', fontSize: 8, fontWeight: 700 }}>{'\u2713'}</span>}
                          </button>
                          {i < (selectedProject.rawSteps || []).length - 1 && <div style={{ width: 2, flex: 1, minHeight: 40, background: done ? 'linear-gradient(180deg, ' + T.accent + '40, ' + T.accent + '20)' : 'rgba(0,0,0,0.04)' }} />}
                        </div>
                        {/* Step content */}
                        <div style={{ flex: 1, paddingBottom: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <p style={{ fontSize: 14, fontWeight: current ? 600 : 500, color: done ? T.inkMuted : future ? T.inkFaint : T.ink, textDecoration: done ? 'line-through' : 'none' }}>Step {step.step_number}: {step.name}</p>
                            {!done && (
                              <button onClick={function () { completeStep(step.id); }} style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.03)', border: '1px solid ' + T.border, color: T.inkMuted, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>Complete step</button>
                            )}
                          </div>
                          {stepTasks.length > 0 && <p style={{ fontSize: 11, color: T.inkMuted, marginBottom: 8 }}>{doneTasks.length}/{stepTasks.length} tasks done</p>}
                          {/* Tasks within step */}
                          {stepTasks.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {stepTasks.map(function (task) {
                                var taskDone = task.status === 'done';
                                var isRescheduling = rescheduleTask && rescheduleTask.id === task.id;
                                return (
                                  <div key={task.id} style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: taskDone ? 'rgba(155,126,200,0.04)' : 'rgba(255,255,255,0.4)', border: '1px solid ' + (isRescheduling ? T.accentBorder : taskDone ? 'rgba(155,126,200,0.1)' : T.border), transition: 'all 0.2s' }}>
                                      <button onClick={function () { if (!taskDone) completeTask(task.id); }} disabled={taskDone} style={{ width: 18, height: 18, borderRadius: 6, border: taskDone ? 'none' : '1.5px solid ' + T.inkFaint, background: taskDone ? 'linear-gradient(135deg, ' + T.accent + ', ' + T.rose + ')' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: taskDone ? 'default' : 'pointer', flexShrink: 0, padding: 0, transition: 'all 0.2s' }}>
                                        {taskDone && <span style={{ color: '#FFF', fontSize: 10, fontWeight: 700 }}>{'\u2713'}</span>}
                                      </button>
                                      <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 13, fontWeight: 500, color: taskDone ? T.inkMuted : T.ink, textDecoration: taskDone ? 'line-through' : 'none' }}>{task.title}</p>
                                        <button onClick={function () { if (!taskDone) openReschedule(task); }} disabled={taskDone} style={{ background: 'none', border: 'none', padding: 0, cursor: taskDone ? 'default' : 'pointer', textAlign: 'left' }}>
                                          <p style={{ fontSize: 10, color: isRescheduling ? T.accentText : T.inkMuted, fontWeight: isRescheduling ? 600 : 400, textDecoration: !taskDone ? 'underline dotted' : 'none', textUnderlineOffset: 2 }}>
                                            {task.due_at ? new Date(task.due_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'No date — click to schedule'}
                                          </p>
                                        </button>
                                      </div>
                                      {task.duration_minutes && <span style={{ fontSize: 10, color: T.inkFaint }}>{task.duration_minutes >= 60 ? Math.round(task.duration_minutes / 60 * 10) / 10 + 'h' : task.duration_minutes + 'm'}</span>}
                                    </div>

                                    {/* Reschedule popover */}
                                    {isRescheduling && (
                                      <div style={{ marginTop: 6, padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid ' + T.accentBorder, boxShadow: T.shadowGlow, animation: 'fadeUp 0.25s ease both' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                          <p style={{ fontSize: 12, fontWeight: 600, color: T.accentText }}>Reschedule task</p>
                                          <button onClick={function () { setRescheduleTask(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.inkMuted, padding: 0 }}>{'\u2715'}</button>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                          <input type="date" value={rescheduleDate} onChange={function (e) { setRescheduleDate(e.target.value); }} style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid ' + T.border, background: 'rgba(255,255,255,0.5)', fontSize: 12, color: T.ink, fontFamily: "'Outfit', sans-serif" }} />
                                          <input type="time" value={rescheduleTime} onChange={function (e) { setRescheduleTime(e.target.value); }} style={{ width: 100, padding: '8px 10px', borderRadius: 10, border: '1px solid ' + T.border, background: 'rgba(255,255,255,0.5)', fontSize: 12, color: T.ink, fontFamily: "'Outfit', sans-serif" }} />
                                        </div>

                                        {/* Suggested slots */}
                                        {calendarConnected && (
                                          <div style={{ marginBottom: 12 }}>
                                            <button onClick={fetchSuggestedSlots} disabled={loadingSlots} style={{ padding: '6px 14px', borderRadius: 8, background: T.accentSoft, border: '1px solid ' + T.accentBorder, color: T.accentText, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                              {loadingSlots ? 'Finding slots...' : '\uD83D\uDCC5 Suggest free times'}
                                            </button>
                                            {suggestedSlots.length > 0 && (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                                                {suggestedSlots.map(function (slot, si) {
                                                  return (
                                                    <button key={si} onClick={function () { pickSlot(slot); }} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: '1px solid ' + T.border, cursor: 'pointer', transition: 'all 0.2s' }}>
                                                      <p style={{ fontSize: 12, fontWeight: 500, color: T.ink }}>{slot.label}</p>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        <div style={{ display: 'flex', gap: 8 }}>
                                          <button onClick={saveReschedule} disabled={!rescheduleDate} style={{ padding: '8px 18px', borderRadius: 10, background: rescheduleDate ? 'linear-gradient(135deg, ' + T.accent + ', ' + T.rose + ')' : 'rgba(155,126,200,0.2)', color: '#FFF', border: 'none', fontSize: 12, fontWeight: 600, cursor: rescheduleDate ? 'pointer' : 'not-allowed' }}>Save new time</button>
                                          <button onClick={function () { setRescheduleTask(null); }} style={{ padding: '8px 14px', borderRadius: 10, background: 'transparent', border: '1px solid ' + T.border, color: T.inkMuted, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Connected People & Goals */}
              <div style={{ display: 'flex', gap: 12, marginTop: 10, animation: 'fadeUp 0.5s ease 0.3s both' }}>
                {selectedProject.people && selectedProject.people.length > 0 && (
                  <div style={{ flex: 1, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)', border: '1px solid ' + T.border }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: T.inkMuted, letterSpacing: 0.3, marginBottom: 8, textTransform: 'uppercase' }}>People</p>
                    {selectedProject.people.map(function (p) { return <p key={p} style={{ fontSize: 13, color: T.ink, marginBottom: 3 }}>{p}</p>; })}
                  </div>
                )}
                {selectedProject.goal && (
                  <div style={{ flex: 1, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)', border: '1px solid ' + T.border }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: T.inkMuted, letterSpacing: 0.3, marginBottom: 8, textTransform: 'uppercase' }}>Connected Goal</p>
                    <p style={{ fontSize: 13, color: T.accent, fontWeight: 500 }}>{selectedProject.goal}</p>
                  </div>
                )}
              </div>

              {/* Reminder frequency */}
              <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)', border: '1px solid ' + T.border, animation: 'fadeUp 0.5s ease 0.35s both' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.inkMuted, letterSpacing: 0.3, marginBottom: 10, textTransform: 'uppercase' }}>Task Reminders</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ id: '30m', label: '30 min before' }, { id: '1h', label: '1 hour' }, { id: '3h', label: '3 hours' }, { id: '1d', label: '1 day' }].map(function (r) {
                    var sel = reminderFreq === r.id;
                    return <button key={r.id} onClick={function () { setReminderFreq(r.id); }} style={{ padding: '7px 14px', borderRadius: 10, background: sel ? T.accent : 'rgba(255,255,255,0.4)', border: '1px solid ' + (sel ? T.accent : T.border), color: sel ? '#FFF' : T.inkSoft, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>{r.label}</button>;
                  })}
                </div>
              </div>
            </div>
          </>}

          {/* ═══ CREATE PROJECT VIEW ═══ */}
          {view === 'create' && <>
            <div style={{ paddingTop: 50, animation: 'fadeUp 0.5s ease both' }}>
              <button onClick={function () { setView('list'); setProjectName(''); setProjectDesc(''); setImportedContext(''); }} style={{ background: 'none', border: 'none', color: T.inkMuted, cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}>{'\u2190'} Back</button>

              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 400, letterSpacing: -0.5, marginBottom: 6 }}>New project.</h1>
              <p style={{ fontSize: 14, color: T.inkMuted, marginBottom: 24 }}>Tell Pulse about your project — it{"'"}ll build the plan</p>

              {/* Calendar awareness banner */}
              {calendarChecked && !calendarChoice && (
                <div style={{ padding: 16, borderRadius: 16, background: calendarConnected ? 'rgba(126,184,155,0.08)' : 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid ' + (calendarConnected ? T.sage + '30' : T.accentBorder), marginBottom: 20, animation: 'fadeUp 0.4s ease both' }}>
                  {calendarConnected ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{'\u2713'}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.sage }}>Calendar connected</p>
                        <p style={{ fontSize: 11, color: T.inkMuted }}>Pulse will schedule around your existing events</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 16 }}>{'\uD83D\uDCC5'}</span>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>How should Pulse schedule your tasks?</p>
                      </div>
                      <p style={{ fontSize: 12, color: T.inkMuted, marginBottom: 12, lineHeight: 1.5 }}>Connect your Google Calendar so Pulse avoids conflicts, or use Pulse as your standalone calendar.</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={function () { window.open('/api/calendar/connect', '_blank'); }} style={{ padding: '8px 16px', borderRadius: 10, background: T.accentSoft, border: '1px solid ' + T.accentBorder, color: T.accentText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Connect Google Calendar</button>
                        <button onClick={function () { setCalendarChoice('pulse'); }} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.4)', border: '1px solid ' + T.border, color: T.inkSoft, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Use Pulse as my calendar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {calendarChoice === 'pulse' && (
                <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(126,184,155,0.08)', border: '1px solid ' + T.sage + '30', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{'\u2713'}</span>
                  <p style={{ fontSize: 12, color: T.sage, fontWeight: 500 }}>Using Pulse as your calendar — tasks will be scheduled freely</p>
                </div>
              )}

              {/* Mode Toggle */}
              <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid ' + T.border, marginBottom: 24, width: 'fit-content' }}>
                {[{ id: 'voice', label: '\uD83C\uDFA4 Voice', desc: 'Speak naturally' }, { id: 'manual', label: '\u270E Manual', desc: 'Type it out' }].map(function (m) {
                  var sel = createMode === m.id;
                  return (
                    <button key={m.id} onClick={function () { setCreateMode(m.id); }} style={{ padding: '10px 20px', borderRadius: 11, background: sel ? '#FFF' : 'transparent', border: 'none', cursor: 'pointer', boxShadow: sel ? T.shadow : 'none', transition: 'all 0.3s' }}>
                      <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? T.ink : T.inkMuted }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Voice Mode */}
              {createMode === 'voice' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(24px)', borderRadius: 22, border: '1px solid ' + T.border, padding: '32px 28px', textAlign: 'center', boxShadow: T.shadow }}>
                    {voiceState === 'idle' && <>
                      <Orb size={64} />
                      <p style={{ fontSize: 15, color: T.inkSoft, marginTop: 16, marginBottom: 20 }}>Tell Pulse about your project</p>
                      <button style={{ padding: '14px 32px', borderRadius: 16, background: 'rgba(155,126,200,0.2)', color: T.inkMuted, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'not-allowed' }}>{'\uD83C\uDFA4'} Coming soon</button>
                      <p style={{ fontSize: 12, color: T.inkMuted, marginTop: 8 }}>Voice input is coming soon. Use manual mode for now.</p>
                    </>}
                    {voiceState === 'listening' && <>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 14, height: 32, alignItems: 'center' }}>
                        {Array.from({ length: 16 }).map(function (_, i) {
                          return <div key={i} style={{ width: 3, borderRadius: 2, height: 6 + Math.random() * 22, background: T.accent, opacity: 0.6, animation: 'pulse 0.6s ease ' + (i * 0.05) + 's infinite' }} />;
                        })}
                      </div>
                      <p style={{ fontSize: 12, color: T.accent, fontWeight: 600, marginBottom: 12 }}>Listening...</p>
                      {transcript && <p style={{ fontSize: 15, color: T.ink, lineHeight: 1.6, fontStyle: 'italic', maxWidth: 440, margin: '0 auto' }}>"{transcript}"</p>}
                    </>}
                    {voiceState === 'thinking' && <>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
                        {[0, 1, 2].map(function (i) { return <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent, animation: 'pulse 1s ease ' + (i * 0.2) + 's infinite' }} />; })}
                      </div>
                      <p style={{ fontSize: 14, color: T.accentText, fontWeight: 500 }}>Pulse is building your project plan...</p>
                    </>}
                  </div>
                </div>
              )}

              {/* Manual Mode */}
              {createMode === 'manual' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(24px)', borderRadius: 22, border: '1px solid ' + T.border, padding: 24, boxShadow: T.shadow }}>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.inkMuted, letterSpacing: 0.3, marginBottom: 6, display: 'block' }}>PROJECT NAME</label>
                      <input value={projectName} onChange={function (e) { setProjectName(e.target.value); }} placeholder="e.g. Bathroom Renovation" style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid ' + (projectName ? T.accentBorder : T.border), background: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 500, color: T.ink, fontFamily: "'Outfit', sans-serif", transition: 'border 0.2s' }} />
                    </div>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.inkMuted, letterSpacing: 0.3, marginBottom: 6, display: 'block' }}>DESCRIBE YOUR PROJECT</label>
                      <textarea value={projectDesc} onChange={function (e) { setProjectDesc(e.target.value); }} placeholder="Tell Pulse everything — the more detail, the better the plan. What's the scope? Any deadlines? Budget? Who's involved?" rows={4} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid ' + T.border, background: 'rgba(255,255,255,0.5)', fontSize: 14, color: T.ink, fontFamily: "'Outfit', sans-serif", resize: 'none', lineHeight: 1.6 }} />
                    </div>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.inkMuted, letterSpacing: 0.3, marginBottom: 6, display: 'block' }}>DEADLINE <span style={{ fontWeight: 400, color: T.inkFaint }}>(optional)</span></label>
                      <input type="date" value={projectDeadline} onChange={function (e) { setProjectDeadline(e.target.value); }} min={new Date().toISOString().split('T')[0]} style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1px solid ' + (projectDeadline ? T.accentBorder : T.border), background: 'rgba(255,255,255,0.5)', fontSize: 14, color: T.ink, fontFamily: "'Outfit', sans-serif", transition: 'border 0.2s' }} />
                      {projectDeadline && <p style={{ fontSize: 11, color: T.accentText, marginTop: 4 }}>All tasks will be scheduled before {new Date(projectDeadline + 'T23:59:59').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.inkMuted, letterSpacing: 0.3, marginBottom: 6, display: 'block' }}>IMPORT CONTEXT <span style={{ fontWeight: 400, color: T.inkFaint }}>(optional)</span></label>
                      <textarea value={importedContext} onChange={function (e) { setImportedContext(e.target.value); }} placeholder="Paste any project plans, ChatGPT conversations, notes, or research you've already done — Pulse will use it to build a smarter plan" rows={3} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px dashed ' + T.border, background: 'rgba(155,126,200,0.03)', fontSize: 13, color: T.ink, fontFamily: "'Outfit', sans-serif", resize: 'none', lineHeight: 1.6 }} />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.inkMuted, letterSpacing: 0.3, marginBottom: 8, display: 'block' }}>PROJECT COLOR</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {COLOR_SWATCHES.map(function (c, i) {
                          var sel = projectColor === c;
                          return (
                            <button key={i} onClick={function () { setProjectColor(c); }} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: sel ? '2.5px solid ' + T.ink : '2px solid transparent', cursor: 'pointer', padding: 0, boxShadow: sel ? '0 0 12px ' + c : 'none', transition: 'all 0.2s', transform: sel ? 'scale(1.15)' : 'scale(1)', outline: 'none' }} title={'Color ' + (i + 1)} />
                          );
                        })}
                        <button onClick={function () { setProjectColor(hueToHSL(Math.random() * 360)); }} style={{ width: 26, height: 26, borderRadius: '50%', background: 'conic-gradient(from 0deg, hsl(0,52%,58%), hsl(60,52%,58%), hsl(120,52%,58%), hsl(180,52%,58%), hsl(240,52%,58%), hsl(300,52%,58%), hsl(360,52%,58%))', border: '2px solid ' + T.border, cursor: 'pointer', padding: 0, transition: 'all 0.2s', outline: 'none' }} title="Random color" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 4, background: projectColor, boxShadow: '0 0 8px ' + projectColor + '40' }} />
                        <span style={{ fontSize: 12, color: T.inkSoft }}>Selected color preview</span>
                      </div>
                    </div>
                    <button onClick={function () { if (projectName.trim()) generatePlan(); }} disabled={!projectName.trim()} style={{ padding: '14px 28px', borderRadius: 14, background: projectName.trim() ? 'linear-gradient(135deg, ' + projectColor + ', ' + T.rose + ')' : 'rgba(155,126,200,0.2)', color: '#FFF', border: 'none', fontSize: 14, fontWeight: 600, cursor: projectName.trim() ? 'pointer' : 'not-allowed', boxShadow: projectName.trim() ? '0 4px 20px ' + projectColor + '50' : 'none', width: '100%' }}>{'\u2726'} Generate project plan</button>
                  </div>
                </div>
              )}

              {/* Scheduling Preferences */}
              <div style={{ marginTop: 20 }}>
                <button onClick={function () { setShowPrefs(!showPrefs); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.inkMuted, letterSpacing: 0.3 }}>SCHEDULING PREFERENCES</span>
                  <span style={{ fontSize: 10, color: T.inkMuted, transform: showPrefs ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>{'\u25BC'}</span>
                </button>
                {showPrefs && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, animation: 'fadeUp 0.3s ease both' }}>
                    {SCHED_PREFS.map(function (pref) {
                      var sel = selectedPrefs.indexOf(pref.id) >= 0;
                      return (
                        <button key={pref.id} onClick={function () { togglePref(pref.id); }} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 14, background: sel ? T.accentSoft : 'rgba(255,255,255,0.4)', border: '1px solid ' + (sel ? T.accentBorder : T.border), cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.3s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 14 }}>{pref.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: sel ? 600 : 500, color: sel ? T.accentText : T.ink }}>{pref.label}</span>
                          </div>
                          <p style={{ fontSize: 11, color: T.inkMuted, lineHeight: 1.4 }}>{pref.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>}

          {/* ═══ AI GENERATING VIEW ═══ */}
          {view === 'creating' && <>
            <div style={{ paddingTop: 50, animation: 'fadeUp 0.5s ease both' }}>
              <button onClick={function () { setView('list'); setShowSteps(false); setShowCalendar(false); setAiMessage(''); setApprovedSteps({}); }} style={{ background: 'none', border: 'none', color: T.inkMuted, cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}>{'\u2190'} Cancel</button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{ width: 14, height: 14, borderRadius: 5, background: projectColor, boxShadow: '0 0 10px ' + projectColor + '50' }} />
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 400 }}>{projectName || 'New Project'}</h1>
              </div>

              {/* AI Message */}
              <div style={{ padding: 1.5, borderRadius: 22, background: 'linear-gradient(135deg, rgba(155,126,200,0.25), rgba(212,132,154,0.1), transparent 70%)', marginBottom: 24 }}>
                <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(24px)', borderRadius: 21, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Orb size={20} />
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: T.accentText, textTransform: 'uppercase' }}>Pulse Project Brain</span>
                  </div>
                  {aiTyping ? (
                    <div style={{ display: 'flex', gap: 5 }}>
                      {[0, 1, 2].map(function (i) { return <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, animation: 'pulse 1s ease ' + (i * 0.2) + 's infinite' }} />; })}
                    </div>
                  ) : (
                    <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.65 }}>{aiMessage}</p>
                  )}
                </div>
              </div>

              {/* Steps */}
              {showSteps && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.5s ease both' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.inkMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Suggested Plan — {generatedSteps.length} steps, {generatedSteps.reduce(function (a, s) { return a + s.tasks.length; }, 0)} tasks</p>

                  {generatedSteps.map(function (step, si) {
                    var expanded = expandedStep === step.id;
                    var approved = approvedSteps[step.id];
                    return (
                      <div key={step.id} style={{ background: approved ? 'rgba(155,126,200,0.05)' : 'rgba(255,255,255,0.52)', backdropFilter: 'blur(16px)', borderRadius: 16, border: '1px solid ' + (approved ? T.accentBorder : T.border), overflow: 'hidden', transition: 'all 0.4s', animation: 'fadeUp 0.4s ease ' + (si * 0.08) + 's both' }}>
                        <button onClick={function () { setExpandedStep(expanded ? null : step.id); }} style={{ width: '100%', textAlign: 'left', padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 9, background: approved ? 'linear-gradient(135deg, ' + T.accent + ', ' + T.rose + ')' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                            {approved ? <span style={{ color: '#FFF', fontSize: 12, fontWeight: 700 }}>{'\u2713'}</span> : <span style={{ fontSize: 12, fontWeight: 700, color: T.inkMuted }}>{si + 1}</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14.5, fontWeight: 600, color: T.ink }}>{step.name}</p>
                            <p style={{ fontSize: 12, color: T.inkMuted }}>{step.tasks.length} tasks {'\u00B7'} {step.duration}</p>
                          </div>
                          <span style={{ fontSize: 10, color: T.inkMuted, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>{'\u25BC'}</span>
                        </button>

                        {expanded && (
                          <div style={{ padding: '0 18px 16px', animation: 'fadeUp 0.3s ease both' }}>
                            <div style={{ borderTop: '1px solid ' + T.divider, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {step.tasks.map(function (task, ti) {
                                var isEditing = planEditTask && planEditTask.stepIdx === si && planEditTask.taskIdx === ti;
                                return (
                                  <div key={task.id}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: isEditing ? 'rgba(155,126,200,0.06)' : 'rgba(255,255,255,0.4)', border: '1px solid ' + (isEditing ? T.accentBorder : T.border), transition: 'all 0.2s' }}>
                                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: projectColor, flexShrink: 0 }} />
                                      <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{task.title}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                          <button onClick={function () { isEditing ? setPlanEditTask(null) : openPlanEdit(si, ti); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ fontSize: 11, color: T.accentText, fontWeight: 500, textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{task.scheduled || 'Set time'}</span>
                                            <span style={{ fontSize: 9, color: T.inkMuted }}>{'\u270E'}</span>
                                          </button>
                                          <span style={{ fontSize: 11, color: T.inkMuted }}>{'\u00B7'} {task.est}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Inline reschedule popover */}
                                    {isEditing && (
                                      <div style={{ margin: '6px 0 4px', padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid ' + T.accentBorder, boxShadow: T.shadowGlow, animation: 'fadeUp 0.25s ease both' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                          <p style={{ fontSize: 12, fontWeight: 600, color: T.accentText }}>Reschedule "{task.title}"</p>
                                          <button onClick={function () { setPlanEditTask(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.inkMuted, padding: 0 }}>{'\u2715'}</button>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                          <input type="date" value={planEditDate} onChange={function (e) { setPlanEditDate(e.target.value); }} style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid ' + T.border, background: 'rgba(255,255,255,0.5)', fontSize: 12, color: T.ink, fontFamily: "'Outfit', sans-serif" }} />
                                          <input type="time" value={planEditTime} onChange={function (e) { setPlanEditTime(e.target.value); }} style={{ width: 100, padding: '8px 10px', borderRadius: 10, border: '1px solid ' + T.border, background: 'rgba(255,255,255,0.5)', fontSize: 12, color: T.ink, fontFamily: "'Outfit', sans-serif" }} />
                                        </div>
                                        {calendarConnected && (
                                          <div style={{ marginBottom: 10 }}>
                                            <button onClick={fetchPlanEditSlots} disabled={planEditLoading} style={{ padding: '5px 12px', borderRadius: 8, background: T.accentSoft, border: '1px solid ' + T.accentBorder, color: T.accentText, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                              {planEditLoading ? 'Finding...' : '\uD83D\uDCC5 Suggest free times'}
                                            </button>
                                            {planEditSlots.length > 0 && (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                                                {planEditSlots.map(function (slot, slotIdx) {
                                                  return <button key={slotIdx} onClick={function () { pickPlanEditSlot(slot); }} style={{ textAlign: 'left', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid ' + T.border, cursor: 'pointer', fontSize: 11, fontWeight: 500, color: T.ink }}>{slot.label}</button>;
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        <p style={{ fontSize: 10, color: T.inkMuted, marginBottom: 8 }}>Tasks after this one will shift by the same amount.</p>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                          <button onClick={savePlanEdit} disabled={!planEditDate} style={{ padding: '7px 16px', borderRadius: 10, background: planEditDate ? 'linear-gradient(135deg, ' + T.accent + ', ' + T.rose + ')' : 'rgba(155,126,200,0.2)', color: '#FFF', border: 'none', fontSize: 12, fontWeight: 600, cursor: planEditDate ? 'pointer' : 'not-allowed' }}>Apply</button>
                                          <button onClick={function () { setPlanEditTask(null); }} style={{ padding: '7px 12px', borderRadius: 10, background: 'transparent', border: '1px solid ' + T.border, color: T.inkMuted, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <button onClick={function () { toggleStepApproval(step.id); }} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 10, background: approved ? 'rgba(0,0,0,0.03)' : T.accentSoft, border: '1px solid ' + (approved ? T.border : T.accentBorder), color: approved ? T.inkMuted : T.accentText, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                              {approved ? 'Undo approval' : '\u2713 Approve this step'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ═══ VISUAL CALENDAR PREVIEW ═══ */}
                  {(function () {
                    // Collect all suggested tasks as calendar items
                    var suggestedItems = [];
                    generatedSteps.forEach(function (step) {
                      step.tasks.forEach(function (t) {
                        if (t.scheduled_start) {
                          suggestedItems.push({ title: t.title, start: t.scheduled_start, end: t.scheduled_end || t.scheduled_start, type: 'suggested' });
                        }
                      });
                    });

                    // Compute date range for calendar
                    var allDates = suggestedItems.map(function (i) { return new Date(i.start); });
                    var rangeStart = allDates.length > 0 ? new Date(Math.min.apply(null, allDates)) : new Date();
                    rangeStart.setHours(0, 0, 0, 0);

                    // Build columns based on mode
                    var numDays = calPreviewMode === 'day' ? 1 : calPreviewMode === '3day' ? 3 : calPreviewMode === 'week' ? 7 : 28;
                    var baseDate = new Date(calPreviewDate);
                    baseDate.setHours(0, 0, 0, 0);
                    // For week mode, start on Monday
                    if (calPreviewMode === 'week') {
                      var dow = baseDate.getDay();
                      baseDate.setDate(baseDate.getDate() - ((dow + 6) % 7));
                    }

                    var columns = [];
                    for (var d = 0; d < numDays; d++) {
                      var colDate = new Date(baseDate);
                      colDate.setDate(colDate.getDate() + d);
                      columns.push(colDate);
                    }

                    // All events: real + suggested
                    var allEvents = calPreviewEvents.map(function (e) { return { title: e.title, start: e.start, end: e.end, type: 'existing' }; }).concat(suggestedItems);

                    // Hours to display
                    var HOUR_START = 7;
                    var HOUR_END = 21;
                    var HOUR_HEIGHT = calPreviewMode === 'month' ? 0 : 48;
                    var hours = [];
                    for (var h = HOUR_START; h <= HOUR_END; h++) hours.push(h);

                    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    var today = new Date(); today.setHours(0, 0, 0, 0);

                    return (
                      <div style={{ marginTop: 20 }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <button onClick={function () { setShowCalendar(!showCalendar); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.accentText, letterSpacing: 0.3 }}>{'\uD83D\uDCC5'} SCHEDULE PREVIEW</span>
                            <span style={{ fontSize: 10, color: T.inkMuted, transform: showCalendar ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>{'\u25BC'}</span>
                          </button>
                          {showCalendar && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              {[{ id: 'day', label: 'Day' }, { id: '3day', label: '3 Days' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }].map(function (m) {
                                var active = calPreviewMode === m.id;
                                return <button key={m.id} onClick={function () { setCalPreviewMode(m.id); }} style={{ padding: '4px 10px', borderRadius: 8, background: active ? T.accentSoft : 'transparent', border: '1px solid ' + (active ? T.accentBorder : 'transparent'), color: active ? T.accentText : T.inkMuted, fontSize: 11, fontWeight: active ? 600 : 500, cursor: 'pointer' }}>{m.label}</button>;
                              })}
                            </div>
                          )}
                        </div>

                        {showCalendar && (
                          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                            {/* Navigation */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <button onClick={function () { var d = new Date(calPreviewDate); d.setDate(d.getDate() - numDays); setCalPreviewDate(d); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: T.inkMuted, padding: '4px 8px' }}>{'\u2039'}</button>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                                  {calPreviewMode === 'month'
                                    ? monthNames[baseDate.getMonth()] + ' ' + baseDate.getFullYear()
                                    : monthNames[columns[0].getMonth()] + ' ' + columns[0].getDate() + (numDays > 1 ? ' – ' + (columns[columns.length - 1].getMonth() !== columns[0].getMonth() ? monthNames[columns[columns.length - 1].getMonth()] + ' ' : '') + columns[columns.length - 1].getDate() : '') + ', ' + columns[0].getFullYear()
                                  }
                                </span>
                                <button onClick={function () { setCalPreviewDate(new Date()); }} style={{ padding: '2px 8px', borderRadius: 6, background: T.accentSoft, border: '1px solid ' + T.accentBorder, color: T.accentText, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Today</button>
                              </div>
                              <button onClick={function () { var d = new Date(calPreviewDate); d.setDate(d.getDate() + numDays); setCalPreviewDate(d); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: T.inkMuted, padding: '4px 8px' }}>{'\u203A'}</button>
                            </div>

                            {/* Month View */}
                            {calPreviewMode === 'month' && (function () {
                              var firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
                              var startPad = (firstDay.getDay() + 6) % 7; // Monday start
                              var daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
                              var cells = [];
                              for (var p = 0; p < startPad; p++) cells.push(null);
                              for (var dd = 1; dd <= daysInMonth; dd++) cells.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), dd));

                              return (
                                <div style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)', borderRadius: 16, border: '1px solid ' + T.border, overflow: 'hidden' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid ' + T.divider }}>
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (dn) {
                                      return <div key={dn} style={{ padding: '8px 0', textAlign: 'center', fontSize: 10, fontWeight: 600, color: T.inkMuted }}>{dn}</div>;
                                    })}
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                    {cells.map(function (cellDate, ci) {
                                      if (!cellDate) return <div key={'pad_' + ci} style={{ minHeight: 72, borderRight: '1px solid ' + T.divider, borderBottom: '1px solid ' + T.divider }} />;
                                      var cellStr = cellDate.toISOString().split('T')[0];
                                      var isToday = cellDate.getTime() === today.getTime();
                                      var dayEvents = allEvents.filter(function (ev) { return ev.start && ev.start.split('T')[0] === cellStr; });
                                      return (
                                        <div key={cellStr} style={{ minHeight: 72, padding: 4, borderRight: '1px solid ' + T.divider, borderBottom: '1px solid ' + T.divider, background: isToday ? 'rgba(155,126,200,0.05)' : 'transparent' }}>
                                          <p style={{ fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? T.accentText : T.ink, textAlign: 'right', marginBottom: 4, padding: '0 2px' }}>{cellDate.getDate()}</p>
                                          {dayEvents.slice(0, 3).map(function (ev, ei) {
                                            var isSuggested = ev.type === 'suggested';
                                            return (
                                              <div key={ei} style={{ padding: '2px 4px', borderRadius: 4, marginBottom: 2, fontSize: 9, fontWeight: 500, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: isSuggested ? projectColor + '20' : 'rgba(0,0,0,0.04)', color: isSuggested ? projectColor : T.inkSoft, borderLeft: '2px solid ' + (isSuggested ? projectColor : T.inkFaint) }}>
                                                {ev.title}
                                              </div>
                                            );
                                          })}
                                          {dayEvents.length > 3 && <p style={{ fontSize: 8, color: T.inkMuted, padding: '0 4px' }}>+{dayEvents.length - 3} more</p>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Day / 3-Day / Week View (time grid) */}
                            {calPreviewMode !== 'month' && (
                              <div style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)', borderRadius: 16, border: '1px solid ' + T.border, overflow: 'hidden' }}>
                                {/* Column headers */}
                                <div style={{ display: 'grid', gridTemplateColumns: '42px repeat(' + columns.length + ', 1fr)', borderBottom: '1px solid ' + T.divider }}>
                                  <div style={{ padding: 6 }} />
                                  {columns.map(function (col) {
                                    var colIsToday = col.getTime() === today.getTime();
                                    return (
                                      <div key={col.toISOString()} style={{ padding: '8px 4px', textAlign: 'center', borderLeft: '1px solid ' + T.divider, background: colIsToday ? 'rgba(155,126,200,0.06)' : 'transparent' }}>
                                        <p style={{ fontSize: 10, fontWeight: 600, color: colIsToday ? T.accentText : T.inkMuted }}>{dayNames[col.getDay()]}</p>
                                        <p style={{ fontSize: 16, fontWeight: colIsToday ? 700 : 500, color: colIsToday ? T.accentText : T.ink }}>{col.getDate()}</p>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Time grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '42px repeat(' + columns.length + ', 1fr)', maxHeight: 480, overflowY: 'auto' }}>
                                  {/* Hour labels + cells */}
                                  {hours.map(function (hr) {
                                    var hrLabel = hr === 0 ? '12 AM' : hr < 12 ? hr + ' AM' : hr === 12 ? '12 PM' : (hr - 12) + ' PM';
                                    return [
                                      <div key={'lbl_' + hr} style={{ padding: '2px 4px', fontSize: 9, color: T.inkMuted, textAlign: 'right', height: HOUR_HEIGHT, borderBottom: '1px solid ' + T.divider, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>{hrLabel}</div>
                                    ].concat(columns.map(function (col) {
                                      var colStr = col.toISOString().split('T')[0];
                                      var colIsToday = col.getTime() === today.getTime();
                                      // Find events that overlap this hour
                                      var hourEvents = allEvents.filter(function (ev) {
                                        if (!ev.start) return false;
                                        var evDate = ev.start.split('T')[0];
                                        if (evDate !== colStr) return false;
                                        var evHour = new Date(ev.start).getHours();
                                        var evEndHour = ev.end ? new Date(ev.end).getHours() + (new Date(ev.end).getMinutes() > 0 ? 1 : 0) : evHour + 1;
                                        return hr >= evHour && hr < evEndHour;
                                      });
                                      // Only render at the start hour
                                      var startsThisHour = hourEvents.filter(function (ev) {
                                        return new Date(ev.start).getHours() === hr;
                                      });
                                      return (
                                        <div key={colStr + '_' + hr} style={{ height: HOUR_HEIGHT, borderLeft: '1px solid ' + T.divider, borderBottom: '1px solid ' + T.divider, position: 'relative', background: colIsToday ? 'rgba(155,126,200,0.02)' : 'transparent' }}>
                                          {startsThisHour.map(function (ev, ei) {
                                            var evStart = new Date(ev.start);
                                            var evEnd = ev.end ? new Date(ev.end) : new Date(evStart.getTime() + 3600000);
                                            var durHrs = Math.max(0.5, (evEnd - evStart) / 3600000);
                                            var topOffset = (evStart.getMinutes() / 60) * HOUR_HEIGHT;
                                            var blockHeight = Math.max(20, durHrs * HOUR_HEIGHT - 2);
                                            var isSuggested = ev.type === 'suggested';
                                            var startLabel = evStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                                            return (
                                              <div key={ei} style={{ position: 'absolute', top: topOffset, left: 2, right: 2, height: blockHeight, borderRadius: 6, padding: '3px 5px', overflow: 'hidden', fontSize: 10, lineHeight: 1.3, background: isSuggested ? 'linear-gradient(135deg, ' + projectColor + '25, ' + projectColor + '15)' : 'rgba(122,171,200,0.15)', border: '1px solid ' + (isSuggested ? projectColor + '40' : 'rgba(122,171,200,0.25)'), color: isSuggested ? projectColor : T.sky, zIndex: 2 }}>
                                                <p style={{ fontWeight: 600, fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</p>
                                                {blockHeight > 28 && <p style={{ fontSize: 8, opacity: 0.7, marginTop: 1 }}>{startLabel}</p>}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    }));
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Legend */}
                            <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 3, background: projectColor + '30', border: '1px solid ' + projectColor + '50' }} />
                                <span style={{ fontSize: 10, color: T.inkMuted }}>New tasks</span>
                              </div>
                              {calPreviewEvents.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(122,171,200,0.2)', border: '1px solid rgba(122,171,200,0.35)' }} />
                                  <span style={{ fontSize: 10, color: T.inkMuted }}>Existing events</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Approve All + Create */}
                  <div style={{ marginTop: 20, display: 'flex', gap: 10, animation: 'fadeUp 0.4s ease 0.5s both' }}>
                    <button onClick={function () {
                      var all = {};
                      generatedSteps.forEach(function (s) { all[s.id] = true; });
                      setApprovedSteps(all);
                    }} style={{ padding: '14px 24px', borderRadius: 14, background: allApproved ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.5)', border: '1px solid ' + T.border, color: T.inkSoft, fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                      {allApproved ? '\u2713 All approved' : 'Approve all steps'}
                    </button>
                    <button onClick={handleCreateAndSave} disabled={saving} style={{ flex: 1, padding: '14px 24px', borderRadius: 14, background: allApproved ? 'linear-gradient(135deg, ' + T.accent + ', ' + T.rose + ')' : T.accentSoft, color: allApproved ? '#FFF' : T.accentText, border: 'none', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', boxShadow: allApproved ? '0 4px 24px rgba(155,126,200,0.35)' : 'none', transition: 'all 0.3s', opacity: saving ? 0.6 : 1 }}>
                      {saving ? 'Creating project...' : 'Create project & schedule tasks'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>}

        </div>
      </div>
    </div>
  );
}
