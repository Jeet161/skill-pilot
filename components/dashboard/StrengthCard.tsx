"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export function StrengthCard({ areas }: { areas: string[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-accent-emerald" />
        <h3 className="text-sm font-medium text-white">Strong areas</h3>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {areas.length === 0 ? (
          <p className="text-xs text-muted">No areas reached strong confidence yet.</p>
        ) : (
          areas.map((a) => (
            <Badge key={a} tone="strong">
              {a}
            </Badge>
          ))
        )}
      </div>
    </Card>
  );
}
