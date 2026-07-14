import Link from "next/link";

const footerLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refund" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-black/10 bg-zinc-950 p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] md:p-8">
        <span className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-[#ffde59]/12 blur-sm" />
        <span className="absolute bottom-8 right-16 h-28 w-44 rotate-6 rounded-[2rem] bg-[#ffd6e7]/10" />
        <span className="absolute right-6 top-8 h-24 w-24 rounded-full bg-[#dff7ff]/10" />
        <div className="relative grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#ffde59]">
              MemePhoto AI
            </p>
            <p className="mt-3 max-w-xl text-balance text-2xl font-black">
              A simple browser-based meme maker for photos. Your image stays on
              your device.
            </p>
            <p className="mt-4 text-sm font-semibold text-white/75">
              <a
                href="mailto:support@memephotoai.com"
                className="transition hover:text-[#ffde59]"
              >
                support@memephotoai.com
              </a>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="relative mt-6 flex flex-col gap-2 border-t border-white/10 pt-5 text-sm font-semibold text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 MemePhoto AI</p>
          <p>
            Contact:{" "}
            <a
              href="mailto:support@memephotoai.com"
              className="text-white transition hover:text-[#ffde59]"
            >
              support@memephotoai.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
