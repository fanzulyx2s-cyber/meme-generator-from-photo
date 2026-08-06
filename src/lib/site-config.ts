export const siteConfig = {
  name: "MemePhoto AI",
  url: "https://memephotoai.com",
  defaultTitle: "Meme Maker from Photo – Create & Download Memes | MemePhoto AI",
  titleTemplate: "%s | MemePhoto AI",
  description:
    "Turn any photo into a meme online. Add captions, emojis, and stickers, preview it in your browser, and download a PNG. No account required.",
  supportEmail: "support@memephotoai.com",
  ogImage: "/assets/examples/couple-demo.png",
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
