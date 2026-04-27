// components/about/CtaSection.tsx
import Link from "next/link";

interface CtaLink {
  href: string;
  label: string;
  variant: "primary" | "secondary" | "outline";
}

const ctaLinks: CtaLink[] = [
  { href: "/startups", label: "Join as Startup", variant: "primary" },
  { href: "/investors", label: "Join as Investor", variant: "secondary" },
  { href: "/mentorship", label: "Join as Menotr", variant: "outline" },
];

export function CtaSection() {
  return (
    <section className="bg-[#1A362B] text-[#F9F7F2] px-6 sm:px-12 py-28 text-center">
      <div className="max-w-3xl mx-auto reveal" style={{ animationDelay: "0.1s" }}>
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#F9F7F2]/40 mb-5">
          Get Started
        </span>
        <h2 className="font-serif text-4xl sm:text-5xl leading-[1.1] tracking-tight text-[#F9F7F2] mb-10">
          Join VentureHub today
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
          {ctaLinks.map(({ href, label, variant }) => (
            <Link
              key={label}
              href={href}
              className={
                variant === "primary"
                  ? "px-9 py-4 bg-[#F9F7F2] text-[#1A362B] font-bold uppercase text-xs tracking-[0.2em] hover:opacity-85 transition-opacity"
                  : variant === "secondary"
                  ? "px-9 py-4 bg-[#F9F7F2]/15 text-[#F9F7F2] font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#F9F7F2]/25 transition-colors"
                  : "px-9 py-4 border border-[#F9F7F2]/25 text-[#F9F7F2]/70 font-bold uppercase text-xs tracking-[0.2em] hover:border-[#F9F7F2]/60 hover:text-[#F9F7F2] transition-colors"
              }
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}