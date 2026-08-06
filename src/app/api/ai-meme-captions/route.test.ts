import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/ai-meme-captions", () => {
  it("returns a safe 400 response for invalid JSON", async () => {
    const response = await POST(new Request("http://localhost/api/ai-meme-captions", { method: "POST", body: "{" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: { code: "INVALID_IMAGE", message: "The image request is invalid." } });
  });

  it("returns 404 while AI captions are disabled", async () => {
    vi.stubEnv("AI_CAPTIONS_ENABLED", "false");
    const response = await POST(new Request("http://localhost/api/ai-meme-captions", { method: "POST", body: "{}" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "AI_DISABLED" } });
  });

  it("returns only captions for a default-model success", async () => {
    vi.stubEnv("AI_CAPTIONS_ENABLED", "true");
    vi.stubEnv("AI_CAPTION_PROVIDER", "mock");
    const imageBase64 = Buffer.from("synthetic-test-image-bytes", "utf8").toString("base64");
    const response = await POST(new Request("http://localhost/api/ai-meme-captions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64, mimeType: "image/png", style: "reaction" }) }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(payload)).toEqual(["captions"]);
    expect(payload).toMatchObject({ captions: expect.any(Array) });
  });

  it("returns usage metadata only for the comparison opt-in request", async () => {
    vi.stubEnv("AI_CAPTIONS_ENABLED", "true");
    vi.stubEnv("AI_CAPTION_PROVIDER", "mock");
    const imageBase64 = Buffer.from("synthetic-test-image-bytes", "utf8").toString("base64");
    const response = await POST(new Request("http://localhost/api/ai-meme-captions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64, mimeType: "image/png", style: "reaction", includeUsageMetadata: true }) }));

    const payload = await response.json();
    expect(Object.keys(payload).sort()).toEqual(["captions", "usageMetadata"]);
    expect(payload).toMatchObject({ captions: expect.any(Array), usageMetadata: null });
  });

  it("returns only captions after a Gemini fallback succeeds", async () => {
    vi.stubEnv("AI_CAPTIONS_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "synthetic-test-key");
    const captions = Array.from({ length: 5 }, (_, index) => ({ topText: `TOP ${index}`, bottomText: `BOTTOM ${index}` }));
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response("{}", { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ captions }) }] } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const imageBase64 = Buffer.from("synthetic-test-image-bytes", "utf8").toString("base64");

    const response = await POST(new Request("http://localhost/api/ai-meme-captions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64, mimeType: "image/png", style: "reaction" }) }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(Object.keys(payload)).toEqual(["captions"]);
    expect(payload).toMatchObject({ captions });
  });
});
