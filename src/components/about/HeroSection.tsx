// components/about/HeroSection.tsx
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative bg-[#1A362B] text-[#F9F7F2] px-6 sm:px-12 py-28 sm:py-36 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/[0.03] pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-white/[0.025] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 text-center reveal" style={{ animationDelay: "0.1s" }}>
        {/* Eyebrow */}
        <div className="mb-6 flex items-center justify-center gap-3 text-[#F9F7F2]/40 text-[10px] font-bold uppercase tracking-[0.25em]">
          <span className="w-8 h-px bg-[#F9F7F2]/20" />
          The Startup Ecosystem Platform
          <span className="w-8 h-px bg-[#F9F7F2]/20" />
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl lg:text-[5rem] leading-[1.15] tracking-tight text-[#F9F7F2] mb-6">
          Connecting Startups, Investors,{" "}
          <span className="italic font-normal">and Mentors</span> in One Platform
        </h1>

        <p className="text-base sm:text-lg text-[#F9F7F2]/65 max-w-2xl mx-auto leading-relaxed mb-10">
          VentureHub enables startups to raise funding, investors to discover opportunities, and
          mentors to guide growth — all in a structured and trusted environment.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/startups"
            className="btn-primary px-10 py-4 bg-[#F9F7F2] text-[#1A362B] font-bold uppercase text-xs tracking-[0.2em] hover:opacity-85 transition-opacity"
          >
            Explore Startups
          </Link>
          <Link
            href="/investors"
            className="px-10 py-4 border border-[#F9F7F2]/30 text-[#F9F7F2] font-bold uppercase text-xs tracking-[0.2em] hover:border-[#F9F7F2]/70 transition-colors"
          >
            Join as Investor
          </Link>
        </div>
      </div>
    </section>
  );
}