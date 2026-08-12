import { describe, expect, it, vi } from "vitest";

import { CaptionProviderError } from "../caption-provider";
import { MistralCaptionProvider } from "../providers/mistral-caption-provider";

const imageBase64 = Buffer.from("synthetic-mistral-image", "utf8").toString("base64");
const apiKey = Buffer.from("synthetic-mistral-key", "utf8").toString("hex");
const captions = Array.from({ length: 5 }, (_, index) => ({ topText: `TOP ${index}`, bottomText: `BOTTOM ${index}` }));
const input = { imageBase64, mimeType: "image/jpeg" as const, style: "reaction" as const };

const completion = (content: string) => ({ choices: [{ message: { content } }] });

describe("MistralCaptionProvider", () => {
  it("uses one server-side vision chat request with JSON schema output", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(completion(JSON.stringify({ captions }))), { status: 200 }));
    const provider = new MistralCaptionProvider({ apiKey, model: "ministral-8b-2512", timeoutMs: 15_000, fetch });

    await expect(provider.generateCaptions(input)).resolves.toEqual({ captions });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.mistral.ai/v1/chat/completions");
    expect(url).not.toContain(apiKey);
    expect(init).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({ "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }),
    });
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      model: "ministral-8b-2512",
      messages: [{ role: "user", content: [
        { type: "text", text: expect.any(String) },
        { type: "image_url", image_url: `data:image/jpeg;base64,${imageBase64}` },
      ] }],
      response_format: { type: "json_schema", json_schema: { name: "meme_captions", schema: expect.any(Object), strict: true } },
      stream: false,
    });
    expect(JSON.stringify(body)).not.toContain(apiKey);
  });

  it.each([
    [429, "PROVIDER_RATE_LIMITED"],
    [500, "AI_GENERATION_FAILED"],
    [502, "AI_GENERATION_FAILED"],
    [503, "AI_GENERATION_FAILED"],
  ])("maps HTTP %i to a safe error", async (status, code) => {
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status }));
    await expect(new MistralCaptionProvider({ apiKey, fetch }).generateCaptions(input)).rejects.toMatchObject({ code });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("maps its independent timeout safely", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("timeout"));
    const error = await new MistralCaptionProvider({ apiKey, fetch }).generateCaptions(input).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(CaptionProviderError);
    expect(error).toMatchObject({ code: "PROVIDER_TIMEOUT" });
    expect((error as Error).message).not.toContain(imageBase64);
  });

  it("keeps the independent timeout active while reading the response body", async () => {
    vi.useFakeTimers();
    const response = new Response(new ReadableStream({
      start() {
        // Deliberately never enqueue or close: response headers arrive, body stalls.
      },
    }), { status: 200 });
    const fetch = vi.fn().mockResolvedValue(response);
    const pending = new MistralCaptionProvider({ apiKey, timeoutMs: 50, fetch }).generateCaptions(input);
    const assertion = expect(pending).rejects.toMatchObject({ code: "PROVIDER_TIMEOUT" });

    await vi.advanceTimersByTimeAsync(51);
    await assertion;
    vi.useRealTimers();
  });

  it.each([
    [completion("not-json")],
    [completion(JSON.stringify({ captions: captions.slice(0, 4) }))],
    [{ choices: [] }],
  ])("rejects invalid successful output", async (responseBody) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(responseBody), { status: 200 }));
    await expect(new MistralCaptionProvider({ apiKey, fetch }).generateCaptions(input)).rejects.toMatchObject({ code: "INVALID_PROVIDER_RESPONSE" });
  });
});
