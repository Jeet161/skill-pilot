import "server-only";
import { prisma } from "@/lib/db/prisma";
import { planAssessmentBlueprint } from "@/lib/ai/assessment-planner";
import { generateQuestion } from "@/lib/ai/question-generator";
import { classifyAnswer } from "@/lib/ai/classifier";
import { diagnoseAnswer } from "@/lib/ai/diagnostician";
import { generateIntervention } from "@/lib/ai/intervention-generator";
import { generateFinalReport } from "@/lib/ai/report-generator";
import { decideNextStep } from "./adaptive-engine";
import { estimateSkill, type Observation } from "./skill-estimator";
import { fingerprintQuestion, similarity, DUPLICATE_SIMILARITY_THRESHOLD } from "./fingerprint";
import { tryGetExecutionEvidence } from "./code-runner";
import type {
  AdaptiveDecision,
  AssessmentMode,
  BlueprintConcept,
  EvaluationDTO,
  LearnerStateSnapshot,
} from "@/types/assessment";
import type { ConceptCoverageInfo } from "./question-selector";

const MAX_QUESTION_GEN_ATTEMPTS = 3;

// ---------------------------------------------------------------------------
// Session creation
// ---------------------------------------------------------------------------

export async function createAssessmentSession(params: {
  userId: string;
  subject: string;
  mode: AssessmentMode;
  targetCount: number;
}) {
  const session = await prisma.assessmentSession.create({
    data: {
      userId: params.userId,
      subject: params.subject,
      mode: params.mode,
      targetCount: params.targetCount,
      status: "BLUEPRINT_PENDING",
    },
  });

  // Fire-and-forget: blueprint + first question run in background.
  // The client polls GET /api/assessment/[id] until currentQuestion appears.
  void (async () => {
    try {
      const { blueprint } = await planAssessmentBlueprint(
        params.subject,
        params.mode,
        params.targetCount
      );

      await prisma.assessmentBlueprint.create({
        data: {
          sessionId: session.id,
          subject: blueprint.subject,
          goal: blueprint.goal,
          raw: blueprint as any,
        },
      });

      await prisma.assessmentSession.update({
        where: { id: session.id },
        data: { status: "IN_PROGRESS" },
      });

      await generateAndPersistNextQuestion(session.id);
    } catch (err) {
      console.error("Background session build failed:", err);
      await prisma.assessmentSession
        .update({ where: { id: session.id }, data: { status: "FAILED" } })
        .catch(() => {});
    }
  })();

  return { sessionId: session.id };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getBlueprintConcepts(sessionId: string): Promise<BlueprintConcept[]> {
  const bp = await prisma.assessmentBlueprint.findUnique({ where: { sessionId } });
  if (!bp) throw new Error("Blueprint not found for session");
  return (bp.raw as any).concepts as BlueprintConcept[];
}

async function buildCoverageMap(sessionId: string): Promise<Map<string, ConceptCoverageInfo>> {
  const estimates = await prisma.skillEstimate.findMany({ where: { sessionId } });
  const map = new Map<string, ConceptCoverageInfo>();
  for (const e of estimates) {
    map.set(e.conceptId, {
      conceptId: e.conceptId,
      evidenceCount: e.evidenceCount,
      proficiency: e.proficiency,
      evidenceConfidence: e.evidenceConfidence,
      transferVerified: e.transferVerified,
    });
  }
  return map;
}

async function buildLearnerStateSnapshot(sessionId: string): Promise<LearnerStateSnapshot> {
  const session = await prisma.assessmentSession.findUniqueOrThrow({ where: { id: sessionId } });
  const estimates = await prisma.skillEstimate.findMany({ where: { sessionId } });
  const recentAnswers = await prisma.aIEvaluation.findMany({
    where: { question: { sessionId } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentAccuracy =
    recentAnswers.length > 0
      ? recentAnswers.reduce((sum: number, e: any) => sum + e.correctness, 0) / recentAnswers.length
      : 0.5;

  const estimatesRecord: LearnerStateSnapshot["estimates"] = {};
  let difficultySum = 0;
  estimates.forEach((e: any) => {
    estimatesRecord[e.conceptId] = {
      proficiency: e.proficiency,
      evidenceConfidence: e.evidenceConfidence,
      evidenceCount: e.evidenceCount,
      state: e.state,
      difficultyCeiling: e.difficultyCeiling,
      transferVerified: e.transferVerified,
    };
    difficultySum += e.difficultyCeiling;
  });

  return {
    sessionId,
    subject: session.subject,
    askedCount: session.askedCount,
    targetCount: session.targetCount,
    estimates: estimatesRecord,
    recentAccuracy,
    overallDifficulty: estimates.length ? difficultySum / estimates.length : 0.4,
  };
}

// ---------------------------------------------------------------------------
// Question generation (one at a time, with duplicate + validation retries)
// ---------------------------------------------------------------------------

async function generateAndPersistNextQuestion(
  sessionId: string,
  decisionOverride?: AdaptiveDecision
): Promise<{ questionId: string }> {
  const session = await prisma.assessmentSession.findUniqueOrThrow({ where: { id: sessionId } });
  const concepts = await getBlueprintConcepts(sessionId);
  const coverage = await buildCoverageMap(sessionId);
  const learnerState = await buildLearnerStateSnapshot(sessionId);

  let decision: AdaptiveDecision;
  if (decisionOverride) {
    decision = decisionOverride;
  } else {
    // First question of the session: baseline on the highest-importance concept.
    const first = [...concepts].sort((a, b) => b.importance - a.importance)[0];
    decision = {
      action: "BASELINE",
      targetConceptId: first.id,
      targetDifficulty: first.approxDifficulty ?? 0.4,
      reason: "Starting with a foundational concept to establish a baseline.",
      needsIntervention: false,
    };
  }

  const concept = concepts.find((c) => c.id === decision.targetConceptId) ?? concepts[0];

  const previousQuestions = await prisma.generatedQuestion.findMany({
    where: { sessionId },
    orderBy: { sequence: "desc" },
    take: 20,
  });
  const previousPromptsForConcept = previousQuestions
    .filter((q: any) => q.conceptId === concept.id)
    .map((q: any) => q.prompt);
  const recentPromptsOverall = previousQuestions.map((q: any) => q.prompt);
  const existingFingerprints = new Set(previousQuestions.map((q: any) => q.fingerprint));

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_QUESTION_GEN_ATTEMPTS; attempt++) {
    try {
      const { question, modelUsed } = await generateQuestion({
        subject: session.subject,
        concept,
        decision,
        learnerState,
        previousPromptsForConcept,
        recentPromptsOverall,
      });

      const fingerprint = fingerprintQuestion(question.question);

      const isDuplicate =
        existingFingerprints.has(fingerprint) ||
        recentPromptsOverall.some((p: string) => similarity(p, question.question) >= DUPLICATE_SIMILARITY_THRESHOLD);

      if (isDuplicate) {
        lastError = new Error("Duplicate question generated");
        continue; // retry
      }

      const created = await prisma.generatedQuestion.create({
        data: {
          sessionId,
          sequence: session.askedCount + 1,
          conceptId: concept.id,
          conceptName: concept.name,
          type: question.type,
          purpose: decision.action,
          difficulty: question.difficulty,
          prompt: question.question,
          options: question.options ?? undefined,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          fingerprint,
          rationale: question.rationale ?? decision.reason,
        },
      });

      await prisma.assessmentSession.update({
        where: { id: sessionId },
        data: {
          askedCount: { increment: 1 },
          status: "AWAITING_ANSWER",
          lastAiCallAt: new Date(),
        },
      });

      return { questionId: created.id };
    } catch (err) {
      console.error(`[QuestionGen] attempt ${attempt}/${MAX_QUESTION_GEN_ATTEMPTS} failed:`, err);
      lastError = err;
    }
  }

  await prisma.assessmentSession.update({
    where: { id: sessionId },
    data: { status: "FAILED" },
  });
  throw new QuestionGenerationFailedError(
    `Failed to generate a valid, non-duplicate question after ${MAX_QUESTION_GEN_ATTEMPTS} attempts`,
    lastError
  );
}

/**
 * Used by the /next-question retry endpoint when question generation
 * previously failed and the session has no current pending question.
 */
export async function retryGenerateQuestion(sessionId: string, userId: string) {
  const session = await prisma.assessmentSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (session.userId !== userId) throw new ForbiddenError("Access denied.");

  const pending = await prisma.generatedQuestion.findFirst({
    where: { sessionId, answer: null },
  });
  if (pending) return { questionId: pending.id };

  if (session.status === "COMPLETED" || session.status === "ABANDONED") {
    throw new Error("Assessment is no longer active.");
  }

  await prisma.assessmentSession.update({ where: { id: sessionId }, data: { status: "IN_PROGRESS" } });

  const concepts = await getBlueprintConcepts(sessionId);
  const coverage = await buildCoverageMap(sessionId);

  if (session.askedCount === 0) {
    return generateAndPersistNextQuestion(sessionId);
  }

  const leastEvidence = [...concepts].sort(
    (a, b) => (coverage.get(a.id)?.evidenceCount ?? 0) - (coverage.get(b.id)?.evidenceCount ?? 0)
  )[0];

  return generateAndPersistNextQuestion(sessionId, {
    action: coverage.has(leastEvidence.id) ? "RELATED_CONCEPT" : "NEW_CONCEPT",
    targetConceptId: leastEvidence.id,
    targetDifficulty: leastEvidence.approxDifficulty ?? 0.45,
    reason: "Resuming the assessment after a temporary issue.",
    needsIntervention: false,
  });
}

export class QuestionGenerationFailedError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// Answer submission -> evaluation -> learner model update -> next step
// ---------------------------------------------------------------------------

export async function submitAnswer(params: {
  sessionId: string;
  userId: string;
  questionId: string;
  rawAnswer: string;
  confidence?: number;
  timeTakenMs?: number;
}) {
  const session = await prisma.assessmentSession.findUniqueOrThrow({
    where: { id: params.sessionId },
  });
  if (session.userId !== params.userId) {
    throw new ForbiddenError("You do not have access to this assessment.");
  }

  const question = await prisma.generatedQuestion.findUniqueOrThrow({
    where: { id: params.questionId },
    include: { answer: true },
  });
  if (question.sessionId !== params.sessionId) {
    throw new ForbiddenError("Question does not belong to this assessment.");
  }
  if (question.answer) {
    throw new AlreadyAnsweredError("This question has already been answered.");
  }

  await prisma.answer.create({
    data: {
      questionId: question.id,
      rawAnswer: params.rawAnswer,
      confidence: params.confidence,
      timeTakenMs: params.timeTakenMs,
    },
  });

  // Optional: code execution evidence for programming question types
  let executionEvidence: string | null = null;
  if (["CODE_OUTPUT", "CODE_WRITING", "DEBUGGING"].includes(question.type)) {
    executionEvidence = await tryGetExecutionEvidence({
      language: guessLanguage(session.subject),
      code: params.rawAnswer,
    });
  }

  const { classification } = await classifyAnswer({
    question: question.prompt,
    correctAnswer: question.correctAnswer,
    learnerAnswer: params.rawAnswer,
    questionType: question.type,
  });

  const { evaluation, modelUsed, escalated } = await diagnoseAnswer({
    subject: session.subject,
    conceptName: question.conceptName,
    question: question.prompt,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    learnerAnswer: params.rawAnswer,
    questionType: question.type,
    priorClassification: classification,
    codeExecutionEvidence: executionEvidence,
  });

  await prisma.aIEvaluation.create({
    data: {
      questionId: question.id,
      status: evaluation.status,
      correctness: evaluation.correctness,
      confidence: evaluation.confidence,
      errorType: evaluation.errorType,
      misconception: evaluation.misconception,
      understood: evaluation.understood,
      missing: evaluation.missing,
      recommendedAction: evaluation.recommendedAction,
      modelUsed: escalated ? `${modelUsed} (escalated)` : modelUsed,
    },
  });

  // Update rolling skill observations + estimate for this concept
  await prisma.skillObservation.create({
    data: {
      sessionId: session.id,
      conceptId: question.conceptId,
      conceptName: question.conceptName,
      evidenceType: mapPurposeToEvidenceType(question.purpose),
      correctness: evaluation.correctness,
      difficulty: question.difficulty,
    },
  });

  const observations = await prisma.skillObservation.findMany({
    where: { sessionId: session.id, conceptId: question.conceptId },
    orderBy: { createdAt: "asc" },
  });
  const rolled = estimateSkill(
    observations.map((o: any): Observation => ({
      correctness: o.correctness,
      difficulty: o.difficulty,
      evidenceType: o.evidenceType,
    }))
  );

  await prisma.skillEstimate.upsert({
    where: { sessionId_conceptId: { sessionId: session.id, conceptId: question.conceptId } },
    create: {
      sessionId: session.id,
      conceptId: question.conceptId,
      conceptName: question.conceptName,
      proficiency: rolled.proficiency,
      evidenceConfidence: rolled.evidenceConfidence,
      evidenceCount: rolled.evidenceCount,
      state: rolled.state,
      difficultyCeiling: rolled.difficultyCeiling,
      transferVerified: rolled.transferVerified,
    },
    update: {
      proficiency: rolled.proficiency,
      evidenceConfidence: rolled.evidenceConfidence,
      evidenceCount: rolled.evidenceCount,
      state: rolled.state,
      difficultyCeiling: rolled.difficultyCeiling,
      transferVerified: rolled.transferVerified,
    },
  });

  // Generate a targeted intervention if the diagnosis calls for it
  let interventionId: string | null = null;
  const needsInterventionFromEval =
    evaluation.status === "INCORRECT" || evaluation.errorType === "CONCEPTUAL_GAP";
  if (needsInterventionFromEval) {
    const { intervention } = await generateIntervention({
      subject: session.subject,
      conceptName: question.conceptName,
      misconception: evaluation.misconception,
      missing: evaluation.missing,
      learnerAnswer: params.rawAnswer,
      question: question.prompt,
      explanation: question.explanation,
    });
    const created = await prisma.intervention.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        conceptId: question.conceptId,
        conceptName: question.conceptName,
        title: intervention.title,
        explanation: intervention.explanation,
      },
    });
    interventionId = created.id;
  }

  const evalDTO: EvaluationDTO = {
    status: evaluation.status,
    correctness: evaluation.correctness,
    confidence: evaluation.confidence,
    errorType: evaluation.errorType,
    misconception: evaluation.misconception,
    understood: evaluation.understood,
    missing: evaluation.missing,
    recommendedAction: evaluation.recommendedAction,
    explanationForLearner: evaluation.explanationForLearner,
  };

  // Decide what happens next
  const concepts = await getBlueprintConcepts(session.id);
  const coverage = await buildCoverageMap(session.id);
  const decision = decideNextStep({
    concepts,
    currentConceptId: question.conceptId,
    currentPurpose: question.purpose,
    currentDifficulty: question.difficulty,
    evaluation: evalDTO,
    coverage,
    askedCount: session.askedCount,
    targetCount: session.targetCount,
  });

  const isComplete = session.askedCount >= session.targetCount;

  if (isComplete) {
    await prisma.assessmentSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    return {
      completed: true,
      evaluation: evalDTO,
      interventionId,
      nextQuestionId: null,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  // Fire-and-forget: next question generates while user reads feedback.
  // The client polls GET /api/assessment/[id] until currentQuestion updates.
  void generateAndPersistNextQuestion(session.id, decision).catch((err) => {
    console.error("Background next-question generation failed:", err);
    prisma.assessmentSession
      .update({ where: { id: session.id }, data: { status: "IN_PROGRESS" } })
      .catch(() => {});
  });

  return {
    completed: false,
    evaluation: evalDTO,
    interventionId,
    nextQuestionId: null, // generated in background; client polls for it
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  };
}

function mapPurposeToEvidenceType(purpose: string): string {
  if (purpose === "TRANSFER_TEST") return "transfer";
  if (purpose === "REMEDIAL_TEST" || purpose === "SAME_CONCEPT_EASIER") return "remedial";
  if (purpose === "PREREQUISITE_TEST") return "prerequisite";
  return "baseline";
}

function guessLanguage(subject: string): "python" | "javascript" | "typescript" | "java" | "cpp" | "sql" {
  const s = subject.toLowerCase();
  if (s.includes("python")) return "python";
  if (s.includes("typescript")) return "typescript";
  if (s.includes("javascript") || s.includes("js")) return "javascript";
  if (s.includes("java") && !s.includes("javascript")) return "java";
  if (s.includes("c++") || s.includes("cpp")) return "cpp";
  if (s.includes("sql")) return "sql";
  return "python";
}

export class ForbiddenError extends Error {}
export class AlreadyAnsweredError extends Error {}
export class NotFoundError extends Error {}

// ---------------------------------------------------------------------------
// Final report generation
// ---------------------------------------------------------------------------

export async function getOrCreateFinalReport(sessionId: string, userId: string) {
  const session = await prisma.assessmentSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (session.userId !== userId) throw new ForbiddenError("Access denied.");

  const existing = await prisma.assessmentResult.findUnique({ where: { sessionId } });
  if (existing) return existing;

  if (session.status !== "COMPLETED") {
    throw new Error("Assessment is not complete yet.");
  }

  const blueprint = await prisma.assessmentBlueprint.findUniqueOrThrow({ where: { sessionId } });
  const estimates = await prisma.skillEstimate.findMany({ where: { sessionId } });
  const questions = await prisma.generatedQuestion.findMany({
    where: { sessionId },
    include: { evaluation: true },
    orderBy: { sequence: "asc" },
  });
  const interventions = await prisma.intervention.findMany({ where: { sessionId } });

  const evaluated = questions.filter((q: any) => q.evaluation);
  const third = Math.max(1, Math.floor(evaluated.length / 3));
  const early = evaluated.slice(0, third);
  const late = evaluated.slice(-third);
  const earlyAccuracy = avg(early.map((q: any) => q.evaluation!.correctness));
  const lateAccuracy = avg(late.map((q: any) => q.evaluation!.correctness));

  const transferQuestions = evaluated.filter((q: any) => q.purpose === "TRANSFER_TEST");
  const transferSuccessRate = transferQuestions.length
    ? avg(transferQuestions.map((q: any) => q.evaluation!.correctness))
    : 0;

  const { report, modelUsed } = await generateFinalReport({
    subject: session.subject,
    goal: blueprint.goal,
    totalQuestions: evaluated.length,
    skillEstimates: estimates.map((e: any) => ({
      conceptName: e.conceptName,
      proficiency: e.proficiency,
      evidenceConfidence: e.evidenceConfidence,
      state: e.state,
      transferVerified: e.transferVerified,
    })),
    misconceptionsObserved: Array.from(
      new Set(
        evaluated
          .map((q: any) => q.evaluation!.misconception)
          .filter((m: string | null): m is string => Boolean(m))
      )
    ),
    difficultyProgression: evaluated.map((q: any) => q.difficulty),
    transferSuccessRate,
    earlyAccuracy,
    lateAccuracy,
  });

  const overallProficiency = avg(estimates.map((e: any) => e.proficiency));
  const overallConfidence = avg(estimates.map((e: any) => e.evidenceConfidence));
  const difficultyCeiling = Math.max(0, ...estimates.map((e: any) => e.difficultyCeiling));

  const result = await prisma.assessmentResult.create({
    data: {
      sessionId,
      overallProficiency,
      overallConfidence,
      strongAreas: report.strongAreas,
      developingAreas: report.developingAreas,
      weakAreas: report.weakAreas,
      uncertainAreas: report.uncertainAreas,
      misconceptions: report.misconceptions,
      difficultyCeiling,
      transferPerformance: transferSuccessRate,
      improvementDuringAssessment: lateAccuracy - earlyAccuracy,
      recommendedNextAreas: report.recommendedNextAreas,
      remainingUncertainties: report.remainingUncertainties,
      summary: report.summary,
    },
  });

  void interventions; // reserved for future richer reporting
  void modelUsed;

  return result;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
