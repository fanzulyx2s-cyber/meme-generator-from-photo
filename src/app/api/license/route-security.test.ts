import { afterEach, describe, expect, it, vi } from "vitest";

const callCreemLicenseApi = vi.hoisted(() => vi.fn());

vi.mock("@/lib/creem-license", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/creem-license")>();
  return { ...actual, callCreemLicenseApi };
});

import { POST as activate } from "./activate/route";
import { POST as deactivate } from "./deactivate/route";
import { POST as validate } from "./validate/route";

const routes = [activate, validate, deactivate];

afterEach(() => {
  callCreemLicenseApi.mockReset();
});

describe("license routes request guards", () => {
  it("rejects non-JSON requests before any license processing", async () => {
    for (const route of routes) {
      const response = await route(
        new Request("http://localhost/api/license", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: "not-json",
        }),
      );

      expect(response.status).toBe(415);
    }

    expect(callCreemLicenseApi).not.toHaveBeenCalled();
  });

  it("rejects extra public fields without contacting a provider", async () => {
    const response = await activate(
      new Request("http://localhost/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey: "synthetic-license",
          instanceName: "synthetic-browser",
          action: "validate",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ success: false });
    expect(callCreemLicenseApi).not.toHaveBeenCalled();
  });
});
