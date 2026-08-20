"use client";

import { cn } from "@/lib/utils";

const LEVELS = [
  { v: 1, label: "Guessing" },
  { v: 2, label: "Unsure" },
  { v: 3, label: "Fairly sure" },
  { v: 4, label: "Confident" },
  { v: 5, label: "Certain" },
];

export function ConfidenceSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted">How confident are you? (optional)</p>
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.v}
            type="button"
            onClick={() => onChange(l.v)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-all hover:border-primary/40 hover:text-white",
              value === l.v && "border-primary/60 bg-primary/10 text-primary"
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
