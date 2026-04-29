"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight, LayoutDashboard, UserCircle, Lock, Home } from "lucide-react";
import { Navigation } from "@/components/home/Navigation";
import { Footer } from "@/components/home/Footer";

export default function InvestorSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-beige/30">
      <Navigation activeItem="home" />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className="w-full max-w-lg">

          {/* ── Card ── */}
          <div className="bg-white/70 backdrop-blur-sm border border-forest/8 shadow-xl rounded-2xl overflow-hidden">

            {/* ── Top accent bar ── */}
            <div className="h-1 w-full bg-forest" />

            <div className="p-8 sm:p-12 space-y-8">

              {/* ── 1. SUCCESS HERO ── */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" strokeWidth={1.5} />
                  </div>
                  {/* Subtle pulse ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-green-200 animate-ping opacity-30" />
                </div>

                <div className="space-y-2">
                  <span className="text-forest/40 font-bold uppercase tracking-[0.4em] text-[10px] block">
                    VentureHub · Investors
                  </span>
                  <h1 className="font-serif text-3xl sm:text-4xl text-forest leading-tight">
                    Account Created <span className="italic">Successfully</span>
                  </h1>
                  <p className="text-forest/60 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
                    Welcome to VentureHub. Your investor account is ready to use — no waiting, no approval required.
                  </p>
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="border-t border-forest/8" />

              {/* ── 2. WHAT HAPPENS NEXT ── */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-forest/40">
                  You can now
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Explore startups tailored to your investment interests",
                    "Express interest in promising early-stage opportunities",
                    "Start conversations directly with founders",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-forest/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-forest/60">{i + 1}</span>
                      </div>
                      <span className="text-sm text-forest/70 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── 3 & 4. CTAs ── */}
              <div className="flex flex-col gap-3">
                {/* Primary CTA */}
                <Link
                  href="/dashboard/investor/discover"
                  className="group flex items-center justify-center gap-2 w-full bg-forest text-white px-6 py-3.5 rounded-xl font-bold uppercase text-xs tracking-[0.15em] hover:bg-forest/90 transition-colors shadow-sm shadow-forest/10"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Go to Dashboard
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>

                {/* Secondary CTA */}
                <Link
                  href="/dashboard/investor/profile"
                  className="flex items-center justify-center gap-2 w-full border border-forest/20 text-forest px-6 py-3.5 rounded-xl font-bold uppercase text-xs tracking-[0.15em] hover:bg-beige transition-colors"
                >
                  <UserCircle className="w-3.5 h-3.5" />
                  Complete Your Profile
                </Link>
              </div>

              {/* ── 5. PROFILE COMPLETION HINT ── */}
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl px-4 py-3 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                <p className="text-xs text-amber-800/80 leading-relaxed">
                  <span className="font-semibold">Tip:</span> Completing your investor profile helps us surface startups that match your thesis, stage preference, and sector focus.
                </p>
              </div>

              {/* ── Divider ── */}
              <div className="border-t border-forest/8" />

              {/* ── 6. TRUST ELEMENT ── */}
              <div className="flex items-center justify-center gap-2 text-center">
                <Lock className="w-3 h-3 text-forest/30 flex-shrink-0" />
                <p className="text-[10px] text-forest/35 leading-relaxed">
                  Your information is securely stored and used only to improve your experience.
                </p>
              </div>

            </div>
          </div>

          {/* ── 7. BACK LINK ── */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-forest/40 hover:text-forest transition-colors"
            >
              <Home className="w-3 h-3" />
              Back to Home
            </Link>
          </div>

        </div>
      </main>

      <Footer />

      <style jsx>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping {
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}