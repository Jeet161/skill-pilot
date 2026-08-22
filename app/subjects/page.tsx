"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Code2, Coffee, Braces, FileCode2, Database, GitBranch,
  Container, Server, Globe, ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Only subjects with confirmed QuizAPI tag support are listed here.
 * Subjects without a matching QuizAPI tag (C++, Electronics, Data Structures,
 * Algorithms) have been removed — users can still type them in the custom
 * input and the AI fallback will generate questions for them.
 */
const SUBJECTS = [
  { id: "Python",     icon: Code2,     blurb: "Syntax, data structures, idioms" },
  { id: "JavaScript", icon: Braces,    blurb: "Runtime behavior, async, closures" },
  { id: "TypeScript", icon: FileCode2, blurb: "Types, generics, inference" },
  { id: "Java",       icon: Coffee,    blurb: "OOP, collections, concurrency" },
  { id: "SQL",        icon: Database,  blurb: "Queries, joins, schema design" },
  { id: "Git",        icon: GitBranch, blurb: "Branching, merging, workflows" },
  { id: "Docker",     icon: Container, blurb: "Images, containers, compose" },
  { id: "Linux",      icon: Server,    blurb: "Shell, permissions, processes" },
  { id: "PHP",        icon: Globe,     blurb: "Web scripting, forms, OOP" },
];

export default function SubjectsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const router = useRouter();

  function proceed(subject: string) {
    router.push(`/assessment/new?subject=${encodeURIComponent(subject)}`);
  }

  return (
    <main className="min-h-screen bg-grid px-6 py-16">
      <div className="pointer-events-none fixed inset-0 bg-grid-fade" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-primary/80">Step 1 of 2</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
          Choose a subject
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          SkillPilot dynamically discovers the concept structure for whatever
          you choose — nothing below is a pre-written test.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Card
                onClick={() => setSelected(s.id)}
                className={cn(
                  "group cursor-pointer p-5 transition-all hover:border-primary/40 hover:bg-white/[0.04]",
                  selected === s.id && "border-primary/60 bg-primary/[0.06]"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-border group-hover:border-primary/30">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight
                    className={cn(
                      "h-4 w-4 text-muted opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5",
                      selected === s.id && "opacity-100 text-primary"
                    )}
                  />
                </div>
                <h3 className="mt-4 font-medium text-white">{s.id}</h3>
                <p className="mt-1 text-xs text-muted">{s.blurb}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setSelected(null);
            }}
            placeholder="Or type any subject — Rust, Statistics, Networking…"
            className="h-11 flex-1 rounded-lg border border-border bg-white/[0.03] px-4 text-sm text-white placeholder:text-muted/60 focus:border-primary/50 focus:outline-none"
          />
        </div>

        <div className="mt-10 flex justify-end">
          <button
            disabled={!selected && !custom.trim()}
            onClick={() => proceed(selected ?? custom.trim())}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-7 text-sm font-medium text-background shadow-[0_0_20px_-4px_rgba(99,102,241,0.5)] transition-all disabled:pointer-events-none disabled:opacity-30 hover:bg-primary/90"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
