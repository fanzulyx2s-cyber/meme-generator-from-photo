import { CaptionProviderError } from "./caption-provider";
import { defaultAiCaptionRequestTimeoutMs, defaultAiCaptionTimeoutMs, emergencyAiCaptionModel, fallbackAiCaptionModel, readAiCaptionConfig } from "./config";
import { createCaptionProvider } from "./create-caption-provider";
import { MAX_IMAGE_BYTES, generateCaptionsRequestSchema } from "./schema";
import { validateServerImage } from "./server-image";
import type { AiCaptionDiagnostics } from "./diagnostics";
import type { CaptionProvider } from "./caption-provider";
import type { AiCaptionEnvironment } from "./config";
import type { CreateCaptionProviderOptions } from "./create-caption-provider";
import type { AiCaptionErrorCode, GenerateCaptionsResult } from "./types";
import { getSafeUpstreamStatus } from "./diagnostics";

type ErrorResult = { ok: false; status: number; error: { code: AiCaptionErrorCode; message: string } };
type SuccessResult = { ok: true; captions: GenerateCaptionsResult["captions"]; usageMetadata?: GenerateCaptionsResult["usageMetadata"]; fallbackUsed: boolean };
export type AiCaptionHandlerResult = SuccessResult | ErrorResult;
type ProviderFactory = (options: CreateCaptionProviderOptions) => CaptionProvider;

const statusByCode: Record<AiCaptionErrorCode, number> = {
  AI_DISABLED: 404, MISSING_CONFIGURATION: 503, INVALID_IMAGE: 400, INVALID_CONTENT_TYPE: 415, REQUEST_TOO_LARGE: 413, IMAGE_TOO_LARGE: 413, UNSUPPORTED_IMAGE_TYPE: 415,
  INVALID_STYLE: 400, CONTENT_NOT_ALLOWED: 422, PROVIDER_TIMEOUT: 504, PROVIDER_RATE_LIMITED: 429,
  INVALID_PROVIDER_RESPONSE: 502, AI_GENERATION_FAILED: 502, UNSUPPORTED_PROVIDER: 503,
};

function failure(code: AiCaptionErrorCode, message: string): ErrorResult {
  return { ok: false, status: statusByCode[code], error: { code, message } };
}

async function decodeImage(base64: string, mimeType: Parameters<typeof validateServerImage>[1]): Promise<CaptionProviderError | undefined> {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) {
    return new CaptionProviderError({ code: "INVALID_IMAGE", message: "The image data is invalid." });
  }
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length || Buffer.from(bytes).toString("base64") !== base64) {
    return new CaptionProviderError({ code: "INVALID_IMAGE", message: "The image data is invalid." });
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return new CaptionProviderError({ code: "IMAGE_TOO_LARGE", message: "The image is too large." });
  }
  try {
    await validateServerImage(bytes, mimeType);
  } catch (error) {
    return error instanceof CaptionProviderError ? error : new CaptionProviderError({ code: "INVALID_IMAGE", message: "The image data is invalid." });
  }
  return undefined;
}

function inputFailure(body: unknown): ErrorResult {
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    if (record.mimeType && !["image/jpeg", "image/png", "image/webp"].includes(String(record.mimeType))) return failure("UNSUPPORTED_IMAGE_TYPE", "The image type is not supported.");
    if (record.style && !["funny", "sarcastic", "wholesome", "reaction", "workplace"].includes(String(record.style))) return failure("INVALID_STYLE", "The caption style is invalid.");
  }
  return failure("INVALID_IMAGE", "The image request is invalid.");
}

function shouldRetryPrimary(error: unknown): error is CaptionProviderError {
  if (!(error instanceof CaptionProviderError) || !error.retryable || error.code !== "AI_GENERATION_FAILED") return false;
  const status = getSafeUpstreamStatus(error.cause);
  return status === undefined || status === 500 || status === 502 || status === 503;
}

async function waitForRetry(delayMs: number, signal: AbortSignal): Promise<void> {
  if (delayMs <= 0 || signal.aborted) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(done, delayMs);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
    signal.addEventListener("abort", done, { once: true });
  });
}

function providerFailure(error: unknown): ErrorResult {
  return error instanceof CaptionProviderError
    ? failure(error.code, error.message)
    : failure("AI_GENERATION_FAILED", "The AI caption service could not complete the request.");
}

