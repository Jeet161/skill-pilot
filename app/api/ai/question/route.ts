import { NextResponse } from "next/server";

// Question generation always happens transactionally inside the
// orchestrator (see lib/assessment/orchestrator.ts) so that a persisted
// question, its fingerprint, and the session's askedCount stay in sync.
// This route intentionally does not expose standalone generation to avoid
// creating ungoverned, unbilled AI calls.
export async function POST() {
  return NextResponse.json(
    { error: "Use POST /api/assessment/[id]/answer or /next-question — questions are generated as part of session state." },
    { status: 400 }
  );
}
