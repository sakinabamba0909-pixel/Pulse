"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Phase {
  number: number;
  name: string;
  weeks: number[];
}

interface PhaseNavigatorProps {
  currentPhase: number;
  currentWeek: number;
  phases: Phase[];
  selectedPhase?: number;
  onPhaseChange?: (phase: number) => void;
  onWeekChange?: (week: number) => void;
}

export default function PhaseNavigator({
  currentPhase,
  currentWeek,
  phases,
  selectedPhase: controlledPhase,
  onPhaseChange,
  onWeekChange,
}: PhaseNavigatorProps) {
  const isControlled = controlledPhase !== undefined;
  const [internalPhase, setInternalPhase] = useState(controlledPhase ?? currentPhase);
  const selectedPhase = isControlled ? controlledPhase : internalPhase;
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  const activePhaseData = phases.find((p) => p.number === selectedPhase);

  const handlePhaseClick = (phaseNum: number) => {
    setInternalPhase(phaseNum);
    const phaseData = phases.find((p) => p.number === phaseNum);
    if (phaseData && phaseData.weeks.length > 0) {
      const firstWeek = phaseData.weeks[0];
      setSelectedWeek(firstWeek);
      onWeekChange?.(firstWeek);
    }
    onPhaseChange?.(phaseNum);
  };

  const handleWeekClick = (week: number) => {
    setSelectedWeek(week);
    onWeekChange?.(week);
  };

  return (
    <div className="space-y-3">
      {/* Phase tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-x-auto scrollbar-hide">
        {phases.map((phase) => {
          const isActive = phase.number === selectedPhase;
          const isCurrent =
            phase.number === currentPhase;

          return (
            <button
              key={phase.number}
              onClick={() => handlePhaseClick(phase.number)}
              className="relative flex-1 min-w-[80px] px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {isActive && (
                <motion.div
                  layoutId="phase-indicator"
                  className="absolute inset-0 rounded-lg bg-[var(--card)] border border-[var(--border)]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className={`relative z-10 flex flex-col items-center gap-0.5 ${
                  isActive
                    ? "text-[var(--text)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-soft)]"
                }`}
              >
                <span className="text-xs font-semibold tracking-wide uppercase">
                  P{phase.number}
                </span>
                <span className="text-[10px] leading-tight text-center whitespace-nowrap hidden sm:block">
                  {phase.name}
                </span>
                {isCurrent && (
                  <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-0.5" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Week selector */}
      {activePhaseData && activePhaseData.weeks.length > 0 && (
        <motion.div
          key={selectedPhase}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 flex-wrap"
        >
          <span className="text-xs text-[var(--text-muted)] mr-1 font-medium">
            Week:
          </span>
          {activePhaseData.weeks.map((week) => {
            const isSelected = week === selectedWeek;
            const isCurrent =
              week === currentWeek && selectedPhase === currentPhase;

            return (
              <button
                key={week}
                onClick={() => handleWeekClick(week)}
                className={`
                  relative w-8 h-8 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
                  ${
                    isSelected
                      ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40"
                      : "bg-[var(--surface)] text-[var(--text-soft)] border border-[var(--border)] hover:border-[var(--accent)]/30 hover:text-[var(--text)]"
                  }
                `}
              >
                {week}
                {isCurrent && !isSelected && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] border border-[var(--bg)]" />
                )}
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
