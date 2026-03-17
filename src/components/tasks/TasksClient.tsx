'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Task, Project, Relationship, Priority } from '@/lib/tasks/types'
import { PRIORITY_CONFIG } from '@/lib/tasks/types'
import TaskDetailPanel from './TaskDetailPanel'
import TaskCreateInput from './TaskCreateInput'
import { useBloom } from '@/lib/BloomContext'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function startOfDay(d: Date) { const n = new Date(d); n.setHours(0,0,0,0); return n }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

function dueBucket(due_at?: string): 'today' | 'tomorrow' | 'week' | 'later' | 'someday' {
  if (!due_at) return 'someday'
  const d   = new Date(due_at)
  const now = startOfDay(new Date())
  const tom = addDays(now, 1)
  const wk  = addDays(now, 7)
  if (d < tom)  return 'today'
  if (d < addDays(tom, 1)) return 'tomorrow'
  if (d < wk)  return 'week'
  return 'later'
}

function formatDue(due_at?: string): string {
  if (!due_at) return ''
  const d   = new Date(due_at)
  const now = startOfDay(new Date())
  const diff = Math.round((startOfDay(d).getTime() - now.getTime()) / 86400000)
  if (diff === 0)  return 'Today'
  if (diff === 1)  return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0)    return `${Math.abs(diff)}d overdue`
  if (diff < 7)    return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(due_at?: string): boolean {
  if (!due_at) return false
  return new Date(due_at) < startOfDay(new Date())
}

function priorityRank(p: Priority) { return { urgent: 0, normal: 1, low: 2 }[p] ?? 1 }

type Filter = 'all' | 'today' | 'week' | 'waiting' | 'priority'
type Sort   = 'due_date' | 'priority' | 'created_at'

// ─── TaskCard ──────────────────────────────────────────────────────────────────

interface CardProps {
  task: Task
  allTasks: Task[]
  isFocused?: boolean
  isSelectionMode: boolean
  isSelected: boolean
  onSelect: (t: Task) => void
  onComplete: (id: string) => void
  onPin: (id: string, pinned: boolean) => void
  onToggleSelect: (id: string) => void
}

