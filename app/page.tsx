"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, GitBranch, Target, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const NODES = [
  { x: 60, y: 40, r: 5, label: "variables" },
  { x: 180, y: 20, r: 4, label: "types" },
  { x: 300, y: 60, r: 6, label: "loops" },
  { x: 130, y: 130, r: 4, label: "functions" },
  { x: 260, y: 150, r: 5, label: "recursion" },
  { x: 380, y: 130, r: 4, label: "closures" },
  { x: 40, y: 200, r: 4, label: "errors" },
  { x: 200, y: 230, r: 6, label: "classes" },
  { x: 340, y: 220, r: 4, label: "async" },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 3], [1, 2], [2, 4], [3, 4], [3, 6],
  [4, 5], [4, 7], [5, 8], [6, 7], [7, 8],
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-grid">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade" />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-mono text-sm font-semibold tracking-wide text-white">
            SKILLPILOT
          </span>
        </div>
        <Link href="/subjects">
          <Button variant="outline" size="sm">
            Launch app
          </Button>
        </Link>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-28 pt-16 lg:grid-cols-2 lg:pt-24">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulseSlow" />
            Adaptive assessment engine — generated live, per learner
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl"
          >
            SKILLPILOT
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mt-4 text-xl font-medium text-primary/90"
          >
            Know what you know. Discover what you need to learn.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-6 max-w-lg text-base leading-relaxed text-muted"
          >
            An adaptive AI assessment engine that discovers your strengths,
            identifies your knowledge gaps, adapts to your performance, and
            verifies your improvement — one question at a time, generated
            around you, never from a fixed bank.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link href="/subjects">
              <Button size="lg">
                Start Assessment <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-xs text-muted">No question bank. No fixed test. Every path is different.</span>
          </motion.div>

          <div className="mt-14 grid grid-cols-3 gap-4">
            {[
              { icon: ScanSearch, label: "Diagnoses gaps, not just wrong answers" },
              { icon: Target, label: "Adapts difficulty in real time" },
              { icon: GitBranch, label: "Verifies transfer, not lucky guesses" },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                className="rounded-xl border border-border bg-white/[0.02] p-3"
              >
                <f.icon className="mb-2 h-4 w-4 text-primary" />
                <p className="text-xs leading-snug text-muted">{f.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
        >
          <Card className="relative aspect-square overflow-hidden p-0">
            <svg viewBox="0 0 420 280" className="h-full w-full">
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#6ee7ff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#6ee7ff" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="420" height="280" fill="url(#glow)" />
              {EDGES.map(([a, b], i) => (
                <motion.line
                  key={i}
                  x1={NODES[a].x}
                  y1={NODES[a].y}
                  x2={NODES[b].x}
                  y2={NODES[b].y}
                  stroke="rgba(110,231,255,0.35)"
                  strokeWidth={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, delay: 0.4 + i * 0.06 }}
                />
              ))}
              {NODES.map((n, i) => (
                <g key={i}>
                  <motion.circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r + 6}
                    fill="none"
                    stroke="rgba(110,231,255,0.15)"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                  />
                  <motion.circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r}
                    fill={i % 3 === 0 ? "#6ee7ff" : i % 3 === 1 ? "#a78bfa" : "#34d399"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 + i * 0.08 }}
                  />
                  <text
                    x={n.x}
                    y={n.y - 12}
                    textAnchor="middle"
                    fontSize="9"
                    fill="rgba(255,255,255,0.4)"
                    fontFamily="var(--font-mono)"
                  >
                    {n.label}
                  </text>
                </g>
              ))}
            </svg>
          </Card>
        </motion.div>
      </section>
    </main>
  );
}
