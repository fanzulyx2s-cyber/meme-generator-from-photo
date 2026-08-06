import Link from "next/link";

import { InfoCard, SimplePage } from "@/components/simple-page";
import { JsonLd } from "@/components/json-ld";
import { createPageMetadata } from "@/lib/metadata";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const metadata = createPageMetadata({
  title: "How to Make a Meme from a Photo",
  description:
    "Follow a simple guide to upload a photo, write meme captions, add stickers, choose a format, and download a PNG online.",
  path: "/how-to-make-a-meme-from-a-photo",
});

const howToData = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to make a meme from a photo",
  description:
    "Upload a photo, add captions and stickers, preview the meme, and download a PNG with MemePhoto AI.",
  totalTime: "PT3M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Upload a photo",
      text: "Choose a JPG, PNG, or WEBP image that you have the right to use.",
      url: absoluteUrl("/how-to-make-a-meme-from-a-photo#upload"),
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Write the meme captions",
      text: "Add short top and bottom text, or choose a caption preset.",
      url: absoluteUrl("/how-to-make-a-meme-from-a-photo#captions"),
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Add stickers and choose a format",
      text: "Place emoji, logos, or image stickers and choose a square, portrait, or story canvas.",
      url: absoluteUrl("/how-to-make-a-meme-from-a-photo#style"),
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Download the meme",
      text: "Review the preview and download the finished meme as a PNG.",
      url: absoluteUrl("/how-to-make-a-meme-from-a-photo#download"),
    },
  ],
};

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
      name: "How to Make a Meme from a Photo",
      item: absoluteUrl("/how-to-make-a-meme-from-a-photo"),
    },
  ],
};

export default function HowToMakeAMemeFromAPhotoPage() {
  return (
    <>
      <JsonLd data={[howToData, breadcrumbData]} />
      <SimplePage
        eyebrow="Photo Meme Guide"
        title="How to Make a Meme from a Photo"
        description="Use this four-step guide to turn your own image into a readable, shareable meme without creating an account."

        breadcrumbs={[{ label: "How to Make a Meme from a Photo", href: "/how-to-make-a-meme-from-a-photo" }]}
      >
        <InfoCard title="1. Upload a photo">
          <div id="upload" className="scroll-mt-28">
            <p>
              Choose a JPG, PNG, or WEBP image with a clear subject. Manual
              editing is performed in the browser, so you can start without an
              account.
            </p>
          </div>
        </InfoCard>

        <InfoCard title="2. Write a short setup and payoff">
          <div id="captions" className="scroll-mt-28">
            <p>
              Use the top text for context and the bottom text for the punchline.
              Short captions are easier to read on phones and in group chats.
            </p>
          </div>
        </InfoCard>

        <InfoCard title="3. Add stickers and select a canvas size">
          <div id="style" className="scroll-mt-28">
            <p>
              Add an emoji, logo, or image sticker only when it strengthens the
              joke. Choose 1:1 for square posts, 4:5 for portrait feeds, or 9:16
              for story-style sharing.
            </p>
          </div>
        </InfoCard>

        <InfoCard title="4. Preview and download the PNG">
          <div id="download" className="scroll-mt-28">
            <p>
              Check that the captions are readable and the important part of the
              photo is visible. Then download the result as a PNG.
            </p>
            <Link
              href="/#generator"
              className="mt-4 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white"
            >
              Make a meme from your photo
            </Link>
          </div>
        </InfoCard>

        <InfoCard title="Optional AI caption ideas">
          <p>
            When AI captions are available, you can review a privacy notice and
            explicitly choose to send a compressed photo copy to the configured
            AI provider for caption suggestions. The generated captions remain
            editable before download.
          </p>
        </InfoCard>

        <InfoCard title="Related pages">
          <p>
            Try the{" "}
            <Link
              href="/photo-reaction-meme-maker"
              className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
            >
              photo reaction meme maker
            </Link>{" "}
            or review the{" "}
            <Link
              href="/no-watermark-meme-maker"
              className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
            >
              watermark-free Creator Plan
            </Link>
            .
          </p>
        </InfoCard>
      </SimplePage>
    </>
  );
}
