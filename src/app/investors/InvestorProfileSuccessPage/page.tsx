"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/home/Navigation";
import { Footer } from "@/components/home/Footer";
import { CheckCircle, Search, Bell, ArrowRight, Layers, Settings } from "lucide-react";
import { useSession } from "next-auth/react";

export default function InvestorProfileSuccessPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [firmName, setFirmName] = useState<string>("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("venturehub-investor-draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form?.firmName) setFirmName(parsed.form.firmName);
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation activeItem="home" isLoggedIn={!!session?.user} />

      <main className="flex-1 pt-24 sm:pt-32 pb-20 sm:pb-40 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">

          {/* Hero */}
          <div className="text-center mb-12 reveal">
            <div className="w-20 h-20 bg-forest/10 rounded-full flex items-center justify-center text-forest mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-forest mb-4">
              Profile Locked In
            </h1>
            <p className="text-forest/70 text-lg max-w-xl mx-auto">
              {firmName
                ? `${firmName}'s investment lens is live. We're already matching founders to your thesis.`
                : "Your investment lens is live. We're already matching founders to your thesis."
              }
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/40 backdrop-blur-sm p-8 sm:p-12 border border-forest/5 shadow-2xl rounded-lg reveal animation-delay-150">
            <div className="space-y-8">

              {/* What happens next */}
              <div>
                <h2 className="font-serif text-2xl text-forest mb-6">What happens next?</h2>
                <div className="space-y-5">
                  {[
                    {
                      icon: <Search className="w-4 h-4 text-forest" />,
                      title: "Discovery starts now",
                      desc: "We're scanning applications against your thesis, preferred sectors, stages, and geographies — you'll see matches appear in your dashboard.",
                    },
                    {
                      icon: <Bell className="w-4 h-4 text-forest" />,
                      title: "You'll be notified on fit",
                      desc: "When a high-confidence match comes in, you'll receive a notification. The more detail in your thesis, the sharper the matches.",
                    },
                    {
                      icon: <Layers className="w-4 h-4 text-forest" />,
                      title: "Founders can now find you",
                      desc: "Startups whose profile matches your preferences will see you as a recommended investor when they apply or browse.",
                    },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-forest/10 rounded-full flex items-center justify-center flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-forest mb-1">{item.title}</h3>
                        <p className="text-forest/60 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="pt-6 border-t border-forest/10">
                <h2 className="font-serif text-2xl text-forest mb-6">Quick actions</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push("/investor/dashboard")}
                    className="text-left p-4 border border-forest/10 hover:border-forest/30 rounded-lg transition-colors group"
                  >
                    <h3 className="font-bold text-forest mb-1 group-hover:text-forest/80">View Dashboard</h3>
                    <p className="text-xs text-forest/40">See your matches and pipeline</p>
                  </button>
                  <button
                    onClick={() => router.push("/investor/profile")}
                    className="text-left p-4 border border-forest/10 hover:border-forest/30 rounded-lg transition-colors group flex items-start gap-2"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-forest mb-1 group-hover:text-forest/80">Edit Profile</h3>
                      <p className="text-xs text-forest/40">Refine your thesis and preferences</p>
                    </div>
                    <Settings className="w-4 h-4 text-forest/20 mt-0.5 group-hover:text-forest/40 transition-colors" />
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-6">
                <button
                  onClick={() => router.push("/startups")}
                  className="w-full sm:w-auto px-8 py-4 bg-forest text-white font-bold uppercase text-xs tracking-[0.2em] hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 mx-auto rounded-lg"
                >
                  Browse Startups
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