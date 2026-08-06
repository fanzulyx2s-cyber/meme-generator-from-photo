import { CaptionProviderError } from "../caption-provider";
import { defaultAiCaptionModel } from "../config";
import { getSafeErrorName, getSafeGoogleStatus, getSafeSdkCode, getSafeUpstreamStatus, isTimeoutError } from "../diagnostics";
import { buildMemeCaptionPrompt } from "../prompt";
import { geminiCaptionResponseJsonSchema, parseGenerateCaptionsRequest, parseGenerateCaptionsResult } from "../schema";
import type { CaptionProvider } from "../caption-provider";
import type { AiCaptionDiagnostics } from "../diagnostics";
import type { GenerateCaptionsInput, GenerateCaptionsResult } from "../types";
import type { CaptionUsageMetadata } from "../types";

type GeminiFetch = (input: string, init?: RequestInit) => Promise<Response>;

type GeminiCaptionProviderOptions = {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  fetch?: GeminiFetch;
  diagnostics?: AiCaptionDiagnostics;
};

function statusFromError(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

function safeProviderError(error: unknown): CaptionProviderError {
  const status = statusFromError(error);
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("timeout") || message.includes("abort")) {
    return new CaptionProviderError({ code: "PROVIDER_TIMEOUT", message: "The AI caption service timed out. Please try again.", retryable: true, fallbackEligible: true, cause: error });
  }
  if (status === 401 || status === 403) {
    return new CaptionProviderError({ code: "MISSING_CONFIGURATION", message: "The AI caption service is not available.", cause: error });
  }
  if (status === 429) {
    return new CaptionProviderError({ code: "PROVIDER_RATE_LIMITED", message: "The AI caption service is busy. Please try again.", retryable: true, cause: error });
  }
  if (message.includes("safety") || message.includes("blocked")) {
    return new CaptionProviderError({ code: "CONTENT_NOT_ALLOWED", message: "This image cannot be used for AI captions.", cause: error });
  }
  return new CaptionProviderError({
    code: "AI_GENERATION_FAILED",
    message: "The AI caption service could not complete the request.",
    retryable: Boolean(status && status >= 500),
    fallbackEligible: status === undefined || status === 502 || status === 503 || status === 504,
    cause: error,
  });
}

function extractCandidateText(response: unknown): string | undefined {
  if (typeof response !== "object" || response === null || !("candidates" in response)) return undefined;
  const candidates = (response as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return undefined;
  const firstCandidate = candidates[0];
  if (typeof firstCandidate !== "object" || firstCandidate === null || !("content" in firstCandidate)) return undefined;
  const content = (firstCandidate as { content?: unknown }).content;
  if (typeof content !== "object" || content === null || !("parts" in content)) return undefined;
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return undefined;
  const text = parts.flatMap((part) =>
    typeof part === "object" && part !== null && typeof (part as { text?: unknown }).text === "string"
      ? [(part as { text: string }).text]
      : [],
  ).join("");
  return text.trim() ? text : undefined;
}

function extractUsageMetadata(response: unknown): CaptionUsageMetadata | undefined {
  if (typeof response !== "object" || response === null || !("usageMetadata" in response)) return undefined;
  const usage = (response as { usageMetadata?: unknown }).usageMetadata;
  if (typeof usage !== "object" || usage === null) return undefined;
  const value = (field: keyof CaptionUsageMetadata) => {
    const candidate = (usage as Record<string, unknown>)[field];
    return typeof candidate === "number" && Number.isSafeInteger(candidate) && candidate >= 0 ? candidate : 0;
  };
  return { promptTokenCount: value("promptTokenCount"), candidatesTokenCount: value("candidatesTokenCount"), thoughtsTokenCount: value("thoughtsTokenCount"), totalTokenCount: value("totalTokenCount") };
}

export class GeminiCaptionProvider implements CaptionProvider {
  readonly name = "gemini" as const;
  private readonly apiKey: string;
  private readonly fetch: GeminiFetch;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly diagnostics?: AiCaptionDiagnostics;

  constructor({ apiKey, model = "gemini-2.5-flash", timeoutMs = 15_000, fetch = globalThis.fetch, diagnostics }: GeminiCaptionProviderOptions) {
    this.apiKey = apiKey;
    this.fetch = fetch;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.diagnostics = diagnostics;
  }

  async generateCaptions(input: GenerateCaptionsInput): Promise<GenerateCaptionsResult> {
    const request = parseGenerateCaptionsRequest(input);
    const apiStyle = "GENERATE_CONTENT_REST";
    this.diagnostics?.emit("AI_CAPTION_PROVIDER_START", {
      stage: "REQUEST_BUILD",
      modelMatch: this.model === defaultAiCaptionModel,
      apiStyle,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error("timeout")), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: buildMemeCaptionPrompt(request.style) }, { inlineData: { mimeType: request.mimeType, data: request.imageBase64 } }] }],
            systemInstruction: { parts: [{ text: "Generate safe, concise meme caption pairs that follow the user instructions." }] },
            generationConfig: { responseMimeType: "application/json", responseJsonSchema: geminiCaptionResponseJsonSchema },
            store: false,
          }),
        },
      );
      if (!response.ok) throw { status: response.status };
    } catch (error) {
      this.diagnostics?.emit("AI_CAPTION_UPSTREAM_ERROR", {
        stage: isTimeoutError(error) ? "TIMEOUT" : "GOOGLE_API_CALL",
        upstreamStatus: getSafeUpstreamStatus(error),
        errorName: getSafeErrorName(error),
        sdkCode: getSafeSdkCode(error),
        googleStatus: getSafeGoogleStatus(error),
        modelMatch: this.model === defaultAiCaptionModel,
        apiStyle,
      });
      throw safeProviderError(error);
    } finally {
      clearTimeout(timeout);
    }

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = undefined;
    }
    const outputText = extractCandidateText(responseBody);
    if (!outputText) {
      this.diagnostics?.emit("AI_CAPTION_RESPONSE_EXTRACTION_ERROR", { stage: "RESPONSE_EXTRACTION", modelMatch: this.model === defaultAiCaptionModel, apiStyle });
      throw new CaptionProviderError({ code: "INVALID_PROVIDER_RESPONSE", message: "The AI caption service returned an invalid response.", retryable: true, fallbackEligible: true });
    }

    try {
      return { ...parseGenerateCaptionsResult(JSON.parse(outputText)), usageMetadata: extractUsageMetadata(responseBody) };
    } catch (error) {
      this.diagnostics?.emit("AI_CAPTION_ZOD_ERROR", { stage: "ZOD_VALIDATION", errorName: getSafeErrorName(error), modelMatch: this.model === defaultAiCaptionModel, apiStyle });
      throw new CaptionProviderError({ code: "INVALID_PROVIDER_RESPONSE", message: "The AI caption service returned an invalid response.", retryable: true, fallbackEligible: true, cause: error });
    }
  }
}
