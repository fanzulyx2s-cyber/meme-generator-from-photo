import Link from "next/link";

import { InfoCard, SimplePage } from "@/components/simple-page";
import { JsonLd } from "@/components/json-ld";
import { createPageMetadata } from "@/lib/metadata";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const metadata = createPageMetadata({
  title: "Watermark-Free Meme Maker with Creator Plan",
  description:
    "Create photo memes in the free editor, or use the $9 one-time Creator Plan to remove the MemePhoto AI watermark from previews and PNG exports.",
  path: "/no-watermark-meme-maker",
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
      name: "Watermark-Free Meme Maker",
      item: absoluteUrl("/no-watermark-meme-maker"),
    },
  ],
};

export default function NoWatermarkMemeMakerPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <SimplePage
        eyebrow="Creator Plan"
        title="Create Watermark-Free Memes with Creator Plan"
        description="The free editor includes a MemePhoto AI watermark. The $9 one-time Creator Plan removes that watermark from live previews and downloaded PNG files."

        breadcrumbs={[{ label: "Watermark-Free Meme Maker", href: "/no-watermark-meme-maker" }]}
      >
        <InfoCard title="What the free editor includes">
          <ul className="list-disc space-y-2 pl-5">
            <li>photo upload and browser-based Canvas editing;</li>
            <li>top and bottom meme captions;</li>
            <li>caption presets, emoji, logos, and image stickers;</li>
            <li>square, portrait, and story formats;</li>
            <li>PNG export with a MemePhoto AI watermark.</li>
          </ul>
          <Link
            href="/#generator"
            className="mt-4 inline-flex rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black text-zinc-950"
          >
            Try the free editor
          </Link>
        </InfoCard>

        <InfoCard title="What Creator Plan changes">
          <p>
            Creator Plan removes the MemePhoto AI watermark from the live preview
            and PNG export. It is a $9 one-time purchase, not a recurring
            subscription, and one license can be activated on up to three
            browsers under the current product terms.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white"
          >
            Compare pricing and benefits
          </Link>
        </InfoCard>

        <InfoCard title="What Creator Plan does not promise">
          <p>
            Creator Plan covers the current watermark-free editor benefits. It
            does not promise unlimited paid AI usage, future third-party AI
            costs, or features that are not listed on the pricing page.
          </p>
        </InfoCard>

        <InfoCard title="Purchase and refund information">
          <p>
            Payments are processed through Creem. Read the{" "}
            <Link
              href="/refund"
              className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
            >
              Refund Policy
            </Link>{" "}
            and{" "}
            <Link
              href="/terms"
              className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
            >
              Terms of Service
            </Link>{" "}
            before purchasing.
          </p>
        </InfoCard>
      </SimplePage>
    </>
  );
}
