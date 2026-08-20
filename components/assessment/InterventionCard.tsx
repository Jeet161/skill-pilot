"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InterventionCard({
  title,
  explanation,
  onContinue,
}: {
  title: string;
  explanation: string;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-accent-amber/30 bg-accent-amber/[0.06] p-5"
    >
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent-amber" />
        <span className="text-xs font-semibold uppercase tracking-wide text-accent-amber">
          Quick review
        </span>
      </div>
      <h4 className="mt-2 text-sm font-medium text-white">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-muted">{explanation}</p>
      <div className="mt-4">
        <Button size="sm" variant="outline" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
