import { describe, expect, it, vi } from "vitest";

import { CaptionProviderError } from "../caption-provider";
import { handleAiCaptionRequest } from "../request-handler";

const createTestImageBase64 = (): string => "iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADklEQVR4nGP4jwQYcHIAu4cj3ZP55DwAAAAASUVORK5CYII=";
const successBody = { imageBase64: createTestImageBase64(), mimeType: "image/png", style: "funny" };
const successProvider = { name: "mock" as const, generateCaptions: async () => ({ captions: Array.from({ length: 5 }, () => ({ topText: "TOP", bottomText: "BOTTOM" })) }) };
const enabledMockEnv = { AI_CAPTIONS_ENABLED: "true", AI_CAPTION_PROVIDER: "mock" };
const verifiedTurnstile = async () => ({ ok: true as const });
const allowedModeration = { moderate: vi.fn(async () => ({ decision: "allow" as const })) };

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

  it("does not call moderation or a caption provider when Turnstile rejects", async () => {
    const moderationProvider = { moderate: vi.fn(async () => ({ decision: "allow" as const })) };
    const providerFactory = vi.fn(() => successProvider);
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { ...enabledMockEnv, TURNSTILE_ENABLED: "true", IMAGE_MODERATION_ENABLED: "true" },
      turnstileVerifier: async () => ({ ok: false as const, code: "TURNSTILE_FAILED" }),
      moderationProvider,
      providerFactory,
    });

    expect(result).toMatchObject({ ok: false, status: 403, error: { code: "TURNSTILE_FAILED" } });
    expect(moderationProvider.moderate).not.toHaveBeenCalled();
    expect(providerFactory).not.toHaveBeenCalled();
  });

  it.each(["block", "unavailable"] as const)("does not call a caption provider when moderation is %s", async (decision) => {
    const moderationProvider = { moderate: vi.fn(async () => ({ decision })) };
    const providerFactory = vi.fn(() => successProvider);
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { ...enabledMockEnv, TURNSTILE_ENABLED: "true", IMAGE_MODERATION_ENABLED: "true" },
      turnstileVerifier: verifiedTurnstile,
      moderationProvider,
      providerFactory,
    });

    expect(result).toMatchObject({ ok: false, status: decision === "block" ? 422 : 503 });
    expect(moderationProvider.moderate).toHaveBeenCalledTimes(1);
    expect(providerFactory).not.toHaveBeenCalled();
  });

  it("does not permit test dependency injection to bypass production guardrails", async () => {
    const moderationProvider = { moderate: vi.fn(async () => ({ decision: "allow" as const })) };
    const providerFactory = vi.fn(() => successProvider);
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { ...enabledMockEnv, NODE_ENV: "production", TURNSTILE_SECRET_KEY: "synthetic", IMAGE_MODERATION_ENABLED: "false" },
      turnstileVerifier: verifiedTurnstile,
      moderationProvider,
      providerFactory,
    });

    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(moderationProvider.moderate).not.toHaveBeenCalled();
    expect(providerFactory).not.toHaveBeenCalled();
  });

  it("keeps the Gemini primary, fallback, then Mistral order after approved guardrails", async () => {
    const calls: string[] = [];
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", TURNSTILE_ENABLED: "true", IMAGE_MODERATION_ENABLED: "true", GEMINI_API_KEY: "synthetic-gemini-key", MISTRAL_API_KEY: "synthetic-mistral-key" },
      retryDelayMs: 0,
      turnstileVerifier: verifiedTurnstile,
      moderationProvider: allowedModeration,
      providerFactory: (options) => {
        calls.push(`${options.providerName}:${options.model}`);
        if (options.providerName === "mistral") return successProvider;
        return { ...successProvider, generateCaptions: async () => { throw new CaptionProviderError({ code: "AI_GENERATION_FAILED", message: "safe", retryable: true, fallbackEligible: true, cause: { status: 503 } }); } };
      },
    });

    expect(result).toMatchObject({ ok: true, fallbackUsed: true });
    expect(calls).toEqual([
      "gemini:gemini-3.5-flash-lite",
      "gemini:gemini-3.5-flash-lite",
      "gemini:gemini-3.1-flash-lite",
      "mistral:ministral-8b-2512",
    ]);
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

  it("retries the primary model once after a fast transient 502", async () => {
    const models: string[] = [];
    let primaryAttempts = 0;
    const diagnostics = { emit: vi.fn() };
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", GEMINI_API_KEY: "synthetic-test-key" },
      diagnostics,
      retryDelayMs: 0,
      providerFactory: (options) => {
        models.push(options.model ?? "");
        return {
          ...successProvider,
          generateCaptions: async () => {
            primaryAttempts += 1;
            if (primaryAttempts === 1) {
              throw new CaptionProviderError({
                code: "AI_GENERATION_FAILED",
                message: "safe",
                retryable: true,
                fallbackEligible: true,
                cause: { status: 502 },
              });
            }
            return successProvider.generateCaptions();
          },
        };
      },
    });

    expect(result).toMatchObject({ ok: true, fallbackUsed: false });
    expect(models).toEqual(["gemini-3.5-flash-lite", "gemini-3.5-flash-lite"]);
    expect(diagnostics.emit).toHaveBeenCalledWith("AI_CAPTION_RETRY", expect.objectContaining({ retryUsed: true, attempt: 2 }));
    expect(models).not.toContain("ministral-8b-2512");
  });

  it("uses Mistral once after Gemini fallback fails", async () => {
    const calls: string[] = [];
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", GEMINI_API_KEY: "synthetic-gemini-key", MISTRAL_API_KEY: "synthetic-mistral-key" },
      retryDelayMs: 0,
      providerFactory: (options) => {
        calls.push(`${options.providerName}:${options.model}`);
        if (options.providerName === "mistral") return successProvider;
        return { ...successProvider, generateCaptions: async () => { throw new CaptionProviderError({ code: "AI_GENERATION_FAILED", message: "safe", retryable: true, fallbackEligible: true, cause: { status: 503 } }); } };
      },
    });

    expect(result).toMatchObject({ ok: true, fallbackUsed: true });
    expect(calls).toEqual([
      "gemini:gemini-3.5-flash-lite",
      "gemini:gemini-3.5-flash-lite",
      "gemini:gemini-3.1-flash-lite",
      "mistral:ministral-8b-2512",
    ]);
  });

  it("returns the Mistral failure after every provider fails", async () => {
    const calls: string[] = [];
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", GEMINI_API_KEY: "synthetic-gemini-key", MISTRAL_API_KEY: "synthetic-mistral-key" },
      retryDelayMs: 0,
      providerFactory: (options) => {
        calls.push(`${options.providerName}:${options.model}`);
        const error = options.providerName === "mistral"
          ? new CaptionProviderError({ code: "PROVIDER_RATE_LIMITED", message: "safe-mistral" })
          : new CaptionProviderError({ code: "AI_GENERATION_FAILED", message: "safe-gemini", retryable: true, fallbackEligible: true, cause: { status: 503 } });
        return { ...successProvider, generateCaptions: async () => { throw error; } };
      },
    });

    expect(result).toEqual({ ok: false, status: 429, error: { code: "PROVIDER_RATE_LIMITED", message: "safe-mistral" } });
    expect(calls.at(-1)).toBe("mistral:ministral-8b-2512");
  });

  it("retries the primary once and then uses exactly one fallback", async () => {
    const models: string[] = [];
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", GEMINI_API_KEY: "synthetic-test-key" },
      retryDelayMs: 0,
      providerFactory: (options) => {
        models.push(options.model ?? "");
        if (options.model === "gemini-3.5-flash-lite") {
          return {
            ...successProvider,
            generateCaptions: async () => {
              throw new CaptionProviderError({ code: "AI_GENERATION_FAILED", message: "safe", retryable: true, fallbackEligible: true, cause: { status: 503 } });
            },
          };
        }
        return successProvider;
      },
    });

    expect(result).toMatchObject({ ok: true, fallbackUsed: true });
    expect(models).toEqual(["gemini-3.5-flash-lite", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
  });

  it("falls back directly after upstream 504 without retrying the primary", async () => {
    const models: string[] = [];
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", GEMINI_API_KEY: "synthetic-test-key" },
      retryDelayMs: 0,
      providerFactory: (options) => {
        models.push(options.model ?? "");
        if (options.model === "gemini-3.5-flash-lite") {
          return {
            ...successProvider,
            generateCaptions: async () => {
              throw new CaptionProviderError({ code: "AI_GENERATION_FAILED", message: "safe", retryable: true, fallbackEligible: true, cause: { status: 504 } });
            },
          };
        }
        return successProvider;
      },
    });

    expect(result).toMatchObject({ ok: true, fallbackUsed: true });
    expect(models).toEqual(["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
  });

  it("caps each provider attempt and passes a cancellation signal", async () => {
    const caller = new AbortController();
    const timeouts: number[] = [];
    const signals: Array<AbortSignal | undefined> = [];
    const result = await handleAiCaptionRequest({
      requestBody: successBody,
      env: { AI_CAPTIONS_ENABLED: "true", GEMINI_API_KEY: "synthetic-test-key", AI_CAPTION_TIMEOUT_MS: "45000" },
      requestSignal: caller.signal,
      providerFactory: (options) => {
        timeouts.push(options.timeoutMs ?? 0);
        return {
          ...successProvider,
          generateCaptions: async (_input, generateOptions) => {
            signals.push(generateOptions?.signal);
            return successProvider.generateCaptions();
          },
        };
      },
    });

    expect(result).toMatchObject({ ok: true });
    expect(timeouts).toEqual([15_000]);
    expect(signals[0]).toBeDefined();
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
