import { describe, expect, it, vi } from "vitest";

import { MockCaptionProvider } from "../providers/mock-caption-provider";
import { parseGenerateCaptionsResult } from "../schema";
import type { CaptionStyle } from "../types";

const styles: CaptionStyle[] = ["funny", "sarcastic", "wholesome", "reaction", "workplace"];
const createTestImageBase64 = (): string =>
  Buffer.from("synthetic-test-image-bytes", "utf8").toString("base64");
const validInput = {
  imageBase64: createTestImageBase64(),
  mimeType: "image/jpeg" as const,
  style: "funny" as const,
};

describe("MockCaptionProvider", () => {
  it("does not call the network", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await new MockCaptionProvider().generateCaptions(validInput);

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it.each(styles)("returns five valid captions for %s", async (style) => {
    const result = await new MockCaptionProvider().generateCaptions({ ...validInput, style });

    expect(result.captions).toHaveLength(5);
    expect(result.captions.every((caption) => caption.topText && caption.bottomText)).toBe(true);
    expect(parseGenerateCaptionsResult(result)).toEqual(result);
  });

  it("rejects invalid input without echoing image data", async () => {
    const imageBase64 = createTestImageBase64();

    const error = await new MockCaptionProvider()
      .generateCaptions({ ...validInput, imageBase64: `${["data:image/jpeg", "base64"].join(";")},${imageBase64}` })
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Invalid AI caption request.");
    expect((error as Error).message).not.toContain(imageBase64);
  });
});
