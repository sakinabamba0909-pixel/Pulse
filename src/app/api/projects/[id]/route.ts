import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { error } = await supabase
    .from('projects')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Delete tasks linked to this project's steps
  const { data: stepIds } = await supabase
    .from('project_steps')
    .select('id')
    .eq('project_id', id)
    .eq('user_id', user.id)

  if (stepIds && stepIds.length > 0) {
    const ids = stepIds.map((s) => s.id)
    await supabase.from('tasks').delete().in('step_id', ids).eq('user_id', user.id)
  }

  // Also delete tasks directly linked to the project (no step)
  await supabase.from('tasks').delete().eq('project_id', id).eq('user_id', user.id)

  // Delete project steps
  await supabase.from('project_steps').delete().eq('project_id', id).eq('user_id', user.id)

  // Delete the project
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
