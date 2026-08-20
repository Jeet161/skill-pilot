import crypto from "crypto";

/**
 * Normalizes and hashes a question prompt so we can detect near-duplicate
 * questions server-side, independent of what the AI claims.
 */
export function fingerprintQuestion(prompt: string): string {
  const normalized = prompt
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, " ") // ignore code block contents for fuzzy match
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // simple shingling to tolerate minor rewording: hash sorted word-set
  const words = Array.from(new Set(normalized.split(" ").filter((w) => w.length > 2))).sort();
  const shingle = words.join("|");

  return crypto.createHash("sha256").update(shingle).digest("hex");
}

/**
 * Jaccard similarity between two normalized word sets — used as a softer
 * duplicate check than exact fingerprint equality.
 */
export function similarity(a: string, b: string): number {
  const setA = new Set(normalize(a));
  const setB = new Set(normalize(b));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export const DUPLICATE_SIMILARITY_THRESHOLD = 0.72;
