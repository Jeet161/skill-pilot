"use client";

import { Handle, Position } from "reactflow";
import { cn, pct } from "@/lib/utils";
import type { SkillGraphNodeData } from "@/types/skill";

const STATE_STYLES: Record<string, { border: string; bg: string; dot: string }> = {
  STRONG: { border: "border-accent-emerald/50", bg: "bg-accent-emerald/[0.08]", dot: "bg-accent-emerald" },
  DEVELOPING: { border: "border-primary/50", bg: "bg-primary/[0.08]", dot: "bg-primary" },
  WEAK: { border: "border-accent-rose/50", bg: "bg-accent-rose/[0.08]", dot: "bg-accent-rose" },
  UNCERTAIN: { border: "border-accent-amber/50", bg: "bg-accent-amber/[0.08]", dot: "bg-accent-amber" },
};

export function SkillNode({ data }: { data: SkillGraphNodeData & { onSelect?: () => void } }) {
  const style = STATE_STYLES[data.state] ?? STATE_STYLES.UNCERTAIN;

  return (
    <div
      onClick={data.onSelect}
      className={cn(
        "min-w-[150px] cursor-pointer rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-transform hover:scale-[1.03]",
        style.border,
        style.bg
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-white/20" />
      <div className="flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
        <span className="text-xs font-medium text-white">{data.name}</span>
      </div>
      <div className="mt-1.5 font-mono text-[11px] text-muted">
        {data.evidenceConfidence > 0 ? pct(data.proficiency) : "no evidence"}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-white/20" />
    </div>
  );
}
