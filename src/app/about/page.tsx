// app/about/page.tsx
import { CtaSection } from "@/components/about/Ctasection";
import { HeroSection } from "@/components/about/HeroSection";
import { HowItWorksSection } from "@/components/about/HowItWorksSection";
import { KeyFeaturesSection } from "@/components/about/Keyfeaturessection";
import { MissionSection } from "@/components/about/Missionsection ";
import { ProblemSolutionSection } from "@/components/about/ProblemSolutionSection";
import { TrustSection } from "@/components/about/Trustsection ";
import { WhatWeDoSection } from "@/components/about/WhatWeDoSection";
import { Footer } from "@/components/home/Footer";
import { Navigation } from "@/components/home/Navigation";


export const metadata = {
  title: "About — VentureHub",
  description:
    "VentureHub connects startups, investors, and mentors in one structured, trusted platform.",
};

export default function AboutPage() {
  return (
    <main className="bg-[#F9F7F2] text-[#2D2D2D]">
      <Navigation activeItem="home" />
      <HeroSection />
      <WhatWeDoSection />
      <ProblemSolutionSection />
      <HowItWorksSection />
      <KeyFeaturesSection />
      <TrustSection />
      <MissionSection />
      <CtaSection />
      <Footer />
    </main>
  );
}