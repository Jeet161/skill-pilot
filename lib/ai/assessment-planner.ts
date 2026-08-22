import "server-only";
import { structuredAICall } from "./router";
import { AssessmentBlueprintSchema, type AssessmentBlueprint } from "@/lib/validation/ai";
import type { AssessmentMode } from "@/types/assessment";

export async function planAssessmentBlueprint(
  subject: string,
  mode: AssessmentMode,
  targetCount: number
): Promise<{ blueprint: AssessmentBlueprint; modelUsed: string }> {
  console.log(`[Blueprint Planner] Designing dynamic blueprint for subject: ${subject} using AI`);

  const system = `You are an expert curriculum designer and education architect.
Your task is to design a structured assessment blueprint for the subject "${subject}" in "${mode}" mode with a target count of ${targetCount} questions.

You must output a JSON object matching the following structure:
{
  "subject": string (should be "${subject}"),
  "goal": string (a concise summary of the assessment's learning goal, max 300 characters),
  "concepts": [
    {
      "id": string (unique slug-like concept identifier, lowercase alphanumeric and hyphens only, e.g. "variables-and-types"),
      "name": string (human readable name of the concept, e.g. "Variables and Types"),
      "description": string (brief description of what is tested under this concept, max 400 characters),
      "importance": number (importance weight from 0.0 to 1.0),
      "prerequisites": string[] (ids of other concepts in this blueprint that must be tested/mastered first),
      "suggestedQuestionTypes": string[] (array of question types suited for this concept),
      "approxDifficulty": number (approximate difficulty level from 0.0 to 1.0)
    }
  ],
  "coverageStrategy": string (strategy for evaluating the concepts, max 500 characters)
}

Important constraints:
- Provide between 4 and 40 concepts.
- The concept IDs must be alphanumeric and hyphens only (no spaces, no special characters).
- suggestedQuestionTypes must contain valid question types from: ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "CODE_OUTPUT", "CODE_WRITING", "DEBUGGING", "CONCEPTUAL_EXPLANATION", "SCENARIO", "PRACTICAL_PROBLEM"]. At least one suggested type is required.
- Do not repeat concept IDs.`;

  const result = await structuredAICall({
    tier: "reasoning",
    system,
    user: `Design an assessment blueprint for "${subject}" with ${targetCount} questions in "${mode}" mode.`,
    schema: AssessmentBlueprintSchema,
    temperature: 0.3,
    maxTokens: 3000,
  });

  return { blueprint: result.data, modelUsed: result.modelUsed };
}

