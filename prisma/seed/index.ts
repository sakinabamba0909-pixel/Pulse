import { PrismaClient } from '@prisma/client';
import { stories } from './stories';
import { vocabulary } from './vocabulary';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.userResponse.deleteMany();
  await prisma.storyListen.deleteMany();
  await prisma.userVocabulary.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.question.deleteMany();
  await prisma.paragraph.deleteMany();
  await prisma.story.deleteMany();
  await prisma.vocabulary.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      id: 'demo-user',
      email: 'demo@mesoshqip.app',
      name: 'Demo User',
    },
  });
  console.log(`Created demo user: ${demoUser.email}`);

  // Create demo user progress
  await prisma.userProgress.create({
    data: {
      userId: demoUser.id,
      currentPhase: 1,
      currentWeek: 1,
    },
  });

  // Seed vocabulary
  let vocabCount = 0;
  for (const word of vocabulary) {
    await prisma.vocabulary.create({
      data: {
        ghegWord: word.ghegWord,
        englishMeaning: word.englishMeaning,
        partOfSpeech: word.partOfSpeech,
        exampleSentence: word.exampleSentence,
        introducedWeek: word.introducedWeek,
        frequency: word.frequency,
      },
    });
    vocabCount++;
  }
  console.log(`Seeded ${vocabCount} vocabulary words.`);

  // Seed stories with paragraphs and questions
  let storyCount = 0;
  for (const storyData of stories) {
    const story = await prisma.story.create({
      data: {
        title: storyData.title,
        titleEnglish: storyData.titleEnglish,
        weekNumber: storyData.weekNumber,
        phaseNumber: storyData.phaseNumber,
        difficultyLevel: storyData.difficultyLevel,
        wordCount: storyData.wordCount,
        targetVocabulary: storyData.targetVocabulary,
        paragraphs: {
          create: storyData.paragraphs.map((p) => ({
            orderIndex: p.orderIndex,
            ghegText: p.ghegText,
            englishText: p.englishText,
            vocabularyIds: p.vocabularyIds,
          })),
        },
        questions: {
          create: storyData.questions.map((q) => ({
            orderIndex: q.orderIndex,
            questionGheg: q.questionGheg,
            questionEnglish: q.questionEnglish,
            sampleAnswers: q.sampleAnswers,
          })),
        },
      },
    });
    storyCount++;
    console.log(`  Created story: "${story.title}" (Week ${story.weekNumber})`);
  }

  console.log(`\nSeeded ${storyCount} stories.`);
  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
