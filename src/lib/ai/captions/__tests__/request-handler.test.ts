import { describe, expect, it, vi } from "vitest";

import { CaptionProviderError } from "../caption-provider";
import { handleAiCaptionRequest } from "../request-handler";

const createTestImageBase64 = (): string => Buffer.from("synthetic-test-image-bytes", "utf8").toString("base64");
const successBody = { imageBase64: createTestImageBase64(), mimeType: "image/jpeg", style: "funny" };
const successProvider = { name: "mock" as const, generateCaptions: async () => ({ captions: Array.from({ length: 5 }, () => ({ topText: "TOP", bottomText: "BOTTOM" })) }) };
const enabledMockEnv = { AI_CAPTIONS_ENABLED: "true", AI_CAPTION_PROVIDER: "mock" };

describe("handleAiCaptionRequest", () => {
  it("hides disabled captions", async () => {
    await expect(handleAiCaptionRequest({ requestBody: successBody, env: {} })).resolves.toMatchObject({ ok: false, status: 404, error: { code: "AI_DISABLED" } });
  });

  it("rejects enabled Gemini captions without a server key", async () => {
    await expect(handleAiCaptionRequest({ requestBody: successBody, env: { AI_CAPTIONS_ENABLED: "true" } })).resolves.toMatchObject({ ok: false, status: 503, error: { code: "MISSING_CONFIGURATION" } });
  });

  it.each([
    [{ ...successBody, mimeType: "image/gif" }, "UNSUPPORTED_IMAGE_TYPE"],
    [{ ...successBody, imageBase64: "" }, "INVALID_IMAGE"],
    [{ ...successBody, imageBase64: "%%%" }, "INVALID_IMAGE"],
    [{ ...successBody, style: "other" }, "INVALID_STYLE"],
    [{ ...successBody, extra: true }, "INVALID_IMAGE"],
  ])("rejects invalid server input", async (requestBody, code) => {
    await expect(handleAiCaptionRequest({ requestBody, env: enabledMockEnv })).resolves.toMatchObject({ ok: false, error: { code } });
  });

  it("accepts a mock provider result", async () => {
    const result = await handleAiCaptionRequest({ requestBody: successBody, env: enabledMockEnv, providerFactory: () => successProvider });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.captions).toHaveLength(5);
  });

  it("uses gemini-3.5-flash-lite as the default production model", async () => {
    const models: string[] = [];
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", GEMINI_API_KEY: "synthetic-test-key" },
      providerFactory: (options) => {
        models.push(options.model ?? "");
        return successProvider;
      },
    });

    expect(result).toMatchObject({ ok: true });
    expect(models).toEqual(["gemini-3.5-flash-lite"]);
  });

  it("uses gemini-3.1-flash-lite once after a retryable 502 and returns its result", async () => {
    const models: string[] = [];
    const diagnostics = { emit: vi.fn() };
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", GEMINI_API_KEY: "synthetic-test-key" },
      diagnostics,
      providerFactory: (options) => {
        models.push(options.model ?? "");
        if (options.model === "gemini-3.5-flash-lite") {
          return { ...successProvider, generateCaptions: async () => { throw new CaptionProviderError({ code: "AI_GENERATION_FAILED", message: "safe", fallbackEligible: true }); } };
        }
        return successProvider;
      },
    });

    expect(result).toMatchObject({ ok: true, fallbackUsed: true });
    expect(models).toEqual(["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
    expect(diagnostics.emit).toHaveBeenCalledWith("AI_CAPTION_FALLBACK", expect.objectContaining({ fallbackUsed: true }));
  });

  it.each([
    [new CaptionProviderError({ code: "MISSING_CONFIGURATION", message: "safe" }), "401"],
    [new CaptionProviderError({ code: "PROVIDER_RATE_LIMITED", message: "safe" }), "429"],
  ])("does not fall back after a non-retryable %s failure", async (providerError) => {
    const models: string[] = [];
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", GEMINI_API_KEY: "synthetic-test-key" },
      providerFactory: (options) => {
        models.push(options.model ?? "");
        return { ...successProvider, generateCaptions: async () => { throw providerError; } };
      },
    });

    expect(result).toMatchObject({ ok: false, error: { code: providerError.code } });
    expect(models).toEqual(["gemini-3.5-flash-lite"]);
  });

  it("does not fall back after the user cancels the request", async () => {
    const controller = new AbortController();
    const models: string[] = [];
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", GEMINI_API_KEY: "synthetic-test-key" },
      requestSignal: controller.signal,
      providerFactory: (options) => {
        models.push(options.model ?? "");
        return {
          ...successProvider,
          generateCaptions: async () => {
            controller.abort();
            throw new CaptionProviderError({ code: "AI_GENERATION_FAILED", message: "safe", fallbackEligible: true });
          },
        };
      },
    });

    expect(result).toMatchObject({ ok: false, error: { code: "AI_GENERATION_FAILED" } });
    expect(models).toEqual(["gemini-3.5-flash-lite"]);
  });

  it("returns a safe error after both models fail", async () => {
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", GEMINI_API_KEY: "synthetic-test-key" },
      providerFactory: () => ({
        ...successProvider,
        generateCaptions: async () => {
          throw new CaptionProviderError({ code: "AI_GENERATION_FAILED", message: "safe", fallbackEligible: true });
        },
      }),
    });

    expect(result).toEqual({ ok: false, status: 502, error: { code: "AI_GENERATION_FAILED", message: "safe" } });
  });

  it("rejects decoded images over the byte limit", async () => {
    const imageBase64 = Buffer.alloc(2_000_001, 1).toString("base64");
    await expect(handleAiCaptionRequest({ requestBody: { ...successBody, imageBase64 }, env: enabledMockEnv })).resolves.toMatchObject({ ok: false, status: 413, error: { code: "IMAGE_TOO_LARGE" } });
  });

  it.each([
    [new CaptionProviderError({ code: "PROVIDER_TIMEOUT", message: "safe", retryable: true }), 504],
    [new CaptionProviderError({ code: "PROVIDER_RATE_LIMITED", message: "safe", retryable: true }), 429],
    [new CaptionProviderError({ code: "AI_GENERATION_FAILED", message: "safe", retryable: false }), 502],
  ])("maps provider errors", async (providerError, status) => {
    await expect(handleAiCaptionRequest({ requestBody: successBody, env: enabledMockEnv, providerFactory: () => ({ ...successProvider, generateCaptions: async () => { throw providerError; } }) })).resolves.toMatchObject({ ok: false, status, error: { code: providerError.code } });
  });
});
