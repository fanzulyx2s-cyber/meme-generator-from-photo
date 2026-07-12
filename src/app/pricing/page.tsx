import Link from "next/link";
import { SimplePage } from "@/components/simple-page";

const plans = [
  {
    name: "Free Demo",
    price: "$0",
    badge: "Available now",
    description:
      "Create and download simple photo memes directly in your browser.",
    features: [
      "Upload photos locally",
      "Add top and bottom captions",
      "Add emoji stickers",
      "Add image or logo stickers",
      "Choose meme frame on or off",
      "Download PNG",
      "No account required",
    ],
    href: "/#generator",
    cta: "Try free demo",
    featured: false,
  },
  {
    name: "Creator",
    price: "Coming soon",
    badge: "Planned",
    description:
      "More tools for creators who make memes, reactions, and social content regularly.",
    features: [
      "More caption presets",
      "More sticker packs",
      "Watermark-free exports",
      "More output sizes",
      "Batch meme creation",
      "Saved editing presets",
    ],
    href: "",
    cta: "Coming soon",
    featured: true,
  },
  {
    name: "Team",
    price: "Contact",
    badge: "Planned",
    description:
      "For small teams, creators, and brands that need lightweight visual meme workflows.",
    features: [
      "Team-friendly meme templates",
      "Brand/social content workflows",
      "Custom sticker sets",
      "Priority support",
      "Future paid workspace options",
    ],
    href: "/contact",
    cta: "Contact us",
    featured: false,
  },
];

const faqs = [
  {
    question: "Is the free demo available now?",
    answer:
      "Yes. The current browser-based meme maker can be used without an account or payment.",
  },
  {
    question: "Are paid plans available today?",
    answer:
      "Paid creator and team features are planned for the future. Pricing details will be shown clearly before any purchase.",
  },
  {
    question: "Do you store uploaded photos?",
    answer:
      "No. Photos are processed locally in your browser for meme generation.",
  },
  {
    question: "How will payments work?",
    answer:
      "If paid plans are introduced, payments will be processed securely by a payment provider. We do not store full payment card details on our servers.",
  },
];

export default function PricingPage() {
  return (
    <SimplePage
      eyebrow="Pricing"
      title="Simple pricing for fast meme creation"
      description="Start with the free browser-based meme maker. Paid creator and team features are planned for future workflows."
    >
      <div className="grid gap-4 md:grid-cols-3">
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
            {plan.href ? (
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

      <section className="rounded-[2rem] border border-black/10 bg-[#fffaf3] p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="w-fit rounded-full bg-[#d8ff63] px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-black">Pricing questions</h2>
          </div>
          <p className="max-w-md text-sm font-semibold leading-6 text-zinc-600">
            Clear answers about the free tool, planned paid features, and local
            photo handling.
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
