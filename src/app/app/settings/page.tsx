import { createServerClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: calConn }] = await Promise.all([
    supabase.from('user_profiles').select('name').eq('id', user.id).single(),
    supabase
      .from('calendar_connections')
      .select('id, provider, is_active, created_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .eq('is_active', true)
      .single(),
  ])

  return (
    <SettingsClient
      userName={profile?.name || ''}
      userEmail={user.email || ''}
      calendarConnected={!!calConn}
      calendarConnectedAt={calConn?.created_at || null}
    />
  )
}
