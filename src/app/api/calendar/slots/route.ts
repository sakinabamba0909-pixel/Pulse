import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

interface CalendarEvent {
  start: { dateTime?: string; date?: string }
  end:   { dateTime?: string; date?: string }
  summary?: string
}

interface FreeSlot {
  start: string
  end:   string
  label: string
}

async function refreshToken(refreshTokenVal: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshTokenVal,
      grant_type:    'refresh_token',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

async function getCalendarEvents(accessToken: string, timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '250',
  })
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? []) as CalendarEvent[]
}

function findFreeSlots(events: CalendarEvent[], durationMinutes: number, from: Date, days = 7): FreeSlot[] {
  const slots: FreeSlot[] = []
  const WORK_START = 8   // 8am
  const WORK_END   = 19  // 7pm

  for (let d = 0; d < days && slots.length < 5; d++) {
    const day = new Date(from)
    day.setDate(day.getDate() + d)
    if (day.getDay() === 0 || day.getDay() === 6) continue // skip weekends

    const dayStart = new Date(day)
    dayStart.setHours(WORK_START, 0, 0, 0)
    const dayEnd = new Date(day)
    dayEnd.setHours(WORK_END, 0, 0, 0)

    // Get events for this day, sorted by start
    const dayEvents = events
      .filter(e => {
        const start = new Date(e.start.dateTime ?? e.start.date ?? '')
        return start >= dayStart && start < dayEnd
      })
      .sort((a, b) => {
        const aStart = new Date(a.start.dateTime ?? a.start.date ?? '').getTime()
        const bStart = new Date(b.start.dateTime ?? b.start.date ?? '').getTime()
        return aStart - bStart
      })

    // Scan for gaps
    let cursor = dayStart.getTime()
    const busyBlocks = dayEvents.map(e => ({
      start: new Date(e.start.dateTime ?? e.start.date ?? '').getTime(),
      end:   new Date(e.end.dateTime   ?? e.end.date   ?? '').getTime(),
    }))

    // Also block current time if today
    if (d === 0 && from.getTime() > cursor) cursor = Math.ceil(from.getTime() / (15 * 60000)) * (15 * 60000)

    for (const block of [...busyBlocks, { start: dayEnd.getTime(), end: dayEnd.getTime() }]) {
      const gapMs = block.start - cursor
      if (gapMs >= durationMinutes * 60000) {
        const slotStart = new Date(cursor)
        const slotEnd   = new Date(cursor + durationMinutes * 60000)
        const isToday   = d === 0
        const isTomorrow = d === 1
        const dayLabel  = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : slotStart.toLocaleDateString('en-US', { weekday: 'long' })
        const timeLabel = slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        const endLabel  = slotEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString(), label: `${dayLabel} · ${timeLabel} – ${endLabel}` })
        if (slots.length >= 5) break
      }
      if (block.end > cursor) cursor = block.end
    }
  }
  return slots
}

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const durationMinutes = parseInt(req.nextUrl.searchParams.get('duration') ?? '60', 10)

  // Check calendar connection
  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .eq('is_active', true)
    .single()

  if (!conn) {
    return NextResponse.json({ connected: false, slots: [] })
  }

  let accessToken = conn.access_token_encrypted

  // Refresh if expired
  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date(Date.now() + 60000)) {
    if (conn.refresh_token_encrypted) {
      const newToken = await refreshToken(conn.refresh_token_encrypted)
      if (newToken) {
        accessToken = newToken
        await supabase.from('calendar_connections').update({
          access_token_encrypted: newToken,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', conn.id)
      }
    }
  }

  const now    = new Date()
  const maxDay = new Date(now)
  maxDay.setDate(maxDay.getDate() + 8)

  const events = await getCalendarEvents(accessToken, now.toISOString(), maxDay.toISOString())
  const slots  = findFreeSlots(events, durationMinutes, now)

  return NextResponse.json({ connected: true, slots })
}
