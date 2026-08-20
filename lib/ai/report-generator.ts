import "server-only";
import { structuredAICall } from "./router";
import { FinalReportSchema, type FinalReportAI } from "@/lib/validation/ai";

export interface ReportInput {
  subject: string;
  goal: string;
  totalQuestions: number;
  skillEstimates: Array<{
    conceptName: string;
    proficiency: number;
    evidenceConfidence: number;
    state: string;
    transferVerified: boolean;
  }>;
  misconceptionsObserved: string[];
  difficultyProgression: number[]; // difficulty of each question asked, in order
  transferSuccessRate: number;
  earlyAccuracy: number; // accuracy across first third
  lateAccuracy: number; // accuracy across last third
}

/**
 * Synthesizes the entire assessment session into a learner-facing final
 * report, unique to this learner's actual evidence trail.
 */
export async function generateFinalReport(
  input: ReportInput
): Promise<{ report: FinalReportAI; modelUsed: string }> {
  const system = `You are an expert assessment analyst producing a final,
learner-facing skill report. Base every claim strictly on the evidence
provided — never invent skills, gaps, or numbers not implied by the data.

Respond with ONLY a JSON object:
{
  "summary": string (<=1200 chars, narrative overview of what this specific learner demonstrated, written directly to the learner as "you"),
  "strongAreas": string[] (concept names with strong verified evidence),
  "weakAreas": string[],
  "developingAreas": string[],
  "uncertainAreas": string[] (concepts with insufficient or conflicting evidence),
  "misconceptions": [{ "concept": string, "description": string }],
  "evidenceOfImprovement": string (<=400 chars, describe concretely how performance changed from early to late in the assessment, or state plainly if it did not),
  "recommendedNextAreas": string[] (what to study next, ordered by priority),
  "remainingUncertainties": string[] (things the assessment could not confidently determine)
}
Use precise, evidence-based language ("estimated proficiency", "based on N questions") — avoid absolute claims.`;

  const user = `Subject: ${input.subject}
Assessment goal: ${input.goal}
Total questions answered: ${input.totalQuestions}
Early-assessment accuracy: ${(input.earlyAccuracy * 100).toFixed(0)}%
Late-assessment accuracy: ${(input.lateAccuracy * 100).toFixed(0)}%
Transfer-question success rate: ${(input.transferSuccessRate * 100).toFixed(0)}%
Difficulty progression (question order): ${input.difficultyProgression.map((d) => d.toFixed(2)).join(", ")}

Per-concept skill estimates:
${input.skillEstimates
  .map(
    (e) =>
      `- ${e.conceptName}: proficiency=${(e.proficiency * 100).toFixed(0)}%, evidenceConfidence=${(
        e.evidenceConfidence * 100
      ).toFixed(0)}%, state=${e.state}, transferVerified=${e.transferVerified}`
  )
  .join("\n")}

Misconceptions observed during the assessment:
${input.misconceptionsObserved.length ? input.misconceptionsObserved.join("\n") : "(none clearly identified)"}

Write the final report now, grounded strictly in this evidence.`;

  const result = await structuredAICall({
    tier: "reasoning",
    system,
    user,
    schema: FinalReportSchema,
    temperature: 0.4,
    maxTokens: 3000,
    fallbackTier: "deepReasoning",
  });

  return { report: result.data, modelUsed: result.modelUsed };
}
