export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "CODE_OUTPUT"
  | "CODE_WRITING"
  | "DEBUGGING"
  | "CONCEPTUAL_EXPLANATION"
  | "SCENARIO"
  | "PRACTICAL_PROBLEM";

export type QuestionPurpose =
  | "BASELINE"
  | "SAME_CONCEPT_EASIER"
  | "SAME_CONCEPT_DIFFERENT_FORM"
  | "SAME_CONCEPT_HARDER"
  | "PREREQUISITE_TEST"
  | "REMEDIAL_TEST"
  | "TRANSFER_TEST"
  | "RELATED_CONCEPT"
  | "NEW_CONCEPT"
  | "ADVANCED_CONCEPT";

export interface GeneratedQuestionDTO {
  id: string;
  sequence: number;
  conceptId: string;
  conceptName: string;
  type: QuestionType;
  purpose: QuestionPurpose;
  difficulty: number;
  prompt: string;
  options: string[] | null;
  explanation?: string; // only sent to client AFTER answering
  rationale: string | null;
}
