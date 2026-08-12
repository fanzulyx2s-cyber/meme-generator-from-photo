import { describe, expect, it, vi } from "vitest";

import { aiCaptionClientTimeoutMs, AiCaptionClientError, requestAiCaptions } from "../client";

const createTestImageBase64 = (): string =>
  Buffer.from("synthetic-client-image", "utf8").toString("base64");

describe("requestAiCaptions", () => {
  it("keeps the client request alive through the emergency provider budget", () => {
    expect(aiCaptionClientTimeoutMs).toBe(58_000);
  });

  it("reports its own deadline as a provider timeout instead of user cancellation", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockImplementation((_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      }),
    );

    const pending = requestAiCaptions({
      imageBase64: createTestImageBase64(),
      mimeType: "image/jpeg",
      style: "funny",
      fetcher,
      timeoutMs: 10,
    });
    const rejection = expect(pending).rejects.toMatchObject({ code: "PROVIDER_TIMEOUT", retryable: true });
    await vi.advanceTimersByTimeAsync(10);

    await rejection;
    vi.useRealTimers();
  });

  it("posts a schema-valid request and parses five captions", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ captions: Array.from({ length: 5 }, (_, index) => ({ topText: `TOP ${index}`, bottomText: `BOTTOM ${index}` })) }), { status: 200 }),
    );

    await expect(requestAiCaptions({ imageBase64: createTestImageBase64(), mimeType: "image/jpeg", style: "funny", fetcher })).resolves.toHaveLength(5);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/ai-meme-captions",
      expect.objectContaining({ method: "POST", headers: { "Content-Type": "application/json" } }),
    );
  });

  it("maps server errors without echoing image data", async () => {
    const imageBase64 = createTestImageBase64();
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "PROVIDER_TIMEOUT", message: "internal" } }), { status: 504 }),
    );

    const error = await requestAiCaptions({ imageBase64, mimeType: "image/png", style: "reaction", fetcher }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AiCaptionClientError);
    expect(error).toMatchObject({ code: "PROVIDER_TIMEOUT", retryable: true });
    expect((error as Error).message).not.toContain(imageBase64);
  });

  it.each([4, 6])("rejects a success response with %i captions", async (count) => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ captions: Array.from({ length: count }, () => ({ topText: "TOP", bottomText: "BOTTOM" })) }), { status: 200 }),
    );

    await expect(requestAiCaptions({ imageBase64: createTestImageBase64(), mimeType: "image/webp", style: "workplace", fetcher })).rejects.toMatchObject({ code: "INVALID_PROVIDER_RESPONSE" });
  });

  it("rejects non-JSON responses and forwards caller cancellation", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      expect(init.signal).toBeDefined();
      controller.abort();
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    });

    await expect(requestAiCaptions({ imageBase64: createTestImageBase64(), mimeType: "image/jpeg", style: "funny", signal: controller.signal, fetcher })).rejects.toMatchObject({ code: "REQUEST_ABORTED" });
  });
});
