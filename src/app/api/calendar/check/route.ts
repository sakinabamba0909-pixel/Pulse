import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const startParam = req.nextUrl.searchParams.get('start')
  const endParam   = req.nextUrl.searchParams.get('end')
  if (!startParam || !endParam) return NextResponse.json({ error: 'Missing start/end' }, { status: 400 })

  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .eq('is_active', true)
    .single()

  if (!conn) return NextResponse.json({ connected: false, conflict: null })

  let accessToken = conn.access_token_encrypted

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

  const params = new URLSearchParams({
    timeMin:      startParam,
    timeMax:      endParam,
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '10',
  })
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return NextResponse.json({ connected: true, conflict: null })

  const data   = await res.json()
  const events = (data.items ?? []) as Array<{
    summary?: string
    start: { dateTime?: string; date?: string }
    end:   { dateTime?: string; date?: string }
  }>

  const slotStart = new Date(startParam).getTime()
  const slotEnd   = new Date(endParam).getTime()

  const conflict = events.find(e => {
    const evStart = new Date(e.start.dateTime ?? e.start.date ?? '').getTime()
    const evEnd   = new Date(e.end.dateTime   ?? e.end.date   ?? '').getTime()
    return evStart < slotEnd && evEnd > slotStart
  })

  return NextResponse.json({
    connected: true,
    conflict:  conflict ? { name: conflict.summary ?? 'Untitled event' } : null,
  })
}
