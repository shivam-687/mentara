// ── Flashcard Deck Artifact ──
// Interactive flashcard deck with 3D flip animation, navigation, and tracking.

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, Button, Badge } from "./_adapter";
import type { FlashcardsProps, FlashcardsResult } from "./schema";
import {
  RotateCcw,
  Check,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play,
  Trophy,
} from "lucide-react";

type CardStatus = "known" | "review" | "unseen";

export function Flashcards({
  id,
  title,
  cards,
  receipt,
  onComplete,
  className,
}: FlashcardsProps) {
  const [phase, setPhase] = useState<"intro" | "active" | "summary">(
    receipt ? "summary" : "intro",
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<Record<string, CardStatus>>({});
  const [reviewOnly, setReviewOnly] = useState(false);

  const activeCards = reviewOnly
    ? cards.filter((c) => cardStates[c.id] === "review" || !cardStates[c.id])
    : cards;
  const currentCard = activeCards[currentIndex];
  const knownCount = Object.values(cardStates).filter(
    (s) => s === "known",
  ).length;
  const reviewCount = Object.values(cardStates).filter(
    (s) => s === "review",
  ).length;

  // Keyboard navigation
  useEffect(() => {
    if (phase !== "active") return;
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          setIsFlipped((f) => !f);
          break;
        case "ArrowLeft":
          if (currentIndex > 0) {
            setIsFlipped(false);
            setCurrentIndex((i) => i - 1);
          }
          break;
        case "ArrowRight":
          if (currentIndex < activeCards.length - 1) {
            setIsFlipped(false);
            setCurrentIndex((i) => i + 1);
          }
          break;
        case "k":
        case "K":
          if (isFlipped && currentCard) markCard("known");
          break;
        case "r":
        case "R":
          if (isFlipped && currentCard) markCard("review");
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, currentIndex, isFlipped, activeCards.length]);

  const markCard = useCallback(
    (status: "known" | "review") => {
      if (!currentCard) return;
      setCardStates((prev) => ({ ...prev, [currentCard.id]: status }));
      setIsFlipped(false);

      // Move to next card or finish
      if (currentIndex < activeCards.length - 1) {
        setTimeout(() => setCurrentIndex((i) => i + 1), 200);
      } else {
        // Check if all cards are rated
        const updatedStates = {
          ...cardStates,
          [currentCard.id]: status,
        };
        const allRated = cards.every((c) => updatedStates[c.id]);
        if (allRated) {
          finishDeck(updatedStates);
        } else {
          setTimeout(() => setCurrentIndex((i) => i + 1), 200);
        }
      }
    },
    [currentCard, currentIndex, activeCards.length, cardStates, cards],
  );

  const finishDeck = (states: Record<string, CardStatus>) => {
    const result: FlashcardsResult = {
      total: cards.length,
      known: Object.values(states).filter((s) => s === "known").length,
      needReview: Object.values(states).filter((s) => s === "review").length,
      cardStates: cards.map((c) => ({
        cardId: c.id,
        status: (states[c.id] as "known" | "review") || "review",
      })),
    };
    setPhase("summary");
    onComplete?.(result);
  };

  // Parse receipt
  const parsedReceipt = (() => {
    if (!receipt) return null;
    if (typeof receipt === "object") return receipt;
    try {
      return JSON.parse(receipt);
    } catch {
      return null;
    }
  })();

  // Receipt state
  if (parsedReceipt && phase === "summary") {
    return (
      <div
        data-tool-ui-id={id}
        data-slot="flashcards"
        data-receipt="true"
        className={cn(
          "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[var(--color-accent)]" />
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {parsedReceipt.known}/{parsedReceipt.total} mastered
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div
      data-tool-ui-id={id}
      data-slot="flashcards"
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden",
        className,
      )}
    >
      <AnimatePresence mode="wait">
        {/* Intro */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 space-y-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-5 w-5 text-[var(--color-accent)]" />
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                {cards.length} cards to review. Flip each card and rate your
                knowledge.
              </p>
            </div>
            <Button onClick={() => setPhase("active")} className="min-h-[44px] gap-2">
              <Play className="h-4 w-4" />
              Start Review
            </Button>
          </motion.div>
        )}

        {/* Active Card */}
        {phase === "active" && currentCard && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Progress */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
              <div className="flex gap-1 flex-1">
                {activeCards.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      i < currentIndex
                        ? cardStates[activeCards[i].id] === "known"
                          ? "bg-emerald-500"
                          : "bg-[var(--color-accent)]"
                        : i === currentIndex
                          ? "bg-[var(--color-accent)]/50"
                          : "bg-[var(--color-border)]",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
                {currentIndex + 1}/{activeCards.length}
              </span>
            </div>

            {/* Card with flip */}
            <div className="p-5">
              <div
                className="perspective-[1000px] cursor-pointer mb-4"
                onClick={() => setIsFlipped((f) => !f)}
                role="button"
                aria-label={
                  isFlipped ? "Show question (front)" : "Show answer (back)"
                }
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsFlipped((f) => !f);
                  }
                }}
              >
                <div
                  className={cn(
                    "relative w-full min-h-[180px] transition-transform duration-500 [transform-style:preserve-3d]",
                    isFlipped && "[transform:rotateY(180deg)]",
                  )}
                >
                  {/* Front */}
                  <div className="absolute inset-0 [backface-visibility:hidden] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)] p-6 flex flex-col items-center justify-center">
                    <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
                      Question
                    </span>
                    <p className="text-center font-medium">
                      {currentCard.front}
                    </p>
                    <span className="text-[10px] text-[var(--color-text-muted)] mt-4">
                      Click or press Space to flip
                    </span>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[var(--radius-lg)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-6 flex flex-col items-center justify-center">
                    <span className="text-xs uppercase tracking-widest text-[var(--color-accent)] mb-3">
                      Answer
                    </span>
                    <p className="text-center font-medium">
                      {currentCard.back}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions — only show when flipped */}
              <AnimatePresence>
                {isFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <Button
                      variant="outline"
                      onClick={() => markCard("review")}
                      className="min-h-[44px] gap-2 flex-1"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Review Again
                    </Button>
                    <Button
                      onClick={() => markCard("known")}
                      className="min-h-[44px] gap-2 flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4" />
                      Got It
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nav arrows when not flipped */}
              {!isFlipped && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentIndex((i) => i - 1);
                    }}
                    disabled={currentIndex === 0}
                    className="min-h-[44px]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentIndex((i) => i + 1);
                    }}
                    disabled={currentIndex >= activeCards.length - 1}
                    className="min-h-[44px]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Summary */}
        {phase === "summary" && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[var(--color-accent)]" />
              <h3 className="text-lg font-semibold">Deck Complete!</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-md)] border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {knownCount}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Mastered
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-3 text-center">
                <p className="text-2xl font-bold text-[var(--color-accent)]">
                  {reviewCount}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Need Review
                </p>
              </div>
            </div>

            {reviewCount > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setReviewOnly(true);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setPhase("active");
                }}
                className="w-full min-h-[44px] gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Practice {reviewCount} Review Cards
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
