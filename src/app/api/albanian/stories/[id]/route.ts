import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        paragraphs: { orderBy: { orderIndex: 'asc' } },
        questions: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json(story);
  } catch {
    return NextResponse.json(
      { error: 'Story not found', _dev: 'database unavailable' },
      { status: 404 }
    );
  }
}
