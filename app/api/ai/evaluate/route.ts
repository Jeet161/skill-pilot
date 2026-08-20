import { NextResponse } from "next/server";

// See ai/question/route.ts — evaluation is always performed as part of
// POST /api/assessment/[id]/answer so it stays atomic with persistence
// of the learner model update.
export async function POST() {
  return NextResponse.json(
    { error: "Use POST /api/assessment/[id]/answer — evaluation happens as part of answer submission." },
    { status: 400 }
  );
}
