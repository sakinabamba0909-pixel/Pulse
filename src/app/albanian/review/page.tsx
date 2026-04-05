'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AudioButton from '@/components/albanian/AudioButton';

interface VocabWord {
  id: string;
  ghegWord: string;
  englishMeaning: string;
  partOfSpeech: string | null;
  exampleSentence: string | null;
  frequency: string;
  introducedWeek: number;
}

export default function ReviewPage() {
  const router = useRouter();
  const [vocabulary, setVocabulary] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState<'browse' | 'review'>('browse');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/albanian/vocabulary');
        if (res.ok) {
          const data = await res.json();
          setVocabulary(data.vocabulary || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const currentWord = vocabulary[currentIndex];

  const nextWord = () => {
    setRevealed(false);
    setCurrentIndex((prev) => (prev + 1) % vocabulary.length);
  };

  const prevWord = () => {
    setRevealed(false);
    setCurrentIndex((prev) => (prev - 1 + vocabulary.length) % vocabulary.length);
  };

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
            Vocabulary Review
          </h1>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setReviewMode('browse')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                reviewMode === 'browse' ? 'bg-[#6EE7A0]/10 text-[#6EE7A0]' : 'text-[#5A6577] hover:text-[#8B95A3]'
              }`}
            >
              Browse
            </button>
            <button
              onClick={() => setReviewMode('review')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                reviewMode === 'review' ? 'bg-[#6EE7A0]/10 text-[#6EE7A0]' : 'text-[#5A6577] hover:text-[#8B95A3]'
              }`}
            >
              Flashcards
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#6EE7A0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vocabulary.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#5A6577] text-lg">No vocabulary loaded yet.</p>
            <p className="text-[#3A4557] text-sm mt-2">Start listening to stories to build your vocabulary.</p>
          </div>
        ) : reviewMode === 'browse' ? (
          /* Browse Mode - Grid of all words */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {vocabulary.map((word, i) => (
              <motion.div
                key={word.id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="p-4 rounded-xl border border-[#232A33] bg-[#13171C] hover:border-[#6EE7A0]/20 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-medium" style={{ fontFamily: "'Crimson Pro', 'Instrument Serif', Georgia, serif" }}>
                      {word.ghegWord}
                    </p>
                    <p className="text-sm text-[#5A6577] mt-1 group-hover:text-[#8B95A3] transition-colors">
                      {word.englishMeaning}
                    </p>
                    {word.partOfSpeech && (
                      <span className="text-xs text-[#3A4557] mt-1 inline-block">{word.partOfSpeech}</span>
                    )}
                  </div>
                  <AudioButton text={word.ghegWord} size="sm" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Flashcard Review Mode */
          <div className="flex flex-col items-center">
            <div className="text-sm text-[#5A6577] mb-6">
              {currentIndex + 1} / {vocabulary.length}
            </div>

            {currentWord && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md"
                >
                  <div
                    onClick={() => setRevealed(!revealed)}
                    className="p-8 rounded-2xl border border-[#232A33] bg-[#13171C] cursor-pointer hover:border-[#6EE7A0]/20 transition-all min-h-[240px] flex flex-col items-center justify-center text-center"
                  >
                    <p
                      className="text-3xl font-semibold mb-2"
                      style={{ fontFamily: "'Crimson Pro', 'Instrument Serif', Georgia, serif" }}
                    >
                      {currentWord.ghegWord}
                    </p>

                    <AudioButton text={currentWord.ghegWord} size="md" className="mb-4" />

                    <AnimatePresence>
                      {revealed ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="mt-4"
                        >
                          <p className="text-xl text-[#8B95A3]">{currentWord.englishMeaning}</p>
                          {currentWord.partOfSpeech && (
                            <p className="text-sm text-[#5A6577] mt-1">{currentWord.partOfSpeech}</p>
                          )}
                          {currentWord.exampleSentence && (
                            <p className="text-sm text-[#5A6577] mt-3 italic">{currentWord.exampleSentence}</p>
                          )}
                        </motion.div>
                      ) : (
                        <p className="text-sm text-[#3A4557] mt-4">Tap to reveal meaning</p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={prevWord}
                className="px-6 py-3 rounded-xl border border-[#232A33] bg-[#13171C] text-[#8B95A3] hover:border-[#6EE7A0]/20 hover:text-[#E8ECF1] transition-all"
              >
                Previous
              </button>
              <button
                onClick={nextWord}
                className="px-6 py-3 rounded-xl bg-[#6EE7A0]/10 text-[#6EE7A0] hover:bg-[#6EE7A0]/20 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
