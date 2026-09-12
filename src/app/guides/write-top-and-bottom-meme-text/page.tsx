import Link from "next/link";

import { GuideLinks } from "@/components/guide-links";
import { InfoCard, SimplePage } from "@/components/simple-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "How to Write Top and Bottom Meme Text",
  description:
    "Write top and bottom meme text with a clear setup, a short payoff, and enough contrast to read on a phone.",
  path: "/guides/write-top-and-bottom-meme-text",
});

export default function MemeTextGuidePage() {
  return (
    <SimplePage
      eyebrow="Writing captions"
      title="Write the setup, then earn the payoff."
      description="Top and bottom meme text is a tiny story. The first line tells people what they are looking at; the second line changes the meaning. It works best when both lines stay short enough to read before the next scroll."
      breadcrumbs={[
        { label: "Guides", href: "/guides" },
        { label: "How to write top and bottom meme text", href: "/guides/write-top-and-bottom-meme-text" },
      ]}
    >
      <InfoCard title="Use a simple two-line structure">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Top line:</strong> set the situation, expectation, or question.</li>
          <li><strong>Bottom line:</strong> reveal the unexpected reaction, result, or inner monologue.</li>
        </ul>
        <p>For example, a photo of a pet watching the kitchen can become “HEARD ONE BAG RUSTLE” / “NOW I AM QUALITY CONTROL.” The text adds a point of view; the photo provides the proof.</p>
      </InfoCard>

      <InfoCard title="Make the words work with the photo">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Choose one emotion in the image: anticipation, confusion, pride, disappointment, or relief.</li>
          <li>Write the first line in plain language. Avoid explaining every detail.</li>
          <li>Make the second line more specific than the first; specificity is often the joke.</li>
          <li>Cut filler words, then preview the text against the image at phone size.</li>
        </ol>
      </InfoCard>

      <InfoCard title="Common mistakes to avoid">
        <p>Do not repeat the same idea in both lines. Do not use a long sentence just because it is technically funny. And do not cover the expression that makes the image work. If the joke needs a second paragraph, make a shorter caption rather than shrinking the text.</p>
        <p>In MemePhoto AI, you can type the text yourself or choose from optional AI caption ideas after you have reviewed the privacy notice and decided to continue. The editor still lets you refine every line manually.</p>
      </InfoCard>

      <GuideLinks
        links={[
          { href: "/guides/make-a-pet-meme-from-a-photo", title: "Make a pet meme", description: "Apply this structure to an expressive pet photo." },
          { href: "/guides/make-memes-from-product-photos", title: "Make a product-photo meme", description: "Keep the product and the joke in balance." },
        ]}
      />
      <Link href="/#generator" className="w-fit rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800">Write your caption in the editor</Link>
    </SimplePage>
  );
}
