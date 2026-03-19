'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

interface Reminder {
  id: string
  task_id: string | null
  remind_at: string
  channel: string
  message: string | null
  status: 'pending' | 'sent' | 'dismissed' | 'snoozed'
  created_at: string
  task?: { id: string; title: string; due_at: string | null; priority: string } | null
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#C87882',
  normal: '#7AABC8',
  low:    '#8890A0',
}

function formatRemindAt(iso: string): { label: string; past: boolean } {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffMin = Math.round(diffMs / 60000)
  const past = diffMs < 0

  if (Math.abs(diffMin) < 60) {
    const n = Math.abs(diffMin)
    return { label: past ? `${n}m ago` : `in ${n}m`, past }
  }
  const diffH = Math.abs(Math.round(diffMin / 60))
  if (diffH < 24) return { label: past ? `${diffH}h ago` : `in ${diffH}h`, past }

  return {
    label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    past,
  }
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reminders')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setReminders(d) })
      .finally(() => setLoading(false))
  }, [])

  async function dismiss(id: string) {
    setReminders(prev => prev.filter(r => r.id !== id))
    await fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'dismissed' }),
    })
  }

  const s: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" }

  const pending   = reminders.filter(r => r.status === 'pending' || r.status === 'snoozed')
  const dismissed = reminders.filter(r => r.status === 'dismissed' || r.status === 'sent')

  return (
    <div style={{ padding: '64px 40px', fontFamily: "'Outfit', sans-serif", color: '#2A2D35', maxWidth: 680 }}>
      <p style={{ fontSize: 12, color: '#8890A0', marginBottom: 8, letterSpacing: 0.2 }}>Reminders</p>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 400, letterSpacing: -0.5, margin: '0 0 6px' }}>
        Don&apos;t let things slip.
      </h1>
      <p style={{ fontSize: 15, color: '#8890A0', marginBottom: 40 }}>
        Smart nudges based on your rhythm and priorities.
      </p>

      {loading ? (
        <div style={{ color: '#8890A0', fontSize: 14, ...s }}>Loading...</div>
      ) : pending.length === 0 ? (
        <div style={{
          background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20,
          padding: '48px 40px', textAlign: 'center', maxWidth: 480,
        }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>◷</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#2A2D35', marginBottom: 6 }}>All clear</p>
          <p style={{ fontSize: 14, color: '#8890A0', lineHeight: 1.6 }}>
            Set a reminder when creating a task and it will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pending.map(r => {
            const { label, past } = formatRemindAt(r.remind_at)
            const priorityColor = r.task?.priority ? PRIORITY_COLOR[r.task.priority] : '#8890A0'
            return (
              <div key={r.id} style={{
                background: '#FFFFFF', border: `1px solid ${past ? 'rgba(200,120,130,0.15)' : 'rgba(255,255,255,0.25)'}`,
                borderRadius: 16, padding: '16px 20px',
                display: 'flex', alignItems: 'flex-start', gap: 14,
              }}>
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: past ? 'rgba(200,120,130,0.08)' : 'rgba(139,126,200,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {past ? '⏰' : '◷'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {r.task && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColor, flexShrink: 0, display: 'inline-block' }} />
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#2A2D35', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...s }}>
                        {r.task.title}
                      </p>
                    </div>
                  )}
                  {r.message && !r.task && (
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#2A2D35', margin: '0 0 3px', ...s }}>{r.message}</p>
                  )}
                  <p style={{ fontSize: 12, color: past ? '#C87882' : '#8890A0', margin: 0, ...s }}>
                    {past ? 'Overdue · ' : ''}{label}
                  </p>
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => dismiss(r.id)}
                  style={{
                    background: 'none', border: '1px solid rgba(255,255,255,0.30)', borderRadius: 8,
                    padding: '4px 10px', fontSize: 12, color: '#8890A0', cursor: 'pointer',
                    flexShrink: 0, ...s,
                  }}
                >
                  Done
                </button>
              </div>
            )
          })}
        </div>
      )}

      {dismissed.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#B0B6C4', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, ...s }}>
            Completed
          </p>
          {dismissed.slice(0, 5).map(r => (
            <div key={r.id} style={{
              padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 13, color: '#B0B6C4', flex: 1, ...s }}>
                {r.task?.title ?? r.message ?? 'Reminder'}
              </span>
              <span style={{ fontSize: 11, color: '#B0B6C4', ...s }}>
                {new Date(r.remind_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
