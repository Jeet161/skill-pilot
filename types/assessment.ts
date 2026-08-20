import { QuestionPurpose, QuestionType } from "./question";

export type AssessmentMode = "BALANCED" | "DEEP" | "PRACTICAL" | "CONCEPTUAL";
export type AssessmentStatus =
  | "BLUEPRINT_PENDING"
  | "IN_PROGRESS"
  | "GENERATING_QUESTION"
  | "AWAITING_ANSWER"
  | "COMPLETED"
  | "ABANDONED"
  | "FAILED";

export interface BlueprintConcept {
  id: string;
  name: string;
  description?: string;
  importance: number; // 0..1
  prerequisites: string[]; // ids of other concepts
  suggestedQuestionTypes: QuestionType[];
  approxDifficulty: number; // 0..1 baseline difficulty
}

export interface AssessmentBlueprintDTO {
  subject: string;
  goal: string;
  concepts: BlueprintConcept[];
  coverageStrategy: string;
}

export interface EvaluationDTO {
  status: "CORRECT" | "INCORRECT" | "PARTIALLY_CORRECT" | "UNCERTAIN";
  correctness: number;
  confidence: number;
  errorType:
    | "NONE"
    | "CONCEPTUAL_GAP"
    | "SYNTAX_ERROR"
    | "LOGIC_ERROR"
    | "TYPE_ERROR"
    | "GUESS"
    | "UNKNOWN";
  misconception: string | null;
  understood: string[];
  missing: string[];
  recommendedAction: QuestionPurpose;
  explanationForLearner?: string;
}

export interface AdaptiveDecision {
  action: QuestionPurpose;
  targetConceptId: string;
  targetDifficulty: number;
  reason: string;
  needsIntervention: boolean;
}

export interface LearnerStateSnapshot {
  sessionId: string;
  subject: string;
  askedCount: number;
  targetCount: number;
  estimates: Record<
    string,
    {
      proficiency: number;
      evidenceConfidence: number;
      evidenceCount: number;
      state: string;
      difficultyCeiling: number;
      transferVerified: boolean;
    }
  >;
  recentAccuracy: number;
  overallDifficulty: number;
}
