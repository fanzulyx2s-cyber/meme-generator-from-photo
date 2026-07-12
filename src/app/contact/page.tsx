import { InfoCard, SimplePage } from "@/components/simple-page";

export default function ContactPage() {
  return (
    <SimplePage
      eyebrow="Contact"
      title="Contact"
      description="For questions about MemePhoto AI, support, or planned pricing, use the contact details below."
    >
      <InfoCard title="Product contact">
        <p>
          MemePhoto AI is a lightweight browser-based meme maker for turning
          photos into shareable reaction images. For product questions, please
          contact the project owner through the channel where this website was
          shared.
        </p>
      </InfoCard>
      <InfoCard title="Support scope">
        <p>
          The current tool supports browser-local photo upload, editable meme
          text, emoji stickers, image stickers, Canvas preview, and PNG
          download.
        </p>
      </InfoCard>
    </SimplePage>
  );
}
