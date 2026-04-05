import { NextRequest, NextResponse } from 'next/server';
import { generateAudioBase64 } from '@/services/audioService';

export async function POST(request: NextRequest) {
  let body: { text?: string; voice?: string; speed?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, voice, speed } = body ?? {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  try {
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
    const selectedVoice = validVoices.includes(voice as typeof validVoices[number])
      ? (voice as typeof validVoices[number])
      : 'nova';
    const selectedSpeed = typeof speed === 'number' && speed >= 0.25 && speed <= 4.0 ? speed : 0.85;

    const base64 = await generateAudioBase64(text, selectedVoice, selectedSpeed);
    const dataUri = `data:audio/mpeg;base64,${base64}`;

    return NextResponse.json({ audioDataUri: dataUri });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audio generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
