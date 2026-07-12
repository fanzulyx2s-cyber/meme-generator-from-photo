import Link from "next/link";

const navItems = [
  { label: "Generator", href: "/#generator" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/#faq" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-[#fffaf3]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-full bg-black px-4 py-2 text-sm font-black uppercase tracking-wide text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
        >
          MemePhoto AI
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/80 p-1 shadow-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-950 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/#generator"
          className="rounded-full bg-[#ffde59] px-5 py-3 text-sm font-black text-zinc-950 shadow-[0_12px_30px_rgba(255,190,11,0.32)] transition hover:-translate-y-0.5 hover:bg-[#ffd12f]"
        >
          Create Meme
        </Link>
      </div>
    </header>
  );
}
