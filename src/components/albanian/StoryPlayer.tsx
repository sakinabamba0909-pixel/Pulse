"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AudioButton from "./AudioButton";

interface Paragraph {
  id: string;
  ghegText: string;
  englishText: string;
  audioUrl?: string | null;
  orderIndex: number;
}

interface Story {
  id: string;
  title: string;
  titleEnglish: string;
  paragraphs: Paragraph[];
}

interface StoryPlayerProps {
  story: Story;
}

const SPEEDS = [
  { label: "0.6×", value: 0.6 },
  { label: "0.85×", value: 0.85 },
  { label: "1.0×", value: 1.0 },
];

const audioCache = new Map<string, string>();

async function fetchAudio(text: string): Promise<string> {
  const key = text.trim();
  if (audioCache.has(key)) return audioCache.get(key)!;
  const res = await fetch("/api/albanian/audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Audio generation failed");
  const data = await res.json();
  const url = data.audioDataUri;
  if (!url) throw new Error("No audio URL returned");
  audioCache.set(key, url);
  return url;
}

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const sorted = [...story.paragraphs].sort((a, b) => a.orderIndex - b.orderIndex);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [speed, setSpeed] = useState(0.85);
  const [loop, setLoop] = useState(true);
  const [listenCount, setListenCount] = useState(0);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stoppedRef = useRef(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const stopPlayback = useCallback(() => {
    stoppedRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentIndex(null);
    setIsLoadingFull(false);
  }, []);

  const recordListen = useCallback(async () => {
    setListenCount((c) => c + 1);
    try {
      await fetch("/api/albanian/progress/listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: story.id }),
      });
    } catch {
      // non-critical
    }
  }, [story.id]);

  const playFullStory = useCallback(async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    stoppedRef.current = false;
    setIsPlaying(true);
    setIsLoadingFull(true);

    const playFrom = async (idx: number) => {
      if (stoppedRef.current || idx >= sorted.length) {
        if (!stoppedRef.current) {
          // finished one full run
          await recordListen();
          if (loop && !stoppedRef.current) {
            playFrom(0);
          } else {
            setIsPlaying(false);
            setCurrentIndex(null);
            setIsLoadingFull(false);
          }
        }
        return;
      }

      const para = sorted[idx];
      setCurrentIndex(idx);
      setIsLoadingFull(false);

      try {
        const url = await fetchAudio(para.ghegText);
        if (stoppedRef.current) return;

        const audio = new Audio(url);
        audio.playbackRate = speedRef.current;
        audioRef.current = audio;

        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });

        if (!stoppedRef.current) {
          playFrom(idx + 1);
        }
      } catch {
        if (!stoppedRef.current) {
          playFrom(idx + 1);
        }
      }
    };

    playFrom(0);
  }, [isPlaying, sorted, loop, stopPlayback, recordListen]);

  // Sync playback rate when speed changes mid-playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Story header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--text)]">{story.title}</h1>
        <p className="text-[var(--text-muted)] text-sm">{story.titleEnglish}</p>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Play / Pause */}
        <motion.button
          onClick={playFullStory}
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.04 }}
          disabled={isLoadingFull}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
            transition-colors duration-200 focus:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--accent)]
            ${
              isPlaying
                ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40"
                : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            }
          `}
        >
          {isLoadingFull ? (
            <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
            </svg>
          ) : isPlaying ? (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
          {isLoadingFull ? "Loading…" : isPlaying ? "Pause" : "Play Story"}
        </motion.button>

        {/* Speed buttons */}
        <div className="flex items-center gap-1 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSpeed(s.value)}
              className={`
                px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150
                ${
                  speed === s.value
                    ? "bg-[var(--card)] text-[var(--accent)] border border-[var(--accent)]/30"
                    : "text-[var(--text-muted)] hover:text-[var(--text-soft)]"
                }
              `}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Loop toggle */}
        <button
          onClick={() => setLoop((l) => !l)}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            border transition-colors duration-150
            ${
              loop
                ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30"
                : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-soft)]"
            }
          `}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          Loop
        </button>

        {/* Listen counter */}
        {listenCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] ml-auto"
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <span>
              {listenCount} {listenCount === 1 ? "listen" : "listens"}
            </span>
          </motion.div>
        )}
      </div>

      {/* Paragraphs */}
      <div className="space-y-3">
        {sorted.map((para, idx) => {
          const isActive = currentIndex === idx;
          const isRevealed = revealedIds.has(para.id);

          return (
            <motion.div
              key={para.id}
              layout
              className={`
                relative rounded-xl border transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? "border-[var(--accent)]/60 bg-[var(--accent)]/5 border-l-4 border-l-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/30"
                }
              `}
            >
              <div className="p-4 pr-14">
                {/* Albanian text with audio button */}
                <div className="flex items-start gap-3">
                  <div
                    onClick={() => toggleReveal(para.id)}
                    className="flex-1 min-w-0"
                  >
                    <p
                      className={`
                        text-xl leading-relaxed font-medium select-none
                        ${isActive ? "text-[var(--text)]" : "text-[var(--text)]"}
                      `}
                    >
                      {para.ghegText}
                    </p>
                  </div>
                </div>

                {/* English translation (revealed on tap) */}
                <AnimatePresence>
                  {isRevealed && (
                    <motion.p
                      key="translation"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="text-sm text-[var(--text-soft)] italic leading-relaxed overflow-hidden border-t border-[var(--border)] pt-2"
                    >
                      {para.englishText}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Reveal hint */}
                <AnimatePresence>
                  {!isRevealed && (
                    <motion.p
                      key="hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => toggleReveal(para.id)}
                      className="text-[10px] text-[var(--text-muted)] mt-2 select-none"
                    >
                      tap to reveal translation
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Per-paragraph audio button */}
              <div className="absolute right-3 top-3">
                <AudioButton text={para.ghegText} size="sm" />
              </div>

              {/* Active indicator pulse */}
              {isActive && (
                <motion.span
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[var(--accent)]"
                  layoutId="active-bar"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Tip */}
      <p className="text-xs text-[var(--text-muted)] text-center pb-2">
        Tap any paragraph to show the English translation · speaker icon plays that paragraph alone
      </p>
    </div>
  );
}
