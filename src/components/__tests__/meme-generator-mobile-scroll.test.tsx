// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { scrollPreviewIntoViewOnMobile } from "../mobile-preview-scroll";

const setMediaQueries = (mobile: boolean, reducedMotion = false) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches:
        query === "(max-width: 767px)" ? mobile : reducedMotion,
    })),
  );
};

describe("scrollPreviewIntoViewOnMobile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not scroll when the viewport is desktop sized", () => {
    const scrollIntoView = vi.fn();
    setMediaQueries(false);

    scrollPreviewIntoViewOnMobile({ scrollIntoView });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("smoothly scrolls the preview on mobile", () => {
    const scrollIntoView = vi.fn();
    setMediaQueries(true);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    scrollPreviewIntoViewOnMobile({ scrollIntoView });

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("uses an immediate scroll when reduced motion is preferred", () => {
    const scrollIntoView = vi.fn();
    setMediaQueries(true, true);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    scrollPreviewIntoViewOnMobile({ scrollIntoView });

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("safely ignores a missing preview element", () => {
    setMediaQueries(true);

    expect(() => scrollPreviewIntoViewOnMobile(null)).not.toThrow();
  });
});
