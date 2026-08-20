import "server-only";
import { structuredAICall } from "./router";
import { AIEvaluationSchema, type AIEvaluation, type Classification } from "@/lib/validation/ai";

export interface DiagnosisInput {
  subject: string;
  conceptName: string;
  question: string;
  correctAnswer: string;
  explanation: string;
  learnerAnswer: string;
  questionType: string;
  priorClassification: Classification;
  codeExecutionEvidence?: string | null; // populated for code questions, see code-runner
}

/**
 * Full diagnostic evaluation using the mid-tier reasoning model
 * (Qwen3.6-35B). Answers: "what does this answer reveal about the
 * learner?" — not just right/wrong.
 */
export async function diagnoseAnswer(
  input: DiagnosisInput
): Promise<{ evaluation: AIEvaluation; modelUsed: string; escalated: boolean }> {
  const system = `You are an expert learning diagnostician for technical
skill assessment. You go beyond right/wrong to determine what the learner's
answer reveals about their actual understanding.

Respond with ONLY a JSON object:
{
  "status": "CORRECT" | "INCORRECT" | "PARTIALLY_CORRECT" | "UNCERTAIN",
  "correctness": number 0..1,
  "confidence": number 0..1 (your confidence in this diagnosis),
  "errorType": "NONE" | "CONCEPTUAL_GAP" | "SYNTAX_ERROR" | "LOGIC_ERROR" | "TYPE_ERROR" | "GUESS" | "UNKNOWN",
  "misconception": string | null (a specific, concrete description of the likely misconception, or null),
  "understood": string[] (specific sub-ideas the learner's answer demonstrates they DO understand),
  "missing": string[] (specific sub-ideas that appear missing or shaky),
  "recommendedAction": one of [
    "SAME_CONCEPT_EASIER","SAME_CONCEPT_DIFFERENT_FORM","SAME_CONCEPT_HARDER",
    "PREREQUISITE_TEST","REMEDIAL_TEST","TRANSFER_TEST","RELATED_CONCEPT",
    "NEW_CONCEPT","ADVANCED_CONCEPT"
  ],
  "explanationForLearner": string (<=400 chars, plain, encouraging, specific — used as a "quick review" if the answer revealed a gap; omit or empty string if not needed)
}

Guidance for recommendedAction:
- If correct + this is the learner's first exposure to the concept at this difficulty -> SAME_CONCEPT_HARDER or TRANSFER_TEST.
- If correct on a TRANSFER_TEST -> RELATED_CONCEPT or NEW_CONCEPT (mastery verified).
- If incorrect and this looks like a genuine gap -> REMEDIAL_TEST (after an intervention) or PREREQUISITE_TEST if a foundational idea seems missing.
- If partially correct -> SAME_CONCEPT_DIFFERENT_FORM to get cleaner evidence.
- If uncertain/ambiguous -> UNCERTAIN status; recommend SAME_CONCEPT_DIFFERENT_FORM to gather clearer evidence.`;

  const user = `Subject: ${input.subject}
Concept: ${input.conceptName}
Question type: ${input.questionType}
Question: ${input.question}
Accepted correct answer / model answer: ${input.correctAnswer}
Reference explanation: ${input.explanation}

Learner's answer: ${input.learnerAnswer}
${input.codeExecutionEvidence ? `\nCode execution evidence:\n${input.codeExecutionEvidence}` : ""}

A fast pre-classifier suggested: ${input.priorClassification.label} (confidence ${input.priorClassification.confidence.toFixed(
    2
  )}).
Use this as a prior, but reason independently — the pre-classifier is not authoritative.

Produce your full diagnosis now.`;

  const primary = await structuredAICall({
    tier: "reasoning",
    system,
    user,
    schema: AIEvaluationSchema,
    temperature: 0.3,
    maxTokens: 1500,
  });

  const needsEscalation =
    primary.data.confidence < 0.55 ||
    primary.data.status === "UNCERTAIN" ||
    input.priorClassification.label !== primary.data.status;

  if (!needsEscalation) {
    return { evaluation: primary.data, modelUsed: primary.modelUsed, escalated: false };
  }

  // Escalate to DeepSeek-V4 only for genuinely ambiguous / low-confidence cases.
  const deep = await structuredAICall({
    tier: "deepReasoning",
    system: system + "\n\nThis case was flagged as AMBIGUOUS or LOW-CONFIDENCE by a mid-tier model. Reason carefully and resolve the ambiguity.",
    user: user + `\n\nA prior reasoning pass produced: ${JSON.stringify(primary.data)}. Re-evaluate independently; you may agree or disagree.`,
    schema: AIEvaluationSchema,
    temperature: 0.2,
    maxTokens: 1500,
  });

  return { evaluation: deep.data, modelUsed: deep.modelUsed, escalated: true };
}
