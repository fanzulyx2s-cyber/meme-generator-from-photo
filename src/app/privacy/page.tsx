import { InfoCard, SimplePage } from "@/components/simple-page";

export default function PrivacyPage() {
  return (
    <SimplePage
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      description="Last updated: July 15, 2026"
    >
      <InfoCard title="Introduction">
        <p>
          This Privacy Policy explains how MemePhoto AI handles information when
          users access the website, use the browser-based meme editor, contact
          support, or purchase a paid product.
        </p>
        <p>
          By using MemePhoto AI, users acknowledge the practices described in
          this Privacy Policy.
        </p>
      </InfoCard>

      <InfoCard title="Images and Content Processed in the Browser">
        <p>
          Images and other editing content selected by users are processed
          locally in the user&apos;s browser for the current editing and export
          workflow. MemePhoto AI does not currently upload these images to its
          own servers for meme generation or PNG export.
        </p>
        <p>
          Users may add photos, text, emoji, logos, and image stickers in the
          editor. Meme images are generated locally in the browser using
          client-side Canvas technology, and exported PNG files are saved
          directly by the user to their own device.
        </p>
        <p>
          Users are responsible for ensuring that the images and content they
          use with MemePhoto AI are lawful for them to use.
        </p>
      </InfoCard>

      <InfoCard title="Information Users Provide">
        <p>Users may voluntarily provide information such as:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            names, email addresses, and message content sent to{" "}
            <a
              href="mailto:support@memephotoai.com"
              className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
            >
              support@memephotoai.com
            </a>
            ;
          </li>
          <li>order information included in refund or purchase support requests;</li>
          <li>
            screenshots, issue descriptions, and other support materials that
            users choose to provide.
          </li>
        </ul>
        <p>
          For security, users should not send passwords, complete payment card
          numbers, or other unnecessary sensitive financial information by
          email.
        </p>
      </InfoCard>

      <InfoCard title="Payments and Creem">
        <p>
          MemePhoto AI offers a one-time Creator Plan. Payments for the Creator
          Plan are processed by Creem. MemePhoto AI does not store complete
          payment card numbers.
        </p>
        <p>
          Creem may collect information needed to process payments, such as
          name, email address, billing information, payment method information,
          and transaction records. Creem&apos;s own privacy policy and terms
          apply to information it directly processes.
        </p>
        <p>
          Creem may provide MemePhoto AI with limited transaction information
          needed to confirm purchases, provide customer support, process
          refunds, maintain business records, and address fraud or payment
          disputes. This may include purchaser email address, order reference,
          payment status, product information, and refund status.
        </p>
      </InfoCard>

      <InfoCard title="Technical and Usage Information">
        <p>
          When users visit the website, hosting, security, or infrastructure
          services may automatically process limited technical information. This
          may include:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>IP address;</li>
          <li>browser type;</li>
          <li>device type;</li>
          <li>operating system;</li>
          <li>requested pages;</li>
          <li>timestamps;</li>
          <li>referring page;</li>
          <li>error and diagnostic information.</li>
        </ul>
        <p>This information may be used to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>provide and protect the website;</li>
          <li>troubleshoot errors;</li>
          <li>prevent abuse;</li>
          <li>maintain website performance and security;</li>
          <li>understand basic website usage.</li>
        </ul>
      </InfoCard>

      <InfoCard title="Cookies and Analytics">
        <p>
          MemePhoto AI does not currently use advertising cookies or third-party
          behavioral advertising trackers. Hosting, security, or payment
          providers may use essential technologies needed to operate their
          services.
        </p>
      </InfoCard>

      <InfoCard title="How Information Is Used">
        <p>Information may be used to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>operate, maintain, and secure the website;</li>
          <li>provide purchased access or benefits;</li>
          <li>confirm and manage transactions;</li>
          <li>respond to support and refund requests;</li>
          <li>investigate errors, abuse, fraud, and security incidents;</li>
          <li>comply with legal obligations;</li>
          <li>enforce the Terms of Service and Acceptable Use Policy;</li>
          <li>
            improve the service using aggregated or limited diagnostic
            information.
          </li>
        </ul>
        <p>
          MemePhoto AI does not currently use user-selected images to train
          third-party or proprietary AI models.
        </p>
      </InfoCard>

      <InfoCard title="How Information May Be Shared">
        <p>
          Information may be shared only when necessary with the following
          categories of recipients:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Creem, for payment, order, refund, and transaction support;
          </li>
          <li>
            Vercel or other necessary hosting and infrastructure service
            providers;
          </li>
          <li>
            professional advisers, such as accounting, legal, or compliance
            advisers;
          </li>
          <li>
            government, regulatory, or law enforcement authorities when required
            by law or valid legal process;
          </li>
          <li>
            recipients involved in a business reorganization, merger, sale, or
            asset transfer, subject to continued protection of relevant
            information.
          </li>
        </ul>
        <p>MemePhoto AI does not sell users&apos; personal information.</p>
      </InfoCard>

      <InfoCard title="Data Retention">
        <p>
          Images processed locally in the browser are not stored by MemePhoto
          AI&apos;s own servers for editing or export.
        </p>
        <p>
          Support emails and transaction records may be retained for as long as
          needed for customer service, refunds, financial records, dispute
          resolution, security, and legal obligations.
        </p>
        <p>
          Third-party service providers may retain data according to their own
          policies. When data is no longer needed, MemePhoto AI takes reasonable
          steps to delete or anonymize data within its control, except where
          retention is required by law.
        </p>
      </InfoCard>

      <InfoCard title="Data Security">
        <p>
          MemePhoto AI uses reasonable administrative, technical, and
          organizational measures to protect information within its control.
        </p>
        <p>
          No internet transmission, website, email system, or storage method can
          be guaranteed to be completely secure.
        </p>
      </InfoCard>

      <InfoCard title="Children&apos;s Privacy">
        <p>
          MemePhoto AI is not directed to children under 13 and does not
          knowingly collect personal information from children under 13.
        </p>
        <p>
          If a parent or guardian believes that a child has provided personal
          information to the website, they may contact{" "}
          <a
            href="mailto:support@memephotoai.com"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            support@memephotoai.com
          </a>
          . If applicable local law requires a higher minimum age, MemePhoto AI
          follows that requirement.
        </p>
      </InfoCard>

      <InfoCard title="Privacy Rights">
        <p>
          Depending on their location, users may have rights to request access
          to, correction of, deletion of, or restriction of certain personal
          information, and may have the right to object to or complain about
          certain processing.
        </p>
        <p>
          Users may submit requests by contacting{" "}
          <a
            href="mailto:support@memephotoai.com"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            support@memephotoai.com
          </a>
          . MemePhoto AI may need to verify the requester&apos;s identity, and
          some data may not be deleted immediately where retention is needed for
          legal, transaction record, dispute, or security reasons.
        </p>
      </InfoCard>

      <InfoCard title="Third-Party Services and Links">
        <p>
          The website may include links to Creem or other third-party services.
          Third-party services have their own privacy policies and data handling
          practices.
        </p>
        <p>
          MemePhoto AI does not control independent data processing by third
          parties. Users should review third-party policies before providing
          information to those services.
        </p>
      </InfoCard>

      <InfoCard title="Changes to This Privacy Policy">
        <p>
          MemePhoto AI may update this Privacy Policy to reflect changes to the
          service, payment arrangements, technology, legal requirements, or
          privacy practices.
        </p>
        <p>
          The updated version will be posted on this page with a revised Last
          updated date.
        </p>
      </InfoCard>

      <InfoCard title="Contact">
        <p>For privacy questions or requests, contact:</p>
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
