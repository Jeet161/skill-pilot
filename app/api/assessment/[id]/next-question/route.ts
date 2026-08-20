import { NextRequest, NextResponse } from "next/server";
import { retryGenerateQuestion, ForbiddenError } from "@/lib/assessment/orchestrator";
import { getOrCreateUserId } from "@/lib/auth";
import { toClientQuestion } from "@/lib/assessment/read-model";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/assessment/rate-limit";
import { isRecoverableAIError } from "@/lib/ai/router";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getOrCreateUserId();
  const rl = checkRateLimit(`next-question:${params.id}`);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Please wait a moment before retrying." }, { status: 429 });
  }

  try {
    const { questionId } = await retryGenerateQuestion(params.id, userId);
    const q = await prisma.generatedQuestion.findUnique({ where: { id: questionId } });
    if (!q) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    return NextResponse.json({ question: toClientQuestion(q) });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Failed to retry question generation:", err);
    if (isRecoverableAIError(err)) {
      return NextResponse.json(
        { error: "The AI is still having trouble. Please try again shortly." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
