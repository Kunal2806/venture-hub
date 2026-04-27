// components/about/TrustSection.tsx

interface TrustPillar {
  title: string;
  description: string;
}

interface Stat {
  value: string;
  label: string;
}

const pillars: TrustPillar[] = [
  {
    title: "Admin-Approved Profiles",
    description:
      "Every startup and mentor on the platform has been reviewed and approved by our team before going live. No self-publishing, no noise.",
  },
  {
    title: "Structured Interaction",
    description:
      "The EOI system means investors reach out with intent, and startups only engage with serious parties. No spam, no unsolicited messages.",
  },
  {
    title: "Verified Scoring",
    description:
      "Profile scores are tied to real data — pitch completeness, traction updates, and activity — giving investors a reliable signal of quality.",
  },
];

const stats: Stat[] = [
  { value: "100+", label: "Startups Onboarded" },
  { value: "50+", label: "Active Investors" },
  { value: "30+", label: "Verified Mentors" },
];

export function TrustSection() {
  return (
    <section className="bg-[#1A362B] text-[#F9F7F2] px-6 sm:px-12 py-24">
      <div className="max-w-6xl mx-auto">
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#F9F7F2]/40 mb-3">
          Trust &amp; Quality
        </span>
        <h2 className="font-serif text-4xl sm:text-5xl leading-[1.1] tracking-tight text-[#F9F7F2] mb-14">
          We enforce quality,{" "}
          <span className="italic font-normal">not just hope for it</span>
        </h2>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
          {pillars.map(({ title, description }, i) => (
            <div
              key={title}
              className="border-t border-[#F9F7F2]/15 pt-6 reveal"
              style={{ animationDelay: `${0.1 * (i + 1)}s` }}
            >
              <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F9F7F2]/50 mb-3">
                {title}
              </h4>
              <p className="text-sm text-[#F9F7F2]/70 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#F9F7F2]/10 border border-[#F9F7F2]/10">
          {stats.map(({ value, label }) => (
            <div key={label} className="px-10 py-10 text-center">
              <span className="block font-serif text-5xl font-semibold text-[#F9F7F2] tracking-tight leading-none mb-2">
                {value}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F9F7F2]/45">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}