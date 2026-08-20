import { z } from "zod";

export const QuestionTypeEnum = z.enum([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "CODE_OUTPUT",
  "CODE_WRITING",
  "DEBUGGING",
  "CONCEPTUAL_EXPLANATION",
  "SCENARIO",
  "PRACTICAL_PROBLEM",
]);

export const QuestionPurposeEnum = z.enum([
  "BASELINE",
  "SAME_CONCEPT_EASIER",
  "SAME_CONCEPT_DIFFERENT_FORM",
  "SAME_CONCEPT_HARDER",
  "PREREQUISITE_TEST",
  "REMEDIAL_TEST",
  "TRANSFER_TEST",
  "RELATED_CONCEPT",
  "NEW_CONCEPT",
  "ADVANCED_CONCEPT",
]);

// ---------------------------------------------------------------------------
// Assessment Blueprint (dynamic curriculum discovery)
// ---------------------------------------------------------------------------

export const BlueprintConceptSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9\-]+$/i, "concept id must be a slug-like identifier"),
  name: z.string().min(1).max(120),
  description: z.string().max(400).optional().default(""),
  importance: z.number().min(0).max(1),
  prerequisites: z.array(z.string()).default([]),
  suggestedQuestionTypes: z.array(QuestionTypeEnum).min(1),
  approxDifficulty: z.number().min(0).max(1),
});

export const AssessmentBlueprintSchema = z.object({
  subject: z.string().min(1),
  goal: z.string().min(1).max(300),
  concepts: z.array(BlueprintConceptSchema).min(4).max(40),
  coverageStrategy: z.string().min(1).max(500).optional().default(""),
});
export type AssessmentBlueprint = z.infer<typeof AssessmentBlueprintSchema>;

// ---------------------------------------------------------------------------
// Generated question
// ---------------------------------------------------------------------------

export const GeneratedQuestionSchema = z
  .object({
    question: z.string().min(8).max(2000),
    type: QuestionTypeEnum,
    options: z.array(z.string().min(1)).min(2).max(6).optional(),
    correctAnswer: z.string().min(1).max(2000),
    explanation: z.string().min(1).max(1200),
    targetConcept: z.string().min(1),
    difficulty: z.number().min(0).max(1),
    rationale: z.string().max(400).optional(),
  })
  .superRefine((val, ctx) => {
    if ((val.type === "MULTIPLE_CHOICE" || val.type === "TRUE_FALSE") && !val.options) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "options are required for multiple_choice / true_false questions",
        path: ["options"],
      });
    }
    if (val.options && !val.options.map((o) => o.trim().toLowerCase()).includes(val.correctAnswer.trim().toLowerCase())) {
      // Only reject if there is truly no match (case-insensitive, trimmed).
      // This avoids burning retries on minor capitalisation/whitespace differences.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correctAnswer must exactly match one of the provided options",
        path: ["correctAnswer"],
      });
    }
  });
export type GeneratedQuestionAI = z.infer<typeof GeneratedQuestionSchema>;

// ---------------------------------------------------------------------------
// Answer evaluation
// ---------------------------------------------------------------------------

export const EvaluationStatusEnum = z.enum([
  "CORRECT",
  "INCORRECT",
  "PARTIALLY_CORRECT",
  "UNCERTAIN",
]);

export const ErrorTypeEnum = z.enum([
  "NONE",
  "CONCEPTUAL_GAP",
  "SYNTAX_ERROR",
  "LOGIC_ERROR",
  "TYPE_ERROR",
  "GUESS",
  "UNKNOWN",
]);

export const AIEvaluationSchema = z.object({
  status: EvaluationStatusEnum,
  correctness: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  errorType: ErrorTypeEnum.default("NONE"),
  misconception: z.string().nullable().default(null),
  understood: z.array(z.string()).default([]),
  missing: z.array(z.string()).default([]),
  recommendedAction: QuestionPurposeEnum,
  explanationForLearner: z.string().max(500).optional(),
});
export type AIEvaluation = z.infer<typeof AIEvaluationSchema>;

// ---------------------------------------------------------------------------
// Cheap classification (fast pre-check before full diagnosis)
// ---------------------------------------------------------------------------

export const ClassificationSchema = z.object({
  label: z.enum([
    "CORRECT",
    "INCORRECT",
    "PARTIALLY_CORRECT",
    "UNCERTAIN",
    "CONCEPTUAL_GAP",
    "SYNTAX_ERROR",
    "LOGIC_ERROR",
    "TYPE_ERROR",
    "GUESS",
  ]),
  confidence: z.number().min(0).max(1),
});
export type Classification = z.infer<typeof ClassificationSchema>;

// ---------------------------------------------------------------------------
// Adaptive engine decision (AI-assisted, server-validated)
// ---------------------------------------------------------------------------

export const AdaptiveDecisionSchema = z.object({
  action: QuestionPurposeEnum,
  targetConceptId: z.string().min(1),
  targetDifficulty: z.number().min(0).max(1),
  reason: z.string().min(1).max(300),
  needsIntervention: z.boolean(),
});
export type AdaptiveDecisionAI = z.infer<typeof AdaptiveDecisionSchema>;

// ---------------------------------------------------------------------------
// Intervention (micro-lesson) content
// ---------------------------------------------------------------------------

export const InterventionSchema = z.object({
  title: z.string().min(1).max(120),
  explanation: z.string().min(1).max(900),
});
export type InterventionAI = z.infer<typeof InterventionSchema>;

// ---------------------------------------------------------------------------
// Final report
// ---------------------------------------------------------------------------

export const FinalReportSchema = z.object({
  summary: z.string().min(1).max(2000),
  strongAreas: z.array(z.string()).default([]),
  weakAreas: z.array(z.string()).default([]),
  developingAreas: z.array(z.string()).default([]),
  uncertainAreas: z.array(z.string()).default([]),
  misconceptions: z
    .array(z.object({ concept: z.string(), description: z.string() }))
    .default([]),
  evidenceOfImprovement: z.string().max(500).default(""),
  recommendedNextAreas: z.array(z.string()).default([]),
  remainingUncertainties: z.array(z.string()).default([]),
});
export type FinalReportAI = z.infer<typeof FinalReportSchema>;
