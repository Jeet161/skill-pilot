import { NextResponse } from "next/server";
import { planAssessmentBlueprint } from "@/lib/ai/assessment-planner";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const subject = searchParams.get("subject") || "javascript";
    const res = await planAssessmentBlueprint(subject, "BALANCED", 10);
    return NextResponse.json(res);
  } catch (e: any) {
    let causeIssues = null;
    if (e.cause && e.cause.issues) {
      causeIssues = e.cause.issues;
    } else if (e.cause && e.cause.message) {
      causeIssues = e.cause.message;
    }
    return NextResponse.json({ error: e.message, cause: causeIssues }, { status: 500 });
  }
}