export async function handleAiCaptionRequest({ requestBody, env, providerFactory = createCaptionProvider, diagnostics, requestSignal, retryDelayMs = 350 }: { requestBody: unknown; env?: AiCaptionEnvironment; providerFactory?: ProviderFactory; diagnostics?: AiCaptionDiagnostics; requestSignal?: AbortSignal; retryDelayMs?: number }): Promise<AiCaptionHandlerResult> {
  const config = readAiCaptionConfig(env);
  if (!config.enabled) {
    diagnostics?.emit("AI_CAPTION_ROUTE_ERROR", { stage: "CONFIG", localStatus: 404 });
    return failure("AI_DISABLED", "AI captions are not available.");
  }
  const parsed = generateCaptionsRequestSchema.safeParse(requestBody);
  if (!parsed.success) {
    diagnostics?.emit("AI_CAPTION_ROUTE_ERROR", { stage: "IMAGE_VALIDATION", localStatus: 400 });
    return inputFailure(requestBody);
  }
  const imageError = await decodeImage(parsed.data.imageBase64, parsed.data.mimeType);
  if (imageError) {
    diagnostics?.emit("AI_CAPTION_ROUTE_ERROR", { stage: "IMAGE_VALIDATION", localStatus: statusByCode[imageError.code] });
    return failure(imageError.code, imageError.message);
  }
  const requestController = new AbortController();
  let requestTimedOut = false;
  const startedAt = Date.now();
  const deadline = startedAt + defaultAiCaptionRequestTimeoutMs;
  const abortFromRequest = () => requestController.abort(requestSignal?.reason);
  if (requestSignal?.aborted) abortFromRequest();
  else requestSignal?.addEventListener("abort", abortFromRequest, { once: true });
  const requestTimeout = setTimeout(() => {
    requestTimedOut = true;
    requestController.abort(new Error("timeout"));
  }, defaultAiCaptionRequestTimeoutMs);
  const generate = async ({ providerName = config.provider, apiKey = config.apiKey, model }: { providerName?: string; apiKey?: string; model: string }) => {
    const remainingMs = Math.max(1, deadline - Date.now());
    const timeoutMs = Math.max(1, Math.min(config.timeoutMs, defaultAiCaptionTimeoutMs, remainingMs));
    const provider = providerFactory({ providerName, apiKey, model, timeoutMs, diagnostics });
    return provider.generateCaptions(parsed.data, { signal: requestController.signal });
  };
  try {
    let primaryError: unknown;
    try {
      const result = await generate({ model: config.model });
      return { ok: true, captions: result.captions, usageMetadata: result.usageMetadata, fallbackUsed: false };
    } catch (error) {
      primaryError = error;
    }

    if (shouldRetryPrimary(primaryError) && !requestController.signal.aborted) {
      diagnostics?.emit("AI_CAPTION_RETRY", {
        stage: "GOOGLE_API_CALL",
        modelRole: "primary",
        attempt: 2,
        retryUsed: true,
        upstreamStatus: getSafeUpstreamStatus(primaryError.cause),
      });
      await waitForRetry(retryDelayMs, requestController.signal);
      if (!requestController.signal.aborted) {
        try {
          const result = await generate({ model: config.model });
          return { ok: true, captions: result.captions, usageMetadata: result.usageMetadata, fallbackUsed: false };
        } catch (error) {
          primaryError = error;
        }
      }
    }

    if (requestTimedOut) return failure("PROVIDER_TIMEOUT", "The AI caption service timed out. Please try again.");
    if (requestSignal?.aborted) return providerFailure(primaryError);
    if (primaryError instanceof CaptionProviderError && primaryError.fallbackEligible && config.provider === "gemini" && config.model !== fallbackAiCaptionModel) {
      diagnostics?.emit("AI_CAPTION_FALLBACK", { stage: "GOOGLE_API_CALL", fallbackUsed: true });
      try {
        const result = await generate({ model: fallbackAiCaptionModel });
        return { ok: true, captions: result.captions, usageMetadata: result.usageMetadata, fallbackUsed: true };
      } catch (fallbackError) {
        if (!requestController.signal.aborted && config.mistralApiKey) {
          diagnostics?.emit("AI_CAPTION_FALLBACK", {
            stage: "MISTRAL_API_CALL",
            provider: "mistral",
            model: emergencyAiCaptionModel,
            modelRole: "emergency",
            fallbackUsed: true,
          });
          try {
            const result = await generate({ providerName: "mistral", apiKey: config.mistralApiKey, model: emergencyAiCaptionModel });
            return { ok: true, captions: result.captions, usageMetadata: result.usageMetadata, fallbackUsed: true };
          } catch (mistralError) {
            return providerFailure(mistralError);
          }
        }
        return providerFailure(fallbackError);
      }
    }
    return providerFailure(primaryError);
  } finally {
    clearTimeout(requestTimeout);
    requestSignal?.removeEventListener("abort", abortFromRequest);
  }
}
