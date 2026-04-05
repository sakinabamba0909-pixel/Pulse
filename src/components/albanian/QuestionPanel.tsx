"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: string;
  questionGheg: string;
  questionEnglish: string;
  sampleAnswers: string[];
}

interface QuestionPanelProps {
  questions: Question[];
}

type FeedbackLevel = "good" | "partial" | null;

interface FeedbackState {
  level: FeedbackLevel;
  message: string;
  suggestion?: string;
}

const ENCOURAGEMENTS: Record<NonNullable<FeedbackLevel>, string[]> = {
  good: [
    "Great job! That came through clearly.",
    "Well done — very understandable!",
    "Nice work, keep it up!",
    "That's exactly the kind of answer we're looking for.",
  ],
  partial: [
    "Good effort! A small tweak would make it clearer.",
    "You're on the right track — almost there!",
    "Nice try! Here's a suggestion to make it even better.",
    "Getting there — just a little refinement needed.",
  ],
};

function randomEncouragement(level: NonNullable<FeedbackLevel>): string {
  const arr = ENCOURAGEMENTS[level];
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function QuestionPanel({ questions }: QuestionPanelProps) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;

  const handleSubmit = async () => {
    if (!answer.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/albanian/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          userAnswer: answer.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const level: NonNullable<FeedbackLevel> = data.isUnderstandable ? "good" : "partial";
        setFeedback({
          level,
          message: data.feedback || randomEncouragement(level),
          suggestion: data.suggestedAnswer,
        });
      } else {
        // Fallback: treat as partial
        setFeedback({
          level: "partial",
          message: randomEncouragement("partial"),
          suggestion: question.sampleAnswers[0],
        });
      }
    } catch {
      setFeedback({
        level: "partial",
        message: randomEncouragement("partial"),
        suggestion: question.sampleAnswers[0],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setIndex((i) => Math.min(i + 1, questions.length - 1));
    setAnswer("");
    setFeedback(null);
    setShowEnglish(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)] text-sm">
        No comprehension questions for this story yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[var(--text)] font-semibold text-sm">
          Comprehension Questions
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          {index + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--surface)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[var(--accent)] rounded-full"
          initial={false}
          animate={{ width: `${((index + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="space-y-4"
        >
          {/* Question card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
            <p className="text-[var(--text)] text-lg leading-relaxed font-medium">
              {question.questionGheg}
            </p>

            {/* English toggle */}
            <button
              onClick={() => setShowEnglish((s) => !s)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-soft)] transition-colors"
            >
              {showEnglish ? "Hide" : "Show"} English
            </button>

            <AnimatePresence>
              {showEnglish && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[var(--text-soft)] text-sm italic overflow-hidden"
                >
                  {question.questionEnglish}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Answer textarea */}
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-muted)] font-medium">
              Your answer in Albanian:
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={feedback !== null}
              placeholder="Shkruaj përgjigjen tënde këtu…"
              rows={3}
              className="
                w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]
                text-[var(--text)] placeholder:text-[var(--text-muted)]
                px-4 py-3 text-sm leading-relaxed resize-none
                focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30
                transition-colors duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            />
            <p className="text-[10px] text-[var(--text-muted)]">
              Cmd/Ctrl + Enter to submit
            </p>
          </div>

          {/* Submit button */}
          {!feedback && (
            <motion.button
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitting}
              whileTap={{ scale: 0.97 }}
              className="
                w-full py-2.5 rounded-xl font-medium text-sm
                bg-[var(--accent)]/20 text-[var(--accent)]
                border border-[var(--accent)]/30
                hover:bg-[var(--accent)]/30
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
              "
            >
              {isSubmitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
                  </svg>
                  Checking…
                </span>
              ) : (
                "Submit Answer"
              )}
            </motion.button>
          )}

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {/* Result badge + message */}
                <div
                  className={`
                    rounded-xl border p-4 space-y-2
                    ${
                      feedback.level === "good"
                        ? "border-[var(--accent)]/40 bg-[var(--accent)]/8"
                        : "border-amber-500/40 bg-amber-500/8"
                    }
                  `}
                  style={
                    feedback.level === "good"
                      ? { backgroundColor: "rgba(110,231,160,0.06)" }
                      : { backgroundColor: "rgba(245,158,11,0.06)" }
                  }
                >
                  <div className="flex items-center gap-2">
                    {feedback.level === "good" ? (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    )}
                    <p
                      className={`text-sm font-medium ${
                        feedback.level === "good"
                          ? "text-[var(--accent)]"
                          : "text-amber-400"
                      }`}
                    >
                      {feedback.message}
                    </p>
                  </div>

                  {feedback.suggestion && (
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-muted)] font-medium">
                        Suggested answer:
                      </p>
                      <p className="text-[var(--text-soft)] text-sm leading-relaxed">
                        {feedback.suggestion}
                      </p>
                    </div>
                  )}
                </div>

                {/* Next / Done button */}
                <motion.button
                  onClick={handleNext}
                  whileTap={{ scale: 0.97 }}
                  className="
                    w-full py-2.5 rounded-xl font-medium text-sm
                    bg-[var(--surface)] text-[var(--text)]
                    border border-[var(--border)]
                    hover:border-[var(--accent)]/40 hover:text-[var(--accent)]
                    transition-colors duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
                    inline-flex items-center justify-center gap-2
                  "
                  disabled={isLast}
                >
                  {isLast ? (
                    <>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      All done!
                    </>
                  ) : (
                    <>
                      Next Question
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
