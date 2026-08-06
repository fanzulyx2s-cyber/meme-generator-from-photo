import Link from "next/link";

import { InfoCard, SimplePage } from "@/components/simple-page";
import { JsonLd } from "@/components/json-ld";
import { createPageMetadata } from "@/lib/metadata";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const metadata = createPageMetadata({
  title: "Photo Reaction Meme Maker",
  description:
    "Turn a reaction photo into a meme online. Add top and bottom captions, emojis, and stickers, then download a shareable PNG.",
  path: "/photo-reaction-meme-maker",
});

const breadcrumbData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteConfig.url,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Photo Reaction Meme Maker",
      item: absoluteUrl("/photo-reaction-meme-maker"),
    },
  ],
};

export default function PhotoReactionMemeMakerPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <SimplePage
        eyebrow="Reaction Meme Tool"
        title="Make a Reaction Meme from Your Photo"
        description="Upload a reaction photo, add a punchline, preview the result in your browser, and download a PNG for group chats, comments, and social posts."

        breadcrumbs={[{ label: "Photo Reaction Meme Maker", href: "/photo-reaction-meme-maker" }]}
      >
        <InfoCard title="Create a reaction meme in three steps">
          <ol className="list-decimal space-y-3 pl-5">
            <li>Upload a clear JPG, PNG, or WEBP reaction photo.</li>
            <li>Add top and bottom text, then place an emoji or image sticker.</li>
            <li>Choose a square, portrait, or story format and download the PNG.</li>
          </ol>
          <Link
            href="/#generator"
            className="mt-4 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white"
          >
            Open the reaction meme maker
          </Link>
        </InfoCard>

        <InfoCard title="Good reaction meme moments">
          <ul className="list-disc space-y-2 pl-5">
            <li>a surprised face after unexpected news;</li>
            <li>a group-chat expression that needs a caption;</li>
            <li>a pet reaction that already tells half the joke;</li>
            <li>an event photo that becomes funnier with context.</li>
          </ul>
        </InfoCard>

        <InfoCard title="Keep the joke readable">
          <p>
            Use a short setup in the top text and a clear payoff in the bottom
            text. High-contrast captions and a simple crop usually work better
            than a crowded layout.
          </p>
          <p>
            Need more guidance? Read the{" "}
            <Link
              href="/how-to-make-a-meme-from-a-photo"
              className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
            >
              step-by-step photo meme guide
            </Link>
            .
          </p>
        </InfoCard>

        <InfoCard title="Manual editing and optional AI captions">
          <p>
            Manual editing happens in your browser. When the optional AI caption
            feature is available, a compressed copy of the photo is sent to the
            configured AI provider only after you review the notice and choose to
            continue.
          </p>
          <p>
            Review the{" "}
            <Link
              href="/privacy"
              className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
            >
              Privacy Policy
            </Link>{" "}
            before using AI captions with a sensitive image.
          </p>
        </InfoCard>
      </SimplePage>
    </>
  );
}
