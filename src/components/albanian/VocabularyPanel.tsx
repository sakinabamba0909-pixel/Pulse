"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VocabWord {
  ghegWord: string;
  englishMeaning: string;
  partOfSpeech?: string;
  isNew: boolean;
}

interface VocabularyPanelProps {
  words: VocabWord[];
}

const audioCache = new Map<string, string>();

const partOfSpeechColors: Record<string, string> = {
  noun: "text-blue-400",
  verb: "text-purple-400",
  adjective: "text-amber-400",
  adverb: "text-pink-400",
  preposition: "text-teal-400",
  conjunction: "text-orange-400",
  pronoun: "text-cyan-400",
};

const containerVariants: import("framer-motion").Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 380, damping: 28 },
  },
};

function WordCard({ word }: { word: VocabWord }) {
  const [revealed, setRevealed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const posColor =
    partOfSpeechColors[word.partOfSpeech?.toLowerCase() ?? ""] ??
    "text-[var(--text-muted)]";

  const handleAudio = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        return;
      }

      const cacheKey = word.ghegWord.trim().toLowerCase();
      if (audioCache.has(cacheKey)) {
        const url = audioCache.get(cacheKey)!;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        setIsPlaying(true);
        audio.play().catch(() => setIsPlaying(false));
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/albanian/audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: word.ghegWord }),
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const url = data.audioDataUri;
        if (!url) throw new Error("No audio URL");
        audioCache.set(cacheKey, url);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        setIsLoading(false);
        setIsPlaying(true);
        audio.play().catch(() => setIsPlaying(false));
      } catch {
        setIsLoading(false);
      }
    },
    [word.ghegWord, isPlaying]
  );

  return (
    <motion.div
      variants={itemVariants}
      onClick={() => setRevealed((r) => !r)}
      className="
        relative rounded-xl border border-[var(--border)]
        bg-[var(--card)] p-3 cursor-pointer
        hover:border-[var(--accent)]/30
        transition-colors duration-200 group
        select-none
      "
    >
      {/* New badge */}
      {word.isNew && (
        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25 uppercase tracking-wider">
          New
        </span>
      )}

      {/* Albanian word + audio */}
      <div className="flex items-center gap-2 mb-1 pr-8">
        <button
          onClick={handleAudio}
          className={`
            shrink-0 w-6 h-6 rounded-full flex items-center justify-center
            transition-colors duration-150
            ${
              isPlaying
                ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10"
            }
          `}
        >
          {isLoading ? (
            <svg
              className="animate-spin"
              width={11}
              height={11}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="31.4"
                strokeDashoffset="10"
              />
            </svg>
          ) : (
            <svg
              width={11}
              height={11}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>

        <span className="text-[var(--text)] font-semibold text-sm leading-tight">
          {word.ghegWord}
        </span>
      </div>

      {/* Part of speech */}
      {word.partOfSpeech && (
        <p className={`text-[10px] font-medium uppercase tracking-wider mb-2 ${posColor}`}>
          {word.partOfSpeech}
        </p>
      )}

      {/* English meaning reveal */}
      <AnimatePresence>
        {revealed ? (
          <motion.p
            key="meaning"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-[var(--text-soft)] text-xs leading-snug overflow-hidden"
          >
            {word.englishMeaning}
          </motion.p>
        ) : (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[var(--text-muted)] text-xs italic"
          >
            tap to reveal
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function VocabularyPanel({ words }: VocabularyPanelProps) {
  if (words.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)] text-sm">
        No vocabulary words for this story yet.
      </div>
    );
  }

  const newCount = words.filter((w) => w.isNew).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[var(--text)] font-semibold text-sm">
          Vocabulary
        </h3>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{words.length} words</span>
          {newCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] font-medium">
              {newCount} new
            </span>
          )}
        </div>
      </div>

      {/* Tip */}
      <p className="text-xs text-[var(--text-muted)]">
        Click any word to reveal its meaning. Tap the speaker to hear pronunciation.
      </p>

      {/* Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2"
      >
        {words.map((word, i) => (
          <WordCard key={`${word.ghegWord}-${i}`} word={word} />
        ))}
      </motion.div>
    </div>
  );
}
