import { describe, expect, it } from "vitest";

import { CaptionProviderError } from "../caption-provider";
import { createCaptionProvider } from "../create-caption-provider";
import { MockCaptionProvider } from "../providers/mock-caption-provider";
import { GeminiCaptionProvider } from "../providers/gemini-caption-provider";
import { MistralCaptionProvider } from "../providers/mistral-caption-provider";

const createTestApiKey = (): string => Buffer.from("synthetic-test-key", "utf8").toString("hex");

describe("createCaptionProvider", () => {
  it("creates the mock provider", () => {
    expect(createCaptionProvider({ providerName: "mock" })).toBeInstanceOf(MockCaptionProvider);
  });

  it("creates Gemini only with a server key", () => {
    expect(createCaptionProvider({ providerName: "gemini", apiKey: createTestApiKey() })).toBeInstanceOf(GeminiCaptionProvider);
    try {
      createCaptionProvider({ providerName: "gemini" });
    } catch (error) {
      expect(error).toMatchObject({ code: "MISSING_CONFIGURATION" });
    }
  });

  it("creates Mistral only with a server key", () => {
    expect(createCaptionProvider({ providerName: "mistral", apiKey: createTestApiKey() })).toBeInstanceOf(MistralCaptionProvider);
    expect(() => createCaptionProvider({ providerName: "mistral" })).toThrow(CaptionProviderError);
  });

  it.each(["openai", "qwen", "unknown"])("rejects unsupported provider %s", (providerName) => {
    expect(() => createCaptionProvider({ providerName })).toThrow(CaptionProviderError);
    try {
      createCaptionProvider({ providerName });
    } catch (error) {
      expect(error).toMatchObject({ code: "UNSUPPORTED_PROVIDER" });
    }
  });
});
