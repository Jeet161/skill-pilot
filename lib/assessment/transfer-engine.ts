import type { GeneratedQuestionDTO } from "@/types/question";

/**
 * A concept "deserves" a transfer test when the learner just answered
 * correctly on that concept AND we haven't already verified transfer for
 * it. Transfer must use a different question type than the one that was
 * just answered correctly, so we surface the previous type to exclude.
 */
export function shouldIssueTransferTest(params: {
  lastCorrect: boolean;
  transferAlreadyVerified: boolean;
  lastPurpose: string;
}): boolean {
  if (!params.lastCorrect) return false;
  if (params.transferAlreadyVerified) return false;
  // Don't chain an infinite transfer loop — only trigger once per successful non-transfer answer.
  if (params.lastPurpose === "TRANSFER_TEST") return false;
  return true;
}

export function excludedQuestionTypeForTransfer(
  previousQuestion: Pick<GeneratedQuestionDTO, "type">
): string {
  return previousQuestion.type;
}
