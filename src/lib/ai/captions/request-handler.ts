import { CaptionProviderError } from "./caption-provider";
import { fallbackAiCaptionModel, readAiCaptionConfig } from "./config";
import { createCaptionProvider } from "./create-caption-provider";
import { MAX_IMAGE_BYTES, generateCaptionsRequestSchema } from "./schema";
import type { AiCaptionDiagnostics } from "./diagnostics";
import type { CaptionProvider } from "./caption-provider";
import type { AiCaptionEnvironment } from "./config";
import type { CreateCaptionProviderOptions } from "./create-caption-provider";
import type { AiCaptionErrorCode, GenerateCaptionsResult } from "./types";

type ErrorResult = { ok: false; status: number; error: { code: AiCaptionErrorCode; message: string } };
type SuccessResult = { ok: true; captions: GenerateCaptionsResult["captions"]; usageMetadata?: GenerateCaptionsResult["usageMetadata"]; fallbackUsed: boolean };
export type AiCaptionHandlerResult = SuccessResult | ErrorResult;
type ProviderFactory = (options: CreateCaptionProviderOptions) => CaptionProvider;

const statusByCode: Record<AiCaptionErrorCode, number> = {
  AI_DISABLED: 404, MISSING_CONFIGURATION: 503, INVALID_IMAGE: 400, IMAGE_TOO_LARGE: 413, UNSUPPORTED_IMAGE_TYPE: 415,
  INVALID_STYLE: 400, CONTENT_NOT_ALLOWED: 422, PROVIDER_TIMEOUT: 504, PROVIDER_RATE_LIMITED: 429,
  INVALID_PROVIDER_RESPONSE: 502, AI_GENERATION_FAILED: 502, UNSUPPORTED_PROVIDER: 503,
};

function failure(code: AiCaptionErrorCode, message: string): ErrorResult {
  return { ok: false, status: statusByCode[code], error: { code, message } };
}

function decodeImage(base64: string): CaptionProviderError | undefined {
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

export async function handleAiCaptionRequest({ requestBody, env, providerFactory = createCaptionProvider, diagnostics, requestSignal }: { requestBody: unknown; env?: AiCaptionEnvironment; providerFactory?: ProviderFactory; diagnostics?: AiCaptionDiagnostics; requestSignal?: AbortSignal }): Promise<AiCaptionHandlerResult> {
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
  const imageError = decodeImage(parsed.data.imageBase64);
  if (imageError) {
    diagnostics?.emit("AI_CAPTION_ROUTE_ERROR", { stage: "IMAGE_VALIDATION", localStatus: statusByCode[imageError.code] });
    return failure(imageError.code, imageError.message);
  }
  const generate = async (model: string) => {
    const provider = providerFactory({ providerName: config.provider, apiKey: config.apiKey, model, timeoutMs: config.timeoutMs, diagnostics });
    return provider.generateCaptions(parsed.data);
  };
  try {
    const result = await generate(config.model);
    return { ok: true, captions: result.captions, usageMetadata: result.usageMetadata, fallbackUsed: false };
  } catch (error) {
    if (error instanceof CaptionProviderError && error.fallbackEligible && !requestSignal?.aborted && config.provider === "gemini" && config.model !== fallbackAiCaptionModel) {
      diagnostics?.emit("AI_CAPTION_FALLBACK", { stage: "GOOGLE_API_CALL", fallbackUsed: true });
      try {
        const result = await generate(fallbackAiCaptionModel);
        return { ok: true, captions: result.captions, usageMetadata: result.usageMetadata, fallbackUsed: true };
      } catch (fallbackError) {
        if (fallbackError instanceof CaptionProviderError) return failure(fallbackError.code, fallbackError.message);
        return failure("AI_GENERATION_FAILED", "The AI caption service could not complete the request.");
      }
    }
    if (error instanceof CaptionProviderError) return failure(error.code, error.message);
    return failure("AI_GENERATION_FAILED", "The AI caption service could not complete the request.");
  }
}
