import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { GuideLinks } from "@/components/guide-links";
import { InfoCard, SimplePage } from "@/components/simple-page";
import { createPageMetadata } from "@/lib/metadata";
import { guidePath, guides } from "@/lib/guides";
import { absoluteUrl } from "@/lib/site-config";

export const metadata = createPageMetadata({
  title: "Meme Creation Guides",
  description:
    "Practical guides for planning, captioning, sizing, and editing photo memes in MemePhoto AI.",
  path: "/guides",
});

export default function GuidesPage() {
  const guideCollectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "MemePhoto AI Guides",
    description:
      "Practical guides for planning, captioning, sizing, and editing photo memes in MemePhoto AI.",
    url: absoluteUrl("/guides"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: guides.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: guide.title,
        url: absoluteUrl(guidePath(guide.slug)),
      })),
    },
  };

  return (
    <>
      <JsonLd data={guideCollectionSchema} />
      <SimplePage
        eyebrow="Guides"
        title="Make photo memes with a clearer idea, not a louder template."
        description="These short, practical guides focus on the decisions that happen before and during an edit: which canvas to choose, what a caption needs to say, and how to keep the photo doing its job."
        breadcrumbs={[{ label: "Guides", href: "/guides" }]}
      >
        <GuideLinks
          links={guides.map((guide) => ({
            href: guidePath(guide.slug),
            title: guide.title,
            description: guide.description,
          }))}
        />

        <InfoCard title="Start with the editor when you have an idea">
          <p>
            MemePhoto AI lets you upload a JPG, PNG, or WEBP photo and edit text, emoji, and image stickers in your browser. When you want suggestions, AI captions are optional and only run after you review the privacy notice and choose to continue.
          </p>
          <Link
            href="/#generator"
            className="inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800"
          >
            Open the meme editor
          </Link>
        </InfoCard>

        <InfoCard title="More ways to use MemePhoto AI">
          <GuideLinks
            links={[
              {
                href: "/how-to-make-a-meme-from-a-photo",
                title: "Make a meme from a photo",
                description: "A complete first-edit walkthrough.",
              },
              {
                href: "/photo-reaction-meme-maker",
                title: "Make a reaction meme",
                description: "Turn a facial expression or moment into a reaction image.",
              },
            ]}
          />
        </InfoCard>
      </SimplePage>
    </>
  );
}
