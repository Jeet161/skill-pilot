"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COUNTS = [10, 15, 20] as const;
const MODES = [
  { id: "BALANCED", label: "Balanced", blurb: "Broad coverage across all core concepts" },
  { id: "DEEP", label: "Deep Assessment", blurb: "Fewer concepts, tested far more thoroughly" },
  { id: "PRACTICAL", label: "Practical", blurb: "Favors code, debugging, and applied scenarios" },
  { id: "CONCEPTUAL", label: "Conceptual", blurb: "Favors explanation and reasoning questions" },
] as const;

function NewAssessmentInner() {
  const router = useRouter();
  const params = useSearchParams();
  const subject = params.get("subject") ?? "Python";

  const [count, setCount] = useState<number>(10);
  const [mode, setMode] = useState<string>("BALANCED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assessment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, targetCount: count, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start assessment");
      router.push(`/assessment/${data.sessionId}`);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-grid px-6 py-16">
      <div className="pointer-events-none fixed inset-0 bg-grid-fade" />
      <div className="relative z-10 mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-primary/80">Step 2 of 2</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Configure your assessment
        </h1>
        <p className="mt-2 text-sm text-muted">
          Subject: <span className="text-white">{subject}</span> — the AI will
          design a fresh blueprint for it once you start.
        </p>

        <div className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-white text-center">Number of questions</h2>
          <div className="flex justify-center gap-4">
            {COUNTS.map((c) => (
              <Card
                key={c}
                onClick={() => setCount(c)}
                className={cn(
                  "cursor-pointer p-4 text-center transition-all hover:border-primary/40 w-full max-w-[180px]",
                  count === c && "border-primary/60 bg-primary/[0.06]"
                )}
              >
                <div className="text-xl font-semibold text-white">{c}</div>
                <div className="text-[11px] text-muted">questions</div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-white">Assessment mode</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MODES.map((m) => (
              <Card
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "cursor-pointer p-4 transition-all hover:border-primary/40",
                  mode === m.id && "border-primary/60 bg-primary/[0.06]"
                )}
              >
                <div className="text-sm font-medium text-white">{m.label}</div>
                <div className="mt-1 text-xs text-muted">{m.blurb}</div>
              </Card>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
            {error}
          </div>
        )}

        <div className="mt-10 flex justify-end">
          <Button size="lg" onClick={start} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Building your assessment…
              </>
            ) : (
              <>
                Start Assessment <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center gap-2 text-xs text-muted"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulseSlow" />
            Analyzing {subject} and designing a concept blueprint…
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function NewAssessmentPage() {
  return (
    <Suspense fallback={null}>
      <NewAssessmentInner />
    </Suspense>
  );
}
