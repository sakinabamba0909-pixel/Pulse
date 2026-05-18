import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, steps } = await req.json()

  if (!project_id || !Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: 'project_id and steps are required' }, { status: 400 })
  }

  // Verify project ownership
  const { data: project, error: pErr } = await supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single()

  if (pErr || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const createdSteps: any[] = []
  const createdTasks: any[] = []

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]

    // Insert step
    const { data: savedStep, error: stepErr } = await supabase
      .from('project_steps')
      .insert({
        user_id: user.id,
        project_id,
        step_number: i + 1,
        name: step.name,
        description: step.description ?? null,
        estimated_hours: step.estimated_hours ?? null,
        status: 'pending',
      })
      .select('*')
      .single()

    if (stepErr || !savedStep) continue
    createdSteps.push(savedStep)

    // Insert tasks for this step
    if (Array.isArray(step.tasks)) {
      for (const task of step.tasks) {
        const { data: savedTask } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: task.title,
            project_id,
            step_id: savedStep.id,
            duration_minutes: task.est_minutes ?? 30,
            scheduled_start: task.scheduled_start ?? null,
            scheduled_end: task.scheduled_end ?? null,
            due_at: task.scheduled_end ?? null,
            status: 'pending',
            priority: 'normal',
            is_recurring: false,
            is_delegated: false,
            is_pinned: false,
            streak_count: 0,
          })
          .select('id, project_id, step_id, title, status, due_at, duration_minutes, scheduled_start, scheduled_end')
          .single()

        if (savedTask) createdTasks.push(savedTask)
      }
    }
  }

  return NextResponse.json({ steps: createdSteps, tasks: createdTasks })
}
