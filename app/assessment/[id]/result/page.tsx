"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp, BookOpen,
  ArrowRight, Trophy, Target, Zap, AlertTriangle,
  CheckCircle2, XCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WrongAnswer {
  id: string;
  conceptName: string;
  prompt: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
}

interface ReportData {
  subject: string;
  overallProficiency: number;
  strongAreas: string[];
  weakAreas: string[];
  developingAreas: string[];
  recommendedNextAreas: string[];
  summary: string;
  chartData: { name: string; proficiency: number; color: string }[];
  wrongAnswers: WrongAnswer[];
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function getScoreColor(v: number) {
  if (v >= 0.8) return "text-emerald-400";
  if (v >= 0.6) return "text-yellow-400";
  return "text-rose-400";
}

function getScoreBg(v: number) {
  if (v >= 0.8) return "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30";
  if (v >= 0.6) return "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30";
  return "from-rose-500/20 to-rose-500/5 border-rose-500/30";
}

function getScoreLabel(v: number) {
  if (v >= 0.9) return "Excellent! Outstanding performance.";
  if (v >= 0.8) return "Great work! Strong understanding.";
  if (v >= 0.6) return "Good effort. Keep practising.";
  if (v >= 0.4) return "Fair. Review the weak topics below.";
  return "Needs review. Focus on fundamentals.";
}

export default function ResultPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [stateRes, graphRes, reportRes] = await Promise.all([
          fetch(`/api/assessment/${params.id}`),
          fetch(`/api/assessment/${params.id}/skill-graph`),
          fetch(`/api/ai/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: params.id }),
          }),
        ]);

        const [stateData, graphData, reportData] = await Promise.all([
          stateRes.json(),
          graphRes.json(),
          reportRes.json(),
        ]);

        if (!reportRes.ok) throw new Error(reportData.error ?? "Failed to generate report");

        const report = reportData.result;
        const questionsRaw = reportData.questions ?? [];
        const nodes: any[] = graphRes.ok ? (graphData.nodes ?? []) : [];

        const chartData = nodes
          .filter((n: any) => n.evidenceConfidence > 0)
          .map((n: any) => ({
            name: n.name,
            proficiency: Math.round(n.proficiency * 100),
            color:
              n.proficiency >= 0.7
                ? "#34d399"
                : n.proficiency >= 0.4
                ? "#fbbf24"
                : "#f87171",
          }));

        const wrongAnswers: WrongAnswer[] = questionsRaw
          .filter((q: any) => q.evaluation && q.evaluation.correctness < 1.0)
          .map((q: any) => ({
            id: q.id,
            conceptName: q.conceptName,
            prompt: q.prompt,
            correctAnswer: q.correctAnswer,
            userAnswer: q.answer?.rawAnswer ?? "No answer",
            explanation: q.explanation,
          }));

        setData({
          subject: stateRes.ok ? stateData.session.subject : "Assessment",
          overallProficiency: report.overallProficiency,
          strongAreas: report.strongAreas ?? [],
          weakAreas: report.weakAreas ?? [],
          developingAreas: report.developingAreas ?? [],
          recommendedNextAreas: report.recommendedNextAreas ?? [],
          summary: report.summary,
          chartData,
          wrongAnswers,
        });
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
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="absolute inset-2 rounded-full bg-primary/40" />
            <Trophy className="absolute inset-0 m-auto h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted">Building your skill report…</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-grid px-6">
        <p className="text-sm text-rose-400">{error ?? "Report unavailable."}</p>
      </main>
    );
  }

  const score = data.overallProficiency;
  const totalTopics =
    data.strongAreas.length + data.weakAreas.length + data.developingAreas.length;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.09 } },
  };
  const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <main className="min-h-screen bg-grid px-4 py-12 sm:px-6">
      <div className="pointer-events-none fixed inset-0 bg-grid-fade" />
      <div className="relative z-10 mx-auto max-w-4xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="font-mono text-xs uppercase tracking-widest text-primary/70">
            Final Report — {data.subject}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">Your skill assessment</h1>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="mt-8 space-y-5">

          {/* ── Score hero ── */}
          <motion.div variants={item}>
            <Card className={`relative overflow-hidden border bg-gradient-to-br p-8 ${getScoreBg(score)}`}>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
                {/* Big % */}
                <div className="flex flex-col items-center sm:items-start">
                  <div className={`text-8xl font-extrabold leading-none tracking-tight ${getScoreColor(score)}`}>
                    {pct(score)}
                  </div>
                  <p className="mt-2 text-sm font-medium text-white/60">{getScoreLabel(score)}</p>
                </div>

                {/* Stat pills */}
                <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
                  <StatPill
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    label="Strong topics"
                    value={String(data.strongAreas.length)}
                    accent="text-emerald-400"
                  />
                  <StatPill
                    icon={<Zap className="h-4 w-4 text-yellow-400" />}
                    label="Developing"
                    value={String(data.developingAreas.length)}
                    accent="text-yellow-400"
                  />
                  <StatPill
                    icon={<AlertTriangle className="h-4 w-4 text-rose-400" />}
                    label="Needs review"
                    value={String(data.weakAreas.length)}
                    accent="text-rose-400"
                  />
                  <StatPill
                    icon={<Target className="h-4 w-4 text-primary" />}
                    label="Topics tested"
                    value={String(totalTopics)}
                    accent="text-primary"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-sm leading-relaxed text-white/60">{data.summary}</p>
              </div>
            </Card>
          </motion.div>

          {/* ── Topic bands ── */}
          {totalTopics > 0 && (
            <motion.div variants={item}>
              <Card className="divide-y divide-white/5 overflow-hidden p-0">
                {data.strongAreas.length > 0 && (
                  <TopicBand
                    label="Strong"
                    sublabel="You demonstrated solid understanding here"
                    topics={data.strongAreas}
                    chipClass="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    labelClass="text-emerald-400"
                    dot="bg-emerald-400"
                  />
                )}
                {data.developingAreas.length > 0 && (
                  <TopicBand
                    label="Developing"
                    sublabel="Getting there — a bit more practice needed"
                    topics={data.developingAreas}
                    chipClass="border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
                    labelClass="text-yellow-400"
                    dot="bg-yellow-400"
                  />
                )}
                {data.weakAreas.length > 0 && (
                  <TopicBand
                    label="Needs review"
                    sublabel="Focus your study time on these topics"
                    topics={data.weakAreas}
                    chipClass="border-rose-500/40 bg-rose-500/10 text-rose-300"
                    labelClass="text-rose-400"
                    dot="bg-rose-400"
                  />
                )}
              </Card>
            </motion.div>
          )}

          {/* ── Bar chart ── */}
          {data.chartData.length > 0 && (
            <motion.div variants={item}>
              <Card className="p-6">
                <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-white">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Proficiency by concept
                </h2>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData} margin={{ bottom: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#8b93a7" }}
                        interval={0}
                        angle={-18}
                        textAnchor="end"
                        height={56}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "#8b93a7" }} domain={[0, 100]} unit="%" />
                      <Tooltip
                        formatter={(v: number) => [`${v}%`, "Proficiency"]}
                        contentStyle={{
                          background: "#0b0f19",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="proficiency" radius={[4, 4, 0, 0]}>
                        {data.chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── Mistakes review ── */}
          {data.wrongAnswers.length > 0 && (
            <motion.div variants={item}>
              <Card className="p-6">
                <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-white">
                  <XCircle className="h-4 w-4 text-rose-400" />
                  Review your mistakes
                </h2>
                <div className="space-y-6">
                  {data.wrongAnswers.map((wa) => (
                    <div key={wa.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
                          {wa.conceptName}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-white">{wa.prompt}</p>
                      
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded border border-rose-500/20 bg-rose-500/5 p-3">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-rose-400/80">Your answer</p>
                          <p className="text-sm text-rose-300">{wa.userAnswer}</p>
                        </div>
                        <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-3">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400/80">Correct answer</p>
                          <p className="text-sm text-emerald-300">{wa.correctAnswer}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 rounded bg-white/[0.03] p-3 text-sm text-muted">
                        <span className="font-semibold text-white/70">Explanation:</span> {wa.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── Next steps ── */}
          {data.recommendedNextAreas.length > 0 && (
            <motion.div variants={item}>
              <Card className="p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <BookOpen className="h-4 w-4 text-primary" />
                  What to study next
                </h2>
                <ul className="space-y-2">
                  {data.recommendedNextAreas.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary/50" />
                      {a}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}

          {/* ── Actions ── */}
          <motion.div
            variants={item}
            className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center"
          >
            <Link href="/dashboard?tab=discover">
              <Button size="lg" className="w-full sm:w-auto">
                <Trophy className="mr-2 h-4 w-4" />
                Try another subject
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <ArrowRight className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}

/* ── Small components ──────────────────────────────────────────────────── */

function StatPill({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-white/8 bg-white/5 px-5 py-3 sm:items-start">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] text-white/40">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${accent}`}>{value}</span>
    </div>
  );
}

function TopicBand({
  label, sublabel, topics, chipClass, labelClass, dot,
}: {
  label: string;
  sublabel: string;
  topics: string[];
  chipClass: string;
  labelClass: string;
  dot: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-6">
      <div className="w-32 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${dot}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${labelClass}`}>{label}</span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-white/30">{sublabel}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <span key={t} className={`rounded-full border px-3 py-1 text-xs font-medium ${chipClass}`}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
