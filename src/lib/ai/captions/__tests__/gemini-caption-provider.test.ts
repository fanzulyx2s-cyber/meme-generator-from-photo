import { describe, expect, it, vi } from "vitest";

import { CaptionProviderError } from "../caption-provider";
import { GeminiCaptionProvider } from "../providers/gemini-caption-provider";

const imageBase64 = Buffer.from("synthetic-test-image-bytes", "utf8").toString("base64");
const apiKey = Buffer.from("synthetic-test-key", "utf8").toString("hex");
const captions = Array.from({ length: 5 }, (_, index) => ({ topText: `TOP ${index}`, bottomText: `BOTTOM ${index}` }));
const input = { imageBase64, mimeType: "image/png" as const, style: "funny" as const };

const generateContentResponse = (text: string) => ({
  candidates: [{ content: { parts: [{ text }] } }],
});

describe("GeminiCaptionProvider", () => {
  it("uses one stateless Generate Content REST request with inline image data", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(generateContentResponse(JSON.stringify({ captions }))), { status: 200 }));
    const provider = new GeminiCaptionProvider({ apiKey, model: "gemini-3.1-flash-lite", timeoutMs: 15_000, fetch });

    await expect(provider.generateCaptions(input)).resolves.toEqual({ captions });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent");
    expect(url).not.toContain(apiKey);
    expect(init).toMatchObject({ method: "POST", headers: expect.objectContaining({ "Content-Type": "application/json", "x-goog-api-key": apiKey }) });
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      contents: [{ role: "user", parts: [{ text: expect.any(String) }, { inlineData: { mimeType: "image/png", data: imageBase64 } }] }],
      systemInstruction: { parts: [{ text: expect.any(String) }] },
      generationConfig: { responseMimeType: "application/json", responseJsonSchema: expect.any(Object) },
      store: false,
    });
    expect(JSON.stringify(body)).not.toContain(apiKey);
  });

  it("joins candidate text parts before JSON and Zod validation", async () => {
    const output = JSON.stringify({ captions });
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: output.slice(0, 20) }, { text: output.slice(20) }] } }] }), { status: 200 }));

    await expect(new GeminiCaptionProvider({ apiKey, fetch }).generateCaptions(input)).resolves.toEqual({ captions });
  });

  it("returns only safe numeric usage metadata with Zod-validated captions", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ...generateContentResponse(JSON.stringify({ captions })),
      usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 40, thoughtsTokenCount: 9, totalTokenCount: 169, ignored: "raw response detail" },
    }), { status: 200 }));

    await expect(new GeminiCaptionProvider({ apiKey, fetch }).generateCaptions(input)).resolves.toEqual({
      captions,
      usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 40, thoughtsTokenCount: 9, totalTokenCount: 169 },
    });
  });

  it.each([
    [{ candidates: [{ content: { parts: [] } }] }, "INVALID_PROVIDER_RESPONSE"],
    [generateContentResponse("not-json"), "INVALID_PROVIDER_RESPONSE"],
    [generateContentResponse(JSON.stringify({ captions: captions.slice(0, 4) })), "INVALID_PROVIDER_RESPONSE"],
  ])("rejects invalid Generate Content output", async (responseBody, code) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(responseBody), { status: 200 }));

    await expect(new GeminiCaptionProvider({ apiKey, fetch }).generateCaptions(input)).rejects.toMatchObject({ code });
  });

  it.each([
    [401, "MISSING_CONFIGURATION", false, false],
    [403, "MISSING_CONFIGURATION", false, false],
    [429, "PROVIDER_RATE_LIMITED", true, false],
    [502, "AI_GENERATION_FAILED", true, true],
    [503, "AI_GENERATION_FAILED", true, true],
    [504, "AI_GENERATION_FAILED", true, true],
  ])("maps REST status %i safely", async (status, code, retryable, fallbackEligible) => {
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status }));

    await expect(new GeminiCaptionProvider({ apiKey, fetch }).generateCaptions(input)).rejects.toMatchObject({ code, retryable, fallbackEligible });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("maps fetch timeouts without exposing image data", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("timeout"));
    const error = await new GeminiCaptionProvider({ apiKey, fetch }).generateCaptions(input).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(CaptionProviderError);
    expect(error).toMatchObject({ code: "PROVIDER_TIMEOUT", retryable: true, fallbackEligible: true });
    expect((error as Error).message).not.toContain(imageBase64);
  });
});
