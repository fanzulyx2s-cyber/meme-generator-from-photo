import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type SimplePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function SimplePage({
  eyebrow,
  title,
  description,
  children,
}: SimplePageProps) {
  return (
    <div className="min-h-screen bg-[#fff6e8] text-zinc-950">
      <SiteHeader />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2.5rem] border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(42,31,16,0.12)] md:p-10">
          <Link
            href="/"
            className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-black text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
          >
            Back home
          </Link>
          <p className="mt-8 w-fit rounded-full bg-[#d8ff63] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
            {eyebrow}
          </p>
          <h1 className="mt-5 text-balance text-4xl font-black tracking-tight md:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-600">
            {description}
          </p>
          <div className="mt-8 grid gap-4">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-[#fffaf3] p-6">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-3 space-y-3 leading-7 text-zinc-600">{children}</div>
    </section>
  );
}
