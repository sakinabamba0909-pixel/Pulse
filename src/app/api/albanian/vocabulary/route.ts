import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get('week');

  try {
    const where: Record<string, number> = {};
    if (weekParam) where.introducedWeek = parseInt(weekParam, 10);

    const [vocabulary, total] = await prisma.$transaction([
      prisma.vocabulary.findMany({
        where,
        orderBy: [{ introducedWeek: 'asc' }, { ghegWord: 'asc' }],
      }),
      prisma.vocabulary.count({ where }),
    ]);

    return NextResponse.json({ vocabulary, total });
  } catch {
    return NextResponse.json({ vocabulary: [], total: 0, _dev: 'database unavailable' });
  }
}
