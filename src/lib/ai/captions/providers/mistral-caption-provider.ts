import { CaptionProviderError } from "../caption-provider";
import { emergencyAiCaptionModel } from "../config";
import { getSafeErrorName, getSafeSdkCode, getSafeUpstreamStatus } from "../diagnostics";
import { buildMemeCaptionPrompt } from "../prompt";
import { geminiCaptionResponseJsonSchema, parseGenerateCaptionsRequest, parseGenerateCaptionsResult } from "../schema";
import type { CaptionProvider, GenerateCaptionsOptions } from "../caption-provider";
import type { AiCaptionDiagnostics } from "../diagnostics";
import type { GenerateCaptionsInput, GenerateCaptionsResult } from "../types";

type MistralFetch = (input: string, init?: RequestInit) => Promise<Response>;

export type MistralCaptionProviderOptions = {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  fetch?: MistralFetch;
  diagnostics?: AiCaptionDiagnostics;
};

function statusFromError(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function safeMistralError(error: unknown, timedOut: boolean, externallyAborted: boolean): CaptionProviderError {
  if (externallyAborted) {
    return new CaptionProviderError({ code: "AI_GENERATION_FAILED", message: "The AI caption request was cancelled.", cause: error });
  }
  const status = statusFromError(error);
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (timedOut || message.includes("timeout") || message.includes("abort")) {
    return new CaptionProviderError({ code: "PROVIDER_TIMEOUT", message: "The backup AI caption service timed out. Please try again.", retryable: true, cause: error });
  }
  if (status === 401 || status === 403) {
    return new CaptionProviderError({ code: "MISSING_CONFIGURATION", message: "The backup AI caption service is not available.", cause: error });
  }
  if (status === 429) {
    return new CaptionProviderError({ code: "PROVIDER_RATE_LIMITED", message: "The backup AI caption service is busy. Please try again.", retryable: true, cause: error });
  }
  return new CaptionProviderError({
    code: "AI_GENERATION_FAILED",
    message: "The backup AI caption service could not complete the request.",
    retryable: status === undefined || status >= 500,
    cause: error,
  });
}

function extractContent(response: unknown): string | undefined {
  if (typeof response !== "object" || response === null || !("choices" in response)) return undefined;
  const choices = (response as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return undefined;
  const message = typeof choices[0] === "object" && choices[0] !== null
    ? (choices[0] as { message?: unknown }).message
    : undefined;
  if (typeof message !== "object" || message === null) return undefined;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" && content.trim() ? content : undefined;
}

async function readJsonWithSignal(response: Response, signal: AbortSignal): Promise<unknown> {
  if (signal.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
  return new Promise((resolve, reject) => {
    const abort = () => {
      void response.body?.cancel().catch(() => undefined);
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    response.json().then(resolve, (error) => {
      if (signal.aborted) reject(signal.reason ?? error);
      else resolve(undefined);
    }).finally(() => signal.removeEventListener("abort", abort));
  });
}

export class MistralCaptionProvider implements CaptionProvider {
  readonly name = "mistral" as const;
  private readonly apiKey: string;
  private readonly fetch: MistralFetch;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly diagnostics?: AiCaptionDiagnostics;

  constructor({ apiKey, model = emergencyAiCaptionModel, timeoutMs = 15_000, fetch = globalThis.fetch, diagnostics }: MistralCaptionProviderOptions) {
    this.apiKey = apiKey;
    this.fetch = fetch;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.diagnostics = diagnostics;
  }

  async generateCaptions(input: GenerateCaptionsInput, options: GenerateCaptionsOptions = {}): Promise<GenerateCaptionsResult> {
    const request = parseGenerateCaptionsRequest(input);
    const apiStyle = "MISTRAL_CHAT_REST" as const;
    const startedAt = Date.now();
    this.diagnostics?.emit("AI_CAPTION_PROVIDER_START", {
      stage: "REQUEST_BUILD",
      provider: "mistral",
      model: this.model,
      modelRole: "emergency",
      apiStyle,
    });

    const controller = new AbortController();
    let externallyAborted = options.signal?.aborted ?? false;
    let timedOut = false;
    const abortFromCaller = () => {
      externallyAborted = true;
      controller.abort(options.signal?.reason);
    };
    if (externallyAborted) abortFromCaller();
    else options.signal?.addEventListener("abort", abortFromCaller, { once: true });
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error("timeout"));
    }, this.timeoutMs);

    let responseBody: unknown;
    try {
      const response = await this.fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: buildMemeCaptionPrompt(request.style) },
              { type: "image_url", image_url: `data:${request.mimeType};base64,${request.imageBase64}` },
            ],
          }],
          response_format: {
            type: "json_schema",
            json_schema: { name: "meme_captions", schema: geminiCaptionResponseJsonSchema, strict: true },
          },
          stream: false,
        }),
      });
      if (!response.ok) throw { status: response.status };
      responseBody = await readJsonWithSignal(response, controller.signal);
    } catch (error) {
      const providerError = safeMistralError(error, timedOut, externallyAborted);
      this.diagnostics?.emit("AI_CAPTION_UPSTREAM_ERROR", {
        stage: providerError.code === "PROVIDER_TIMEOUT" ? "TIMEOUT" : "MISTRAL_API_CALL",
        provider: "mistral",
        model: this.model,
        modelRole: "emergency",
        upstreamStatus: getSafeUpstreamStatus(error),
        errorName: getSafeErrorName(error),
        sdkCode: getSafeSdkCode(error),
        errorType: providerError.code,
        attemptElapsedMs: Math.max(0, Date.now() - startedAt),
        outcome: "failure",
        apiStyle,
      });
      throw providerError;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abortFromCaller);
    }

    const content = extractContent(responseBody);
    if (!content) {
      this.diagnostics?.emit("AI_CAPTION_RESPONSE_EXTRACTION_ERROR", {
        stage: "RESPONSE_EXTRACTION",
        provider: "mistral",
        model: this.model,
        modelRole: "emergency",
        errorType: "INVALID_PROVIDER_RESPONSE",
        attemptElapsedMs: Math.max(0, Date.now() - startedAt),
        outcome: "failure",
        apiStyle,
      });
      throw new CaptionProviderError({ code: "INVALID_PROVIDER_RESPONSE", message: "The backup AI caption service returned an invalid response." });
    }

    try {
      const result = parseGenerateCaptionsResult(JSON.parse(content));
      this.diagnostics?.emit("AI_CAPTION_PROVIDER_SUCCESS", {
        stage: "ZOD_VALIDATION",
        provider: "mistral",
        model: this.model,
        modelRole: "emergency",
        attemptElapsedMs: Math.max(0, Date.now() - startedAt),
        outcome: "success",
        apiStyle,
      });
      return result;
    } catch (error) {
      this.diagnostics?.emit("AI_CAPTION_ZOD_ERROR", {
        stage: "ZOD_VALIDATION",
        provider: "mistral",
        model: this.model,
        modelRole: "emergency",
        errorName: getSafeErrorName(error),
        errorType: "INVALID_PROVIDER_RESPONSE",
        attemptElapsedMs: Math.max(0, Date.now() - startedAt),
        outcome: "failure",
        apiStyle,
      });
      throw new CaptionProviderError({ code: "INVALID_PROVIDER_RESPONSE", message: "The backup AI caption service returned an invalid response.", cause: error });
    }
  }
}
