"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, HelpCircle, CircleDot } from "lucide-react";
import { pct } from "@/lib/utils";

const STATUS_MAP: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  CORRECT: { icon: CheckCircle2, color: "text-accent-emerald", label: "Correct" },
  INCORRECT: { icon: XCircle, color: "text-accent-rose", label: "Incorrect" },
  PARTIALLY_CORRECT: { icon: CircleDot, color: "text-accent-amber", label: "Partially correct" },
  UNCERTAIN: { icon: HelpCircle, color: "text-muted", label: "Uncertain" },
};

export function DiagnosisPanel({
  status,
  correctness,
  explanationForLearner,
  correctAnswer,
  explanation,
}: {
  status: string;
  correctness: number;
  explanationForLearner: string | null;
  correctAnswer: string;
  explanation: string;
}) {
  const meta = STATUS_MAP[status] ?? STATUS_MAP.UNCERTAIN;
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-white/[0.02] p-5"
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${meta.color}`} />
        <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
        <span className="ml-auto font-mono text-[11px] text-muted">
          correctness {pct(correctness)}
        </span>
      </div>

      {explanationForLearner && (
        <p className="mt-3 text-sm leading-relaxed text-muted">{explanationForLearner}</p>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs uppercase tracking-wide text-muted/70">Reference answer</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-white">{correctAnswer}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{explanation}</p>
      </div>
    </motion.div>
  );
}
