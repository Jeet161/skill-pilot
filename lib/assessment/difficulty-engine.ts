/**
 * Simple, transparent difficulty adjustment (Elo-ish / staircase hybrid).
 * The AI adaptive-engine decision still governs WHICH concept/purpose is
 * next; this module governs WHAT difficulty to request for that concept.
 */
export function nextDifficulty(params: {
  currentEstimateProficiency: number | null; // null if no prior evidence for this concept
  lastQuestionDifficulty: number | null;
  lastWasCorrect: boolean | null;
  purpose: string;
}): number {
  const { currentEstimateProficiency, lastQuestionDifficulty, lastWasCorrect, purpose } = params;

  // Baseline / new concept: start near the middle, slightly below to build confidence.
  if (purpose === "NEW_CONCEPT" || purpose === "BASELINE" || currentEstimateProficiency === null) {
    return 0.45;
  }

  const base = lastQuestionDifficulty ?? currentEstimateProficiency;

  switch (purpose) {
    case "SAME_CONCEPT_EASIER":
    case "REMEDIAL_TEST":
      return clamp(base - 0.2);
    case "PREREQUISITE_TEST":
      return clamp(base - 0.3);
    case "SAME_CONCEPT_HARDER":
    case "ADVANCED_CONCEPT":
      return clamp(base + 0.2);
    case "SAME_CONCEPT_DIFFERENT_FORM":
      return clamp(base); // hold difficulty steady, vary form instead
    case "TRANSFER_TEST":
      return clamp(base + 0.05); // transfer should feel comparable, maybe slightly harder
    case "RELATED_CONCEPT":
      return clamp(currentEstimateProficiency ?? 0.45);
    default: {
      if (lastWasCorrect === true) return clamp(base + 0.1);
      if (lastWasCorrect === false) return clamp(base - 0.1);
      return clamp(base);
    }
  }
}

function clamp(n: number): number {
  return Math.max(0.1, Math.min(0.95, Math.round(n * 100) / 100));
}
