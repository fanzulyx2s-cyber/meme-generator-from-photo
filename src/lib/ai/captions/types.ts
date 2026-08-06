export const captionStyles = [
  "funny",
  "sarcastic",
  "wholesome",
  "reaction",
  "workplace",
] as const;

export type CaptionStyle = (typeof captionStyles)[number];

export const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export type ImageMimeType = (typeof imageMimeTypes)[number];

export type MemeCaption = {
  topText: string;
  bottomText: string;
};

export type CaptionUsageMetadata = {
  promptTokenCount: number;
  candidatesTokenCount: number;
  thoughtsTokenCount: number;
  totalTokenCount: number;
};

export type GenerateCaptionsInput = {
  imageBase64: string;
  mimeType: ImageMimeType;
  style: CaptionStyle;
};

export type GenerateCaptionsResult = {
  captions: MemeCaption[];
  usageMetadata?: CaptionUsageMetadata;
};

export const captionProviderNames = ["mock", "gemini", "openai", "qwen"] as const;

export type CaptionProviderName = (typeof captionProviderNames)[number];

export const aiCaptionErrorCodes = [
  "AI_DISABLED",
  "MISSING_CONFIGURATION",
  "INVALID_IMAGE",
  "IMAGE_TOO_LARGE",
  "UNSUPPORTED_IMAGE_TYPE",
  "INVALID_STYLE",
  "CONTENT_NOT_ALLOWED",
  "PROVIDER_TIMEOUT",
  "PROVIDER_RATE_LIMITED",
  "INVALID_PROVIDER_RESPONSE",
  "AI_GENERATION_FAILED",
  "UNSUPPORTED_PROVIDER",
] as const;

export type AiCaptionErrorCode = (typeof aiCaptionErrorCodes)[number];
