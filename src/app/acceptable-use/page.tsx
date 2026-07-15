import { InfoCard, SimplePage } from "@/components/simple-page";

export default function AcceptableUsePage() {
  return (
    <SimplePage
      eyebrow="Policy"
      title="Acceptable Use Policy"
      description="Last updated: July 15, 2026"
    >
      <InfoCard title="Introduction">
        <p>
          MemePhoto AI is a browser-based photo meme editor. This Acceptable
          Use Policy explains the types of content and activities that are not
          permitted when using the service.
        </p>
        <p>
          By accessing or using MemePhoto AI, you agree to follow this policy
          and all applicable laws and regulations.
        </p>
      </InfoCard>

      <InfoCard title="Prohibited Sexual and Adult Content">
        <p>
          Users may not use MemePhoto AI to create, edit, upload, publish,
          share, or distribute content that:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            contains sexually explicit, pornographic, adult, or NSFW material;
          </li>
          <li>
            depicts nudity or sexual content intended for explicit purposes;
          </li>
          <li>sexualizes any person without their consent;</li>
          <li>contains non-consensual intimate imagery;</li>
          <li>depicts, promotes, or facilitates sexual exploitation;</li>
          <li>contains any sexual content involving minors.</li>
        </ul>
        <p>
          Sexual content involving minors is strictly prohibited under all
          circumstances.
        </p>
      </InfoCard>

      <InfoCard title="Violence, Hate, and Harassment">
        <p>Users may not create or distribute content that:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            promotes, glorifies, or encourages violence or physical harm;
          </li>
          <li>
            contains hate speech or attacks people based on protected
            characteristics;
          </li>
          <li>
            harasses, threatens, bullies, abuses, or intimidates another person;
          </li>
          <li>
            promotes discrimination, extremist activity, or illegal conduct.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Fraud, Impersonation, and Misleading Content">
        <p>Users may not use MemePhoto AI to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            impersonate another person, business, or organization without
            authorization;
          </li>
          <li>
            create fraudulent, deceptive, or materially misleading content;
          </li>
          <li>
            facilitate scams, phishing, identity theft, or financial fraud;
          </li>
          <li>
            falsely represent edited content as authentic in a way that may
            cause harm.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Intellectual Property and Privacy">
        <p>
          Users may only use images, logos, text, trademarks, and other
          materials that they own or have permission to use.
        </p>
        <p>Users may not create or distribute content that:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            infringes copyrights, trademarks, publicity rights, privacy rights,
            or other third-party rights;
          </li>
          <li>
            exposes private or confidential personal information without
            permission;
          </li>
          <li>uses another person&apos;s image or identity unlawfully;</li>
          <li>
            violates an applicable license, contract, or legal restriction.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Illegal or Harmful Activities">
        <p>
          Users may not use MemePhoto AI to create or distribute content that:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>violates any applicable law or regulation;</li>
          <li>promotes illegal products, services, or activities;</li>
          <li>
            facilitates exploitation, abuse, malware, or other harmful conduct;
          </li>
          <li>
            is intended to cause harm to individuals, organizations, or the
            public.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="User Responsibility">
        <p>
          Users are responsible for the images, text, stickers, logos, and other
          materials they use with MemePhoto AI.
        </p>
        <p>
          Users must ensure that their content and use of the service comply
          with this policy, the Terms of Service, and applicable laws.
        </p>
      </InfoCard>

      <InfoCard title="Enforcement">
        <p>
          MemePhoto AI reserves the right to restrict, suspend, or terminate
          access to the service when a user violates this policy or uses the
          service in a way that may harm others, the service, or third parties.
        </p>
        <p>
          Where appropriate, MemePhoto AI may also cooperate with lawful
          requests from relevant authorities.
        </p>
      </InfoCard>

      <InfoCard title="Reporting Violations">
        <p>To report suspected violations of this policy, contact:</p>
        <p>
          <a
            href="mailto:support@memephotoai.com"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            support@memephotoai.com
          </a>
        </p>
      </InfoCard>

      <InfoCard title="Policy Updates">
        <p>
          MemePhoto AI may update this Acceptable Use Policy when necessary to
          reflect changes to the service, legal requirements, or safety
          standards.
        </p>
      </InfoCard>
    </SimplePage>
  );
}
