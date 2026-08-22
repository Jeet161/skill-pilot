import "server-only";
import { prisma, withRetry } from "@/lib/db/prisma";
import { fetchQuestionsFromQuizAPI } from "./quizapi";
import { planAssessmentBlueprint } from "@/lib/ai/assessment-planner";
import { generateQuestion } from "@/lib/ai/question-generator";
import { estimateSkill, type Observation } from "./skill-estimator";
import type {
  AssessmentMode,
  EvaluationDTO,
} from "@/types/assessment";

// ---------------------------------------------------------------------------
// Session creation — fetches all questions upfront from QuizAPI
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

  // Fire-and-forget: fetch questions and store them all at once
  void (async () => {
    try {
      // Try QuizAPI first, fall back to AI generation
      let questions;
      let blueprintToPersist;
      try {
        questions = await fetchQuestionsFromQuizAPI(params.subject, params.targetCount);
        if (questions.length === 0) throw new Error("No questions returned from QuizAPI");
        console.log(`[QuizAPI] Fetched ${questions.length} questions for subject: ${params.subject}`);

        // ── Top-up: if QuizAPI returned fewer than requested, fill the gap with AI ──
        const shortfall = params.targetCount - questions.length;
        if (shortfall > 0) {
          console.log(`[QuizAPI] Short by ${shortfall} — topping up with AI generation`);
          const { blueprint } = await planAssessmentBlueprint(params.subject, params.mode, shortfall);
          const topupConcepts = blueprint.concepts.slice(0, shortfall);
          const usedPrompts = questions.map(q => q.prompt);

          const aiTopup = await Promise.all(
            topupConcepts.map((concept) =>
              generateQuestion({
                subject: params.subject,
                concept: concept as any,
                decision: {
                  action: "BASELINE",
                  targetConceptId: concept.id,
                  targetDifficulty: concept.approxDifficulty,
                  reason: "AI top-up to reach target count",
                  needsIntervention: false,
                },
                learnerState: {
                  sessionId: session.id,
                  subject: params.subject,
                  askedCount: 0,
                  targetCount: params.targetCount,
                  estimates: {},
                  recentAccuracy: 0,
                  overallDifficulty: 0.5,
                },
                previousPromptsForConcept: [],
                recentPromptsOverall: usedPrompts,
              }).then(({ question }) => ({
                conceptId: question.targetConcept,
                conceptName: concept.name,
                type: question.type,
                difficulty: question.difficulty,
                prompt: question.question,
                options: question.options ?? [],
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
              }))
            )
          );
          questions = [...questions, ...aiTopup];
          console.log(`[AI top-up] Added ${aiTopup.length}. Total: ${questions.length}`);
        }

        // Build blueprint from all questions (QuizAPI + AI top-up)
        const conceptsMap = new Map<string, { id: string; name: string }>();
        questions.forEach(q => conceptsMap.set(q.conceptId, { id: q.conceptId, name: q.conceptName }));
        const concepts = Array.from(conceptsMap.values());

        blueprintToPersist = {
          subject: params.subject,
          goal: `Live assessment for ${params.subject} — ${questions.length} questions ready.`,
          concepts: concepts.map((c, i) => ({
            id: c.id,
            name: c.name,
            description: `Questions about ${c.name} in ${params.subject}.`,
            importance: 1.0 - i * 0.05,
            prerequisites: i > 0 ? [concepts[i - 1].id] : [],
            suggestedQuestionTypes: ["MULTIPLE_CHOICE"] as any[],
            approxDifficulty: 0.5,
          })),
          coverageStrategy: "QuizAPI questions + AI top-up to hit target count.",
        };
      } catch (apiErr) {
        console.warn(`[QuizAPI] Failed entirely — falling back to full AI generation:`, apiErr);

        // Full AI fallback: blueprint + all questions in parallel
        const { blueprint } = await planAssessmentBlueprint(params.subject, params.mode, params.targetCount);
        blueprintToPersist = blueprint;

        const conceptsToUse = blueprint.concepts.slice(0, params.targetCount);
        const results = await Promise.all(
          conceptsToUse.map((concept) =>
            generateQuestion({
              subject: params.subject,
              concept: concept as any,
              decision: {
                action: "BASELINE",
                targetConceptId: concept.id,
                targetDifficulty: concept.approxDifficulty,
                reason: "Initial baseline question",
                needsIntervention: false,
              },
              learnerState: {
                sessionId: session.id,
                subject: params.subject,
                askedCount: 0,
                targetCount: params.targetCount,
                estimates: {},
                recentAccuracy: 0,
                overallDifficulty: 0.5,
              },
              previousPromptsForConcept: [],
              recentPromptsOverall: [],
            }).then(({ question }) => ({
              conceptId: question.targetConcept,
              conceptName: concept.name,
              type: question.type,
              difficulty: question.difficulty,
              prompt: question.question,
              options: question.options ?? [],
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
            }))
          )
        );

        questions = results;
      }

      await withRetry(() => prisma.assessmentBlueprint.create({
        data: {
          sessionId: session.id,
          subject: blueprintToPersist.subject,
          goal: blueprintToPersist.goal,
          raw: blueprintToPersist as any,
        },
      }));

      // Limit to targetCount
      const toInsert = questions.slice(0, params.targetCount);

      // --- PERSIST ALL QUESTIONS SYNCHRONOUSLY ---
      // This prevents race conditions where answering the first question too quickly
      // completes the session prematurely because Q2 has not been persisted yet.
      if (toInsert.length > 0) {
        await withRetry(() => Promise.all(
          toInsert.map((q, idx) =>
            prisma.generatedQuestion.create({
              data: {
                sessionId: session.id,
                sequence: idx + 1,
                conceptId: q.conceptId,
                conceptName: q.conceptName,
                type: q.type,
                purpose: "BASELINE",
                difficulty: q.difficulty,
                prompt: q.prompt,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                fingerprint: `${session.id}-q${idx + 1}`,
                rationale: `Question ${idx + 1} of ${toInsert.length}`,
              },
            })
          )
        ));

        // All questions are database-persisted. Mark session as active.
        await withRetry(() => prisma.assessmentSession.update({
          where: { id: session.id },
          data: {
            status: "AWAITING_ANSWER",
            askedCount: 1,
            lastAiCallAt: new Date(),
          },
        }));
      }

    } catch (err) {
      console.error("Session build failed:", err);
      await prisma.assessmentSession
        .update({ where: { id: session.id }, data: { status: "FAILED" } })
        .catch(() => { });
    }
  })();

  return { sessionId: session.id };
}

