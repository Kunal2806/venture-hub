// components/about/KeyFeaturesSection.tsx
import {
  LayoutDashboard,
  Handshake,
  MessageSquare,
  Star,
  ShieldCheck,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: LayoutDashboard,
    title: "Startup Discovery Dashboard",
    description:
      "Investors get a curated view of approved startups with filtering by stage, sector, and location.",
  },
  {
    icon: Handshake,
    title: "Expression of Interest (EOI)",
    description:
      "Structured interest signals replace cold outreach. Every interaction is intentional and tracked.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Messaging",
    description:
      "In-platform communication keeps conversations in context — no email threads, no lost history.",
  },
  {
    icon: Star,
    title: "Profile Scoring System",
    description:
      "Startups are scored on profile completeness and activity, surfacing the strongest opportunities first.",
  },
  {
    icon: ShieldCheck,
    title: "Admin Verification Layer",
    description:
      "Every startup and mentor goes through approval before going live. Quality is enforced, not assumed.",
  },
  {
    icon: GraduationCap,
    title: "Mentor Engagement System",
    description:
      "Mentors are matched to startups based on expertise, with session tracking and feedback loops.",
  },
];

export function KeyFeaturesSection() {
  return (
    <section className="px-6 sm:px-12 py-24">
      <div className="max-w-6xl mx-auto">
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A362B]/40 mb-3">
          Key Features
        </span>
        <h2 className="font-serif text-4xl sm:text-5xl leading-[1.1] tracking-tight text-[#1A362B] mb-14">
          Built for the real product,{" "}
          <span className="italic font-normal">not for demos</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className="border border-[#1A362B]/10 p-7 hover:border-[#1A362B] transition-colors duration-200 reveal"
              style={{ animationDelay: `${0.08 * (i + 1)}s` }}
            >
              <div className="w-10 h-10 bg-[#EFEBE3] flex items-center justify-center mb-5">
                <Icon size={18} strokeWidth={1.5} className="text-[#1A362B]" />
              </div>
              <h4 className="text-sm font-bold text-[#1A362B] mb-2">{title}</h4>
              <p className="text-sm text-[#4A5D4E] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}