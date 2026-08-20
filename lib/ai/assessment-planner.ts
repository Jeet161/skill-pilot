import "server-only";
import { structuredAICall } from "./router";
import { AssessmentBlueprintSchema, type AssessmentBlueprint } from "@/lib/validation/ai";
import type { AssessmentMode } from "@/types/assessment";

/**
 * Given ONLY a subject name (e.g. "Python", "SQL", "Electronics") chosen
 * by the learner, ask Featherless to discover the relevant concept graph
 * for that subject at runtime. Nothing about any subject is hardcoded —
 * this same function must work for any subject string.
 */
export async function planAssessmentBlueprint(
  subject: string,
  mode: AssessmentMode,
  targetCount: number
): Promise<{ blueprint: AssessmentBlueprint; modelUsed: string }> {
  const system = `You are a curriculum architect. Given a subject, output a JSON concept map for an adaptive skill assessment.

Respond with ONLY valid JSON (no markdown, no prose) matching exactly:
{
  "subject": string,
  "goal": string,
  "concepts": [
    {
      "id": string (slug: lowercase, hyphens only),
      "name": string,
      "description": string (1 sentence),
      "importance": number 0..1,
      "prerequisites": string[] (ids from this list only),
      "suggestedQuestionTypes": string[] (from: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, CODE_OUTPUT, CODE_WRITING, DEBUGGING, CONCEPTUAL_EXPLANATION, SCENARIO, PRACTICAL_PROBLEM),
      "approxDifficulty": number 0..1
    }
  ],
  "coverageStrategy": string
}

Rules: 8-12 concepts. Order foundational to advanced. No markdown outside JSON.`;

  const user = `Subject: ${subject}
Mode: ${mode}. Question budget: ${targetCount}.
Generate the concept blueprint JSON now.`;

  const result = await structuredAICall({
    tier: "reasoning",
    system,
    user,
    schema: AssessmentBlueprintSchema,
    temperature: 0.3,
    maxTokens: 3000,
    fallbackTier: "deepReasoning",
  });

  return { blueprint: result.data, modelUsed: result.modelUsed };
}
