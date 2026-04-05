"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AudioButtonProps {
  text: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const audioCache = new Map<string, string>();

const sizeConfig = {
  sm: { button: "w-7 h-7", icon: 14, ripple: "w-5 h-5" },
  md: { button: "w-9 h-9", icon: 18, ripple: "w-7 h-7" },
  lg: { button: "w-11 h-11", icon: 22, ripple: "w-9 h-9" },
};

export default function AudioButton({
  text,
  size = "md",
  className = "",
}: AudioButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const config = sizeConfig[size];

  const handlePlay = useCallback(async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setHasError(false);

    const cacheKey = text.trim().toLowerCase();
    if (audioCache.has(cacheKey)) {
      const cachedUrl = audioCache.get(cacheKey)!;
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setHasError(true);
      };
      setIsPlaying(true);
      audio.play().catch(() => {
        setIsPlaying(false);
        setHasError(true);
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/albanian/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("Audio generation failed");

      const data = await res.json();
      const url = data.audioDataUri;
      if (!url) throw new Error("No audio URL returned");
      audioCache.set(cacheKey, url);

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setHasError(true);
      };
      setIsLoading(false);
      setIsPlaying(true);
      audio.play().catch(() => {
        setIsPlaying(false);
        setHasError(true);
      });
    } catch {
      setIsLoading(false);
      setHasError(true);
    }
  }, [text, isPlaying]);

  return (
    <motion.button
      onClick={handlePlay}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      title={`Play: ${text}`}
      className={`
        relative inline-flex items-center justify-center rounded-full
        transition-colors duration-200 focus:outline-none focus-visible:ring-2
        focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
        focus-visible:ring-offset-[var(--bg)]
        ${config.button}
        ${
          isPlaying
            ? "bg-[var(--accent)]/20 text-[var(--accent)]"
            : hasError
            ? "bg-red-500/10 text-red-400"
            : "bg-[var(--surface)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10"
        }
        ${className}
      `}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              className="animate-spin"
              width={config.icon}
              height={config.icon}
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
                strokeLinecap="round"
              />
            </svg>
          </motion.span>
        ) : isPlaying ? (
          <motion.span
            key="playing"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <SpeakerWaveIcon size={config.icon} animated />
          </motion.span>
        ) : hasError ? (
          <motion.span
            key="error"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              width={config.icon}
              height={config.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <SpeakerWaveIcon size={config.icon} animated={false} />
          </motion.span>
        )}
      </AnimatePresence>

      {isPlaying && (
        <motion.span
          className="absolute inset-0 rounded-full border border-[var(--accent)]"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </motion.button>
  );
}

function SpeakerWaveIcon({
  size,
  animated,
}: {
  size: number;
  animated: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {animated ? (
        <>
          <motion.path
            d="M15.54 8.46a5 5 0 0 1 0 7.07"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M19.07 4.93a10 10 0 0 1 0 14.14"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
        </>
      ) : (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      )}
    </svg>
  );
}
