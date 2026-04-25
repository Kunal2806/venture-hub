"use client";

import { useState, useCallback } from "react";
import IdentityForm    from "./sections/IdentityForm";
import PreferencesForm from "./sections/PreferencesForm";
import ThesisForm      from "./sections/ThesisForm";
import TicketForm      from "./sections/TicketForm";
import type { InvestorProfile } from "@/db/schema";
import { ProfileSection } from "./types";
import { calculateInvestorScore } from "./investor-score";

type Tab = { id: ProfileSection; label: string; pts: number; description: string };

const TABS: Tab[] = [
  { id: "identity",    label: "Identity",     pts: 25, description: "Firm, bio & links" },
  { id: "preferences", label: "Preferences",  pts: 30, description: "Sectors, stages & type" },
  { id: "thesis",      label: "Thesis",       pts: 25, description: "Strategy & impact focus" },
  { id: "ticket",      label: "Ticket Size",  pts: 20, description: "Capital parameters" },
];

type Props = { profile: InvestorProfile; userId: string };

export default function InvestorProfileClient({ profile: initialProfile, userId }: Props) {
  const [profile,    setProfile]    = useState(initialProfile);
  const [activeTab,  setActiveTab]  = useState<ProfileSection>("identity");

  const score = calculateInvestorScore(profile);

  const handleSaved = useCallback(() => {
    // Server revalidated via revalidatePath in the action.
    // For instant score UI feedback, optimistic update would go here.
  }, []);

  const pct          = score.total;
  const circumference = 2 * Math.PI * 40;
  const strokeDash   = (pct / 100) * circumference;

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

  const approvalStatus = profile.approvalStatus ?? "PENDING";
  const statusLabel: Record<string, { text: string; cls: string }> = {
    PENDING:   { text: "Pending Review",  cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    APPROVED:  { text: "Approved",        cls: "bg-green-50 text-green-700 border border-green-200" },
    REJECTED:  { text: "Rejected",        cls: "bg-red-50 text-red-700 border border-red-200" },
    SUSPENDED: { text: "Suspended",       cls: "bg-stone-100 text-stone-600 border border-stone-200" },
  };
  const badge = statusLabel[approvalStatus] ?? statusLabel.PENDING;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-forest text-cream px-6 py-8 md:py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cream/50 mb-1">
                Investor Dashboard
              </p>
              <h1 className="font-serif text-3xl md:text-4xl font-medium">
                Complete Your Profile
              </h1>
              <p className="text-cream/60 mt-1 text-sm">
                A complete profile gets 3× more founder responses to your EOIs.
              </p>
            </div>
            <span className={`mt-1 flex-shrink-0 inline-flex items-center rounded px-3 py-1 text-xs font-bold uppercase tracking-wider ${badge.cls}`}>
              {badge.text}
            </span>
          </div>
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
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                      isActive
                        ? "border-forest text-forest"
                        : "border-transparent text-forest/40 hover:text-forest/70"
                    }`}>
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Tab description */}
            <div className="mb-6">
              <h2 className="font-serif text-xl text-forest">
                {TABS.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-forest/50 mt-0.5">
                {TABS.find(t => t.id === activeTab)?.description}
                {" "}· up to {TABS.find(t => t.id === activeTab)?.pts} points
              </p>
            </div>

            {/* Forms */}
            <div className="bg-white/70 p-6 md:p-8">
              {activeTab === "identity"    && <IdentityForm    profile={profile} userId={userId} onSaved={handleSaved} />}
              {activeTab === "preferences" && <PreferencesForm profile={profile} userId={userId} onSaved={handleSaved} />}
              {activeTab === "thesis"      && <ThesisForm      profile={profile} userId={userId} onSaved={handleSaved} />}
              {activeTab === "ticket"      && <TicketForm      profile={profile} userId={userId} onSaved={handleSaved} />}
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
                  <circle cx="50" cy="50" r="40" fill="none"
                    stroke="rgba(26,54,43,0.08)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="none"
                    stroke={getStrokeColor(pct)} strokeWidth="8"
                    strokeLinecap="square"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    style={{ transition: "stroke-dasharray 0.6s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${getScoreColor(pct)}`}>{pct}</span>
                  <span className="text-xs text-forest/40">/ 100</span>
                </div>
              </div>
              <p className="text-sm text-forest/60 text-center mt-4">
                {pct < 30 ? "Just getting started"
                  : pct < 60 ? "Making progress"
                  : pct < 80 ? "Looking strong"
                  : "Investor-ready!"}
              </p>
            </div>

            {/* Breakdown */}
            <div className="bg-white/70 p-6 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-forest/50">
                Breakdown
              </p>
              {[
                { label: "Identity",     earned: score.identity,    max: 25 },
                { label: "Preferences",  earned: score.preferences, max: 30 },
                { label: "Thesis",       earned: score.thesis,      max: 25 },
                { label: "Ticket Size",  earned: score.ticket,      max: 20 },
              ].map(({ label, earned, max }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-forest/70 font-medium">{label}</span>
                    <span className={`font-bold ${earned === max ? "text-green-600" : "text-forest/50"}`}>
                      {earned}/{max}
                    </span>
                  </div>
                  <div className="h-1 bg-forest/10 w-full">
                    <div className="h-1 bg-forest transition-all duration-500"
                      style={{ width: `${(earned / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Next Steps */}
            <div className="bg-beige p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-forest/50 mb-3">
                Next Steps
              </p>
              <ul className="space-y-2 text-sm text-forest/70">
                {score.thesis      < 12 && <li>→ Write your investment thesis (+25 pts)</li>}
                {score.preferences < 15 && <li>→ Add sectors &amp; stages (+30 pts)</li>}
                {score.ticket      < 10 && <li>→ Set your ticket size (+20 pts)</li>}
                {score.identity    < 13 && <li>→ Complete your bio &amp; links (+25 pts)</li>}
                {pct >= 80 && (
                  <li className="text-green-700 font-medium">
                    ✓ Your profile is investor-ready!
                  </li>
                )}
              </ul>
            </div>

            {/* Meta info */}
            <div className="bg-white/70 p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-forest/50">
                Account Info
              </p>
              {[
                { label: "Total Investments", value: String(profile.totalInvestments ?? 0) },
                { label: "Verified",          value: profile.isVerified ? "Yes ✓" : "No" },
                { label: "Member Since",      value: profile.createdAt?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) ?? "—" },
              ].map(m => (
                <div key={m.label} className="flex justify-between text-xs">
                  <span className="text-forest/50">{m.label}</span>
                  <span className="font-medium text-forest">{m.value}</span>
                </div>
              ))}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}