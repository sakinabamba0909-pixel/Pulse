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

// Convert a local hour (e.g. 8 = 8am) to a UTC Date on the given day
function localHourToUTC(day: Date, localHour: number, utcOffsetMinutes: number): Date {
  const result = new Date(day)
  const totalUtcMinutes = localHour * 60 - utcOffsetMinutes
  result.setUTCHours(Math.floor(totalUtcMinutes / 60), totalUtcMinutes % 60, 0, 0)
  return result
}

// Check if two dates fall on the same LOCAL calendar day given a UTC offset
function isSameDayLocal(a: Date, b: Date, utcOffsetMinutes: number): boolean {
  const toLocalMidnight = (d: Date) => {
    const local = new Date(d.getTime() + utcOffsetMinutes * 60000)
    return `${local.getUTCFullYear()}-${local.getUTCMonth()}-${local.getUTCDate()}`
  }
  return toLocalMidnight(a) === toLocalMidnight(b)
}

// Get local day-of-week (0=Sun) for a UTC date given offset
function localDayOfWeek(d: Date, utcOffsetMinutes: number): number {
  return new Date(d.getTime() + utcOffsetMinutes * 60000).getUTCDay()
}

function findFreeSlots(
  events: CalendarEvent[],
  durationMinutes: number,
  from: Date,
  dueAt: Date | null,
  utcOffsetMinutes: number,
): FreeSlot[] {
  const slots: FreeSlot[] = []
  const WORK_START = 8   // 8am local
  const WORK_END   = 19  // 7pm local

  // Search up to due date (or 7 days if no due date)
  const deadline = dueAt ?? new Date(from.getTime() + 7 * 86400000)
  const maxDays  = Math.max(1, Math.ceil((deadline.getTime() - from.getTime()) / 86400000) + 1)

  // Build day offsets: if due date is set, put that specific day first
  const candidateDays: number[] = []
  if (dueAt) {
    const dueDay  = new Date(dueAt.getTime() + utcOffsetMinutes * 60000); dueDay.setUTCHours(0,0,0,0)
    const fromDay = new Date(from.getTime() + utcOffsetMinutes * 60000);  fromDay.setUTCHours(0,0,0,0)
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
    day.setUTCDate(day.getUTCDate() + d)

    const dow = localDayOfWeek(day, utcOffsetMinutes)
    if (dow === 0 || dow === 6) continue // skip weekends in local time

    // Don't go past deadline day (in local time)
    if (!isSameDayLocal(day, deadline, utcOffsetMinutes)) {
      const localDay      = new Date(day.getTime()      + utcOffsetMinutes * 60000); localDay.setUTCHours(0,0,0,0)
      const localDeadline = new Date(deadline.getTime() + utcOffsetMinutes * 60000); localDeadline.setUTCHours(0,0,0,0)
      if (localDay.getTime() > localDeadline.getTime()) continue
    }

    // Work window in UTC (calculated from user's local timezone)
    const dayStart = localHourToUTC(day, WORK_START, utcOffsetMinutes)

    // On the due day, cap at due time (or WORK_END, whichever is earlier)
    let workEndLocal = WORK_END
    if (dueAt && isSameDayLocal(day, dueAt, utcOffsetMinutes)) {
      const dueLocal = new Date(dueAt.getTime() + utcOffsetMinutes * 60000)
      const dueLocalHour = dueLocal.getUTCHours() + dueLocal.getUTCMinutes() / 60
      if (dueLocalHour < workEndLocal) workEndLocal = dueLocalHour
    }
    const dayEnd = localHourToUTC(day, workEndLocal, utcOffsetMinutes)

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

    const busyBlocks = dayEvents.map(e => ({
      start: new Date(e.start.dateTime ?? e.start.date ?? '').getTime(),
      end:   new Date(e.end.dateTime   ?? e.end.date   ?? '').getTime(),
    })).sort((a, b) => a.start - b.start)

    const isToday     = isSameDayLocal(day, from, utcOffsetMinutes)
    const tomorrowUtc = new Date(from.getTime() + 86400000)
    const isTomorrow  = isSameDayLocal(day, tomorrowUtc, utcOffsetMinutes)

    function fmtTime(utcMs: number): string {
      const local = new Date(utcMs + utcOffsetMinutes * 60000)
      const h = local.getUTCHours()
      const m = local.getUTCMinutes()
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12  = h % 12 || 12
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
    }

    function fmtDayLabel(utcMs: number): string {
      const local = new Date(utcMs + utcOffsetMinutes * 60000)
      const weekday = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][local.getUTCDay()]
      const month   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][local.getUTCMonth()]
      return `${weekday}, ${month} ${local.getUTCDate()}`
    }

    // Try two windows per day: morning (start–noon) and afternoon (1pm–end)
    const noonUtc      = localHourToUTC(day, 12, utcOffsetMinutes).getTime()
    const afternoonUtc = localHourToUTC(day, 13, utcOffsetMinutes).getTime()
    const windows = [
      { from: dayStart.getTime(), to: noonUtc },
      { from: afternoonUtc,       to: dayEnd.getTime() },
    ]

    for (const win of windows) {
      if (slots.length >= 5) break
      let cursor = win.from
      // If today, round up to next 15-min block
      if (isToday && from.getTime() > cursor) cursor = Math.ceil(from.getTime() / (15 * 60000)) * (15 * 60000)
      if (cursor >= win.to) continue

      const sentinel = { start: win.to, end: win.to }
      for (const block of [...busyBlocks.filter(b => b.end > cursor), sentinel]) {
        const gapEnd = Math.min(block.start, win.to)
        if (gapEnd - cursor >= durationMinutes * 60000) {
          const slotStart = cursor
          const slotEnd   = cursor + durationMinutes * 60000
          const dayLabel  = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : fmtDayLabel(slotStart)
          const label     = `${dayLabel} · ${fmtTime(slotStart)} – ${fmtTime(slotEnd)}`
          slots.push({ start: new Date(slotStart).toISOString(), end: new Date(slotEnd).toISOString(), label })
          break  // one slot per window
        }
        if (block.end > cursor) cursor = block.end
        if (cursor >= win.to) break
      }
    }
  }
  return slots
}

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const durationMinutes  = parseInt(req.nextUrl.searchParams.get('duration')   ?? '60', 10)
  const utcOffsetMinutes = parseInt(req.nextUrl.searchParams.get('utc_offset') ?? '0',  10)
  const dueAtParam       = req.nextUrl.searchParams.get('due_at')
  const dueAt            = dueAtParam ? new Date(dueAtParam) : null

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
  const slots  = findFreeSlots(events, durationMinutes, now, dueAt, utcOffsetMinutes)

  return NextResponse.json({ connected: true, slots })
}
