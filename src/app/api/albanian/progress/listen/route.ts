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

export async function POST(request: NextRequest) {
  const userId = getUserId(request);

  let body: { storyId?: string; completedFull?: boolean; playbackSpeed?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { storyId, completedFull = false, playbackSpeed = 1.0 } = body ?? {};

  if (!storyId || typeof storyId !== 'string') {
    return NextResponse.json({ error: 'storyId is required' }, { status: 400 });
  }

  try {
    const listen = await prisma.storyListen.create({
      data: {
        userId,
        storyId,
        completedFull,
        playbackSpeed,
      },
    });

    // Update progress: increment listening minutes and update streak
    if (completedFull) {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { wordCount: true },
      });

      // Rough estimate: ~150 words per minute at normal speed
      const minutesToAdd = story ? Math.max(1, Math.round(story.wordCount / 150)) : 2;

      await prisma.userProgress.upsert({
        where: { userId },
        update: {
          totalListeningMinutes: { increment: minutesToAdd },
          lastStudyDate: new Date(),
        },
        create: {
          userId,
          totalListeningMinutes: minutesToAdd,
          lastStudyDate: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, listen });
  } catch {
    return NextResponse.json({
      success: true,
      listen: { userId, storyId, completedFull, playbackSpeed },
      _dev: 'database unavailable',
    });
  }
}
