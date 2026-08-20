"use client";

import { Card } from "@/components/ui/card";
import { pct } from "@/lib/utils";

export function SkillSummary({
  proficiency,
  confidence,
  improvement,
  transferPerformance,
  difficultyCeiling,
}: {
  proficiency: number;
  confidence: number;
  improvement: number;
  transferPerformance: number;
  difficultyCeiling: number;
}) {
  const items = [
    { label: "Estimated proficiency", value: pct(proficiency) },
    { label: "Evidence confidence", value: pct(confidence) },
    { label: "Improvement during session", value: `${improvement >= 0 ? "+" : ""}${Math.round(improvement * 100)}%` },
    { label: "Transfer performance", value: pct(transferPerformance) },
    { label: "Difficulty ceiling reached", value: pct(difficultyCeiling) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((it) => (
        <Card key={it.label} className="p-4">
          <p className="text-2xl font-semibold text-white">{it.value}</p>
          <p className="mt-1 text-[11px] leading-tight text-muted">{it.label}</p>
        </Card>
      ))}
    </div>
  );
}
