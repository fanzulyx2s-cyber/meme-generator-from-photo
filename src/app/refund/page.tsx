import { InfoCard, SimplePage } from "@/components/simple-page";

export default function RefundPage() {
  return (
    <SimplePage
      eyebrow="Refund Policy"
      title="Refund Policy"
      description="Last updated: July 15, 2026"
    >
      <InfoCard title="Overview">
        <p>
          MemePhoto AI offers a one-time Creator Plan priced at $9 USD.
          Payments are processed securely by Creem, our merchant of record.
        </p>
        <p>
          We want customers to have a fair opportunity to report purchase
          problems and request a refund when appropriate. This Refund Policy
          explains when a refund may be available and how to submit a request.
        </p>
      </InfoCard>

      <InfoCard title="Refund Request Period">
        <p>
          Refund requests should normally be submitted within 14 calendar days
          of the original purchase date.
        </p>
        <p>
          Requests submitted after this period may still be considered when
          required by applicable law or when exceptional circumstances exist.
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
          passwords, or other sensitive financial information by email.
        </p>
      </InfoCard>

      <InfoCard title="Review and Processing">
        <p>
          We will review the information provided and may request additional
          details needed to verify the purchase or investigate the issue.
        </p>
        <p>
          Approved refunds are processed through Creem and returned to the
          original payment method. Depending on the circumstances, a refund may
          be full or partial.
        </p>
        <p>
          The time required for the refunded amount to appear may depend on
          Creem, the payment method, the customer&apos;s bank, and other payment
          providers. MemePhoto AI does not guarantee an exact bank processing
          time.
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
