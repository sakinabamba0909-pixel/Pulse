import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { evaluateAnswer } from '@/services/audioService';

export async function POST(request: NextRequest) {
  let body: { questionId?: string; userAnswer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { questionId, userAnswer } = body ?? {};

  if (!questionId || typeof questionId !== 'string') {
    return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
  }
  if (!userAnswer || typeof userAnswer !== 'string' || userAnswer.trim().length === 0) {
    return NextResponse.json({ error: 'userAnswer is required' }, { status: 400 });
  }

  let questionGheg = '';
  let sampleAnswers: string[] = [];

  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { questionGheg: true, sampleAnswers: true },
    });

    if (question) {
      questionGheg = question.questionGheg;
      sampleAnswers = question.sampleAnswers;
    }
  } catch {
    // DB unavailable - use placeholder
    questionGheg = '(question unavailable)';
    sampleAnswers = [];
  }

  try {
    const result = await evaluateAnswer(questionGheg, userAnswer.trim(), sampleAnswers);
    return NextResponse.json(result);
  } catch (err) {
    // If OpenAI is unavailable, return basic feedback
    return NextResponse.json({
      feedback: 'Good attempt! Keep practicing with the stories.',
      suggestedAnswer: sampleAnswers[0] || userAnswer,
      isUnderstandable: true,
      _dev: err instanceof Error ? err.message : 'evaluation unavailable',
    });
  }
}
