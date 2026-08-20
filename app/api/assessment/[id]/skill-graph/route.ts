import { NextRequest, NextResponse } from "next/server";
import { getSkillGraph } from "@/lib/assessment/read-model";
import { getOrCreateUserId } from "@/lib/auth";
import { ForbiddenError } from "@/lib/assessment/orchestrator";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getOrCreateUserId();
  try {
    const nodes = await getSkillGraph(params.id, userId);
    return NextResponse.json({ nodes });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
