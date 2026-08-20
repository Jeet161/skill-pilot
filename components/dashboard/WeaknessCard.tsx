"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export function WeaknessCard({
  areas,
  misconceptions,
}: {
  areas: string[];
  misconceptions: Array<{ concept: string; description: string }>;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-accent-rose" />
        <h3 className="text-sm font-medium text-white">Weak areas</h3>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {areas.length === 0 ? (
          <p className="text-xs text-muted">No confirmed weak areas.</p>
        ) : (
          areas.map((a) => (
            <Badge key={a} tone="weak">
              {a}
            </Badge>
          ))
        )}
      </div>
      {misconceptions.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          {misconceptions.map((m, i) => (
            <div key={i} className="text-xs">
              <span className="font-medium text-white">{m.concept}:</span>{" "}
              <span className="text-muted">{m.description}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
