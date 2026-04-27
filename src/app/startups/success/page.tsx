"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/home/Navigation";
import { Footer } from "@/components/home/Footer";
import { CheckCircle, Mail, Clock, ArrowRight } from "lucide-react";
import ReactConfetti from "react-confetti";

export default function ApplySuccessPage() {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const update = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => {
      window.removeEventListener("resize", update);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={400}
          recycle={false}
          gravity={0.2}
          colors={["#1a3a2a", "#4ade80", "#86efac", "#d4a574", "#fef3c7", "#f0fdf4", "#a3e635"]}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none" }}
        />
      )}

      <Navigation activeItem="startups" />

      <main className="flex-1 pt-24 sm:pt-32 pb-20 sm:pb-40 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 reveal">
            <div className="w-20 h-20 bg-forest/10 rounded-full flex items-center justify-center text-forest mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-forest mb-4">
              Application Received
            </h1>
            <p className="text-forest/70 text-lg max-w-xl mx-auto">
              Thank you for applying to VentureHub. Your vision is now in our ecosystem.
            </p>
          </div>

          <div className="bg-white/40 backdrop-blur-sm p-8 sm:p-12 border border-forest/5 shadow-2xl rounded-lg reveal animation-delay-150">
            <div className="space-y-8">

              <div>
                <h2 className="font-serif text-2xl text-forest mb-6">What happens next?</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-forest/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-forest" />
                    </div>
                    <div>
                      <h3 className="font-bold text-forest mb-1">Check your email</h3>
                      <p className="text-forest/60 text-sm">
                        We've sent a confirmation email to your email address.
                        This contains your application ID and next steps.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-forest/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-forest" />
                    </div>
                    <div>
                      <h3 className="font-bold text-forest mb-1">Review process</h3>
                      <p className="text-forest/60 text-sm">
                        Our team will review your application within 3-5 business days.
                        You'll receive another email once a decision has been made.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-forest/10">
                <h2 className="font-serif text-2xl text-forest mb-2">Track your application</h2>
                <p className="text-sm text-forest/50 mb-6">
                  Visit the status page at any time to see real-time updates on your application.
                </p>
                <button
                  onClick={() => router.push("/apply/status")}
                  className="px-8 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.2em] hover:bg-forest/90 transition-colors rounded-lg flex items-center gap-2"
                >
                  View Application Status
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}