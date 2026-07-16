import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-[#fff6e8] text-zinc-950">
      <SiteHeader />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl overflow-hidden rounded-[2.5rem] border border-black/10 bg-white p-6 shadow-[0_24px_80px_rgba(42,31,16,0.12)] md:p-10">
          <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,#fffaf3_0%,#fff3bf_48%,#d8fbff_100%)] p-6 md:p-8">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/45" />
            <div className="pointer-events-none absolute bottom-6 right-8 h-12 w-20 rotate-6 rounded-3xl bg-[#ffde59]/35" />
            <p className="relative w-fit rounded-full bg-[#ffde59] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
              MemePhoto AI
            </p>
            <h1 className="relative mt-6 text-balance text-4xl font-black tracking-tight md:text-6xl">
              Payment Cancelled
            </h1>
            <p className="relative mt-5 max-w-2xl text-lg font-semibold leading-8 text-zinc-600">
              Your payment was not completed, and no Creator access was
              activated. You can return anytime and continue creating memes.
            </p>
            <Link
              href="/pricing"
              className="relative mt-8 inline-flex rounded-full bg-zinc-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Back to Pricing
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
