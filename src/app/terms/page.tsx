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
      <InfoCard title="Feature availability">
        <p>
          The free browser-based meme maker is available now. Creator and Team
          features are planned for future workflows, and any paid terms will be
          shown clearly before purchase.
        </p>
      </InfoCard>
    </SimplePage>
  );
}
