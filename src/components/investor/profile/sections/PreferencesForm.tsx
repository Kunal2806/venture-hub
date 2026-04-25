"use client";

import { useState, useTransition } from "react";
import { updatePreferences } from "../actions";
import type { InvestorProfile } from "@/db/schema";
import { AlertCircle, CheckCircle } from "lucide-react";

const INVESTOR_TYPE_OPTIONS = [
  { value: "ANGEL",           label: "Angel Investor" },
  { value: "VENTURE_CAPITAL", label: "Venture Capital" },
  { value: "PRIVATE_EQUITY",  label: "Private Equity" },
  { value: "CORPORATE",       label: "Corporate / CVC" },
  { value: "FAMILY_OFFICE",   label: "Family Office" },
  { value: "ACCELERATOR",     label: "Accelerator / Incubator" },
];

const SECTOR_OPTIONS = [
  "SaaS", "FinTech", "HealthTech", "EdTech", "AgriTech", "CleanTech",
  "E-Commerce", "Logistics", "AI/ML", "Cybersecurity", "Blockchain",
  "Media & Entertainment", "Real Estate", "Consumer", "B2B", "Deep Tech", "Other",
];

const STAGE_OPTIONS = [
  { value: "IDEA",     label: "Idea" },
  { value: "PRE_SEED", label: "Pre-Seed" },
  { value: "SEED",     label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B" },
  { value: "SERIES_C", label: "Series C" },
  { value: "GROWTH",   label: "Growth" },
];

const GEO_OPTIONS = [
  "India", "Southeast Asia", "USA", "UK", "Europe",
  "Middle East", "Africa", "Latin America", "Global",
];

type Props = { profile: InvestorProfile; userId: string; onSaved: () => void };

function TagChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`px-3 py-2 border rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
        selected
          ? "bg-forest text-white border-forest shadow-sm"
          : "bg-beige/50 border-forest/10 hover:bg-beige text-forest/70"
      }`}>
      {selected && <CheckCircle className="w-3 h-3 inline mr-1.5 -mt-0.5" />}
      {label}
    </button>
  );
}

export default function PreferencesForm({ profile, userId, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);

  const [investorType, setInvestorType] = useState(profile.investorType ?? "");
  const [sectors,      setSectors]      = useState<string[]>((profile.preferredSectors as string[]) ?? []);
  const [stages,       setStages]       = useState<string[]>((profile.preferredStages  as string[]) ?? []);
  const [geos,         setGeos]         = useState<string[]>((profile.preferredGeographies as string[]) ?? []);

  function toggle(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("preferredSectors",     JSON.stringify(sectors));
    fd.set("preferredStages",      JSON.stringify(stages));
    fd.set("preferredGeographies", JSON.stringify(geos));
    startTransition(async () => {
      const res = await updatePreferences(fd);
      setResult(res);
      if (res.success) onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <input type="hidden" name="profileId" value={profile.id} />
      <input type="hidden" name="userId"    value={userId} />

      {/* ── Investor Type ── */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          Investor Type <span className="text-red-400">*</span>
        </legend>
        <input type="hidden" name="investorType" value={investorType} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INVESTOR_TYPE_OPTIONS.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => setInvestorType(investorType === opt.value ? "" : opt.value)}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                investorType === opt.value
                  ? "bg-forest text-white border-forest"
                  : "bg-white text-forest/70 border-forest/15 hover:border-forest/40 hover:text-forest"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* ── Sectors ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-1">
          Preferred Sectors
        </legend>
        <p className="text-xs text-forest/40 mb-3">
          {sectors.length} selected · powers your startup recommendations
        </p>
        <div className="flex flex-wrap gap-2">
          {SECTOR_OPTIONS.map(s => (
            <TagChip key={s} label={s} selected={sectors.includes(s)} onToggle={() => toggle(sectors, setSectors, s)} />
          ))}
        </div>
      </fieldset>

      {/* ── Stages ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-1">
          Preferred Stages
        </legend>
        <p className="text-xs text-forest/40 mb-3">{stages.length} selected</p>
        <div className="flex flex-wrap gap-2">
          {STAGE_OPTIONS.map(s => (
            <TagChip key={s.value} label={s.label} selected={stages.includes(s.value)} onToggle={() => toggle(stages, setStages, s.value)} />
          ))}
        </div>
      </fieldset>

      {/* ── Geographies ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-1">
          Preferred Geographies
        </legend>
        <p className="text-xs text-forest/40 mb-3">{geos.length} selected</p>
        <div className="flex flex-wrap gap-2">
          {GEO_OPTIONS.map(g => (
            <TagChip key={g} label={g} selected={geos.includes(g)} onToggle={() => toggle(geos, setGeos, g)} />
          ))}
        </div>
      </fieldset>

      {result && (
        <div className={`flex items-start gap-2 p-4 rounded-xl border text-sm ${
          result.success
            ? "bg-green-50/40 border-green-200 text-green-700"
            : "bg-red-50/40 border-red-200 text-red-600"
        }`}>
          {result.success
            ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <p>{result.message}</p>
        </div>
      )}

      <button type="submit" disabled={isPending}
        className="btn-primary bg-forest text-cream px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-60 transition-all hover:bg-forest/90 rounded-lg">
        {isPending ? "Saving…" : "Save Preferences"}
      </button>
    </form>
  );
}