// components/about/WhatWeDoSection.tsx
import { Rocket, Briefcase, Target, type LucideIcon } from "lucide-react";

interface Stakeholder {
  icon: LucideIcon;
  title: string;
  description: string;
}

const stakeholders: Stakeholder[] = [
  {
    icon: Rocket,
    title: "For Startups",
    description:
      "Showcase your idea, build a verified profile, and get discovered by the right investors.",
  },
  {
    icon: Briefcase,
    title: "For Investors",
    description:
      "Discover curated, admin-approved startups and connect through structured interest signals.",
  },
  {
    icon: Target,
    title: "For Mentors",
    description:
      "Share expertise and guide startups through hands-on, tracked engagement sessions.",
  },
];

const flowSteps = [
  "Startup applies",
  "Gets approved",
  "Investor discovers",
  "Expresses interest",
  "Conversation begins",
] as const;

export function WhatWeDoSection() {
  return (
    <section className="px-6 sm:px-12 py-24">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="reveal" style={{ animationDelay: "0.1s" }}>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A362B]/40 mb-4">
            What We Do
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.1] tracking-tight text-[#1A362B] mb-5">
            One platform.{" "}
            <span className="italic font-normal">Three stakeholders.</span>{" "}
            Real outcomes.
          </h2>
          <p className="text-[#4A5D4E] text-base leading-relaxed max-w-lg mb-8">
            VentureHub structures how the three actors that drive the startup ecosystem interact —
            maximising quality, trust, and outcome at every step.
          </p>

          {/* Flow box */}
          <div className="bg-[#1A362B] text-[#F9F7F2] px-6 py-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F9F7F2]/40 mb-3">
              The Product Loop
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {flowSteps.map((step, i) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#F9F7F2]">{step}</span>
                  {i < flowSteps.length - 1 && (
                    <span className="text-[#F9F7F2]/30 text-xs">→</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — stakeholder list */}
        <ul className="divide-y divide-[#1A362B]/08 reveal" style={{ animationDelay: "0.2s" }}>
          {stakeholders.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
              <div className="w-10 h-10 flex items-center justify-center bg-[#EFEBE3] shrink-0 mt-0.5">
                <Icon size={18} strokeWidth={1.5} className="text-[#1A362B]" />
              </div>
              <div>
                <strong className="block text-sm font-bold text-[#1A362B] mb-1">{title}</strong>
                <span className="text-sm text-[#4A5D4E] leading-relaxed">{description}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}