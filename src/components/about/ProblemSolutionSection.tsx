// components/about/ProblemSolutionSection.tsx

const problems: string[] = [
  "Startups struggle to find the right investors and lack visibility.",
  "Investors receive unstructured, low-quality pitches with no filter.",
  "Mentorship is scattered, informal, and hard to access at scale.",
  "There is no single trusted space for all three to interact.",
];

const solutions: string[] = [
  "Structured onboarding with admin approval — quality from day one.",
  "Expression of Interest (EOI) system — controlled, intentional interaction.",
  "Built-in messaging — no cold outreach, no spam.",
  "Mentor integration — guided growth built into the platform.",
];

export function ProblemSolutionSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#1A362B]/08">
      {/* Problem */}
      <div className="px-8 sm:px-14 py-20 bg-[#F9F7F2] reveal" style={{ animationDelay: "0.1s" }}>
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A362B]/40 mb-4">
          The Problem
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl leading-[1.15] tracking-tight text-[#1A362B] mb-8">
          The ecosystem is <span className="italic font-normal">fragmented</span>
        </h2>
        <ul className="space-y-4">
          {problems.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[#4A5D4E] text-[0.92rem] leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#4A5D4E]/40 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Solution */}
      <div className="px-8 sm:px-14 py-20 bg-[#1A362B] text-[#F9F7F2] reveal" style={{ animationDelay: "0.2s" }}>
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#F9F7F2]/40 mb-4">
          The Solution
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl leading-[1.15] tracking-tight text-[#F9F7F2] mb-8">
          Structure <span className="italic font-normal">fixes everything</span>
        </h2>
        <ul className="space-y-4">
          {solutions.map((s) => (
            <li key={s} className="flex items-start gap-3 text-[#F9F7F2]/70 text-[0.92rem] leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#F9F7F2]/30 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}