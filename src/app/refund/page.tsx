import { InfoCard, SimplePage } from "@/components/simple-page";

export default function RefundPage() {
  return (
    <SimplePage
      eyebrow="Refund Policy"
      title="Refund Policy"
      description="Since the current free demo does not collect payments, refunds do not apply to free use. If paid plans are introduced, refund terms will be clearly shown before purchase."
    >
      <InfoCard title="Current purchase status">
        <p>
          The current browser-based meme maker can be used without account
          creation or payment. Free use does not create a refundable purchase.
        </p>
      </InfoCard>
      <InfoCard title="Future paid plans">
        <p>
          If paid plans are introduced later, refund terms will be updated before
          launch and displayed clearly on this page.
        </p>
      </InfoCard>
    </SimplePage>
  );
}
