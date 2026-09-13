import Link from "next/link";

type GuideLink = {
  href: string;
  title: string;
  description: string;
};

export function GuideLinks({ links }: { links: GuideLink[] }) {
  return (
    <section aria-label="Related guides" className="grid gap-3 sm:grid-cols-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-2xl border border-black/10 bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-zinc-950 hover:shadow-md"
        >
          <p className="font-black text-zinc-950">{link.title}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{link.description}</p>
        </Link>
      ))}
    </section>
  );
}