// ---------------------------------------------------------------------------
// Answer submission — instant string match, background analytics
// ---------------------------------------------------------------------------

export async function submitAnswer(params: {
  sessionId: string;
  userId: string;
  questionId: string;
  rawAnswer: string;
  confidence?: number;
  timeTakenMs?: number;
}) {
  // ── 1. Load session + question (essential, needed for auth + eval) ──────
  const [session, question] = await Promise.all([
    prisma.assessmentSession.findUniqueOrThrow({ where: { id: params.sessionId } }),
    prisma.generatedQuestion.findUniqueOrThrow({
      where: { id: params.questionId },
      include: { answer: true },
    }),
  ]);

  if (session.userId !== params.userId) {
    throw new ForbiddenError("You do not have access to this assessment.");
  }
  if (question.sessionId !== params.sessionId) {
    throw new ForbiddenError("Question does not belong to this assessment.");
  }
  if (question.answer) {
    throw new AlreadyAnsweredError("This question has already been answered.");
  }

  // ── 2. Instant string-match evaluation ──────────────────────────────────
  const isCorrect =
    params.rawAnswer.trim().toLowerCase() ===
    question.correctAnswer.trim().toLowerCase();
  const correctness = isCorrect ? 1.0 : 0.0;

  const evalDTO: EvaluationDTO = {
    status: isCorrect ? "CORRECT" : "INCORRECT",
    correctness,
    confidence: 1.0,
    errorType: isCorrect ? "NONE" : "CONCEPTUAL_GAP",
    misconception: null,
    understood: [],
    missing: [],
    recommendedAction: isCorrect ? "NEW_CONCEPT" : "REMEDIAL_TEST",
    explanationForLearner: isCorrect
      ? undefined
      : `That's not right. The correct answer is: ${question.correctAnswer}. ${question.explanation}`,
  };

  // ── 3. Essential reads and state updates (must block to prevent races) ─
  const nextQuestion = await prisma.generatedQuestion.findFirst({
    where: { sessionId: session.id, answer: null, id: { not: question.id } },
    orderBy: { sequence: "asc" },
  });

  const isCompleted = !nextQuestion;

  await Promise.all([
    // Record the raw answer (fast write, needed for idempotency guard)
    prisma.answer.create({
      data: {
        questionId: question.id,
        rawAnswer: params.rawAnswer,
        confidence: params.confidence,
        timeTakenMs: params.timeTakenMs,
      },
    }),
    // Update session progress counter / completion status immediately (blocks response)
    isCompleted
      ? prisma.assessmentSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      })
      : prisma.assessmentSession.update({
        where: { id: session.id },
        data: { askedCount: { increment: 1 } },
      }),
  ]);

  // ── 4. Fire-and-forget: all analytics/bookkeeping runs in background ────
  //    The user already has their result — none of this blocks the response.
  void (async () => {
    try {
      await Promise.all([
        // Log AI evaluation record
        prisma.aIEvaluation.create({
          data: {
            questionId: question.id,
            status: isCorrect ? "CORRECT" : "INCORRECT",
            correctness,
            confidence: 1.0,
            errorType: isCorrect ? "NONE" : "CONCEPTUAL_GAP",
            misconception: null,
            understood: [],
            missing: [],
            recommendedAction: isCorrect ? "NEW_CONCEPT" : "REMEDIAL_TEST",
            modelUsed: "static-evaluator",
          },
        }),
        // Log skill observation
        prisma.skillObservation.create({
          data: {
            sessionId: session.id,
            conceptId: question.conceptId,
            conceptName: question.conceptName,
            evidenceType: "baseline",
            correctness,
            difficulty: question.difficulty,
          },
        }),
        // Log intervention on wrong answer
        !isCorrect
          ? prisma.intervention.create({
            data: {
              sessionId: session.id,
              questionId: question.id,
              conceptId: question.conceptId,
              conceptName: question.conceptName,
              title: `Study "${question.conceptName}"`,
              explanation: `You answered incorrectly. The correct answer was: ${question.correctAnswer}. ${question.explanation}`,
            },
          })
          : Promise.resolve(),
      ]);


      // Skill estimate update depends on the observation being written first
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
    } catch (bgErr) {
      console.error("[submitAnswer background] analytics write failed:", bgErr);
    }
  })();

  // ── 5. Return result immediately ─────────────────────────────────────────
  if (isCompleted) {
    return {
      completed: true,
      failed: false,
      evaluation: evalDTO,
      nextQuestion: null,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  return {
    completed: false,
    failed: false,
    evaluation: evalDTO,
    nextQuestion: {
      id: nextQuestion!.id,
      sequence: nextQuestion!.sequence,
      conceptId: nextQuestion!.conceptId,
      conceptName: nextQuestion!.conceptName,
      type: nextQuestion.type,
      purpose: nextQuestion.purpose,
      difficulty: nextQuestion.difficulty,
      prompt: nextQuestion.prompt,
      options: (nextQuestion.options as string[] | null) ?? null,
      rationale: nextQuestion.rationale,
    },
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  };
}

export class ForbiddenError extends Error { }
export class AlreadyAnsweredError extends Error { }
export class NotFoundError extends Error { }

// ---------------------------------------------------------------------------
// Retry for FAILED sessions
// ---------------------------------------------------------------------------

export async function retryGenerateQuestion(sessionId: string, userId: string) {
  const session = await prisma.assessmentSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (session.userId !== userId) throw new ForbiddenError("Access denied.");

  const pending = await prisma.generatedQuestion.findFirst({
    where: { sessionId, answer: null },
    orderBy: { sequence: "asc" },
  });
  if (pending) {
    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { status: "AWAITING_ANSWER" },
    });
    return { questionId: pending.id };
  }

  throw new Error("No pending questions found. The session may be complete.");
}

