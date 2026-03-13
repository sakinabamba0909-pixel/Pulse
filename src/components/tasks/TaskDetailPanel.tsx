'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Task, Project, Relationship, Priority, RecurrenceRule } from '@/lib/tasks/types'
import { PRIORITY_CONFIG, DURATION_OPTIONS, RECURRENCE_OPTIONS, REMINDER_PRESETS } from '@/lib/tasks/types'
import ScheduleSection from './ScheduleSection'

interface Props {
  task: Task
  allTasks: Task[]
  projects: Project[]
  relationships: Relationship[]
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onComplete: (id: string) => Promise<void>
  onAddSubtask: (parentId: string, title: string) => Promise<void>
  onClose: () => void
}

function toLocalDatetimeInput(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return '' }
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function parseDurationInput(val: string): number | null {
  const v = val.trim().toLowerCase()
  const t = v.match(/^(\d+):(\d{2})$/)
  if (t) return parseInt(t[1], 10) * 60 + parseInt(t[2], 10)
  const h = v.match(/^(\d+(?:\.\d+)?)\s*h$/)
  if (h) return Math.round(parseFloat(h[1]) * 60)
  const m = v.match(/^(\d+)\s*m?$/)
  if (m) return parseInt(m[1], 10)
  return null
}

function smartSuggestDate(tasks: Task[]): string {
  const now = new Date()
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue // skip weekends
    const dayStr = d.toISOString().split('T')[0]
    const count = tasks.filter(t => t.due_at?.startsWith(dayStr)).length
    if (count < 3) {
      d.setHours(10, 0, 0, 0)
      return d.toLocaleDateString('en-US', { weekday: 'long' })
    }
  }
  return 'next week'
}

