import OpenAI from 'openai';
import crypto from 'crypto';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// In-memory cache of hash -> base64 audio
const audioBase64Cache = new Map<string, string>();

function getAudioHash(text: string, voice: string, speed: number): string {
  return crypto
    .createHash('md5')
    .update(`${text}-${voice}-${speed}`)
    .digest('hex');
}

export async function generateAlbanianAudio(
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova',
  speed: number = 0.85
): Promise<Buffer> {
  const mp3 = await getOpenAI().audio.speech.create({
    model: 'tts-1-hd',
    voice: voice,
    input: text,
    speed: speed,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  return buffer;
}

export async function generateAudioBase64(
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova',
  speed: number = 0.85
): Promise<string> {
  const hash = getAudioHash(text, voice, speed);

  const cached = audioBase64Cache.get(hash);
  if (cached) return cached;

  const buffer = await generateAlbanianAudio(text, voice, speed);
  const base64 = buffer.toString('base64');
  audioBase64Cache.set(hash, base64);
  return base64;
}

export async function evaluateAnswer(
  questionGheg: string,
  userAnswer: string,
  sampleAnswers: string[]
): Promise<{ feedback: string; suggestedAnswer: string; isUnderstandable: boolean }> {
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a Kosovo Albanian language tutor specializing in Gheg dialect. Evaluate the user's Albanian response and provide gentle, encouraging feedback. Always provide a more natural way to express their idea in Kosovo Gheg dialect. Respond in JSON format with fields: feedback (string, in English), suggestedAnswer (string, in Gheg Albanian), isUnderstandable (boolean).`,
      },
      {
        role: 'user',
        content: `Question (Gheg): ${questionGheg}
User's answer: ${userAnswer}
Expected answers: ${sampleAnswers.join(', ')}

Evaluate if the answer is understandable and provide a more natural Kosovo Gheg way to say it.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{}';
  try {
    return JSON.parse(content);
  } catch {
    return {
      feedback: 'Good attempt! Keep practicing.',
      suggestedAnswer: sampleAnswers[0] || userAnswer,
      isUnderstandable: true,
    };
  }
}
