"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { pct } from "@/lib/utils";

export function WhyQuestionPanel({
  rationale,
  proficiency,
  evidenceConfidence,
}: {
  rationale: string | null;
  proficiency?: number;
  evidenceConfidence?: number;
}) {
  const [open, setOpen] = useState(false);
  if (!rationale) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-primary"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Why am I seeing this?
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-lg border border-border bg-white/[0.02] p-3 text-xs text-muted">
              <p>{rationale}</p>
              {typeof proficiency === "number" && (
                <div className="mt-2 flex gap-4 font-mono text-[11px]">
                  <span>
                    Estimated proficiency: <span className="text-white">{pct(proficiency)}</span>
                  </span>
                  {typeof evidenceConfidence === "number" && (
                    <span>
                      Evidence confidence: <span className="text-white">{pct(evidenceConfidence)}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
