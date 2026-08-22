import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { validateServerImage } from "../server-image";

async function makeImage(format: "jpeg" | "png" | "webp", width = 4, height = 3): Promise<Buffer> {
  const image = sharp({ create: { width, height, channels: 3, background: "#ffffff" } });
  return format === "jpeg" ? image.jpeg().toBuffer() : format === "png" ? image.png().toBuffer() : image.webp().toBuffer();
}

describe("server image validation", () => {
  it.each([
    ["image/jpeg", "jpeg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ] as const)("accepts a valid %s image", async (mimeType, format) => {
    await expect(validateServerImage(await makeImage(format), mimeType)).resolves.toBeUndefined();
  });

  it("rejects a declared MIME type that does not match the file signature", async () => {
    await expect(validateServerImage(await makeImage("png"), "image/jpeg")).rejects.toMatchObject({ code: "UNSUPPORTED_IMAGE_TYPE" });
  });

  it("rejects a truncated image with a valid-looking signature", async () => {
    await expect(validateServerImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).rejects.toMatchObject({ code: "INVALID_IMAGE" });
  });

  it("rejects an image wider than 4096 pixels", async () => {
    await expect(validateServerImage(await makeImage("jpeg", 4097, 1), "image/jpeg")).rejects.toMatchObject({ code: "IMAGE_TOO_LARGE" });
  });

  it("rejects an image above the 16MP pixel limit", async () => {
    await expect(validateServerImage(await makeImage("jpeg", 4000, 4001), "image/jpeg")).rejects.toMatchObject({ code: "IMAGE_TOO_LARGE" });
  }, 20_000);
});
