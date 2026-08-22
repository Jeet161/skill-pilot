import { NextRequest, NextResponse } from "next/server";
import { SubmitAnswerSchema } from "@/lib/validation/assessment";
import {
  submitAnswer,
  ForbiddenError,
  AlreadyAnsweredError,
} from "@/lib/assessment/orchestrator";
import { getOrCreateUserId } from "@/lib/auth";
import { checkRateLimit, tryAcquireLock, releaseLock } from "@/lib/assessment/rate-limit";
import { isRecoverableAIError } from "@/lib/ai/router";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getOrCreateUserId();
  const sessionId = params.id;

  const rl = checkRateLimit(`answer:${sessionId}`);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Please slow down — too many submissions." }, { status: 429 });
  }

  const lockKey = `session-lock:${sessionId}`;
  if (!tryAcquireLock(lockKey)) {
    return NextResponse.json(
      { error: "Your previous answer is still being processed." },
      { status: 409 }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = SubmitAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await submitAnswer({
      sessionId,
      userId,
      questionId: parsed.data.questionId,
      rawAnswer: parsed.data.rawAnswer,
      confidence: parsed.data.confidence,
      timeTakenMs: parsed.data.timeTakenMs,
    });

    let nextQuestion = result.nextQuestion;
    let intervention = null;

    if (result.failed) {
      intervention = await prisma.intervention.findFirst({
        where: { sessionId, questionId: parsed.data.questionId },
      });
    }

    return NextResponse.json({
      completed: result.completed,
      failed: result.failed,
      evaluation: {
        status: result.evaluation.status,
        correctness: result.evaluation.correctness,
        explanationForLearner: result.evaluation.explanationForLearner ?? null,
      },
      correctAnswer: result.correctAnswer,
      explanation: result.explanation,
      intervention: intervention
        ? { title: intervention.title, explanation: intervention.explanation, conceptName: intervention.conceptName }
        : null,
      nextQuestion,
    });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    if (err instanceof AlreadyAnsweredError) {
      return NextResponse.json({ error: "This question was already answered." }, { status: 409 });
    }
    console.error("Failed to submit answer:", err);
    if (isRecoverableAIError(err)) {
      return NextResponse.json(
        { error: "The AI is having trouble generating your next question. Please retry." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  } finally {
    releaseLock(lockKey);
  }
}
