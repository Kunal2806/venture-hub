import Link from "next/link";
import Image from "next/image";
import { Quote } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center px-4 sm:px-8 py-16 sm:py-0 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Text Content */}
        <div className="lg:col-span-7 relative z-10 reveal" style={{ animationDelay: "0.2s" }}>
          <div className="mb-5 sm:mb-6 flex items-center gap-3 text-[#1A362B]/60 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em]">
            <span className="w-6 sm:w-8 h-px bg-[#1A362B]/30" />
            Rooted in Innovation
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-[6rem] leading-[0.95] text-[#1A362B] mb-6 sm:mb-8">
            Nurturing the seeds of{" "}
            <span className="italic font-normal">global change.</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-[#1A362B]/70 max-w-xl leading-relaxed mb-8 sm:mb-12">
            VentureHub connects the world's most visionary founders with the tactical capital and
            soul-led mentorship required to flourish sustainably.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            <Link
              href="/startups"
              className="btn-primary text-center px-8 sm:px-10 py-4 sm:py-5 bg-[#1A362B] text-white font-bold uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#1A362B]/10 hover:bg-[#1A362B]/90 transition-colors"
            >
              List Your Startup
            </Link>
            <Link
              href="/investors"
              className="text-center px-8 sm:px-10 py-4 sm:py-5 border border-[#1A362B]/20 text-[#1A362B] font-bold uppercase text-xs tracking-[0.2em] hover:bg-[#EFEBE3] transition-colors"
            >
              Start Investing
            </Link>
          </div>
        </div>

        {/* Image with Quote */}
        <div className="lg:col-span-5 relative reveal mt-8 lg:mt-0" style={{ animationDelay: "0.4s" }}>
          <div className="relative">
            <div className="w-full h-[340px] sm:h-[480px] lg:h-[600px] relative overflow-hidden shadow-2xl" 
                 style={{ clipPath: "polygon(0 0, 100% 0, 100% 95%, 0 100%)" }}>
              <Image
                src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800"
                alt="Lush plants representing growth"
                fill
                className="object-cover scale-110"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A362B]/40 to-transparent" />
            </div>
            
            {/* Quote Card - Hidden on mobile, shown on tablet and up */}
            <div className="hidden sm:block absolute -bottom-5 -left-4 lg:-left-10 bg-[#EFEBE3] p-5 sm:p-8 shadow-lg max-w-[200px] sm:max-w-[240px]">
              <p className="font-serif text-base sm:text-lg leading-snug italic text-[#1A362B]">
                "Growth is not just about size, it is about the depth of your roots."
              </p>
              <p className="mt-3 sm:mt-4 text-[10px] font-bold uppercase tracking-widest text-[#1A362B]/40">
                — Julian Thorne, Founder
              </p>
            </div>
          </div>
          
          {/* Decorative Blob */}
          <div className="absolute -top-20 -right-20 w-48 sm:w-64 h-48 sm:h-64 bg-[#1A362B]/5 rounded-full blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}