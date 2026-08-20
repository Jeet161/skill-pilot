import type { BlueprintConcept } from "@/types/assessment";

export interface ConceptCoverageInfo {
  conceptId: string;
  evidenceCount: number;
  proficiency: number;
  evidenceConfidence: number;
  transferVerified: boolean;
}

/**
 * Picks the next concept to introduce (used for NEW_CONCEPT /
 * RELATED_CONCEPT / ADVANCED_CONCEPT decisions). Prioritizes:
 *   1. Untested prerequisites of already-touched concepts
 *   2. Highest-importance untested concepts
 *   3. Concepts with the least evidence so far
 */
export function selectNextConcept(
  concepts: BlueprintConcept[],
  coverage: Map<string, ConceptCoverageInfo>,
  excludeConceptId?: string
): BlueprintConcept | null {
  const candidates = concepts.filter((c) => c.id !== excludeConceptId);
  if (candidates.length === 0) return null;

  // 1. untested prerequisites of partially-tested concepts
  const touchedIds = new Set([...coverage.keys()]);
  const untestedPrereqs = candidates.filter((c) => {
    const isPrereqOfTouched = candidates.some(
      (other) => touchedIds.has(other.id) && other.prerequisites.includes(c.id)
    );
    return isPrereqOfTouched && !touchedIds.has(c.id);
  });
  if (untestedPrereqs.length > 0) {
    return sortByImportance(untestedPrereqs)[0];
  }

  // 2. completely untested concepts, by importance
  const untested = candidates.filter((c) => !touchedIds.has(c.id));
  if (untested.length > 0) {
    return sortByImportance(untested)[0];
  }

  // 3. least-evidence concept among tested ones (revisit for more confidence)
  const withEvidence = candidates
    .map((c) => ({ concept: c, cov: coverage.get(c.id) }))
    .filter((x) => x.cov)
    .sort((a, b) => (a.cov!.evidenceCount ?? 0) - (b.cov!.evidenceCount ?? 0));

  return withEvidence[0]?.concept ?? candidates[0];
}

function sortByImportance(concepts: BlueprintConcept[]): BlueprintConcept[] {
  return [...concepts].sort((a, b) => b.importance - a.importance);
}

export function findConcept(
  concepts: BlueprintConcept[],
  id: string
): BlueprintConcept | undefined {
  return concepts.find((c) => c.id === id);
}

export function findPrerequisite(
  concepts: BlueprintConcept[],
  conceptId: string
): BlueprintConcept | null {
  const concept = findConcept(concepts, conceptId);
  if (!concept || concept.prerequisites.length === 0) return null;
  return findConcept(concepts, concept.prerequisites[0]) ?? null;
}
