export type TurnstileVerification = { ok: true } | { ok: false; code: "TURNSTILE_REQUIRED" | "TURNSTILE_FAILED" };

export type TurnstileVerifier = (token: string | undefined) => Promise<TurnstileVerification>;

export function createTurnstileVerifier({ enabled, secret, expectedHostname, allowTestResponse = false, fetch = globalThis.fetch }: { enabled: boolean; secret?: string; expectedHostname?: string; allowTestResponse?: boolean; fetch?: typeof globalThis.fetch }): TurnstileVerifier {
  const used = new Set<string>();
  return async (token) => {
    if (!enabled) return { ok: true };
    if (!secret || !expectedHostname) return { ok: false, code: "TURNSTILE_REQUIRED" };
    if (!token || token.length > 4096 || used.has(token)) return { ok: false, code: "TURNSTILE_FAILED" };
    used.add(token);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ secret, response: token }), signal: controller.signal });
      const body: unknown = await response.json();
      const record = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
      const matchesConfiguredResponse = record.hostname === expectedHostname && record.action === "ai_caption";
      const matchesOfficialPreviewDummy = allowTestResponse && expectedHostname === "localhost" && record.hostname === "localhost" && record.action === "test";
      return response.ok && record.success === true && (matchesConfiguredResponse || matchesOfficialPreviewDummy) ? { ok: true } : { ok: false, code: "TURNSTILE_FAILED" };
    } catch {
      return { ok: false, code: "TURNSTILE_FAILED" };
    } finally {
      clearTimeout(timeout);
    }
  };
}
