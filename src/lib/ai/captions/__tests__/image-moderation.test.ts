import { describe, expect, it, vi } from "vitest";

import { GoogleVisionModerationProvider } from "../image-moderation";

const annotation = (values: Record<string, string>) => new Response(JSON.stringify({ responses: [{ safeSearchAnnotation: values }] }), { status: 200 });

describe("GoogleVisionModerationProvider", () => {
  it("allows a fully known safe annotation", async () => {
    const provider = new GoogleVisionModerationProvider({ apiKey: "test", fetch: vi.fn().mockResolvedValue(annotation({ adult: "VERY_UNLIKELY", racy: "VERY_UNLIKELY", violence: "VERY_UNLIKELY", medical: "POSSIBLE", spoof: "POSSIBLE" })) });
    await expect(provider.moderate(Buffer.from([1]), "image/png")).resolves.toMatchObject({ decision: "allow" });
  });

  it.each(["LIKELY", "VERY_LIKELY"])("blocks adult %s", async (level) => {
    const provider = new GoogleVisionModerationProvider({ apiKey: "test", fetch: vi.fn().mockResolvedValue(annotation({ adult: level, racy: "UNLIKELY", violence: "UNLIKELY", medical: "UNLIKELY", spoof: "UNLIKELY" })) });
    await expect(provider.moderate(Buffer.from([1]), "image/png")).resolves.toMatchObject({ decision: "block" });
  });

  it("fails closed for unknown annotations and unavailable responses", async () => {
    const unknown = new GoogleVisionModerationProvider({ apiKey: "test", fetch: vi.fn().mockResolvedValue(annotation({ adult: "UNKNOWN", racy: "UNLIKELY", violence: "UNLIKELY", medical: "UNLIKELY", spoof: "UNLIKELY" })) });
    await expect(unknown.moderate(Buffer.from([1]), "image/png")).resolves.toMatchObject({ decision: "block" });
    await expect(new GoogleVisionModerationProvider({ apiKey: "test", fetch: vi.fn().mockRejectedValue(new Error("offline")) }).moderate(Buffer.from([1]), "image/png")).resolves.toMatchObject({ decision: "unavailable" });
  });
});
