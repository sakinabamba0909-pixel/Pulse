'use client'

import { useState, useRef, useEffect } from 'react'
import type { Task, Project, Relationship, Priority } from '@/lib/tasks/types'
import { PRIORITY_CONFIG } from '@/lib/tasks/types'
import ScheduleSection from './ScheduleSection'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedTask {
  title: string
  due_at: string | null
  priority: Priority | null
  duration_minutes: number | null
  project_id: string | null
  relationship_id: string | null
  is_commitment: boolean
  suggestions: Array<{ type: 'reminder' | 'link_contact' | 'block_time'; text: string }>
}

interface ActiveSuggestion {
  taskId: string
  type: 'reminder' | 'link_contact' | 'block_time'
  text: string
  relationship_id?: string
  due_at?: string
  duration_minutes?: number
}

interface Props {
  projects:      Project[]
  allTasks:      Task[]
  relationships: Relationship[]
  onAdd:         (task: Partial<Task>) => Promise<Task>
  onClose:       () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_COLORS = ['#8B7EC8', '#7AABC8', '#C8A088', '#8B7EC8', '#EC4899', '#14B8A6', '#F59E0B', '#6B7280']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDatetimeInput(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return '' }
}

function formatDueShort(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const diff = Math.round((new Date(d.toDateString()).getTime() - new Date(now.toDateString()).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function smartSuggestDate(tasks: Task[]): { label: string; iso: string } | null {
  const now = new Date()
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const dayStr = d.toISOString().split('T')[0]
    const count = tasks.filter(t => t.due_at?.startsWith(dayStr) && t.status !== 'done').length
    if (count < 3) {
      d.setHours(10, 0, 0, 0)
      return { label: d.toLocaleDateString('en-US', { weekday: 'long' }), iso: d.toISOString() }
    }
  }
  return null
}

// ─── ParsedTaskCard ───────────────────────────────────────────────────────────

function ParsedTaskCard({ task, projects, relationships, checked, onToggle, onDismiss, onEdit, onEditDetails }: {
  task:          ParsedTask
  projects:      Project[]
  relationships: Relationship[]
  checked:       boolean
  onToggle:       () => void
  onDismiss:      () => void
  onEdit:         (u: Partial<ParsedTask>) => void
  onEditDetails?: () => void
}) {
  const [expanded,  setExpanded]  = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)

  const project  = projects.find(p => p.id === task.project_id)
  const person   = relationships.find(r => r.id === task.relationship_id)
  const dotColor = task.priority
    ? ({ urgent: '#C87882', normal: '#7AABC8', low: '#8890A0' } as Record<string,string>)[task.priority]
    : '#8890A0'

  return (
    <div style={{
      border: `1px solid ${checked ? 'rgba(139,126,200,0.25)' : 'rgba(255,255,255,0.30)'}`,
      borderRadius: 14, padding: '11px 14px', marginBottom: 8,
      background: checked ? 'rgba(139,126,200,0.04)' : 'rgba(255,255,255,0.45)',
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Checkbox */}
        <button onClick={onToggle} style={{
          width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
          border: `1.5px solid ${checked ? '#8B7EC8' : 'rgba(139,126,200,0.25)'}`,
          background: checked ? '#8B7EC8' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {checked && <span style={{ color: '#FFF', fontSize: 9, fontWeight: 800, lineHeight: 1 }}>✓</span>}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {expanded ? (
            <input
              value={editTitle}
              onChange={e => { setEditTitle(e.target.value); onEdit({ title: e.target.value }) }}
              onBlur={() => setExpanded(false)}
              autoFocus
              style={{
                width: '100%', border: 'none', borderBottom: '1.5px solid #8B7EC8',
                outline: 'none', fontSize: 14, fontWeight: 500,
                fontFamily: "'Outfit', sans-serif", color: '#2A2D35',
                background: 'transparent', marginBottom: 6, padding: '1px 0',
              }}
            />
          ) : (
            <p
              onClick={() => setExpanded(true)}
              title="Click to edit"
              style={{
                fontSize: 14, fontWeight: 500, color: '#2A2D35',
                fontFamily: "'Outfit', sans-serif", cursor: 'text',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                marginBottom: 5,
              }}
            >{editTitle}</p>
          )}

          {/* Meta pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {task.priority && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
            )}
            {task.due_at && (
              <span style={{ fontSize: 11, color: '#4A4E5A', fontFamily: "'Outfit', sans-serif", background: 'rgba(255,255,255,0.25)', padding: '1px 7px', borderRadius: 6 }}>
                {formatDueShort(task.due_at)}
              </span>
            )}
            {task.duration_minutes && (
              <span style={{ fontSize: 11, color: '#8890A0', fontFamily: "'Outfit', sans-serif" }}>
                {task.duration_minutes < 60 ? `${task.duration_minutes}m` : `${task.duration_minutes / 60}h`}
              </span>
            )}
            {project && (
              <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: `${project.color}18`, color: project.color, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                {project.name}
              </span>
            )}
            {person && (
              <span style={{ fontSize: 11, color: '#8B7EC8', fontFamily: "'Outfit', sans-serif" }}>
                @{person.person_name.split(' ')[0]}
              </span>
            )}
            {task.is_commitment && (
              <span style={{ fontSize: 10, color: '#C8A088', fontWeight: 700, fontFamily: "'Outfit', sans-serif", letterSpacing: 0.3 }}>COMMITMENT</span>
            )}
            {!task.due_at && !task.priority && !project && (
              <span style={{ fontSize: 11, color: '#B0B6C4', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic' }}>no details detected</span>
            )}
            {onEditDetails && (
              <button onClick={onEditDetails} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#8890A0', fontFamily: "'Outfit', sans-serif", padding: 0, marginLeft: 'auto' }}>
                Edit details →
              </button>
            )}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0B6C4', fontSize: 16, flexShrink: 0, padding: '0 2px', lineHeight: 1 }}
        >×</button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TaskCreateInput({ projects, allTasks, relationships, onAdd, onClose }: Props) {
  // Mode + input
  const [mode,       setMode]       = useState<'natural' | 'form'>('natural')
  const [nlText,     setNlText]     = useState('')
  const [isParsing,  setIsParsing]  = useState(false)
  const [parseError, setParseError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Voice
  const [isListening,   setIsListening]   = useState(false)
  const [supportsVoice, setSupportsVoice] = useState(false)
  const recognitionRef = useRef<any>(null)
  const transcriptRef  = useRef('')

  // Multi-task preview
  const [parsedTasks,    setParsedTasks]    = useState<ParsedTask[]>([])
  const [showPreview,    setShowPreview]    = useState(false)
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set())

  // Post-creation suggestion pills
  const [activeSuggestions, setActiveSuggestions] = useState<ActiveSuggestion[]>([])

  // Form fields
  const [title,           setTitle]           = useState('')
  const [dueAt,           setDueAt]           = useState('')
  const [priority,        setPriority]        = useState<Priority>('normal')
  const [projectId,       setProjectId]       = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [notes,           setNotes]           = useState('')
  const [scheduledStart,  setScheduledStart]  = useState('')
  const [scheduledEnd,    setScheduledEnd]    = useState('')

  // Inline project creation
  const [showNewProject,  setShowNewProject]  = useState(false)
  const [newProjectName,  setNewProjectName]  = useState('')
  const [newProjectColor, setNewProjectColor] = useState('#8B7EC8')
  const [localProjects,   setLocalProjects]   = useState(projects)

  const nlRef    = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'natural' && !showPreview) nlRef.current?.focus()
    else if (mode === 'form') titleRef.current?.focus()
  }, [mode, showPreview])

  useEffect(() => {
    setSupportsVoice(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition))
  }, [])

  // ── Parse ──
  async function parseNL(textInput?: string) {
    const text = textInput ?? nlText
    if (!text.trim()) return
    setIsParsing(true)
    setParseError('')
    try {
      const res = await fetch('/api/tasks/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          timezone:               Intl.DateTimeFormat().resolvedOptions().timeZone,
          current_datetime:       new Date().toISOString(),
          existing_projects:      localProjects.map(p => ({ id: p.id, name: p.name, category: p.category })),
          existing_relationships: relationships.map(r => ({ id: r.id, person_name: r.person_name })),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.tasks?.length) throw new Error(data.error || 'No tasks parsed')

      // Speak reply
      if (data.speech_reply && 'speechSynthesis' in window) {
        const utt = new SpeechSynthesisUtterance(data.speech_reply)
        utt.rate = 1.05
        window.speechSynthesis.speak(utt)
      }

      // Always show preview cards — user sees exactly what AI understood before confirming
      setParsedTasks(data.tasks)
      setCheckedIndices(new Set(data.tasks.map((_: ParsedTask, i: number) => i)))
      setShowPreview(true)
    } catch {
      setParseError('Could not parse — try the full form instead.')
      setMode('form')
      setTitle(textInput ?? nlText)
    } finally {
      setIsParsing(false)
    }
  }

  // ── Voice ──
  function toggleListening() {
    if (isListening) { recognitionRef.current?.stop(); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    transcriptRef.current = ''

    recognition.onresult = (e: any) => {
      const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('')
      transcriptRef.current = t
      setNlText(t)
    }
    recognition.onend  = () => { setIsListening(false); if (transcriptRef.current.trim()) parseNL(transcriptRef.current) }
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setNlText('')
  }

  // ── Single task submit (form mode) ──
  async function handleSubmit() {
    if (!title.trim()) return
    setIsSubmitting(true)
    try {
      const dueAtIso = dueAt ? new Date(dueAt).toISOString() : undefined
      const created = await onAdd({
        title:            title.trim(),
        due_at:           dueAtIso,
        priority,
        project_id:       projectId || undefined,
        duration_minutes: durationMinutes ?? undefined,
        description:      notes || undefined,
        scheduled_start:  scheduledStart ? new Date(scheduledStart).toISOString() : undefined,
        scheduled_end:    scheduledEnd   ? new Date(scheduledEnd).toISOString()   : undefined,
        status:           'pending',
        is_recurring:     false,
        is_delegated:     false,
        is_pinned:        false,
        streak_count:     0,
      })

      if (created?.id) {
        // Always offer a reminder when there's a due date
        const suggestions: ActiveSuggestion[] = []
        if (dueAtIso) {
          suggestions.push({ taskId: created.id, type: 'reminder', text: 'Set a morning reminder?', due_at: dueAtIso, duration_minutes: durationMinutes ?? undefined })
        }
        // Also carry over any AI suggestions from smart mode (but skip reminder if already added)
        const singleParsed = parsedTasks[0]
        if (singleParsed?.suggestions?.length) {
          for (const s of singleParsed.suggestions) {
            if (s.type === 'reminder' && dueAtIso) continue // already added above
            suggestions.push({
              taskId:           created.id,
              type:             s.type,
              text:             s.text,
              relationship_id:  singleParsed.relationship_id ?? undefined,
              due_at:           singleParsed.due_at ?? undefined,
              duration_minutes: singleParsed.duration_minutes ?? undefined,
            })
          }
        }
        if (suggestions.length > 0) {
          setActiveSuggestions(suggestions)
          setShowPreview(false)
          setMode('natural')
          setTitle(''); setNlText(''); setDueAt(''); setParsedTasks([])
        } else {
          onClose()
        }
      } else {
        onClose()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Multi-task confirm ──
  async function handleConfirmAll() {
    if (checkedIndices.size === 0) return
    setIsSubmitting(true)
    const toCreate = parsedTasks.filter((_, i) => checkedIndices.has(i))
    const created: { taskId: string; parsed: ParsedTask }[] = []
    try {
      for (const t of toCreate) {
        const task = await onAdd({
          title:            t.title,
          due_at:           t.due_at ?? undefined,
          priority:         t.priority ?? 'normal',
          project_id:       t.project_id ?? undefined,
          relationship_id:  t.relationship_id ?? undefined,
          duration_minutes: t.duration_minutes ?? undefined,
          status:           'pending',
          is_recurring:     false,
          is_delegated:     false,
          is_pinned:        false,
          streak_count:     0,
        })
        if (task?.id) created.push({ taskId: task.id, parsed: t })
      }

      const allSuggestions: ActiveSuggestion[] = created.flatMap(({ taskId, parsed }) => {
        const hasDue = !!parsed.due_at
        const aiHasReminder = parsed.suggestions?.some(s => s.type === 'reminder')
        const extra: ActiveSuggestion[] = (!aiHasReminder && hasDue)
          ? [{ taskId, type: 'reminder', text: 'Set a morning reminder?', due_at: parsed.due_at ?? undefined, duration_minutes: parsed.duration_minutes ?? undefined }]
          : []
        const aiSugs: ActiveSuggestion[] = (parsed.suggestions ?? []).map(s => ({
          taskId,
          type:            s.type,
          text:            s.text,
          relationship_id: parsed.relationship_id ?? undefined,
          due_at:          parsed.due_at ?? undefined,
          duration_minutes: parsed.duration_minutes ?? undefined,
        }))
        return [...extra, ...aiSugs]
      }).slice(0, 3)

      if (allSuggestions.length > 0) {
        setActiveSuggestions(allSuggestions)
        setShowPreview(false)
        setNlText('')
        setParsedTasks([])
      } else {
        onClose()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Accept suggestion ──
  async function acceptSuggestion(s: ActiveSuggestion) {
    const taskUpdates: Record<string, any> = {}

    if (s.type === 'reminder') {
      // Compute remind_at: morning (09:00) of due date, or tomorrow morning if no due_at
      const base = s.due_at ? new Date(s.due_at) : (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d })()
      base.setHours(9, 0, 0, 0)
      const remindAt = base.toISOString()

      // Persist to reminders table so it shows in the Reminders tab
      await fetch('/api/reminders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id:   s.taskId,
          remind_at: remindAt,
          channel:   'push',
          message:   s.text,
          status:    'pending',
        }),
      })

      // Also mark on the task itself
      taskUpdates.reminders = [{ offset_minutes: -480, label: 'Morning of' }]
    } else if (s.type === 'link_contact' && s.relationship_id) {
      taskUpdates.relationship_id = s.relationship_id
    } else if (s.type === 'block_time' && s.due_at && s.duration_minutes) {
      const start = new Date(s.due_at)
      start.setHours(9, 0, 0, 0)
      const end = new Date(start.getTime() + s.duration_minutes * 60000)
      taskUpdates.scheduled_start = start.toISOString()
      taskUpdates.scheduled_end   = end.toISOString()
    }

    if (Object.keys(taskUpdates).length > 0) {
      await fetch(`/api/tasks/${s.taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskUpdates),
      })
    }
    const remaining = activeSuggestions.filter(x => x !== s)
    setActiveSuggestions(remaining)
    if (remaining.length === 0) onClose()
  }

  function dismissSuggestion(s: ActiveSuggestion) {
    const remaining = activeSuggestions.filter(x => x !== s)
    setActiveSuggestions(remaining)
    if (remaining.length === 0) onClose()
  }

  // ── Inline project creation ──
  async function createProject() {
    if (!newProjectName.trim()) return
    try {
      const res = await fetch('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim(), color: newProjectColor }),
      })
      const p = await res.json()
      setLocalProjects(prev => [p, ...prev])
      setProjectId(p.id)
      setShowNewProject(false)
      setNewProjectName('')
    } catch {}
  }

  const showForm    = mode === 'form' && !showPreview
  const checkedCount = checkedIndices.size

  // ── Render ──
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 80px' }}>
      <style>{`
        @keyframes slideUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes micPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(200,120,130,0.4)} 50%{box-shadow:0 0 0 7px rgba(200,120,130,0)} }
        @keyframes waveBar1  { 0%,100%{height:4px}  50%{height:20px} }
        @keyframes waveBar2  { 0%,100%{height:8px}  25%{height:26px} 75%{height:6px} }
        @keyframes waveBar3  { 0%,100%{height:14px} 50%{height:6px} }
        @keyframes waveBar4  { 0%,100%{height:6px}  30%{height:22px} 80%{height:10px} }
        @keyframes waveBar5  { 0%,100%{height:10px} 60%{height:18px} }
        @keyframes orbPulse  { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)' }} />

      {/* Card */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 580,
        background: '#FFFFFF', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        padding: 24, margin: '0 16px', maxHeight: '80vh', overflowY: 'auto',
        animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* ══ SUGGESTIONS MODE (post-creation) ══ */}
        {activeSuggestions.length > 0 && (
          <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8890A0', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14, fontFamily: "'Outfit', sans-serif" }}>
              ✦ One-tap actions
            </p>
            {activeSuggestions.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                padding: '10px 14px', borderRadius: 12,
                background: 'rgba(139,126,200,0.06)', border: '1px solid rgba(139,126,200,0.18)',
                animation: `fadeInUp 0.25s ease ${i * 0.07}s both`,
              }}>
                <span style={{ flex: 1, fontSize: 13, color: '#2A2D35', fontFamily: "'Outfit', sans-serif" }}>{s.text}</span>
                <button onClick={() => acceptSuggestion(s)} style={{
                  padding: '4px 14px', borderRadius: 8, background: '#2A2D35', color: '#FFF',
                  border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                }}>Yes</button>
                <button onClick={() => dismissSuggestion(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0B6C4', fontSize: 18, padding: '0 2px', lineHeight: 1 }}>×</button>
              </div>
            ))}
            <button onClick={onClose} style={{
              width: '100%', marginTop: 6, padding: '9px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.30)', background: 'transparent',
              color: '#8890A0', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
            }}>Skip all</button>
          </div>
        )}

        {/* ══ MAIN INPUT AREA ══ */}
        {activeSuggestions.length === 0 && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {!showPreview && (['natural', 'form'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setShowPreview(false) }} style={{
                  padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                  background: mode === m ? '#2A2D35' : 'rgba(255,255,255,0.20)',
                  color: mode === m ? '#FFFFFF' : '#4A4E5A', transition: 'all 0.15s',
                }}>
                  {m === 'natural' ? '✦ Smart' : '≡ Full form'}
                </button>
              ))}
              {showPreview && (
                <button onClick={() => { setShowPreview(false); setMode('natural') }} style={{
                  padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                  background: 'rgba(255,255,255,0.20)', color: '#4A4E5A',
                }}>← Back</button>
              )}
              <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#8890A0', fontSize: 20, lineHeight: 1, padding: '2px 6px' }}>×</button>
            </div>

            {/* ── Preview cards (single or multi) ── */}
            {showPreview && (
              <div style={{ animation: 'fadeInUp 0.25s ease' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#8890A0', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, fontFamily: "'Outfit', sans-serif" }}>
                  {parsedTasks.length === 1 ? '✦ Got it — looks right?' : `✦ ${parsedTasks.length} tasks — uncheck any to skip`}
                </p>
                {parsedTasks.map((task, i) => (
                  <ParsedTaskCard
                    key={i}
                    task={task}
                    projects={localProjects}
                    relationships={relationships}
                    checked={checkedIndices.has(i)}
                    onToggle={() => setCheckedIndices(prev => {
                      const next = new Set(prev)
                      if (next.has(i)) next.delete(i); else next.add(i)
                      return next
                    })}
                    onDismiss={() => {
                      setParsedTasks(prev => prev.filter((_, idx) => idx !== i))
                      setCheckedIndices(prev => new Set([...prev].filter(idx => idx !== i).map(idx => idx > i ? idx - 1 : idx)))
                    }}
                    onEdit={updates => setParsedTasks(prev => prev.map((t, idx) => idx === i ? { ...t, ...updates } : t))}
                    onEditDetails={() => {
                      // Pre-fill form with this task's data
                      const t = parsedTasks[i]
                      setTitle(t.title ?? '')
                      setDueAt(t.due_at ? toLocalDatetimeInput(t.due_at) : '')
                      if (t.priority) setPriority(t.priority)
                      setDurationMinutes(t.duration_minutes ?? null)
                      setProjectId(t.project_id ?? '')
                      setShowPreview(false)
                      setMode('form')
                    }}
                  />
                ))}
                <button
                  onClick={handleConfirmAll}
                  disabled={checkedCount === 0 || isSubmitting}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 14, border: 'none', marginTop: 4,
                    background: checkedCount > 0 && !isSubmitting ? '#2A2D35' : '#E5E7EB',
                    color: checkedCount > 0 && !isSubmitting ? '#FFFFFF' : '#8890A0',
                    fontSize: 14, fontWeight: 600, cursor: checkedCount > 0 ? 'pointer' : 'not-allowed',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {isSubmitting ? 'Adding...' : checkedCount === 1 ? 'Add task' : `Add ${checkedCount} tasks`}
                </button>
              </div>
            )}

            {/* ── Natural language ── */}
            {mode === 'natural' && !showPreview && (
              <div>
                {/* Listening: waveform */}
                {isListening && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, marginBottom: 10 }}>
                      {(['waveBar1 0.9s', 'waveBar2 1.1s', 'waveBar3 0.8s', 'waveBar4 1.2s', 'waveBar5 1.0s']).map((anim, i) => (
                        <div key={i} style={{ width: 4, borderRadius: 2, background: '#C87882', animation: `${anim} ease-in-out infinite` }} />
                      ))}
                    </div>
                    {nlText && (
                      <p style={{ fontSize: 13, color: '#4A4E5A', fontFamily: "'Outfit', sans-serif", textAlign: 'center', fontStyle: 'italic', maxWidth: 320 }}>
                        &ldquo;{nlText}&rdquo;
                      </p>
                    )}
                    <p style={{ fontSize: 12, color: '#C87882', fontFamily: "'Outfit', sans-serif", marginTop: 6 }}>Listening...</p>
                    <button onClick={toggleListening} style={{
                      marginTop: 10, padding: '5px 16px', borderRadius: 20, border: '1px solid rgba(200,120,130,0.3)',
                      background: 'transparent', color: '#C87882', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    }}>Stop</button>
                  </div>
                )}

                {/* Parsing: orb animation */}
                {isParsing && !isListening && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 0 10px' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,126,200,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: 'orbPulse 1.2s ease-in-out infinite', marginBottom: 12,
                    }}>
                      <span style={{ fontSize: 16 }}>✦</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#8890A0', fontFamily: "'Outfit', sans-serif" }}>Understanding...</p>
                  </div>
                )}

                {/* Input */}
                {!isListening && !isParsing && (
                  <>
                    <textarea
                      ref={nlRef}
                      value={nlText}
                      onChange={e => setNlText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); parseNL() } }}
                      placeholder={`"Call dentist tomorrow, and grab groceries Friday afternoon"`}
                      rows={2}
                      style={{
                        width: '100%', resize: 'none', border: 'none', outline: 'none',
                        fontSize: 16, fontFamily: "'Outfit', sans-serif", color: '#2A2D35',
                        lineHeight: 1.6, background: 'transparent',
                      }}
                    />
                    {parseError && <p style={{ fontSize: 12, color: '#C87882', marginTop: 4, fontFamily: "'Outfit', sans-serif" }}>{parseError}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                      <p style={{ fontSize: 12, color: '#B0B6C4', fontFamily: "'Outfit', sans-serif" }}>
                        Enter ↵ &nbsp;·&nbsp; or speak
                      </p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {supportsVoice && (
                          <button
                            onClick={toggleListening}
                            title="Speak your task"
                            style={{
                              width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(255,255,255,0.20)', color: '#4A4E5A', transition: 'background 0.15s',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                              <line x1="12" y1="19" x2="12" y2="23"/>
                              <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => parseNL()}
                          disabled={!nlText.trim()}
                          style={{
                            padding: '8px 20px', borderRadius: 20, border: 'none', cursor: nlText.trim() ? 'pointer' : 'not-allowed',
                            fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                            background: nlText.trim() ? 'linear-gradient(135deg, #8B7EC8, #C8889E)' : '#E5E7EB',
                            color: nlText.trim() ? '#FFFFFF' : '#8890A0',
                            boxShadow: nlText.trim() ? '0 4px 16px rgba(139,126,200,0.3)' : 'none',
                            transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                          }}
                        >Parse</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Full form ── */}
            {showForm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {parsedTasks.length > 0 && (
                  <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(139,126,200,0.10)', border: '1px solid rgba(139,126,200,0.2)', fontSize: 12, color: '#8B7EC8', fontFamily: "'Outfit', sans-serif" }}>
                    ✦ AI parsed — edit below to confirm
                  </div>
                )}

                <input
                  ref={titleRef}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Task title"
                  style={{
                    border: 'none', borderBottom: '1.5px solid rgba(139,126,200,0.15)', outline: 'none',
                    fontSize: 17, fontWeight: 500, fontFamily: "'Outfit', sans-serif",
                    color: '#2A2D35', padding: '4px 0', background: 'transparent',
                  }}
                />

                {/* Due + Priority */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'flex-start' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#8890A0', letterSpacing: 0.5, display: 'block', marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>DUE</label>
                    <input
                      type="datetime-local"
                      value={dueAt}
                      onChange={e => setDueAt(e.target.value)}
                      style={{ border: '1px solid rgba(139,126,200,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontFamily: "'Outfit', sans-serif", color: '#2A2D35', background: 'rgba(255,255,255,0.45)', outline: 'none' }}
                    />
                    {!dueAt && (() => {
                      const suggestion = smartSuggestDate(allTasks)
                      if (!suggestion) return null
                      return (
                        <p style={{ fontSize: 11, color: '#8890A0', marginTop: 5, fontFamily: "'Outfit', sans-serif" }}>
                          💡 You look free {suggestion.label} —{' '}
                          <button
                            onClick={() => {
                              const d = new Date(suggestion.iso)
                              const pad = (n: number) => String(n).padStart(2, '0')
                              setDueAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
                            }}
                            style={{ background: 'none', border: 'none', color: '#8B7EC8', fontWeight: 600, fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: "'Outfit', sans-serif" }}
                          >Set it</button>
                        </p>
                      )
                    })()}
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#8890A0', letterSpacing: 0.5, display: 'block', marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>PRIORITY</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['urgent', 'normal', 'low'] as Priority[]).map(p => {
                        const cfg = PRIORITY_CONFIG[p]
                        return (
                          <button key={p} onClick={() => setPriority(p)} style={{
                            width: 24, height: 24, borderRadius: '50%',
                            border: `2px solid ${priority === p ? cfg.color : 'transparent'}`,
                            background: priority === p ? cfg.color : cfg.bg,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }} title={cfg.label} />
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#8890A0', letterSpacing: 0.5, display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>ESTIMATED TIME</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[15, 30, 60, 120, 240].map(m => (
                      <button key={m} onClick={() => setDurationMinutes(durationMinutes === m ? null : m)} style={{
                        padding: '4px 12px', borderRadius: 20, border: '1px solid',
                        borderColor: durationMinutes === m ? '#8B7EC8' : 'rgba(139,126,200,0.15)',
                        background: durationMinutes === m ? 'rgba(139,126,200,0.10)' : 'transparent',
                        color: durationMinutes === m ? '#8B7EC8' : '#4A4E5A',
                        fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                      }}>
                        {m < 60 ? `${m}m` : `${m / 60}h`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <ScheduleSection
                  durationMinutes={durationMinutes}
                  dueAt={dueAt}
                  scheduledStart={scheduledStart}
                  scheduledEnd={scheduledEnd}
                  onSchedule={(start, end) => {
                    const pad = (n: number) => String(n).padStart(2, '0')
                    const toLocal = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }
                    setScheduledStart(toLocal(start)); setScheduledEnd(toLocal(end))
                  }}
                  onClear={() => { setScheduledStart(''); setScheduledEnd('') }}
                  onChange={(start, end) => { setScheduledStart(start); setScheduledEnd(end) }}
                />

                {/* Project */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#8890A0', letterSpacing: 0.5, display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>PROJECT</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => setProjectId('')} style={{
                      padding: '4px 12px', borderRadius: 20, border: '1px solid',
                      borderColor: !projectId ? '#8B7EC8' : 'rgba(139,126,200,0.15)',
                      background: !projectId ? 'rgba(139,126,200,0.10)' : 'transparent',
                      color: !projectId ? '#8B7EC8' : '#4A4E5A',
                      fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    }}>Inbox</button>
                    {localProjects.map(p => (
                      <button key={p.id} onClick={() => setProjectId(p.id)} style={{
                        padding: '4px 12px', borderRadius: 20, border: '1px solid',
                        borderColor: projectId === p.id ? p.color : 'rgba(139,126,200,0.15)',
                        background: projectId === p.id ? `${p.color}15` : 'transparent',
                        color: projectId === p.id ? p.color : '#4A4E5A',
                        fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                      }}>{p.name}</button>
                    ))}
                    <button onClick={() => setShowNewProject(!showNewProject)} style={{
                      padding: '4px 12px', borderRadius: 20, border: '1px dashed rgba(139,126,200,0.25)',
                      background: 'transparent', color: '#8890A0', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    }}>+ New</button>
                  </div>

                  {showNewProject && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        placeholder="Project name"
                        onKeyDown={e => e.key === 'Enter' && createProject()}
                        style={{ flex: 1, border: '1px solid rgba(139,126,200,0.15)', borderRadius: 8, padding: '5px 10px', fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: 'none', color: '#2A2D35' }}
                      />
                      <div style={{ display: 'flex', gap: 4 }}>
                        {PROJECT_COLORS.map(c => (
                          <button key={c} onClick={() => setNewProjectColor(c)} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: newProjectColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
                        ))}
                      </div>
                      <button onClick={createProject} style={{ padding: '5px 12px', borderRadius: 8, background: '#2A2D35', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>Add</button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {(notes || mode === 'form') && (
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    rows={2}
                    style={{ border: '1px solid rgba(255,255,255,0.30)', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: "'Outfit', sans-serif", color: '#2A2D35', resize: 'none', outline: 'none', background: 'rgba(255,255,255,0.45)' }}
                  />
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                  <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 14, border: '1px solid rgba(139,126,200,0.15)', background: 'transparent', color: '#4A4E5A', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>Cancel</button>
                  <button
                    onClick={handleSubmit}
                    disabled={!title.trim() || isSubmitting}
                    style={{
                      padding: '9px 22px', borderRadius: 14, border: 'none',
                      background: title.trim() && !isSubmitting ? '#2A2D35' : '#E5E7EB',
                      color: title.trim() && !isSubmitting ? '#FFFFFF' : '#8890A0',
                      fontSize: 13, fontWeight: 600, cursor: title.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {isSubmitting ? 'Adding...' : 'Add task'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
