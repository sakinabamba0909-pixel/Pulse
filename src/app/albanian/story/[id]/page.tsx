'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import StoryPlayer from '@/components/albanian/StoryPlayer';
import VocabularyPanel from '@/components/albanian/VocabularyPanel';
import QuestionPanel from '@/components/albanian/QuestionPanel';

interface Paragraph {
  id: string;
  ghegText: string;
  englishText: string;
  audioUrl: string | null;
  orderIndex: number;
  vocabularyIds: string[];
}

interface Question {
  id: string;
  questionGheg: string;
  questionEnglish: string;
  sampleAnswers: string[];
  orderIndex: number;
}

interface Story {
  id: string;
  title: string;
  titleEnglish: string;
  weekNumber: number;
  phaseNumber: number;
  difficultyLevel: string;
  wordCount: number;
  targetVocabulary: string[];
  paragraphs: Paragraph[];
  questions: Question[];
}

type Tab = 'listen' | 'vocabulary' | 'questions';

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('listen');

  useEffect(() => {
    async function loadStory() {
      try {
        const res = await fetch(`/api/albanian/stories/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setStory(data);
        }
      } catch (err) {
        console.error('Failed to load story:', err);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) loadStory();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6EE7A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#5A6577]">
        <div className="text-center">
          <p className="text-lg mb-4">Story not found</p>
          <button
            onClick={() => router.push('/albanian')}
            className="text-[#6EE7A0] hover:underline"
          >
            Back to stories
          </button>
        </div>
      </div>
    );
  }

  const vocabularyWords = story.targetVocabulary.map((word, i) => ({
    ghegWord: word,
    englishMeaning: '',
    partOfSpeech: undefined,
    isNew: i < 5,
  }));

  const tabs: { key: Tab; label: string }[] = [
    { key: 'listen', label: 'Listen' },
    { key: 'vocabulary', label: 'Vocabulary' },
    { key: 'questions', label: 'Questions' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#E8ECF1]">
      {/* Header */}
      <header className="border-b border-[#232A33] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => router.push('/albanian')}
              className="text-[#8B95A3] hover:text-[#E8ECF1] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex-1">
              <h1
                className="text-xl font-semibold"
                style={{ fontFamily: "'Crimson Pro', 'Instrument Serif', Georgia, serif" }}
              >
                {story.title}
              </h1>
              <p className="text-sm text-[#5A6577]">{story.titleEnglish}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-[#6EE7A0]/10 text-[#6EE7A0]">
                Phase {story.phaseNumber}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-[#232A33] text-[#8B95A3]">
                Week {story.weekNumber}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#6EE7A0]/10 text-[#6EE7A0]'
                    : 'text-[#5A6577] hover:text-[#8B95A3] hover:bg-[#13171C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'listen' && (
            <motion.div
              key="listen"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <StoryPlayer story={story} />
            </motion.div>
          )}

          {activeTab === 'vocabulary' && (
            <motion.div
              key="vocabulary"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <VocabularyPanel words={vocabularyWords} />
            </motion.div>
          )}

          {activeTab === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <QuestionPanel questions={story.questions} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
