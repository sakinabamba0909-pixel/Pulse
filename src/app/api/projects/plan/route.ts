import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    name,
    description,
    context,
    scheduling_preferences,
    existing_tasks,
  } = await req.json()

  if (!name?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: 'Project name and description are required' },
      { status: 400 },
    )
  }

  const prefs = scheduling_preferences ?? {}
  const prefsLines = [
    prefs.no_mornings ? '- No mornings (do not schedule before noon)' : null,
    prefs.no_weekends ? '- No weekends (Saturday/Sunday unavailable)' : null,
    prefs.max_hours_per_day ? `- Max ${prefs.max_hours_per_day} hours of project work per day` : null,
    prefs.preferred_time ? `- Preferred working time: ${prefs.preferred_time}` : null,
    prefs.style ? `- Work style preference: ${prefs.style}` : null,
  ].filter(Boolean)

  const prefsCtx = prefsLines.length
    ? prefsLines.join('\n')
    : '  No specific preferences provided.'

  const existingTasksCtx = existing_tasks?.length
    ? existing_tasks.map((t: { title: string; due_at?: string; duration_minutes?: number; status?: string }) =>
        `  - "${t.title}" due:${t.due_at ?? 'none'} duration:${t.duration_minutes ?? '?'}min status:${t.status ?? 'pending'}`,
      ).join('\n')
    : '  No existing tasks.'

  const system = `You are a project planning assistant for Pulse, a personal AI lifestyle app.

Your job is to take a project description and generate a structured, actionable plan broken into sequential steps, each with concrete tasks.

Project name: "${name}"
Project description: "${description}"
${context ? `Additional context:\n${context}` : ''}

Scheduling preferences:
${prefsCtx}

Existing tasks (avoid scheduling conflicts with these):
${existingTasksCtx}

Current date: ${new Date().toISOString().split('T')[0]}

Instructions:
- Break the project into 2–8 logical steps (phases/milestones).
- Each step should have 1–6 concrete tasks.
- For each task, estimate realistic duration in minutes (minimum 15, maximum 480).
- Suggest scheduled_start and scheduled_end as ISO 8601 datetimes, respecting the user's scheduling preferences.
- Space tasks out reasonably — do not cram everything into one day.
- Avoid scheduling conflicts with existing tasks.
- Each step should have a name, a brief description, and an estimated total duration in hours.
- Include a speech_reply: a short, friendly 1–2 sentence summary of the plan you generated.
- Include calendar_blocks: a simplified view of which days have scheduled work and their time slots.

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "steps": [
    {
      "name": "string",
      "description": "string",
      "estimated_hours": number,
      "tasks": [
        {
          "title": "string",
          "est_minutes": number,
          "scheduled_start": "ISO 8601 datetime",
          "scheduled_end": "ISO 8601 datetime"
        }
      ]
    }
  ],
  "speech_reply": "string",
  "calendar_blocks": [
    {
      "day": "YYYY-MM-DD",
      "slots": [
        {
          "start": "HH:MM",
          "end": "HH:MM",
          "task": "string"
        }
      ]
    }
  ]
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system,
      messages: [
        {
          role: 'user',
          content: `Generate a detailed project plan for: "${name}"\n\nDescription: ${description}${context ? `\n\nContext: ${context}` : ''}`,
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

    // Validate structure
    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return NextResponse.json({ error: 'AI returned invalid plan structure' }, { status: 500 })
    }

    // Sanitise each step and its tasks
    const steps = parsed.steps.map((step: { name?: string; description?: string; estimated_hours?: number; tasks?: Array<{ title?: string; est_minutes?: number; scheduled_start?: string; scheduled_end?: string }> }, idx: number) => ({
      name: step.name ?? `Step ${idx + 1}`,
      description: step.description ?? null,
      estimated_hours: typeof step.estimated_hours === 'number' ? step.estimated_hours : null,
      tasks: Array.isArray(step.tasks)
        ? step.tasks.map((t) => ({
            title: t.title ?? 'Untitled task',
            est_minutes: typeof t.est_minutes === 'number' ? Math.max(15, Math.min(480, t.est_minutes)) : 30,
            scheduled_start: t.scheduled_start ?? null,
            scheduled_end: t.scheduled_end ?? null,
          }))
        : [],
    }))

    const calendarBlocks = Array.isArray(parsed.calendar_blocks)
      ? parsed.calendar_blocks.map((block: { day?: string; slots?: Array<{ start?: string; end?: string; task?: string }> }) => ({
          day: block.day ?? null,
          slots: Array.isArray(block.slots)
            ? block.slots.map((s) => ({
                start: s.start ?? null,
                end: s.end ?? null,
                task: s.task ?? null,
              }))
            : [],
        }))
      : []

    return NextResponse.json({
      steps,
      speech_reply: parsed.speech_reply ?? 'Your project plan is ready.',
      calendar_blocks: calendarBlocks,
    })
  } catch (err) {
    console.error('Project plan generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate project plan' },
      { status: 500 },
    )
  }
}
