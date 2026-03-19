'use client'

import { useState } from 'react'

export interface FreeSlot { start: string; end: string; label: string }

interface Props {
  durationMinutes: number | null
  dueAt: string
  scheduledStart: string
  scheduledEnd: string
  onSchedule: (start: string, end: string) => void
  onClear: () => void
  onChange: (start: string, end: string) => void
}

const s = { fontFamily: "'Outfit', sans-serif" }

export default function ScheduleSection({
  durationMinutes, dueAt, scheduledStart, scheduledEnd,
  onSchedule, onClear, onChange,
}: Props) {
  const [slots,            setSlots]            = useState<FreeSlot[]>([])
  const [loadingSlots,     setLoadingSlots]     = useState(false)
  const [calConnected,     setCalConnected]     = useState<boolean | null>(null)
  const [showSlots,        setShowSlots]        = useState(false)
  const [showCustom,       setShowCustom]       = useState(false)
  const [conflictMsg,      setConflictMsg]      = useState<string | null>(null)
  const [checkingConflict, setCheckingConflict] = useState(false)

  async function findSlots() {
    setLoadingSlots(true); setShowSlots(true); setShowCustom(false)
    try {
      const params = new URLSearchParams({
        duration:   String(durationMinutes ?? 60),
        utc_offset: String(-new Date().getTimezoneOffset()),
      })
      if (dueAt) params.set('due_at', new Date(dueAt).toISOString())
      const res  = await fetch(`/api/calendar/slots?${params}`)
      const data = await res.json()
      setCalConnected(data.connected)
      setSlots(data.slots ?? [])
    } catch {
      setCalConnected(false)
    } finally {
      setLoadingSlots(false)
    }
  }

  async function handleSchedule() {
    if (!scheduledStart || !scheduledEnd) return
    setCheckingConflict(true); setConflictMsg(null)
    try {
      const startIso = new Date(scheduledStart).toISOString()
      const endIso   = new Date(scheduledEnd).toISOString()
      const res  = await fetch(`/api/calendar/check?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`)
      const data = await res.json()
      if (data.conflict) {
        setConflictMsg(`Conflicts with "${data.conflict.name}"`)
      } else {
        onSchedule(startIso, endIso)
        setConflictMsg(null); setShowCustom(false)
      }
    } catch {
      onSchedule(new Date(scheduledStart).toISOString(), new Date(scheduledEnd).toISOString())
      setConflictMsg(null); setShowCustom(false)
    } finally {
      setCheckingConflict(false)
    }
  }

  function handleStartChange(newStart: string) {
    setConflictMsg(null)
    if (newStart && durationMinutes) {
      const end = new Date(newStart)
      end.setMinutes(end.getMinutes() + durationMinutes)
      const pad = (n: number) => String(n).padStart(2, '0')
      onChange(newStart, `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`)
    } else {
      onChange(newStart, scheduledEnd)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#8890A0', letterSpacing: 0.8, ...s }}>
          SCHEDULE IT
        </label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={findSlots} disabled={loadingSlots} style={{ fontSize: 11, color: '#8B7EC8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, ...s }}>
            {loadingSlots ? 'Checking...' : '✦ Find free slot'}
          </button>
          {!scheduledStart && (
            <button
              onClick={() => { setShowCustom(v => !v); setShowSlots(false); setConflictMsg(null) }}
              style={{ fontSize: 11, color: showCustom ? '#8B7EC8' : '#8890A0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, ...s }}
            >
              {showCustom ? '✕ Cancel' : '+ Custom time'}
            </button>
          )}
        </div>
      </div>

      {/* Free slot suggestions */}
      {showSlots && (
        <div style={{ marginBottom: 10 }}>
          {calConnected === false && (
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(255,255,255,0.30)', marginBottom: 8 }}>
              <p style={{ fontSize: 12, color: '#4A4E5A', margin: '0 0 8px', ...s }}>Connect Google Calendar to see your real free slots.</p>
              <a href="/api/calendar/connect" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: '#2A2D35', color: '#FFF', fontSize: 12, fontWeight: 600, textDecoration: 'none', ...s }}>
                Connect Google Calendar →
              </a>
            </div>
          )}
          {loadingSlots && <p style={{ fontSize: 12, color: '#8890A0', ...s }}>Looking at your calendar...</p>}
          {!loadingSlots && slots.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {slots.map((slot, i) => (
                <button key={i} onClick={() => { onSchedule(slot.start, slot.end); setShowSlots(false) }} style={{
                  padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(139,126,200,0.2)',
                  background: 'rgba(139,126,200,0.05)', cursor: 'pointer', textAlign: 'left',
                  fontSize: 12, color: '#2A2D35', ...s,
                }}>{slot.label}</button>
              ))}
              {!scheduledStart && (
                <button onClick={() => { setShowCustom(v => !v); setShowSlots(false) }} style={{ fontSize: 11, color: '#8890A0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '2px 0', ...s }}>
                  + Pick a custom time instead
                </button>
              )}
            </div>
          )}
          {!loadingSlots && calConnected && slots.length === 0 && (
            <p style={{ fontSize: 12, color: '#8890A0', marginBottom: 6, ...s }}>No free slots found before the due date.</p>
          )}
        </div>
      )}

      {/* Custom time picker */}
      {(showCustom || scheduledStart) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="datetime-local" value={scheduledStart} onChange={e => handleStartChange(e.target.value)}
              style={{ flex: 1, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '7px 10px', fontSize: 12, ...s, color: '#2A2D35', background: 'rgba(255,255,255,0.45)', outline: 'none' }} />
            <span style={{ color: '#B0B6C4', fontSize: 12 }}>→</span>
            <input type="datetime-local" value={scheduledEnd} onChange={e => { setConflictMsg(null); onChange(scheduledStart, e.target.value) }}
              style={{ flex: 1, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '7px 10px', fontSize: 12, ...s, color: '#2A2D35', background: 'rgba(255,255,255,0.45)', outline: 'none' }} />
            {scheduledStart && (
              <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0B6C4', fontSize: 16 }}>×</button>
            )}
          </div>
          {scheduledStart && scheduledEnd && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={handleSchedule} disabled={checkingConflict} style={{
                padding: '6px 14px', borderRadius: 20,
                background: 'rgba(139,126,200,0.10)', border: '1px solid rgba(139,126,200,0.25)',
                color: '#8B7EC8', fontSize: 12, fontWeight: 600,
                cursor: checkingConflict ? 'default' : 'pointer', ...s,
              }}>
                {checkingConflict ? 'Checking...' : 'Schedule ✓'}
              </button>
              {conflictMsg && <span style={{ fontSize: 11, color: '#C87882', ...s }}>⚠ {conflictMsg}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
