import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FIXED_MODELS, FIXED_STYLE, MAX_COMPARISON_COMPRESSED_BYTES, compressComparisonImage, discoverImages, postCaptionRequest, prepareComparisonImage, runComparison } from "../compare-gemini-caption-models.mjs";

const captions = Array.from({ length: 5 }, (_, index) => ({ topText: `TOP ${index}`, bottomText: `BOTTOM ${index}` }));
const dirs = [];
const makeDir = async () => { const dir = await mkdtemp(join(tmpdir(), "ai-model-test-")); dirs.push(dir); return dir; };
afterEach(async () => { await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

describe("Gemini model comparison", () => {
  it("sorts supported files anonymously and limits the set to ten", async () => {
    const dir = await makeDir();
    await Promise.all(["z.png", "a.webp", "skip.txt", "b.JPG", "c.jpeg", "d.png", "e.png", "f.png", "g.png", "h.png", "i.png", "j.png"].map((name) => writeFile(join(dir, name), "x")));
    const images = await discoverImages(dir);
    expect(images).toHaveLength(10);
    expect(images.map((image) => image.id)).toEqual(Array.from({ length: 10 }, (_, index) => `Image-${String(index + 1).padStart(2, "0")}`));
  });

  it("retains anonymous byte metadata so an oversized selected image can be rejected before any request", async () => {
    const dir = await makeDir();
    await writeFile(join(dir, "a.png"), Buffer.alloc(2_000_001, 1));
    const [image] = await discoverImages(dir);
    expect(image).toMatchObject({ id: "Image-01", byteLength: 2_000_001 });
  });

  it("passes a small image through without compression or a filename in the prepared payload", async () => {
    const read = vi.fn(async () => Buffer.from("small-image")); const compress = vi.fn();
    const prepared = await prepareComparisonImage({ id: "Image-01", path: "private-name.png", mimeType: "image/png", byteLength: 100 }, { read, compress });
    expect(prepared).toMatchObject({ ok: true, mimeType: "image/png", wasCompressed: false, byteLength: 11 });
    expect(compress).not.toHaveBeenCalled(); expect(String(JSON.stringify(prepared))).not.toContain("private-name.png");
  });

  it("compresses an oversized image in memory to the JPEG target with descending quality", async () => {
    const qualities = [];
    const compressed = await compressComparisonImage(Buffer.alloc(2_000_001, 1), { encode: async ({ quality }) => { qualities.push(quality); return Buffer.alloc(quality === 0.76 ? MAX_COMPARISON_COMPRESSED_BYTES : MAX_COMPARISON_COMPRESSED_BYTES + 1, 1); } });
    expect(compressed).toMatchObject({ mimeType: "image/jpeg", byteLength: MAX_COMPARISON_COMPRESSED_BYTES, quality: 0.76 });
    expect(qualities).toEqual([0.82, 0.76]);
  });

  it("skips an image safely when every in-memory compression attempt remains above target", async () => {
    const request = vi.fn();
    const prepared = await prepareComparisonImage({ id: "Image-01", path: "private-name.png", mimeType: "image/png", byteLength: 2_000_001 }, { read: async () => Buffer.alloc(2_000_001, 1), compress: async () => undefined });
    expect(prepared).toEqual({ ok: false, errorCode: "IMAGE_PREPARATION_FAILED" });
    await runComparison({ confirmed: true, images: [{ id: "Image-01", ...prepared }], request, startServer: async () => ({ stop: vi.fn() }), sleep: vi.fn(), outputDirectory: await makeDir() });
    expect(request).not.toHaveBeenCalled();
  });

  it("does not write a compressed file to disk", async () => {
    const dir = await makeDir(); await writeFile(join(dir, "source.png"), "source");
    const before = await readdir(dir);
    await prepareComparisonImage({ id: "Image-01", path: join(dir, "source.png"), mimeType: "image/png", byteLength: 2_000_001 }, { read: async () => Buffer.alloc(2_000_001, 1), compress: async () => ({ buffer: Buffer.alloc(MAX_COMPARISON_COMPRESSED_BYTES, 1), quality: 0.82 }) });
    await expect(readdir(dir)).resolves.toEqual(before);
  });

  it("makes zero network calls without the exact confirmation", async () => {
    const request = vi.fn();
    await expect(runComparison({ confirmed: false, images: [{ id: "Image-01", path: "x", mimeType: "image/png" }], request, startServer: vi.fn(), sleep: vi.fn(), outputDirectory: await makeDir() })).resolves.toMatchObject({ status: "cancelled" });
    expect(request).not.toHaveBeenCalled();
  });

  it("uses only fixed reaction models, serial calls, and a thirteen-second throttle", async () => {
    const calls = []; let active = 0; let maxActive = 0; const sleep = vi.fn(); const request = vi.fn(async ({ model, image }) => { active += 1; maxActive = Math.max(maxActive, active); await Promise.resolve(); calls.push(`${model}:${image.id}`); active -= 1; return { status: 200, captions }; });
    const stop = vi.fn(); const startServer = vi.fn(async () => ({ stop }));
    const images = [{ id: "Image-01", path: "a", mimeType: "image/png" }, { id: "Image-02", path: "b", mimeType: "image/png" }];
    const result = await runComparison({ confirmed: true, images, request, startServer, sleep, outputDirectory: await makeDir() });
    expect(result.style).toBe(FIXED_STYLE); expect(result.calls).toBe(6); expect(calls).toHaveLength(6); expect(startServer).toHaveBeenCalledTimes(3); expect(stop).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(5); expect(sleep).toHaveBeenCalledWith(13_000); expect(FIXED_MODELS).toHaveLength(3); expect(maxActive).toBe(1);
  });

  it.each([[401], [403], [429]])("stops all remaining work on status %i", async (status) => {
    const request = vi.fn(async () => ({ status, captions: [] })); const startServer = vi.fn(async () => ({ stop: vi.fn() }));
    const result = await runComparison({ confirmed: true, images: [{ id: "Image-01", path: "a", mimeType: "image/png" }], request, startServer, sleep: vi.fn(), outputDirectory: await makeDir() });
    expect(result.status).toBe("stopped"); expect(request).toHaveBeenCalledTimes(1);
  });

  it("safely stops when the formal route hides an upstream 401 or 403 as missing configuration", async () => {
    const request = vi.fn(async () => ({ status: 503, errorCode: "MISSING_CONFIGURATION", captions: [] }));
    const result = await runComparison({ confirmed: true, images: [{ id: "Image-01", path: "a.png", mimeType: "image/png" }], request, startServer: async () => ({ stop: vi.fn() }), sleep: vi.fn(), outputDirectory: await makeDir() });
    expect(result.status).toBe("stopped"); expect(request).toHaveBeenCalledTimes(1); expect(result.results[0].stopReason).toBe("MISSING_CONFIGURATION");
  });

  it("keeps every anonymous image section in the revealed document after an early safe stop", async () => {
    const dir = await makeDir();
    await runComparison({ confirmed: true, images: [{ id: "Image-01", path: "a.png", mimeType: "image/png" }, { id: "Image-02", path: "b.png", mimeType: "image/png" }], request: async () => ({ status: 429, captions: [] }), startServer: async () => ({ stop: vi.fn() }), sleep: vi.fn(), outputDirectory: dir });
    const outputs = await readFile(join(dir, "MODEL_CAPTION_OUTPUTS.md"), "utf8");
    expect(outputs).toContain("## Image-01"); expect(outputs).toContain("## Image-02"); expect(outputs).toContain("状态：FAIL");
  });

  it("records invalid, empty, and duplicate captions without retries", async () => {
    const request = vi.fn(async () => ({ status: 200, captions: [{ topText: "", bottomText: "x" }, ...captions.slice(1, 4), { topText: "TOP 1", bottomText: "BOTTOM 1" }] }));
    const result = await runComparison({ confirmed: true, images: [{ id: "Image-01", path: "a", mimeType: "image/png" }], request, startServer: async () => ({ stop: vi.fn() }), sleep: vi.fn(), outputDirectory: await makeDir() });
    expect(request).toHaveBeenCalledTimes(3); expect(result.results.every((entry) => entry.validation === "FAIL")).toBe(true);
  });

  it("records Generate Content usage metadata and a paid-tier estimate without an extra request", async () => {
    const dir = await makeDir();
    await runComparison({ confirmed: true, images: [{ id: "Image-01", path: "a.png", mimeType: "image/png" }], request: async () => ({ status: 200, captions, usageMetadata: { promptTokenCount: 1_000_000, candidatesTokenCount: 1_000_000, thoughtsTokenCount: 0, totalTokenCount: 2_000_000 } }), startServer: async () => ({ stop: vi.fn() }), sleep: vi.fn(), outputDirectory: dir });
    const [results, summary] = await Promise.all([readFile(join(dir, "results.json"), "utf8"), readFile(join(dir, "MODEL_COMPARISON_SUMMARY.md"), "utf8")]);
    expect(results).toContain('"inputTokens": 1000000'); expect(results).toContain('"estimatedCostUsd": 1.75');
    expect(summary).toContain("Estimated cost (Paid Tier rate)"); expect(summary).toContain("Free Tier: this is an estimate, not an actual charge.");
  });

  it("writes blind and revealed markdown reports without sensitive input data", async () => {
    const dir = await makeDir();
    await runComparison({ confirmed: true, images: [{ id: "Image-01", path: "private-name.png", mimeType: "image/png" }], request: async () => ({ status: 200, captions }), startServer: async () => ({ stop: vi.fn() }), sleep: vi.fn(), outputDirectory: dir });
    const [results, csv, html, summary, modelMap, outputs, comparisonSummary] = await Promise.all(["results.json", "comparison.csv", "blind-review.html", "run-summary.md", "model-map.json", "MODEL_CAPTION_OUTPUTS.md", "MODEL_COMPARISON_SUMMARY.md"].map((name) => readFile(join(dir, name), "utf8")));
    expect(html).toContain('<section class="image"><h2>Image-01</h2><div class="models">'); expect(html).toContain("Model A"); expect(html).toContain("Model B"); expect(html).toContain("Model C"); expect(html).not.toContain(FIXED_MODELS[0]); expect(modelMap).toContain(FIXED_MODELS[0]);
    expect(outputs).toContain("# AI Meme Caption Model Outputs"); expect(outputs).toContain("## Image-01"); expect(outputs).toContain(`### ${FIXED_MODELS[0]}`); expect(outputs).toContain("我的选择：[ ]"); expect(outputs).toContain("生成耗时："); expect(outputs).toContain("状态：PASS");
    expect(comparisonSummary).toContain("# AI Meme Caption Model Comparison Summary"); expect(comparisonSummary).toContain("## 我的最终评价"); expect(comparisonSummary).toContain("HTTP 状态分布");
    for (const report of [results, csv, html, summary, modelMap, outputs, comparisonSummary]) { expect(report).not.toContain("private-name.png"); expect(report).not.toMatch(/AIza[\w-]{20,}/); expect(report).not.toMatch(/[A-Za-z0-9+/]{200,}={0,2}/); }
  });

  it("aborts a single request at the configured timeout without retrying", async () => {
    const fetchImpl = vi.fn((_url, init) => new Promise((resolve, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))));
    await expect(postCaptionRequest({ url: "http://local.test/api", body: { imageBase64: "not-recorded" }, fetchImpl, timeoutMs: 1 })).resolves.toEqual({ status: 0, captions: [] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
