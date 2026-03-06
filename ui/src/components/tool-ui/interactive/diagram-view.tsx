// ── Diagram View (Flowchart) ──
// SVG-based flowchart with auto-layout, clickable nodes, animated edges.

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "./_adapter";
import type { DiagramData } from "./schema";

const NODE_W = 160;
const NODE_H = 48;
const GAP_X = 60;
const GAP_Y = 40;

interface NodePos {
  x: number;
  y: number;
}

function layoutNodes(
  data: DiagramData,
): Map<string, NodePos> {
  const positions = new Map<string, NodePos>();
  const isLR = data.direction === "LR";

  // Simple grid layout — topological-like order
  const placed = new Set<string>();
  const roots = data.nodes.filter(
    (n) => !data.edges.some((e) => e.to === n.id),
  );
  if (roots.length === 0 && data.nodes.length > 0) roots.push(data.nodes[0]);

  let col = 0;
  let queue = [...roots];

  while (queue.length > 0) {
    const nextQueue: typeof queue = [];
    queue.forEach((node, row) => {
      if (placed.has(node.id)) return;
      placed.add(node.id);
      const x = isLR ? col * (NODE_W + GAP_X) : row * (NODE_W + GAP_X);
      const y = isLR ? row * (NODE_H + GAP_Y) : col * (NODE_H + GAP_Y);
      positions.set(node.id, { x: x + 20, y: y + 20 });

      // Find children
      const children = data.edges
        .filter((e) => e.from === node.id)
        .map((e) => data.nodes.find((n) => n.id === e.to))
        .filter((n): n is (typeof data.nodes)[0] => !!n && !placed.has(n.id));
      nextQueue.push(...children);
    });
    col++;
    queue = nextQueue;
  }

  // Place any unplaced nodes
  data.nodes.forEach((n, i) => {
    if (!placed.has(n.id)) {
      positions.set(n.id, { x: 20, y: (col + i) * (NODE_H + GAP_Y) + 20 });
    }
  });

  return positions;
}

export function DiagramView({
  data,
  className,
}: {
  data: DiagramData;
  className?: string;
}) {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const positions = layoutNodes(data);

  // Calculate SVG dimensions
  let maxX = 0,
    maxY = 0;
  positions.forEach(({ x, y }) => {
    maxX = Math.max(maxX, x + NODE_W + 20);
    maxY = Math.max(maxY, y + NODE_H + 20);
  });

  return (
    <div className={cn("overflow-auto", className)}>
      <svg
        width={maxX}
        height={maxY}
        viewBox={`0 0 ${maxX} ${maxY}`}
        role="img"
        aria-label="Flowchart diagram"
        className="w-full"
        style={{ minHeight: 150 }}
      >
        {/* Edges */}
        {data.edges.map((edge, i) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          const x1 = from.x + NODE_W / 2;
          const y1 = from.y + NODE_H;
          const x2 = to.x + NODE_W / 2;
          const y2 = to.y;

          return (
            <g key={`edge-${i}`}>
              <motion.path
                d={`M${x1},${y1} C${x1},${y1 + 20} ${x2},${y2 - 20} ${x2},${y2}`}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
              />
              {/* Arrowhead */}
              <polygon
                points={`${x2 - 4},${y2 - 6} ${x2},${y2} ${x2 + 4},${y2 - 6}`}
                fill="var(--color-accent)"
              />
              {edge.label && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 4}
                  fontSize="10"
                  fill="var(--color-text-muted)"
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {data.nodes.map((node, i) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const isActive = activeNode === node.id;

          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              tabIndex={0}
              role="button"
              aria-label={`${node.label}${node.description ? `: ${node.description}` : ""}`}
              onClick={() =>
                setActiveNode(isActive ? null : node.id)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  setActiveNode(isActive ? null : node.id);
              }}
              style={{ cursor: node.description ? "pointer" : "default" }}
            >
              <rect
                x={pos.x}
                y={pos.y}
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill={isActive ? "var(--color-accent)" : "var(--color-bg-elevated)"}
                stroke={isActive ? "var(--color-accent)" : "var(--color-border)"}
                strokeWidth={1.5}
              />
              <text
                x={pos.x + NODE_W / 2}
                y={pos.y + NODE_H / 2 + 1}
                fontSize="12"
                fontWeight="500"
                fill={isActive ? "white" : "var(--color-text)"}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {node.label.length > 20
                  ? node.label.slice(0, 18) + "..."
                  : node.label}
              </text>

              {/* Tooltip on active */}
              {isActive && node.description && (
                <foreignObject
                  x={pos.x - 20}
                  y={pos.y + NODE_H + 6}
                  width={NODE_W + 40}
                  height={80}
                >
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-2 text-[11px] text-[var(--color-text-muted)] shadow-sm">
                    {node.description}
                  </div>
                </foreignObject>
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