function TaskCard({ task, allTasks, isFocused, isSelectionMode, isSelected, onSelect, onComplete, onPin, onToggleSelect }: CardProps) {
  const [checking, setChecking] = useState(false)
  const [hovered,  setHovered]  = useState(false)
  const cfg       = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal
  const sub       = allTasks.filter(t => t.parent_task_id === task.id)
  const done      = sub.filter(t => t.status === 'done')
  const isBlocked = !!task.blocked_by_task_id && allTasks.find(t => t.id === task.blocked_by_task_id)?.status === 'pending'
  const isDone    = task.status === 'done'

  async function handleCheck(e: React.MouseEvent) {
    e.stopPropagation()
    if (isDone) return
    setChecking(true)
    await onComplete(task.id)
    setChecking(false)
  }

  const cardBg = isSelected
    ? 'rgba(155,126,200,0.08)'
    : isFocused
    ? 'rgba(155,126,200,0.05)'
    : 'rgba(255,255,255,0.52)'

  const cardBorder = isSelected
    ? 'rgba(155,126,200,0.25)'
    : isFocused
    ? 'rgba(155,126,200,0.18)'
    : hovered
    ? 'rgba(0,0,0,0.08)'
    : 'rgba(0,0,0,0.05)'

  const cardShadow = isFocused
    ? '0 0 24px rgba(155,126,200,0.08), 0 4px 16px rgba(0,0,0,0.03)'
    : hovered
    ? '0 2px 8px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.05)'
    : '0 1px 2px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.03)'

  return (
    <div
      onClick={() => isSelectionMode ? onToggleSelect(task.id) : onSelect(task)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 14px', borderRadius: 16,
        background: cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${cardBorder}`,
        boxShadow: cardShadow,
        cursor: 'pointer', opacity: isBlocked ? 0.55 : 1,
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', marginBottom: 6,
      }}
    >
      {/* Selection circle */}
      <div
        onClick={e => { e.stopPropagation(); onToggleSelect(task.id) }}
        style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
          border: `1.5px solid ${isSelected ? '#9B7EC8' : hovered ? 'rgba(155,126,200,0.4)' : 'rgba(0,0,0,0.15)'}`,
          background: isSelected ? '#9B7EC8' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: isSelected || hovered ? 1 : 0.4,
          transition: 'opacity 0.15s, border-color 0.15s, background 0.15s',
          cursor: 'pointer', flexBasis: 18,
        }}
      >
        {isSelected && <span style={{ color: '#FFF', fontSize: 10, fontWeight: 800 }}>✓</span>}
      </div>

      {/* Completion checkbox */}
      <button
        onClick={handleCheck}
        style={{
          width: 20, height: 20, borderRadius: 7, flexShrink: 0, marginTop: 1,
          border: `1.5px solid ${isDone ? '#9B7EC8' : checking ? '#9B7EC8' : '#C9C1B8'}`,
          background: isDone
            ? 'linear-gradient(135deg, #9B7EC8, #D4849A)'
            : 'transparent',
          boxShadow: isDone ? '0 0 14px rgba(155,126,200,0.15)' : 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: checking ? 'checkBounce 0.3s ease' : 'none',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {isDone && <span style={{ color: '#FFF', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, display: 'inline-block' }} />
          <span style={{
            fontSize: 14, fontWeight: 500, color: isDone ? '#C9C1B8' : '#2D2A26',
            fontFamily: "'Outfit', sans-serif",
            textDecoration: isDone ? 'line-through' : 'none',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {task.title}
          </span>
          {isBlocked && <span title="Blocked" style={{ fontSize: 12 }}>🔒</span>}
          {task.is_delegated && (() => {
            const daysPending = task.delegated_at ? Math.floor((Date.now() - new Date(task.delegated_at).getTime()) / 86400000) : 0
            const needsNudge = daysPending >= 5
            return (
              <span title={needsNudge ? `Waiting ${daysPending} days — consider following up` : undefined} style={{ fontSize: 11, color: needsNudge ? '#D4A47A' : '#D4A47A', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                {needsNudge ? `↩ ${daysPending}d` : 'Waiting'}
              </span>
            )
          })()}
          {task.is_recurring && task.streak_count > 0 && (
            <span style={{ fontSize: 11, color: '#9B7EC8', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>🔥{task.streak_count}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {task.due_at && (
            <span style={{ fontSize: 11, fontWeight: 500, color: isOverdue(task.due_at) ? '#D4727A' : '#9E958B', fontFamily: "'Outfit', sans-serif" }}>
              {isOverdue(task.due_at) ? '⚠ ' : ''}{formatDue(task.due_at)}
            </span>
          )}
          {task.project && (
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: `${task.project.color}18`, color: task.project.color, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
              {task.project.name}
            </span>
          )}
          {sub.length > 0 && (
            <span style={{ fontSize: 11, color: '#9E958B', fontFamily: "'Outfit', sans-serif" }}>{done.length}/{sub.length} subtasks</span>
          )}
          {task.duration_minutes && !task.scheduled_start && (
            <span style={{ fontSize: 11, color: '#9E958B', fontFamily: "'Outfit', sans-serif" }}>
              {task.duration_minutes < 60 ? `${task.duration_minutes}m` : `${task.duration_minutes / 60}h`}
            </span>
          )}
          {task.scheduled_start && (() => {
            const s = new Date(task.scheduled_start)
            const e = task.scheduled_end ? new Date(task.scheduled_end) : null
            const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '').replace(' ', '')
            const day = s.toLocaleDateString('en-US', { weekday: 'short' })
            return (
              <span style={{ fontSize: 11, color: '#5C5650', fontFamily: "'Outfit', sans-serif", background: 'rgba(255,255,255,0.3)', padding: '1px 6px', borderRadius: 6 }}>
                🗓 {day} {fmt(s)}{e ? `–${fmt(e)}` : ''}
              </span>
            )
          })()}
        </div>

        {sub.length > 0 && (
          <div style={{ height: 2, background: 'rgba(0,0,0,0.05)', borderRadius: 2, marginTop: 6 }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #9B7EC8, #D4849A)',
              boxShadow: '0 0 8px rgba(155,126,200,0.15)',
              borderRadius: 2,
              width: `${(done.length / sub.length) * 100}%`,
              transition: 'width 0.4s',
            }} />
          </div>
        )}
      </div>

      {/* Pin — hide in selection mode */}
      {!isSelectionMode && (
        <button
          onClick={e => { e.stopPropagation(); onPin(task.id, !task.is_pinned) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: task.is_pinned ? '#9B7EC8' : '#C9C1B8', fontSize: 14, flexShrink: 0 }}
          title={task.is_pinned ? 'Unpin from Focus' : 'Pin to Focus'}
        >◉</button>
      )}
    </div>
  )
}

// ─── Focus Section ─────────────────────────────────────────────────────────────

function FocusSection({ tasks, allTasks, isSelectionMode, selectedIds, onSelect, onComplete, onPin, onToggleSelect }: {
  tasks: Task[]; allTasks: Task[]
  isSelectionMode: boolean; selectedIds: Set<string>
  onSelect: (t: Task) => void; onComplete: (id: string) => void
  onPin: (id: string, p: boolean) => void; onToggleSelect: (id: string) => void
}) {
  if (tasks.length === 0) return null
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Gradient border wrapper */}
      <div style={{
        padding: 1.5, borderRadius: 22,
        background: 'linear-gradient(135deg, rgba(155,126,200,0.25), rgba(212,132,154,0.1), transparent 70%)',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.42)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 21,
          padding: '20px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#9B7EC8',
              boxShadow: '0 0 10px rgba(155,126,200,0.5)',
              animation: 'glowPulse 2.5s ease infinite',
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9E958B', letterSpacing: 1, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase' }}>Focus</span>
            <span style={{ fontSize: 11, color: '#9E958B', fontFamily: "'Outfit', sans-serif" }}>— your top {tasks.length} for today</span>
          </div>
          {tasks.map(t => (
            <TaskCard key={t.id} task={t} allTasks={allTasks} isFocused
              isSelectionMode={isSelectionMode} isSelected={selectedIds.has(t.id)}
              onSelect={onSelect} onComplete={onComplete} onPin={onPin} onToggleSelect={onToggleSelect} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────

function FilterBar({ filter, sort, onFilter, onSort }: {
  filter: Filter; sort: Sort
  onFilter: (f: Filter) => void; onSort: (s: Sort) => void
}) {
  const filters: { key: Filter; label: string }[] = [
    { key: 'all',      label: 'All'       },
    { key: 'today',    label: 'Today'     },
    { key: 'week',     label: 'This week' },
    { key: 'waiting',  label: 'Waiting'   },
    { key: 'priority', label: 'Urgent'    },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
      {filters.map(f => (
        <button key={f.key} onClick={() => onFilter(f.key)} style={{
          padding: '6px 14px', borderRadius: 20, border: '1px solid',
          borderColor: filter === f.key ? 'rgba(155,126,200,0.25)' : 'rgba(0,0,0,0.04)',
          background: filter === f.key ? 'rgba(155,126,200,0.10)' : 'rgba(255,255,255,0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: filter === f.key ? '#7B5EA8' : '#5C5650',
          boxShadow: filter === f.key ? '0 0 12px rgba(155,126,200,0.15)' : 'none',
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          fontFamily: "'Outfit', sans-serif",
          transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}>{f.label}</button>
      ))}
      <div style={{ flex: 1 }} />
      <select
        value={sort}
        onChange={e => onSort(e.target.value as Sort)}
        style={{
          border: '1px solid rgba(0,0,0,0.05)', borderRadius: 10, padding: '6px 10px',
          fontSize: 12, fontFamily: "'Outfit', sans-serif", color: '#5C5650',
          background: 'rgba(255,255,255,0.3)', outline: 'none', cursor: 'pointer',
        }}
      >
        <option value="due_date">Sort: Due date</option>
        <option value="priority">Sort: Priority</option>
        <option value="created_at">Sort: Recently added</option>
      </select>
    </div>
  )
}

// ─── Task Group ────────────────────────────────────────────────────────────────

function TaskGroup({ label, tasks, allTasks, emptyMsg, isSelectionMode, selectedIds, onSelect, onComplete, onPin, onToggleSelect }: {
  label: string; tasks: Task[]; allTasks: Task[]; emptyMsg?: string
  isSelectionMode: boolean; selectedIds: Set<string>
  onSelect: (t: Task) => void; onComplete: (id: string) => void
  onPin: (id: string, p: boolean) => void; onToggleSelect: (id: string) => void
}) {
  if (tasks.length === 0 && !emptyMsg) return null
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#9E958B', letterSpacing: 0.8, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase' }}>{label}</span>
        {tasks.length > 0 && <span style={{ fontSize: 11, color: '#C9C1B8', fontFamily: "'Outfit', sans-serif" }}>{tasks.length}</span>}
      </div>
      {tasks.length === 0 && emptyMsg ? (
        <div style={{
          background: 'rgba(255,255,255,0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(155,126,200,0.1)',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <p style={{ fontSize: 13, color: '#7B5EA8', fontFamily: "'Outfit', sans-serif", paddingLeft: 4 }}>{emptyMsg}</p>
        </div>
      ) : (
        tasks.map(t => (
          <TaskCard key={t.id} task={t} allTasks={allTasks}
            isSelectionMode={isSelectionMode} isSelected={selectedIds.has(t.id)}
            onSelect={onSelect} onComplete={onComplete} onPin={onPin} onToggleSelect={onToggleSelect} />
        ))
      )}
    </div>
  )
}

// ─── Completed Collapse ────────────────────────────────────────────────────────

function CompletedCollapse({ tasks, allTasks, isSelectionMode, selectedIds, onSelect, onComplete, onPin, onToggleSelect }: {
  tasks: Task[]; allTasks: Task[]
  isSelectionMode: boolean; selectedIds: Set<string>
  onSelect: (t: Task) => void; onComplete: (id: string) => void
  onPin: (id: string, p: boolean) => void; onToggleSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  if (tasks.length === 0) return null
  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#C9C1B8', letterSpacing: 0.8, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase' }}>
          Completed this week ({tasks.length})
        </span>
        <span style={{ color: '#C9C1B8', fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {tasks.map(t => (
            <TaskCard key={t.id} task={t} allTasks={allTasks}
              isSelectionMode={isSelectionMode} isSelected={selectedIds.has(t.id)}
              onSelect={onSelect} onComplete={onComplete} onPin={onPin} onToggleSelect={onToggleSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Client ───────────────────────────────────────────────────────────────

interface Props {
  initialTasks:         Task[]
  initialProjects:      Project[]
  initialRelationships: Relationship[]
}

export default function TasksClient({ initialTasks, initialProjects, initialRelationships }: Props) {
  const [tasks,        setTasks]       = useState<Task[]>(initialTasks)
  const [projects,     setProjects]    = useState<Project[]>(initialProjects)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filter,       setFilter]      = useState<Filter>('all')
  const [sort,         setSort]        = useState<Sort>('due_date')
  const [showCreate,   setShowCreate]  = useState(false)
  const [selectedIds,  setSelectedIds] = useState<Set<string>>(new Set())

  const { triggerBloom } = useBloom()
  const isSelectionMode = selectedIds.size > 0

  // ── Derived ──
  const topLevelTasks = useMemo(() => tasks.filter(t => !t.parent_task_id), [tasks])

  const activeTasks = useMemo(() => {
    let list = topLevelTasks.filter(t => t.status !== 'done')
    if (filter === 'today')    list = list.filter(t => dueBucket(t.due_at) === 'today')
    if (filter === 'week')     list = list.filter(t => ['today','tomorrow','week'].includes(dueBucket(t.due_at)))
    if (filter === 'waiting')  list = list.filter(t => t.is_delegated)
    if (filter === 'priority') list = list.filter(t => t.priority === 'urgent')

    list = [...list].sort((a, b) => {
      if (sort === 'priority') return priorityRank(a.priority) - priorityRank(b.priority)
      if (sort === 'created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (!a.due_at && !b.due_at) return 0
      if (!a.due_at) return 1
      if (!b.due_at) return -1
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    })

    const isBlocked = (t: Task) => !!t.blocked_by_task_id && topLevelTasks.find(u => u.id === t.blocked_by_task_id)?.status === 'pending'
    list = [...list].sort((a, b) => {
      const ab = isBlocked(a), bb = isBlocked(b)
      if (ab && !bb) return 1; if (!ab && bb) return -1; return 0
    })
    return list
  }, [topLevelTasks, filter, sort])

  const completedTasks = useMemo(() =>
    topLevelTasks
      .filter(t => t.status === 'done' && t.completed_at && Date.now() - new Date(t.completed_at).getTime() < 7 * 86400000)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()),
    [topLevelTasks])

  const focusTasks = useMemo(() => {
    const pinned = activeTasks.filter(t => t.is_pinned)
    if (pinned.length >= 3) return pinned.slice(0, 3)
    const todayTasks = activeTasks.filter(t => !t.is_pinned && dueBucket(t.due_at) === 'today')
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    return [...pinned, ...todayTasks].slice(0, 3)
  }, [activeTasks])

  const groups = useMemo(() => {
    if (filter !== 'all') return []
    const nonFocused = activeTasks.filter(t => !focusTasks.includes(t))
    return [
      { label: 'Today',     tasks: nonFocused.filter(t => dueBucket(t.due_at) === 'today'),   emptyMsg: "Nothing due today — nice work!" },
      { label: 'Tomorrow',  tasks: nonFocused.filter(t => dueBucket(t.due_at) === 'tomorrow'), emptyMsg: '' },
      { label: 'This Week', tasks: nonFocused.filter(t => dueBucket(t.due_at) === 'week'),     emptyMsg: '' },
      { label: 'Later',     tasks: nonFocused.filter(t => dueBucket(t.due_at) === 'later'),    emptyMsg: '' },
      { label: 'Someday',   tasks: nonFocused.filter(t => dueBucket(t.due_at) === 'someday'),  emptyMsg: 'Drop ideas here, no pressure.' },
    ]
  }, [activeTasks, focusTasks, filter])

  // ── Handlers ──
  const handleCreate = useCallback(async (body: Partial<Task>): Promise<Task> => {
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const t = await res.json()
    setTasks(prev => [t, ...prev])
    return t
  }, [])

  const handleUpdate = useCallback(async (id: string, updates: Partial<Task>) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t))
    setSelectedTask(prev => prev?.id === id ? { ...prev, ...updated } : prev)
  }, [])

  const handleComplete = useCallback(async (id: string) => {
    const res = await fetch(`/api/tasks/${id}/complete`, { method: 'POST' })
    const { nextTask } = await res.json()
    setTasks(prev => {
      let next = prev.map(t => t.id === id ? { ...t, status: 'done' as const, completed_at: new Date().toISOString() } : t)
      if (nextTask) next = [nextTask, ...next]
      return next
    })
    if (selectedTask?.id === id) setSelectedTask(null)
    triggerBloom()
  }, [selectedTask, triggerBloom])

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id && t.parent_task_id !== id))
    if (selectedTask?.id === id) setSelectedTask(null)
  }, [selectedTask])

  const handlePin = useCallback(async (id: string, pinned: boolean) => {
    await handleUpdate(id, { is_pinned: pinned })
  }, [handleUpdate])

  const handleAddSubtask = useCallback(async (parentId: string, title: string) => {
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, parent_task_id: parentId, status: 'pending', priority: 'normal', is_recurring: false, is_delegated: false, is_pinned: false, streak_count: 0 }),
    })
    const t = await res.json()
    setTasks(prev => [t, ...prev])
  }, [])

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleBulkComplete = useCallback(async () => {
    const ids = [...selectedIds]
    setSelectedIds(new Set())
    await Promise.all(ids.map(id => fetch(`/api/tasks/${id}/complete`, { method: 'POST' })))
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'done' as const, completed_at: new Date().toISOString() } : t))
    if (selectedTask && ids.includes(selectedTask.id)) setSelectedTask(null)
    triggerBloom()
  }, [selectedIds, selectedTask, triggerBloom])

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds]
    setSelectedIds(new Set())
    await Promise.all(ids.map(id => fetch(`/api/tasks/${id}`, { method: 'DELETE' })))
    setTasks(prev => prev.filter(t => !ids.includes(t.id) && !ids.includes(t.parent_task_id ?? '')))
    if (selectedTask && ids.includes(selectedTask.id)) setSelectedTask(null)
  }, [selectedIds, selectedTask])

  const handleSelectAll = useCallback(() => {
    const allVisibleIds = activeTasks.map(t => t.id)
    const allSelected = allVisibleIds.every(id => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allVisibleIds))
    }
  }, [activeTasks, selectedIds])

  const sharedCardProps = { isSelectionMode, selectedIds, onSelect: setSelectedTask, onComplete: handleComplete, onPin: handlePin, onToggleSelect: handleToggleSelect }

  return (
    <div style={{ padding: '48px 40px 120px', fontFamily: "'Outfit', sans-serif", maxWidth: 700 }}>
      <style>{`
        @keyframes checkBounce { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 70% { transform: scale(0.9); } 100% { transform: scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes glowPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.9; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 36, animation: 'fadeUp 0.4s ease' }}>
        <p style={{ fontSize: 12, color: '#9E958B', marginBottom: 6, letterSpacing: 0.5, fontFamily: "'Outfit', sans-serif" }}>Tasks</p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 400, letterSpacing: -0.5, color: '#2D2A26', margin: '0 0 4px' }}>
          What needs doing.
        </h1>
        <p style={{ fontSize: 14, color: '#9E958B', fontFamily: "'Outfit', sans-serif" }}>
          {activeTasks.length === 0 ? 'All clear — inbox zero 🎉' : `${activeTasks.length} task${activeTasks.length !== 1 ? 's' : ''} remaining`}
        </p>
      </div>

      {/* Focus section */}
      <FocusSection tasks={focusTasks} allTasks={tasks} {...sharedCardProps} />

      {/* Filter bar */}
      <FilterBar filter={filter} sort={sort} onFilter={setFilter} onSort={setSort} />

      {/* Task list */}
      {filter === 'all' ? (
        <>
          {groups.map(g => (
            <TaskGroup key={g.label} label={g.label} tasks={g.tasks} allTasks={tasks} emptyMsg={g.emptyMsg} {...sharedCardProps} />
          ))}
          {activeTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 28, marginBottom: 12 }}>◉</p>
              <p style={{ fontSize: 16, fontWeight: 500, color: '#2D2A26', marginBottom: 4 }}>You&apos;re all caught up</p>
              <p style={{ fontSize: 14, color: '#9E958B' }}>Add a task to get started</p>
            </div>
          )}
        </>
      ) : (
        <>
          {activeTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 14, color: '#9E958B' }}>
                {filter === 'today' && 'Nothing due today — nice work!'}
                {filter === 'week' && 'Your week is clear.'}
                {filter === 'waiting' && 'No tasks waiting on others.'}
                {filter === 'priority' && 'No urgent tasks.'}
              </p>
            </div>
          ) : (
            activeTasks.map(t => (
              <TaskCard key={t.id} task={t} allTasks={tasks} {...sharedCardProps} isSelected={selectedIds.has(t.id)} />
            ))
          )}
        </>
      )}

      {/* Completed */}
      <CompletedCollapse tasks={completedTasks} allTasks={tasks} {...sharedCardProps} />

      {/* Floating Add Task button */}
      {!isSelectionMode && !selectedTask && (
        <button
          onClick={() => setShowCreate(true)}
          style={{
            position: 'fixed', bottom: 32, right: 40,
            padding: '12px 22px', borderRadius: 28,
            background: 'linear-gradient(135deg, #9B7EC8, #D4849A)',
            color: '#FFF',
            border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 4px 24px rgba(155,126,200,0.35), 0 0 48px rgba(155,126,200,0.1)',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s',
            animation: 'fadeUp 0.3s ease',
            zIndex: 10,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(155,126,200,0.45), 0 0 48px rgba(155,126,200,0.15)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(155,126,200,0.35), 0 0 48px rgba(155,126,200,0.1)' }}
        >
          <span style={{ fontSize: 18, lineHeight: 1, marginTop: -1 }}>+</span>
          New task
        </button>
      )}

      {/* Bulk action bar */}
      {isSelectionMode && (() => {
        const allSelected = activeTasks.length > 0 && activeTasks.every(t => selectedIds.has(t.id))
        return (
          <div style={{
            position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#2D2A26', borderRadius: 28, padding: '8px 8px 8px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            fontFamily: "'Outfit', sans-serif",
            animation: 'slideUp 0.2s ease',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}>
            <span style={{ fontSize: 13, color: '#9E958B', marginRight: 2 }}>
              {selectedIds.size} selected
            </span>
            <button onClick={handleSelectAll} style={{
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: '#FFFFFF', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            <button onClick={handleBulkComplete} style={{
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(155,126,200,0.18)', border: '1px solid rgba(155,126,200,0.3)',
              color: '#9B7EC8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}>
              ✓ Complete
            </button>
            <button onClick={handleBulkDelete} style={{
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(212,114,122,0.12)', border: '1px solid rgba(212,114,122,0.22)',
              color: '#D4727A', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}>
              Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} style={{
              padding: '6px 10px', borderRadius: 20,
              background: 'rgba(255,255,255,0.08)', border: 'none',
              color: '#9E958B', fontSize: 18, lineHeight: 1, cursor: 'pointer',
            }}>×</button>
          </div>
        )
      })()}

      {/* Create input overlay */}
      {showCreate && (
        <TaskCreateInput
          projects={projects}
          allTasks={tasks}
          relationships={initialRelationships}
          onAdd={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          allTasks={tasks}
          projects={projects}
          relationships={initialRelationships}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onComplete={handleComplete}
          onAddSubtask={handleAddSubtask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
