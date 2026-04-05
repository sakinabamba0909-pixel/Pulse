"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    titleEnglish: string;
    weekNumber: number;
    phaseNumber: number;
    wordCount: number;
    _count?: {
      paragraphs: number;
      questions: number;
    };
  };
  listenCount?: number;
}

const phaseColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  2: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
  3: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  4: { bg: "bg-[var(--accent)]/15", text: "text-[var(--accent)]", border: "border-[var(--accent)]/30" },
};

export default function StoryCard({ story, listenCount }: StoryCardProps) {
  const phase = phaseColors[story.phaseNumber] ?? phaseColors[1];

  return (
    <Link href={`/albanian/story/${story.id}`} className="block">
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="
          relative rounded-xl border border-[var(--border)]
          bg-[var(--card)] p-5
          hover:border-[var(--accent)]/40
          transition-colors duration-200
          cursor-pointer overflow-hidden
          group
        "
      >
        {/* Subtle hover glow */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(ellipse at top left, rgba(110,231,160,0.04) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`
                  inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                  border ${phase.bg} ${phase.text} ${phase.border}
                `}
              >
                Phase {story.phaseNumber}
              </span>
              <span className="text-xs text-[var(--text-muted)] bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                Week {story.weekNumber}
              </span>
            </div>

            {listenCount !== undefined && listenCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] shrink-0">
                <svg
                  width="13"
                  height="13"
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
                <span>{listenCount}×</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[var(--text)] font-semibold text-base leading-snug mb-1 group-hover:text-[var(--accent)] transition-colors duration-200">
            {story.title}
          </h3>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            {story.titleEnglish}
          </p>

          {/* Footer stats */}
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>{story.wordCount} words</span>
            </div>

            {story._count && (
              <>
                <div className="flex items-center gap-1.5">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  <span>{story._count.paragraphs} paragraphs</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>{story._count.questions} questions</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right arrow indicator */}
        <motion.div
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          initial={false}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.div>
      </motion.div>
    </Link>
  );
}
