import { NextRequest, NextResponse } from "next/server";
import { CreateAssessmentSchema } from "@/lib/validation/assessment";
import { createAssessmentSession } from "@/lib/assessment/orchestrator";
import { getOrCreateUserId } from "@/lib/auth";
import { checkRateLimit } from "@/lib/assessment/rate-limit";
import { isRecoverableAIError } from "@/lib/ai/router";

export async function POST(req: NextRequest) {
  const userId = await getOrCreateUserId();

  const rl = checkRateLimit(`create:${userId}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many assessment creations. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateAssessmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { sessionId } = await createAssessmentSession({
      userId,
      subject: parsed.data.subject,
      mode: parsed.data.mode,
      targetCount: parsed.data.targetCount,
    });
    return NextResponse.json({ sessionId }, { status: 201 });
  } catch (err) {
    console.error("Failed to create assessment:", err);
    if (isRecoverableAIError(err)) {
      return NextResponse.json(
        { error: "The AI was unable to generate a valid assessment right now. Please try again." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
