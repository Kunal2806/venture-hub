// components/about/HowItWorksSection.tsx

interface UserJourney {
  num: string;
  role: string;
  steps: string[];
}

const journeys: UserJourney[] = [
  {
    num: "01",
    role: "For Startups",
    steps: [
      "Apply to VentureHub",
      "Get admin-approved",
      "Build your profile",
      "Receive investor interest",
      "Start conversations",
    ],
  },
  {
    num: "02",
    role: "For Investors",
    steps: [
      "Browse the discovery dashboard",
      "Filter by sector and stage",
      "Express interest via EOI",
      "Connect through messaging",
      "Track your portfolio",
    ],
  },
  {
    num: "03",
    role: "For Mentors",
    steps: [
      "Apply and get verified",
      "Set areas of expertise",
      "Match with startups",
      "Run guided sessions",
      "Build lasting impact",
    ],
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-[#EFEBE3] px-6 sm:px-12 py-24">
      <div className="max-w-6xl mx-auto">
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A362B]/40 mb-3">
          How It Works
        </span>
        <h2 className="font-serif text-4xl sm:text-5xl leading-[1.1] tracking-tight text-[#1A362B] mb-14">
          A clear path for <span className="italic font-normal">every user</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {journeys.map(({ num, role, steps }, i) => (
            <div
              key={role}
              className="bg-[#F9F7F2] border-t-2 border-[#1A362B] pt-6 px-6 pb-8 reveal"
              style={{ animationDelay: `${0.1 * (i + 1)}s` }}
            >
              <p className="font-serif text-5xl font-semibold text-[#1A362B]/10 leading-none mb-5">
                {num}
              </p>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1A362B] mb-5">
                {role}
              </h3>
              <ul className="divide-y divide-[#1A362B]/06">
                {steps.map((step) => (
                  <li
                    key={step}
                    className="flex items-center gap-2 py-2.5 text-sm text-[#4A5D4E]"
                  >
                    <span className="text-[#1A362B]/25 text-xs">→</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}