import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/db/prisma";
import { getOrCreateUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getOrCreateUserId();

    const data = await withRetry(async () => {
      // 1. Fetch recent sessions for this user
      const sessions = await prisma.assessmentSession.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { result: true },
        take: 25,
      });

      if (sessions.length === 0) {
        return { sessions: [], totalAnswers: 0, correctAnswers: 0 };
      }

      const sessionIds = sessions.map((s) => s.id);

      // 2. Fetch total answers & correct evaluations in parallel
      const [totalAnswers, correctAnswers] = await Promise.all([
        prisma.answer.count({
          where: {
            GeneratedQuestion: {
              sessionId: { in: sessionIds },
            },
          },
        }),
        prisma.aIEvaluation.count({
          where: {
            status: "CORRECT",
            GeneratedQuestion: {
              sessionId: { in: sessionIds },
            },
          },
        }),
      ]);

      return { sessions, totalAnswers, correctAnswers };
    });

    const { sessions, totalAnswers, correctAnswers } = data;

    const baseXP = totalAnswers * 100;
    const bonusXP = correctAnswers * 150;
    const xp = baseXP + bonusXP;

    const xpPerLevel = 1000;
    const level = Math.floor(xp / xpPerLevel) + 1;
    const xpInLevel = xp % xpPerLevel;

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
      stats: {
        totalAnswers,
        correctAnswers,
        xp,
        level,
        xpInLevel,
        xpNextLevel: xpPerLevel,
      },
    });
  } catch (err: any) {
    console.error("[Progress API Error]:", err);
    return NextResponse.json(
      {
        sessions: [],
        stats: {
          totalAnswers: 0,
          correctAnswers: 0,
          xp: 0,
          level: 1,
          xpInLevel: 0,
          xpNextLevel: 1000,
        },
        error: err.message || "Failed to load progress",
      },
      { status: 200 } // Return graceful empty state fallback so UI doesn't hang
    );
  }
}
