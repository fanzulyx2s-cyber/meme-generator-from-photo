import type {
  AiCaptionErrorCode,
  CaptionProviderName,
  GenerateCaptionsInput,
  GenerateCaptionsResult,
} from "./types";

export interface CaptionProvider {
  readonly name: CaptionProviderName;

  generateCaptions(input: GenerateCaptionsInput, options?: GenerateCaptionsOptions): Promise<GenerateCaptionsResult>;
}

export type GenerateCaptionsOptions = {
  signal?: AbortSignal;
};

export class CaptionProviderError extends Error {
  readonly code: AiCaptionErrorCode;
  readonly retryable: boolean;
  readonly fallbackEligible: boolean;
  readonly cause?: unknown;

  constructor({
    code,
    message,
    retryable = false,
    fallbackEligible = false,
    cause,
  }: {
    code: AiCaptionErrorCode;
    message: string;
    retryable?: boolean;
    fallbackEligible?: boolean;
    cause?: unknown;
  }) {
    super(message);
    this.name = "CaptionProviderError";
    this.code = code;
    this.retryable = retryable;
    this.fallbackEligible = fallbackEligible;
    if (cause !== undefined) {
      Object.defineProperty(this, "cause", {
        value: cause,
        enumerable: false,
      });
    }
  }
}
