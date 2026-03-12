import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    text,
    timezone,
    current_datetime,
    existing_projects,
    existing_relationships,
  } = await req.json()

  if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const now = current_datetime || new Date().toISOString()
  const tz  = timezone || 'UTC'

  const projectsCtx = existing_projects?.length
    ? existing_projects.map((p: any) => `  - id:"${p.id}"  name:"${p.name}"  category:"${p.category || 'general'}"`).join('\n')
    : '  (none)'

  const contactsCtx = existing_relationships?.length
    ? existing_relationships.map((r: any) => `  - id:"${r.id}"  name:"${r.person_name}"`).join('\n')
    : '  (none)'

  const system = `You are a task-parsing assistant for Pulse, a personal AI assistant.

Current time: ${now}
User timezone: ${tz}

Available projects:
${projectsCtx}

Known contacts:
${contactsCtx}

Rules:
- Extract EVERY task the user mentions, even casually. "call mom and pick up milk" = 2 tasks.
- Resolve relative dates using the current time and timezone:
    "tomorrow" = next calendar day
    "this Saturday" / "next Saturday" = nearest upcoming Saturday
    "morning" = 09:00, "afternoon" = 14:00, "evening" = 18:00, "tonight" = 20:00
    "by [day]" or "on [day]" = end of that day (23:59)
    "before [day]" = the day BEFORE that day at 23:59 (e.g. "before Friday" → Thursday 23:59, "before the weekend" → Friday 23:59)
    "end of the week" = Friday 23:59
- priority: "urgent" or "normal" or "low" ONLY — three levels only. Set only if explicitly signalled ("urgent", "ASAP", "not important", "low priority"). Otherwise null.
- duration_minutes: set ONLY when explicitly stated ("30-min call", "takes about an hour"). Otherwise null.
- project_id: match to the CLOSEST existing project by context. Only match if confident. Use exact id from the list.
- relationship_id: if a person is mentioned (by name OR relation like "mom", "boss"), match to the closest contact. Use exact id.
- is_commitment: true when the user says they TOLD someone, PROMISED, or committed ("I told X I'd...", "I promised to...").
- subtasks: if the task is complex and would naturally break into clear steps (3–5 subtasks max), list them. Otherwise omit or use empty array.
    Examples of tasks that warrant subtasks: "prepare presentation", "plan birthday party", "apply for visa", "move apartments".
    Examples that don't: "call dentist", "buy milk", "send email".
- suggestions: 0–2 per task, only the truly useful ones:
    {"type":"reminder","text":"Set a morning reminder?"} — if task has a due date
    {"type":"link_contact","text":"Link to [name] in contacts?"} — if person mentioned but no relationship match
    {"type":"block_time","text":"Block time to work on this?"} — if duration > 30 min and no schedule set
- speech_reply: ONE short sentence spoken confirmation, e.g. "Got it — added 2 tasks for this week."

Return ONLY valid JSON. No markdown, no explanation.`

  const schema = `{
  "tasks": [
    {
      "title": "string",
      "due_at": "ISO 8601 datetime or null",
      "priority": "urgent|normal|low|null",
      "duration_minutes": "number or null",
      "project_id": "string (exact id) or null",
      "relationship_id": "string (exact id) or null",
      "is_commitment": "boolean",
      "subtasks": ["string", "string"],
      "suggestions": [{"type": "reminder|link_contact|block_time", "text": "string"}]
    }
  ],
  "speech_reply": "string"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system,
      messages: [{
        role: 'user',
        content: `Input: "${text.replace(/"/g, "'")}"\n\nReturn JSON matching:\n${schema}`,
      }],
    })

    const raw = response.content[0]
    if (raw.type !== 'text') return NextResponse.json({ error: 'Parse failed' }, { status: 500 })

    const jsonMatch = raw.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'No JSON found' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])

    // Normalise: ensure tasks is always an array
    if (!Array.isArray(parsed.tasks)) {
      parsed.tasks = [{ title: parsed.title, due_at: parsed.due_at ?? null, priority: parsed.priority ?? null,
        duration_minutes: parsed.duration_minutes ?? null, notes: parsed.notes ?? null,
        project_id: parsed.project_id ?? null, relationship_id: parsed.relationship_id ?? null,
        is_commitment: parsed.is_commitment ?? false, subtasks: parsed.subtasks ?? [],
        suggestions: parsed.suggestions ?? [] }]
    }

    // Validate project_id / relationship_id against actual lists (prevent hallucination)
    const validProjectIds = new Set((existing_projects ?? []).map((p: any) => p.id))
    const validContactIds  = new Set((existing_relationships ?? []).map((r: any) => r.id))
    parsed.tasks = parsed.tasks.map((t: any) => ({
      ...t,
      subtasks:        Array.isArray(t.subtasks) ? t.subtasks.filter((s: any) => typeof s === 'string') : [],
      project_id:      validProjectIds.has(t.project_id) ? t.project_id : null,
      relationship_id: validContactIds.has(t.relationship_id) ? t.relationship_id : null,
    }))

    return NextResponse.json({
      tasks:        parsed.tasks,
      speech_reply: parsed.speech_reply ?? null,
    })
  } catch (err) {
    console.error('Parse error:', err)
    return NextResponse.json({ error: 'Failed to parse task' }, { status: 500 })
  }
}
