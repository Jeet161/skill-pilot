import "server-only";
import { z } from "zod";
import { callFeatherless, extractJson, AIProviderError, AITimeoutError } from "./featherless";
import { callGroq, supportsGroqTier, GroqProviderError, GroqTimeoutError } from "./groq";
import type { ModelTier } from "@/types/ai";

/**
 * router.ts centralizes:
 *  - which tier/model handles which kind of task (cost control)
 *  - retry-then-fallback behavior when a model returns invalid JSON
 *  - Zod validation of every AI response before it touches the rest
 *    of the app
 *
 * Tiers used across SkillPilot:
 *   classifier      -> Qwen3.5-9B   cheap CORRECT/INCORRECT-style labels
 *   question        -> Qwen3.6-27B  dynamic question generation
 *   reasoning       -> Qwen3.6-35B  diagnosis, blueprint, interventions, reports
 *   deepReasoning   -> DeepSeek-V4  only for ambiguous / low-confidence cases
 *   vision          -> Gemma-4-31B  reserved for future image-based questions
 */

export interface StructuredCallArgs<T> {
  tier: ModelTier;
  system: string;
  user: string;
  schema: z.ZodType<T, z.ZodTypeDef, any>;
  temperature?: number;
  maxTokens?: number;
  /** If the primary tier's output fails validation twice, retry once on this tier. */
  fallbackTier?: ModelTier;
}

export interface StructuredCallResult<T> {
  data: T;
  modelUsed: string;
  attempts: number;
}

const MAX_ATTEMPTS_PER_TIER = 2;

/**
 * Route a single attempt to the appropriate provider.
 * - question + classifier → Groq (fast, no thinking-mode issues)
 * - reasoning + deepReasoning + vision → Featherless
 */
async function callProvider(
  tier: ModelTier,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  temperature: number | undefined,
  maxTokens: number | undefined,
  jsonMode: boolean
): Promise<{ raw: string; modelUsed: string }> {
  if (supportsGroqTier(tier)) {
    return callGroq({ tier, messages, temperature, maxTokens, jsonMode });
  }
  return callFeatherless({ tier, messages, temperature, maxTokens, jsonMode });
}

export async function structuredAICall<T>(
  args: StructuredCallArgs<T>
): Promise<StructuredCallResult<T>> {
  // Use the primary tier. If a fallback tier is defined, only use it if it's supported by Groq,
  // preventing accidental fallbacks to Featherless when Groq is our active provider.
  const tiersToTry: ModelTier[] = [args.tier];
  if (args.fallbackTier && supportsGroqTier(args.fallbackTier)) {
    tiersToTry.push(args.fallbackTier);
  }

  let lastError: unknown = null;
  let attempts = 0;

  for (const tier of tiersToTry) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_TIER; attempt++) {
      attempts++;
      try {
        const result = await callProvider(
          tier,
          [
            { role: "system", content: args.system },
            {
              role: "user",
              content:
                attempt === 1
                  ? `${args.user}\n\nIMPORTANT: You must respond only with a valid JSON object. No explanation, no Markdown formatting.`
                  : `${args.user}\n\nIMPORTANT: Your previous response was not valid JSON. You must respond ONLY with a valid JSON object matching the required schema. Do not write explanations or markdown fences.`,
            },
          ],
          args.temperature,
          args.maxTokens,
          false // disable json_object mode to bypass flaky provider validation
        );

        const parsedJson = extractJson(result.raw);
        const validated = args.schema.safeParse(parsedJson);

        if (validated.success) {
          return { data: validated.data, modelUsed: result.modelUsed, attempts };
        }
        lastError = validated.error;
      } catch (err) {
        lastError = err;
        if (
          err instanceof AITimeoutError ||
          err instanceof GroqTimeoutError
        ) {
          // don't burn more attempts on this tier if it's timing out
          break;
        }
      }
    }
  }

  throw new AICallFailedError(
    `AI call failed after ${attempts} attempt(s) across ${tiersToTry.join(", ")}`,
    lastError
  );
}

export class AICallFailedError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export function isRecoverableAIError(err: unknown): boolean {
  return (
    err instanceof AICallFailedError ||
    err instanceof AIProviderError ||
    err instanceof AITimeoutError ||
    err instanceof GroqProviderError ||
    err instanceof GroqTimeoutError
  );
}
