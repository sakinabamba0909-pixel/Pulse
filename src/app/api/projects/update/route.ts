import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, new_info, existing_steps } = await req.json()

  if (!project_id?.trim()) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
  }
  if (!new_info?.trim()) {
    return NextResponse.json({ error: 'new_info is required' }, { status: 400 })
  }

  // Fetch the project to verify ownership and get details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const stepsCtx = Array.isArray(existing_steps) && existing_steps.length
    ? existing_steps.map((s: { id: string; step_number: number; name: string; status?: string; description?: string; estimated_hours?: number }) =>
        `  - id:"${s.id}" step_number:${s.step_number} name:"${s.name}" status:${s.status ?? 'pending'} description:"${s.description ?? ''}" estimated_hours:${s.estimated_hours ?? '?'}`,
      ).join('\n')
    : '  No existing steps.'

  const system = `You are a project update analyst for Pulse, a personal AI lifestyle app.

Project: "${project.name}"
Project ID: ${project.id}
Current status: ${project.status}

Existing project steps:
${stepsCtx}

The user has provided new information that may affect the project plan. Your job is to analyze the new information and determine what changes are needed to the existing steps.

For each change, specify:
- type: "modify_step" (change an existing step), "add_step" (insert a new step), or "remove_step" (remove a step that is no longer needed)
- step_id: the id of the step to modify or remove (null for add_step)
- reason: a brief explanation of why this change is needed
- new_data: for modify_step and add_step, include the updated/new fields (name, description, estimated_hours, status, step_number, etc.)

Also provide a speech_reply: a short, friendly 1–2 sentence summary of the changes.

Rules:
- Only suggest changes that are clearly warranted by the new information.
- Do not rearrange steps unless the new information requires it.
- Be conservative — fewer, well-justified changes are better than many speculative ones.
- If the new information doesn't affect the plan, return an empty changes array and say so in the speech_reply.

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "changes": [
    {
      "type": "modify_step | add_step | remove_step",
      "step_id": "uuid or null",
      "reason": "string",
      "new_data": {
        "name": "string (optional)",
        "description": "string (optional)",
        "estimated_hours": "number (optional)",
        "status": "pending | active | done (optional)",
        "step_number": "number (optional)"
      }
    }
  ],
  "speech_reply": "string"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system,
      messages: [
        {
          role: 'user',
          content: `New information about the project:\n\n"${new_info.replace(/"/g, "'")}"`,
        },
      ],
    })

    const raw = response.content[0]
    if (raw.type !== 'text') {
      return NextResponse.json({ error: 'AI did not return text' }, { status: 500 })
    }

    const jsonMatch = raw.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No JSON found in AI response' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate and sanitise
    const validStepIds = new Set(
      (existing_steps ?? []).map((s: { id: string }) => s.id),
    )
    const validTypes = new Set(['modify_step', 'add_step', 'remove_step'])

    const changes = Array.isArray(parsed.changes)
      ? parsed.changes
          .filter((c: { type?: string }) => validTypes.has(c.type ?? ''))
          .map((c: { type: string; step_id?: string; reason?: string; new_data?: Record<string, unknown> }) => ({
            type: c.type,
            step_id: c.type !== 'add_step' && validStepIds.has(c.step_id ?? '')
              ? c.step_id
              : null,
            reason: c.reason ?? 'No reason provided',
            new_data: c.type !== 'remove_step' && c.new_data
              ? {
                  ...(c.new_data.name != null && { name: c.new_data.name }),
                  ...(c.new_data.description != null && { description: c.new_data.description }),
                  ...(typeof c.new_data.estimated_hours === 'number' && { estimated_hours: c.new_data.estimated_hours }),
                  ...(typeof c.new_data.status === 'string' &&
                    ['pending', 'active', 'done'].includes(c.new_data.status as string) && {
                      status: c.new_data.status,
                    }),
                  ...(typeof c.new_data.step_number === 'number' && { step_number: c.new_data.step_number }),
                }
              : undefined,
          }))
      : []

    return NextResponse.json({
      changes,
      speech_reply: parsed.speech_reply ?? 'Analysis complete.',
    })
  } catch (err) {
    console.error('Project update analysis error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze project update' },
      { status: 500 },
    )
  }
}
