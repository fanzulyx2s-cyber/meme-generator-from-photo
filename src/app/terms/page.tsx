import { InfoCard, SimplePage } from "@/components/simple-page";

export default function TermsPage() {
  return (
    <SimplePage
      eyebrow="Terms"
      title="Terms of Service"
      description="These terms describe how you may use AI Meme Generator from Photo to create browser-based meme images."
    >
      <InfoCard title="Use of the service">
        <p>
          You may use this website to create meme images from photos you have
          the right to use. You are responsible for the content you create and
          share.
        </p>
      </InfoCard>
      <InfoCard title="Local generation">
        <p>
          Meme images are generated locally with browser Canvas. Uploaded photos
          are used for editing in your browser and are not stored by this
          website for meme generation.
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
    </SimplePage>
  );
}
