"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { pct } from "@/lib/utils";
import type { SkillGraphNodeData } from "@/types/skill";

const TONE: Record<string, "strong" | "developing" | "weak" | "uncertain"> = {
  STRONG: "strong",
  DEVELOPING: "developing",
  WEAK: "weak",
  UNCERTAIN: "uncertain",
};

export function SkillDetails({
  node,
  onClose,
}: {
  node: SkillGraphNodeData;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-4 w-64 rounded-xl border border-border bg-surface/95 p-4 shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-white">{node.name}</h4>
        <button onClick={onClose} className="text-muted hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2">
        <Badge tone={TONE[node.state]}>{node.state}</Badge>
      </div>
      <div className="mt-3 space-y-1.5 font-mono text-xs text-muted">
        <div className="flex justify-between">
          <span>Proficiency</span>
          <span className="text-white">{pct(node.proficiency)}</span>
        </div>
        <div className="flex justify-between">
          <span>Evidence confidence</span>
          <span className="text-white">{pct(node.evidenceConfidence)}</span>
        </div>
        <div className="flex justify-between">
          <span>Importance</span>
          <span className="text-white">{pct(node.importance)}</span>
        </div>
      </div>
      {node.prerequisites.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-[11px] uppercase tracking-wide text-muted/70">Prerequisites</p>
          <p className="mt-1 text-xs text-white">{node.prerequisites.join(", ")}</p>
        </div>
      )}
    </motion.div>
  );
}
