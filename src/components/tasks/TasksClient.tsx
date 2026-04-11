'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

/* ═══ HELPERS ═══ */
function startOfDay(d: Date) { const n = new Date(d); n.setHours(0,0,0,0); return n; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function dueBucket(due_at?: string): 'today' | 'tomorrow' | 'week' | 'later' | 'someday' {
  if (!due_at) return 'someday';
  const d = new Date(due_at);
  const now = startOfDay(new Date());
  const tom = addDays(now, 1);
  const wk = addDays(now, 7);
  if (d < tom) return 'today';
  if (d < addDays(tom, 1)) return 'tomorrow';
  if (d < wk) return 'week';
  return 'later';
}

function formatDue(due_at?: string): string {
  if (!due_at) return '';
  const d = new Date(due_at);
  const now = startOfDay(new Date());
  const diff = Math.round((startOfDay(d).getTime() - now.getTime()) / 86400000);
  if (diff === 0) {
    const h = d.getHours();
    const m = d.getMinutes();
    if (h === 0 && m === 0) return 'Today';
    return 'Today ' + (h % 12 || 12) + (m > 0 ? ':' + String(m).padStart(2, '0') : '') + (h >= 12 ? 'pm' : 'am');
  }
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return Math.abs(diff) + 'd overdue';
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

var BUCKETS = ['today', 'tomorrow', 'week', 'later', 'someday'] as const;
var BUCKET_LABELS: Record<string, string> = { today: 'Today', tomorrow: 'Tomorrow', week: 'This week', later: 'Later', someday: 'Someday' };

/* ═══ TYPES ═══ */
interface TaskData {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_at?: string;
  duration_minutes?: number;
  is_pinned?: boolean;
  is_delegated?: boolean;
  project_id?: string;
  project?: { id: string; name: string; color: string; category?: string };
  created_at: string;
  [key: string]: any;
}
interface ProjectData {
  id: string;
  name: string;
  color: string;
  [key: string]: any;
}
interface SubtaskData {
  id: string;
  title: string;
  status: string;
  parent_task_id: string;
}

/* ═══ TASK ROW ═══ */
function TaskRow({ task, subtaskCount, onSelect, onComplete, idx }: {
  task: TaskData; subtaskCount: number; onSelect: (t: TaskData) => void; onComplete: (id: string) => void; idx: number;
}) {
  var [hov, setHov] = useState(false);
  var done = task.status === 'done';
  var projectColor = task.project?.color || P.orchid;
  var duration = task.duration_minutes;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 0,
        borderBottom: '1px solid ' + P.divider,
        opacity: done ? 0.38 : 1,
        transition: 'all 0.22s',
        cursor: 'pointer',
        animation: 'fadeUp 0.45s ease ' + (0.04 + idx * 0.04) + 's both',
        paddingLeft: hov && !done ? 6 : 0,
      }}
      onClick={() => { if (!done) onSelect(task); }}
    >
      {/* colored left bar */}
      <div style={{ width: 3, height: 54, borderRadius: 2, flexShrink: 0, marginRight: 16, background: done ? P.inkFaint : projectColor, opacity: done ? 0.3 : 1, transition: 'all 0.2s' }} />

      {/* Complete button */}
      <div onClick={(e) => { e.stopPropagation(); onComplete(task.id); }} style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginRight: 14,
        border: '1.5px solid ' + (done ? projectColor : hov ? projectColor : P.inkFaint),
        background: done ? projectColor : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s', cursor: 'pointer',
      }}>
        {done && <span style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>✓</span>}
        {!done && hov && <span style={{ color: projectColor, fontSize: 10, fontWeight: 300 }}>✓</span>}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
          <p style={{ fontSize: 14, fontWeight: done ? 300 : 500, color: done ? P.inkMuted : P.ink, textDecoration: done ? 'line-through' : 'none', letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</p>
          {task.is_pinned && !done && <span style={{ fontSize: 9, color: P.orchid, fontWeight: 600, letterSpacing: 0.4, flexShrink: 0 }}>PINNED</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 300 }}>{task.project?.name || ''}</p>
          {duration && <><span style={{ fontSize: 10, color: P.inkFaint }}>&middot;</span><p style={{ fontSize: 11, color: P.inkFaint, fontWeight: 300 }}>{duration < 60 ? duration + 'm' : (duration / 60) + 'h'}</p></>}
          {subtaskCount > 0 && <><span style={{ fontSize: 10, color: P.inkFaint }}>&middot;</span><p style={{ fontSize: 11, color: P.inkFaint, fontWeight: 300 }}>{subtaskCount} steps</p></>}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, paddingLeft: 10 }}>
        {task.priority === 'urgent' && !done && (
          <div style={{ padding: '3px 9px', borderRadius: 20, background: P.orchidSoft, border: '1px solid ' + P.orchidBorder }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: P.orchid, letterSpacing: 0.5 }}>URGENT</p>
          </div>
        )}
        {task.due_at && <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 300, whiteSpace: 'nowrap' }}>{formatDue(task.due_at)}</p>}
        <span style={{ fontSize: 14, color: P.inkFaint, opacity: hov ? 1 : 0, transition: 'opacity 0.2s' }}>&rsaquo;</span>
      </div>
    </div>
  );
}

