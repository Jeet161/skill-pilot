import "server-only";
import type { FeatherlessCallOptions, FeatherlessCallResult, ModelTier } from "@/types/ai";

/**
 * The ONLY module in SkillPilot allowed to talk to the Featherless API.
 * Every AI-driven feature (blueprint planning, question generation,
 * evaluation, diagnosis, reporting) routes through `callFeatherless`.
 *
 * The frontend never imports this file — it is `server-only` and every
 * consumer lives under lib/ai or app/api.
 */

const BASE_URL = process.env.FEATHERLESS_BASE_URL ?? "https://api.featherless.ai/v1";
const API_KEY = process.env.FEATHERLESS_API_KEY;

function modelForTier(tier: ModelTier): string {
  switch (tier) {
    case "classifier":
      return required("FEATHERLESS_CLASSIFIER_MODEL");
    case "question":
      return required("FEATHERLESS_QUESTION_MODEL");
    case "reasoning":
      return required("FEATHERLESS_REASONING_MODEL");
    case "deepReasoning":
      return required("FEATHERLESS_DEEP_REASONING_MODEL");
    case "vision":
      return required("FEATHERLESS_VISION_MODEL");
  }
}

function required(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new AIConfigError(`Missing required environment variable: ${name}`);
  }
  return val;
}

export class AIConfigError extends Error {}
export class AITimeoutError extends Error {}
export class AIProviderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_MS = 240_000;

/**
 * Low-level call into Featherless's OpenAI-compatible chat completions
 * endpoint. Callers are responsible for prompt construction and for
 * validating/parsing the returned text (see lib/validation).
 */
export async function callFeatherless(
  options: FeatherlessCallOptions
): Promise<FeatherlessCallResult> {
  if (!API_KEY) {
    throw new AIConfigError("FEATHERLESS_API_KEY is not configured on the server.");
  }

  const model = modelForTier(options.tier);
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
        // Disable Qwen3 chain-of-thought thinking mode — without this,
        // Qwen3 models put ALL output into `reasoning_content` and return
        // empty `content`, which causes every call to fail with "no content".
        enable_thinking: false,
        ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await safeText(res);
      throw new AIProviderError(`Featherless request failed: ${body}`, res.status);
    }

    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    // Some Qwen3 deployments still route output to `reasoning_content` even
    // when thinking mode is disabled. Fall back to it if `content` is empty.
    const content: string | undefined =
      (msg?.content as string | undefined)?.trim() ||
      (msg?.reasoning_content as string | undefined)?.trim();

    if (!content) {
      throw new AIProviderError(
        `Featherless response contained no content. finish_reason=${
          data?.choices?.[0]?.finish_reason ?? "unknown"
        }`
      );
    }

    return { raw: content, modelUsed: model, tier: options.tier };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new AITimeoutError(`Featherless call timed out after ${DEFAULT_TIMEOUT_MS}ms`);
    }
    if (err instanceof AIConfigError || err instanceof AIProviderError) throw err;
    throw new AIProviderError(err?.message ?? "Unknown Featherless error");
  } finally {
    clearTimeout(timeout);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "<unreadable response body>";
  }
}

/**
 * Extracts the first valid JSON object/array from a model response,
 * tolerating markdown code fences or minor leading/trailing text.
 */
export function extractJson(raw: string): unknown {
  let text = raw.trim();

  // Qwen3 models emit <think>...</think> reasoning blocks before the JSON.
  // Strip them out before attempting to parse.
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  try {
    return JSON.parse(text);
  } catch {
    // fall back to locating the first {...} or [...] block
    const start = text.search(/[{[]/);
    const lastCurly = text.lastIndexOf("}");
    const lastBracket = text.lastIndexOf("]");
    const end = Math.max(lastCurly, lastBracket);
    if (start === -1 || end === -1 || end < start) {
      throw new Error("No JSON object found in AI response.");
    }
    return JSON.parse(text.slice(start, end + 1));
  }
}
