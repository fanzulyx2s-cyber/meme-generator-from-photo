import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fff6e8] text-zinc-950">
      <SiteHeader />
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-[2.5rem] border border-black/10 bg-white p-7 text-center shadow-[0_24px_80px_rgba(42,31,16,0.12)] md:p-12">
          <p className="mx-auto w-fit rounded-full bg-[#ffd6e7] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
            404 error
          </p>
          <h1 className="mt-6 text-balance text-4xl font-black tracking-tight md:text-6xl">
            This meme page wandered off
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
            The page you requested does not exist. Return to the photo meme
            maker or start creating a new meme from your own image.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-full border border-black/10 bg-white px-6 py-4 text-sm font-black transition hover:border-zinc-950"
            >
              Back to homepage
            </Link>
            <Link
              href="/#generator"
              className="rounded-full bg-zinc-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              Open the meme maker
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
