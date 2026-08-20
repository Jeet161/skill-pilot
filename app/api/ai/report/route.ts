import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateFinalReport, ForbiddenError } from "@/lib/assessment/orchestrator";
import { getOrCreateUserId } from "@/lib/auth";

const Schema = z.object({ sessionId: z.string().min(1) });

// Generates (or returns cached) final report for a completed session.
// The /assessment/[id]/result page calls this server-side.
export async function POST(req: NextRequest) {
  const userId = await getOrCreateUserId();
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    const result = await getOrCreateFinalReport(parsed.data.sessionId, userId);
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Report generation failed." }, { status: 503 });
  }
}
