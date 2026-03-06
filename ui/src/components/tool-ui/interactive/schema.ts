import { z } from "zod";
import { ToolUIIdSchema } from "../shared/schema";
import { defineToolUiContract } from "../shared/contract";

// ── Sub-schemas for each visualization type ──

const DiagramNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
}).passthrough();

const DiagramEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
}).passthrough();

const DiagramDataSchema = z.object({
  nodes: z.array(DiagramNodeSchema),
  edges: z.array(DiagramEdgeSchema).optional().default([]),
  direction: z.enum(["TB", "LR"]).optional().default("TB"),
}).passthrough();

const MindmapBranchSchema: z.ZodType<{
  label: string;
  children?: Array<{ label: string; children?: unknown[] }>;
}> = z.lazy(() =>
  z.object({
    label: z.string(),
    children: z.array(MindmapBranchSchema).optional(),
  }),
);

const MindmapDataSchema = z.object({
  center: z.string(),
  branches: z.array(MindmapBranchSchema),
}).passthrough();

const ComparisonRowSchema = z.object({
  label: z.string(),
  cells: z.array(z.string()),
}).passthrough();

const ComparisonHighlightSchema = z.object({
  row: z.number(),
  col: z.number(),
}).passthrough();

const ComparisonDataSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(ComparisonRowSchema),
  highlights: z.array(ComparisonHighlightSchema).optional(),
}).passthrough();

const TimelineEventSchema = z.object({
  date: z.string(),
  title: z.string(),
  description: z.string(),
}).passthrough();

const TimelineDataSchema = z.object({
  events: z.array(TimelineEventSchema),
}).passthrough();

const StepSchema = z.object({
  title: z.string(),
  description: z.string(),
  detail: z.string().optional(),
}).passthrough();

const StepsDataSchema = z.object({
  steps: z.array(StepSchema),
}).passthrough();

const InfographicStatSchema = z.object({
  label: z.string(),
  value: z.string(),
}).passthrough();

const InfographicSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
  icon: z.string().optional(),
  stats: z.array(InfographicStatSchema).optional(),
}).passthrough();

const InfographicDataSchema = z.object({
  sections: z.array(InfographicSectionSchema),
}).passthrough();

// ── Main Interactive Schema ──

export const InteractiveTypeEnum = z.enum([
  "diagram",
  "mindmap",
  "comparison",
  "timeline",
  "steps",
  "infographic",
]);

export type InteractiveType = z.infer<typeof InteractiveTypeEnum>;

export const SerializableInteractiveSchema = z
  .object({
    id: ToolUIIdSchema,
    type: InteractiveTypeEnum,
    title: z.string().default("Visualization"),
    data: z.any(), // Accept string or object - parsing happens in parseInteractiveData
  })
  .passthrough();

export type SerializableInteractive = z.infer<
  typeof SerializableInteractiveSchema
>;

export interface InteractiveProps extends SerializableInteractive {
  className?: string;
}

// ── Parsed data types ──

export type DiagramData = z.infer<typeof DiagramDataSchema>;
export type MindmapData = z.infer<typeof MindmapDataSchema>;
export type ComparisonData = z.infer<typeof ComparisonDataSchema>;
export type TimelineData = z.infer<typeof TimelineDataSchema>;
export type StepsData = z.infer<typeof StepsDataSchema>;
export type InfographicData = z.infer<typeof InfographicDataSchema>;

export function parseInteractiveData(
  type: InteractiveType,
  dataStr: string,
): unknown | null {
  try {
    // Handle double-stringified JSON from LLMs
    let raw = dataStr;
    if (typeof raw === 'string') {
      try {
        const first = JSON.parse(raw);
        // If it parsed to a string, it was double-encoded
        if (typeof first === 'string') {
          raw = first;
        }
      } catch {
        // not double-encoded, continue with original
      }
    }

    // Parse the actual data
    let parsed: unknown;
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw);
    } else {
      parsed = raw;
    }

    const schemaMap: Record<string, z.ZodType> = {
      diagram: DiagramDataSchema,
      mindmap: MindmapDataSchema,
      comparison: ComparisonDataSchema,
      timeline: TimelineDataSchema,
      steps: StepsDataSchema,
      infographic: InfographicDataSchema,
    };

    const schema = schemaMap[type];
    if (!schema) {
      console.warn(`[Interactive] Unknown type: ${type}`);
      return null;
    }

    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }

    // Log validation errors for debugging
    console.warn(
      `[Interactive] Zod validation failed for type="${type}":`,
      result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
    );
    console.warn('[Interactive] Raw data was:', JSON.stringify(parsed).slice(0, 500));
    return null;
  } catch (e) {
    console.warn('[Interactive] Failed to parse data:', e);
    return null;
  }
}

// ── Contract ──

const contract = defineToolUiContract(
  "Interactive",
  SerializableInteractiveSchema,
);

export const parseSerializableInteractive = contract.parse;
export const safeParseSerializableInteractive = contract.safeParse;
