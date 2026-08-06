import Link from "next/link";

import { createPageMetadata } from "@/lib/metadata";
import { CreatorCheckoutButton } from "@/components/creator-checkout-button";
import { CreatorLicensePanel } from "@/components/creator-license-panel";
import { SimplePage } from "@/components/simple-page";

export const metadata = createPageMetadata({
  title: "Pricing – Free Demo and $9 Creator Plan",
  description:
    "Compare the free MemePhoto AI editor with the $9 one-time Creator Plan for watermark-free previews and PNG meme downloads.",
  path: "/pricing",
});

const plans = [
  {
    name: "Free Demo",
    price: "$0",
    badge: "Available now",
    description:
      "Create and export memes with a MemePhoto AI watermark.",
    features: [
      "Upload your own photos",
      "Add top and bottom captions",
      "Use caption presets",
      "Add emoji and image stickers",
      "Choose 1:1, 4:5, or 9:16 formats",
      "Export PNG with a MemePhoto AI watermark",
    ],
    href: "/#generator",
    cta: "Start creating",
    featured: false,
  },
  {
    name: "Creator Plan",
    price: "$9 one-time",
    badge: "Available now",
    description:
      "Remove the MemePhoto AI watermark from previews and PNG exports.",
    features: [
      "Everything in Free Demo",
      "Watermark-free live preview",
      "Watermark-free PNG exports",
      "One-time purchase, no subscription",
      "License does not expire",
      "Activate on up to 3 browsers",
    ],
    href: "creem",
    cta: "Buy Creator Plan",
    featured: true,
  },
];

const faqs = [
  {
    question: "Is the free demo available now?",
    answer:
      "Yes. The current browser-based meme maker can be used without an account or payment.",
  },
  {
    question: "Is there a paid plan?",
    answer:
      "Yes. Creator Plan removes the MemePhoto AI watermark from live previews and PNG exports.",
  },
  {
    question: "How can I purchase?",
    answer:
      "Click the Creator Plan button and complete your payment securely through Creem.",
  },
  {
    question: "Do you store uploaded photos?",
    answer:
      "Manual editing stays in your browser. Optional AI captions only send a compressed copy after consent; MemePhoto AI does not intentionally save that image in an application database.",
  },
];

export default function PricingPage() {
  return (
    <SimplePage
      eyebrow="Pricing"
      title="Simple pricing for fast meme creation"
      description="Start with the free browser-based meme maker, or choose Creator Plan for watermark-free previews and PNG exports."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_18px_50px_rgba(42,31,16,0.10)] ${
              plan.featured
                ? "border-black bg-[linear-gradient(135deg,#fff3bf,#ffd7e8_48%,#d8fbff)]"
                : "border-black/10 bg-white"
            }`}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/40" />
            <div className="pointer-events-none absolute bottom-6 right-6 h-12 w-20 rotate-[-8deg] rounded-3xl bg-[#ffde59]/30" />
            <span className="relative rounded-full bg-[#ffde59] px-3 py-1 text-xs font-black uppercase tracking-wide">
              {plan.badge}
            </span>
            <h2 className="relative mt-6 text-2xl font-black">{plan.name}</h2>
            <p className="relative mt-4 text-4xl font-black">{plan.price}</p>
            <p className="relative mt-4 min-h-20 text-sm font-semibold leading-6 text-zinc-600">
              {plan.description}
            </p>
            <ul className="mt-5 space-y-3 text-sm font-semibold text-zinc-600">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-1 h-4 w-4 shrink-0 rounded-full bg-[#ffde59] text-center text-[10px] font-black leading-4 text-zinc-950">
                    +
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {plan.href === "creem" ? (
              <CreatorCheckoutButton>{plan.cta}</CreatorCheckoutButton>
            ) : plan.href ? (
              <Link
                href={plan.href}
                className="relative mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {plan.cta}
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="relative mt-6 inline-flex cursor-not-allowed rounded-full bg-white/70 px-5 py-3 text-sm font-black text-zinc-500"
              >
                {plan.cta}
              </button>
            )}
          </article>
        ))}
      </div>

      <CreatorLicensePanel variant="full" />

      <div className="rounded-[1.5rem] border border-black/10 bg-[#fffaf3] p-5 text-sm font-semibold leading-6 text-zinc-600">
        <p className="font-black text-zinc-950">Questions about your purchase?</p>
        <p>
          Contact us at:{" "}
          <a
            href="mailto:support@memephotoai.com"
            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
          >
            support@memephotoai.com
          </a>
        </p>
      </div>

      <section className="rounded-[2rem] border border-black/10 bg-[#fffaf3] p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="w-fit rounded-full bg-[#d8ff63] px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-black">Pricing questions</h2>
          </div>
          <p className="max-w-md text-sm font-semibold leading-6 text-zinc-600">
            Clear answers about the free tool, Creator Plan, secure checkout,
            and local photo handling.
          </p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[1.5rem] border border-black/10 bg-white p-5"
            >
              <h3 className="text-base font-black">{faq.question}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>
    </SimplePage>
  );
}
