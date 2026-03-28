import OpenAI from 'openai'
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const openai = new OpenAI()

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

interface CalendarEvent {
  summary?: string
  start: { dateTime?: string; date?: string }
  end:   { dateTime?: string; date?: string }
}

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
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '250',
  })
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? []) as CalendarEvent[]
}

async function getGoogleAccessToken(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
): Promise<string | null> {
  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .eq('is_active', true)
    .single()

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
    deadline,             // 'YYYY-MM-DD' or undefined
    calendar_mode,        // 'google' | 'pulse' | null
  } = await req.json()

  if (!name?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: 'Project name and description are required' },
      { status: 400 },
    )
  }

  const prefs = scheduling_preferences ?? {}
  const prefsLines = [
    prefs.preferred_time === 'morning'
      ? '- MORNINGS PREFERRED: Schedule tasks before noon (8am–12pm) whenever possible'
      : null,
    prefs.preferred_time === 'afternoon'
      ? '- AFTERNOONS PREFERRED: Keep mornings free, schedule tasks after noon (1pm–7pm)'
      : null,
    prefs.no_weekends === true
      ? '- NO WEEKENDS: Never schedule tasks on Saturday or Sunday'
      : null,
    prefs.no_weekends === false
      ? '- WEEKENDS OK: This project can use Saturday/Sunday time slots if needed'
      : null,
    prefs.style === 'spread'
      ? '- SPREAD OUT: Do not cluster many tasks on the same day. Spread across multiple days, max 2-3 tasks per day'
      : null,
    prefs.style === 'packed'
      ? '- PACKED DAYS OK: Full days of work are fine if it means having completely free days later'
      : null,
    prefs.max_hours_per_day ? `- Max ${prefs.max_hours_per_day} hours of project work per day` : null,
  ].filter(Boolean)

  const prefsCtx = prefsLines.length
    ? prefsLines.join('\n')
    : '  No specific preferences provided.'

  const existingTasksCtx = existing_tasks?.length
    ? existing_tasks.map((t: { title: string; due_at?: string; duration_minutes?: number; status?: string }) =>
        `  - "${t.title}" due:${t.due_at ?? 'none'} duration:${t.duration_minutes ?? '?'}min status:${t.status ?? 'pending'}`,
      ).join('\n')
    : '  No existing tasks.'

  // Fetch real Google Calendar events if calendar_mode === 'google'
  let calendarBusyCtx = '  No calendar connected — schedule freely.'
  if (calendar_mode === 'google') {
    const accessToken = await getGoogleAccessToken(supabase, user.id)
    if (accessToken) {
      const now = new Date()
      // Look 30 days ahead for scheduling
      const futureEnd = new Date(now.getTime() + 30 * 86400000)
      const events = await fetchGoogleCalendarEvents(
        accessToken,
        now.toISOString(),
        futureEnd.toISOString(),
      )
      if (events.length > 0) {
        const busyLines = events.slice(0, 100).map((e) => {
          const start = e.start.dateTime ?? e.start.date ?? ''
          const end = e.end.dateTime ?? e.end.date ?? ''
          const name = e.summary ?? 'Busy'
          return `  - "${name}" from ${start} to ${end}`
        })
        calendarBusyCtx = `The user's Google Calendar has these existing events (AVOID scheduling conflicts with these):\n${busyLines.join('\n')}`
      } else {
        calendarBusyCtx = '  Google Calendar connected but no upcoming events — schedule freely.'
      }
    } else {
      calendarBusyCtx = '  Google Calendar connection expired — schedule freely but note times may conflict.'
    }
  } else if (calendar_mode === 'pulse') {
    calendarBusyCtx = '  User uses Pulse as their calendar (no external calendar). Schedule based on existing Pulse tasks only.'
  }

  const systemPrompt = `You are a project planning assistant for Pulse, a personal AI lifestyle app.

Your job is to take a project description and generate a structured, actionable plan broken into sequential steps, each with concrete tasks.

Project name: "${name}"
Project description: "${description}"
${context ? `Additional context:\n${context}` : ''}

Scheduling preferences:
${prefsCtx}

Existing Pulse tasks (avoid scheduling conflicts with these):
${existingTasksCtx}

Calendar availability:
${calendarBusyCtx}

${deadline ? `DEADLINE: ${deadline} — ALL tasks MUST be scheduled BEFORE this date. This is a hard constraint. Plan backwards from the deadline to ensure everything fits.` : 'No deadline set — schedule at a comfortable pace.'}

Current date/time: ${new Date().toISOString()}

Instructions:
- Break the project into 2–8 logical steps (phases/milestones).
- Each step should have 1–6 concrete tasks.
- For each task, estimate realistic duration in minutes (minimum 15, maximum 480).
- Suggest scheduled_start and scheduled_end as ISO 8601 datetimes, respecting the user's scheduling preferences.
- CRITICAL: Do NOT schedule tasks during times that conflict with the user's calendar events listed above. Find free slots around existing events.
- Space tasks out reasonably — do not cram everything into one day.
- Schedule tasks during reasonable working hours (8am–7pm in the user's timezone) unless preferences say otherwise.
- Avoid scheduling conflicts with existing tasks.
- If a DEADLINE is specified above, NEVER schedule any task on or after the deadline date. All work must be completed before the deadline.
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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate a detailed project plan for: "${name}"\n\nDescription: ${description}${context ? `\n\nContext: ${context}` : ''}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) {
      return NextResponse.json({ error: 'AI did not return a response' }, { status: 500 })
    }

    const parsed = JSON.parse(raw)

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
