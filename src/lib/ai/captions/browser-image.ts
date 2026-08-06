import type { ImageMimeType } from "./types";

export const MAX_AI_SOURCE_IMAGE_BYTES = 15_000_000;
export const MAX_AI_IMAGE_SIDE = 1600;
export const MAX_AI_IMAGE_BYTES = 1_800_000;

type CompressionAttempt = {
  quality: number;
  width: number;
  height: number;
  attempt: number;
};

export class AiImagePreparationError extends Error {
  readonly code: "INVALID_IMAGE" | "IMAGE_TOO_LARGE" | "UNSUPPORTED_IMAGE_TYPE";

  constructor(code: AiImagePreparationError["code"]) {
    super(code);
    this.name = "AiImagePreparationError";
    this.code = code;
  }
}

export function validateAiImageFile(file: File): asserts file is File & { type: ImageMimeType } {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new AiImagePreparationError("UNSUPPORTED_IMAGE_TYPE");
  }
  if (!file.size || file.size > MAX_AI_SOURCE_IMAGE_BYTES) {
    throw new AiImagePreparationError("IMAGE_TOO_LARGE");
  }
}

export function calculateAiImageDimensions(width: number, height: number) {
  const longestSide = Math.max(width, height);
  if (!longestSide || longestSide <= MAX_AI_IMAGE_SIDE) {
    return { width, height };
  }
  const scale = MAX_AI_IMAGE_SIDE / longestSide;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function calculateNextCompressionAttempt({ quality, width, height, attempt }: CompressionAttempt): CompressionAttempt | null {
  if (quality > 0.5) {
    return { quality: Math.max(0.5, Number((quality - 0.08).toFixed(2))), width, height, attempt: attempt + 1 };
  }
  if (attempt >= 12 || Math.min(width, height) <= 256) {
    return null;
  }
  return { quality: 0.82, width: Math.round(width * 0.85), height: Math.round(height * 0.85), attempt: attempt + 1 };
}

export function stripDataUrlPrefix(value: string): string {
  return value.replace(/^data:[^;]+;base64,/i, "");
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new AiImagePreparationError("INVALID_IMAGE"));
    reader.onload = () => resolve(stripDataUrlPrefix(String(reader.result ?? "")));
    reader.readAsDataURL(blob);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const cleanup = () => URL.revokeObjectURL(url);
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new AiImagePreparationError("INVALID_IMAGE"));
    };
    image.src = url;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new AiImagePreparationError("INVALID_IMAGE"))), "image/jpeg", quality);
  });
}

export async function compressImageForAi(file: File): Promise<{
  imageBase64: string;
  mimeType: "image/jpeg";
  byteSize: number;
  width: number;
  height: number;
}> {
  if (typeof window === "undefined") {
    throw new AiImagePreparationError("INVALID_IMAGE");
  }
  validateAiImageFile(file);
  const image = await loadImage(file);
  const initialDimensions = calculateAiImageDimensions(image.naturalWidth, image.naturalHeight);
  let attempt: CompressionAttempt | null = { quality: 0.82, ...initialDimensions, attempt: 0 };

  while (attempt) {
    const canvas = document.createElement("canvas");
    canvas.width = attempt.width;
    canvas.height = attempt.height;
    const context = canvas.getContext("2d");
    if (!context) {
      canvas.width = 0;
      canvas.height = 0;
      throw new AiImagePreparationError("INVALID_IMAGE");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, attempt.width, attempt.height);
    context.drawImage(image, 0, 0, attempt.width, attempt.height);
    const blob = await canvasToJpegBlob(canvas, attempt.quality);
    canvas.width = 0;
    canvas.height = 0;
    if (blob.size <= MAX_AI_IMAGE_BYTES) {
      return {
        imageBase64: await blobToBase64(blob),
        mimeType: "image/jpeg",
        byteSize: blob.size,
        width: attempt.width,
        height: attempt.height,
      };
    }
    attempt = calculateNextCompressionAttempt(attempt);
  }

  throw new AiImagePreparationError("IMAGE_TOO_LARGE");
}
