import { InfoCard, SimplePage } from "@/components/simple-page";

export default function PrivacyPage() {
  return (
    <SimplePage
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      description="MemePhoto AI is designed for local photo editing: photos are processed in your browser and are not uploaded to a server for meme generation."
    >
      <InfoCard title="Image processing">
        <p>
          Your photos are processed locally in your browser using Canvas. They
          are not uploaded to our servers for meme generation.
        </p>
      </InfoCard>
      <InfoCard title="Account-free use">
        <p>
          This tool is designed for simple, account-free use. You can create
          and download memes without creating an account. We do not store user
          profiles or uploaded images.
        </p>
      </InfoCard>
      <InfoCard title="Payments">
        <p>
          Paid features may be offered in the future. When payments are
          available, they will be processed securely by our payment provider. We
          do not store full payment card details on our servers.
        </p>
      </InfoCard>
    </SimplePage>
  );
}
