import { describe, expect, it } from "vitest";

import { buildMemeCaptionPrompt } from "../prompt";
import type { CaptionStyle } from "../types";

const styles: CaptionStyle[] = ["funny", "sarcastic", "wholesome", "reaction", "workplace"];

describe("buildMemeCaptionPrompt", () => {
  it.each(styles)("builds a prompt for %s", (style) => {
    expect(buildMemeCaptionPrompt(style)).toContain("exactly 5");
  });

  it("requires the expected English caption structure and safety constraints", () => {
    const prompt = buildMemeCaptionPrompt("funny");

    expect(prompt).toContain("topText");
    expect(prompt).toContain("bottomText");
    expect(prompt).toContain("American English");
    expect(prompt).toContain("Do not identify people");
    expect(prompt).toContain("sensitive attributes");
    expect(prompt).not.toContain("data:image");
  });

  it("changes the style guidance but remains stable for the same style", () => {
    expect(buildMemeCaptionPrompt("funny")).toBe(buildMemeCaptionPrompt("funny"));
    expect(buildMemeCaptionPrompt("funny")).not.toBe(buildMemeCaptionPrompt("workplace"));
  });
});
