import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

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

interface TaskEvent {
  title: string
  scheduled_start: string
  scheduled_end: string
  description?: string
}

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tasks } = await req.json() as { tasks: TaskEvent[] }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json({ error: 'No tasks provided' }, { status: 400 })
  }

  // Get Google Calendar connection
  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .eq('is_active', true)
    .single()

  if (!conn) {
    return NextResponse.json({ error: 'No Google Calendar connected' }, { status: 400 })
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

  const created: Array<{ title: string; googleEventId: string }> = []
  const failed: Array<{ title: string; error: string }> = []

  for (const task of tasks) {
    if (!task.scheduled_start || !task.scheduled_end) {
      failed.push({ title: task.title, error: 'Missing scheduled times' })
      continue
    }

    const event = {
      summary: task.title,
      description: task.description || `Pulse task: ${task.title}`,
      start: { dateTime: task.scheduled_start, timeZone: 'UTC' },
      end:   { dateTime: task.scheduled_end,   timeZone: 'UTC' },
      reminders: { useDefault: true },
    }

    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    )

    if (res.ok) {
      const data = await res.json()
      created.push({ title: task.title, googleEventId: data.id })
    } else {
      const errText = await res.text().catch(() => 'Unknown error')
      failed.push({ title: task.title, error: errText })
    }
  }

  return NextResponse.json({ created, failed })
}
