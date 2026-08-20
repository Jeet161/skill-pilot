import { NextRequest, NextResponse } from "next/server";
import { getAssessmentState } from "@/lib/assessment/read-model";
import { getOrCreateUserId } from "@/lib/auth";
import { ForbiddenError } from "@/lib/assessment/orchestrator";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getOrCreateUserId();
  try {
    const state = await getAssessmentState(params.id, userId);
    return NextResponse.json(state);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Failed to load assessment state:", err);
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }
}
