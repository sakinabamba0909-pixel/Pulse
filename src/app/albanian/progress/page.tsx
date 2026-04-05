'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProgressDashboard from '@/components/albanian/ProgressDashboard';

interface Progress {
  currentPhase: number;
  currentWeek: number;
  totalListeningMinutes: number;
  streak: number;
  longestStreak: number;
  wordsLearned: number;
  phrasesMastered: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress>({
    currentPhase: 1,
    currentWeek: 1,
    totalListeningMinutes: 0,
    streak: 0,
    longestStreak: 0,
    wordsLearned: 0,
    phrasesMastered: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/albanian/progress');
        if (res.ok) {
          const data = await res.json();
          if (data.currentPhase) setProgress(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const phaseNames = ['', 'Foundation', 'Communication', 'Fluency', 'Conversation'];
  const phaseDescriptions = [
    '',
    'Building your base with greetings, family, food, and daily life.',
    'Shopping, work, past tense, making plans and arrangements.',
    'Storytelling, opinions, detailed descriptions of the world.',
    'Natural conversations about culture, life, and everything.',
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#E8ECF1]">
      <header className="border-b border-[#232A33] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/albanian')}
            className="text-[#8B95A3] hover:text-[#E8ECF1] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold" style={{ fontFamily: "'Crimson Pro', 'Instrument Serif', Georgia, serif" }}>
            Your Journey
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <ProgressDashboard progress={progress} />

        {/* Phase Progress */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-medium mb-4">Phase Progress</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((phase) => {
              const isActive = phase === progress.currentPhase;
              const isComplete = phase < progress.currentPhase;
              const isLocked = phase > progress.currentPhase;

              return (
                <div
                  key={phase}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'border-[#6EE7A0]/30 bg-[#6EE7A0]/5'
                      : isComplete
                      ? 'border-[#232A33] bg-[#13171C]'
                      : 'border-[#1a1f26] bg-[#0d1015] opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-[#6EE7A0]/20 text-[#6EE7A0]'
                              : isComplete
                              ? 'bg-[#232A33] text-[#8B95A3]'
                              : 'bg-[#1a1f26] text-[#3A4557]'
                          }`}
                        >
                          Phase {phase}
                        </span>
                        {isActive && (
                          <span className="text-xs text-[#6EE7A0]">Current</span>
                        )}
                        {isComplete && (
                          <span className="text-xs text-[#8B95A3]">Complete</span>
                        )}
                        {isLocked && (
                          <span className="text-xs text-[#3A4557]">Locked</span>
                        )}
                      </div>
                      <h3 className="font-medium mt-1">{phaseNames[phase]}</h3>
                      <p className="text-sm text-[#5A6577] mt-0.5">{phaseDescriptions[phase]}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Tips */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-xl border border-[#232A33] bg-[#13171C]"
        >
          <h2 className="text-lg font-medium mb-3">How to Learn</h2>
          <ul className="space-y-2 text-sm text-[#8B95A3]">
            <li className="flex items-start gap-2">
              <span className="text-[#6EE7A0] mt-0.5">1.</span>
              <span>Listen to each story 5-10+ times before moving on. Repetition is the key.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6EE7A0] mt-0.5">2.</span>
              <span>Only reveal translations when you&apos;re stuck. Try to understand from context first.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6EE7A0] mt-0.5">3.</span>
              <span>Don&apos;t rush through stories. Deep understanding beats fast progress.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6EE7A0] mt-0.5">4.</span>
              <span>Answer comprehension questions in Albanian, even if imperfect. Output matters.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6EE7A0] mt-0.5">5.</span>
              <span>Focus on listening time, not completion. Your brain acquires language through exposure.</span>
            </li>
          </ul>
        </motion.section>
      </main>
    </div>
  );
}
