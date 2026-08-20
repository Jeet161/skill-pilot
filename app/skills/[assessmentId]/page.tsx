"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SkillGraph } from "@/components/skills/SkillGraph";
import type { SkillGraphNodeData } from "@/types/skill";

export default function SkillsPage({ params }: { params: { assessmentId: string } }) {
  const [nodes, setNodes] = useState<SkillGraphNodeData[] | null>(null);

  useEffect(() => {
    fetch(`/api/assessment/${params.assessmentId}/skill-graph`)
      .then((r) => r.json())
      .then((d) => setNodes(d.nodes ?? []));
  }, [params.assessmentId]);

  return (
    <main className="min-h-screen bg-grid px-6 py-12">
      <div className="pointer-events-none fixed inset-0 bg-grid-fade" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link
          href={`/assessment/${params.assessmentId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to assessment
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Live skill graph</h1>
        <p className="mt-1 text-sm text-muted">
          Updates in real time as the assessment discovers what you know.
        </p>

        <Card className="mt-6 p-6">
          {nodes === null ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <SkillGraph nodes={nodes} />
          )}
        </Card>
      </div>
    </main>
  );
}
