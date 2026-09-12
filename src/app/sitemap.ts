import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site-config";

const lastModified = new Date("2026-09-12T00:00:00.000Z");

const pages: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/photo-reaction-meme-maker", changeFrequency: "monthly", priority: 0.8 },
  { path: "/no-watermark-meme-maker", changeFrequency: "monthly", priority: 0.8 },
  { path: "/how-to-make-a-meme-from-a-photo", changeFrequency: "monthly", priority: 0.8 },
  { path: "/guides", changeFrequency: "weekly", priority: 0.8 },
  { path: "/guides/meme-sizes-for-instagram-tiktok-and-stories", changeFrequency: "monthly", priority: 0.7 },
  { path: "/guides/make-memes-from-product-photos", changeFrequency: "monthly", priority: 0.7 },
  { path: "/guides/write-top-and-bottom-meme-text", changeFrequency: "monthly", priority: 0.7 },
  { path: "/guides/make-a-pet-meme-from-a-photo", changeFrequency: "monthly", priority: 0.7 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/acceptable-use", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refund", changeFrequency: "yearly", priority: 0.3 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  }));
}
