import "server-only";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError } from "./orchestrator";
import type { ClientQuestion } from "@/lib/validation/question";
import type { SkillGraphNodeData } from "@/types/skill";

export async function getAssessmentState(sessionId: string, userId: string) {
  const session = await prisma.assessmentSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { blueprint: true },
  });
  if (session.userId !== userId) throw new ForbiddenError("Access denied.");

  const currentQuestion = await prisma.generatedQuestion.findFirst({
    where: { sessionId, answer: null },
    orderBy: { sequence: "desc" },
  });

  const latestIntervention = currentQuestion
    ? null
    : await prisma.intervention.findFirst({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
      });

  const estimates = await prisma.skillEstimate.findMany({ where: { sessionId } });

  return {
    session: {
      id: session.id,
      subject: session.subject,
      mode: session.mode,
      status: session.status,
      askedCount: session.askedCount,
      targetCount: session.targetCount,
      goal: session.blueprint?.goal ?? null,
    },
    currentQuestion: currentQuestion ? toClientQuestion(currentQuestion) : null,
    latestIntervention: latestIntervention
      ? {
          id: latestIntervention.id,
          title: latestIntervention.title,
          explanation: latestIntervention.explanation,
          conceptName: latestIntervention.conceptName,
        }
      : null,
    skillEstimates: estimates.map((e: any) => ({
      conceptId: e.conceptId,
      conceptName: e.conceptName,
      proficiency: e.proficiency,
      evidenceConfidence: e.evidenceConfidence,
      evidenceCount: e.evidenceCount,
      state: e.state,
      difficultyCeiling: e.difficultyCeiling,
      transferVerified: e.transferVerified,
    })),
  };
}

export function toClientQuestion(q: {
  id: string;
  sequence: number;
  conceptId: string;
  conceptName: string;
  type: string;
  purpose: string;
  difficulty: number;
  prompt: string;
  options: unknown;
  rationale: string | null;
}): ClientQuestion {
  return {
    id: q.id,
    sequence: q.sequence,
    conceptId: q.conceptId,
    conceptName: q.conceptName,
    type: q.type as ClientQuestion["type"],
    purpose: q.purpose as ClientQuestion["purpose"],
    difficulty: q.difficulty,
    prompt: q.prompt,
    options: (q.options as string[] | null) ?? null,
    rationale: q.rationale,
  };
}

export async function getSkillGraph(sessionId: string, userId: string): Promise<SkillGraphNodeData[]> {
  const session = await prisma.assessmentSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { blueprint: true },
  });
  if (session.userId !== userId) throw new ForbiddenError("Access denied.");

  const concepts = ((session.blueprint?.raw as any)?.concepts ?? []) as Array<{
    id: string;
    name: string;
    importance: number;
    prerequisites: string[];
  }>;
  const estimates = await prisma.skillEstimate.findMany({ where: { sessionId } });
  const estimateMap = new Map<string, any>(estimates.map((e: any) => [e.conceptId, e]));

  return concepts.map((c) => {
    const est = estimateMap.get(c.id);
    return {
      id: c.id,
      name: c.name,
      state: (est?.state as any) ?? "UNCERTAIN",
      proficiency: est?.proficiency ?? 0,
      evidenceConfidence: est?.evidenceConfidence ?? 0,
      prerequisites: c.prerequisites ?? [],
      importance: c.importance,
    };
  });
}
