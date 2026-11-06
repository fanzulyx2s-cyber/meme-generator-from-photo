import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ callCreemLicenseApi: vi.fn() }));

vi.mock("@/lib/creem-license", () => ({
  callCreemLicenseApi: mocks.callCreemLicenseApi,
  normalizeLicenseKey: (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null,
  normalizeInstanceId: (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null,
  normalizeInstanceName: (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null,
}));

import { MAX_LICENSE_REQUEST_BYTES } from "../../../lib/license-request";
import { POST as activate } from "./activate/route";
import { POST as deactivate } from "./deactivate/route";
import { POST as validate } from "./validate/route";

const routes = [activate, validate, deactivate];
const jsonHeaders = { "Content-Type": "application/json" };

function request(body: unknown, contentType = "application/json") {
  return new Request("http://localhost/api/license", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  mocks.callCreemLicenseApi.mockReset();
});

describe("License API request boundaries", () => {
  it("rejects missing or non-JSON content before contacting Creem", async () => {
    for (const route of routes) {
      expect((await route(new Request("http://localhost/api/license", { method: "POST", body: "{}" }))).status).toBe(415);
      expect((await route(request({}, "text/plain"))).status).toBe(415);
    }
    expect(mocks.callCreemLicenseApi).not.toHaveBeenCalled();
  });

  it("rejects declared and streamed oversized bodies before contacting Creem", async () => {
    const declared = new Request("http://localhost/api/license", {
      method: "POST",
      headers: { ...jsonHeaders, "Content-Length": String(MAX_LICENSE_REQUEST_BYTES + 1) },
      body: "{}",
    });
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("x".repeat(MAX_LICENSE_REQUEST_BYTES + 1)));
        controller.close();
      },
    });
    const actual = new Request("http://localhost/api/license", {
      method: "POST",
      headers: jsonHeaders,
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    expect((await activate(declared)).status).toBe(413);
    expect((await activate(actual)).status).toBe(413);
    expect(mocks.callCreemLicenseApi).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON before contacting Creem", async () => {
    const response = await validate(new Request("http://localhost/api/license", { method: "POST", headers: jsonHeaders, body: "{" }));
    expect(response.status).toBe(400);
    expect(mocks.callCreemLicenseApi).not.toHaveBeenCalled();
  });

  it("accepts JSON with a charset and calls Creem only after bounded parsing", async () => {
    mocks.callCreemLicenseApi.mockResolvedValue({
      success: true,
      status: "active",
      instanceId: "instance-1",
      activation: 1,
      activationLimit: 3,
      expiresAt: null,
    });

    const response = await activate(request(
      { licenseKey: "test-license", instanceName: "Browser" },
      "application/json; charset=utf-8",
    ));

    expect(response.status).toBe(200);
    expect(mocks.callCreemLicenseApi).toHaveBeenCalledOnce();
  });
});
