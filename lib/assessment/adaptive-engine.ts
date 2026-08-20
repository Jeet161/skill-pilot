import type { AdaptiveDecision, BlueprintConcept, EvaluationDTO } from "@/types/assessment";
import { nextDifficulty } from "./difficulty-engine";
import { shouldIssueTransferTest } from "./transfer-engine";
import { findConcept, findPrerequisite, selectNextConcept, type ConceptCoverageInfo } from "./question-selector";

export interface AdaptiveEngineInput {
  concepts: BlueprintConcept[];
  currentConceptId: string;
  currentPurpose: string;
  currentDifficulty: number;
  evaluation: EvaluationDTO;
  coverage: Map<string, ConceptCoverageInfo>;
  askedCount: number;
  targetCount: number;
}

/**
 * The server-authoritative adaptive engine. The AI diagnostician provides
 * a `recommendedAction` (see EvaluationDTO), but THIS function is the
 * final arbiter: it validates that recommendation against real session
 * state and can override it (e.g. transfer already verified, budget
 * nearly exhausted, prerequisite doesn't exist in this blueprint).
 *
 * This is what guarantees SkillPilot never "just moves on" after a wrong
 * answer without first trying to pin down the actual gap.
 */
export function decideNextStep(input: AdaptiveEngineInput): AdaptiveDecision {
  const {
    concepts,
    currentConceptId,
    currentPurpose,
    currentDifficulty,
    evaluation,
    coverage,
    askedCount,
    targetCount,
  } = input;

  const currentConcept = findConcept(concepts, currentConceptId);
  const currentCoverage = coverage.get(currentConceptId);
  const remaining = targetCount - askedCount;
  const isCorrect = evaluation.status === "CORRECT";
  const isIncorrect = evaluation.status === "INCORRECT";
  const isPartial = evaluation.status === "PARTIALLY_CORRECT";

  // Near the end of the budget: prioritize closing out uncertain concepts
  // rather than opening brand-new ones.
  const nearingEnd = remaining <= 2;

  // --- 1. Wrong answer: never just move on. Diagnose -> remediate -> retest. ---
  if (isIncorrect || evaluation.errorType === "CONCEPTUAL_GAP") {
    // Possible missing prerequisite
    if (evaluation.recommendedAction === "PREREQUISITE_TEST") {
      const prereq = findPrerequisite(concepts, currentConceptId);
      if (prereq) {
        return {
          action: "PREREQUISITE_TEST",
          targetConceptId: prereq.id,
          targetDifficulty: nextDifficulty({
            currentEstimateProficiency: coverage.get(prereq.id)?.proficiency ?? null,
            lastQuestionDifficulty: currentDifficulty,
            lastWasCorrect: false,
            purpose: "PREREQUISITE_TEST",
          }),
          reason: `Your answer suggests a possible gap in a prerequisite: ${prereq.name}.`,
          needsIntervention: true,
        };
      }
    }

    // Default: stay on this concept, easier, with an intervention.
    return {
      action: "SAME_CONCEPT_EASIER",
      targetConceptId: currentConceptId,
      targetDifficulty: nextDifficulty({
        currentEstimateProficiency: currentCoverage?.proficiency ?? null,
        lastQuestionDifficulty: currentDifficulty,
        lastWasCorrect: false,
        purpose: "SAME_CONCEPT_EASIER",
      }),
      reason: `We're re-testing ${currentConcept?.name ?? "this concept"} at an easier level to confirm the gap.`,
      needsIntervention: true,
    };
  }

  // --- 2. Partially correct: get cleaner evidence with a different form. ---
  if (isPartial || evaluation.status === "UNCERTAIN") {
    return {
      action: "SAME_CONCEPT_DIFFERENT_FORM",
      targetConceptId: currentConceptId,
      targetDifficulty: nextDifficulty({
        currentEstimateProficiency: currentCoverage?.proficiency ?? null,
        lastQuestionDifficulty: currentDifficulty,
        lastWasCorrect: null,
        purpose: "SAME_CONCEPT_DIFFERENT_FORM",
      }),
      reason: `Your answer was partially correct — testing ${currentConcept?.name ?? "the concept"} in a different form to clarify.`,
      needsIntervention: evaluation.missing.length > 0,
    };
  }

  // --- 3. Correct answer ---
  if (isCorrect) {
    const wasRemedialOrEasier =
      currentPurpose === "SAME_CONCEPT_EASIER" || currentPurpose === "REMEDIAL_TEST";
    const transferVerified = currentCoverage?.transferVerified ?? false;

    // If this was a recovery from a prior mistake, verify with transfer before moving on.
    if (wasRemedialOrEasier || shouldIssueTransferTest({
      lastCorrect: true,
      transferAlreadyVerified: transferVerified,
      lastPurpose: currentPurpose,
    })) {
      return {
        action: "TRANSFER_TEST",
        targetConceptId: currentConceptId,
        targetDifficulty: nextDifficulty({
          currentEstimateProficiency: currentCoverage?.proficiency ?? null,
          lastQuestionDifficulty: currentDifficulty,
          lastWasCorrect: true,
          purpose: "TRANSFER_TEST",
        }),
        reason: `Correct! Now verifying you can apply ${currentConcept?.name ?? "this concept"} in a different context.`,
        needsIntervention: false,
      };
    }

    // Transfer just succeeded (or already verified) -> mastery confirmed, move on.
    if (currentPurpose === "TRANSFER_TEST" || transferVerified) {
      const next = nearingEnd
        ? pickLeastConfidentConcept(concepts, coverage, currentConceptId)
        : selectNextConcept(concepts, coverage, currentConceptId);

      const target = next ?? currentConcept!;
      return {
        action: coverage.has(target.id) ? "RELATED_CONCEPT" : "NEW_CONCEPT",
        targetConceptId: target.id,
        targetDifficulty: nextDifficulty({
          currentEstimateProficiency: coverage.get(target.id)?.proficiency ?? null,
          lastQuestionDifficulty: null,
          lastWasCorrect: null,
          purpose: coverage.has(target.id) ? "RELATED_CONCEPT" : "NEW_CONCEPT",
        }),
        reason: `Confidence in ${currentConcept?.name ?? "that concept"} increased. Moving to ${target.name}.`,
        needsIntervention: false,
      };
    }

    // Otherwise: doing well, push difficulty up on same concept, or if this
    // concept has strong evidence already, advance to something new.
    const strongAlready = (currentCoverage?.proficiency ?? 0) >= 0.75 && (currentCoverage?.evidenceCount ?? 0) >= 2;
    if (strongAlready) {
      const next = selectNextConcept(concepts, coverage, currentConceptId) ?? currentConcept!;
      return {
        action: coverage.has(next.id) ? "RELATED_CONCEPT" : "NEW_CONCEPT",
        targetConceptId: next.id,
        targetDifficulty: nextDifficulty({
          currentEstimateProficiency: coverage.get(next.id)?.proficiency ?? null,
          lastQuestionDifficulty: null,
          lastWasCorrect: null,
          purpose: "NEW_CONCEPT",
        }),
        reason: `Strong performance on ${currentConcept?.name ?? "that concept"}. Advancing to ${next.name}.`,
        needsIntervention: false,
      };
    }

    return {
      action: "SAME_CONCEPT_HARDER",
      targetConceptId: currentConceptId,
      targetDifficulty: nextDifficulty({
        currentEstimateProficiency: currentCoverage?.proficiency ?? null,
        lastQuestionDifficulty: currentDifficulty,
        lastWasCorrect: true,
        purpose: "SAME_CONCEPT_HARDER",
      }),
      reason: `Correct — increasing difficulty on ${currentConcept?.name ?? "this concept"}.`,
      needsIntervention: false,
    };
  }

  // Fallback (should be unreachable): pick a new concept.
  const fallbackConcept = selectNextConcept(concepts, coverage, currentConceptId) ?? concepts[0];
  return {
    action: "NEW_CONCEPT",
    targetConceptId: fallbackConcept.id,
    targetDifficulty: 0.45,
    reason: "Continuing the assessment.",
    needsIntervention: false,
  };
}

function pickLeastConfidentConcept(
  concepts: BlueprintConcept[],
  coverage: Map<string, ConceptCoverageInfo>,
  excludeId: string
): BlueprintConcept {
  const scored = concepts
    .filter((c) => c.id !== excludeId)
    .map((c) => ({ concept: c, cov: coverage.get(c.id) }))
    .sort((a, b) => (a.cov?.evidenceConfidence ?? 0) - (b.cov?.evidenceConfidence ?? 0));
  return scored[0]?.concept ?? concepts[0];
}
