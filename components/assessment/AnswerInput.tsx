"use client";

import { cn } from "@/lib/utils";
import type { ClientQuestion } from "@/lib/validation/question";

export function AnswerInput({
  question,
  value,
  onChange,
}: {
  question: ClientQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(question.options ?? []).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-xl border border-border bg-white/[0.02] p-4 text-left text-sm text-white transition-all hover:border-primary/40 hover:bg-white/[0.04]",
              value === opt && "border-primary/60 bg-primary/[0.08] ring-1 ring-primary/40"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  const isCode = ["CODE_OUTPUT", "CODE_WRITING", "DEBUGGING"].includes(question.type);

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={isCode ? "// Write your code or predicted output here" : "Type your answer…"}
      rows={isCode ? 9 : 5}
      className={cn(
        "w-full resize-none rounded-xl border border-border bg-white/[0.02] p-4 text-sm text-white placeholder:text-muted/50 focus:border-primary/50 focus:outline-none",
        isCode && "font-mono"
      )}
    />
  );
}
