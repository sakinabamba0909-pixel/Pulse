'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StoryCard from '@/components/albanian/StoryCard';
import ProgressDashboard from '@/components/albanian/ProgressDashboard';
import PhaseNavigator from '@/components/albanian/PhaseNavigator';

interface Story {
  id: string;
  title: string;
  titleEnglish: string;
  weekNumber: number;
  phaseNumber: number;
  wordCount: number;
  difficultyLevel: string;
  targetVocabulary: string[];
  _count?: { paragraphs: number; questions: number };
}

interface Progress {
  currentPhase: number;
  currentWeek: number;
  totalListeningMinutes: number;
  streak: number;
  longestStreak: number;
  wordsLearned: number;
  phrasesMastered: number;
}

const PHASES = [
  { number: 1, name: 'Foundation', weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { number: 2, name: 'Communication', weeks: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24] },
  { number: 3, name: 'Fluency', weeks: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36] },
  { number: 4, name: 'Conversation', weeks: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48] },
];

export default function AlbanianHomePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [progress, setProgress] = useState<Progress>({
    currentPhase: 1,
    currentWeek: 1,
    totalListeningMinutes: 0,
    streak: 0,
    longestStreak: 0,
    wordsLearned: 0,
    phrasesMastered: 0,
  });
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [storiesRes, progressRes] = await Promise.all([
          fetch('/api/albanian/stories'),
          fetch('/api/albanian/progress'),
        ]);
        if (storiesRes.ok) {
          const data = await storiesRes.json();
          setStories(data.stories || data || []);
        }
        if (progressRes.ok) {
          const data = await progressRes.json();
          if (data && data.currentPhase) {
            setProgress(data);
            setSelectedPhase(data.currentPhase);
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredStories = stories.filter((s) => s.phaseNumber === selectedPhase);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#E8ECF1]">
      {/* Header */}
      <header className="border-b border-[#232A33] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Crimson Pro', 'Instrument Serif', Georgia, serif" }}>
              Mëso Shqip
            </h1>
            <p className="text-sm text-[#5A6577] mt-0.5">Kosovo Albanian Immersion</p>
          </div>
          <nav className="flex items-center gap-4">
            <a href="/albanian/review" className="text-sm text-[#8B95A3] hover:text-[#6EE7A0] transition-colors">
              Review
            </a>
            <a href="/albanian/progress" className="text-sm text-[#8B95A3] hover:text-[#6EE7A0] transition-colors">
              Progress
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress Overview */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <ProgressDashboard progress={progress} />
        </motion.section>

        {/* Phase Navigator */}
        <section className="mb-8">
          <PhaseNavigator
            currentPhase={progress.currentPhase}
            currentWeek={progress.currentWeek}
            phases={PHASES}
            selectedPhase={selectedPhase}
            onPhaseChange={setSelectedPhase}
          />
        </section>

        {/* Story Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-[#E8ECF1]">
              {PHASES.find((p) => p.number === selectedPhase)?.name} Stories
            </h2>
            <span className="text-sm text-[#5A6577]">
              {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-xl bg-[#13171C] animate-pulse" />
              ))}
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#5A6577] text-lg">No stories available for this phase yet.</p>
              <p className="text-[#3A4557] text-sm mt-2">Stories are being crafted for your journey.</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.08 } },
              }}
            >
              {filteredStories.map((story) => (
                <motion.div
                  key={story.id}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <StoryCard story={story} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}
