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

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function findFreeSlots(
  events: CalendarEvent[],
  durationMinutes: number,
  from: Date,
  dueAt: Date | null,
): FreeSlot[] {
  const slots: FreeSlot[] = []
  const WORK_START = 8   // 8am
  const WORK_END   = 19  // 7pm

  // Search up to due date (or 7 days if no due date)
  const deadline = dueAt ?? new Date(from.getTime() + 7 * 86400000)
  const maxDays  = Math.max(1, Math.ceil((deadline.getTime() - from.getTime()) / 86400000) + 1)

  // Build day offsets: if due date is set, put that specific day first
  const candidateDays: number[] = []
  if (dueAt) {
    const dueDay  = new Date(dueAt); dueDay.setHours(0, 0, 0, 0)
    const fromDay = new Date(from);  fromDay.setHours(0, 0, 0, 0)
    const dueDayOffset = Math.floor((dueDay.getTime() - fromDay.getTime()) / 86400000)
    if (dueDayOffset >= 0 && dueDayOffset < maxDays) candidateDays.push(dueDayOffset)
    for (let i = 0; i < maxDays; i++) {
      if (i !== dueDayOffset) candidateDays.push(i)
    }
  } else {
    for (let i = 0; i < maxDays; i++) candidateDays.push(i)
  }

  for (const d of candidateDays) {
    if (slots.length >= 5) break

    const day = new Date(from)
    day.setDate(day.getDate() + d)
    if (day.getDay() === 0 || day.getDay() === 6) continue // skip weekends

    // Don't go past deadline day
    const dayDate     = new Date(day);     dayDate.setHours(0, 0, 0, 0)
    const deadlineDay = new Date(deadline); deadlineDay.setHours(0, 0, 0, 0)
    if (dayDate.getTime() > deadlineDay.getTime()) continue

    const dayStart = new Date(day)
    dayStart.setHours(WORK_START, 0, 0, 0)

    // On the due day, cap at due time (or WORK_END, whichever is earlier)
    let workEndHour = WORK_END
    if (dueAt && isSameDay(day, dueAt)) {
      const dueHour = dueAt.getHours() + dueAt.getMinutes() / 60
      if (dueHour < workEndHour) workEndHour = dueHour
    }
    const dayEnd = new Date(day)
    dayEnd.setHours(Math.floor(workEndHour), Math.round((workEndHour % 1) * 60), 0, 0)

    if (dayEnd.getTime() - dayStart.getTime() < durationMinutes * 60000) continue

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

    let cursor = dayStart.getTime()
    const busyBlocks = dayEvents.map(e => ({
      start: new Date(e.start.dateTime ?? e.start.date ?? '').getTime(),
      end:   new Date(e.end.dateTime   ?? e.end.date   ?? '').getTime(),
    }))

    // Round up current time to next 15-min block if today
    if (d === 0 && from.getTime() > cursor) cursor = Math.ceil(from.getTime() / (15 * 60000)) * (15 * 60000)

    const isToday    = d === 0
    const isTomorrow = d === 1

    for (const block of [...busyBlocks, { start: dayEnd.getTime(), end: dayEnd.getTime() }]) {
      const gapMs = block.start - cursor
      if (gapMs >= durationMinutes * 60000) {
        const slotStart = new Date(cursor)
        const slotEnd   = new Date(cursor + durationMinutes * 60000)
        const dayLabel  = isToday
          ? 'Today'
          : isTomorrow
            ? 'Tomorrow'
            : slotStart.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
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
  const dueAtParam      = req.nextUrl.searchParams.get('due_at')
  const dueAt           = dueAtParam ? new Date(dueAtParam) : null

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
  const maxDay = dueAt
    ? new Date(Math.max(dueAt.getTime(), now.getTime()) + 86400000)
    : new Date(now.getTime() + 8 * 86400000)

  const events = await getCalendarEvents(accessToken, now.toISOString(), maxDay.toISOString())
  const slots  = findFreeSlots(events, durationMinutes, now, dueAt)

  return NextResponse.json({ connected: true, slots })
}
