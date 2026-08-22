import { z } from "zod";

import { captionStyles, imageMimeTypes } from "./types";
import type { GenerateCaptionsInput, GenerateCaptionsResult } from "./types";

export const MAX_IMAGE_BYTES = 2_000_000;
export const MAX_IMAGE_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;
export const MAX_AI_CAPTION_REQUEST_BYTES = 3_000_000;
export const MAX_CAPTION_TEXT_LENGTH = 100;

export const captionStyleSchema = z.enum(captionStyles);
export const imageMimeTypeSchema = z.enum(imageMimeTypes);

export const memeCaptionSchema = z
  .object({
    topText: z.string().trim().min(1).max(MAX_CAPTION_TEXT_LENGTH),
    bottomText: z.string().trim().min(1).max(MAX_CAPTION_TEXT_LENGTH),
  })
  .strict();

export const generateCaptionsRequestSchema = z
  .object({
    imageBase64: z
      .string()
      .trim()
      .min(1)
      .max(MAX_IMAGE_BASE64_LENGTH)
      .refine((value) => !/^data:image\//i.test(value)),
    mimeType: imageMimeTypeSchema,
    style: captionStyleSchema,
  })
  .strict();

export const generateCaptionsResultSchema = z
  .object({
    captions: z.array(memeCaptionSchema).length(5),
  })
  .strict();

export const geminiCaptionResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    captions: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          topText: { type: "string" },
          bottomText: { type: "string" },
        },
        required: ["topText", "bottomText"],
      },
    },
  },
  required: ["captions"],
} as const;

export function parseGenerateCaptionsRequest(input: unknown): GenerateCaptionsInput {
  const parsed = generateCaptionsRequestSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid AI caption request.");
  }

  return parsed.data;
}

export function parseGenerateCaptionsResult(input: unknown): GenerateCaptionsResult {
  const parsed = generateCaptionsResultSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid AI caption response.");
  }

  return parsed.data;
}
