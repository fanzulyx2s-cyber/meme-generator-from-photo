import { afterEach, describe, expect, it, vi } from "vitest";

import { MAX_AI_CAPTION_REQUEST_BYTES } from "../../../lib/ai/captions/schema";
import { POST } from "./route";

const validPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADklEQVR4nGP4jwQYcHIAu4cj3ZP55DwAAAAASUVORK5CYII=";
const validBody = { imageBase64: validPngBase64, mimeType: "image/png", style: "reaction" };
const jsonHeaders = { "Content-Type": "application/json" };

function jsonRequest(body: unknown, contentType = "application/json") {
  return new Request("http://localhost/api/ai-meme-captions", { method: "POST", headers: { "Content-Type": contentType }, body: JSON.stringify(body) });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/ai-meme-captions", () => {
  it("returns a safe 400 response for invalid JSON", async () => {
    const response = await POST(new Request("http://localhost/api/ai-meme-captions", { method: "POST", headers: jsonHeaders, body: "{" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: { code: "INVALID_IMAGE", message: "The image request is invalid." } });
  });

  it("rejects missing or unsupported Content-Type before any provider request", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const missing = await POST(new Request("http://localhost/api/ai-meme-captions", { method: "POST", body: JSON.stringify(validBody) }));
    const unsupported = await POST(jsonRequest(validBody, "text/plain"));
    expect(missing.status).toBe(415);
    expect(unsupported.status).toBe(415);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("accepts application/json with a charset", async () => {
    vi.stubEnv("AI_CAPTIONS_ENABLED", "true");
    vi.stubEnv("AI_CAPTION_PROVIDER", "mock");
    const response = await POST(jsonRequest(validBody, "application/json; charset=utf-8"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ captions: expect.any(Array) });
  });

  it("rejects declared and actual oversized request bodies before provider use", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const declared = await POST(new Request("http://localhost/api/ai-meme-captions", {
      method: "POST",
      headers: { ...jsonHeaders, "Content-Length": String(MAX_AI_CAPTION_REQUEST_BYTES + 1) },
      body: "{}",
    }));
    const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode("x".repeat(MAX_AI_CAPTION_REQUEST_BYTES + 1))); controller.close(); } });
    const actual = await POST(new Request("http://localhost/api/ai-meme-captions", { method: "POST", headers: jsonHeaders, body: stream, duplex: "half" } as RequestInit & { duplex: "half" }));
    expect(declared.status).toBe(413);
    expect(actual.status).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects public usage metadata controls before any provider request", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    vi.stubEnv("AI_CAPTIONS_ENABLED", "true");
    vi.stubEnv("AI_CAPTION_PROVIDER", "mock");
    const response = await POST(jsonRequest({ ...validBody, includeUsageMetadata: true }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_IMAGE" } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects non-image Base64 before any provider request", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    vi.stubEnv("AI_CAPTIONS_ENABLED", "true");
    vi.stubEnv("AI_CAPTION_PROVIDER", "mock");
    const response = await POST(jsonRequest({ ...validBody, imageBase64: Buffer.from("not an image").toString("base64") }));
    expect(response.status).toBe(415);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 404 while AI captions are disabled after a valid request is parsed", async () => {
    vi.stubEnv("AI_CAPTIONS_ENABLED", "false");
    const response = await POST(jsonRequest(validBody));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "AI_DISABLED" } });
  });

  it("returns only captions for a default-model success", async () => {
    vi.stubEnv("AI_CAPTIONS_ENABLED", "true");
    vi.stubEnv("AI_CAPTION_PROVIDER", "mock");
    const response = await POST(jsonRequest(validBody));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(Object.keys(payload)).toEqual(["captions"]);
    expect(payload).toMatchObject({ captions: expect.any(Array) });
  });

  it("returns only captions after a Gemini fallback succeeds", async () => {
    vi.stubEnv("AI_CAPTIONS_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "synthetic-test-key");
    const captions = Array.from({ length: 5 }, (_, index) => ({ topText: `TOP ${index}`, bottomText: `BOTTOM ${index}` }));
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response("{}", { status: 502 }))
      .mockResolvedValueOnce(new Response("{}", { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ captions }) }] } }] }), { status: 200 }));
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", fetch);
    const response = await POST(jsonRequest(validBody));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(Object.keys(payload)).toEqual(["captions"]);
    expect(payload).toMatchObject({ captions });
    const successLog = info.mock.calls.map(([entry]) => JSON.parse(String(entry))).find((entry) => entry.event === "AI_CAPTION_ROUTE_SUCCESS");
    expect(successLog).toMatchObject({ localStatus: 200, fallbackUsed: true });
  });

  it("returns only captions after the Mistral emergency fallback succeeds", async () => {
    vi.stubEnv("AI_CAPTIONS_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "synthetic-gemini-key");
    vi.stubEnv("MISTRAL_API_KEY", "synthetic-mistral-key");
    const captions = Array.from({ length: 5 }, (_, index) => ({ topText: `TOP ${index}`, bottomText: `BOTTOM ${index}` }));
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ captions }) } }] }), { status: 200 }));
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", fetch);
    const response = await POST(jsonRequest(validBody));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(Object.keys(payload)).toEqual(["captions"]);
    expect(payload).toEqual({ captions });
  });
});
