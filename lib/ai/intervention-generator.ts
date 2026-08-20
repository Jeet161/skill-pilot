import "server-only";
import { structuredAICall } from "./router";
import { InterventionSchema, type InterventionAI } from "@/lib/validation/ai";

export interface InterventionInput {
  subject: string;
  conceptName: string;
  misconception: string | null;
  missing: string[];
  learnerAnswer: string;
  question: string;
  explanation: string;
}

/**
 * Generates a short, targeted "quick review" explanation when a weakness
 * is detected. Never a hardcoded lesson — always produced fresh from the
 * specific evidence of this learner's specific mistake.
 */
export async function generateIntervention(
  input: InterventionInput
): Promise<{ intervention: InterventionAI; modelUsed: string }> {
  const system = `You are a warm, precise technical tutor. A learner just
revealed a specific knowledge gap. Write a SHORT, targeted "quick review"
that addresses exactly that gap — not a generic lesson on the whole topic.

Respond with ONLY a JSON object:
{
  "title": string (<=60 chars, e.g. "Quick review: range() in for-loops"),
  "explanation": string (<=700 chars, plain language, may include a tiny inline code example, ends with a one-sentence key takeaway)
}
No markdown headers. Keep it focused and encouraging, never condescending.`;

  const user = `Subject: ${input.subject}
Concept: ${input.conceptName}
Question the learner faced: ${input.question}
Learner's answer: ${input.learnerAnswer}
Reference explanation: ${input.explanation}
Likely misconception: ${input.misconception ?? "unspecified"}
Missing sub-ideas: ${input.missing.join(", ") || "unspecified"}

Write the quick review now, targeted precisely at this gap.`;

  const result = await structuredAICall({
    tier: "reasoning",
    system,
    user,
    schema: InterventionSchema,
    temperature: 0.5,
    maxTokens: 1000,
  });

  return { intervention: result.data, modelUsed: result.modelUsed };
}
