import { z } from "zod";
import { ToolUIIdSchema } from "../shared/schema";
import { defineToolUiContract } from "../shared/contract";

// ── Flashcard Schema ──

const FlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  topic: z.string().optional(),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;

// ── Flashcard Deck Schema ──

export const SerializableFlashcardsSchema = z
  .object({
    id: ToolUIIdSchema,
    title: z.string().min(1),
    cards: z.array(FlashcardSchema).min(1),
  })
  .strict();

export type SerializableFlashcards = z.infer<
  typeof SerializableFlashcardsSchema
>;

export interface FlashcardsProps extends SerializableFlashcards {
  receipt?: FlashcardsReceipt | string;
  onComplete?: (result: FlashcardsResult) => void;
  className?: string;
}

export interface FlashcardsResult {
  total: number;
  known: number;
  needReview: number;
  cardStates: Array<{ cardId: string; status: "known" | "review" }>;
}

export interface FlashcardsReceipt {
  total: number;
  known: number;
  needReview: number;
}

// ── Contract ──

const contract = defineToolUiContract(
  "Flashcards",
  SerializableFlashcardsSchema,
);

export const parseSerializableFlashcards = contract.parse;
export const safeParseSerializableFlashcards = contract.safeParse;
