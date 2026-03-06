// ── Timeline View ──
// Vertical timeline with expandable event cards.

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "./_adapter";
import type { TimelineData } from "./schema";
import { ChevronDown } from "lucide-react";

export function TimelineView({
  data,
  className,
}: {
  data: TimelineData;
  className?: string;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className={cn("relative pl-6", className)}>
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--color-border)]" />

      <div className="space-y-4">
        {data.events.map((event, i) => {
          const isExpanded = expandedIdx === i;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {/* Dot */}
              <div
                className={cn(
                  "absolute -left-6 top-3 h-[10px] w-[10px] rounded-full border-2 transition-colors",
                  isExpanded
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-surface)]",
                )}
              />

              {/* Event card */}
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                className={cn(
                  "w-full text-left rounded-[var(--radius-md)] border p-3 transition-all min-h-[44px]",
                  isExpanded
                    ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]/30",
                )}
                aria-expanded={isExpanded}
                aria-label={`${event.title}, ${event.date}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)] flex-shrink-0">
                    {event.date}
                  </span>
                  <span className="text-sm font-medium flex-1 truncate">
                    {event.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform flex-shrink-0",
                      isExpanded && "rotate-180",
                    )}
                  />
                </div>

                {isExpanded && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed"
                  >
                    {event.description}
                  </motion.p>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
