import Link from "next/link";

import { GuideLinks } from "@/components/guide-links";
import { InfoCard, SimplePage } from "@/components/simple-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "How to Make Memes from Product Photos",
  description:
    "Make a product-photo meme that keeps the item recognizable while giving the caption a clear, useful joke.",
  path: "/guides/make-memes-from-product-photos",
});

export default function ProductPhotoMemeGuidePage() {
  return (
    <SimplePage
      eyebrow="Product photos"
      title="Let the product stay recognizable while the caption does the comedy."
      description="A product photo works as a meme when the viewer can identify the item before the caption asks them to reinterpret it. The goal is a light observation, not a hard sell disguised as a joke."
      breadcrumbs={[
        { label: "Guides", href: "/guides" },
        { label: "How to make memes from product photos", href: "/guides/make-memes-from-product-photos" },
      ]}
    >
      <InfoCard title="Start with a photo that has one clear subject">
        <p>Choose a product photo you have permission to use, with enough open space for a caption. A close crop, an expressive detail, or a familiar before-and-after moment is easier to understand than a busy catalog image.</p>
        <p>If the logo, price, or key feature matters to the context, keep it visible. If it does not, avoid letting it become the visual focal point.</p>
      </InfoCard>

      <InfoCard title="Build the joke around a real customer moment">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Name a small situation the intended audience recognizes, such as preparing for a deadline or trying a new routine.</li>
          <li>Write a short setup that makes the photo feel relevant.</li>
          <li>Use the bottom line as the twist, reaction, or honest admission.</li>
          <li>Read both lines without the photo. If they need a paragraph of explanation, simplify them.</li>
        </ol>
      </InfoCard>

      <InfoCard title="Edit without turning it into an ad">
        <p>Use high-contrast text and only the stickers that add meaning. A small emoji can underline a mood; five stickers can hide the product and weaken the point. Check the free export&apos;s watermark and the selected canvas before you share.</p>
        <p>This is general creative guidance, not legal advice. Check the photo license, any visible trademark, and the publishing platform&apos;s rules before you post.</p>
      </InfoCard>

      <GuideLinks
        links={[
          { href: "/guides/write-top-and-bottom-meme-text", title: "Write top and bottom text", description: "Use a setup and payoff that remains readable." },
          { href: "/guides/meme-sizes-for-instagram-tiktok-and-stories", title: "Choose a canvas", description: "Match the final image to its sharing context." },
        ]}
      />
      <Link href="/#generator" className="w-fit rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800">Edit a product-photo meme</Link>
    </SimplePage>
  );
}
