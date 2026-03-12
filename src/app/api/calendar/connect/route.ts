import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID

export async function GET(req: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: 'Google Calendar not configured. Add GOOGLE_CLIENT_ID to your environment.' }, { status: 503 })
  }

  const origin      = req.nextUrl.origin
  const redirectUri = `${origin}/api/calendar/callback`

  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/calendar.readonly',
    access_type:   'offline',
    prompt:        'consent',
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
