// ── Mind Map View ──
// Radial SVG mind map with expandable branches.

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "./_adapter";
import type { MindmapData } from "./schema";

interface Branch {
  label: string;
  children?: Branch[];
}

interface FlatNode {
  label: string;
  x: number;
  y: number;
  parentX: number;
  parentY: number;
  depth: number;
  branchIndex: number;
}

function flattenBranches(
  branches: Branch[],
  cx: number,
  cy: number,
  radius: number,
): FlatNode[] {
  const nodes: FlatNode[] = [];
  const totalBranches = branches.length;

  branches.forEach((branch, i) => {
    const angle =
      (i / totalBranches) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    nodes.push({
      label: branch.label,
      x,
      y,
      parentX: cx,
      parentY: cy,
      depth: 1,
      branchIndex: i,
    });

    // Second level children
    if (branch.children) {
      const childCount = branch.children.length;
      const spread = Math.PI * 0.4;
      branch.children.forEach((child, j) => {
        const childAngle =
          angle - spread / 2 + (spread * j) / Math.max(childCount - 1, 1);
        const cx2 = x + Math.cos(childAngle) * (radius * 0.65);
        const cy2 = y + Math.sin(childAngle) * (radius * 0.65);
        nodes.push({
          label: child.label,
          x: cx2,
          y: cy2,
          parentX: x,
          parentY: y,
          depth: 2,
          branchIndex: i,
        });
      });
    }
  });

  return nodes;
}

const COLORS = [
  "var(--color-accent)",
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export function MindmapView({
  data,
  className,
}: {
  data: MindmapData;
  className?: string;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set(data.branches.map((_, i) => i)),
  );

  const size = 500;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 150;
  const nodes = flattenBranches(data.branches, cx, cy, radius);

  const toggleBranch = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const visibleNodes = nodes.filter(
    (n) => n.depth === 1 || expanded.has(n.branchIndex),
  );

  return (
    <div className={cn("overflow-auto", className)}>
      <svg
        width="100%"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Mind map: ${data.center}`}
        className="max-h-[400px]"
      >
        {/* Connections */}
        {visibleNodes.map((node, i) => (
          <motion.line
            key={`line-${i}`}
            x1={node.parentX}
            y1={node.parentY}
            x2={node.x}
            y2={node.y}
            stroke={COLORS[node.branchIndex % COLORS.length]}
            strokeWidth={node.depth === 1 ? 2 : 1}
            strokeOpacity={0.4}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          />
        ))}

        {/* Center node */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={36}
            fill="var(--color-accent)"
          />
          <text
            x={cx}
            y={cy}
            fontSize="11"
            fontWeight="600"
            fill="white"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {data.center.length > 16
              ? data.center.slice(0, 14) + "..."
              : data.center}
          </text>
        </motion.g>

        {/* Branch nodes */}
        {visibleNodes.map((node, i) => {
          const color = COLORS[node.branchIndex % COLORS.length];
          const r = node.depth === 1 ? 28 : 22;

          return (
            <motion.g
              key={`node-${i}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              tabIndex={0}
              role="button"
              aria-label={node.label}
              onClick={() => node.depth === 1 && toggleBranch(node.branchIndex)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && node.depth === 1)
                  toggleBranch(node.branchIndex);
              }}
              style={{
                cursor: node.depth === 1 ? "pointer" : "default",
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={node.depth === 1 ? color : "var(--color-bg-elevated)"}
                stroke={color}
                strokeWidth={node.depth === 1 ? 0 : 1.5}
              />
              <text
                x={node.x}
                y={node.y}
                fontSize={node.depth === 1 ? "10" : "9"}
                fontWeight={node.depth === 1 ? "600" : "400"}
                fill={
                  node.depth === 1 ? "white" : "var(--color-text)"
                }
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {node.label.length > 14
                  ? node.label.slice(0, 12) + "..."
                  : node.label}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
