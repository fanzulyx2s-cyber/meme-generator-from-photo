import { describe, expect, it } from "vitest";

import {
  MAX_CAPTION_TEXT_LENGTH,
  parseGenerateCaptionsRequest,
  parseGenerateCaptionsResult,
} from "../schema";

const createTestImageBase64 = (): string =>
  Buffer.from("synthetic-test-image-bytes", "utf8").toString("base64");

const validRequest = {
  imageBase64: createTestImageBase64(),
  mimeType: "image/jpeg",
  style: "funny",
};

const validCaptions = Array.from({ length: 5 }, (_, index) => ({
  topText: `TOP LINE ${index + 1}`,
  bottomText: `BOTTOM LINE ${index + 1}`,
}));

describe("AI caption schemas", () => {
  it.each(["funny", "sarcastic", "wholesome", "reaction", "workplace"])(
    "accepts the %s style",
    (style) => {
      expect(parseGenerateCaptionsRequest({ ...validRequest, style }).style).toBe(style);
    },
  );

  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", (mimeType) => {
    expect(parseGenerateCaptionsRequest({ ...validRequest, mimeType }).mimeType).toBe(mimeType);
  });

  it.each([
    [{ ...validRequest, style: "dramatic" }],
    [{ ...validRequest, mimeType: "image/gif" }],
    [{ ...validRequest, imageBase64: "" }],
    [{ ...validRequest, imageBase64: ["data:image/jpeg", "base64,"].join(";") }],
    [{ ...validRequest, unexpected: true }],
  ])("rejects invalid caption requests", (request) => {
    expect(() => parseGenerateCaptionsRequest(request)).toThrow();
  });

  it("does not include image data in a validation error", () => {
    const imageBase64 = createTestImageBase64();

    expect(() => parseGenerateCaptionsRequest({ ...validRequest, imageBase64: `${["data:image/jpeg", "base64"].join(";")},${imageBase64}` }))
      .toThrowError(new Error("Invalid AI caption request."));
  });

  it("accepts exactly five captions and trims text", () => {
    const result = parseGenerateCaptionsResult({
      captions: validCaptions.map((caption) => ({
        topText: `  ${caption.topText}  `,
        bottomText: `  ${caption.bottomText}  `,
      })),
    });

    expect(result.captions).toHaveLength(5);
    expect(result.captions[0]).toEqual({ topText: "TOP LINE 1", bottomText: "BOTTOM LINE 1" });
  });

  it.each([4, 6])("rejects %i captions", (count) => {
    const captions =
      count === 4
        ? validCaptions.slice(0, 4)
        : [...validCaptions, { topText: "TOP LINE 6", bottomText: "BOTTOM LINE 6" }];

    expect(() => parseGenerateCaptionsResult({ captions })).toThrow();
  });

  it.each([
    [{ topText: "", bottomText: "Bottom" }],
    [{ topText: "Top", bottomText: "   " }],
    [{ topText: "x".repeat(MAX_CAPTION_TEXT_LENGTH + 1), bottomText: "Bottom" }],
    [{ topText: "Top", bottomText: "Bottom", extra: true }],
  ])("rejects invalid caption entries", (invalidCaption) => {
    expect(() =>
      parseGenerateCaptionsResult({
        captions: [invalidCaption, ...validCaptions.slice(1)],
      }),
    ).toThrow();
  });
});
