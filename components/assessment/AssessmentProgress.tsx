"use client";

import { Progress } from "@/components/ui/progress";

export function AssessmentProgress({
  subject,
  asked,
  target,
}: {
  subject: string;
  asked: number;
  target: number;
}) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-mono uppercase tracking-wide text-muted">{subject}</span>
        <span className="text-muted">
          Question <span className="text-white">{Math.min(asked, target)}</span> / {target}
        </span>
      </div>
      <Progress value={(asked / target) * 100} />
    </div>
  );
}
