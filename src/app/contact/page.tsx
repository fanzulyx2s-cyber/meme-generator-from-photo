import { InfoCard, SimplePage } from "@/components/simple-page";

export default function ContactPage() {
  return (
    <SimplePage
      eyebrow="Contact"
      title="Contact MemePhoto AI"
      description="Need help with MemePhoto AI? For questions about payments, refunds, or using our service, please contact us below."
    >
      <InfoCard title="Product contact">
        <p>
          MemePhoto AI is a lightweight browser-based meme maker for turning
          photos into shareable reaction images.
        </p>
      </InfoCard>
      <InfoCard title="Contact email">
        <p>
          For questions about payments, refunds, or using our service, please
          contact:
        </p>
        <p>
          <a
            href="mailto:support@memephotoai.com"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            support@memephotoai.com
          </a>
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
