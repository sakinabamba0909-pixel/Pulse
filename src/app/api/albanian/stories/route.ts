import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phaseNumber = searchParams.get('phaseNumber');
  const weekNumber = searchParams.get('weekNumber');

  try {
    const where: Record<string, number> = {};
    if (phaseNumber) where.phaseNumber = parseInt(phaseNumber, 10);
    if (weekNumber) where.weekNumber = parseInt(weekNumber, 10);

    const stories = await prisma.story.findMany({
      where,
      orderBy: [{ phaseNumber: 'asc' }, { weekNumber: 'asc' }],
      include: {
        _count: {
          select: { paragraphs: true, questions: true },
        },
      },
    });

    return NextResponse.json({ stories, total: stories.length });
  } catch {
    return NextResponse.json({ stories: [], total: 0, _dev: 'database unavailable' });
  }
}
