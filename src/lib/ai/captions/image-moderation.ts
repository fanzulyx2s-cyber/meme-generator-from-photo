import type { ImageMimeType } from "./types";

export type ModerationDecision = "allow" | "block" | "unavailable";
export type ImageModerationResult = { decision: ModerationDecision; categories?: readonly string[] };
export type ImageModerationProvider = { moderate: (image: Buffer, mimeType: ImageMimeType) => Promise<ImageModerationResult> };

export class GoogleVisionModerationProvider implements ImageModerationProvider {
  constructor(private readonly options: { apiKey?: string; fetch?: typeof globalThis.fetch; timeoutMs?: number }) {}
  async moderate(image: Buffer, mimeType: ImageMimeType): Promise<ImageModerationResult> {
    void mimeType;
    if (!this.options.apiKey) return { decision: "unavailable" };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 5_000);
    try {
      const response = await (this.options.fetch ?? globalThis.fetch)(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(this.options.apiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requests: [{ image: { content: image.toString("base64") }, features: [{ type: "SAFE_SEARCH_DETECTION" }] }] }), signal: controller.signal });
      const body: unknown = await response.json();
      const safe = typeof body === "object" && body !== null ? (body as { responses?: Array<{ safeSearchAnnotation?: Record<string, unknown> }> }).responses?.[0]?.safeSearchAnnotation : undefined;
      if (!response.ok || !safe) return { decision: "unavailable" };
      const level = (name: string) => typeof safe[name] === "string" ? safe[name] : "UNKNOWN";
      const blocked = [level("adult"), level("violence")].some((value) => value === "LIKELY" || value === "VERY_LIKELY") || level("racy") === "VERY_LIKELY";
      const unknown = ["adult", "racy", "violence", "medical", "spoof"].some((name) => level(name) === "UNKNOWN");
      return { decision: blocked || unknown ? "block" : "allow", categories: ["adult", "racy", "violence", "medical", "spoof"] };
    } catch {
      return { decision: "unavailable" };
    } finally {
      clearTimeout(timeout);
    }
  }
}
