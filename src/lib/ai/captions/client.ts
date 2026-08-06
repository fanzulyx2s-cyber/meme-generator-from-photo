import { aiCaptionErrorCodes } from "./types";
import { generateCaptionsRequestSchema, generateCaptionsResultSchema } from "./schema";
import type { AiCaptionErrorCode, CaptionStyle, ImageMimeType, MemeCaption } from "./types";

type ClientErrorCode = AiCaptionErrorCode | "REQUEST_ABORTED";
type Fetcher = typeof fetch;

export const aiCaptionClientTimeoutMs = 35_000;

const messageByCode: Record<ClientErrorCode, string> = {
  AI_DISABLED: "AI captions are not available right now.",
  MISSING_CONFIGURATION: "AI captions are temporarily unavailable.",
  INVALID_IMAGE: "We couldn't prepare this image for AI captions.",
  IMAGE_TOO_LARGE: "This image is too large to analyze. Try a smaller photo.",
  UNSUPPORTED_IMAGE_TYPE: "AI captions support JPG, PNG, and WEBP images.",
  INVALID_STYLE: "Choose a valid caption style.",
  CONTENT_NOT_ALLOWED: "We couldn't generate captions for this photo.",
  PROVIDER_TIMEOUT: "Caption generation took too long. Please try again.",
  PROVIDER_RATE_LIMITED: "Too many caption requests. Please try again shortly.",
  INVALID_PROVIDER_RESPONSE: "We couldn't generate valid captions. Please try again.",
  AI_GENERATION_FAILED: "We couldn't generate captions. Please try again.",
  UNSUPPORTED_PROVIDER: "AI captions are temporarily unavailable.",
  REQUEST_ABORTED: "Caption generation was cancelled.",
};

export class AiCaptionClientError extends Error {
  readonly code: ClientErrorCode;
  readonly retryable: boolean;

  constructor(code: ClientErrorCode) {
    super(messageByCode[code]);
    this.name = "AiCaptionClientError";
    this.code = code;
    this.retryable = ["PROVIDER_TIMEOUT", "PROVIDER_RATE_LIMITED", "INVALID_PROVIDER_RESPONSE", "AI_GENERATION_FAILED"].includes(code);
  }
}

function getErrorCode(payload: unknown): AiCaptionErrorCode | undefined {
  if (typeof payload !== "object" || payload === null || !("error" in payload)) return undefined;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && aiCaptionErrorCodes.includes(code as AiCaptionErrorCode)
    ? code as AiCaptionErrorCode
    : undefined;
}

export async function requestAiCaptions({
  imageBase64,
  mimeType,
  style,
  signal,
  fetcher = fetch,
  timeoutMs = aiCaptionClientTimeoutMs,
}: {
  imageBase64: string;
  mimeType: ImageMimeType;
  style: CaptionStyle;
  signal?: AbortSignal;
  fetcher?: Fetcher;
  timeoutMs?: number;
}): Promise<MemeCaption[]> {
  const request = generateCaptionsRequestSchema.safeParse({ imageBase64, mimeType, style });
  if (!request.success) throw new AiCaptionClientError("INVALID_IMAGE");

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = globalThis.setTimeout(abort, timeoutMs);
  try {
    const response = await fetcher("/api/ai-meme-captions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.data),
      signal: controller.signal,
    });
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new AiCaptionClientError("INVALID_PROVIDER_RESPONSE");
    }
    if (!response.ok) throw new AiCaptionClientError(getErrorCode(payload) ?? "AI_GENERATION_FAILED");
    const parsed = generateCaptionsResultSchema.safeParse(payload);
    if (!parsed.success) throw new AiCaptionClientError("INVALID_PROVIDER_RESPONSE");
    return parsed.data.captions;
  } catch (error) {
    if (error instanceof AiCaptionClientError) throw error;
    if (controller.signal.aborted) throw new AiCaptionClientError("REQUEST_ABORTED");
    throw new AiCaptionClientError("AI_GENERATION_FAILED");
  } finally {
    globalThis.clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
