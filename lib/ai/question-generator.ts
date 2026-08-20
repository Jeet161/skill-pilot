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

/**
 * Generates exactly ONE question, tailored to the current learner state.
 * This is called fresh for every single question in the assessment —
 * never in a batch.
 */
export async function generateQuestion(
  ctx: QuestionGenerationContext
): Promise<{ question: GeneratedQuestionAI; modelUsed: string }> {
  const system = `You are an expert technical assessment item writer.
You generate exactly ONE high-quality assessment question at a time, precisely
targeted at a specific concept, difficulty, and purpose for a specific learner.

Respond with ONLY a JSON object matching this exact shape:
{
  "question": string (the full question prompt, self-contained, include any code snippets inline using markdown fenced code blocks where relevant),
  "type": one of ["MULTIPLE_CHOICE","TRUE_FALSE","SHORT_ANSWER","CODE_OUTPUT","CODE_WRITING","DEBUGGING","CONCEPTUAL_EXPLANATION","SCENARIO","PRACTICAL_PROBLEM"],
  "options": string[] (ONLY include for MULTIPLE_CHOICE or TRUE_FALSE, 2-5 plausible options),
  "correctAnswer": string (for MULTIPLE_CHOICE/TRUE_FALSE this MUST exactly equal one of the options verbatim; for other types, a clear model answer or key output),
  "explanation": string (why the correct answer is correct — shown to the learner AFTER they answer),
  "targetConcept": string (must equal the given concept id exactly),
  "difficulty": number 0..1 (should be close to the requested target difficulty),
  "rationale": string (<=200 chars, learner-facing, explains why this question was chosen right now, e.g. "Testing the same concept in a different form after your last answer")
}

Rules:
- The question must be answerable without external tools.
- Never repeat or closely paraphrase any of the "previous questions" you are shown.
- Match the requested question purpose precisely (see below).
- Keep the question focused on ONE concept at a time.
- No markdown or prose outside the JSON object.`;

  const purposeGuidance: Record<string, string> = {
    BASELINE: "This is an early question establishing a baseline. Moderate difficulty, clear and unambiguous.",
    SAME_CONCEPT_EASIER: "The learner struggled. Generate an EASIER question on the exact same concept, more scaffolded.",
    SAME_CONCEPT_DIFFERENT_FORM: "The learner answered correctly at an easier level. Re-test the SAME concept using a DIFFERENT question type/form to verify real understanding (not just a lucky guess).",
    SAME_CONCEPT_HARDER: "The learner is doing well. Increase difficulty on the same concept.",
    PREREQUISITE_TEST: "The learner may be missing a prerequisite. Test the prerequisite concept directly.",
    REMEDIAL_TEST: "Re-test a previously weak concept after the learner has seen a review explanation.",
    TRANSFER_TEST: "The learner just succeeded on this concept. Test whether they can TRANSFER it: apply the same underlying idea in a meaningfully different context/problem/format than before.",
    RELATED_CONCEPT: "Move laterally to a related but distinct concept.",
    NEW_CONCEPT: "Introduce a new, previously untested concept from the blueprint.",
    ADVANCED_CONCEPT: "The learner has shown strong mastery broadly. Push into an advanced concept.",
  };

  const user = `Subject: ${ctx.subject}

Target concept: ${ctx.concept.name} (id: ${ctx.concept.id})
Concept description: ${ctx.concept.description ?? "n/a"}
Suggested question types for this concept: ${ctx.concept.suggestedQuestionTypes.join(", ")}

Question purpose: ${ctx.decision.action}
Purpose guidance: ${purposeGuidance[ctx.decision.action] ?? ""}
Target difficulty (0..1): ${ctx.decision.targetDifficulty}
Adaptive engine reasoning: ${ctx.decision.reason}

Learner snapshot:
- Questions asked so far: ${ctx.learnerState.askedCount}/${ctx.learnerState.targetCount}
- Recent accuracy: ${(ctx.learnerState.recentAccuracy * 100).toFixed(0)}%
- Current estimate for this concept: ${JSON.stringify(
    ctx.learnerState.estimates[ctx.concept.id] ?? "no prior evidence"
  )}

Do NOT repeat any of these previous questions (avoid duplicates and close paraphrases):
${[...ctx.previousPromptsForConcept, ...ctx.recentPromptsOverall]
  .slice(-15)
  .map((q, i) => `${i + 1}. ${q.slice(0, 200)}`)
  .join("\n") || "(none yet)"}

Generate the next question now.`;

  const result = await structuredAICall({
    tier: "question",
    system,
    user,
    schema: GeneratedQuestionSchema,
    temperature: 0.7,
    maxTokens: 2500,
    fallbackTier: "reasoning",
  });

  return { question: result.data, modelUsed: result.modelUsed };
}
