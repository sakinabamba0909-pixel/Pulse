import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-0',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Today is ${dayName}, ${todayStr}. Parse this task description into structured JSON.

Return ONLY a valid JSON object with these exact fields:
- "title": string — clean, concise task name (remove time/priority words)
- "due_at": string|null — ISO 8601 datetime (e.g. "2024-01-15T14:00:00"). Infer from "tomorrow", "Friday", "next week", "afternoon" (14:00), "morning" (09:00), etc. If no date mentioned, null.
- "priority": "urgent"|"high"|"normal"|"low" — infer from words like "urgent", "important", "asap", "high priority", etc. Default "normal".
- "duration_minutes": number|null — estimated duration in minutes. Infer from "quick call" (15), "meeting" (60), etc. null if unclear.
- "notes": string|null — any extra context or details, null if none.

Task description: "${text.replace(/"/g, "'")}"

JSON only, no explanation:`
      }]
    })

    const raw = response.content[0]
    if (raw.type !== 'text') return NextResponse.json({ error: 'Parse failed' }, { status: 500 })

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = raw.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'No JSON found' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Parse error:', err)
    return NextResponse.json({ error: 'Failed to parse task' }, { status: 500 })
  }
}
