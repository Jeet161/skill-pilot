// Shared AI-facing types. These describe the SHAPE of what the AI must
// return — the actual concepts/questions/content are never hardcoded here.

export type ModelTier = "classifier" | "question" | "reasoning" | "deepReasoning" | "vision";

export interface FeatherlessMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface FeatherlessCallOptions {
  tier: ModelTier;
  messages: FeatherlessMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface FeatherlessCallResult {
  raw: string;
  modelUsed: string;
  tier: ModelTier;
}
