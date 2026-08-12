import { CaptionProviderError } from "./caption-provider";
import { MockCaptionProvider } from "./providers/mock-caption-provider";
import { GeminiCaptionProvider } from "./providers/gemini-caption-provider";
import { MistralCaptionProvider } from "./providers/mistral-caption-provider";
import type { CaptionProvider } from "./caption-provider";
import type { AiCaptionDiagnostics } from "./diagnostics";
import type { CaptionProviderName } from "./types";

export type CreateCaptionProviderOptions = {
  providerName: CaptionProviderName | string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetch?: ConstructorParameters<typeof GeminiCaptionProvider>[0]["fetch"] | ConstructorParameters<typeof MistralCaptionProvider>[0]["fetch"];
  diagnostics?: AiCaptionDiagnostics;
};

export function createCaptionProvider({ providerName, apiKey, model, timeoutMs, fetch, diagnostics }: CreateCaptionProviderOptions): CaptionProvider {
  if (providerName === "mock") {
    return new MockCaptionProvider();
  }
  if (providerName === "gemini") {
    if (!apiKey) {
      throw new CaptionProviderError({ code: "MISSING_CONFIGURATION", message: "The AI caption service is not available." });
    }
    return new GeminiCaptionProvider({ apiKey, model, timeoutMs, fetch, diagnostics });
  }
  if (providerName === "mistral") {
    if (!apiKey) {
      throw new CaptionProviderError({ code: "MISSING_CONFIGURATION", message: "The AI caption service is not available." });
    }
    return new MistralCaptionProvider({ apiKey, model, timeoutMs, fetch, diagnostics });
  }

  throw new CaptionProviderError({
    code: "UNSUPPORTED_PROVIDER",
    message: "The selected AI caption provider is not available.",
  });
}