// ---------------------------------------------------------------------------
// Final report — no AI, pure data
// ---------------------------------------------------------------------------

export async function getOrCreateFinalReport(sessionId: string, userId: string) {
  const session = await prisma.assessmentSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (session.userId !== userId) throw new ForbiddenError("Access denied.");

  const existing = await prisma.assessmentResult.findUnique({ where: { sessionId } });
  if (existing) return existing;

  const questions = await prisma.generatedQuestion.findMany({
    where: { sessionId },
    include: { evaluation: true, answer: true },
    orderBy: { sequence: "asc" },
  });

  const allAnswered = questions.length > 0 && questions.every((q: any) => q.answer);

  if (session.status !== "COMPLETED" && !allAnswered) {
    throw new Error("Assessment is not complete yet.");
  }

  if (session.status !== "COMPLETED" && allAnswered) {
    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  const estimates = await prisma.skillEstimate.findMany({ where: { sessionId } });

  const evaluated = questions.filter((q: any) => q.evaluation);
  const totalCorrect = evaluated.filter((q: any) => q.evaluation!.correctness >= 1.0).length;
  const passed = totalCorrect === evaluated.length && evaluated.length > 0;

  const overallProficiency = evaluated.length > 0 ? totalCorrect / evaluated.length : 0;
  const overallConfidence = avg(estimates.map((e: any) => e.evidenceConfidence));
  const difficultyCeiling = Math.max(0, ...estimates.map((e: any) => e.difficultyCeiling));

  const strongAreas = estimates.filter((e: any) => e.proficiency >= 0.7).map((e: any) => e.conceptName);
  const weakAreas = estimates.filter((e: any) => e.proficiency < 0.4).map((e: any) => e.conceptName);
  const developingAreas = estimates.filter((e: any) => e.proficiency >= 0.4 && e.proficiency < 0.7).map((e: any) => e.conceptName);

  const summary = passed
    ? `Congratulations! You answered all ${evaluated.length} question(s) correctly and demonstrated solid understanding of ${session.subject}.`
    : `You answered ${totalCorrect} out of ${evaluated.length} question(s) correctly. Review the weak areas below and try again.`;

  return prisma.assessmentResult.create({
    data: {
      sessionId,
      overallProficiency,
      overallConfidence,
      strongAreas,
      developingAreas,
      weakAreas,
      uncertainAreas: [],
      misconceptions: [],
      difficultyCeiling,
      transferPerformance: 0,
      improvementDuringAssessment: 0,
      recommendedNextAreas: weakAreas.length > 0
        ? weakAreas.map((a: string) => `Study and review: ${a}`)
        : [`Explore more advanced topics in ${session.subject}`],
      remainingUncertainties: [],
      summary,
    },
  });
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
