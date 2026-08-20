import { z } from "zod";
import { QuestionPurposeEnum, QuestionTypeEnum } from "./ai";

/**
 * Shape sent to the browser BEFORE the learner answers.
 * Deliberately excludes correctAnswer / explanation / fingerprint.
 */
export const ClientQuestionSchema = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  conceptId: z.string(),
  conceptName: z.string(),
  type: QuestionTypeEnum,
  purpose: QuestionPurposeEnum,
  difficulty: z.number().min(0).max(1),
  prompt: z.string(),
  options: z.array(z.string()).nullable(),
  rationale: z.string().nullable(),
});
export type ClientQuestion = z.infer<typeof ClientQuestionSchema>;
