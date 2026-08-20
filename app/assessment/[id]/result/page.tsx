"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkillSummary } from "@/components/dashboard/SkillSummary";
import { StrengthCard } from "@/components/dashboard/StrengthCard";
import { WeaknessCard } from "@/components/dashboard/WeaknessCard";
import { SkillGraph } from "@/components/skills/SkillGraph";
import type { SkillGraphNodeData } from "@/types/skill";

interface ReportResult {
  overallProficiency: number;
  overallConfidence: number;
  strongAreas: string[];
  developingAreas: string[];
  weakAreas: string[];
  uncertainAreas: string[];
  misconceptions: Array<{ concept: string; description: string }>;
  difficultyCeiling: number;
  transferPerformance: number;
  improvementDuringAssessment: number;
  recommendedNextAreas: string[];
  remainingUncertainties: string[];
  summary: string;
}

export default function ResultPage({ params }: { params: { id: string } }) {
  const [subject, setSubject] = useState("");
  const [report, setReport] = useState<ReportResult | null>(null);
  const [graph, setGraph] = useState<SkillGraphNodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [stateRes, graphRes] = await Promise.all([
          fetch(`/api/assessment/${params.id}`),
          fetch(`/api/assessment/${params.id}/skill-graph`),
        ]);
        const stateData = await stateRes.json();
        const graphData = await graphRes.json();
        if (stateRes.ok) setSubject(stateData.session.subject);
        if (graphRes.ok) setGraph(graphData.nodes);

        const reportRes = await fetch(`/api/ai/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: params.id }),
        });
        const reportData = await reportRes.json();
        if (!reportRes.ok) throw new Error(reportData.error ?? "Failed to generate report");
        setReport(reportData.result);
      } catch (e: any) {
        setError(e.message ?? "Something went wrong.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-grid px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Sparkles className="h-6 w-6 animate-pulseSlow text-primary" />
          <p className="text-sm text-muted">Synthesizing your final skill report…</p>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-grid px-6">
        <p className="text-sm text-accent-rose">{error ?? "Report unavailable."}</p>
      </main>
    );
  }

  const chartData = graph
    .filter((n) => n.evidenceConfidence > 0)
    .map((n) => ({ name: n.name, proficiency: Math.round(n.proficiency * 100) }));

  return (
    <main className="min-h-screen bg-grid px-6 py-16">
      <div className="pointer-events-none fixed inset-0 bg-grid-fade" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-primary/80">
          Final Report — {subject}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Your skill assessment</h1>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <SkillSummary
            proficiency={report.overallProficiency}
            confidence={report.overallConfidence}
            improvement={report.improvementDuringAssessment}
            transferPerformance={report.transferPerformance}
            difficultyCeiling={report.difficultyCeiling}
          />
        </motion.div>

        <Card className="mt-6 p-6">
          <h3 className="mb-2 text-sm font-medium text-white">AI summary</h3>
          <p className="text-sm leading-relaxed text-muted">{report.summary}</p>
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <StrengthCard areas={report.strongAreas} />
          <WeaknessCard areas={report.weakAreas} misconceptions={report.misconceptions} />
        </div>

        {chartData.length > 0 && (
          <Card className="mt-6 p-6">
            <h3 className="mb-4 text-sm font-medium text-white">Proficiency by concept</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8b93a7" }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "#8b93a7" }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="proficiency" fill="#6ee7ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Card className="mt-6 p-6">
          <h3 className="mb-4 text-sm font-medium text-white">Dynamic skill graph</h3>
          <SkillGraph nodes={graph} />
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-sm font-medium text-white">Recommended next areas</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
              {report.recommendedNextAreas.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-medium text-white">Remaining uncertainties</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
              {report.remainingUncertainties.length === 0 ? (
                <li>None — this assessment resolved most open questions.</li>
              ) : (
                report.remainingUncertainties.map((a) => <li key={a}>{a}</li>)
              )}
            </ul>
          </Card>
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/subjects">
            <Button size="lg" variant="outline">
              Start another assessment <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
