import type { CaptionStyle } from "./types";

const styleGuidance: Record<CaptionStyle, string> = {
  funny: "Use easy-to-understand, light observational humor.",
  sarcastic: "Use playful sarcasm without attacking real people in the image.",
  wholesome: "Use warm, kind, and cute humor.",
  reaction: "Make each option useful as a chat or social media reaction image.",
  workplace: "Use meetings, email, deadlines, or coworkers only when supported by the visible scene.",
};

export function buildMemeCaptionPrompt(style: CaptionStyle): string {
  return [
    "Analyze only the visibly present people, expressions, actions, objects, and setting in the image.",
    "Return exactly 5 distinct English meme caption pairs.",
    "Each pair must contain topText and bottomText.",
    "Use natural, concise American English. Keep each line to about 8 English words or fewer.",
    "Make all five pairs relevant to visible image content and use different joke angles.",
    "Do not explain jokes. Do not output Markdown, hashtags, or emoji.",
    "Do not identify people, name real people, or infer sensitive attributes such as race, religion, health, disability, sexual orientation, or political views.",
    "Do not generate sexual, adult, hateful, harassing, severely violent, illegal, or dangerous content.",
    "Return only JSON that matches the agreed caption schema.",
    `Style: ${style}. ${styleGuidance[style]}`,
  ].join("\n");
}
