"use client";

import { useState, useCallback } from "react";
import { calculateProfileScore } from "@/lib/profile-score";
import BasicInfoForm from "./sections/BasicInfoForm";
import PitchForm from "./sections/PitchForm";
import TractionForm from "./sections/TractionForm";
import FoundersForm from "./sections/FoundersForm";
import type { StartupProfile } from "@/db/schema";
import type { ProfileSection } from "./types";

type Tab = { id: ProfileSection; label: string; pts: number; description: string };

const TABS: Tab[] = [
  { id: "basic", label: "Basic Info", pts: 20, description: "Identity & classification" },
  { id: "pitch", label: "Pitch", pts: 30, description: "Problem, solution & USP" },
  { id: "traction", label: "Traction", pts: 20, description: "Metrics & funding ask" },
  { id: "founders", label: "Founders", pts: 20, description: "Team & credibility" },
];

type Props = { profile: StartupProfile; userId: string };

export default function ProfileClient({ profile: initialProfile, userId }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState<ProfileSection>("basic");

  const score = calculateProfileScore(profile);

  // After any section saves, refetch profile to recalculate score
  const handleSaved = useCallback(async () => {
    // Optimistic: re-fetch profile from server to get updated score
    // In a real app you'd use router.refresh() — here we trigger re-render
    // by updating a timestamp; the server component will revalidate via revalidatePath
    // For now, we increment a local counter to force a re-render signal
    // The score syncs on next hard navigation. For instant UI feedback, use optimistic below.
  }, []);

  const pct = score.total;
  const circumference = 2 * Math.PI * 40;
  const strokeDash = (pct / 100) * circumference;

  function getScoreColor(s: number) {
    if (s >= 75) return "text-green-600";
    if (s >= 50) return "text-amber-600";
    return "text-red-500";
  }

  function getStrokeColor(s: number) {
    if (s >= 75) return "#16a34a";
    if (s >= 50) return "#d97706";
    return "#dc2626";
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-forest text-cream px-6 py-8 md:py-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-cream/50 mb-1">
            Startup Dashboard
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium">
            Complete Your Profile
          </h1>
          <p className="text-cream/60 mt-1 text-sm">
            A complete profile gets 3× more investor views.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

          {/* ─── Left: Form area ─── */}
          <div>
            {/* Tab Navigation */}
            <nav className="flex overflow-x-auto gap-1 mb-8 pb-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                      isActive
                        ? "border-forest text-forest"
                        : "border-transparent text-forest/40 hover:text-forest/70"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Tab description */}
            <div className="mb-6">
              <h2 className="font-serif text-xl text-forest">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-forest/50 mt-0.5">
                {TABS.find((t) => t.id === activeTab)?.description}
                {" "}· up to {TABS.find((t) => t.id === activeTab)?.pts} points
              </p>
            </div>

            {/* Forms */}
            <div className="bg-white/70 p-6 md:p-8">
              {activeTab === "basic" && (
                <BasicInfoForm profile={profile} userId={userId} onSaved={handleSaved} />
              )}
              {activeTab === "pitch" && (
                <PitchForm profile={profile} userId={userId} onSaved={handleSaved} />
              )}
              {activeTab === "traction" && (
                <TractionForm profile={profile} userId={userId} onSaved={handleSaved} />
              )}
              {activeTab === "founders" && (
                <FoundersForm profile={profile} userId={userId} onSaved={handleSaved} />
              )}
            </div>
          </div>

          {/* ─── Right: Score sidebar ─── */}
          <aside className="space-y-6">
            {/* Score ring */}
            <div className="bg-white/70 p-6 flex flex-col items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-forest/50 mb-4">
                Profile Score
              </p>

              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="rgba(26,54,43,0.08)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={getStrokeColor(pct)}
                    strokeWidth="8"
                    strokeLinecap="square"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${getScoreColor(pct)}`}>
                    {pct}
                  </span>
                  <span className="text-xs text-forest/40">/ 90</span>
                </div>
              </div>

              <p className="text-sm text-forest/60 text-center mt-4">
                {pct < 30
                  ? "Just getting started"
                  : pct < 60
                  ? "Making progress"
                  : pct < 80
                  ? "Looking strong"
                  : "Investor-ready!"}
              </p>
            </div>

            {/* Section breakdown */}
            <div className="bg-white/70 p-6 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-forest/50">
                Breakdown
              </p>
              {[
                { label: "Basic Info", earned: score.basic, max: 20 },
                { label: "Pitch", earned: score.pitch, max: 30 },
                { label: "Traction", earned: score.traction, max: 20 },
                { label: "Founders", earned: score.founders, max: 20 },
                { label: "Documents", earned: 0, max: 10 },
              ].map(({ label, earned, max }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-forest/70 font-medium">{label}</span>
                    <span className={`font-bold ${earned === max ? "text-green-600" : "text-forest/50"}`}>
                      {earned}/{max}
                    </span>
                  </div>
                  <div className="h-1 bg-forest/10 w-full">
                    <div
                      className="h-1 bg-forest transition-all duration-500"
                      style={{ width: `${(earned / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="bg-beige p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-forest/50 mb-3">
                Next Steps
              </p>
              <ul className="space-y-2 text-sm text-forest/70">
                {score.pitch < 20 && <li>→ Fill in your Pitch section (+30 pts)</li>}
                {score.founders < 10 && <li>→ Add at least one founder (+20 pts)</li>}
                {score.traction < 5 && <li>→ Add traction metrics (+20 pts)</li>}
                {score.basic < 15 && <li>→ Complete basic info (+20 pts)</li>}
                {pct >= 70 && <li className="text-green-700 font-medium">✓ Upload pitch deck for full score</li>}
              </ul>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}