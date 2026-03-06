// ── Infographic View ──
// Card-grid layout with sections, stats, and icons.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "./_adapter";
import type { InfographicData } from "./schema";

function AnimatedNumber({ value }: { value: string }) {
  const numericValue = parseFloat(value);
  const isNumeric = !isNaN(numericValue);
  const [display, setDisplay] = useState(isNumeric ? "0" : value);

  useEffect(() => {
    if (!isNumeric) return;
    const duration = 800;
    const start = performance.now();
    let frame: number;
    const suffix = value.replace(/[\d.,]+/, "");

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * numericValue);
      setDisplay(`${current}${suffix}`);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, isNumeric, numericValue]);

  return <span>{display}</span>;
}

const SECTION_ICONS: Record<string, string> = {
  star: "★",
  check: "✓",
  arrow: "→",
  heart: "♥",
  light: "💡",
  target: "🎯",
  rocket: "🚀",
  book: "📖",
  code: "💻",
  chart: "📊",
};

export function InfographicView({
  data,
  className,
}: {
  data: InfographicData;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        data.sections.length <= 2
          ? "grid-cols-1"
          : data.sections.length <= 4
            ? "grid-cols-2"
            : "grid-cols-2 md:grid-cols-3",
        className,
      )}
    >
      {data.sections.map((section, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 space-y-2"
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            {section.icon && (
              <span className="text-lg">
                {SECTION_ICONS[section.icon] || section.icon}
              </span>
            )}
            <h4 className="text-sm font-semibold">{section.title}</h4>
          </div>

          {/* Content */}
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            {section.content}
          </p>

          {/* Stats */}
          {section.stats && section.stats.length > 0 && (
            <div className="flex gap-3 pt-1 border-t border-[var(--color-border)]">
              {section.stats.map((stat, j) => (
                <div key={j} className="text-center flex-1">
                  <p className="text-lg font-bold text-[var(--color-accent)]">
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
