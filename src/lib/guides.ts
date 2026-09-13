export type GuideSummary = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
};

export const guides: GuideSummary[] = [
  {
    slug: "meme-sizes-for-instagram-tiktok-and-stories",
    title: "Meme sizes for Instagram, TikTok, and Stories",
    description:
      "Pick a 1:1, 4:5, or 9:16 canvas, then check the platform's current publishing guidance before you post.",
    eyebrow: "Formats and sharing",
  },
  {
    slug: "make-memes-from-product-photos",
    title: "How to make memes from product photos",
    description:
      "Turn a clear product moment into a joke without hiding the item people need to recognize.",
    eyebrow: "Product photos",
  },
  {
    slug: "write-top-and-bottom-meme-text",
    title: "How to write top and bottom meme text",
    description:
      "Build a readable setup-and-payoff caption that still works at a glance on a phone.",
    eyebrow: "Writing captions",
  },
  {
    slug: "make-a-pet-meme-from-a-photo",
    title: "How to make a pet meme from a photo",
    description:
      "Use your pet's expression, a short observation, and a light edit to make a shareable reaction meme.",
    eyebrow: "Pet memes",
  },
];

export const guidePath = (slug: string) => `/guides/${slug}`;
