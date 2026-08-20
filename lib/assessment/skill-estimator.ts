import type { SkillState } from "@/types/skill";

export interface Observation {
  correctness: number; // 0..1
  difficulty: number; // 0..1
  evidenceType: string; // baseline | transfer | remedial | ...
}

export interface RolledUpEstimate {
  proficiency: number;
  evidenceConfidence: number;
  evidenceCount: number;
  state: SkillState;
  difficultyCeiling: number;
  transferVerified: boolean;
}

/**
 * Rolls a concept's observation history into a single proficiency
 * estimate. Uses a recency-and-difficulty-weighted average rather than a
 * naive percent-correct, and treats transfer evidence as the strongest
 * signal of real mastery.
 */
export function estimateSkill(observations: Observation[]): RolledUpEstimate {
  if (observations.length === 0) {
    return {
      proficiency: 0,
      evidenceConfidence: 0,
      evidenceCount: 0,
      state: "UNCERTAIN",
      difficultyCeiling: 0,
      transferVerified: false,
    };
  }

  let weightedSum = 0;
  let weightTotal = 0;
  let difficultyCeiling = 0;
  let transferVerified = false;

  observations.forEach((obs, idx) => {
    // more recent observations count more
    const recencyWeight = 0.6 + 0.4 * ((idx + 1) / observations.length);
    // harder questions answered correctly count more toward proficiency
    const difficultyWeight = 0.5 + obs.difficulty;
    const evidenceTypeWeight = obs.evidenceType === "transfer" ? 1.4 : 1.0;

    const weight = recencyWeight * difficultyWeight * evidenceTypeWeight;
    weightedSum += obs.correctness * weight;
    weightTotal += weight;

    if (obs.correctness >= 0.8) {
      difficultyCeiling = Math.max(difficultyCeiling, obs.difficulty);
    }
    if (obs.evidenceType === "transfer" && obs.correctness >= 0.75) {
      transferVerified = true;
    }
  });

  const proficiency = weightTotal > 0 ? weightedSum / weightTotal : 0;

  // evidence confidence grows with count, saturating around 5-6 observations
  const evidenceConfidence = Math.min(1, observations.length / 5.5);

  const state = classifyState(proficiency, evidenceConfidence);

  return {
    proficiency: clamp01(proficiency),
    evidenceConfidence: clamp01(evidenceConfidence),
    evidenceCount: observations.length,
    state,
    difficultyCeiling,
    transferVerified,
  };
}

function classifyState(proficiency: number, confidence: number): SkillState {
  if (confidence < 0.35) return "UNCERTAIN";
  if (proficiency >= 0.75) return "STRONG";
  if (proficiency >= 0.45) return "DEVELOPING";
  return "WEAK";
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
