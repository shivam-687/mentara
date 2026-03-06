// ── Steps View ──
// Step-by-step animated explanation with numbered steps.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, Button } from "./_adapter";
import type { StepsData } from "./schema";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function StepsView({
  data,
  className,
}: {
  data: StepsData;
  className?: string;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const step = data.steps[activeStep];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {data.steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={cn(
              "flex items-center gap-1.5 transition-all min-h-[36px]",
              i <= activeStep
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-text-muted)]",
            )}
            aria-label={`Step ${i + 1}: ${s.title}`}
            aria-current={i === activeStep ? "step" : undefined}
          >
            <span
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium border transition-colors",
                i === activeStep
                  ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                  : i < activeStep
                    ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30"
                    : "border-[var(--color-border)]",
              )}
            >
              {i + 1}
            </span>
            {i < data.steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 transition-colors",
                  i < activeStep
                    ? "bg-[var(--color-accent)]"
                    : "bg-[var(--color-border)]",
                )}
              />
            )}
          </button>
        ))}
      </div>

      {/* Active step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
        >
          <h4 className="font-medium text-sm mb-1">{step.title}</h4>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            {step.description}
          </p>
          {step.detail && (
            <div className="mt-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] p-3 text-xs text-[var(--color-text-muted)] border border-[var(--color-border)]">
              {step.detail}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveStep((i) => i - 1)}
          disabled={activeStep === 0}
          className="min-h-[44px] gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveStep((i) => i + 1)}
          disabled={activeStep >= data.steps.length - 1}
          className="min-h-[44px] gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
