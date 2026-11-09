// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCreatorLicense } from "./use-creator-license";

const { trackCreatorConversion } = vi.hoisted(() => ({
  trackCreatorConversion: vi.fn(),
}));

vi.mock("../lib/analytics/ga4", () => ({ trackCreatorConversion }));

describe("useCreatorLicense analytics", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("records activation only after the license API activates this browser", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            instanceId: "synthetic-instance",
            activation: 1,
            activationLimit: 3,
            expiresAt: null,
          }),
          { status: 200 },
        ),
      ),
    );
    const { result } = renderHook(() => useCreatorLicense());

    await act(async () => {
      await result.current.activateLicense("synthetic-license");
    });

    expect(result.current.isCreator).toBe(true);
    expect(trackCreatorConversion).toHaveBeenCalledWith("creator_license_activated");
  });

  it("records activation failures without forwarding the error text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: false, message: "synthetic failure" }),
      { status: 400 },
    )));
    const { result } = renderHook(() => useCreatorLicense());

    await act(async () => {
      await result.current.activateLicense("synthetic-license");
    });

    expect(trackCreatorConversion).toHaveBeenCalledWith("creator_license_activation_failed");
    expect(trackCreatorConversion).not.toHaveBeenCalledWith(
      "creator_license_activation_failed",
      expect.anything(),
    );
  });
});
