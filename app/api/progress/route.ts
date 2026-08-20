import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOrCreateUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getOrCreateUserId();
  const sessions = await prisma.assessmentSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { result: true },
    take: 25,
  });

  return NextResponse.json({
    sessions: sessions.map((s: any) => ({
      id: s.id,
      subject: s.subject,
      mode: s.mode,
      status: s.status,
      askedCount: s.askedCount,
      targetCount: s.targetCount,
      createdAt: s.createdAt,
      overallProficiency: s.result?.overallProficiency ?? null,
    })),
  });
}
