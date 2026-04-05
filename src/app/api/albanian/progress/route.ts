import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

const DEMO_USER_ID = 'demo-user';

function getUserId(request: NextRequest): string {
  return (
    request.headers.get('x-user-id') ??
    new URL(request.url).searchParams.get('userId') ??
    DEMO_USER_ID
  );
}

const MOCK_PROGRESS = {
  currentPhase: 1,
  currentWeek: 1,
  currentStoryId: null,
  totalListeningMinutes: 0,
  streak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  wordsLearned: 0,
  phrasesMastered: 0,
};

export async function GET(request: NextRequest) {
  const userId = getUserId(request);

  try {
    let progress = await prisma.userProgress.findUnique({ where: { userId } });

    if (!progress) {
      progress = await prisma.userProgress.create({
        data: { userId },
      });
    }

    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({ ...MOCK_PROGRESS, _dev: 'database unavailable' });
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const allowed = [
    'currentPhase', 'currentWeek', 'currentStoryId',
    'totalListeningMinutes', 'streak', 'longestStreak',
    'lastStudyDate', 'wordsLearned', 'phrasesMastered',
  ] as const;

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  try {
    const progress = await prisma.userProgress.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data } as Parameters<typeof prisma.userProgress.create>[0]['data'],
    });
    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({ ...MOCK_PROGRESS, ...data, _dev: 'database unavailable' });
  }
}
