'use client'

import { useState, useRef, useEffect } from 'react'
import type { Task, Project, Priority } from '@/lib/tasks/types'
import { PRIORITY_CONFIG } from '@/lib/tasks/types'

interface ParsedPreview {
  title?: string
  due_at?: string | null
  priority?: Priority | null
  duration_minutes?: number | null
  notes?: string | null
}

interface Props {
  projects: Project[]
  allTasks: Task[]
  onAdd: (task: Partial<Task>) => Promise<void>
  onClose: () => void
}

const PROJECT_COLORS = ['#2DB87A', '#3B82F6', '#F97316', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#6B7280']

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

export default function TaskCreateInput({ projects, allTasks, onAdd, onClose }: Props) {
  const [mode, setMode] = useState<'natural' | 'form'>('natural')
  const [nlText, setNlText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [preview, setPreview] = useState<ParsedPreview | null>(null)
  const [parseError, setParseError] = useState('')

  // Form fields (used for preview editing + full form mode)
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [projectId, setProjectId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inline project creation
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState('#2DB87A')
  const [localProjects, setLocalProjects] = useState(projects)

  const [isListening, setIsListening] = useState(false)
  const [supportsVoice, setSupportsVoice] = useState(false)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')

  const nlRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'natural') nlRef.current?.focus()
    else titleRef.current?.focus()
  }, [mode])

  useEffect(() => {
    setSupportsVoice(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition))
  }, [])

  // Sync preview → form fields (only set fields the AI explicitly found)
  useEffect(() => {
    if (preview) {
      setTitle(preview.title ?? '')
      setDueAt(preview.due_at ? toLocalDatetimeInput(preview.due_at) : '')
      if (preview.priority != null) setPriority(preview.priority)
      setDurationMinutes(preview.duration_minutes ?? null)
      setNotes(preview.notes ?? '')
    }
  }, [preview])

  async function parseNL(textInput?: string) {
    const text = textInput ?? nlText
    if (!text.trim()) return
    setIsParsing(true)
    setParseError('')
    try {
      const res = await fetch('/api/tasks/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data)
    } catch {
      setParseError('Could not parse — try the full form instead.')
      setMode('form')
      setTitle(text)
    } finally {
      setIsParsing(false)
    }
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }
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
    recognition.onend = () => {
      setIsListening(false)
      if (transcriptRef.current.trim()) parseNL(transcriptRef.current)
    }
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setNlText('')
  }

  async function handleSubmit() {
    if (!title.trim()) return
    setIsSubmitting(true)
    try {
      await onAdd({
        title: title.trim(),
        due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
        priority,
        project_id: projectId || undefined,
        duration_minutes: durationMinutes ?? undefined,
        description: notes || undefined,
        status: 'pending',
        is_recurring: false,
        is_delegated: false,
        is_pinned: false,
        streak_count: 0,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) return
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim(), color: newProjectColor }),
      })
      const p = await res.json()
      setLocalProjects(prev => [p, ...prev])
      setProjectId(p.id)
      setShowNewProject(false)
      setNewProjectName('')
    } catch {}
  }

  const showForm = mode === 'form' || preview !== null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 80px',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)' }}
      />

      {/* Card */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 580,
        background: '#FFFFFF', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        padding: 24, margin: '0 16px',
        animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes micPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
            50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
          }
        `}</style>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {(['natural', 'form'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              background: mode === m ? '#1A1A1A' : 'rgba(0,0,0,0.06)',
              color: mode === m ? '#FFFFFF' : '#6B6B6B',
              transition: 'all 0.15s',
            }}>
              {m === 'natural' ? '✦ Smart' : '≡ Full form'}
            </button>
          ))}
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            color: '#9CA3AF', fontSize: 20, lineHeight: 1, padding: '2px 6px',
          }}>×</button>
        </div>

        {/* Natural language input */}
        {mode === 'natural' && !preview && (
          <div>
            <textarea
              ref={nlRef}
              value={nlText}
              onChange={e => setNlText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); parseNL() } }}
              placeholder={`e.g. "Call dentist tomorrow afternoon, high priority"`}
              rows={2}
              style={{
                width: '100%', resize: 'none', border: 'none', outline: 'none',
                fontSize: 16, fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A',
                lineHeight: 1.5, background: 'transparent',
              }}
            />
            {parseError && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{parseError}</p>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <p style={{ fontSize: 12, color: isListening ? '#EF4444' : '#9CA3AF', fontFamily: "'DM Sans', sans-serif" }}>
                {isListening ? 'Listening...' : 'Press Enter to parse with AI ↵'}
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {supportsVoice && (
                  <button
                    onClick={toggleListening}
                    title={isListening ? 'Stop recording' : 'Speak your task'}
                    style={{
                      width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isListening ? '#EF4444' : 'rgba(0,0,0,0.06)',
                      color: isListening ? '#FFFFFF' : '#6B6B6B',
                      transition: 'background 0.15s',
                      animation: isListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
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
                <button onClick={() => parseNL()} disabled={isParsing || !nlText.trim()} style={{
                  padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  background: isParsing ? '#E5E7EB' : '#1A1A1A', color: '#FFFFFF',
                  transition: 'all 0.15s',
                }}>
                  {isParsing ? 'Parsing...' : 'Parse'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form (both full form mode + preview editing) */}
        {showForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* AI parsed banner */}
            {preview && (
              <div style={{
                padding: '8px 12px', borderRadius: 10,
                background: 'rgba(45,184,122,0.08)', border: '1px solid rgba(45,184,122,0.2)',
                fontSize: 12, color: '#2DB87A', fontFamily: "'DM Sans', sans-serif",
              }}>
                ✦ AI parsed from: "{nlText}" — edit below to confirm
              </div>
            )}

            {/* Title */}
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title"
              style={{
                border: 'none', borderBottom: '1.5px solid rgba(0,0,0,0.1)', outline: 'none',
                fontSize: 17, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                color: '#1A1A1A', padding: '4px 0', background: 'transparent',
              }}
            />

            {/* Row: due date + priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  DUE
                </label>
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={e => setDueAt(e.target.value)}
                  style={{
                    border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '6px 10px',
                    fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A',
                    background: '#FAFAF9', outline: 'none',
                  }}
                />
                {!dueAt && (() => {
                  const suggestion = smartSuggestDate(allTasks)
                  if (!suggestion) return null
                  return (
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                      💡 You look free {suggestion.label} —{' '}
                      <button
                        onClick={() => {
                          const d = new Date(suggestion.iso)
                          const pad = (n: number) => String(n).padStart(2, '0')
                          setDueAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
                        }}
                        style={{ background: 'none', border: 'none', color: '#2DB87A', fontWeight: 600, fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Set it
                      </button>
                    </p>
                  )
                })()}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  PRIORITY
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['urgent', 'high', 'normal', 'low'] as Priority[]).map(p => {
                    const cfg = PRIORITY_CONFIG[p]
                    return (
                      <button key={p} onClick={() => setPriority(p)} style={{
                        width: 24, height: 24, borderRadius: '50%', border: `2px solid ${priority === p ? cfg.color : 'transparent'}`,
                        background: priority === p ? cfg.color : cfg.bg, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }} title={cfg.label} />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Duration chips */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                ESTIMATED TIME
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[15, 30, 60, 120, 240].map(m => (
                  <button key={m} onClick={() => setDurationMinutes(durationMinutes === m ? null : m)} style={{
                    padding: '4px 12px', borderRadius: 20, border: '1px solid',
                    borderColor: durationMinutes === m ? '#2DB87A' : 'rgba(0,0,0,0.1)',
                    background: durationMinutes === m ? 'rgba(45,184,122,0.09)' : 'transparent',
                    color: durationMinutes === m ? '#2DB87A' : '#6B6B6B',
                    fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {m < 60 ? `${m}m` : `${m / 60}h`}
                  </button>
                ))}
              </div>
            </div>

            {/* Project */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                PROJECT
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => setProjectId('')} style={{
                  padding: '4px 12px', borderRadius: 20, border: '1px solid',
                  borderColor: !projectId ? '#2DB87A' : 'rgba(0,0,0,0.1)',
                  background: !projectId ? 'rgba(45,184,122,0.09)' : 'transparent',
                  color: !projectId ? '#2DB87A' : '#6B6B6B',
                  fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>Inbox</button>
                {localProjects.map(p => (
                  <button key={p.id} onClick={() => setProjectId(p.id)} style={{
                    padding: '4px 12px', borderRadius: 20, border: '1px solid',
                    borderColor: projectId === p.id ? p.color : 'rgba(0,0,0,0.1)',
                    background: projectId === p.id ? `${p.color}15` : 'transparent',
                    color: projectId === p.id ? p.color : '#6B6B6B',
                    fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>{p.name}</button>
                ))}
                <button onClick={() => setShowNewProject(!showNewProject)} style={{
                  padding: '4px 12px', borderRadius: 20, border: '1px dashed rgba(0,0,0,0.2)',
                  background: 'transparent', color: '#9CA3AF', fontSize: 12, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>+ New</button>
              </div>

              {/* Inline new project */}
              {showNewProject && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="Project name"
                    onKeyDown={e => e.key === 'Enter' && createProject()}
                    style={{
                      flex: 1, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8,
                      padding: '5px 10px', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                      outline: 'none', color: '#1A1A1A',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {PROJECT_COLORS.map(c => (
                      <button key={c} onClick={() => setNewProjectColor(c)} style={{
                        width: 18, height: 18, borderRadius: '50%', background: c, border: 'none',
                        cursor: 'pointer', outline: newProjectColor === c ? `2px solid ${c}` : 'none',
                        outlineOffset: 2,
                      }} />
                    ))}
                  </div>
                  <button onClick={createProject} style={{
                    padding: '5px 12px', borderRadius: 8, background: '#1A1A1A', color: '#FFF',
                    border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                  }}>Add</button>
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
                style={{
                  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '8px 12px',
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A',
                  resize: 'none', outline: 'none', background: '#FAFAF9',
                }}
              />
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
              <button onClick={onClose} style={{
                padding: '9px 18px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.1)',
                background: 'transparent', color: '#6B6B6B', fontSize: 13,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!title.trim() || isSubmitting} style={{
                padding: '9px 22px', borderRadius: 14, border: 'none',
                background: title.trim() ? '#1A1A1A' : '#E5E7EB',
                color: title.trim() ? '#FFFFFF' : '#9CA3AF',
                fontSize: 13, fontWeight: 600, cursor: title.trim() ? 'pointer' : 'not-allowed',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {isSubmitting ? 'Adding...' : 'Add task'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function toLocalDatetimeInput(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return '' }
}
