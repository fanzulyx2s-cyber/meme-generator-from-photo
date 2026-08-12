import type { CaptionProviderName } from "./types";

export const defaultAiCaptionModel = "gemini-3.5-flash-lite";
export const fallbackAiCaptionModel = "gemini-3.1-flash-lite";
export const emergencyAiCaptionModel = "ministral-8b-2512";
export const defaultAiCaptionTimeoutMs = 15_000;
export const defaultAiCaptionRequestTimeoutMs = 55_000;

function readTimeoutMs(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1_000 && parsed <= 45_000 ? parsed : defaultAiCaptionTimeoutMs;
}

export type AiCaptionEnvironment = Record<string, string | undefined>;

export type AiCaptionConfig = {
  enabled: boolean;
  provider: CaptionProviderName | string;
  model: string;
  apiKey?: string;
  hasApiKey: boolean;
  mistralApiKey?: string;
  hasMistralApiKey: boolean;
  timeoutMs: number;
};

export function readAiCaptionConfig(env: AiCaptionEnvironment = process.env): AiCaptionConfig {
  const apiKey = env.GEMINI_API_KEY?.trim() || undefined;
  const mistralApiKey = env.MISTRAL_API_KEY?.trim() || undefined;

  return {
    enabled: env.AI_CAPTIONS_ENABLED === "true",
    provider: env.AI_CAPTION_PROVIDER?.trim() || "gemini",
    // The public route has a deliberately fixed model strategy. Keeping this
    // independent from a legacy environment override prevents experimental
    // comparison models from entering production traffic.
    model: defaultAiCaptionModel,
    apiKey,
    hasApiKey: Boolean(apiKey),
    mistralApiKey,
    hasMistralApiKey: Boolean(mistralApiKey),
    timeoutMs: readTimeoutMs(env.AI_CAPTION_TIMEOUT_MS),
  };
}
