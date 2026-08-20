import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { planAssessmentBlueprint } from "@/lib/ai/assessment-planner";
import { getOrCreateUserId } from "@/lib/auth";
import { checkRateLimit } from "@/lib/assessment/rate-limit";

const Schema = z.object({
  subject: z.string().min(1).max(80),
  mode: z.enum(["BALANCED", "DEEP", "PRACTICAL", "CONCEPTUAL"]).default("BALANCED"),
  targetCount: z.number().int().min(1).max(200).default(20),
});

// Internal/admin utility endpoint: previews a blueprint without creating a
// session. Primarily useful for debugging the AI planner in isolation —
// normal assessment creation goes through /api/assessment/create.
export async function POST(req: NextRequest) {
  const userId = await getOrCreateUserId();
  const rl = checkRateLimit(`ai-blueprint:${userId}`);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited." }, { status: 429 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    const { blueprint, modelUsed } = await planAssessmentBlueprint(
      parsed.data.subject,
      parsed.data.mode,
      parsed.data.targetCount
    );
    return NextResponse.json({ blueprint, modelUsed });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Blueprint generation failed." }, { status: 503 });
  }
}
