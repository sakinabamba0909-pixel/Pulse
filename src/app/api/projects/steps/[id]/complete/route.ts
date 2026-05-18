import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const now = new Date().toISOString()

  // Mark step as done
  const { error: stepErr } = await supabase
    .from('project_steps')
    .update({ status: 'done', updated_at: now })
    .eq('id', id)
    .eq('user_id', user.id)

  if (stepErr) {
    return NextResponse.json({ error: stepErr.message }, { status: 500 })
  }

  // Also mark all tasks in this step as done
  await supabase
    .from('tasks')
    .update({ status: 'done', completed_at: now, updated_at: now })
    .eq('step_id', id)
    .eq('user_id', user.id)
    .neq('status', 'done')

  return NextResponse.json({ success: true })
}
