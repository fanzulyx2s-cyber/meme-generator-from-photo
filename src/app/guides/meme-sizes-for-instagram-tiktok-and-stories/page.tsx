import Link from "next/link";

import { GuideLinks } from "@/components/guide-links";
import { InfoCard, SimplePage } from "@/components/simple-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Meme Sizes for Instagram, TikTok, and Stories",
  description:
    "Choose a 1:1, 4:5, or 9:16 meme canvas and check current platform requirements before you publish.",
  path: "/guides/meme-sizes-for-instagram-tiktok-and-stories",
});

export default function MemeSizesGuidePage() {
  return (
    <SimplePage
      eyebrow="Formats and sharing"
      title="Choose a meme canvas for the place people will see it."
      description="A good meme can look cramped if it is edited for the wrong shape. Start with the destination, choose a canvas that gives the joke room to breathe, and keep vital text away from edges."
      breadcrumbs={[
        { label: "Guides", href: "/guides" },
        {
          label: "Meme sizes for Instagram, TikTok, and Stories",
          href: "/guides/meme-sizes-for-instagram-tiktok-and-stories",
        },
      ]}
    >
      <InfoCard title="Use the three canvas choices deliberately">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Square 1:1:</strong> a compact choice when the photo and caption both need equal attention.</li>
          <li><strong>Portrait 4:5:</strong> a taller feed-friendly layout that gives text more vertical room without becoming full-screen.</li>
          <li><strong>Story 9:16:</strong> a vertical canvas for story and short-form video contexts, where the image can fill the screen.</li>
        </ul>
        <p>MemePhoto AI offers these three canvas formats in its editing toolbar. Pick the canvas before placing text or stickers so you do not have to rebuild the layout later.</p>
      </InfoCard>

      <InfoCard title="A quick layout check before you export">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Put the main caption where it can be read without covering the subject&apos;s face or the product.</li>
          <li>Leave visual breathing room at the top and bottom; app controls can cover the edges of a shared post.</li>
          <li>Preview the image at phone size. If you need to squint, shorten the text before increasing the font.</li>
          <li>Export a PNG only after checking that every sticker still supports the joke instead of competing with it.</li>
        </ol>
      </InfoCard>

      <InfoCard title="Platform requirements change, so verify before publishing">
        <p>
          This guide describes MemePhoto AI&apos;s canvas choices, not a permanent promise about any social network&apos;s current rules. We checked the official guidance links below on September 12, 2026. Before posting, review the <a className="font-bold text-zinc-950 underline" href="https://help.instagram.com/">Instagram Help Center</a> and <a className="font-bold text-zinc-950 underline" href="https://www.tiktok.com/creators/creator-portal/en-us/">TikTok Creator Portal</a> for the latest requirements for the placement you use.
        </p>
      </InfoCard>

      <GuideLinks
        links={[
          { href: "/guides/write-top-and-bottom-meme-text", title: "Write readable meme text", description: "Keep the setup and payoff clear at a glance." },
          { href: "/how-to-make-a-meme-from-a-photo", title: "Make a meme from a photo", description: "See the full editing workflow." },
        ]}
      />
      <Link href="/#generator" className="w-fit rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800">Choose a canvas in the editor</Link>
    </SimplePage>
  );
}
