"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pct } from "@/lib/utils";

interface SessionSummary {
  id: string;
  subject: string;
  status: string;
  askedCount: number;
  targetCount: number;
  createdAt: string;
  overallProficiency: number | null;
}

export default function ProgressPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []));
  }, []);

  return (
    <main className="min-h-screen bg-grid px-6 py-16">
      <div className="pointer-events-none fixed inset-0 bg-grid-fade" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold text-white">Your assessments</h1>
        <p className="mt-2 text-sm text-muted">Every past and in-progress SkillPilot session.</p>

        <div className="mt-8 space-y-3">
          {sessions === null && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
          {sessions?.length === 0 && (
            <p className="text-sm text-muted">
              No assessments yet.{" "}
              <Link href="/subjects" className="text-primary hover:underline">
                Start one
              </Link>
              .
            </p>
          )}
          {sessions?.map((s) => (
            <Link key={s.id} href={s.status === "COMPLETED" ? `/assessment/${s.id}/result` : `/assessment/${s.id}`}>
              <Card className="flex items-center justify-between p-4 transition-all hover:border-primary/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{s.subject}</span>
                    <Badge>{s.status.replace("_", " ").toLowerCase()}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {s.askedCount}/{s.targetCount} questions
                    {s.overallProficiency !== null && ` · ${pct(s.overallProficiency)} proficiency`}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
