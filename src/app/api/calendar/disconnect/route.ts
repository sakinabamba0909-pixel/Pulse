import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Revoke the Google token first
  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('access_token_encrypted')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .single()

  if (conn?.access_token_encrypted) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${conn.access_token_encrypted}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    } catch {
      // Revocation is best-effort
    }
  }

  // Delete the connection record
  const { error } = await supabase
    .from('calendar_connections')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google')

  if (error) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
