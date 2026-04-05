"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";

interface ProgressData {
  currentPhase: number;
  currentWeek: number;
  totalListeningMinutes: number;
  streak: number;
  longestStreak: number;
  wordsLearned: number;
  phrasesMastered: number;
}

interface ProgressDashboardProps {
  progress: ProgressData;
}

function AnimatedNumber({
  value,
  duration = 1.2,
  suffix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));

  useEffect(() => {
    if (inView) {
      const controls = animate(motionValue, value, {
        duration,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [inView, value, motionValue, duration]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = v.toLocaleString() + suffix;
      }
    });
    return unsubscribe;
  }, [rounded, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

const cardVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  sublabel?: string;
  accent?: boolean;
  large?: boolean;
  icon: React.ReactNode;
  index: number;
}

function StatCard({
  label,
  value,
  suffix = "",
  sublabel,
  accent = false,
  large = false,
  icon,
  index,
}: StatCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      className={`
        rounded-2xl border p-5 flex flex-col gap-3
        ${accent
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
          : "border-[var(--border)] bg-[var(--card)]"
        }
      `}
      style={accent ? { backgroundColor: "rgba(110,231,160,0.04)" } : {}}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[var(--surface)] text-[var(--text-soft)]"}`}>
        {icon}
      </div>

      <div>
        <div className={`font-bold tabular-nums leading-none ${large ? "text-4xl" : "text-2xl"} ${accent ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
          <AnimatedNumber value={value} suffix={suffix} duration={large ? 1.6 : 1.1} />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1.5 font-medium">{label}</p>
        {sublabel && (
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sublabel}</p>
        )}
      </div>
    </motion.div>
  );
}

const phaseNames: Record<number, string> = {
  1: "Foundation",
  2: "Building",
  3: "Expansion",
  4: "Fluency",
};

export default function ProgressDashboard({ progress }: ProgressDashboardProps) {
  const phaseName = phaseNames[progress.currentPhase] ?? `Phase ${progress.currentPhase}`;

  return (
    <div className="space-y-6">
      {/* Phase / Week header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Phase {progress.currentPhase}
          </span>
          <span className="w-px h-3 bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-soft)] font-medium">{phaseName}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-xs text-[var(--text-soft)] font-medium">
            Week {progress.currentWeek}
          </span>
        </div>
      </motion.div>

      {/* Primary metric — listening time */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--card)] p-6"
        style={{ background: "linear-gradient(135deg, rgba(110,231,160,0.05) 0%, transparent 60%)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mb-2">
              Total Listening Time
            </p>
            <div className="text-5xl font-bold text-[var(--accent)] tabular-nums leading-none">
              <AnimatedNumber value={progress.totalListeningMinutes} suffix=" min" duration={2.0} />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              {progress.totalListeningMinutes >= 60
                ? `${Math.floor(progress.totalListeningMinutes / 60)}h ${progress.totalListeningMinutes % 60}m total`
                : "Keep listening — consistency is everything"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center shrink-0">
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Stat grid */}
      <motion.div
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard
          index={0}
          label="Day Streak"
          value={progress.streak}
          suffix=" days"
          sublabel={progress.longestStreak > progress.streak ? `Best: ${progress.longestStreak}d` : "Personal best!"}
          icon={
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />

        <StatCard
          index={1}
          label="Longest Streak"
          value={progress.longestStreak}
          suffix=" days"
          icon={
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />

        <StatCard
          index={2}
          label="Words Encountered"
          value={progress.wordsLearned}
          accent
          icon={
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
        />

        <StatCard
          index={3}
          label="Phrases Mastered"
          value={progress.phrasesMastered}
          icon={
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
      </motion.div>

      {/* Encouraging note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-xs text-[var(--text-muted)] text-center pb-1"
      >
        Focus on listening time — comprehension follows naturally with consistent exposure.
      </motion.p>
    </div>
  );
}
