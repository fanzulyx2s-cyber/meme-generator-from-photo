// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  calculateAiImageDimensions,
  calculateNextCompressionAttempt,
  compressImageForAi,
  stripDataUrlPrefix,
  validateAiImageFile,
} from "../browser-image";

const createImageFile = (type: string, size = 16): File =>
  new File([new Uint8Array(size)], "synthetic-image", { type });

describe("browser image preparation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("accepts supported image files and rejects unsupported types", () => {
    expect(() => validateAiImageFile(createImageFile("image/jpeg"))).not.toThrow();
    expect(() => validateAiImageFile(createImageFile("image/png"))).not.toThrow();
    expect(() => validateAiImageFile(createImageFile("image/webp"))).not.toThrow();
    expect(() => validateAiImageFile(createImageFile("image/gif"))).toThrow("UNSUPPORTED_IMAGE_TYPE");
  });

  it("keeps image proportions without enlarging smaller images", () => {
    expect(calculateAiImageDimensions(3200, 1600)).toEqual({ width: 1600, height: 800 });
    expect(calculateAiImageDimensions(400, 200)).toEqual({ width: 400, height: 200 });
  });

  it("lowers quality before scaling dimensions and has a stopping condition", () => {
    expect(calculateNextCompressionAttempt({ quality: 0.82, width: 1600, height: 1200, attempt: 0 })).toMatchObject({ quality: 0.74, width: 1600, height: 1200 });
    expect(calculateNextCompressionAttempt({ quality: 0.5, width: 1600, height: 1200, attempt: 4 })).toMatchObject({ quality: 0.82, width: 1360, height: 1020 });
    expect(calculateNextCompressionAttempt({ quality: 0.5, width: 360, height: 270, attempt: 12 })).toBeNull();
  });

  it("removes only a data URL prefix from encoded output", () => {
    const dataUrlPrefix = ["data:image/jpeg", "base64,"].join(";");
    expect(stripDataUrlPrefix(dataUrlPrefix)).toBe("");
    expect(stripDataUrlPrefix("synthetic-base64-value")).toBe("synthetic-base64-value");
  });

  it("creates a temporary object URL, revokes it, and returns JPEG data without a prefix", async () => {
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:synthetic"), revokeObjectURL });
    vi.stubGlobal("Image", class {
      naturalWidth = 2000;
      naturalHeight = 1000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) { this.onload?.(); }
    });
    const context = { fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => context,
      toBlob: (callback: (blob: Blob) => void) => callback(new Blob([new Uint8Array([1, 2])], { type: "image/jpeg" })),
    } as unknown as HTMLCanvasElement);

    const result = await compressImageForAi(createImageFile("image/png"));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:synthetic");
    expect(result).toMatchObject({ mimeType: "image/jpeg", width: 1600, height: 800 });
    expect(result.imageBase64).not.toMatch(/^data:/);
  });
});
