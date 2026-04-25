"use client";

import { useState, useTransition } from "react";
import type { InvestorProfile } from "@/db/schema";
import { AlertCircle, CheckCircle, Leaf } from "lucide-react";
import { updateThesis } from "../actions";

const THESIS_MAX = 2000;
const THESIS_MIN = 80;

type Props = { profile: InvestorProfile; userId: string; onSaved: () => void };

function CharBar({ current, max, min }: { current: number; max: number; min?: number }) {
  const pct     = Math.min((current / max) * 100, 100);
  const tooLong  = current > max;
  const tooShort = min !== undefined && current > 0 && current < min;
  const color    = tooLong ? "bg-red-400" : tooShort ? "bg-amber-400" : current >= (min ?? 0) && current > 0 ? "bg-green-500" : "bg-forest/30";
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

export default function ThesisForm({ profile, userId, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result,       setResult]       = useState<{ success: boolean; message?: string } | null>(null);
  const [thesisLen,    setThesisLen]    = useState(profile.investmentThesis?.length ?? 0);
  const [impactFocused, setImpactFocused] = useState(profile.impactFocused ?? false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("impactFocused", String(impactFocused));
    startTransition(async () => {
      const res = await updateThesis(fd);
      setResult(res);
      if (res.success) onSaved();
    });
  }

  const thesisQuality = thesisLen === 0 ? null
    : thesisLen < 80  ? "Too brief"
    : thesisLen < 200 ? "Decent"
    : thesisLen < 500 ? "Good"
    : "Strong";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <input type="hidden" name="profileId" value={profile.id} />
      <input type="hidden" name="userId"    value={userId} />

      {/* ── Investment Thesis ── */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-1">
          Investment Thesis
        </legend>
        <p className="text-xs text-forest/40 mb-3">
          Startups use this to decide whether to respond to your EOI. Be specific — vague theses get fewer replies.
        </p>
        <textarea id="investmentThesis" name="investmentThesis" rows={8} maxLength={THESIS_MAX}
          className="input-field resize-none w-full leading-relaxed"
          defaultValue={profile.investmentThesis ?? ""}
          placeholder={`"We back early-stage founders solving deep infrastructure problems in climate and sustainable agriculture across South and Southeast Asia. We write first cheques of ₹50L–₹2Cr and lead rounds."`}
          onChange={e => setThesisLen(e.target.value.length)} />
        <CharBar current={thesisLen} max={THESIS_MAX} min={THESIS_MIN} />
        {thesisLen > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex gap-1">
              {[80, 200, 500, 1000].map(t => (
                <div key={t} className={`h-1 w-8 rounded-full transition-colors duration-300 ${thesisLen >= t ? "bg-forest/60" : "bg-forest/10"}`} />
              ))}
            </div>
            <span className="text-[10px] text-forest/40">{thesisQuality}</span>
          </div>
        )}
      </fieldset>

      {/* ── Impact Focus Toggle ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          <span className="flex items-center gap-2"><Leaf className="w-3.5 h-3.5" />Impact Focus</span>
        </legend>
        <button type="button" onClick={() => setImpactFocused(v => !v)}
          className={`flex items-center gap-4 w-full p-4 rounded-xl border transition-all duration-200 ${
            impactFocused
              ? "bg-green-50 border-green-200"
              : "bg-beige/50 border-forest/8 hover:border-forest/25"
          }`}>
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
        {isPending ? "Saving…" : "Save Thesis"}
      </button>
    </form>
  );
}