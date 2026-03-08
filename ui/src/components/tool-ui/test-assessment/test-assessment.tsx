// ── Test Assessment Artifact ──
// Multi-question timed assessment with intro → questions → score card flow.

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, Button, Badge } from "./_adapter";
import type {
  TestAssessmentProps,
  TestAssessmentResult,
  TestQuestion,
} from "./schema";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  Play,
  AlertTriangle,
} from "lucide-react";

// ── Question Type Renderers ──

function McqQuestion({
  question,
  answer,
  onAnswer,
}: {
  question: TestQuestion;
  answer: string;
  onAnswer: (value: string) => void;
}) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label={question.text}>
      {question.options?.map((opt) => (
        <button
          key={opt.id}
          role="radio"
          aria-checked={answer === opt.id}
          onClick={() => onAnswer(opt.id)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border text-left transition-all min-h-[44px]",
            answer === opt.id
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
              : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50",
          )}
        >
          <span
            className={cn(
              "h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors",
              answer === opt.id
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                : "border-[var(--color-text-muted)]",
            )}
          >
            {answer === opt.id && (
              <span className="block h-full w-full rounded-full bg-white scale-[0.4]" />
            )}
          </span>
          <span className="text-sm">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function TrueFalseQuestion({
  answer,
  onAnswer,
}: {
  question: TestQuestion;
  answer: string;
  onAnswer: (value: string) => void;
}) {
  return (
    <div className="flex gap-3">
      {[
        { id: "true", label: "True" },
        { id: "false", label: "False" },
      ].map((opt) => (
        <button
          key={opt.id}
          onClick={() => onAnswer(opt.id)}
          className={cn(
            "flex-1 py-3 rounded-[var(--radius-md)] border font-medium text-sm transition-all min-h-[44px]",
            answer === opt.id
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
              : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FillBlankQuestion({
  answer,
  onAnswer,
}: {
  question: TestQuestion;
  answer: string;
  onAnswer: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={answer}
      onChange={(e) => onAnswer(e.target.value)}
      placeholder="Type your answer..."
      className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-sm outline-none focus:border-[var(--color-accent)] min-h-[44px]"
      autoFocus
    />
  );
}

function OrderingQuestion({
  question,
  answer,
  onAnswer,
}: {
  question: TestQuestion;
  answer: string;
  onAnswer: (value: string) => void;
}) {
  const items = answer
    ? answer.split(",")
    : question.options?.map((o) => o.id) || [];
  const optionMap = new Map(question.options?.map((o) => [o.id, o.label]));

  const moveItem = (fromIdx: number, toIdx: number) => {
    const newItems = [...items];
    const [moved] = newItems.splice(fromIdx, 1);
    newItems.splice(toIdx, 0, moved);
    onAnswer(newItems.join(","));
  };

  return (
    <div className="space-y-1.5" role="list" aria-label="Drag to reorder">
      {items.map((itemId, idx) => (
        <div
          key={itemId}
          role="listitem"
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] min-h-[44px]"
        >
          <span className="text-xs font-medium text-[var(--color-text-muted)] w-5">
            {idx + 1}.
          </span>
          <span className="flex-1 text-sm">
            {optionMap.get(itemId) || itemId}
          </span>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => idx > 0 && moveItem(idx, idx - 1)}
              disabled={idx === 0}
              className="h-5 w-5 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] disabled:opacity-30"
              aria-label="Move up"
            >
              <ChevronLeft className="h-3 w-3 rotate-90" />
            </button>
            <button
              onClick={() =>
                idx < items.length - 1 && moveItem(idx, idx + 1)
              }
              disabled={idx === items.length - 1}
              className="h-5 w-5 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] disabled:opacity-30"
              aria-label="Move down"
            >
              <ChevronRight className="h-3 w-3 rotate-90" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Timer Component ──

function Timer({
  timeLimit,
  onTimeUp,
  started,
}: {
  timeLimit: number;
  onTimeUp: () => void;
  started: boolean;
}) {
  const [remaining, setRemaining] = useState(timeLimit);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!started) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [started, onTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isWarning = remaining <= 60 && remaining > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm font-mono tabular-nums",
        isWarning
          ? "text-red-500"
          : "text-[var(--color-text-muted)]",
      )}
      aria-live="polite"
      aria-label={`Time remaining: ${minutes} minutes ${seconds} seconds`}
    >
      {isWarning && <AlertTriangle className="h-3.5 w-3.5" />}
      <Clock className="h-3.5 w-3.5" />
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

// ── Score Card ──

function ScoreCard({
  result,
  questions,
}: {
  result: TestAssessmentResult;
  questions: TestQuestion[];
}) {
  const [displayScore, setDisplayScore] = useState(0);
  const scorePercent = Math.round((result.correct / result.total) * 100);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * scorePercent));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [scorePercent]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Score Circle */}
      <div className="flex flex-col items-center py-6">
        <div className="relative h-32 w-32">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 120 120"
          >
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(displayScore / 100) * 327} 327`}
              className="transition-all duration-100"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{displayScore}%</span>
            <span className="text-xs text-[var(--color-text-muted)]">
              Score
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <Trophy className="h-4 w-4 text-[var(--color-accent)]" />
          <span className="text-sm font-medium">
            {result.correct} of {result.total} correct
          </span>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          Question Breakdown
        </h4>
        {result.answers.map((ans, i) => {
          const q = questions.find((q) => q.id === ans.questionId);
          return (
            <div
              key={ans.questionId}
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 rounded-[var(--radius-md)] border text-sm",
                ans.isCorrect
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5",
              )}
            >
              {ans.isCorrect ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  Q{i + 1}: {q?.text}
                </p>
                {!ans.isCorrect && q?.explanation && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {q.explanation}
                  </p>
                )}
              </div>
              {q?.difficulty && (
                <Badge
                  variant="outline"
                  className="text-[10px] flex-shrink-0"
                >
                  {q.difficulty}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Main Component ──

type TestPhase = "intro" | "active" | "review";

export function TestAssessment({
  id,
  title,
  description,
  timeLimit,
  questions,
  receipt,
  onComplete,
  className,
}: TestAssessmentProps) {
  const [phase, setPhase] = useState<TestPhase>(receipt ? "review" : "intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TestAssessmentResult | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentQuestion = questions[currentIndex];
  const hasAnswer = !!answers[currentQuestion?.id];
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion?.id],
  );

  const handleStart = () => {
    setPhase("active");
    startTimeRef.current = Date.now();
  };

  const handleSubmit = useCallback(() => {
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const answerResults = questions.map((q) => {
      const userAnswer = answers[q.id] || "";
      const isCorrect =
        userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
      return {
        questionId: q.id,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
      };
    });

    const correct = answerResults.filter((a) => a.isCorrect).length;
    const testResult: TestAssessmentResult = {
      score: Math.round((correct / questions.length) * 100),
      total: questions.length,
      correct,
      timeTakenSeconds: timeTaken,
      answers: answerResults,
    };

    setResult(testResult);
    setPhase("review");
    onComplete?.(testResult);
  }, [answers, questions, onComplete]);

  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  // Parse receipt from string (from LLM result)
  const parsedReceipt = (() => {
    if (!receipt) return null;
    if (typeof receipt === "object") return receipt;
    try {
      return JSON.parse(receipt);
    } catch {
      return null;
    }
  })();

  // Receipt state — show summary
  if (parsedReceipt && !result) {
    return (
      <div
        data-tool-ui-id={id}
        data-slot="test-assessment"
        data-receipt="true"
        className={cn(
          "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[var(--color-accent)]" />
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {parsedReceipt.correct}/{parsedReceipt.total} correct
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div
      data-tool-ui-id={id}
      data-slot="test-assessment"
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden",
        className,
      )}
    >
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {description && (
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
              <span>{questions.length} questions</span>
              {timeLimit && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {Math.floor(timeLimit / 60)} min
                </span>
              )}
            </div>

            <Button onClick={handleStart} className="min-h-[44px] gap-2">
              <Play className="h-4 w-4" />
              Start Test
            </Button>
          </motion.div>
        )}

        {phase === "active" && currentQuestion && (
          <motion.div
            key="active"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Progress Bar */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
              <div className="flex gap-1 flex-1">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      i < currentIndex
                        ? "bg-[var(--color-accent)]"
                        : i === currentIndex
                          ? "bg-[var(--color-accent)]/50"
                          : "bg-[var(--color-border)]",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
                {currentIndex + 1}/{questions.length}
              </span>
              {timeLimit && (
                <Timer
                  timeLimit={timeLimit}
                  onTimeUp={handleTimeUp}
                  started={phase === "active"}
                />
              )}
            </div>

            {/* Question */}
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-2">
                <p className="text-sm font-medium flex-1">
                  {currentQuestion.text}
                </p>
                {currentQuestion.difficulty && (
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">
                    {currentQuestion.difficulty}
                  </Badge>
                )}
              </div>

              {currentQuestion.type === "mcq" && (
                <McqQuestion
                  question={currentQuestion}
                  answer={answers[currentQuestion.id] || ""}
                  onAnswer={handleAnswer}
                />
              )}
              {currentQuestion.type === "true_false" && (
                <TrueFalseQuestion
                  question={currentQuestion}
                  answer={answers[currentQuestion.id] || ""}
                  onAnswer={handleAnswer}
                />
              )}
              {currentQuestion.type === "fill_blank" && (
                <FillBlankQuestion
                  question={currentQuestion}
                  answer={answers[currentQuestion.id] || ""}
                  onAnswer={handleAnswer}
                />
              )}
              {currentQuestion.type === "ordering" && (
                <OrderingQuestion
                  question={currentQuestion}
                  answer={answers[currentQuestion.id] || ""}
                  onAnswer={handleAnswer}
                />
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex((i) => i - 1)}
                  disabled={currentIndex === 0}
                  className="min-h-[44px] gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                {currentIndex < questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentIndex((i) => i + 1)}
                    disabled={!hasAnswer}
                    className="min-h-[44px] gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={answeredCount < questions.length}
                    className="min-h-[44px]"
                  >
                    Submit Test ({answeredCount}/{questions.length})
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {phase === "review" && result && (
          <motion.div
            key="review"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5"
          >
            <ScoreCard result={result} questions={questions} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

