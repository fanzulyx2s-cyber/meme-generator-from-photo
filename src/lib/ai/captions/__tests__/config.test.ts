import { describe, expect, it } from "vitest";

import { readAiCaptionConfig } from "../config";

const createTestApiKey = (): string => Buffer.from("synthetic-test-key", "utf8").toString("hex");

describe("readAiCaptionConfig", () => {
  it("enables captions only for the exact true value", () => {
    expect(readAiCaptionConfig({ AI_CAPTIONS_ENABLED: "true" }).enabled).toBe(true);
    expect(readAiCaptionConfig({ AI_CAPTIONS_ENABLED: "TRUE" }).enabled).toBe(false);
    expect(readAiCaptionConfig({}).enabled).toBe(false);
  });

  it("uses safe defaults and does not expose the key in a public field", () => {
    const config = readAiCaptionConfig({ GEMINI_API_KEY: createTestApiKey() });

    expect(config.provider).toBe("gemini");
    expect(config.model).toBe("gemini-3.5-flash-lite");
    expect(config.timeoutMs).toBe(15_000);
    expect(config.hasApiKey).toBe(true);
    expect(config.hasMistralApiKey).toBe(false);
    expect(JSON.stringify({ ...config, apiKey: undefined })).not.toContain(createTestApiKey());
  });

  it("reads the emergency provider key only from the server environment", () => {
    const mistralApiKey = createTestApiKey();
    const config = readAiCaptionConfig({ MISTRAL_API_KEY: mistralApiKey });

    expect(config.hasMistralApiKey).toBe(true);
    expect(config.mistralApiKey).toBe(mistralApiKey);
    expect(JSON.stringify({ ...config, mistralApiKey: undefined })).not.toContain(mistralApiKey);
  });

  it("keeps the selected production primary model even when a legacy model override is present", () => {
    expect(readAiCaptionConfig({ AI_CAPTION_MODEL: "gemini-3.6-flash" }).model).toBe("gemini-3.5-flash-lite");
  });

  it("accepts a bounded server-only timeout override for comparison runs", () => {
    expect(readAiCaptionConfig({ AI_CAPTION_TIMEOUT_MS: "25000" }).timeoutMs).toBe(25_000);
    expect(readAiCaptionConfig({ AI_CAPTION_TIMEOUT_MS: "45000" }).timeoutMs).toBe(45_000);
    expect(readAiCaptionConfig({ AI_CAPTION_TIMEOUT_MS: "invalid" }).timeoutMs).toBe(15_000);
  });
});
