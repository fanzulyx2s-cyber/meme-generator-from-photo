import sharp from "sharp";

import { CaptionProviderError } from "./caption-provider";
import type { ImageMimeType } from "./types";

export const MAX_SERVER_IMAGE_SIDE = 4096;
export const MAX_SERVER_IMAGE_PIXELS = 16_000_000;

function detectImageMimeType(bytes: Buffer): ImageMimeType | undefined {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return undefined;
}

function invalidImage(): CaptionProviderError {
  return new CaptionProviderError({ code: "INVALID_IMAGE", message: "The image data is invalid." });
}

function imageTooLarge(): CaptionProviderError {
  return new CaptionProviderError({ code: "IMAGE_TOO_LARGE", message: "The image is too large." });
}

export async function validateServerImage(bytes: Buffer, declaredMimeType: ImageMimeType): Promise<void> {
  const detectedMimeType = detectImageMimeType(bytes);
  if (!detectedMimeType || detectedMimeType !== declaredMimeType) {
    throw new CaptionProviderError({ code: "UNSUPPORTED_IMAGE_TYPE", message: "The image type is not supported." });
  }

  try {
    const metadata = await sharp(bytes, { animated: true, failOn: "error", limitInputPixels: MAX_SERVER_IMAGE_PIXELS }).metadata();
    const { width, height, pages } = metadata;
    if (!width || !height || width <= 0 || height <= 0) throw invalidImage();
    if (width > MAX_SERVER_IMAGE_SIDE || height > MAX_SERVER_IMAGE_SIDE || width * height > MAX_SERVER_IMAGE_PIXELS) throw imageTooLarge();
    if (pages && pages > 1) throw invalidImage();
    await sharp(bytes, { failOn: "error", limitInputPixels: MAX_SERVER_IMAGE_PIXELS }).toBuffer();
  } catch (error) {
    if (error instanceof CaptionProviderError) throw error;
    if (error instanceof Error && /pixel limit/i.test(error.message)) throw imageTooLarge();
    throw invalidImage();
  }
}
