'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Task, Project, Relationship, Priority } from '@/lib/tasks/types'
import { PRIORITY_CONFIG } from '@/lib/tasks/types'
import TaskDetailPanel from './TaskDetailPanel'
import TaskCreateInput from './TaskCreateInput'

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

function priorityRank(p: Priority) { return { urgent: 0, high: 1, normal: 2, low: 3 }[p] }

type Filter = 'all' | 'today' | 'week' | 'waiting' | 'priority'
type Sort   = 'due_date' | 'priority' | 'created_at'

// ─── TaskCard ──────────────────────────────────────────────────────────────────

interface CardProps {
  task: Task
  allTasks: Task[]
  isFocused?: boolean
  onSelect: (t: Task) => void
  onComplete: (id: string) => void
  onPin: (id: string, pinned: boolean) => void
}

function TaskCard({ task, allTasks, isFocused, onSelect, onComplete, onPin }: CardProps) {
  const [checking, setChecking] = useState(false)
  const cfg   = PRIORITY_CONFIG[task.priority]
  const sub   = allTasks.filter(t => t.parent_task_id === task.id)
  const done  = sub.filter(t => t.status === 'done')
  const isBlocked = !!task.blocked_by_task_id && allTasks.find(t => t.id === task.blocked_by_task_id)?.status === 'pending'
  const isDone = task.status === 'done'

  async function handleCheck(e: React.MouseEvent) {
    e.stopPropagation()
    if (isDone) return
    setChecking(true)
    await onComplete(task.id)
    setChecking(false)
  }

  return (
    <div
      onClick={() => onSelect(task)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 14px', borderRadius: 16,
        background: isFocused ? 'rgba(45,184,122,0.04)' : '#FFFFFF',
        border: `1px solid ${isFocused ? 'rgba(45,184,122,0.18)' : 'rgba(0,0,0,0.07)'}`,
        cursor: 'pointer', opacity: isBlocked ? 0.55 : 1,
        transition: 'all 0.15s', marginBottom: 6,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheck}
        style={{
          width: 20, height: 20, borderRadius: 7, flexShrink: 0, marginTop: 1,
          border: `1.5px solid ${isDone ? '#2DB87A' : checking ? '#2DB87A' : 'rgba(0,0,0,0.18)'}`,
          background: isDone ? '#2DB87A' : 'transparent',
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
          {/* Priority dot */}
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, display: 'inline-block' }} />

          {/* Title */}
          <span style={{
            fontSize: 14, fontWeight: 500, color: isDone ? '#9CA3AF' : '#1A1A1A',
            fontFamily: "'DM Sans', sans-serif",
            textDecoration: isDone ? 'line-through' : 'none',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {task.title}
          </span>

          {/* Badges */}
          {isBlocked && <span title="Blocked" style={{ fontSize: 12 }}>🔒</span>}
          {task.is_delegated && (() => {
            const daysPending = task.delegated_at ? Math.floor((Date.now() - new Date(task.delegated_at).getTime()) / 86400000) : 0
            const needsNudge = daysPending >= 5
            return (
              <span title={needsNudge ? `Waiting ${daysPending} days — consider following up` : undefined} style={{ fontSize: 11, color: needsNudge ? '#D97706' : '#F97316', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                {needsNudge ? `↩ ${daysPending}d` : 'Waiting'}
              </span>
            )
          })()}
          {task.is_recurring && task.streak_count > 0 && (
            <span style={{ fontSize: 11, color: '#2DB87A', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>🔥{task.streak_count}</span>
          )}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {task.due_at && (
            <span style={{
              fontSize: 11, fontWeight: 500,
              color: isOverdue(task.due_at) ? '#EF4444' : '#9CA3AF',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {isOverdue(task.due_at) ? '⚠ ' : ''}{formatDue(task.due_at)}
            </span>
          )}
          {task.project && (
            <span style={{
              padding: '2px 8px', borderRadius: 20, fontSize: 11,
              background: `${task.project.color}18`,
              color: task.project.color, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>{task.project.name}</span>
          )}
          {sub.length > 0 && (
            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: "'DM Sans', sans-serif" }}>
              {done.length}/{sub.length} subtasks
            </span>
          )}
          {task.duration_minutes && !task.scheduled_start && (
            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: "'DM Sans', sans-serif" }}>
              {task.duration_minutes < 60 ? `${task.duration_minutes}m` : `${task.duration_minutes / 60}h`}
            </span>
          )}
          {task.scheduled_start && (() => {
            const s = new Date(task.scheduled_start)
            const e = task.scheduled_end ? new Date(task.scheduled_end) : null
            const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '').replace(' ', '')
            const day = s.toLocaleDateString('en-US', { weekday: 'short' })
            return (
              <span style={{ fontSize: 11, color: '#6B6B6B', fontFamily: "'DM Sans', sans-serif", background: 'rgba(0,0,0,0.04)', padding: '1px 6px', borderRadius: 6 }}>
                🗓 {day} {fmt(s)}{e ? `–${fmt(e)}` : ''}
              </span>
            )
          })()}
        </div>

        {/* Subtask progress bar */}
        {sub.length > 0 && (
          <div style={{ height: 2, background: 'rgba(0,0,0,0.06)', borderRadius: 2, marginTop: 6 }}>
            <div style={{ height: '100%', background: '#2DB87A', borderRadius: 2, width: `${(done.length / sub.length) * 100}%`, transition: 'width 0.4s' }} />
          </div>
        )}
      </div>

      {/* Pin */}
      <button
        onClick={e => { e.stopPropagation(); onPin(task.id, !task.is_pinned) }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
          color: task.is_pinned ? '#2DB87A' : '#D1D5DB', fontSize: 14, flexShrink: 0,
        }}
        title={task.is_pinned ? 'Unpin from Focus' : 'Pin to Focus'}
      >◉</button>
    </div>
  )
}

// ─── Focus Section ─────────────────────────────────────────────────────────────

function FocusSection({ tasks, allTasks, onSelect, onComplete, onPin }: {
  tasks: Task[]; allTasks: Task[];
  onSelect: (t: Task) => void; onComplete: (id: string) => void; onPin: (id: string, p: boolean) => void
}) {
  if (tasks.length === 0) return null
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase' }}>Focus</span>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: "'DM Sans', sans-serif" }}>— your top {tasks.length} for today</span>
      </div>
      {tasks.map(t => <TaskCard key={t.id} task={t} allTasks={allTasks} isFocused onSelect={onSelect} onComplete={onComplete} onPin={onPin} />)}
    </div>
  )
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────

function FilterBar({ filter, sort, onFilter, onSort, onAdd, projects }: {
  filter: Filter; sort: Sort; projects: Project[];
  onFilter: (f: Filter) => void; onSort: (s: Sort) => void; onAdd: () => void
}) {
  const s = { fontFamily: "'DM Sans', sans-serif" }
  const filters: { key: Filter; label: string }[] = [
    { key: 'all',      label: 'All'          },
    { key: 'today',    label: 'Today'        },
    { key: 'week',     label: 'This week'    },
    { key: 'waiting',  label: 'Waiting'      },
    { key: 'priority', label: 'Urgent + high'},
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
      {filters.map(f => (
        <button key={f.key} onClick={() => onFilter(f.key)} style={{
          padding: '6px 14px', borderRadius: 20, border: '1px solid',
          borderColor: filter === f.key ? '#1A1A1A' : 'rgba(0,0,0,0.1)',
          background: filter === f.key ? '#1A1A1A' : 'transparent',
          color: filter === f.key ? '#FFFFFF' : '#6B6B6B',
          fontSize: 12, fontWeight: 500, cursor: 'pointer', ...s, transition: 'all 0.15s',
        }}>{f.label}</button>
      ))}
      <div style={{ flex: 1 }} />
      <select
        value={sort}
        onChange={e => onSort(e.target.value as Sort)}
        style={{
          border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '6px 10px',
          fontSize: 12, ...s, color: '#6B6B6B', background: 'transparent', outline: 'none', cursor: 'pointer',
        }}
      >
        <option value="due_date">Sort: Due date</option>
        <option value="priority">Sort: Priority</option>
        <option value="created_at">Sort: Recently added</option>
      </select>
      <button onClick={onAdd} style={{
        padding: '7px 18px', borderRadius: 20, background: '#1A1A1A', color: '#FFFFFF',
        border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, ...s,
      }}>+ Add task</button>
    </div>
  )
}

// ─── Task Group ────────────────────────────────────────────────────────────────

function TaskGroup({ label, tasks, allTasks, emptyMsg, onSelect, onComplete, onPin }: {
  label: string; tasks: Task[]; allTasks: Task[]; emptyMsg?: string
  onSelect: (t: Task) => void; onComplete: (id: string) => void; onPin: (id: string, p: boolean) => void
}) {
  if (tasks.length === 0 && !emptyMsg) return null
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.8, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase' }}>{label}</span>
        {tasks.length > 0 && <span style={{ fontSize: 11, color: '#C4C9D0', fontFamily: "'DM Sans', sans-serif" }}>{tasks.length}</span>}
      </div>
      {tasks.length === 0 && emptyMsg ? (
        <p style={{ fontSize: 13, color: '#C4C9D0', fontFamily: "'DM Sans', sans-serif", paddingLeft: 4 }}>{emptyMsg}</p>
      ) : (
        tasks.map(t => <TaskCard key={t.id} task={t} allTasks={allTasks} onSelect={onSelect} onComplete={onComplete} onPin={onPin} />)
      )}
    </div>
  )
}

// ─── Completed Collapse ────────────────────────────────────────────────────────

function CompletedCollapse({ tasks, allTasks, onSelect, onComplete, onPin }: {
  tasks: Task[]; allTasks: Task[];
  onSelect: (t: Task) => void; onComplete: (id: string) => void; onPin: (id: string, p: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  if (tasks.length === 0) return null
  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
        cursor: 'pointer', padding: '6px 0',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#C4C9D0', letterSpacing: 0.8, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase' }}>
          Completed ({tasks.length})
        </span>
        <span style={{ color: '#C4C9D0', fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {tasks.slice(0, 20).map(t => <TaskCard key={t.id} task={t} allTasks={allTasks} onSelect={onSelect} onComplete={onComplete} onPin={onPin} />)}
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
  const [tasks,         setTasks]         = useState<Task[]>(initialTasks)
  const [projects,      setProjects]       = useState<Project[]>(initialProjects)
  const [selectedTask,  setSelectedTask]   = useState<Task | null>(null)
  const [filter,        setFilter]         = useState<Filter>('all')
  const [sort,          setSort]           = useState<Sort>('due_date')
  const [showCreate,    setShowCreate]     = useState(false)

  // ── Derived ──
  const topLevelTasks = useMemo(() => tasks.filter(t => !t.parent_task_id), [tasks])

  const activeTasks = useMemo(() => {
    let list = topLevelTasks.filter(t => t.status !== 'done')

    // Apply filter
    if (filter === 'today')    list = list.filter(t => dueBucket(t.due_at) === 'today')
    if (filter === 'week')     list = list.filter(t => ['today','tomorrow','week'].includes(dueBucket(t.due_at)))
    if (filter === 'waiting')  list = list.filter(t => t.is_delegated)
    if (filter === 'priority') list = list.filter(t => t.priority === 'urgent' || t.priority === 'high')

    // Apply sort
    list = [...list].sort((a, b) => {
      if (sort === 'priority') return priorityRank(a.priority) - priorityRank(b.priority)
      if (sort === 'created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      // due_date: no date goes last
      if (!a.due_at && !b.due_at) return 0
      if (!a.due_at) return 1
      if (!b.due_at) return -1
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    })

    // Blocked tasks sink to the bottom — don't nag about things you can't do yet
    const isBlocked = (t: Task) => !!t.blocked_by_task_id && topLevelTasks.find(u => u.id === t.blocked_by_task_id)?.status === 'pending'
    list = [...list].sort((a, b) => {
      const ab = isBlocked(a), bb = isBlocked(b)
      if (ab && !bb) return 1
      if (!ab && bb) return -1
      return 0
    })

    return list
  }, [topLevelTasks, filter, sort])

  const completedTasks = useMemo(() => topLevelTasks.filter(t => t.status === 'done').slice(0, 30), [topLevelTasks])

  const focusTasks = useMemo(() => {
    const pinned = activeTasks.filter(t => t.is_pinned)
    if (pinned.length >= 3) return pinned.slice(0, 3)
    const todayTasks = activeTasks.filter(t => !t.is_pinned && dueBucket(t.due_at) === 'today')
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    return [...pinned, ...todayTasks].slice(0, 3)
  }, [activeTasks])

  const groups = useMemo(() => {
    // When filtered, don't group — show flat
    if (filter !== 'all') return []
    const nonFocused = activeTasks.filter(t => !focusTasks.includes(t))
    return [
      { label: 'Today',     tasks: nonFocused.filter(t => dueBucket(t.due_at) === 'today'),    emptyMsg: "Nothing due today — nice work!" },
      { label: 'Tomorrow',  tasks: nonFocused.filter(t => dueBucket(t.due_at) === 'tomorrow'),  emptyMsg: '' },
      { label: 'This Week', tasks: nonFocused.filter(t => dueBucket(t.due_at) === 'week'),      emptyMsg: '' },
      { label: 'Later',     tasks: nonFocused.filter(t => dueBucket(t.due_at) === 'later'),     emptyMsg: '' },
      { label: 'Someday',   tasks: nonFocused.filter(t => dueBucket(t.due_at) === 'someday'),   emptyMsg: 'Drop ideas here, no pressure.' },
    ]
  }, [activeTasks, focusTasks, filter])

  // ── Handlers ──
  const handleCreate = useCallback(async (body: Partial<Task>): Promise<Task> => {
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const t = await res.json()
    setTasks(prev => [t, ...prev])
    return t
  }, [])

  const handleUpdate = useCallback(async (id: string, updates: Partial<Task>) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
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
  }, [selectedTask])

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

  return (
    <div style={{ padding: '48px 40px 80px', fontFamily: "'DM Sans', sans-serif", maxWidth: 700 }}>
      <style>{`
        @keyframes checkBounce {
          0%   { transform: scale(1);   }
          40%  { transform: scale(1.3); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1);   }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 36, animation: 'fadeUp 0.4s ease' }}>
        <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6, letterSpacing: 0.2 }}>Tasks</p>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 36, fontWeight: 400, letterSpacing: -0.5, color: '#1A1A1A', margin: '0 0 4px' }}>
          What needs doing.
        </h1>
        <p style={{ fontSize: 14, color: '#9CA3AF' }}>
          {activeTasks.length === 0
            ? 'All clear — inbox zero 🎉'
            : `${activeTasks.length} task${activeTasks.length !== 1 ? 's' : ''} remaining`}
        </p>
      </div>

      {/* Focus section */}
      <FocusSection
        tasks={focusTasks}
        allTasks={tasks}
        onSelect={setSelectedTask}
        onComplete={handleComplete}
        onPin={handlePin}
      />

      {/* Filter bar */}
      <FilterBar
        filter={filter}
        sort={sort}
        projects={projects}
        onFilter={setFilter}
        onSort={setSort}
        onAdd={() => setShowCreate(true)}
      />

      {/* Task list */}
      {filter === 'all' ? (
        <>
          {groups.map(g => (
            <TaskGroup
              key={g.label}
              label={g.label}
              tasks={g.tasks}
              allTasks={tasks}
              emptyMsg={g.emptyMsg}
              onSelect={setSelectedTask}
              onComplete={handleComplete}
              onPin={handlePin}
            />
          ))}
          {activeTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 28, marginBottom: 12 }}>◉</p>
              <p style={{ fontSize: 16, fontWeight: 500, color: '#1A1A1A', marginBottom: 4 }}>You&apos;re all caught up</p>
              <p style={{ fontSize: 14, color: '#9CA3AF' }}>Add a task to get started</p>
            </div>
          )}
        </>
      ) : (
        <>
          {activeTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 14, color: '#9CA3AF' }}>
                {filter === 'today'    && 'Nothing due today — nice work!'}
                {filter === 'week'     && 'Your week is clear.'}
                {filter === 'waiting'  && 'No tasks waiting on others.'}
                {filter === 'priority' && 'No urgent or high priority tasks.'}
              </p>
            </div>
          ) : (
            activeTasks.map(t => (
              <TaskCard key={t.id} task={t} allTasks={tasks} onSelect={setSelectedTask} onComplete={handleComplete} onPin={handlePin} />
            ))
          )}
        </>
      )}

      {/* Completed */}
      <CompletedCollapse
        tasks={completedTasks}
        allTasks={tasks}
        onSelect={setSelectedTask}
        onComplete={handleComplete}
        onPin={handlePin}
      />

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
