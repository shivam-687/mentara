import { z } from "zod";
import { ToolUIIdSchema } from "../shared/schema";
import { defineToolUiContract } from "../shared/contract";

// ── Test Question Schemas ──

const TestQuestionOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

const TestQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["mcq", "true_false", "fill_blank", "ordering"]),
  text: z.string().min(1),
  options: z.array(TestQuestionOptionSchema).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  topic: z.string().optional(),
});

export type TestQuestion = z.infer<typeof TestQuestionSchema>;
export type TestQuestionOption = z.infer<typeof TestQuestionOptionSchema>;

// ── Test Assessment Schema ──

export const SerializableTestAssessmentSchema = z
  .object({
    id: ToolUIIdSchema,
    title: z.string().min(1),
    description: z.string().optional(),
    timeLimit: z.number().positive().optional(),
    questions: z.array(TestQuestionSchema).min(1),
  })
  .strict();

export type SerializableTestAssessment = z.infer<
  typeof SerializableTestAssessmentSchema
>;

export interface TestAssessmentProps extends SerializableTestAssessment {
  receipt?: TestAssessmentReceipt | string;
  onComplete?: (result: TestAssessmentResult) => void;
  className?: string;
}

export interface TestAssessmentResult {
  score: number;
  total: number;
  correct: number;
  timeTakenSeconds?: number;
  answers: Array<{
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

export interface TestAssessmentReceipt {
  score: number;
  total: number;
  correct: number;
}

// ── Contract ──

const contract = defineToolUiContract(
  "TestAssessment",
  SerializableTestAssessmentSchema,
);

export const parseSerializableTestAssessment = contract.parse;
export const safeParseSerializableTestAssessment = contract.safeParse;
