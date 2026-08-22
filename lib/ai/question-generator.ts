import "server-only";
import { structuredAICall } from "./router";
import { GeneratedQuestionSchema, type GeneratedQuestionAI } from "@/lib/validation/ai";
import type { AdaptiveDecision, BlueprintConcept, LearnerStateSnapshot } from "@/types/assessment";

export interface QuestionGenerationContext {
  subject: string;
  concept: BlueprintConcept;
  decision: AdaptiveDecision;
  learnerState: LearnerStateSnapshot;
  previousPromptsForConcept: string[]; // for duplicate avoidance
  recentPromptsOverall: string[];
}

export async function generateQuestion(
  ctx: QuestionGenerationContext
): Promise<{ question: GeneratedQuestionAI; modelUsed: string }> {
  console.log(`[Question Generator] Dynamically generating question for concept: ${ctx.concept.name} (${ctx.concept.id}) using AI`);

  const system = `You are an expert question designer for technical skill assessments.
Your task is to generate a high-quality assessment question for the concept "${ctx.concept.name}" under the subject "${ctx.subject}".

The question purpose is: "${ctx.decision.action}".
Target difficulty is: ${ctx.decision.targetDifficulty} (0.0 = very easy, 1.0 = extremely hard).

You must output a JSON object matching the following structure:
{
  "question": string (the question text/prompt. For coding questions, include markdown code blocks if necessary),
  "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "CODE_OUTPUT" | "CODE_WRITING" | "DEBUGGING" | "CONCEPTUAL_EXPLANATION" | "SCENARIO" | "PRACTICAL_PROBLEM",
  "options": string[] (only for MULTIPLE_CHOICE or TRUE_FALSE, must contain between 2 and 6 options),
  "correctAnswer": string (the exact correct option from the options array, or the correct answer text),
  "explanation": string (clear explanation of why the correct answer is right and why other options are wrong),
  "targetConcept": string (should be "${ctx.concept.id}"),
  "difficulty": number (difficulty score between 0.0 and 1.0, close to the target difficulty of ${ctx.decision.targetDifficulty}),
  "rationale": string (explanation of how this question tests the concept and aligns with the target difficulty)
}

Important guidelines:
1. Ensure the question is unique. Avoid repeating any of the following previously used prompts:
${ctx.previousPromptsForConcept.map(p => `- ${p}`).join("\n")}
Recent prompts:
${ctx.recentPromptsOverall.map(p => `- ${p}`).join("\n")}

2. Make sure the type matches one of the suggested types: ${ctx.concept.suggestedQuestionTypes?.join(", ") || "MULTIPLE_CHOICE"}.
3. The options must be plausible but only one option must be the correct answer. The correctAnswer must match one of the options exactly (case-insensitive) for MULTIPLE_CHOICE/TRUE_FALSE.`;

  const result = await structuredAICall({
    tier: "question",
    system,
    user: `Generate a question for the concept "${ctx.concept.name}" at difficulty ${ctx.decision.targetDifficulty} with purpose "${ctx.decision.action}".`,
    schema: GeneratedQuestionSchema,
    temperature: 0.7,
    maxTokens: 2000,
  });

  return { question: result.data, modelUsed: result.modelUsed };
}

