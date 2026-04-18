"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/home/Navigation";
import { Footer } from "@/components/home/Footer";
import { CheckCircle, Mail, Clock, ArrowRight } from "lucide-react";

export default function ApplySuccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    // Get email from localStorage or query params
    const savedEmail = localStorage.getItem("application-email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
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
              {/* What happens next */}
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
                        We've sent a confirmation email to {email || "your email address"}. 
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

              {/* Next steps */}
              <div className="pt-6 border-t border-forest/10">
                <h2 className="font-serif text-2xl text-forest mb-6">While you wait</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => window.open("https://docs.venturehub.com", "_blank")}
                    className="text-left p-4 border border-forest/10 hover:border-forest/30 rounded-lg transition-colors group"
                  >
                    <h3 className="font-bold text-forest mb-1 group-hover:text-forest/80">Read our docs</h3>
                    <p className="text-xs text-forest/40">Learn more about the platform</p>
                  </button>
                  <button
                    onClick={() => router.push("/startups/guide")}
                    className="text-left p-4 border border-forest/10 hover:border-forest/30 rounded-lg transition-colors group"
                  >
                    <h3 className="font-bold text-forest mb-1 group-hover:text-forest/80">Founder's guide</h3>
                    <p className="text-xs text-forest/40">Tips for a successful journey</p>
                  </button>
                </div>
              </div>

              {/* Check status button */}
              <div className="pt-6">
                <button
                  onClick={() => router.push(`/apply/status?email=${encodeURIComponent(email)}`)}
                  className="w-full sm:w-auto px-8 py-4 bg-forest text-white font-bold uppercase text-xs tracking-[0.2em] hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  Check Application Status
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