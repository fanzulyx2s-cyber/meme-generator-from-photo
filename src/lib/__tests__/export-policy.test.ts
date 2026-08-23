import { describe, expect, it } from "vitest";

import {
  FREE_EXPORT_MAX_EDGE,
  getExportPolicy,
  getFreeExportDimensions,
  shouldShowCreatorUpgrade,
} from "../export-policy";

describe("ExportPolicy", () => {
  it("caps free exports at 1080px without changing the aspect ratio", () => {
    expect(FREE_EXPORT_MAX_EDGE).toBe(1080);
    expect(getFreeExportDimensions(1000, 1778)).toEqual({ width: 607, height: 1080 });
    expect(getFreeExportDimensions(1778, 1000)).toEqual({ width: 1080, height: 607 });
  });

  it("does not upscale a canvas already within the free limit", () => {
    expect(getFreeExportDimensions(1000, 1000)).toEqual({ width: 1000, height: 1000 });
  });

  it("caps every supported output ratio while retaining its proportions", () => {
    expect(getFreeExportDimensions(1000, 1000)).toEqual({ width: 1000, height: 1000 });
    expect(getFreeExportDimensions(1000, 1250)).toEqual({ width: 864, height: 1080 });
    expect(getFreeExportDimensions(1000, 1778)).toEqual({ width: 607, height: 1080 });
  });

  it("keeps Creator exports at the original canvas dimensions without a platform watermark", () => {
    expect(getExportPolicy(true, 1000, 1778)).toEqual({
      tier: "creator",
      includePlatformWatermark: false,
      dimensions: { width: 1000, height: 1778 },
    });
  });

  it("keeps free exports watermarked and capped", () => {
    expect(getExportPolicy(false, 1000, 1778)).toEqual({
      tier: "free",
      includePlatformWatermark: true,
      dimensions: { width: 607, height: 1080 },
    });
  });

  it("shows the optional Creator upgrade only after the third successful free export", () => {
    expect(shouldShowCreatorUpgrade(1, false)).toBe(false);
    expect(shouldShowCreatorUpgrade(2, false)).toBe(false);
    expect(shouldShowCreatorUpgrade(3, false)).toBe(true);
    expect(shouldShowCreatorUpgrade(8, true)).toBe(false);
  });
});
