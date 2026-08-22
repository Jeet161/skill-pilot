import { z } from "zod";

export const CreateAssessmentSchema = z.object({
  subject: z.string().min(1).max(80),
  targetCount: z.union([z.literal(10), z.literal(20), z.literal(50), z.literal(100)]),
  mode: z.enum(["BALANCED", "DEEP", "PRACTICAL", "CONCEPTUAL"]).default("BALANCED"),
});
export type CreateAssessmentInput = z.infer<typeof CreateAssessmentSchema>;

export const SubmitAnswerSchema = z.object({
  questionId: z.string().min(1),
  rawAnswer: z.string().min(0).max(5000),
  confidence: z.number().int().min(1).max(5).optional(),
  timeTakenMs: z.number().int().min(0).max(1000 * 60 * 30).optional(),
});
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;
