"use client";

import { useState } from "react";
import {
  User, Briefcase, Target, MapPin, Globe, Linkedin,
  DollarSign, Zap, CheckCircle2, ChevronRight, ChevronDown,
  Leaf, Building2, TrendingUp, Shield, ArrowRight, Sparkles,
  AlertCircle,
} from "lucide-react";
import type { InvestorProfile } from "@/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

type InvestorType =
  | "ANGEL" | "VENTURE_CAPITAL" | "PRIVATE_EQUITY"
  | "CORPORATE" | "FAMILY_OFFICE" | "ACCELERATOR";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

// ─── Constants ────────────────────────────────────────────────────────────────

const INVESTOR_TYPES: { value: InvestorType; label: string; icon: React.ReactNode }[] = [
  { value: "ANGEL",           label: "Angel Investor",    icon: <Sparkles className="h-3.5 w-3.5" /> },
  { value: "VENTURE_CAPITAL", label: "Venture Capital",   icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: "PRIVATE_EQUITY",  label: "Private Equity",    icon: <Shield className="h-3.5 w-3.5" /> },
  { value: "FAMILY_OFFICE",   label: "Family Office",     icon: <Building2 className="h-3.5 w-3.5" /> },
  { value: "CORPORATE",       label: "Corporate VC",      icon: <Briefcase className="h-3.5 w-3.5" /> },
  { value: "ACCELERATOR",     label: "Accelerator",       icon: <Zap className="h-3.5 w-3.5" /> },
];

const SECTORS = [
  "SaaS", "FinTech", "HealthTech", "EdTech", "CleanTech",
  "E-commerce", "AgriTech", "DeepTech", "Mobility", "BioTech",
  "PropTech", "LegalTech", "FoodTech", "SpaceTech", "Web3",
];

