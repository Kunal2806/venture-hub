import { auth } from "@/auth";
import { CTASection } from "@/components/home/Ctasection";
import { Footer } from "@/components/home/Footer";
import { HeroSection } from "@/components/home/Herosection";
import { MissionSection } from "@/components/home/Missionsection";
import { Navigation } from "@/components/home/Navigation";
import { VisionariesSection } from "@/components/home/Visionariessection";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#F9F7F2]">
      <Navigation activeItem="home" />
      <main className="pt-16 sm:pt-20">
        <HeroSection />
        <MissionSection />
        <VisionariesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}