import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/settings/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: connections }] = await Promise.all([
    supabase.from('user_profiles').select('name').eq('id', user.id).single(),
    supabase
      .from('calendar_connections')
      .select('id, provider, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  return (
    <SettingsClient
      userName={profile?.name || ''}
      userEmail={user.email || ''}
      initialConnections={connections ?? []}
    />
  )
}
