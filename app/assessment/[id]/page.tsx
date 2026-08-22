"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, RefreshCw, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssessmentProgress } from "@/components/assessment/AssessmentProgress";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { AnswerInput } from "@/components/assessment/AnswerInput";
import { ConfidenceSelector } from "@/components/assessment/ConfidenceSelector";
import { DiagnosisPanel } from "@/components/assessment/DiagnosisPanel";
import { InterventionCard } from "@/components/assessment/InterventionCard";
import type { ClientQuestion } from "@/lib/validation/question";

type Phase = "loading" | "question" | "submitting" | "feedback" | "intervention" | "error" | "completed";

interface SessionState {
  session: {
    id: string;
    subject: string;
    status: string;
    askedCount: number;
    targetCount: number;
    goal: string | null;
  };
  currentQuestion: ClientQuestion | null;
  skillEstimates: Array<{
    conceptId: string;
    proficiency: number;
    evidenceConfidence: number;
  }>;
}

const THINKING_MESSAGES = [
  "Analyzing your answer…",
  "Updating your skill model…",
  "Finding your next challenge…",
  "Mapping your understanding…",
];

export default function AssessmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [state, setState] = useState<SessionState | null>(null);
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    status: string;
    correctness: number;
    explanationForLearner: string | null;
    correctAnswer: string;
    explanation: string;
  } | null>(null);
  const [intervention, setIntervention] = useState<{
    title: string;
    explanation: string;
  } | null>(null);
  const [nextLoading, setNextLoading] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [thinkingMsg, setThinkingMsg] = useState(THINKING_MESSAGES[0]);
  const [pendingNextQuestion, setPendingNextQuestion] = useState<ClientQuestion | null>(null);

  const loadState = useCallback(async (isPolling = false) => {
    const res = await fetch(`/api/assessment/${params.id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load assessment.");
      setPhase("error");
      return;
    }
    setState(data);
    
    if (data.session.status === "FAILED") {
      setError("The AI was unable to generate a valid assessment right now. Please go back and try again.");
      setPhase("error");
      return;
    }
    
    if (data.session.status === "BLUEPRINT_PENDING" || (data.session.status === "IN_PROGRESS" && !data.currentQuestion)) {
      if (!isPolling) setPhase("loading");
      // Poll every 4 seconds until blueprint and question are ready
      setTimeout(() => loadState(true), 4000);
      return;
    }

    if (data.session.status === "COMPLETED" && !data.currentQuestion) {
      setPhase("completed");
    } else {
      setPhase("question");
      setStartedAt(Date.now());
    }
  }, [params.id]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (phase !== "submitting") return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % THINKING_MESSAGES.length;
      setThinkingMsg(THINKING_MESSAGES[i]);
    }, 1400);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === "completed") {
      router.push(`/assessment/${params.id}/result`);
    }
  }, [phase, params.id, router]);

  async function submit() {
    if (!state?.currentQuestion) return;
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch(`/api/assessment/${params.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: state.currentQuestion.id,
          rawAnswer: answer,
          confidence: confidence ?? undefined,
          timeTakenMs: Date.now() - startedAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit answer");

      setFeedback({
        status: data.evaluation.status,
        correctness: data.evaluation.correctness,
        explanationForLearner: data.evaluation.explanationForLearner,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
      });

      // Wrong answer: show study intervention, session is completed
      if (data.failed) {
        setIntervention({
          title: `Study "${state.currentQuestion.conceptName}" and try again`,
          explanation: `You answered incorrectly. Don't worry — review the topic "${state.currentQuestion.conceptName}" and come back when you're ready. The correct answer was: ${data.correctAnswer}. ${data.explanation}`,
        });
        setPhase("intervention");
        return;
      }

      if (data.completed) {
        setPhase("completed");
      } else {
        setPendingNextQuestion(data.nextQuestion);
        setPhase("feedback");
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
      setPhase("error");
    }
  }

  async function proceedToNext() {
    if (!pendingNextQuestion) {
      router.push("/subjects");
      return;
    }
    
    setNextLoading(true);
    setState({
      ...state!,
      currentQuestion: pendingNextQuestion,
      session: {
        ...state!.session,
        askedCount: state!.session.askedCount + 1,
      },
    });
    setAnswer("");
    setConfidence(null);
    setFeedback(null);
    setPendingNextQuestion(null);
    setIntervention(null);
    setStartedAt(Date.now());
    setPhase("question");
    setNextLoading(false);
  }

  async function retry() {
    setError(null);
    setPhase("loading");
    try {
      const res = await fetch(`/api/assessment/${params.id}/next-question`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Retry failed");
      await loadState();
    } catch (e: any) {
      setError(e.message ?? "Retry failed.");
      setPhase("error");
    }
  }

  if (phase === "loading" || !state || state.session.status === "BLUEPRINT_PENDING") {
    return <CenteredState icon={<Loader2 className="h-6 w-6 animate-spin text-primary" />} text="Disovering subject concepts and preparing your first question..." />;
  }

  if (phase === "error") {
    return (
      <CenteredState
        icon={<RefreshCw className="h-6 w-6 text-accent-rose" />}
        text={error ?? "Something went wrong."}
        action={
          <Button variant="outline" size="sm" onClick={retry}>
            Retry
          </Button>
        }
      />
    );
  }

  const currentEstimate = state.currentQuestion
    ? state.skillEstimates.find((e) => e.conceptId === state.currentQuestion!.conceptId)
    : undefined;


  return (
    <main className="min-h-screen bg-grid px-6 py-12">
      <div className="pointer-events-none fixed inset-0 bg-grid-fade" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <AssessmentProgress
          subject={state.session.subject}
          asked={state.session.askedCount}
          target={state.session.targetCount}
        />

        <Card className="mt-8 p-8">
          <AnimatePresence mode="wait">
            {phase === "submitting" && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <Sparkles className="mb-4 h-6 w-6 animate-pulseSlow text-primary" />
                <p className="text-sm text-muted">{thinkingMsg}</p>
              </motion.div>
            )}

            {phase === "question" && state.currentQuestion && (
              <QuestionCard
                key={state.currentQuestion.id}
                question={state.currentQuestion}
                proficiency={currentEstimate?.proficiency}
                evidenceConfidence={currentEstimate?.evidenceConfidence}
              >
                <AnswerInput question={state.currentQuestion} value={answer} onChange={setAnswer} />
                <div className="mt-5">
                  <ConfidenceSelector value={confidence} onChange={setConfidence} />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={submit} disabled={!answer.trim()}>
                    Submit answer
                  </Button>
                </div>
              </QuestionCard>
            )}

            {phase === "feedback" && feedback && (
              <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DiagnosisPanel {...feedback} />
                <div className="mt-6 flex justify-end">
                  <Button onClick={proceedToNext} disabled={nextLoading}>
                    {nextLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Next question"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {phase === "intervention" && intervention && (
              <motion.div key="intervention" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-amber/10 border border-accent-amber/30">
                  <BookOpen className="h-6 w-6 text-accent-amber" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{intervention.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{intervention.explanation}</p>
                </div>
                <Link href="/subjects">
                  <Button size="lg" className="mt-2">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Exit to Study
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </main>
  );
}

function CenteredState({
  icon,
  text,
  action,
}: {
  icon: React.ReactNode;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-grid px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        {icon}
        <p className="max-w-sm text-sm text-muted">{text}</p>
        {action}
      </div>
    </main>
  );
}
