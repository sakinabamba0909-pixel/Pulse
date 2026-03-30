import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

function getOrigin(req: NextRequest): string {
  const host  = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  return `${proto}://${host}`
}

export async function GET(req: NextRequest) {
  const origin      = getOrigin(req)
  const redirectUri = `${origin}/api/calendar/callback`

  const code  = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/app/tasks?calendar_error=access_denied`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/app/tasks?calendar_error=token_exchange_failed`)
  }

  const tokens = await tokenRes.json()

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/app/tasks?calendar_error=not_authenticated`)
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  await supabase.from('calendar_connections').upsert({
    user_id:                 user.id,
    provider:                'google',
    access_token_encrypted:  tokens.access_token,
    refresh_token_encrypted: tokens.refresh_token ?? null,
    token_expires_at:        expiresAt,
    is_active:               true,
    updated_at:              new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect(`${origin}/app/settings?calendar_connected=1`)
}
