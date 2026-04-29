"use client";

import { useState, useTransition } from "react";
import { updatePreferences } from "../actions";
import type { InvestorProfile } from "@/db/schema";
import { AlertCircle, CheckCircle } from "lucide-react";

// ─── Options (schema-aligned) ─────────────────────────────────────────────────

const INVESTOR_TYPE_OPTIONS = [
  { value: "ANGEL",           label: "Angel Investor" },
  { value: "VENTURE_CAPITAL", label: "Venture Capital" },
  { value: "PRIVATE_EQUITY",  label: "Private Equity" },
  { value: "CORPORATE",       label: "Corporate / CVC" },
  { value: "FAMILY_OFFICE",   label: "Family Office" },
  { value: "ACCELERATOR",     label: "Accelerator / Incubator" },
];

const SECTOR_OPTIONS = [
  { value: "climatetech", label: "Climatetech" },
  { value: "biotech",     label: "Biotechnology" },
  { value: "agtech",      label: "Agtech" },
  { value: "deeptech",    label: "Deeptech" },
  { value: "fintech",     label: "Fintech" },
  { value: "healthtech",  label: "Healthtech" },
  { value: "edtech",      label: "Edtech" },
  { value: "cleantech",   label: "Cleantech" },
  { value: "saas",        label: "SaaS" },
  { value: "ecommerce",   label: "E-commerce" },
  { value: "ai-ml",       label: "AI/ML" },
  { value: "robotics",    label: "Robotics" },
];

const STAGE_OPTIONS = [
  { value: "IDEA",     label: "Idea / Pre-product" },
  { value: "PRE_SEED", label: "Pre-Seed / MVP" },
  { value: "SEED",     label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B+" },
  { value: "GROWTH",   label: "Growth" },
];

const GEO_OPTIONS = [
  "North America", "South America", "Europe", "Middle East & Africa",
  "South Asia", "Southeast Asia", "East Asia", "Oceania", "Global",
];

// ─── Types ────────────────────────────────────────────────────────────────────
type VResult = { error?: string; warning?: string };

// ─── Feedback components ──────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-1.5 mt-2 animate-fade-in">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-[1px]" />
      <p className="text-red-500 text-xs leading-tight">{msg}</p>
    </div>
  );
}
function FieldWarn({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-1.5 mt-2 animate-fade-in">
      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-[1px]" />
      <p className="text-amber-600 text-xs leading-tight">{msg}</p>
    </div>
  );
}

