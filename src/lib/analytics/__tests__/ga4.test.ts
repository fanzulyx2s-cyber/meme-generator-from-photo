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

  it("records anonymous export funnel events without user content", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-ABC1234");

    trackCreatorConversion("free_export_success", { export_number: 2 });
    trackCreatorConversion("free_export_limit_reached");

    const events = window.dataLayer;

    expect(events).toHaveLength(4);
    expect(events?.[0]?.[0]).toBe("js");
    expect(events?.[0]?.[1]).toBeInstanceOf(Date);
    expect(Array.from(events?.[1] ?? [])).toEqual([
      "config",
      "G-ABC1234",
      { send_page_view: true },
    ]);
    expect(Array.from(events?.[2] ?? [])).toEqual([
      "event",
      "free_export_success",
      { export_number: 2 },
    ]);
    expect(Array.from(events?.[3] ?? [])).toEqual([
      "event",
      "free_export_limit_reached",
      {},
    ]);
  });
});
