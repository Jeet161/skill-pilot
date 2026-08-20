import "server-only";
import { structuredAICall } from "./router";
import { ClassificationSchema, type Classification } from "@/lib/validation/ai";

/**
 * Cheap first-pass classification using the small classifier model
 * (Qwen3.5-9B). This is NOT responsible for deep diagnosis — it exists
 * to (a) short-circuit obviously-objective questions cheaply and
 * (b) give the diagnostician a fast prior to reason from.
 */
export async function classifyAnswer(params: {
  question: string;
  correctAnswer: string;
  learnerAnswer: string;
  questionType: string;
}): Promise<{ classification: Classification; modelUsed: string }> {
  const system = `You are a fast, inexpensive answer classifier for a technical
assessment platform. Given a question, the accepted correct answer, and the
learner's submitted answer, you must respond with a valid JSON object.

The JSON object must match this schema:
{
  "label": "CORRECT" | "INCORRECT" | "PARTIALLY_CORRECT" | "UNCERTAIN" | "CONCEPTUAL_GAP" | "SYNTAX_ERROR" | "LOGIC_ERROR" | "TYPE_ERROR" | "GUESS",
  "confidence": number (between 0 and 1)
}

Respond with only valid json format. No explanation, no Markdown fences.`;

  const user = `Question type: ${params.questionType}
Question: ${params.question}
Accepted correct answer: ${params.correctAnswer}
Learner's answer: ${params.learnerAnswer}`;

  const result = await structuredAICall({
    tier: "classifier",
    system,
    user,
    schema: ClassificationSchema,
    temperature: 0.1,
    maxTokens: 120,
    fallbackTier: "reasoning",
  });

  return { classification: result.data, modelUsed: result.modelUsed };
}
