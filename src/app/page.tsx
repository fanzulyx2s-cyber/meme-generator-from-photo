import Image from "next/image";
import Link from "next/link";

import { CreatorLicensePanel } from "@/components/creator-license-panel";
import { JsonLd } from "@/components/json-ld";
import { MemeGenerator } from "@/components/meme-generator";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createPageMetadata } from "@/lib/metadata";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const metadata = createPageMetadata({
  title: siteConfig.defaultTitle,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

const aiCaptionsEnabled = process.env.AI_CAPTIONS_ENABLED === "true";

const steps = [
  {
    number: "01",
    title: "Upload your photo",
    text: "Choose a JPG, PNG, or WEBP from your device. Manual editing stays in your browser.",
  },
  {
    number: "02",
    title: "Add meme text",
    text: "Write top and bottom captions, choose a preset, or add emoji and image stickers.",
  },
  {
    number: "03",
    title: "Download a PNG",
    text: "Choose a square, portrait, or story format, review the preview, and save the finished meme.",
  },
];

const useCases = [
  {
    title: "Social posts",
    text: "Turn a personal photo into a square or portrait meme for a social feed.",
    href: "/#generator",
  },
  {
    title: "Group chat reactions",
    text: "Add a short setup and payoff to a reaction photo for chats and comments.",
    href: "/photo-reaction-meme-maker",
  },
  {
    title: "Product jokes",
    text: "Use a product photo, label, or logo sticker to create a visual inside joke.",
    href: "/#generator",
  },
  {
    title: "Pet memes",
    text: "Caption a pet expression and add an emoji without covering the main subject.",
    href: "/#generator",
  },
  {
    title: "Event moments",
    text: "Transform a memorable event photo into a shareable PNG with clear context.",
    href: "/how-to-make-a-meme-from-a-photo",
  },
  {
    title: "Inside jokes",
    text: "Combine a familiar photo with editable text for friends, teams, or communities.",
    href: "/#generator",
  },
];

const pricingStyles: Record<string, string> = {
  "Free Demo": "from-[#fff7c2] via-[#fff7e8] to-white",
  "Creator Plan": "from-[#ffd6e7] via-[#fff0a8] to-[#dff7ff]",
};

const faqs = [
  {
    question: "Do you upload my photo?",
    answer:
      "Manual photo editing stays in your browser. If you choose the optional AI caption feature, a compressed copy is sent to the configured AI provider only after you review the notice and explicitly continue.",
  },
  {
    question: "Is an account required?",
    answer:
      "No. You can create and download photo memes without creating an account.",
  },
  {
    question: "Does this use an AI API?",
    answer:
      "The manual editor does not require an AI API. When AI captions are enabled, they are optional and only run after consent; the generated caption ideas remain editable.",
  },
  {
    question: "Can I download the result?",
    answer:
      "Yes. You can download the completed meme as a PNG after editing the photo, text, stickers, and format.",
  },
  {
    question: "How can I contact support?",
    answer:
      "For product, payment, refund, or Creator license questions, contact support@memephotoai.com.",
  },
];

const homeStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: siteConfig.url,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any modern web browser",
    description: siteConfig.description,
    offers: [
      {
        "@type": "Offer",
        name: "Free Demo",
        price: "0",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "Creator Plan",
        price: "9",
        priceCurrency: "USD",
        url: absoluteUrl("/pricing"),
      },
    ],
    featureList: [
      "Upload a photo",
      "Add top and bottom captions",
      "Use caption presets",
      "Add emoji and image stickers",
      "Export a PNG",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  },
];

function UseCaseDecoration({ item }: { item: string }) {
  if (item === "Social posts") {
    return (
      <>
        <span className="absolute right-5 top-5 h-24 w-14 rounded-[1.25rem] border-4 border-zinc-950/10 bg-[#dff7ff]/80" />
        <span className="absolute right-8 top-10 h-3 w-8 rounded-full bg-zinc-950/10" />
        <span className="absolute right-16 top-24 h-8 w-8 rounded-full bg-[#ffde59]/80" />
        <span className="absolute right-3 top-20 h-7 w-12 rounded-full bg-[#ffd6e7]/80" />
      </>
    );
  }

  if (item === "Group chat reactions") {
    return (
      <>
        <span className="absolute right-4 top-6 h-12 w-24 rounded-[1.25rem] bg-[#dff7ff]/80" />
        <span className="absolute right-14 top-20 h-10 w-20 rounded-[1.25rem] bg-[#ffd6e7]/80" />
        <span className="absolute right-8 top-32 h-4 w-4 rounded-full bg-[#ffde59]" />
        <span className="absolute right-16 top-32 h-4 w-4 rounded-full bg-zinc-950/15" />
      </>
    );
  }

  if (item === "Product jokes") {
    return (
      <>
        <span className="absolute right-7 top-7 h-20 w-24 rotate-6 rounded-[1.25rem] border-4 border-zinc-950/10 bg-[#fff7c2]/80" />
        <span className="absolute right-4 top-20 rounded-full bg-[#ffd6e7]/90 px-5 py-2 text-xs font-black text-zinc-950/50">
          NEW
        </span>
        <span className="absolute right-24 top-16 h-10 w-10 rounded-xl bg-[#dff7ff]/80" />
      </>
    );
  }

  if (item === "Pet memes") {
    return (
      <>
        <span className="absolute right-8 top-8 h-12 w-12 rounded-full bg-[#ffd6e7]/80" />
        <span className="absolute right-14 top-4 h-8 w-8 rotate-45 rounded-lg bg-[#ffd6e7]/80" />
        <span className="absolute right-5 top-[68px] h-5 w-5 rounded-full bg-zinc-950/10" />
        <span className="absolute right-[72px] top-20 h-5 w-5 rounded-full bg-zinc-950/10" />
        <span className="absolute right-11 top-24 h-6 w-8 rounded-full bg-zinc-950/10" />
      </>
    );
  }

  if (item === "Event moments") {
    return (
      <>
        <span className="absolute right-7 top-8 h-20 w-24 -rotate-6 rounded-[1.25rem] border-4 border-white bg-[#dff7ff]/80 shadow-sm" />
        <span className="absolute right-28 top-6 h-3 w-3 rounded-full bg-[#ffde59]" />
        <span className="absolute right-12 top-6 h-3 w-8 rotate-45 rounded-full bg-[#ffd6e7]" />
        <span className="absolute right-6 top-32 h-2 w-2 rounded-full bg-zinc-950/20" />
      </>
    );
  }

  return (
    <>
      <span className="absolute right-7 top-7 h-20 w-24 rotate-3 rounded-[1rem] bg-[#fff7c2]/85 shadow-sm" />
      <span className="absolute right-4 top-20 h-10 w-24 rounded-[1.25rem] bg-[#dff7ff]/80" />
      <span className="absolute right-32 top-[72px] h-3 w-3 rounded-full bg-zinc-950/20" />
      <span className="absolute right-20 top-[136px] h-3 w-3 rounded-full bg-[#ffd6e7]" />
    </>
  );
}

function StepDecoration({ number }: { number: string }) {
  if (number === "01") {
    return (
      <>
        <span className="absolute right-5 top-5 h-20 w-24 rotate-6 rounded-[1.25rem] border-2 border-dashed border-zinc-950/12 bg-[#dff7ff]/50" />
        <span className="absolute right-14 top-12 h-9 w-3 rounded-full bg-zinc-950/10" />
        <span className="absolute right-[45px] top-11 h-6 w-6 rotate-45 border-r-4 border-t-4 border-zinc-950/10" />
        <span className="absolute bottom-5 right-7 h-12 w-16 -rotate-6 rounded-xl border-4 border-white bg-[#ffde59]/55 shadow-sm" />
      </>
    );
  }

  if (number === "02") {
    return (
      <>
        <span className="absolute right-5 top-6 h-12 w-28 rounded-[1.5rem] bg-[#ffd6e7]/55" />
        <span className="absolute right-12 top-20 h-10 w-24 rounded-[1.5rem] bg-[#dff7ff]/65" />
        <span className="absolute right-24 top-10 h-2 w-2 rounded-full bg-zinc-950/20" />
        <span className="absolute right-20 top-10 h-2 w-2 rounded-full bg-zinc-950/20" />
        <span className="absolute right-16 top-10 h-2 w-2 rounded-full bg-zinc-950/20" />
      </>
    );
  }

  return (
    <>
      <span className="absolute right-7 top-5 h-20 w-16 rotate-6 rounded-xl border border-zinc-950/10 bg-white/65 shadow-sm" />
      <span className="absolute right-12 top-10 h-20 w-16 rotate-[-4deg] rounded-xl border border-zinc-950/10 bg-[#fff7c2]/70 shadow-sm" />
      <span className="absolute right-[58px] top-16 h-8 w-3 rounded-full bg-zinc-950/12" />
      <span className="absolute right-[47px] top-20 h-5 w-5 rotate-[135deg] border-r-4 border-t-4 border-zinc-950/12" />
      <span className="absolute bottom-8 right-7 h-3 w-3 rounded-full bg-[#d8ff63]" />
    </>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd data={homeStructuredData} />
      <div className="min-h-screen overflow-hidden bg-[#fff6e8] text-zinc-950">
      <SiteHeader />
      <main>
        <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto grid max-w-7xl gap-6 rounded-[2.75rem] border border-black/10 bg-[linear-gradient(135deg,#fffaf3_0%,#ffe7ef_42%,#dcf8ff_100%)] p-5 shadow-[0_30px_90px_rgba(51,36,21,0.16)] md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div className="flex flex-col justify-between rounded-[2rem] bg-white/70 p-6 backdrop-blur md:p-8">
              <div>
                <p className="w-fit rounded-full bg-zinc-950 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
                  Photo meme maker — browser based
                </p>
                <h1 className="mt-6 max-w-3xl text-balance text-5xl font-black tracking-tight text-zinc-950 md:text-6xl lg:text-7xl">
                  Make a meme from any photo
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-700">
                  Create a photo meme online with editable captions, presets,
                  emoji, and image stickers. Manual editing stays in your browser,
                  no account is required, and the finished meme downloads as a PNG.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/#generator"
                  className="rounded-full bg-[#ffde59] px-6 py-4 text-center text-sm font-black text-zinc-950 shadow-[0_18px_45px_rgba(255,190,11,0.34)] transition hover:-translate-y-0.5"
                >
                  Start making a meme
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-full border border-zinc-950/15 bg-white px-6 py-4 text-center text-sm font-black text-zinc-950 transition hover:border-zinc-950"
                >
                  View pricing
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] bg-zinc-950 p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
                <div className="rounded-[1.5rem] bg-[#f8efe2] p-5 text-zinc-950">
                  <div className="relative flex h-80 flex-col justify-between overflow-hidden rounded-[1.25rem] bg-zinc-950 p-5 shadow-inner">
                    <Image
                      src="/assets/examples/couple-demo.png"
                      alt="Lifestyle couple photo meme example"
                      fill
                      priority
                      sizes="(min-width: 1024px) 42vw, (min-width: 768px) 80vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.04)_34%,rgba(0,0,0,0.08)_62%,rgba(0,0,0,0.58)_100%)]" />
                    <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] border-[10px] border-zinc-950" />
                    <div className="absolute left-5 top-24 rotate-[-8deg] rounded-2xl bg-white/88 px-4 py-2 text-xs font-black uppercase text-zinc-950 shadow-lg">
                      reaction
                    </div>
                    <div className="absolute left-[66%] top-[58%] -translate-x-1/2 -translate-y-1/2 text-5xl drop-shadow-[0_10px_18px_rgba(0,0,0,0.38)] sm:text-6xl">
                      ❤️
                    </div>
                    <p className="relative mx-auto max-w-md text-center text-[1.7rem] font-black uppercase leading-[0.95] text-white [text-shadow:0_3px_0_#111,0_0_16px_rgba(0,0,0,0.4)] sm:text-3xl">
                      When the group chat needs a reaction
                    </p>
                    <p className="relative mx-auto max-w-md text-center text-[1.7rem] font-black uppercase leading-[0.95] text-white [text-shadow:0_3px_0_#111,0_0_16px_rgba(0,0,0,0.4)] sm:text-3xl">
                      And your photo is ready
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative overflow-hidden rounded-[1.5rem] bg-white/80 p-5 shadow-sm">
                  <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#dff7ff]/65" />
                  <span className="absolute right-5 top-5 h-10 w-14 rounded-xl border border-zinc-950/10 bg-[#fff7c2]/70" />
                  <span className="absolute right-9 top-8 h-2 w-2 rounded-full bg-[#d8ff63]" />
                  <span className="absolute right-14 top-8 h-2 w-2 rounded-full bg-zinc-950/15" />
                  <p className="relative text-3xl font-black">Local</p>
                  <p className="relative mt-2 text-sm font-semibold text-zinc-600">
                    Image processing
                  </p>
                </div>
                <div className="relative overflow-hidden rounded-[1.5rem] bg-white/80 p-5 shadow-sm">
                  <span className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-[#ffde59]/45" />
                  <span className="absolute right-6 top-5 h-14 w-11 rotate-6 rounded-lg border border-zinc-950/10 bg-white/75 shadow-sm" />
                  <span className="absolute right-10 top-10 h-5 w-2 rounded-full bg-zinc-950/12" />
                  <span className="absolute right-[34px] top-[50px] h-4 w-4 rotate-[135deg] border-r-4 border-t-4 border-zinc-950/12" />
                  <p className="relative text-3xl font-black">PNG</p>
                  <p className="relative mt-2 text-sm font-semibold text-zinc-600">
                    Download output
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-8 sm:px-6 lg:px-8">
          <MemeGenerator
            aiCaptionsEnabled={aiCaptionsEnabled}
            afterEditorContent={<CreatorLicensePanel variant="compact" />}
          />

          <section id="how-it-works" className="scroll-mt-28">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="w-fit rounded-full bg-[#ffd6e7] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
                  Three simple steps
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                  How it works
                </h2>
              </div>
              <Link
                href="/#generator"
                className="w-fit rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white"
              >
                Try it now
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-gradient-to-br from-white via-[#fffaf3] to-[#f3fbff] p-6 shadow-sm"
                >
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_92%_14%,rgba(255,222,89,0.22)_0_15%,transparent_16%)]" />
                  <StepDecoration number={step.number} />
                  <span className="relative rounded-full bg-[#d8ff63] px-4 py-2 text-sm font-black">
                    {step.number}
                  </span>
                  <h3 className="relative mt-8 text-2xl font-black">
                    {step.title}
                  </h3>
                  <p className="relative mt-3 leading-7 text-zinc-600">
                    {step.text}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="rounded-[2.5rem] bg-[#eaf9ff] p-5 md:p-8">
              <div className="mb-6 max-w-2xl">
                <p className="w-fit rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
                  Use cases
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                  Made for quick visual jokes
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {useCases.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="relative overflow-hidden rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_86%_20%,rgba(255,222,89,0.28)_0_16%,transparent_17%),linear-gradient(135deg,rgba(255,247,232,0.7),rgba(223,247,255,0.38))]" />
                    <UseCaseDecoration item={item.title} />
                    <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffde59] text-lg font-black shadow-sm">
                      {item.title.slice(0, 1)}
                    </span>
                    <h3 className="relative mt-5 text-xl font-black">
                      {item.title}
                    </h3>
                    <p className="relative mt-2 text-sm leading-6 text-zinc-600">
                      {item.text}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="grid gap-4 rounded-[2.5rem] border border-black/10 bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
              <div className="md:col-span-2">
                <p className="w-fit rounded-full bg-zinc-950 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
                  Pricing
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                  Simple pricing
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
                  Use the free editor with a MemePhoto AI watermark, or choose
                  Creator Plan for watermark-free previews and PNG exports.
                </p>
              </div>
              {[
                ["Free Demo", "$0", "Create and export PNG memes with a MemePhoto AI watermark."],
                ["Creator Plan", "$9 one-time", "Remove the watermark from live previews and PNG exports."],
              ].map(([name, price, text]) => (
                <article
                  key={name}
                  className={`relative overflow-hidden rounded-[2rem] border border-black/10 bg-gradient-to-br ${
                    pricingStyles[name] ?? "from-[#fff7e8] to-white"
                  } p-6`}
                >
                  <span className="absolute right-4 top-4 h-16 w-16 rounded-full bg-white/45" />
                  <span className="absolute bottom-5 right-7 h-10 w-20 rotate-6 rounded-2xl bg-zinc-950/5" />
                  <span className="absolute right-20 top-12 h-8 w-8 rounded-xl bg-[#ffde59]/55" />
                  <h3 className="relative text-2xl font-black">{name}</h3>
                  <p className="relative mt-4 text-4xl font-black">{price}</p>
                  <p className="relative mt-4 min-h-16 leading-7 text-zinc-600">{text}</p>
                  <Link
                    href={name === "Creator Plan" ? "/pricing" : "/#generator"}
                    className="relative mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white"
                  >
                    {name === "Creator Plan" ? "View Creator Plan" : "Start creating"}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section id="faq" className="scroll-mt-28">
            <div className="mx-auto max-w-4xl">
              <p className="mx-auto w-fit rounded-full bg-[#d8ff63] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
                FAQ
              </p>
              <h2 className="mt-4 text-center text-3xl font-black tracking-tight md:text-5xl">
                Clear answers before you create
              </h2>
              <div className="mt-8 grid gap-3">
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group relative overflow-hidden rounded-[1.5rem] border border-black/10 bg-gradient-to-br from-white via-[#fffaf3] to-[#f5fbff] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md open:border-zinc-950/20 open:shadow-md"
                  >
                    <span className="absolute right-8 top-3 h-10 w-20 rounded-[1rem] bg-[#dff7ff]/40 transition group-open:bg-[#dff7ff]/65" />
                    <span className="absolute bottom-3 right-20 h-6 w-14 rounded-full bg-[#ffd6e7]/35" />
                    <span className="absolute left-5 top-5 h-2 w-2 rounded-full bg-[#ffde59]/70" />
                    <span className="absolute left-9 top-9 h-1.5 w-1.5 rounded-full bg-zinc-950/15" />
                    <summary className="relative flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black">
                      <span>{faq.question}</span>
                      <span className="rounded-full bg-[#ffde59] px-3 py-1 text-sm shadow-[0_0_0_0_rgba(255,222,89,0)] transition group-hover:shadow-[0_0_24px_rgba(255,222,89,0.45)] group-open:rotate-45 group-open:shadow-[0_0_28px_rgba(255,222,89,0.55)]">
                        +
                      </span>
                    </summary>
                    <p className="relative mt-3 leading-7 text-zinc-600">
                      {faq.question === "How can I contact support?" ? (
                        <>
                          If you have any questions about payments, refunds, or
                          using MemePhoto AI, please contact us at{" "}
                          <a
                            href="mailto:support@memephotoai.com"
                            className="font-black text-zinc-950 underline decoration-[#ffde59] decoration-2 underline-offset-4"
                          >
                            support@memephotoai.com
                          </a>
                          .
                        </>
                      ) : (
                        faq.answer
                      )}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
        <SiteFooter />
      </div>
    </>
  );
}
