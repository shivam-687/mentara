// ── Interactive Artifact ──
// Main dispatcher component that parses data and renders the appropriate visualization.

import { cn } from "./_adapter";
import type { InteractiveProps } from "./schema";
import {
  parseInteractiveData,
  type DiagramData,
  type MindmapData,
  type ComparisonData,
  type TimelineData,
  type StepsData,
  type InfographicData,
} from "./schema";
import { DiagramView } from "./diagram-view";
import { MindmapView } from "./mindmap-view";
import { ComparisonView } from "./comparison-view";
import { TimelineView } from "./timeline-view";
import { StepsView } from "./steps-view";
import { InfographicView } from "./infographic-view";
import {
  GitBranch,
  Brain,
  Table2,
  Clock,
  ListOrdered,
  BarChart3,
} from "lucide-react";

const TYPE_ICONS: Record<string, typeof GitBranch> = {
  diagram: GitBranch,
  mindmap: Brain,
  comparison: Table2,
  timeline: Clock,
  steps: ListOrdered,
  infographic: BarChart3,
};

const TYPE_LABELS: Record<string, string> = {
  diagram: "Diagram",
  mindmap: "Mind Map",
  comparison: "Comparison",
  timeline: "Timeline",
  steps: "Step by Step",
  infographic: "Infographic",
};

export function Interactive({
  id,
  type,
  title,
  data: dataRaw,
  className,
}: InteractiveProps) {
  // Coerce data: LLMs sometimes send objects instead of JSON strings
  const dataStr = typeof dataRaw === 'string' ? dataRaw : JSON.stringify(dataRaw);
  const data = parseInteractiveData(type, dataStr);
  const Icon = TYPE_ICONS[type] || BarChart3;

  if (!data) {
    return (
      <div
        data-tool-ui-id={id}
        data-slot="interactive"
        className={cn(
          "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4",
          className,
        )}
      >
        <p className="text-sm text-[var(--color-text-muted)]">
          Unable to render interactive content.
        </p>
      </div>
    );
  }

  return (
    <div
      data-tool-ui-id={id}
      data-slot="interactive"
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <Icon className="h-3.5 w-3.5 text-[var(--color-accent)]" />
        <span className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          {TYPE_LABELS[type] || type}
        </span>
        <span className="text-sm font-medium ml-1">{title}</span>
      </div>

      {/* Content */}
      <div className="p-4">
        {type === "diagram" && (
          <DiagramView data={data as DiagramData} />
        )}
        {type === "mindmap" && (
          <MindmapView data={data as MindmapData} />
        )}
        {type === "comparison" && (
          <ComparisonView data={data as ComparisonData} />
        )}
        {type === "timeline" && (
          <TimelineView data={data as TimelineData} />
        )}
        {type === "steps" && (
          <StepsView data={data as StepsData} />
        )}
        {type === "infographic" && (
          <InfographicView data={data as InfographicData} />
        )}
      </div>
    </div>
  );
}
