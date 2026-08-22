import "server-only";
import { QuestionType } from "@prisma/client";

const BASE_URL = "https://quizapi.io/api/v1/questions";
const API_KEY = process.env.QUIZAPI_KEY;

// Map SkillPilot subject names to QuizAPI tags
const SUBJECT_TAG_MAP: Record<string, string> = {
  javascript: "JavaScript",
  js: "JavaScript",
  python: "Python",
  sql: "MySQL",
  typescript: "JavaScript",
  java: "Java",
  "c++": "Linux",
  cpp: "Linux",
  git: "Git",
  docker: "Docker",
  linux: "Linux",
  "data structures": "Code",
  algorithms: "Code",
  php: "PHP",
};

export interface FetchedQuestion {
  conceptId: string;
  conceptName: string;
  type: QuestionType;
  difficulty: number;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

function getTagForSubject(subject: string): string {
  const norm = subject.toLowerCase().trim();
  for (const [key, tag] of Object.entries(SUBJECT_TAG_MAP)) {
    if (norm.includes(key)) return tag;
  }
  return "Code"; // default fallback tag
}

function difficultyToNumber(d: string | null): number {
  if (!d) return 0.5;
  const normalized = d.toUpperCase().trim();
  if (normalized === "EASY") return 0.25;
  if (normalized === "MEDIUM") return 0.5;
  if (normalized === "HARD") return 0.8;
  return 0.5;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function fetchQuestionsFromQuizAPI(
  subject: string,
  count: number = 10
): Promise<FetchedQuestion[]> {
  if (!API_KEY) {
    throw new Error("QUIZAPI_KEY is not configured.");
  }

  const tag = getTagForSubject(subject);
  const limit = Math.min(count, 20);

  // ── Step 1: Probe total available questions for this tag ──────────────────
  // Fetch 1 question first to discover `meta.total`, then pick a random offset
  // so every assessment session gets a fresh, unique batch of questions.
  let randomOffset = 0;
  try {
    const probeUrl = `${BASE_URL}?api_key=${API_KEY}&tags=${encodeURIComponent(tag)}&limit=1&multiple_correct_answers=false`;
    const probeRes = await fetch(probeUrl, { cache: "no-store" });
    if (probeRes.ok) {
      const probeData = await probeRes.json();
      const total: number = probeData?.meta?.total ?? 0;
      if (total > limit) {
        // Pick a random start page so we never repeat the same opening batch
        const maxOffset = Math.max(0, total - limit);
        randomOffset = Math.floor(Math.random() * maxOffset);
      }
    }
  } catch {
    // If the probe fails, just start from offset 0 — not worth crashing over
  }

  // ── Step 2: Fetch the actual questions at the random offset ───────────────
  const url = `${BASE_URL}?api_key=${API_KEY}&tags=${encodeURIComponent(tag)}&limit=${limit}&offset=${randomOffset}&multiple_correct_answers=false`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`QuizAPI request failed: ${body}`);
  }

  const result = await res.json();
  const raw: any[] = result.data ?? [];


  const questions: FetchedQuestion[] = [];

  for (const item of raw) {
    const rawAnswers = item.answers ?? [];
    const options: string[] = [];
    let correctAnswer = "";

    for (const ans of rawAnswers) {
      if (ans && ans.text && typeof ans.text === "string" && ans.text.trim()) {
        const textVal = ans.text.trim();
        options.push(textVal);
        if (ans.isCorrect === true || ans.isCorrect === "true") {
          correctAnswer = textVal;
        }
      }
    }

    // Skip if we couldn't extract a valid correct answer or options
    if (!correctAnswer || options.length < 2) continue;

    // Derive a concept name from the question's tags or category
    const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
    const conceptName = tags[0] ?? item.category ?? subject;
    const conceptId = slugify(conceptName);

    questions.push({
      conceptId,
      conceptName,
      type: "MULTIPLE_CHOICE",
      difficulty: difficultyToNumber(item.difficulty),
      prompt: item.text?.trim() ?? "",
      options,
      correctAnswer,
      explanation: item.explanation?.trim() || `The correct answer is: ${correctAnswer}`,
    });
  }

  return questions;
}
