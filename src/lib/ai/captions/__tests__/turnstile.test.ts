import { describe, expect, it, vi } from "vitest";

import { createTurnstileVerifier } from "../turnstile";

describe("Turnstile verifier", () => {
  it("fails closed for a missing token or missing secret", async () => {
    await expect(createTurnstileVerifier({ enabled: true, secret: "test" })(undefined)).resolves.toMatchObject({ ok: false });
    await expect(createTurnstileVerifier({ enabled: true })("token")).resolves.toMatchObject({ ok: false });
  });

  it("accepts one matching successful token and rejects reuse", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: "example.test", action: "ai_caption" }), { status: 200 }));
    const verify = createTurnstileVerifier({ enabled: true, secret: "test", expectedHostname: "example.test", fetch });
    await expect(verify("token")).resolves.toEqual({ ok: true });
    await expect(verify("token")).resolves.toMatchObject({ ok: false });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("accepts Cloudflare's official dummy response only when explicitly enabled for Preview testing", async () => {
    const response = new Response(JSON.stringify({ success: true, hostname: "localhost", action: "test" }), { status: 200 });
    const preview = createTurnstileVerifier({ enabled: true, secret: "test", expectedHostname: "localhost", allowTestResponse: true, fetch: vi.fn().mockResolvedValue(response) });

    await expect(preview("XXXX.DUMMY.TOKEN.XXXX")).resolves.toEqual({ ok: true });

    const strict = createTurnstileVerifier({ enabled: true, secret: "test", expectedHostname: "localhost", fetch: vi.fn().mockResolvedValue(response) });
    await expect(strict("XXXX.DUMMY.TOKEN.XXXX")).resolves.toMatchObject({ ok: false });
  });

  it("fails closed for a mismatch or verifier error", async () => {
    const mismatch = createTurnstileVerifier({ enabled: true, secret: "test", fetch: vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: "wrong", action: "wrong" }), { status: 200 })) });
    await expect(mismatch("token")).resolves.toMatchObject({ ok: false });
    await expect(createTurnstileVerifier({ enabled: true, secret: "test", fetch: vi.fn().mockRejectedValue(new Error("offline")) })("token")).resolves.toMatchObject({ ok: false });
  });

  it("fails closed when hostname validation is not configured", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: "example.test", action: "ai_caption" }), { status: 200 }));

    await expect(createTurnstileVerifier({ enabled: true, secret: "test", fetch })("token")).resolves.toMatchObject({ ok: false });
  });

  it("clears its timeout after a verifier failure", async () => {
    vi.useFakeTimers();
    const verify = createTurnstileVerifier({ enabled: true, secret: "test", expectedHostname: "example.test", fetch: vi.fn().mockRejectedValue(new Error("offline")) });

    await expect(verify("token")).resolves.toMatchObject({ ok: false });
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});
