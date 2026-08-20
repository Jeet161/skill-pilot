import "server-only";
import type { ModelTier } from "@/types/ai";

/**
 * Groq provider — used for the `question` and `classifier` tiers.
 * Groq's inference is significantly faster than Featherless for these
 * latency-sensitive tasks, and the Llama 3.x models are reliable JSON
 * emitters without the Qwen3 thinking-mode issues.
 *
 * The API is fully OpenAI-compatible so the request/response shape is
 * identical to callFeatherless; only the base URL, key, and model IDs differ.
 */

const BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const API_KEY = process.env.GROQ_API_KEY;

const TIER_MODEL_MAP: Partial<Record<ModelTier, string>> = {
  question:      process.env.GROQ_QUESTION_MODEL      ?? "openai/gpt-oss-120b",
  classifier:    process.env.GROQ_CLASSIFIER_MODEL    ?? "openai/gpt-oss-20b",
  reasoning:     process.env.GROQ_REASONING_MODEL     ?? "qwen/qwen3.6-27b",
  deepReasoning: process.env.GROQ_DEEP_REASONING_MODEL ?? "openai/gpt-oss-120b",
  vision:        process.env.GROQ_VISION_MODEL        ?? "openai/gpt-oss-120b",
};

// Route question, classifier, and reasoning (blueprint) tiers through Groq
export function supportsGroqTier(tier: ModelTier): boolean {
  return tier === "question" || tier === "classifier" || tier === "reasoning";
}

export interface GroqCallOptions {
  tier: ModelTier;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface GroqCallResult {
  raw: string;
  modelUsed: string;
  tier: ModelTier;
}

export class GroqConfigError extends Error {}
export class GroqTimeoutError extends Error {}
export class GroqProviderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_RATE_LIMIT_RETRIES = 4;

/** Parse "try again in 3.14s" from Groq's 429 message body. */
function parseRetryAfterMs(body: string): number {
  const match = body.match(/try again in ([\d.]+)s/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 500; // add 500ms buffer
  return 8000; // default 8s if we can't parse
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGroq(options: GroqCallOptions): Promise<GroqCallResult> {
  if (!API_KEY) {
    throw new GroqConfigError("GROQ_API_KEY is not configured on the server.");
  }

  const model = TIER_MODEL_MAP[options.tier];
  if (!model) {
    throw new GroqConfigError(`No Groq model configured for tier: ${options.tier}`);
  }

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.4,
          max_tokens: options.maxTokens ?? 1200,
          ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        const body = await safeText(res);
        const waitMs = parseRetryAfterMs(body);
        console.log(`[Groq] Rate limited on ${model}. Waiting ${waitMs}ms before retry ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES}...`);
        await sleep(waitMs);
        continue; // retry
      }

      if (!res.ok) {
        const body = await safeText(res);
        throw new GroqProviderError(`Groq request failed: ${body}`, res.status);
      }

      const data = await res.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new GroqProviderError(
          `Groq response contained no content. finish_reason=${
            data?.choices?.[0]?.finish_reason ?? "unknown"
          }`
        );
      }

      return { raw: content, modelUsed: model, tier: options.tier };
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new GroqTimeoutError(`Groq call timed out after ${DEFAULT_TIMEOUT_MS}ms`);
      }
      if (err instanceof GroqConfigError || err instanceof GroqProviderError) throw err;
      throw new GroqProviderError(err?.message ?? "Unknown Groq error");
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new GroqProviderError(`Groq rate limit persisted after ${MAX_RATE_LIMIT_RETRIES} retries`, 429);
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "<unreadable response body>";
  }
}
