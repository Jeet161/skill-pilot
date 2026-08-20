import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "strong" | "developing" | "weak" | "uncertain";
}) {
  const tones: Record<string, string> = {
    default: "bg-white/5 text-muted border-white/10",
    strong: "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30",
    developing: "bg-primary/10 text-primary border-primary/30",
    weak: "bg-accent-rose/10 text-accent-rose border-accent-rose/30",
    uncertain: "bg-accent-amber/10 text-accent-amber border-accent-amber/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
