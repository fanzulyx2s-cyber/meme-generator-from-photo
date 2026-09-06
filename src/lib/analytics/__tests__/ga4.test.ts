// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { initializeGa4, trackCreatorConversion } from "../ga4";

describe("GA4 analytics", () => {
  afterEach(() => {
    document.head.innerHTML = "";
    delete window.dataLayer;
    vi.unstubAllEnvs();
  });

  it("does nothing without a valid measurement ID", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");

    initializeGa4();
    trackCreatorConversion("creator_upgrade_shown");

    expect(document.querySelector("script[data-ga4]")).toBeNull();
    expect(window.dataLayer).toBeUndefined();
  });

  it("initializes once and queues only typed anonymous data", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-ABC1234");

    initializeGa4();
    initializeGa4();
    trackCreatorConversion("creator_checkout_clicked", {
      source: "pricing_page",
    });

    expect(document.querySelectorAll("script[data-ga4]")).toHaveLength(1);
    expect(window.dataLayer?.at(-1)).toEqual([
      "event",
      "creator_checkout_clicked",
      { source: "pricing_page" },
    ]);
  });
});
