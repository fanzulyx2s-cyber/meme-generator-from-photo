export type TurnstileVerification = { ok: true } | { ok: false; code: "TURNSTILE_REQUIRED" | "TURNSTILE_FAILED" };

export type TurnstileVerifier = (token: string | undefined) => Promise<TurnstileVerification>;

export function createTurnstileVerifier({ enabled, secret, expectedHostname, fetch = globalThis.fetch }: { enabled: boolean; secret?: string; expectedHostname?: string; fetch?: typeof globalThis.fetch }): TurnstileVerifier {
  const used = new Set<string>();
  return async (token) => {
    if (!enabled) return { ok: true };
    if (!secret) return { ok: false, code: "TURNSTILE_REQUIRED" };
    if (!token || token.length > 4096 || used.has(token)) return { ok: false, code: "TURNSTILE_FAILED" };
    used.add(token);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);
      const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ secret, response: token }), signal: controller.signal });
      clearTimeout(timeout);
      const body: unknown = await response.json();
      const record = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
      return response.ok && record.success === true && (!expectedHostname || record.hostname === expectedHostname) && record.action === "ai_caption" ? { ok: true } : { ok: false, code: "TURNSTILE_FAILED" };
    } catch {
      return { ok: false, code: "TURNSTILE_FAILED" };
    }
  };
}
