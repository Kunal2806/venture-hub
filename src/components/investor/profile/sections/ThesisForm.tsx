"use client";

import { useState, useTransition } from "react";
import type { InvestorProfile } from "@/db/schema";
import { AlertCircle, CheckCircle, Leaf } from "lucide-react";
import { updateThesis } from "../actions";

const THESIS_MAX = 2000;
const THESIS_MIN = 80;

// ─── Types ────────────────────────────────────────────────────────────────────
type VResult = { error?: string; warning?: string; success?: string };

// ─── Feedback components ──────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5 animate-fade-in">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-[1px]" />
      <p className="text-red-500 text-xs leading-tight">{msg}</p>
    </div>
  );
}
function FieldWarn({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5 animate-fade-in">
      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-[1px]" />
      <p className="text-amber-600 text-xs leading-tight">{msg}</p>
    </div>
  );
}
function FieldOk({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5 animate-fade-in">
      <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-[1px]" />
      <p className="text-green-700 text-xs leading-tight">{msg}</p>
    </div>
  );
}
function CharCount({ cur, max }: { cur: number; max: number }) {
  const pct = cur / max;
  return (
    <span className={`text-[10px] tabular-nums transition-colors ${
      pct >= 1 ? "text-red-500" : pct >= 0.85 ? "text-amber-500" : "text-forest/30"
    }`}>{cur}/{max}</span>
  );
}
function CharBar({ current, max, min }: { current: number; max: number; min?: number }) {
  const pct      = Math.min((current / max) * 100, 100);
  const tooLong  = current > max;
  const tooShort = min !== undefined && current > 0 && current < min;
  const color    = tooLong
    ? "bg-red-400"
    : tooShort
    ? "bg-amber-400"
    : current >= (min ?? 0) && current > 0
    ? "bg-green-500"
    : "bg-forest/30";
  return (
    <div className="mt-2 space-y-1">
      <div className="h-1 w-full rounded-full bg-forest/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-forest/40">
        {min !== undefined && current > 0 && current < min
          ? <span className="text-amber-500">{min - current} more characters needed</span>
          : <span />}
        <span className={`ml-auto ${tooLong ? "text-red-500 font-medium" : ""}`}>{current} / {max}</span>
      </div>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateThesis(value: string): VResult {
  if (!value.trim()) return { warning: "A clear thesis attracts better-aligned founders." };
  if (value.trim().length < THESIS_MIN) return { warning: `A bit more detail helps founders understand your focus (${THESIS_MIN - value.trim().length} more chars).` };
  if (value.length > THESIS_MAX) return { error: `Max ${THESIS_MAX} characters.` };
  return { success: "Great — founders will appreciate the clarity." };
}

// ─── Thesis quality label ─────────────────────────────────────────────────────
function thesisQuality(len: number): string | null {
  if (len === 0)   return null;
  if (len < 80)    return "Too brief";
  if (len < 200)   return "Decent";
  if (len < 500)   return "Good";
  return "Strong";
}

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = { profile: InvestorProfile; userId: string; onSaved: () => void };

// ─── Component ────────────────────────────────────────────────────────────────
export default function ThesisForm({ profile, userId, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result,        setResult]        = useState<{ success: boolean; message?: string } | null>(null);
  const [touched,       setTouched]       = useState(false);
  const [thesisVal,     setThesisVal]     = useState(profile.investmentThesis ?? "");
  const [impactFocused, setImpactFocused] = useState(profile.impactFocused ?? false);

  const vResult = validateThesis(thesisVal);

  function handleChange(v: string) {
    const clamped = v.slice(0, THESIS_MAX);
    setThesisVal(clamped);
    setResult(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);

    if (vResult.error) return;

    const fd = new FormData(e.currentTarget);
    fd.set("investmentThesis", thesisVal);
    fd.set("impactFocused",    String(impactFocused));

    startTransition(async () => {
      const res = await updateThesis(fd);
      setResult(res);
      if (res.success) onSaved();
    });
  }

  const showErr  = touched && !!vResult.error;
  const showWarn = touched && !vResult.error && !!vResult.warning;
  const showOk   = touched && !vResult.error && !vResult.warning && !!vResult.success;

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <input type="hidden" name="profileId" value={profile.id} />
      <input type="hidden" name="userId"    value={userId} />

      {/* ── Investment Thesis ── */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-1">
          Investment Thesis
        </legend>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-forest/40">
            Startups use this to decide whether to respond to your EOI. Be specific — vague theses get fewer replies.
          </p>
          <CharCount cur={thesisVal.length} max={THESIS_MAX} />
        </div>
        <textarea
          id="investmentThesis"
          name="investmentThesis"
          rows={8}
          maxLength={THESIS_MAX}
          className={`input-field resize-none w-full leading-relaxed transition-colors ${
            showErr  ? "border-red-300 bg-red-50/30"    :
            showWarn ? "border-amber-300 bg-amber-50/20" :
            showOk   ? "border-green-400 bg-green-50/20" : ""
          }`}
          value={thesisVal}
          placeholder={`"We back early-stage founders solving deep infrastructure problems in climate and sustainable agriculture across South and Southeast Asia. We write first cheques of ₹50L–₹2Cr and lead rounds."`}
          onChange={e => handleChange(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        <CharBar current={thesisVal.length} max={THESIS_MAX} min={THESIS_MIN} />

        {showErr  && <div className="flex items-start gap-1.5 mt-1.5 animate-fade-in"><AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-[1px]" /><p className="text-red-500 text-xs leading-tight">{vResult.error}</p></div>}
        {showWarn && <div className="flex items-start gap-1.5 mt-1.5 animate-fade-in"><AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-[1px]" /><p className="text-amber-600 text-xs leading-tight">{vResult.warning}</p></div>}
        {showOk   && <div className="flex items-start gap-1.5 mt-1.5 animate-fade-in"><CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-[1px]" /><p className="text-green-700 text-xs leading-tight">{vResult.success}</p></div>}

        {thesisVal.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex gap-1">
              {[80, 200, 500, 1000].map(t => (
                <div key={t} className={`h-1 w-8 rounded-full transition-colors duration-300 ${thesisVal.length >= t ? "bg-forest/60" : "bg-forest/10"}`} />
              ))}
            </div>
            <span className="text-[10px] text-forest/40">{thesisQuality(thesisVal.length)}</span>
          </div>
        )}
      </fieldset>

      {/* ── Impact Focus Toggle ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          <span className="flex items-center gap-2"><Leaf className="w-3.5 h-3.5" />Impact Focus</span>
        </legend>
        <button
          type="button"
          onClick={() => setImpactFocused(v => !v)}
          className={`flex items-center gap-4 w-full p-4 rounded-xl border transition-all duration-200 ${
            impactFocused
              ? "bg-green-50 border-green-200"
              : "bg-beige/50 border-forest/8 hover:border-forest/25"
          }`}
        >
          <div className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-all ${impactFocused ? "bg-green-600" : "bg-forest/20"}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${impactFocused ? "left-[22px]" : "left-0.5"}`} />
          </div>
          <div className="text-left">
            <p className={`text-sm font-semibold ${impactFocused ? "text-green-800" : "text-forest"}`}>
              I am an Impact-Focused Investor
            </p>
            <p className={`text-xs mt-0.5 ${impactFocused ? "text-green-600" : "text-forest/50"}`}>
              Prioritise ESG-aligned, SDG-driven, or socially impactful startups
            </p>
          </div>
          {impactFocused && <CheckCircle className="ml-auto w-4 h-4 text-green-600 flex-shrink-0" />}
        </button>
      </fieldset>

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

      <button
        type="submit" disabled={isPending}
        className="btn-primary bg-forest text-cream px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-60 transition-all hover:bg-forest/90 rounded-lg"
      >
        {isPending ? "Saving…" : "Save Thesis"}
      </button>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </form>
  );
}