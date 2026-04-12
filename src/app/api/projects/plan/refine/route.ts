import OpenAI from 'openai'
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

let _openai: OpenAI | null = null
function getOpenAI() {
  if (!_openai) _openai = new OpenAI()
  return _openai
}

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

async function refreshGoogleToken(refreshTokenVal: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshTokenVal,
      grant_type:    'refresh_token',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

async function fetchGoogleCalendarEvents(
  accessToken: string, timeMin: string, timeMax: string,
): Promise<Array<{ summary?: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }>> {
  const params = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '250' })
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? [])
}

async function getGoogleAccessToken(
  supabase: Awaited<ReturnType<typeof createServerClient>>, userId: string,
): Promise<string | null> {
  const { data: conn } = await supabase
    .from('calendar_connections').select('*')
    .eq('user_id', userId).eq('provider', 'google').eq('is_active', true).single()
  if (!conn) return null
  let accessToken = conn.access_token_encrypted
  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date(Date.now() + 60000)) {
    if (conn.refresh_token_encrypted) {
      const newToken = await refreshGoogleToken(conn.refresh_token_encrypted)
      if (newToken) {
        accessToken = newToken
        await supabase.from('calendar_connections').update({
          access_token_encrypted: newToken,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', conn.id)
      }
    }
  }
  return accessToken
}

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
    deadline,
    calendar_mode,
    current_plan,
    user_feedback,
  } = await req.json()

  if (!user_feedback?.trim()) {
    return NextResponse.json({ error: 'Feedback is required' }, { status: 400 })
  }

  const prefs = scheduling_preferences ?? {}
  const prefsLines = [
    prefs.preferred_time === 'morning' ? '- MORNINGS PREFERRED: Schedule tasks before noon (8am–12pm)' : null,
    prefs.preferred_time === 'afternoon' ? '- AFTERNOONS PREFERRED: Schedule tasks after noon (1pm–7pm)' : null,
    prefs.no_weekends === true ? '- NO WEEKENDS: Never schedule on Saturday or Sunday' : null,
    prefs.no_weekends === false ? '- WEEKENDS OK: Can use Saturday/Sunday if needed' : null,
    prefs.style === 'spread' ? '- SPREAD OUT: Max 2-3 tasks per day, spread across many days' : null,
    prefs.style === 'packed' ? '- PACKED DAYS OK: Full days of work are fine' : null,
  ].filter(Boolean)

  const prefsCtx = prefsLines.length ? prefsLines.join('\n') : '  No specific preferences.'

  const existingTasksCtx = existing_tasks?.length
    ? existing_tasks.map((t: { title: string; due_at?: string; duration_minutes?: number }) =>
        `  - "${t.title}" due:${t.due_at ?? 'none'} duration:${t.duration_minutes ?? '?'}min`,
      ).join('\n')
    : '  No existing tasks.'

  let calendarBusyCtx = '  No calendar connected — schedule freely.'
  if (calendar_mode === 'google') {
    const accessToken = await getGoogleAccessToken(supabase, user.id)
    if (accessToken) {
      const now = new Date()
      const futureEnd = new Date(now.getTime() + 30 * 86400000)
      const events = await fetchGoogleCalendarEvents(accessToken, now.toISOString(), futureEnd.toISOString())
      if (events.length > 0) {
        const busyLines = events.slice(0, 100).map((e) => {
          const start = e.start.dateTime ?? e.start.date ?? ''
          const end = e.end.dateTime ?? e.end.date ?? ''
          return `  - "${e.summary ?? 'Busy'}" from ${start} to ${end}`
        })
        calendarBusyCtx = `Google Calendar events (AVOID conflicts):\n${busyLines.join('\n')}`
      }
    }
  }

  const currentPlanCtx = Array.isArray(current_plan)
    ? current_plan.map((step: { name: string; description?: string; estimated_hours?: number; tasks: Array<{ title: string; est_minutes?: number; scheduled_start?: string; scheduled_end?: string }> }, i: number) => {
        const taskLines = step.tasks.map((t) =>
          `      - "${t.title}" (${t.est_minutes ?? '?'}min) scheduled: ${t.scheduled_start ?? 'unscheduled'} → ${t.scheduled_end ?? ''}`
        ).join('\n')
        return `  Step ${i + 1}: ${step.name} (~${step.estimated_hours ?? '?'}hrs)\n    ${step.description ?? ''}\n    Tasks:\n${taskLines}`
      }).join('\n\n')
    : '  No current plan.'

  const systemPrompt = `You are the Pulse AI project planning brain — smart, understanding, and proactive.

The user already has a suggested project plan, and they want to REFINE it. They will tell you what to change in natural language. You must understand their intent deeply and make the right adjustments.

Project: "${name}"
Description: "${description}"
${context ? `Context: ${context}` : ''}
${deadline ? `DEADLINE: ${deadline} — ALL tasks MUST be before this date.` : 'No deadline.'}

Scheduling preferences:
${prefsCtx}

Existing Pulse tasks:
${existingTasksCtx}

Calendar availability:
${calendarBusyCtx}

CURRENT PLAN:
${currentPlanCtx}

USER'S REQUESTED CHANGES:
"${user_feedback}"

Current date/time: ${new Date().toISOString()}

Instructions:
- UNDERSTAND the user's intent. They might say things like:
  - "Spread the tasks more" → distribute across more days, fewer tasks per day
  - "Move everything to mornings" → reschedule all tasks before noon
  - "Push everything back a week" → shift all dates forward 7 days
  - "Add a review step at the end" → add a new step with review tasks
  - "Remove step 3" → delete that step entirely
  - "Make it less intense" → reduce hours per day, spread out more
  - "Swap step 2 and 3" → reorder the steps
  - "I have Wednesdays off" → avoid scheduling on Wednesdays
  - Or any other natural language adjustment
- Return a COMPLETE updated plan (all steps and tasks, not just changes)
- Keep steps/tasks that weren't affected by the feedback unchanged
- Maintain the same JSON format as the original plan
- Write a brief, friendly speech_reply explaining what you changed
- NEVER schedule during existing calendar events
- Respect all scheduling preferences

Return ONLY valid JSON:
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
      "slots": [{ "start": "HH:MM", "end": "HH:MM", "task": "string" }]
    }
  ]
}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Please update the project plan based on my feedback: "${user_feedback}"`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) {
      return NextResponse.json({ error: 'AI did not return a response' }, { status: 500 })
    }

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return NextResponse.json({ error: 'AI returned invalid plan structure' }, { status: 500 })
    }

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
            ? block.slots.map((s) => ({ start: s.start ?? null, end: s.end ?? null, task: s.task ?? null }))
            : [],
        }))
      : []

    return NextResponse.json({
      steps,
      speech_reply: parsed.speech_reply ?? 'Plan updated based on your feedback.',
      calendar_blocks: calendarBlocks,
    })
  } catch (err) {
    console.error('Plan refine error:', err)
    return NextResponse.json({ error: 'Failed to refine plan' }, { status: 500 })
  }
}