// ─── Chip toggle ──────────────────────────────────────────────────────────────
function TagChip({
  label, selected, onToggle,
}: {
  label: string; selected: boolean; onToggle: () => void;
}) {
  return (
    <label className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-all ${
      selected
        ? "bg-forest text-white border-forest shadow-sm"
        : "bg-beige/50 border-forest/10 hover:bg-beige"
    }`}>
      <input type="checkbox" className="sr-only" checked={selected} onChange={onToggle} />
      <span className={`text-xs font-bold uppercase tracking-widest ${selected ? "text-white" : "text-forest/70"}`}>
        {selected && <CheckCircle className="w-3 h-3 inline mr-1.5 -mt-0.5" />}
        {label}
      </span>
    </label>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validatePreferences({
  investorType,
  sectors,
  stages,
  geos,
}: {
  investorType: string;
  sectors: string[];
  stages: string[];
  geos: string[];
}): Record<string, VResult> {
  const v: Record<string, VResult> = {};

  if (!investorType)
    v.investorType = { error: "Please select your investor type to continue." };

  if (sectors.length === 0)
    v.sectors = { warning: "Selecting sectors improves your startup recommendations." };

  if (stages.length === 0)
    v.stages = { warning: "Preferred stages help us match you with the right founders." };

  if (geos.length === 0)
    v.geos = { warning: "Adding geographies narrows down relevant deal flow." };

  return v;
}

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = { profile: InvestorProfile; userId: string; onSaved: () => void };

// ─── Component ────────────────────────────────────────────────────────────────
export default function PreferencesForm({ profile, userId, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result,       setResult]       = useState<{ success: boolean; message?: string } | null>(null);
  const [fieldErrs,    setFieldErrs]    = useState<Record<string, VResult>>({});
  const [submitted,    setSubmitted]    = useState(false);

  const [investorType, setInvestorType] = useState(profile.investorType ?? "");
  const [sectors,      setSectors]      = useState<string[]>((profile.preferredSectors as string[]) ?? []);
  const [stages,       setStages]       = useState<string[]>((profile.preferredStages  as string[]) ?? []);
  const [geos,         setGeos]         = useState<string[]>((profile.preferredGeographies as string[]) ?? []);

  function toggle(arr: string[], setArr: (v: string[]) => void, val: string) {
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    setArr(next);
    if (submitted) {
      const v = validatePreferences({ investorType, sectors: next, stages, geos });
      setFieldErrs(v);
    }
    setResult(null);
  }

  function handleTypeChange(val: string) {
    const next = investorType === val ? "" : val;
    setInvestorType(next);
    if (submitted) {
      const v = validatePreferences({ investorType: next, sectors, stages, geos });
      setFieldErrs(v);
    }
    setResult(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    const v = validatePreferences({ investorType, sectors, stages, geos });
    setFieldErrs(v);

    const hasErrors = Object.values(v).some(r => r.error);
    if (hasErrors) return;

    const fd = new FormData(e.currentTarget);
    fd.set("investorType",         investorType);
    fd.set("preferredSectors",     JSON.stringify(sectors));
    fd.set("preferredStages",      JSON.stringify(stages));
    fd.set("preferredGeographies", JSON.stringify(geos));

    startTransition(async () => {
      const res = await updatePreferences(fd);
      setResult(res);
      if (res.success) onSaved();
    });
  }

  const err  = (id: string) => submitted ? fieldErrs[id]?.error   : undefined;
  const warn = (id: string) => submitted ? fieldErrs[id]?.warning  : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <input type="hidden" name="profileId"    value={profile.id} />
      <input type="hidden" name="userId"       value={userId} />
      <input type="hidden" name="investorType" value={investorType} />

      {/* ── Investor Type ── */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          Investor Type <span className="text-red-400">*</span>
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INVESTOR_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value} type="button"
              onClick={() => handleTypeChange(opt.value)}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                investorType === opt.value
                  ? "bg-forest text-white border-forest shadow-sm"
                  : "bg-white text-forest/70 border-forest/15 hover:border-forest/40 hover:text-forest"
              }`}
            >
              {investorType === opt.value && (
                <CheckCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-white/70" />
              )}
              {opt.label}
            </button>
          ))}
        </div>
        <FieldError msg={err("investorType")} />
        <FieldWarn  msg={warn("investorType")} />
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
            <TagChip
              key={s.value}
              label={s.label}
              selected={sectors.includes(s.value)}
              onToggle={() => toggle(sectors, setSectors, s.value)}
            />
          ))}
        </div>
        <FieldWarn msg={warn("sectors")} />
      </fieldset>

      {/* ── Stages ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-1">
          Preferred Stages
        </legend>
        <p className="text-xs text-forest/40 mb-3">{stages.length} selected</p>
        <div className="flex flex-wrap gap-2">
          {STAGE_OPTIONS.map(s => (
            <TagChip
              key={s.value}
              label={s.label}
              selected={stages.includes(s.value)}
              onToggle={() => toggle(stages, setStages, s.value)}
            />
          ))}
        </div>
        <FieldWarn msg={warn("stages")} />
      </fieldset>

      {/* ── Geographies ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-1">
          Preferred Geographies
        </legend>
        <p className="text-xs text-forest/40 mb-3">{geos.length} selected</p>
        <div className="flex flex-wrap gap-2">
          {GEO_OPTIONS.map(g => (
            <TagChip
              key={g}
              label={g}
              selected={geos.includes(g)}
              onToggle={() => toggle(geos, setGeos, g)}
            />
          ))}
        </div>
        <FieldWarn msg={warn("geos")} />
      </fieldset>

      {/* ── Submission count summary ── */}
      {submitted && sectors.length > 0 && stages.length > 0 && geos.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl animate-fade-in">
          <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <p className="text-xs text-green-700 font-medium">
            {sectors.length} sector{sectors.length !== 1 ? "s" : ""} · {stages.length} stage{stages.length !== 1 ? "s" : ""} · {geos.length} {geos.length !== 1 ? "geographies" : "geography"} selected
          </p>
        </div>
      )}

      {/* ── Submission feedback ── */}
      {result && (
        <div className={`flex items-start gap-2 p-4 rounded-xl border text-sm animate-fade-in ${
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

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit" disabled={isPending}
          className="btn-primary bg-forest text-cream px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-60 transition-all hover:bg-forest/90 rounded-lg"
        >
          {isPending ? "Saving…" : "Save Preferences"}
        </button>
        {submitted && Object.values(fieldErrs).some(r => r.error) && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Fix errors above to continue
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </form>
  );
}