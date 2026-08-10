import { describe, expect, it } from "vitest";

import {
  calculateMemeTextLayout,
  getMemeTextLayoutPreset,
} from "../meme-text-layout";

const measureText = (value: string, fontSize: number) =>
  Array.from(value).length * fontSize * 0.58;

const shortCaption = "THIS IS FINE";
const regressionTopCaption = "CHECKING IF THEY BRUSHED THEIR TEETH";
const regressionBottomCaption = "BEFORE MORNING COFFEE";
const longCaption =
  "WHEN YOUR UNEXPECTEDLYLONGWORDMEETS PUNCTUATION, AND THE PHOTO STILL NEEDS A MEME";

describe("meme text auto layout", () => {
  it("uses the revised normalized presets for every ratio and frame state", () => {
    expect(getMemeTextLayoutPreset("square", true)).toMatchObject({
      maxTextWidth: 0.7488,
      topSafeInset: 0.07,
      bottomSafeInset: 0.09,
      initialFontSize: 0.062,
      minFontSize: 0.038,
      maxFontSize: 0.068,
    });
    expect(getMemeTextLayoutPreset("portrait", false)).toMatchObject({
      maxTextWidth: 0.8,
      topSafeInset: 0.045,
      bottomSafeInset: 0.065,
      initialFontSize: 0.055,
      minFontSize: 0.034,
      maxFontSize: 0.061,
    });
    expect(getMemeTextLayoutPreset("story", true)).toMatchObject({
      topSafeInset: 0.05,
      bottomSafeInset: 0.07,
      initialFontSize: 0.048,
      minFontSize: 0.03,
      maxFontSize: 0.054,
    });
    expect(getMemeTextLayoutPreset("story", true).maxTextWidth).toBeCloseTo(0.7872);
  });

  it.each([
    ["square", 1000],
    ["portrait", 1250],
    ["story", 1778],
  ] as const)("recomputes bottom placement from the current %s canvas height", (ratio, canvasHeight) => {
    const top = calculateMemeTextLayout({
      text: regressionTopCaption,
      position: "top",
      ratio,
      frameEnabled: true,
      canvasWidth: 1000,
      canvasHeight,
      measureText,
    });
    const bottom = calculateMemeTextLayout({
      text: regressionBottomCaption,
      position: "bottom",
      ratio,
      frameEnabled: true,
      canvasWidth: 1000,
      canvasHeight,
      measureText,
    });

    expect(top.bounds.y).toBeGreaterThanOrEqual(top.safeBounds.top);
    expect(bottom.bounds.y + bottom.bounds.height).toBeLessThanOrEqual(
      canvasHeight - bottom.bottomSafeInset,
    );
    expect(bottom.bounds.y).toBeGreaterThan(canvasHeight * 0.65);
  });

  it("uses visibly smaller initial font sizes for taller ratios", () => {
    const square = calculateMemeTextLayout({ text: shortCaption, position: "top", ratio: "square", frameEnabled: true, canvasWidth: 1000, canvasHeight: 1000, measureText });
    const portrait = calculateMemeTextLayout({ text: shortCaption, position: "top", ratio: "portrait", frameEnabled: true, canvasWidth: 1000, canvasHeight: 1250, measureText });
    const story = calculateMemeTextLayout({ text: shortCaption, position: "top", ratio: "story", frameEnabled: true, canvasWidth: 1000, canvasHeight: 1778, measureText });

    expect(square.initialFontSize).toBeGreaterThan(portrait.initialFontSize);
    expect(portrait.initialFontSize).toBeGreaterThan(story.initialFontSize);
    expect(portrait.initialFontSize / square.initialFontSize).toBeCloseTo(0.89, 2);
    expect(story.initialFontSize / square.initialFontSize).toBeCloseTo(0.77, 2);
  });

  it.each([
    ["square", true],
    ["square", false],
    ["portrait", true],
    ["portrait", false],
    ["story", true],
    ["story", false],
  ] as const)("keeps short captions inside the %s safe area with frame=%s", (ratio, frameEnabled) => {
    const height = ratio === "square" ? 1000 : ratio === "portrait" ? 1250 : 1778;
    const top = calculateMemeTextLayout({
      text: shortCaption,
      position: "top",
      ratio,
      frameEnabled,
      canvasWidth: 1000,
      canvasHeight: height,
      measureText,
    });
    const bottom = calculateMemeTextLayout({
      text: shortCaption,
      position: "bottom",
      ratio,
      frameEnabled,
      canvasWidth: 1000,
      canvasHeight: height,
      measureText,
    });

    expect(top.lines).toHaveLength(1);
    expect(bottom.lines).toHaveLength(1);
    [top, bottom].forEach((layout) => {
      expect(layout.bounds.x).toBeGreaterThanOrEqual(layout.safeBounds.left);
      expect(layout.bounds.x + layout.bounds.width).toBeLessThanOrEqual(layout.safeBounds.right);
      expect(layout.bounds.y).toBeGreaterThanOrEqual(layout.safeBounds.top);
      expect(layout.bounds.y + layout.bounds.height).toBeLessThanOrEqual(layout.safeBounds.bottom);
      expect(layout.strokeWidth).toBeGreaterThanOrEqual(layout.fontSize * 0.08);
      expect(layout.strokeWidth).toBeLessThanOrEqual(layout.fontSize * 0.1);
    });
  });

  it.each(["square", "portrait", "story"] as const)(
    "wraps and shrinks long punctuation captions independently for %s",
    (ratio) => {
      const height = ratio === "square" ? 1000 : ratio === "portrait" ? 1250 : 1778;
      const top = calculateMemeTextLayout({
        text: longCaption,
        position: "top",
        ratio,
        frameEnabled: true,
        canvasWidth: 1000,
        canvasHeight: height,
        measureText,
      });
      const bottom = calculateMemeTextLayout({
        text: `${longCaption} ${longCaption}`,
        position: "bottom",
        ratio,
        frameEnabled: false,
        canvasWidth: 1000,
        canvasHeight: height,
        measureText,
      });

      expect(top.lines.length).toBeLessThanOrEqual(3);
      expect(bottom.lines.length).toBeLessThanOrEqual(3);
      expect(top.fontSize).toBeLessThanOrEqual(top.initialFontSize);
      expect(bottom.fontSize).toBeLessThanOrEqual(bottom.initialFontSize);
      expect(top.lines.join(" ")).toContain("PUNCTUATION,");
      expect(bottom.bounds.y + bottom.bounds.height).toBeLessThanOrEqual(
        bottom.safeBounds.bottom,
      );
    },
  );
});