export default function TaskDetailPanel({
  task, allTasks, projects, relationships,
  onUpdate, onDelete, onComplete, onAddSubtask, onClose
}: Props) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [dueAt, setDueAt] = useState(toLocalDatetimeInput(task.due_at))
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [projectId, setProjectId] = useState(task.project_id ?? '')
  const [durationMinutes, setDurationMinutes] = useState<number | null>(task.duration_minutes ?? null)
  const [relationshipId, setRelationshipId] = useState(task.relationship_id ?? '')
  const [isDelegated, setIsDelegated] = useState(task.is_delegated)
  const [delegatedTo, setDelegatedTo] = useState(task.delegated_to ?? '')
  const [isRecurring, setIsRecurring] = useState(task.is_recurring)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceRule['type']>(
    (task.recurrence_rule as RecurrenceRule)?.type ?? 'weekly'
  )
  const [scheduledStart, setScheduledStart] = useState(toLocalDatetimeInput(task.scheduled_start))
  const [scheduledEnd, setScheduledEnd]     = useState(toLocalDatetimeInput(task.scheduled_end))
  const [blockedByTaskId, setBlockedByTaskId] = useState(task.blocked_by_task_id ?? '')
  const [reminders, setReminders] = useState<number[]>(
    task.reminders?.map(r => r.offset_minutes) ?? []
  )
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleClose = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose])

  async function save(updates: Partial<Task>) {
    setIsSaving(true)
    try { await onUpdate(task.id, updates) } finally { setIsSaving(false) }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const reminderObjs = reminders.map(m => {
        const preset = REMINDER_PRESETS.find(p => p.offset_minutes === m)
        return { offset_minutes: m, label: preset?.label ?? `${Math.abs(m)} min before` }
      })
      await onUpdate(task.id, {
        title: title.trim() || task.title,
        description: description || undefined,
        due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
        priority,
        project_id: projectId || undefined,
        duration_minutes: durationMinutes ?? undefined,
        relationship_id: relationshipId || undefined,
        is_delegated: isDelegated,
        delegated_to: isDelegated ? delegatedTo : undefined,
        delegated_at: isDelegated && !task.delegated_at ? new Date().toISOString() : task.delegated_at,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? ({ type: recurrenceType } as RecurrenceRule) : undefined,
        blocked_by_task_id: blockedByTaskId || undefined,
        reminders: reminderObjs.length ? reminderObjs : undefined,
        scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : undefined,
        scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : undefined,
      })

      // Sync reminder records: clear old ones, create new ones
      if (reminders.length > 0) {
        const baseDate = dueAt ? new Date(dueAt) : scheduledStart ? new Date(scheduledStart) : null
        if (baseDate) {
          await fetch(`/api/reminders?task_id=${task.id}`, { method: 'DELETE' })
          await Promise.all(reminders.map(offsetMinutes => {
            const remindAt = new Date(baseDate.getTime() + offsetMinutes * 60000)
            if (remindAt <= new Date()) return Promise.resolve()
            return fetch('/api/reminders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                task_id: task.id,
                remind_at: remindAt.toISOString(),
                channel: 'push',
                message: title.trim() || task.title,
                status: 'pending',
              }),
            })
          }))
        }
      } else {
        // If reminders were cleared, delete any existing records
        await fetch(`/api/reminders?task_id=${task.id}`, { method: 'DELETE' })
      }

      setIsDirty(false)
      setSavedFeedback(true)
      setTimeout(() => setSavedFeedback(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAddSubtask() {
    if (!newSubtaskTitle.trim()) return
    await onAddSubtask(task.id, newSubtaskTitle.trim())
    setNewSubtaskTitle('')
  }

  const subtasks = allTasks.filter(t => t.parent_task_id === task.id)
  const completedSubtasks = subtasks.filter(t => t.status === 'done')
  const subtaskProgress = subtasks.length > 0 ? completedSubtasks.length / subtasks.length : 0

  const otherTasks = allTasks.filter(t => t.id !== task.id && t.status === 'pending' && !t.parent_task_id)
  const smartDate = !task.due_at ? smartSuggestDate(allTasks) : null

  const s = { fontFamily: "'DM Sans', sans-serif" }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)',
          transition: 'opacity 0.25s',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
        width: 440, background: '#FFFFFF',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column',
        transform: mounted ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
            fontSize: 20, lineHeight: 1, padding: '2px 6px', borderRadius: 6,
          }}>←</button>
          <div style={{ flex: 1 }} />
          {task.status !== 'done' && (
            <button onClick={() => onComplete(task.id)} style={{
              padding: '6px 16px', borderRadius: 20,
              background: 'rgba(45,184,122,0.09)', border: '1px solid rgba(45,184,122,0.22)',
              color: '#2DB87A', fontSize: 13, fontWeight: 600, cursor: 'pointer', ...s,
            }}>
              Mark complete ✓
            </button>
          )}
          {task.status === 'done' && (
            <span style={{ fontSize: 13, color: '#2DB87A', fontWeight: 600 }}>✓ Done</span>
          )}
        </div>

        <div style={{ flex: 1, padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setIsDirty(true) }}
            style={{
              border: 'none', borderBottom: '1.5px solid rgba(0,0,0,0.08)', outline: 'none',
              fontSize: 20, fontWeight: 600, background: 'transparent',
              padding: '4px 0', ...s,
              textDecoration: task.status === 'done' ? 'line-through' : 'none',
              color: task.status === 'done' ? '#9CA3AF' : '#1A1A1A',
            }}
          />

          {/* Description */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
              NOTES
            </label>
            <textarea
              value={description}
              onChange={e => { setDescription(e.target.value); setIsDirty(true) }}
              placeholder="Add notes, links, or context…"
              rows={3}
              style={{
                width: '100%', resize: 'none', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 10, padding: '10px 12px', fontSize: 13, ...s,
                color: '#1A1A1A', background: '#FAFAF9', outline: 'none', lineHeight: 1.6,
              }}
            />
          </div>

          {/* Due date */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
              DUE DATE & TIME
            </label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={e => { setDueAt(e.target.value); setIsDirty(true) }}
              style={{
                border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '8px 12px',
                fontSize: 13, ...s, color: '#1A1A1A', background: '#FAFAF9', outline: 'none',
              }}
            />
            {smartDate && (
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6, ...s }}>
                💡 You look free {smartDate} — how about then?
                <button onClick={() => {
                  const d = new Date()
                  for (let i = 1; i <= 7; i++) {
                    const dd = new Date(d)
                    dd.setDate(dd.getDate() + i)
                    if (dd.getDay() !== 0 && dd.getDay() !== 6) {
                      dd.setHours(10, 0, 0, 0)
                      setDueAt(toLocalDatetimeInput(dd.toISOString()))
                      break
                    }
                  }
                }} style={{
                  marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer',
                  color: '#2DB87A', fontSize: 12, fontWeight: 600, ...s,
                }}>Set it</button>
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              PRIORITY
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['urgent', 'normal', 'low'] as Priority[]).map(p => {
                const cfg = PRIORITY_CONFIG[p]
                return (
                  <button key={p} onClick={() => { setPriority(p); save({ priority: p }) }} style={{
                    padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${priority === p ? cfg.color : 'rgba(0,0,0,0.1)'}`,
                    background: priority === p ? cfg.bg : 'transparent',
                    color: priority === p ? cfg.color : '#6B6B6B',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', ...s, transition: 'all 0.15s',
                  }}>
                    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: cfg.color, marginRight: 5, verticalAlign: 'middle' }} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              ESTIMATED TIME
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {DURATION_OPTIONS.map(o => (
                <button key={o.minutes} onClick={() => {
                  const newMins = durationMinutes === o.minutes ? null : o.minutes
                  setDurationMinutes(newMins)
                  const updates: Partial<Task> = { duration_minutes: newMins ?? undefined }
                  if (newMins) {
                    const base = scheduledStart
                      ? new Date(scheduledStart)
                      : new Date(Math.ceil(Date.now() / (15 * 60000)) * (15 * 60000))
                    const endDate = new Date(base.getTime() + newMins * 60000)
                    const start = toLocalDatetimeInput(base.toISOString())
                    const end   = toLocalDatetimeInput(endDate.toISOString())
                    setScheduledStart(start)
                    setScheduledEnd(end)
                    updates.scheduled_start = base.toISOString()
                    updates.scheduled_end   = endDate.toISOString()
                  }
                  save(updates)
                }} style={{
                  padding: '5px 12px', borderRadius: 20, border: '1px solid',
                  borderColor: durationMinutes === o.minutes ? '#2DB87A' : 'rgba(0,0,0,0.1)',
                  background: durationMinutes === o.minutes ? 'rgba(45,184,122,0.09)' : 'transparent',
                  color: durationMinutes === o.minutes ? '#2DB87A' : '#6B6B6B',
                  fontSize: 12, cursor: 'pointer', ...s,
                }}>{o.label}</button>
              ))}
              <input
                type="text"
                placeholder="custom"
                defaultValue={durationMinutes && !DURATION_OPTIONS.find(o => o.minutes === durationMinutes) ? `${durationMinutes}m` : ''}
                onBlur={e => {
                  const mins = parseDurationInput(e.target.value)
                  if (mins) { setDurationMinutes(mins); save({ duration_minutes: mins }) }
                  else if (!e.target.value.trim()) { setDurationMinutes(null); save({ duration_minutes: undefined }) }
                }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                style={{
                  width: 72, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 20,
                  padding: '5px 10px', fontSize: 12, ...s, color: '#6B6B6B',
                  background: '#FAFAF9', outline: 'none', textAlign: 'center',
                }}
              />
            </div>
          </div>

          {/* Schedule it */}
          <ScheduleSection
            durationMinutes={durationMinutes}
            dueAt={dueAt}
            scheduledStart={scheduledStart}
            scheduledEnd={scheduledEnd}
            onSchedule={(start, end) => {
              setScheduledStart(toLocalDatetimeInput(start))
              setScheduledEnd(toLocalDatetimeInput(end))
              save({ scheduled_start: start, scheduled_end: end })
            }}
            onClear={() => {
              setScheduledStart(''); setScheduledEnd('')
              save({ scheduled_start: undefined, scheduled_end: undefined })
            }}
            onChange={(start, end) => { setScheduledStart(start); setScheduledEnd(end) }}
          />

          {/* Project */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
              PROJECT
            </label>
            <select
              value={projectId}
              onChange={e => { setProjectId(e.target.value); save({ project_id: e.target.value || undefined }) }}
              style={{
                border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '8px 12px',
                fontSize: 13, ...s, color: '#1A1A1A', background: '#FAFAF9', outline: 'none',
                width: '100%',
              }}
            >
              <option value="">Inbox (no project)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Person / commitment */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
              WHO IS THIS FOR?
            </label>
            <select
              value={relationshipId}
              onChange={e => { setRelationshipId(e.target.value); save({ relationship_id: e.target.value || undefined }) }}
              style={{
                border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '8px 12px',
                fontSize: 13, ...s, color: '#1A1A1A', background: '#FAFAF9', outline: 'none',
                width: '100%',
              }}
            >
              <option value="">Just me</option>
              {relationships.map(r => <option key={r.id} value={r.id}>{r.person_name}</option>)}
            </select>
          </div>

          {/* Subtasks */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8 }}>
                SUBTASKS {subtasks.length > 0 && `(${completedSubtasks.length}/${subtasks.length})`}
              </label>
            </div>

            {subtasks.length > 0 && (
              <>
                <div style={{ height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 3, marginBottom: 10 }}>
                  <div style={{ height: '100%', background: '#2DB87A', borderRadius: 3, width: `${subtaskProgress * 100}%`, transition: 'width 0.4s' }} />
                </div>
                {subtasks.map(st => (
                  <div key={st.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <button onClick={() => st.status === 'done' ? onUpdate(st.id, { status: 'pending' }) : onComplete(st.id)} style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: `1.5px solid ${st.status === 'done' ? '#2DB87A' : 'rgba(0,0,0,0.2)'}`,
                      background: st.status === 'done' ? '#2DB87A' : 'transparent',
                      cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {st.status === 'done' && <span style={{ color: '#FFF', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </button>
                    <span style={{ fontSize: 13, color: '#1A1A1A', textDecoration: st.status === 'done' ? 'line-through' : 'none', ...s }}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add subtask…"
                style={{
                  flex: 1, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '6px 10px',
                  fontSize: 13, ...s, color: '#1A1A1A', outline: 'none', background: '#FAFAF9',
                }}
              />
              <button onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()} style={{
                padding: '6px 12px', borderRadius: 8, background: '#1A1A1A', color: '#FFF',
                border: 'none', cursor: 'pointer', fontSize: 12, ...s,
              }}>Add</button>
            </div>
          </div>

          {/* Delegation */}
          <div style={{ padding: '14px 16px', borderRadius: 14, background: isDelegated ? 'rgba(249,115,22,0.06)' : 'rgba(0,0,0,0.03)', border: `1px solid ${isDelegated ? 'rgba(249,115,22,0.2)' : 'rgba(0,0,0,0.07)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', ...s }}>Waiting on someone?</p>
                {isDelegated && task.delegated_at && (
                  <p style={{ fontSize: 11, color: daysSince(task.delegated_at) >= 5 ? '#D97706' : '#9CA3AF', ...s, marginTop: 2 }}>
                    {daysSince(task.delegated_at) >= 5
                      ? `${daysSince(task.delegated_at)} days — consider following up`
                      : `Assigned ${daysSince(task.delegated_at)}d ago`}
                  </p>
                )}
              </div>
              <button onClick={() => { setIsDelegated(!isDelegated); save({ is_delegated: !isDelegated }) }} style={{
                width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                background: isDelegated ? '#F97316' : 'rgba(0,0,0,0.15)',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', top: 3, left: isDelegated ? 21 : 3, width: 16, height: 16,
                  borderRadius: '50%', background: '#FFF', transition: 'left 0.2s',
                }} />
              </button>
            </div>
            {isDelegated && (
              <>
                <input
                  value={delegatedTo}
                  onChange={e => { setDelegatedTo(e.target.value); setIsDirty(true) }}
                  placeholder="Who are you waiting on?"
                  style={{
                    marginTop: 10, width: '100%', border: '1px solid rgba(249,115,22,0.3)',
                    borderRadius: 8, padding: '6px 10px', fontSize: 13, ...s,
                    color: '#1A1A1A', outline: 'none', background: '#FAFAF9',
                  }}
                />
                {task.delegated_at && daysSince(task.delegated_at) >= 5 && (
                  <button
                    onClick={() => {
                      const name = delegatedTo || 'them'
                      navigator.clipboard.writeText(`Hey ${name}, just checking in on "${task.title}" — any update?`)
                    }}
                    style={{
                      marginTop: 8, padding: '5px 12px', borderRadius: 8, fontSize: 12, ...s,
                      background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)',
                      color: '#D97706', cursor: 'pointer', fontWeight: 500,
                    }}
                  >
                    Copy follow-up message
                  </button>
                )}
              </>
            )}
          </div>

          {/* Recurring */}
          <div style={{ padding: '14px 16px', borderRadius: 14, background: isRecurring ? 'rgba(45,184,122,0.06)' : 'rgba(0,0,0,0.03)', border: `1px solid ${isRecurring ? 'rgba(45,184,122,0.2)' : 'rgba(0,0,0,0.07)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', ...s }}>Recurring task</p>
              <button onClick={() => { setIsRecurring(!isRecurring); save({ is_recurring: !isRecurring }) }} style={{
                width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                background: isRecurring ? '#2DB87A' : 'rgba(0,0,0,0.15)',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', top: 3, left: isRecurring ? 21 : 3, width: 16, height: 16,
                  borderRadius: '50%', background: '#FFF', transition: 'left 0.2s',
                }} />
              </button>
            </div>
            {isRecurring && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {RECURRENCE_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => { setRecurrenceType(o.value as RecurrenceRule['type']); save({ recurrence_rule: { type: o.value as RecurrenceRule['type'] } }) }} style={{
                    padding: '4px 12px', borderRadius: 20, border: '1px solid',
                    borderColor: recurrenceType === o.value ? '#2DB87A' : 'rgba(0,0,0,0.1)',
                    background: recurrenceType === o.value ? 'rgba(45,184,122,0.09)' : 'transparent',
                    color: recurrenceType === o.value ? '#2DB87A' : '#6B6B6B',
                    fontSize: 12, cursor: 'pointer', ...s,
                  }}>{o.label}</button>
                ))}
              </div>
            )}
            {task.streak_count > 0 && (
              <p style={{ fontSize: 12, color: '#2DB87A', marginTop: 8, fontWeight: 600, ...s }}>
                🔥 {task.streak_count}-day streak
              </p>
            )}
          </div>

          {/* Blocked by */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
              BLOCKED BY
            </label>
            <select
              value={blockedByTaskId}
              onChange={e => { setBlockedByTaskId(e.target.value); save({ blocked_by_task_id: e.target.value || undefined }) }}
              style={{
                border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '8px 12px',
                fontSize: 13, ...s, color: '#1A1A1A', background: '#FAFAF9', outline: 'none', width: '100%',
              }}
            >
              <option value="">Not blocked</option>
              {otherTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          {/* Reminders */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              REMINDERS
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {REMINDER_PRESETS.map(r => {
                const on = reminders.includes(r.offset_minutes)
                return (
                  <button key={r.offset_minutes} onClick={() => {
                    const next = on ? reminders.filter(m => m !== r.offset_minutes) : [...reminders, r.offset_minutes]
                    setReminders(next)
                    setIsDirty(true)
                  }} style={{
                    padding: '5px 12px', borderRadius: 20, border: '1px solid',
                    borderColor: on ? '#3B82F6' : 'rgba(0,0,0,0.1)',
                    background: on ? 'rgba(59,130,246,0.08)' : 'transparent',
                    color: on ? '#3B82F6' : '#6B6B6B',
                    fontSize: 12, cursor: 'pointer', ...s,
                  }}>{r.label}</button>
                )
              })}
            </div>
          </div>

          {/* Activity log */}
          <div style={{ paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              ACTIVITY
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 12, color: '#9CA3AF', ...s }}>
                Created {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              {task.completed_at && (
                <p style={{ fontSize: 12, color: '#2DB87A', ...s }}>
                  ✓ Completed {new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          {/* Save button */}
          <div style={{ paddingTop: 8 }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 14,
                background: isSaving ? 'rgba(45,184,122,0.4)' : savedFeedback ? 'rgba(45,184,122,0.15)' : '#1A1A1A',
                color: savedFeedback ? '#2DB87A' : '#FFF',
                border: savedFeedback ? '1px solid rgba(45,184,122,0.3)' : 'none',
                fontSize: 14, fontWeight: 600, cursor: isSaving ? 'default' : 'pointer',
                transition: 'all 0.2s', ...s,
              }}
            >
              {isSaving ? 'Saving…' : savedFeedback ? '✓ Saved' : isDirty ? 'Save changes' : 'Save'}
            </button>
          </div>

          {/* Delete */}
          <div style={{ paddingTop: 4 }}>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9CA3AF', fontSize: 13, ...s,
              }}>Delete task</button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#1A1A1A', ...s }}>Delete this task?</span>
                <button onClick={() => onDelete(task.id)} style={{
                  padding: '5px 14px', borderRadius: 10, background: '#EF4444',
                  color: '#FFF', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, ...s,
                }}>Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} style={{
                  padding: '5px 14px', borderRadius: 10, background: 'transparent',
                  color: '#6B6B6B', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: 12, ...s,
                }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
