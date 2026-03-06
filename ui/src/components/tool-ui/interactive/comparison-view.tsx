// ── Comparison Table View ──
// Interactive table with row/cell highlighting.

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "./_adapter";
import type { ComparisonData } from "./schema";

export function ComparisonView({
  data,
  className,
}: {
  data: ComparisonData;
  className?: string;
}) {
  const [activeCell, setActiveCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const highlightSet = new Set(
    (data.highlights || []).map((h) => `${h.row}-${h.col}`),
  );

  return (
    <div className={cn("overflow-auto", className)}>
      <table className="w-full border-collapse text-sm" role="grid">
        <thead>
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] sticky top-0" />
            {data.columns.map((col, i) => (
              <th
                key={i}
                className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] sticky top-0"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <motion.tr
              key={ri}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: ri * 0.05 }}
              className={cn(
                "border-b border-[var(--color-border)] transition-colors",
                activeCell?.row === ri && "bg-[var(--color-accent)]/5",
              )}
            >
              <td className="px-3 py-2.5 font-medium text-[var(--color-text)] whitespace-nowrap">
                {row.label}
              </td>
              {row.cells.map((cell, ci) => {
                const isHighlighted = highlightSet.has(`${ri}-${ci}`);
                const isActive =
                  activeCell?.row === ri && activeCell?.col === ci;

                return (
                  <td
                    key={ci}
                    className={cn(
                      "px-3 py-2.5 transition-all cursor-default",
                      isHighlighted &&
                        "border-l-2 border-l-[var(--color-accent)] bg-[var(--color-accent)]/5 font-medium",
                      isActive && "ring-1 ring-[var(--color-accent)] rounded",
                    )}
                    onClick={() =>
                      setActiveCell(
                        isActive ? null : { row: ri, col: ci },
                      )
                    }
                    tabIndex={0}
                    role="gridcell"
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        setActiveCell(
                          isActive ? null : { row: ri, col: ci },
                        );
                    }}
                  >
                    {cell}
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
