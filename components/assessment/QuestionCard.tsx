"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { ClientQuestion } from "@/lib/validation/question";
import { WhyQuestionPanel } from "./WhyQuestionPanel";

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short answer",
  CODE_OUTPUT: "Predict output",
  CODE_WRITING: "Write code",
  DEBUGGING: "Debug",
  CONCEPTUAL_EXPLANATION: "Explain",
  SCENARIO: "Scenario",
  PRACTICAL_PROBLEM: "Practical problem",
};

const PURPOSE_LABEL: Record<string, string> = {
  BASELINE: "Baseline",
  SAME_CONCEPT_EASIER: "Review",
  SAME_CONCEPT_DIFFERENT_FORM: "Re-check",
  SAME_CONCEPT_HARDER: "Level up",
  PREREQUISITE_TEST: "Prerequisite check",
  REMEDIAL_TEST: "Remedial",
  TRANSFER_TEST: "Transfer check",
  RELATED_CONCEPT: "Related concept",
  NEW_CONCEPT: "New concept",
  ADVANCED_CONCEPT: "Advanced",
};

export function QuestionCard({
  question,
  proficiency,
  evidenceConfidence,
  children,
}: {
  question: ClientQuestion;
  proficiency?: number;
  evidenceConfidence?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge>{question.conceptName}</Badge>
        <Badge>{TYPE_LABEL[question.type] ?? question.type}</Badge>
        <Badge>{PURPOSE_LABEL[question.purpose] ?? question.purpose}</Badge>
        <span className="ml-auto font-mono text-[11px] text-muted">
          difficulty {Math.round(question.difficulty * 100)}%
        </span>
      </div>

      <div className="whitespace-pre-wrap text-lg leading-relaxed text-white">
        <RenderPrompt text={question.prompt} />
      </div>

      <WhyQuestionPanel
        rationale={question.rationale}
        proficiency={proficiency}
        evidenceConfidence={evidenceConfidence}
      />

      <div className="mt-6">{children}</div>
    </motion.div>
  );
}

/** Lightweight fenced-code-block renderer, no external markdown dep needed. */
function RenderPrompt({ text }: { text: string }) {
  const parts = text.split(/```(\w*)\n?([\s\S]*?)```/g);
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) nodes.push(<span key={`t${i}`}>{parts[i]}</span>);
    const code = parts[i + 2];
    if (code !== undefined) {
      nodes.push(
        <pre
          key={`c${i}`}
          className="my-3 overflow-x-auto rounded-lg border border-border bg-black/40 p-4 font-mono text-sm text-primary/90"
        >
          <code>{code}</code>
        </pre>
      );
    }
  }
  return <>{nodes}</>;
}