/* ═══ BUCKET GROUP ═══ */
function BucketGroup({ bucket, tasks, subtasksMap, onSelect, onComplete, defaultOpen }: {
  bucket: string; tasks: TaskData[]; subtasksMap: Record<string, number>; onSelect: (t: TaskData) => void; onComplete: (id: string) => void; defaultOpen: boolean;
}) {
  var [open, setOpen] = useState(defaultOpen);
  var pending = tasks.filter(t => t.status !== 'done');
  if (pending.length === 0) return null;

  var bucketAccent = bucket === 'today' ? P.orchid : bucket === 'tomorrow' ? P.pink : P.inkMuted;

  return (
    <div style={{ marginBottom: 32 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '0 0 12px',
        borderBottom: open ? 'none' : '1px solid ' + P.divider,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <p style={{ fontFamily: "'Fraunces',serif", fontSize: 13, fontWeight: 300, color: bucketAccent, letterSpacing: 0.4, textTransform: 'uppercase' }}>{BUCKET_LABELS[bucket]}</p>
          <p style={{ fontSize: 11, color: P.inkFaint, fontWeight: 300 }}>{pending.length} remaining</p>
        </div>
        <span style={{ fontSize: 11, color: P.inkFaint, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', display: 'inline-block' }}>{'\u25BE'}</span>
      </button>

      {open && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          {pending.map((t, i) => (
            <TaskRow key={t.id} task={t} subtaskCount={subtasksMap[t.id] || 0} onSelect={onSelect} onComplete={onComplete} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ COMPLETED SECTION ═══ */
function CompletedSection({ tasks, subtasksMap, onSelect, onUncomplete }: {
  tasks: TaskData[]; subtasksMap: Record<string, number>; onSelect: (t: TaskData) => void; onUncomplete: (id: string) => void;
}) {
  var [open, setOpen] = useState(false);
  if (tasks.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '0 0 12px',
        borderBottom: open ? 'none' : '1px solid ' + P.divider,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <p style={{ fontFamily: "'Fraunces',serif", fontSize: 13, fontWeight: 300, color: P.greenDark, letterSpacing: 0.4, textTransform: 'uppercase' }}>Completed</p>
          <p style={{ fontSize: 11, color: P.inkFaint, fontWeight: 300 }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <span style={{ fontSize: 11, color: P.inkFaint, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', display: 'inline-block' }}>{'\u25BE'}</span>
      </button>

      {open && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          {tasks.map((t, i) => (
            <TaskRow key={t.id} task={t} subtaskCount={subtasksMap[t.id] || 0} onSelect={onSelect} onComplete={onUncomplete} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ ORB ═══ */
function Orb({ size }: { size: number }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'radial-gradient(circle at 38% 35%,rgba(234,156,175,0.9) 0%,rgba(213,105,137,0.7) 50%,rgba(194,220,128,0.3) 100%)', boxShadow: '0 0 ' + (size * 0.7) + 'px rgba(213,105,137,0.22)' }} />;
}

/* ═══ VOICE INPUT ═══ */
function VoiceInput({ projects, onTaskCreated }: { projects: ProjectData[]; onTaskCreated: (task: any) => void }) {
  var [mode, setMode] = useState<'idle' | 'listening' | 'thinking' | 'done'>('idle');
  var [text, setText] = useState('');
  var [showForm, setShowForm] = useState(false);
  var [formTitle, setFormTitle] = useState('');
  var [formPriority, setFormPriority] = useState('normal');
  var [formProject, setFormProject] = useState('');
  var [saving, setSaving] = useState(false);
  var timerRef = useRef<any>(null);

  function startVoice() {
    setMode('listening'); setText('');
    var words = ['Add', 'a', 'new', 'task', 'for', 'tomorrow'];
    var i = 0;
    function addWord() {
      if (i < words.length) { setText(words.slice(0, i + 1).join(' ')); i++; timerRef.current = setTimeout(addWord, 130); }
      else { setTimeout(() => { setMode('thinking'); setTimeout(() => { setMode('done'); }, 1600); }, 400); }
    }
    addWord();
  }
  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  async function submitForm() {
    if (!formTitle.trim()) return;
    setSaving(true);
    var body: any = { title: formTitle.trim(), priority: formPriority, status: 'pending' };
    if (formProject) body.project_id = formProject;
    try {
      var res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var data = await res.json();
      if (!data.error) { onTaskCreated(data); setFormTitle(''); setFormPriority('normal'); setFormProject(''); setShowForm(false); }
    } catch (e) {}
    setSaving(false);
  }

  if (showForm) return (
    <div style={{ marginBottom: 36, animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '16px 0', borderBottom: '1px solid ' + P.divider }}>
        <input autoFocus value={formTitle} onChange={e => setFormTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submitForm(); }} placeholder="Task title..." style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 18, fontWeight: 300, color: P.ink, outline: 'none', fontFamily: "'Outfit',sans-serif" }} />
        <button onClick={() => { setShowForm(false); setFormTitle(''); }} style={{ background: 'none', border: 'none', color: P.inkFaint, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        <button onClick={submitForm} disabled={saving} style={{ padding: '7px 16px', borderRadius: 20, background: P.orchid, color: 'white', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>{saving ? '...' : 'Add'}</button>
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 12, flexWrap: 'wrap' }}>
        {(['urgent', 'normal', 'low'] as const).map(p => (
          <button key={p} onClick={() => setFormPriority(p)} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid ' + (formPriority === p ? P.orchidBorder : P.border), background: formPriority === p ? P.orchidSoft : 'transparent', fontSize: 11, color: formPriority === p ? P.orchid : P.inkMuted, cursor: 'pointer', fontWeight: formPriority === p ? 500 : 300, textTransform: 'capitalize' }}>{p}</button>
        ))}
        <div style={{ width: 1, background: P.divider }} />
        {projects.map(pr => (
          <button key={pr.id} onClick={() => setFormProject(formProject === pr.id ? '' : pr.id)} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid ' + (formProject === pr.id ? pr.color + '40' : P.border), background: formProject === pr.id ? pr.color + '15' : 'transparent', fontSize: 11, color: formProject === pr.id ? pr.color : P.inkMuted, cursor: 'pointer', fontWeight: formProject === pr.id ? 400 : 300 }}>{pr.name}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: 36 }}>
      {mode === 'idle' && (
        <div style={{ display: 'flex', gap: 10, padding: '14px 0', borderBottom: '1px solid ' + P.divider }}>
          <button onClick={startVoice} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 20, background: P.orchidSoft, border: '1px solid ' + P.orchidBorder, cursor: 'pointer', color: P.orchid, fontSize: 13, fontWeight: 400 }}>
            <span style={{ fontSize: 14 }}>{'\uD83C\uDFA4'}</span> Speak a task
          </button>
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.6)', border: '1px solid ' + P.border, cursor: 'pointer', color: P.inkSoft, fontSize: 13, fontWeight: 300 }}>
            <span style={{ fontSize: 14 }}>{'\u270F'}</span> Write it out
          </button>
        </div>
      )}
      {mode === 'listening' && (
        <div style={{ padding: '16px 0', borderBottom: '1px solid ' + P.divider }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 2, height: 24, alignItems: 'center' }}>
              {Array.from({ length: 16 }).map((_, i) => <div key={i} style={{ width: 2.5, borderRadius: 2, background: P.orchid, height: (5 + Math.floor(Math.random() * 18)) + 'px', opacity: 0.7, animation: 'waveBar ' + (0.4 + i * 0.05) + 's ease infinite' }} />)}
            </div>
            <p style={{ fontSize: 11, color: P.orchid, fontWeight: 500, letterSpacing: 0.3 }}>Listening...</p>
          </div>
          {text && <p style={{ fontSize: 15, color: P.inkSoft, fontStyle: 'italic', fontWeight: 300 }}>&ldquo;{text}&rdquo;</p>}
        </div>
      )}
      {mode === 'thinking' && (
        <div style={{ padding: '16px 0', borderBottom: '1px solid ' + P.divider, display: 'flex', alignItems: 'center', gap: 8 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: P.orchid, animation: 'pulse 1s ease ' + (i * 0.2) + 's infinite' }} />)}
          <p style={{ fontSize: 13, color: P.inkMuted, fontWeight: 300 }}>Understanding...</p>
        </div>
      )}
      {mode === 'done' && (
        <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.7)', border: '1px solid ' + P.pinkBorder, backdropFilter: 'blur(12px)', marginBottom: 8, animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Orb size={16} /><p style={{ fontSize: 9, fontWeight: 700, color: P.orchid, letterSpacing: 0.7, textTransform: 'uppercase' }}>Pulse understood</p>
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: P.ink, marginBottom: 6 }}>Add a new task for tomorrow</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.5)', border: '1px solid ' + P.border, color: P.inkMuted }}>Tomorrow</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => setMode('idle')} style={{ padding: '7px 18px', borderRadius: 20, background: P.orchid, color: 'white', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Add task {'\u2713'}</button>
            <button onClick={() => setMode('idle')} style={{ padding: '7px 14px', borderRadius: 20, background: 'transparent', border: '1px solid ' + P.border, fontSize: 12, color: P.inkMuted, cursor: 'pointer' }}>Redo</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ TASK DETAIL PANEL ═══ */
function TaskDetailPanel({ task, subtasks, onClose, onUpdate, onDelete }: {
  task: TaskData; subtasks: SubtaskData[]; onClose: () => void; onUpdate: (id: string, data: any) => void; onDelete: (id: string) => void;
}) {
  var [title, setTitle] = useState(task.title);
  var [priority, setPriority] = useState(task.priority);
  var [duration, setDuration] = useState(task.duration_minutes || 0);
  var [completedSubs, setCompletedSubs] = useState<Record<string, boolean>>(() => {
    var m: Record<string, boolean> = {};
    subtasks.forEach(s => { if (s.status === 'done') m[s.id] = true; });
    return m;
  });
  var [saving, setSaving] = useState(false);
  var projectColor = task.project?.color || P.orchid;

  async function save() {
    setSaving(true);
    await onUpdate(task.id, { title, priority, duration_minutes: duration || null });
    setSaving(false);
  }

  async function markDone() {
    await fetch('/api/tasks/' + task.id + '/complete', { method: 'POST' });
    onUpdate(task.id, { status: 'done' });
    onClose();
  }

  async function deleteTask() {
    await fetch('/api/tasks/' + task.id, { method: 'DELETE' });
    onDelete(task.id);
    onClose();
  }

  function toggleSub(id: string) {
    setCompletedSubs(prev => ({ ...prev, [id]: !prev[id] }));
    fetch('/api/tasks/' + id + '/complete', { method: 'POST' }).catch(() => {});
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 38, background: 'rgba(45,32,38,0.08)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 360, zIndex: 39, animation: 'slideR 0.28s cubic-bezier(0.4,0,0.2,1) both' }}>
        <div style={{ height: '100%', background: 'rgba(247,243,240,0.88)', backdropFilter: 'blur(36px)', borderLeft: '1px solid ' + P.border, overflowY: 'auto' }}>
          <div style={{ padding: '24px 26px' }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: P.inkMuted, fontSize: 13, cursor: 'pointer', marginBottom: 24, padding: 0, fontFamily: "'Outfit',sans-serif" }}>{'\u2190'} Back</button>

            {/* Color accent + title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 6 }}>
              <div style={{ width: 4, height: 56, borderRadius: 2, background: projectColor, flexShrink: 0, marginTop: 4 }} />
              <input value={title} onChange={e => setTitle(e.target.value)} onBlur={save} style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 300, color: P.ink, border: 'none', background: 'transparent', outline: 'none', lineHeight: 1.2, flex: 1, letterSpacing: -0.5 }} />
            </div>
            <p style={{ fontSize: 12, color: P.inkMuted, marginBottom: 28, paddingLeft: 18, fontWeight: 300 }}>{task.project?.name || 'No project'} &middot; {formatDue(task.due_at) || 'No due date'}</p>

            {/* Pulse context */}
            <div style={{ padding: '1.5px', borderRadius: 14, background: 'linear-gradient(135deg,rgba(213,105,137,0.3),rgba(194,220,128,0.15))', marginBottom: 24 }}>
              <div style={{ background: 'rgba(247,243,240,0.85)', borderRadius: 13, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><Orb size={14} /><p style={{ fontSize: 9, fontWeight: 700, color: P.orchid, letterSpacing: 0.7, textTransform: 'uppercase' }}>Pulse</p></div>
                <p style={{ fontSize: 12, color: P.inkSoft, lineHeight: 1.6, fontWeight: 300 }}>
                  {task.priority === 'urgent' ? 'This is flagged urgent \u2014 focus on this first. Try to get it done today.' : 'You have time for this. Your schedule looks manageable.'}
                </p>
              </div>
            </div>

            {/* Priority pills */}
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: P.inkMuted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>Priority</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {([['urgent', P.orchid, P.orchidSoft, P.orchidBorder], ['normal', P.pink, P.pinkSoft, P.pinkBorder], ['low', P.inkFaint, 'rgba(212,200,205,0.2)', 'rgba(212,200,205,0.4)']] as const).map(pr => {
                  var active = priority === pr[0];
                  return <button key={pr[0]} onClick={() => { setPriority(pr[0]); }} style={{ padding: '6px 16px', borderRadius: 20, background: active ? pr[2] : 'transparent', border: '1px solid ' + (active ? pr[3] : P.border), color: active ? pr[1] : P.inkMuted, fontSize: 12, fontWeight: active ? 500 : 300, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>{pr[0]}</button>;
                })}
              </div>
            </div>

            {/* Duration */}
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: P.inkMuted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>Estimated time</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[15, 30, 45, 60, 90, 120].map(m => {
                  var active = duration === m;
                  return <button key={m} onClick={() => setDuration(active ? 0 : m)} style={{ padding: '5px 13px', borderRadius: 20, background: active ? P.orchidSoft : 'transparent', border: '1px solid ' + (active ? P.orchidBorder : P.border), color: active ? P.orchid : P.inkMuted, fontSize: 12, fontWeight: active ? 500 : 300, cursor: 'pointer', transition: 'all 0.2s' }}>{m < 60 ? m + 'm' : (m / 60) + 'h'}</button>;
                })}
              </div>
            </div>

            {/* Subtasks */}
            {subtasks.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: P.inkMuted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>Subtasks</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {subtasks.map(s => {
                    var d = !!completedSubs[s.id];
                    return <div key={s.id} onClick={() => toggleSub(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: d ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)', border: '1px solid ' + (d ? P.border : P.divider), cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid ' + (d ? projectColor : P.inkFaint), background: d ? projectColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                        {d && <span style={{ color: 'white', fontSize: 8, fontWeight: 700 }}>{'\u2713'}</span>}
                      </div>
                      <p style={{ fontSize: 13, color: d ? P.inkMuted : P.ink, textDecoration: d ? 'line-through' : 'none', fontWeight: 300 }}>{s.title}</p>
                    </div>;
                  })}
                </div>
              </div>
            )}

            {/* Reschedule */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: P.inkMuted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>Reschedule</p>
              {['Tomorrow same time', 'Next free slot', 'Ask Pulse to find a time'].map((opt, i) => (
                <button key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.4)', border: '1px solid ' + P.divider, cursor: 'pointer', marginBottom: 6, textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.7)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.4)'; }}>
                  <span style={{ fontSize: 13, color: P.inkSoft, fontWeight: 300 }}>{opt}</span>
                  <span style={{ color: P.inkFaint }}>{'\u203A'}</span>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={markDone} style={{ flex: 1, padding: '11px', borderRadius: 14, background: P.green + '22', border: '1px solid ' + P.greenBorder, color: P.greenDark, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Mark done {'\u2713'}</button>
              <button onClick={deleteTask} style={{ padding: '11px 16px', borderRadius: 14, background: 'rgba(213,105,137,0.08)', border: '1px solid ' + P.orchidBorder, color: P.orchid, fontSize: 13, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export default function TasksClient({ initialTasks, initialProjects, initialSubtasks }: {
  initialTasks: TaskData[];
  initialProjects: ProjectData[];
  initialSubtasks: SubtaskData[];
  initialRelationships?: any[];
}) {
  var router = useRouter();
  var [tasks, setTasks] = useState(initialTasks);
  var [filter, setFilter] = useState('all');
  var [sort, setSort] = useState('due');
  var [selectedTask, setSelectedTask] = useState<TaskData | null>(null);

  // Build subtasks count map
  var subtasksMap: Record<string, number> = {};
  initialSubtasks.forEach(s => { subtasksMap[s.parent_task_id] = (subtasksMap[s.parent_task_id] || 0) + 1; });

  // Stats
  var totalDone = tasks.filter(t => t.status === 'done').length;
  var totalPending = tasks.filter(t => t.status !== 'done').length;
  var urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  var totalTasks = tasks.length;

  // Build subtasks by parent map
  var subtasksByParent: Record<string, SubtaskData[]> = {};
  initialSubtasks.forEach(s => {
    if (!subtasksByParent[s.parent_task_id]) subtasksByParent[s.parent_task_id] = [];
    subtasksByParent[s.parent_task_id].push(s);
  });

  // Task created from voice/write form
  var onTaskCreated = useCallback((task: any) => {
    setTasks(prev => [task, ...prev]);
  }, []);

  // Update task
  var onUpdate = useCallback(async (id: string, data: any) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    if (data.status) return; // complete handled separately
    await fetch('/api/tasks/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(() => {});
  }, []);

  // Delete task
  var onDeleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  // Complete task
  var complete = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done', completed_at: t.status === 'done' ? null : new Date().toISOString() } : t));
    fetch('/api/tasks/' + id + '/complete', { method: 'POST' }).catch(() => {});
  }, []);

  // Separate completed tasks (only those completed within last 7 days)
  var sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  var completedTasks = tasks.filter(t => {
    if (t.status !== 'done') return false;
    if (!t.completed_at) return true; // completed but no timestamp — show it
    return new Date(t.completed_at) >= sevenDaysAgo;
  }).sort((a, b) => {
    // Most recently completed first
    var aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
    var bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
    return bTime - aTime;
  });

  // Filter logic (exclude completed tasks from buckets)
  var filtered = tasks.filter(t => {
    if (t.status === 'done') return false;
    if (filter === 'urgent') return t.priority === 'urgent';
    if (filter === 'today') return dueBucket(t.due_at) === 'today';
    if (filter === 'week') return ['today', 'tomorrow', 'week'].includes(dueBucket(t.due_at));
    return true;
  });

  var bucketsToShow = filter === 'all' ? BUCKETS :
    filter === 'today' ? ['today'] :
    filter === 'urgent' ? ['today', 'tomorrow', 'week', 'later'] :
    ['today', 'tomorrow', 'week'];

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", color: P.ink }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes slideR{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes waveBar{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
        button{font-family:'Outfit',sans-serif}
        button:active{transform:scale(0.97)}
        input:focus,textarea:focus{outline:none}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(45,32,38,0.12);border-radius:2px}
      `}</style>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 44px' }}>
        <div style={{ paddingTop: 48 }}>

          {/* ── PAGE HEADER ── */}
          <div style={{ marginBottom: 36, animation: 'fadeUp 0.7s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 11, color: P.inkMuted, letterSpacing: 0.5, fontWeight: 300, marginBottom: 10 }}>Tasks</p>
                <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 46, fontWeight: 200, letterSpacing: -1.5, color: P.ink, lineHeight: 0.95 }}>
                  What needs<br />
                  <em style={{ fontStyle: 'italic', color: P.orchid }}>doing.</em>
                </h1>
              </div>
              {/* Live stats */}
              <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', paddingBottom: 4 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 200, color: P.orchid, lineHeight: 1, letterSpacing: -1 }}>{urgentCount}</p>
                  <p style={{ fontSize: 9, color: P.inkMuted, fontWeight: 300, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>urgent</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 200, color: P.pink, lineHeight: 1, letterSpacing: -1 }}>{totalPending}</p>
                  <p style={{ fontSize: 9, color: P.inkMuted, fontWeight: 300, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>pending</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 200, color: P.green, lineHeight: 1, letterSpacing: -1 }}>{totalDone}</p>
                  <p style={{ fontSize: 9, color: P.inkMuted, fontWeight: 300, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>done</p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: P.divider, borderRadius: 2, overflow: 'hidden', marginTop: 20 }}>
              <div style={{ height: '100%', width: (totalTasks > 0 ? (totalDone / totalTasks) * 100 : 0) + '%', background: 'linear-gradient(90deg,' + P.green + ',' + P.pink + ')', borderRadius: 2, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <p style={{ fontSize: 10, color: P.inkFaint, fontWeight: 300 }}>{totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0}% complete</p>
              <p style={{ fontSize: 10, color: P.inkFaint, fontWeight: 300 }}>{totalTasks} total tasks</p>
            </div>
          </div>

          {/* ── PROJECT FILTER PILLS ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 4, animation: 'fadeUp 0.6s ease 0.06s both' }}>
            <button onClick={() => setFilter('all')} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 16px', borderRadius: 20, flexShrink: 0,
              background: filter === 'all' ? P.orchid + '20' : 'transparent',
              border: '1px solid ' + (filter === 'all' ? P.orchid + '50' : P.border),
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: 12, fontWeight: filter === 'all' ? 500 : 300, color: filter === 'all' ? P.inkSoft : P.inkMuted, whiteSpace: 'nowrap' }}>All tasks</span>
            </button>
            {initialProjects.map(pr => {
              var active = filter === pr.id;
              return (
                <button key={pr.id} onClick={() => setFilter(pr.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 16px', borderRadius: 20, flexShrink: 0,
                  background: active ? pr.color + '20' : 'transparent',
                  border: '1px solid ' + (active ? pr.color + '50' : P.border),
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: 2, background: pr.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: active ? 500 : 300, color: active ? P.inkSoft : P.inkMuted, whiteSpace: 'nowrap' }}>{pr.name}</span>
                </button>
              );
            })}
          </div>

          {/* ── VOICE INPUT ── */}
          <div data-voice-write style={{ animation: 'fadeUp 0.6s ease 0.08s both' }}>
            <VoiceInput projects={initialProjects} onTaskCreated={onTaskCreated} />
          </div>

          {/* ── FILTER + SORT BAR ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, animation: 'fadeUp 0.6s ease 0.10s both' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['all', 'All'], ['urgent', 'Urgent'], ['today', 'Today'], ['week', 'This week']].map(f => {
                var active = filter === f[0];
                return <button key={f[0]} onClick={() => setFilter(f[0])} style={{
                  padding: '6px 14px', borderRadius: 20,
                  background: active ? P.orchidSoft : 'transparent',
                  border: '1px solid ' + (active ? P.orchidBorder : P.border),
                  color: active ? P.orchid : P.inkMuted,
                  fontSize: 12, fontWeight: active ? 500 : 300, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>{f[1]}</button>;
              })}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <p style={{ fontSize: 11, color: P.inkFaint, fontWeight: 300 }}>Sort</p>
              {[['due', 'By date'], ['priority', 'By priority']].map(s => {
                var active = sort === s[0];
                return <button key={s[0]} onClick={() => setSort(s[0])} style={{
                  padding: '5px 12px', borderRadius: 20,
                  background: active ? 'rgba(255,255,255,0.7)' : 'transparent',
                  border: '1px solid ' + (active ? P.border : P.divider),
                  color: active ? P.ink : P.inkMuted,
                  fontSize: 11, fontWeight: active ? 400 : 300, cursor: 'pointer',
                }}>{s[1]}</button>;
              })}
            </div>
          </div>

          {/* ── TASK BUCKETS ── */}
          <div style={{ animation: 'fadeUp 0.6s ease 0.14s both' }}>
            {bucketsToShow.map(bucket => {
              var bucketTasks = filtered.filter(t => {
                // Project filter
                if (filter !== 'all' && filter !== 'urgent' && filter !== 'today' && filter !== 'week') {
                  if (t.project_id !== filter) return false;
                }
                return dueBucket(t.due_at) === bucket;
              });
              // Sort
              if (sort === 'priority') {
                var pRank = (p: string) => ({ urgent: 0, normal: 1, low: 2 }[p] ?? 1);
                bucketTasks.sort((a, b) => pRank(a.priority) - pRank(b.priority));
              } else {
                bucketTasks.sort((a, b) => {
                  if (!a.due_at && !b.due_at) return 0;
                  if (!a.due_at) return 1;
                  if (!b.due_at) return -1;
                  return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
                });
              }
              return <BucketGroup key={bucket} bucket={bucket} tasks={bucketTasks} subtasksMap={subtasksMap} onSelect={setSelectedTask} onComplete={complete} defaultOpen={bucket === 'today' || bucket === 'tomorrow'} />;
            })}
          </div>

          {/* ── COMPLETED SECTION ── */}
          <div style={{ animation: 'fadeUp 0.6s ease 0.18s both' }}>
            <CompletedSection tasks={completedTasks} subtasksMap={subtasksMap} onSelect={setSelectedTask} onUncomplete={complete} />
          </div>

        </div>
      </div>

      {/* Floating add button */}
      {!selectedTask && (
        <button onClick={() => {
          var el = document.querySelector('[data-voice-write]') as HTMLElement;
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }} style={{
          position: 'fixed', bottom: 32, right: 36, zIndex: 25,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 22px', borderRadius: 28,
          background: 'linear-gradient(135deg,' + P.orchid + ',' + P.pink + ')',
          color: 'white', border: 'none', fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 24px rgba(213,105,137,0.38)',
          cursor: 'pointer', animation: 'fadeUp 0.4s ease both',
          fontFamily: "'Outfit',sans-serif",
        }}>
          <span style={{ fontSize: 20, fontWeight: 200, lineHeight: 1 }}>+</span>
          New task
          <span style={{ fontSize: 14, opacity: 0.7, animation: 'glowPulse 3s ease infinite' }}>{'\u2726'}</span>
        </button>
      )}

      {/* Task detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          subtasks={subtasksByParent[selectedTask.id] || []}
          onClose={() => setSelectedTask(null)}
          onUpdate={onUpdate}
          onDelete={onDeleteTask}
        />
      )}
    </div>
  );
}
