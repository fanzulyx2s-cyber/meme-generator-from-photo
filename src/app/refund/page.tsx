import { InfoCard, SimplePage } from "@/components/simple-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | MemePhoto AI",
  description:
    "Learn how refund requests work for the MemePhoto AI Creator Plan, including the 14-day request window and Creem processing.",
};

export default function RefundPage() {
  return (
    <SimplePage
      eyebrow="Refund Policy"
      title="Refund Policy"
      description="Last updated: July 17, 2026"
    >
      <InfoCard title="Current Paid Product">
        <p>
          MemePhoto AI offers a Creator Plan as a $9 one-time purchase. It is
          not a subscription.
        </p>
        <p>
          Payments are processed by Creem. This Refund Policy explains how
          customers can request a refund when appropriate.
        </p>
      </InfoCard>

      <InfoCard title="Refund Request Window">
        <p>
          Refund requests must be submitted within 14 days after purchase.
        </p>
        <p>
          This policy does not limit any consumer rights that cannot legally be
          excluded under applicable law.
        </p>
      </InfoCard>

      <InfoCard title="Eligible Refund Requests">
        <p>Customers may normally request a refund when:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            the customer was charged more than once for the same purchase;
          </li>
          <li>paid access or purchased benefits were not delivered;</li>
          <li>
            a material technical problem prevents the customer from using the
            purchased product and the problem cannot be resolved within a
            reasonable period;
          </li>
          <li>
            the purchase was made accidentally and the paid product has not been
            substantially used;
          </li>
          <li>
            the transaction was unauthorized, subject to appropriate
            verification;
          </li>
          <li>
            a refund is otherwise required by applicable consumer protection
            law.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Requests That May Not Qualify">
        <p>Refund requests may not normally qualify when:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            the request is submitted more than 14 days after purchase without
            exceptional circumstances;
          </li>
          <li>
            the customer substantially used or received the purchased benefits
            before requesting a refund;
          </li>
          <li>
            the request is based only on a change of mind after substantial use;
          </li>
          <li>
            the customer violated the Terms of Service or Acceptable Use Policy;
          </li>
          <li>
            the request relates to exchange-rate differences, bank charges, or
            other third-party fees outside MemePhoto AI&apos;s control;
          </li>
          <li>
            the customer provides false, incomplete, or misleading information
            in connection with the refund request.
          </li>
        </ul>
        <p>
          These limitations do not affect any refund or consumer rights that
          cannot legally be excluded under applicable law.
        </p>
      </InfoCard>

      <InfoCard title="How to Request a Refund">
        <p>
          To request a refund, email{" "}
          <a
            href="mailto:support@memephotoai.com"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            support@memephotoai.com
          </a>{" "}
          and include:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>the email address used for the purchase;</li>
          <li>the Creem order or transaction reference, if available;</li>
          <li>the purchase date;</li>
          <li>a brief explanation of the reason for the request;</li>
          <li>
            relevant screenshots or error details, if the request concerns a
            technical problem.
          </li>
        </ul>
        <p>
          For security, customers should not send complete payment card numbers,
          passwords, full License Keys, or other sensitive financial information
          by email or public channels.
        </p>
      </InfoCard>

      <InfoCard title="Review and Processing">
        <p>
          We will review the information provided and may request additional
          details needed to verify the purchase or investigate the issue.
        </p>
        <p>
          Approved refunds are processed through Creem and returned to the
          original payment method when available. Approval is not guaranteed for
          every request.
        </p>
        <p>
          The time required for the refunded amount to appear may depend on
          Creem, the payment method, the customer&apos;s bank, and other payment
          providers. MemePhoto AI does not guarantee an exact bank processing
          time.
        </p>
      </InfoCard>

      <InfoCard title="Free Demo">
        <p>
          The Free Demo does not create a payment, so there is no purchase
          amount to refund for free use.
        </p>
      </InfoCard>

      <InfoCard title="Chargebacks and Payment Disputes">
        <p>
          Customers are encouraged to contact{" "}
          <a
            href="mailto:support@memephotoai.com"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            support@memephotoai.com
          </a>{" "}
          before initiating a chargeback or payment dispute so that we have an
          opportunity to investigate and resolve the issue.
        </p>
        <p>
          Nothing in this policy prevents a customer from exercising rights
          available through their bank, payment provider, Creem, or applicable
          law.
        </p>
      </InfoCard>

      <InfoCard title="Policy Updates">
        <p>
          MemePhoto AI may update this Refund Policy to reflect changes to the
          product, payment arrangements, legal requirements, or customer support
          procedures.
        </p>
        <p>
          The updated version will be posted on this page with a revised Last
          updated date.
        </p>
      </InfoCard>

      <InfoCard title="Contact">
        <p>For refund questions or purchase assistance, contact:</p>
        <p>
          <a
            href="mailto:support@memephotoai.com"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            support@memephotoai.com
          </a>
        </p>
      </InfoCard>
    </SimplePage>
  );
}