const STAGES = [
  { value: "IDEA",     label: "Idea" },
  { value: "PRE_SEED", label: "Pre-Seed" },
  { value: "SEED",     label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B" },
  { value: "SERIES_C", label: "Series C" },
  { value: "GROWTH",   label: "Growth" },
];

const GEOGRAPHIES = [
  "India", "Southeast Asia", "USA", "UK", "Europe",
  "Middle East", "Africa", "Latin America", "Global",
];

const TICKET_PRESETS = [
  { label: "₹5L–₹25L",    min: "500000",    max: "2500000" },
  { label: "₹25L–₹1Cr",   min: "2500000",   max: "10000000" },
  { label: "₹1Cr–₹5Cr",   min: "10000000",  max: "50000000" },
  { label: "₹5Cr–₹20Cr",  min: "50000000",  max: "200000000" },
  { label: "₹20Cr+",       min: "200000000", max: "" },
];

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; classes: string }> = {
  PENDING:   { label: "Pending Review",  classes: "bg-amber-50 text-amber-700 border border-amber-200" },
  APPROVED:  { label: "Approved",        classes: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  REJECTED:  { label: "Rejected",        classes: "bg-red-50 text-red-700 border border-red-200" },
  SUSPENDED: { label: "Suspended",       classes: "bg-stone-100 text-stone-600 border border-stone-200" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 text-xs font-bold uppercase tracking-widest text-[#1A362B]/40">
      {children}
    </p>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-widest text-[#1A362B]/50 mb-2">
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

function InputField({
  value, onChange, placeholder, type = "text",
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent border-b border-[#1A362B]/20 py-3 text-sm text-[#2D2D2D] placeholder-[#4A5D4E]/40 focus:border-[#1A362B] focus:outline-none transition-colors"
    />
  );
}

function TextareaField({
  value, onChange, placeholder, rows = 4,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-transparent border border-[#1A362B]/15 rounded-xl p-4 text-sm text-[#2D2D2D] placeholder-[#4A5D4E]/40 focus:border-[#1A362B]/40 focus:outline-none transition-colors resize-none leading-relaxed"
    />
  );
}

function TagToggle({
  label, selected, onToggle,
}: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
        selected
          ? "bg-[#1A362B] text-white border-[#1A362B]"
          : "bg-white text-[#4A5D4E] border-[#1A362B]/15 hover:border-[#1A362B]/40"
      }`}
    >
      {selected && <CheckCircle2 className="h-3 w-3 inline mr-1 -mt-0.5" />}
      {label}
    </button>
  );
}

function ProfileCompletenessBar({ profile }: { profile: Partial<Record<keyof InvestorProfile, unknown>> & { preferredSectors?: string[]; preferredStages?: string[]; firmName?: string | null; bio?: string | null; investorType?: string | null; ticketSizeMin?: string | null; investmentThesis?: string | null; linkedinUrl?: string | null } }) {
  const checks = [
    !!profile.firmName,
    !!profile.bio,
    !!profile.investorType,
    (profile.preferredSectors?.length ?? 0) > 0,
    (profile.preferredStages?.length ?? 0) > 0,
    !!profile.ticketSizeMin,
    !!profile.investmentThesis,
    !!profile.linkedinUrl,
  ];
  const score = checks.filter(Boolean).length;
  const pct = Math.round((score / checks.length) * 100);

  return (
    <div className="bg-white border border-[#1A362B]/8 rounded-2xl p-5 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-amber-400"}`} />
          <span className="text-xs font-semibold text-[#1A362B] uppercase tracking-wider">
            Profile Completeness
          </span>
        </div>
        <span className={`text-sm font-bold ${pct === 100 ? "text-emerald-600" : "text-amber-600"}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-[#EFEBE3] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct === 100
              ? "bg-emerald-500"
              : "bg-gradient-to-r from-[#1A362B] to-amber-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct < 100 && (
        <p className="text-xs text-[#4A5D4E] mt-2">
          Complete your profile to unlock startup discovery and send EOIs.
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface InvestorProfileFormProps {
  profile: InvestorProfile | null;
}

export default function InvestorProfileForm({ profile }: InvestorProfileFormProps) {
  const existingProfile: InvestorProfile | null = profile;
  const approvalStatus: ApprovalStatus = existingProfile?.approvalStatus ?? "PENDING";
  const badge = STATUS_CONFIG[approvalStatus];

  // ── Form state ──────────────────────────────────────────────────────
  const [firmName,           setFirmName]           = useState(existingProfile?.firmName ?? "");
  const [designation,        setDesignation]        = useState(existingProfile?.designation ?? "");
  const [bio,                setBio]                = useState(existingProfile?.bio ?? "");
  const [linkedinUrl,        setLinkedinUrl]        = useState(existingProfile?.linkedinUrl ?? "");
  const [websiteUrl,         setWebsiteUrl]         = useState(existingProfile?.websiteUrl ?? "");
  const [country,            setCountry]            = useState(existingProfile?.country ?? "");
  const [city,               setCity]               = useState(existingProfile?.city ?? "");
  const [investorType,       setInvestorType]       = useState<InvestorType | "">(existingProfile?.investorType ?? "");
  const [preferredSectors,   setPreferredSectors]   = useState<string[]>((existingProfile?.preferredSectors as string[]) ?? []);
  const [preferredStages,    setPreferredStages]    = useState<string[]>((existingProfile?.preferredStages as string[]) ?? []);
  const [preferredGeos,      setPreferredGeos]      = useState<string[]>((existingProfile?.preferredGeographies as string[]) ?? []);
  const [ticketMin,          setTicketMin]          = useState(existingProfile?.ticketSizeMin ?? "" as string);
  const [ticketMax,          setTicketMax]          = useState(existingProfile?.ticketSizeMax ?? "" as string);
  const [investmentThesis,   setInvestmentThesis]   = useState(existingProfile?.investmentThesis ?? "");
  const [impactFocused,      setImpactFocused]      = useState(existingProfile?.impactFocused ?? false);
  const [saved,              setSaved]              = useState(false);

  const formSnapshot = {
    firmName, bio, investorType: investorType as InvestorType || undefined,
    preferredSectors, preferredStages, ticketSizeMin: ticketMin,
    investmentThesis, linkedinUrl,
  };

  function toggleItem(arr: string[], setArr: (v: string[]) => void, item: string) {
    setArr(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  }

  function applyTicketPreset(min: string, max: string) {
    setTicketMin(min);
    setTicketMax(max);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <main className="min-h-screen bg-[#F9F7F2] px-4 py-12 sm:px-6 lg:px-8" style={{ fontFamily: "'Satoshi', sans-serif" }}>
      <div className="mx-auto max-w-3xl">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="mb-10 border-b border-[#1A362B]/10 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-[#1A362B]/40" />
                <p className="text-xs font-bold uppercase tracking-widest text-[#1A362B]/40">
                  Investor Dashboard
                </p>
              </div>
              <h1
                className="text-4xl font-medium text-[#1A362B]"
                style={{ fontFamily: "'Gambetta', serif" }}
              >
                Your Profile
              </h1>
              <p className="mt-2 text-base text-[#2D2D2D]/60">
                {existingProfile
                  ? "Update your investor information below."
                  : "Complete your profile to start sending expressions of interest."}
              </p>
            </div>

            <span
              className={`mt-1 inline-flex h-fit items-center rounded px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badge.classes}`}
            >
              {badge.label}
            </span>
          </div>
        </header>

        {/* ── Suspension notice ────────────────────────────────────────── */}
        {approvalStatus === "SUSPENDED" && (
          <div
            role="alert"
            className="mb-8 flex gap-3 border-l-2 border-red-400 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              <span className="font-semibold">Account suspended. </span>
              Please contact support for more information.
            </p>
          </div>
        )}

        {/* ── Completeness bar ─────────────────────────────────────────── */}
        <ProfileCompletenessBar profile={formSnapshot} />

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1: Identity
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-[#1A362B]/8 p-6 sm:p-10 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#1A362B]/8 flex items-center justify-center">
              <User className="h-4 w-4 text-[#1A362B]" />
            </div>
            <SectionLabel>Identity &amp; Credibility</SectionLabel>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <FieldLabel>Firm / Organisation Name</FieldLabel>
              <InputField value={firmName} onChange={setFirmName} placeholder="e.g. Sequoia Capital India" />
            </div>
            <div>
              <FieldLabel required>Your Designation</FieldLabel>
              <InputField value={designation} onChange={setDesignation} placeholder="e.g. Partner, Angel, Principal" />
            </div>
            <div>
              <FieldLabel>City</FieldLabel>
              <InputField value={city} onChange={setCity} placeholder="e.g. Mumbai" />
            </div>
            <div>
              <FieldLabel>Country</FieldLabel>
              <InputField value={country} onChange={setCountry} placeholder="e.g. India" />
            </div>
            <div>
              <FieldLabel>LinkedIn URL</FieldLabel>
              <div className="relative">
                <Linkedin className="absolute left-0 bottom-3.5 h-3.5 w-3.5 text-[#4A5D4E]/50" />
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/..."
                  className="w-full bg-transparent border-b border-[#1A362B]/20 py-3 pl-6 text-sm text-[#2D2D2D] placeholder-[#4A5D4E]/40 focus:border-[#1A362B] focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Website</FieldLabel>
              <div className="relative">
                <Globe className="absolute left-0 bottom-3.5 h-3.5 w-3.5 text-[#4A5D4E]/50" />
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="yourfirm.com"
                  className="w-full bg-transparent border-b border-[#1A362B]/20 py-3 pl-6 text-sm text-[#2D2D2D] placeholder-[#4A5D4E]/40 focus:border-[#1A362B] focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <FieldLabel required>Professional Bio</FieldLabel>
            <TextareaField
              value={bio}
              onChange={setBio}
              placeholder="Brief professional background — investment history, domain expertise, notable exits..."
              rows={4}
            />
            <p className="text-xs text-[#4A5D4E]/60 mt-2">
              {bio.length}/400 characters. Startups read this before replying to your EOI.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2: Investor Type
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-[#1A362B]/8 p-6 sm:p-10 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#1A362B]/8 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-[#1A362B]" />
            </div>
            <SectionLabel>Investor Classification</SectionLabel>
          </div>

          <FieldLabel required>Investor Type</FieldLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
            {INVESTOR_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setInvestorType(investorType === t.value ? "" : t.value)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 ${
                  investorType === t.value
                    ? "bg-[#1A362B] text-white border-[#1A362B]"
                    : "bg-white text-[#4A5D4E] border-[#1A362B]/15 hover:border-[#1A362B]/40 hover:text-[#1A362B]"
                }`}
              >
                <span className={investorType === t.value ? "text-white/70" : "text-[#1A362B]/50"}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3: Investment Preferences
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-[#1A362B]/8 p-6 sm:p-10 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#1A362B]/8 flex items-center justify-center">
              <Target className="h-4 w-4 text-[#1A362B]" />
            </div>
            <SectionLabel>Investment Preferences</SectionLabel>
          </div>

          {/* Sectors */}
          <div className="mb-8">
            <FieldLabel required>Preferred Sectors</FieldLabel>
            <p className="text-xs text-[#4A5D4E]/60 mb-3">
              {preferredSectors.length} selected — powers your startup recommendations
            </p>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => (
                <TagToggle
                  key={s}
                  label={s}
                  selected={preferredSectors.includes(s)}
                  onToggle={() => toggleItem(preferredSectors, setPreferredSectors, s)}
                />
              ))}
            </div>
          </div>

          {/* Stages */}
          <div className="mb-8">
            <FieldLabel required>Preferred Stages</FieldLabel>
            <p className="text-xs text-[#4A5D4E]/60 mb-3">
              {preferredStages.length} selected
            </p>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <TagToggle
                  key={s.value}
                  label={s.label}
                  selected={preferredStages.includes(s.value)}
                  onToggle={() => toggleItem(preferredStages, setPreferredStages, s.value)}
                />
              ))}
            </div>
          </div>

          {/* Geographies */}
          <div>
            <FieldLabel>Preferred Geographies</FieldLabel>
            <p className="text-xs text-[#4A5D4E]/60 mb-3">
              {preferredGeos.length} selected
            </p>
            <div className="flex flex-wrap gap-2">
              {GEOGRAPHIES.map((g) => (
                <TagToggle
                  key={g}
                  label={g}
                  selected={preferredGeos.includes(g)}
                  onToggle={() => toggleItem(preferredGeos, setPreferredGeos, g)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4: Ticket Size
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-[#1A362B]/8 p-6 sm:p-10 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#1A362B]/8 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#1A362B]" />
            </div>
            <SectionLabel>Ticket Size</SectionLabel>
          </div>

          {/* Presets */}
          <FieldLabel>Quick Select</FieldLabel>
          <div className="flex flex-wrap gap-2 mb-6">
            {TICKET_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyTicketPreset(p.min, p.max)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                  ticketMin === p.min && ticketMax === p.max
                    ? "bg-[#1A362B] text-white border-[#1A362B]"
                    : "bg-white text-[#4A5D4E] border-[#1A362B]/15 hover:border-[#1A362B]/40"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Manual range */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <FieldLabel required>Minimum (₹)</FieldLabel>
              <InputField
                value={ticketMin}
                onChange={setTicketMin}
                placeholder="e.g. 500000"
                type="number"
              />
            </div>
            <div>
              <FieldLabel>Maximum (₹)</FieldLabel>
              <InputField
                value={ticketMax}
                onChange={setTicketMax}
                placeholder="e.g. 5000000"
                type="number"
              />
            </div>
          </div>

          {ticketMin && (
            <div className="mt-4 flex items-center gap-2 text-xs text-[#4A5D4E]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Ticket range set: ₹{Number(ticketMin).toLocaleString("en-IN")}
              {ticketMax ? ` – ₹${Number(ticketMax).toLocaleString("en-IN")}` : "+"}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5: Investment Thesis + Impact
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-[#1A362B]/8 p-6 sm:p-10 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#1A362B]/8 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[#1A362B]" />
            </div>
            <SectionLabel>Strategy &amp; Thesis</SectionLabel>
          </div>

          <div className="mb-8">
            <FieldLabel required>Investment Thesis</FieldLabel>
            <TextareaField
              value={investmentThesis}
              onChange={setInvestmentThesis}
              placeholder={`"We back early-stage founders solving India-specific problems at the intersection of FinTech and vernacular UX."`}
              rows={5}
            />
            <p className="text-xs text-[#4A5D4E]/60 mt-2">
              Startups use this to decide whether to respond. Be specific — vague theses get fewer replies.
            </p>
          </div>

          {/* Impact toggle */}
          <div>
            <FieldLabel>Impact Focus</FieldLabel>
            <button
              type="button"
              onClick={() => setImpactFocused(!impactFocused)}
              className={`flex items-center gap-4 w-full p-4 rounded-xl border transition-all duration-200 ${
                impactFocused
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-[#F9F7F2] border-[#1A362B]/10 hover:border-[#1A362B]/25"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                impactFocused ? "bg-emerald-600 text-white" : "bg-white text-[#4A5D4E] border border-[#1A362B]/10"
              }`}>
                <Leaf className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className={`text-sm font-semibold ${impactFocused ? "text-emerald-800" : "text-[#2D2D2D]"}`}>
                  I am an Impact-Focused Investor
                </p>
                <p className={`text-xs mt-0.5 ${impactFocused ? "text-emerald-600" : "text-[#4A5D4E]"}`}>
                  Prioritise ESG-aligned, SDG-driven, or socially impactful startups
                </p>
              </div>
              <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                impactFocused ? "border-emerald-600 bg-emerald-600" : "border-[#1A362B]/20"
              }`}>
                {impactFocused && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                )}
              </div>
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            Meta cards (read-only, shown after profile exists)
        ══════════════════════════════════════════════════════════════ */}
        {existingProfile && (
          <aside className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Investments", value: String(existingProfile.totalInvestments ?? 0) },
              { label: "Verified",          value: existingProfile.isVerified ? "Yes" : "No" },
              { label: "Member Since",      value: existingProfile.createdAt?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) ?? "—" },
            ].map((m) => (
              <div key={m.label} className="border border-[#1A362B]/10 bg-[#EFEBE3] p-4 rounded-xl">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#1A362B]/40">{m.label}</p>
                <p className="text-base font-medium text-[#1A362B]">{m.value}</p>
              </div>
            ))}
          </aside>
        )}

        {/* ══════════════════════════════════════════════════════════════
            Save button
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-[#4A5D4E]/60">
            Your profile is reviewed by our team before going live.
          </p>
          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              saved
                ? "bg-emerald-600 text-white"
                : "bg-[#1A362B] text-white hover:bg-[#1A362B]/90"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                {existingProfile ? "Update Profile" : "Save Profile"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </main>
  );
}