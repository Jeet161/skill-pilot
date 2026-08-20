"use client";

import { useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { AnimatePresence } from "framer-motion";
import { SkillNode } from "./SkillNode";
import { SkillDetails } from "./SkillDetails";
import type { SkillGraphNodeData } from "@/types/skill";

const nodeTypes = { skill: SkillNode };

/**
 * Simple layered layout: nodes with no prerequisites sit at the top,
 * each subsequent layer is determined by longest-path depth from any
 * root. This is computed from the AI-generated blueprint's actual
 * prerequisite edges — never a fixed layout.
 */
function computeLayout(nodes: SkillGraphNodeData[]): Map<string, { x: number; y: number }> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depth = new Map<string, number>();

  function getDepth(id: string, seen = new Set<string>()): number {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 0; // guard against accidental cycles
    seen.add(id);
    const node = byId.get(id);
    if (!node || node.prerequisites.length === 0) {
      depth.set(id, 0);
      return 0;
    }
    const d =
      1 +
      Math.max(
        0,
        ...node.prerequisites
          .filter((p) => byId.has(p))
          .map((p) => getDepth(p, seen))
      );
    depth.set(id, d);
    return d;
  }

  nodes.forEach((n) => getDepth(n.id));

  const layers = new Map<number, string[]>();
  nodes.forEach((n) => {
    const d = depth.get(n.id) ?? 0;
    if (!layers.has(d)) layers.set(d, []);
    layers.get(d)!.push(n.id);
  });

  const positions = new Map<string, { x: number; y: number }>();
  [...layers.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([layer, ids]) => {
      ids.forEach((id, i) => {
        positions.set(id, {
          x: i * 220 - (ids.length * 220) / 2,
          y: layer * 140,
        });
      });
    });

  return positions;
}

export function SkillGraph({ nodes: data }: { nodes: SkillGraphNodeData[] }) {
  const [selected, setSelected] = useState<SkillGraphNodeData | null>(null);

  const { nodes, edges } = useMemo(() => {
    const positions = computeLayout(data);
    const nodes: Node[] = data.map((n) => ({
      id: n.id,
      type: "skill",
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      data: { ...n, onSelect: () => setSelected(n) },
    }));

    const edges: Edge[] = data.flatMap((n) =>
      n.prerequisites
        .filter((p) => data.some((d) => d.id === p))
        .map((p) => ({
          id: `${p}->${n.id}`,
          source: p,
          target: n.id,
          animated: n.state === "UNCERTAIN",
          style: { stroke: "rgba(255,255,255,0.15)" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.25)" },
        }))
    );

    return { nodes, edges };
  }, [data]);

  const onPaneClick = useCallback(() => setSelected(null), []);

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted">
        No skill graph data yet.
      </div>
    );
  }

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-border bg-black/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onPaneClick={onPaneClick}
        fitView
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
      >
        <Background color="rgba(255,255,255,0.06)" gap={24} />
        <Controls className="!bg-surface !border-border [&>button]:!bg-surface [&>button]:!border-border [&>button]:!text-white" />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(5,7,13,0.7)"
          nodeColor={() => "#6ee7ff"}
          className="!bg-surface !border !border-border"
        />
      </ReactFlow>
      <AnimatePresence>
        {selected && <SkillDetails node={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
