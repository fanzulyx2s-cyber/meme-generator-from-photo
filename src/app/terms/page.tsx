import Link from "next/link";

import { createPageMetadata } from "@/lib/metadata";
import { InfoCard, SimplePage } from "@/components/simple-page";

export const metadata = createPageMetadata({
  title: "Terms of Service",
  description:
    "Read the terms for using MemePhoto AI, including photo rights, optional AI caption processing, Creator licenses, payments, and prohibited content.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <SimplePage
      eyebrow="Terms"
      title="Terms of Service"
      description="Last updated: August 5, 2026"
    >
      <InfoCard title="Use of the service">
        <p>
          These Terms describe how you may use MemePhoto AI to create
          browser-based meme images from your photos. You may use this website
          to create meme images from photos you have the right to use. You are
          responsible for the content you create and share.
        </p>
      </InfoCard>
      <InfoCard title="Local processing">
        <p>
          Photos used in the manual editor are processed locally in your
          browser using Canvas. They are not uploaded for manual meme creation.
          The optional AI caption feature is a separate, consent-based flow
          described below.
        </p>
      </InfoCard>
      <InfoCard title="Optional AI caption feature">
        <p>
          When AI captions are available, they are optional. By reviewing the
          notice and choosing to continue, you authorize a compressed copy of
          the selected photo to be sent to the configured AI provider for
          caption analysis.
        </p>
        <p>
          AI-generated captions may be inaccurate, inappropriate, repetitive,
          or unsuitable for a particular audience. You are responsible for
          reviewing and editing every caption before downloading, publishing,
          or sharing it. Do not submit sensitive images to the AI caption
          feature.
        </p>
        <p>
          AI caption requests may require automated human verification and an
          image safety check before a photo is sent to an AI provider. A safety
          check can decline an image without disclosing detailed classifications.
        </p>
      </InfoCard>
      <InfoCard title="Acceptable Use and Prohibited Content">
        <p>
          Users may not use MemePhoto AI to create, edit, upload, or distribute
          content that:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            contains sexually explicit, pornographic, adult, or NSFW material;
          </li>
          <li>
            depicts nudity or sexual content intended for explicit purposes;
          </li>
          <li>
            involves sexual content featuring minors or any non-consensual
            intimate content;
          </li>
          <li>
            promotes violence, hate speech, harassment, or illegal activities;
          </li>
          <li>
            depicts severe graphic violence, hate, extremism, or other unlawful
            material;
          </li>
          <li>
            infringes copyrights, trademarks, privacy rights, or other
            third-party rights;
          </li>
          <li>
            impersonates individuals or creates misleading or fraudulent
            content.
          </li>
        </ul>
        <p>
          MemePhoto AI reserves the right to restrict or terminate access for
          users who violate these requirements.
        </p>
      </InfoCard>
      <InfoCard title="Feature availability">
        <p>
          MemePhoto AI may offer free and paid access options, including a
          one-time Creator Plan. Current pricing, availability, and included
          features are described on the Pricing page. Features may be updated or
          changed as the service develops.
        </p>
      </InfoCard>
      <InfoCard title="Free Demo and Creator Plan">
        <p>
          The Free Demo can be used with the current browser-based editing
          tools, and the live preview and PNG exports include a MemePhoto AI
          watermark.
        </p>
        <p>
          Creator Plan is a $9 one-time purchase. It removes the MemePhoto AI
          watermark from live previews and PNG exports on an activated browser.
          Creator Plan does not include a promise of future features, lifetime
          updates, unlimited devices, or priority support.
        </p>
      </InfoCard>
      <InfoCard title="Payments">
        <p>
          Payments are processed by Creem. MemePhoto AI does not collect or
          store complete payment card details.
        </p>
        <p>
          Current pricing and checkout details are shown on the{" "}
          <Link
            href="/pricing"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            Pricing
          </Link>{" "}
          page and in the Creem checkout flow.
        </p>
      </InfoCard>
      <InfoCard title="License keys and browser activation">
        <p>
          After purchase, the License Key is sent to the email address used for
          the Creem purchase. The License Key does not have a set expiration
          date and may be activated on up to 3 browsers.
        </p>
        <p>
          You are responsible for keeping your License Key secure. You may not
          publicly share, resell, or misuse a License Key.
        </p>
        <p>
          Clearing browser data, changing browsers, or changing devices may
          require activation again and may use an available activation slot.
        </p>
      </InfoCard>
      <InfoCard title="Refunds">
        <p>
          Refund requests must follow the{" "}
          <Link
            href="/refund"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            Refund Policy
          </Link>
          . The current refund request window is 14 days after purchase.
        </p>
      </InfoCard>
      <InfoCard title="Acceptable Use Policy">
        <p>
          You must also follow the separate{" "}
          <Link
            href="/acceptable-use"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            Acceptable Use Policy
          </Link>
          .
        </p>
      </InfoCard>
      <InfoCard title="Intellectual property">
        <p>
          You retain the rights you lawfully own in your selected photos and in
          the content you create with MemePhoto AI. You must have the necessary
          rights to use any photos, logos, stickers, text, or other materials
          you include.
        </p>
        <p>
          MemePhoto AI&apos;s website design, brand, code, and original
          materials are owned by the website operator or the applicable rights
          holders.
        </p>
      </InfoCard>
      <InfoCard title="Disclaimer">
        <p>
          MemePhoto AI is provided on an as-is and as-available basis. We do not
          guarantee that the service will always be uninterrupted, error-free,
          or suitable for every specific purpose.
        </p>
        <p>
          You should review exported content before sharing it publicly or using
          it commercially.
        </p>
      </InfoCard>
      <InfoCard title="Limitation of liability">
        <p>
          To the extent permitted by law, MemePhoto AI is not responsible for
          indirect, incidental, or consequential losses arising from use of the
          service.
        </p>
      </InfoCard>
      <InfoCard title="Suspension or termination">
        <p>
          MemePhoto AI may restrict or terminate access if a user violates
          these Terms, violates the Acceptable Use Policy, misuses a License
          Key, or engages in unlawful activity.
        </p>
      </InfoCard>
      <InfoCard title="Changes to these terms">
        <p>
          These Terms may be updated from time to time. The updated date will be
          shown on this page. Continued use of MemePhoto AI after an update
          means you accept the updated Terms.
        </p>
      </InfoCard>
      <InfoCard title="Contact">
        <p>
          For questions about these Terms, contact{" "}
          <a
            href="mailto:support@memephotoai.com"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            support@memephotoai.com
          </a>
          .
        </p>
      </InfoCard>
    </SimplePage>
  );
}
