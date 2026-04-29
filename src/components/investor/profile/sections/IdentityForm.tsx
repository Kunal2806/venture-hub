"use client";

import { useRef, useState, useTransition } from "react";
import { updateIdentity } from "../actions";
import type { InvestorProfile } from "@/db/schema";
import {
  AlertCircle, CheckCircle, Globe, Linkedin, MapPin, User,
} from "lucide-react";

// ─── Char limits (mirror registration form) ────────────────────────────────────
const CHAR_LIMITS = {
  firmName:    100,
  designation:  80,
  bio:        1000,
  linkedinUrl: 200,
  websiteUrl:  200,
  country:      80,
  city:         80,
};

const BIO_MIN = 50;

// ─── Types ─────────────────────────────────────────────────────────────────────
type VResult = { error?: string; warning?: string; success?: string };

// ─── Micro feedback components (identical to registration form) ────────────────
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
          ? <span className="text-amber-500">{min - current} more needed</span>
          : <span />}
        <span className={`ml-auto ${tooLong ? "text-red-500 font-medium" : ""}`}>{current} / {max}</span>
      </div>
    </div>
  );
}

// ─── Validation (mirrors registration form logic) ─────────────────────────────
function validate(id: string, value: string): VResult {
  switch (id) {
    case "firmName":
      if (!value.trim()) return { warning: "Firm name increases credibility with founders." };
      if (value.length > CHAR_LIMITS.firmName) return { error: `Max ${CHAR_LIMITS.firmName} characters.` };
      return { success: "Looks good" };

    case "designation":
      if (!value.trim()) return { warning: "Your title helps founders understand your role." };
      if (value.length > CHAR_LIMITS.designation) return { error: `Max ${CHAR_LIMITS.designation} characters.` };
      return { success: "Looks good" };

    case "bio":
      if (!value.trim()) return { warning: "Bio helps founders decide whether to respond to your EOI." };
      if (value.length < BIO_MIN) return { warning: `Add ${BIO_MIN - value.length} more characters.` };
      if (value.length > CHAR_LIMITS.bio) return { error: `Max ${CHAR_LIMITS.bio} characters.` };
      return { success: "Great — founders will appreciate the clarity." };

    case "linkedinUrl":
      if (!value.trim()) return { warning: "A LinkedIn profile increases founder trust." };
      if (!value.startsWith("https://")) return { error: "Must start with https://" };
      if (!value.includes("linkedin.com")) return { warning: "This doesn't look like a LinkedIn URL." };
      if (value.length > CHAR_LIMITS.linkedinUrl) return { error: `Max ${CHAR_LIMITS.linkedinUrl} characters.` };
      return { success: "Valid LinkedIn profile" };

    case "websiteUrl":
      if (!value.trim()) return { warning: "A website builds credibility with founders." };
      if (!value.startsWith("https://")) return { error: "Must start with https:// for security." };
      if (!/^https:\/\/.+\..+/.test(value.trim())) return { error: "Must be a valid URL — e.g. https://yourfirm.com" };
      if (value.length > CHAR_LIMITS.websiteUrl) return { error: `Max ${CHAR_LIMITS.websiteUrl} characters.` };
      return { success: "Valid URL" };

    case "country":
      if (!value.trim()) return { warning: "Location helps startups gauge geographic fit." };
      if (/\d/.test(value)) return { error: "Country name should not contain numbers." };
      return {};

    case "city":
      if (value.trim() && value.length > CHAR_LIMITS.city) return { error: `Max ${CHAR_LIMITS.city} characters.` };
      return {};

    default:
      return {};
  }
}

// ─── Bio quality label ─────────────────────────────────────────────────────────
function bioQuality(len: number): string | null {
  if (len === 0)   return null;
  if (len < 50)    return "Too short";
  if (len < 150)   return "Minimal";
  if (len < 300)   return "Good";
  if (len < 600)   return "Strong";
  return "Excellent";
}

// ─── Props ─────────────────────────────────────────────────────────────────────
type Props = { profile: InvestorProfile; userId: string; onSaved: () => void };

// ─── Component ─────────────────────────────────────────────────────────────────
export default function IdentityForm({ profile, userId, onSaved }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result,   setResult]   = useState<{ success: boolean; message?: string } | null>(null);
  const [errs,     setErrs]     = useState<Record<string, string>>({});
  const [warns,    setWarns]    = useState<Record<string, string>>({});
  const [oks,      setOks]      = useState<Record<string, string>>({});
  const [touched,  setTouched]  = useState<Record<string, boolean>>({});
  const [bioLen,   setBioLen]   = useState(profile.bio?.length ?? 0);

  // live field values so CharCount stays accurate
  const [vals, setVals] = useState({
    firmName:    profile.firmName    ?? "",
    designation: profile.designation ?? "",
    bio:         profile.bio         ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    websiteUrl:  profile.websiteUrl  ?? "",
    country:     profile.country     ?? "",
    city:        profile.city        ?? "",
  });

  function applyResult(id: string, r: VResult) {
    setErrs(p  => { const n = { ...p }; if (r.error)   n[id] = r.error;   else delete n[id]; return n; });
    setWarns(p => { const n = { ...p }; if (r.warning) n[id] = r.warning; else delete n[id]; return n; });
    setOks(p   => { const n = { ...p }; if (r.success) n[id] = r.success; else delete n[id]; return n; });
  }

  function handleChange(id: string, value: string) {
    const limit = CHAR_LIMITS[id as keyof typeof CHAR_LIMITS];
    const v = typeof limit === "number" ? value.slice(0, limit) : value;
    setVals(prev => ({ ...prev, [id]: v }));
    if (id === "bio") setBioLen(v.length);
    if (touched[id]) applyResult(id, validate(id, v));
    setResult(null);
  }

  function handleBlur(id: string) {
    setTouched(prev => ({ ...prev, [id]: true }));
    applyResult(id, validate(id, vals[id as keyof typeof vals] ?? ""));
  }

  function fieldCls(id: string) {
    if (!touched[id]) return "input-field";
    if (errs[id])     return "input-field border-red-300 bg-red-50/30";
    if (warns[id])    return "input-field border-amber-300 bg-amber-50/20";
    if (oks[id])      return "input-field border-green-400 bg-green-50/20";
    return "input-field";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ids = ["firmName", "designation", "bio", "linkedinUrl", "websiteUrl", "country", "city"];
    const allTouched = Object.fromEntries(ids.map(k => [k, true]));
    setTouched(allTouched);

    let hasErrors = false;
    ids.forEach(id => {
      const r = validate(id, vals[id as keyof typeof vals] ?? "");
      applyResult(id, r);
      if (r.error) hasErrors = true;
    });
    if (hasErrors) return;

    const fd = new FormData(e.currentTarget);
    // Sync controlled values into FormData
    ids.forEach(id => fd.set(id, vals[id as keyof typeof vals] ?? ""));

    startTransition(async () => {
      const res = await updateIdentity(fd);
      setResult(res);
      if (res.success) onSaved();
    });
  }

  const err  = (id: string) => touched[id] ? errs[id]  : undefined;
  const warn = (id: string) => touched[id] ? warns[id] : undefined;
  const ok   = (id: string) => touched[id] ? oks[id]   : undefined;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8" noValidate>
      <input type="hidden" name="profileId" value={profile.id} />
      <input type="hidden" name="userId"    value={userId} />

      {/* ── Firm & Role ── */}
      <fieldset className="space-y-5">
        <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          <User className="w-3.5 h-3.5" />
          Firm &amp; Role
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Firm Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-style" htmlFor="firmName">Firm / Fund Name</label>
              <CharCount cur={vals.firmName.length} max={CHAR_LIMITS.firmName} />
            </div>
            <input
              id="firmName" name="firmName"
              maxLength={CHAR_LIMITS.firmName}
              className={fieldCls("firmName")}
              value={vals.firmName}
              placeholder="e.g. Sequoia Capital India"
              onChange={e => handleChange("firmName", e.target.value)}
              onBlur={() => handleBlur("firmName")}
            />
            <FieldError msg={err("firmName")} />
            <FieldWarn  msg={warn("firmName")} />
            <FieldOk    msg={ok("firmName")} />
            <p className="text-[10px] text-forest/30 mt-1">Increases credibility with founders.</p>
          </div>

          {/* Designation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-style" htmlFor="designation">Your Title</label>
              <CharCount cur={vals.designation.length} max={CHAR_LIMITS.designation} />
            </div>
            <input
              id="designation" name="designation"
              maxLength={CHAR_LIMITS.designation}
              className={fieldCls("designation")}
              value={vals.designation}
              placeholder="e.g. Partner, Angel, Principal"
              onChange={e => handleChange("designation", e.target.value)}
              onBlur={() => handleBlur("designation")}
            />
            <FieldError msg={err("designation")} />
            <FieldWarn  msg={warn("designation")} />
            <FieldOk    msg={ok("designation")} />
            <p className="text-[10px] text-forest/30 mt-1">Helps founders understand your role.</p>
          </div>
        </div>
      </fieldset>

      {/* ── Bio ── */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-1">
          Professional Bio
        </legend>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-forest/40">
            Investment history, domain expertise, notable exits — what makes you the right partner?
          </p>
          <CharCount cur={vals.bio.length} max={CHAR_LIMITS.bio} />
        </div>
        <textarea
          id="bio" name="bio"
          rows={5}
          maxLength={CHAR_LIMITS.bio}
          className={`${fieldCls("bio")} resize-none leading-relaxed`}
          value={vals.bio}
          placeholder="Investment history, domain expertise, notable exits — what makes you the right partner for a founder?"
          onChange={e => handleChange("bio", e.target.value)}
          onBlur={() => handleBlur("bio")}
        />
        <CharBar current={vals.bio.length} max={CHAR_LIMITS.bio} min={BIO_MIN} />
        <FieldError msg={err("bio")} />
        <FieldWarn  msg={warn("bio")} />
        <FieldOk    msg={ok("bio")} />
        {vals.bio.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex gap-1">
              {[50, 150, 300, 600].map(t => (
                <div key={t} className={`h-1 w-8 rounded-full transition-colors duration-300 ${vals.bio.length >= t ? "bg-forest/60" : "bg-forest/10"}`} />
              ))}
            </div>
            <span className="text-[10px] text-forest/40">{bioQuality(vals.bio.length)}</span>
          </div>
        )}
      </fieldset>

      {/* ── Links ── */}
      <fieldset className="space-y-5">
        <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          <Globe className="w-3.5 h-3.5" />
          Links
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* LinkedIn */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-style" htmlFor="linkedinUrl">
                <span className="flex items-center gap-1.5"><Linkedin className="w-3 h-3" />LinkedIn URL</span>
              </label>
              <CharCount cur={vals.linkedinUrl.length} max={CHAR_LIMITS.linkedinUrl} />
            </div>
            <input
              id="linkedinUrl" name="linkedinUrl" type="url"
              maxLength={CHAR_LIMITS.linkedinUrl}
              className={fieldCls("linkedinUrl")}
              value={vals.linkedinUrl}
              placeholder="https://linkedin.com/in/yourname"
              onChange={e => handleChange("linkedinUrl", e.target.value)}
              onBlur={() => handleBlur("linkedinUrl")}
            />
            <FieldError msg={err("linkedinUrl")} />
            <FieldWarn  msg={warn("linkedinUrl")} />
            <FieldOk    msg={ok("linkedinUrl")} />
            {vals.linkedinUrl && oks["linkedinUrl"] && touched["linkedinUrl"] && (
              <a
                href={vals.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
              >
                Open profile ↗
              </a>
            )}
            <p className="text-[10px] text-forest/30 mt-1">Investors with LinkedIn get 2× more replies.</p>
          </div>

          {/* Website */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-style" htmlFor="websiteUrl">
                <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" />Website</span>
              </label>
              <CharCount cur={vals.websiteUrl.length} max={CHAR_LIMITS.websiteUrl} />
            </div>
            <input
              id="websiteUrl" name="websiteUrl" type="url"
              maxLength={CHAR_LIMITS.websiteUrl}
              className={fieldCls("websiteUrl")}
              value={vals.websiteUrl}
              placeholder="https://yourfirm.com"
              onChange={e => handleChange("websiteUrl", e.target.value)}
              onBlur={() => handleBlur("websiteUrl")}
            />
            <FieldError msg={err("websiteUrl")} />
            <FieldWarn  msg={warn("websiteUrl")} />
            <FieldOk    msg={ok("websiteUrl")} />
          </div>
        </div>
      </fieldset>

      {/* ── Location ── */}
      <fieldset className="space-y-5">
        <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          <MapPin className="w-3.5 h-3.5" />
          Location
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Country */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-style" htmlFor="country">Country</label>
              <CharCount cur={vals.country.length} max={CHAR_LIMITS.country} />
            </div>
            <input
              id="country" name="country"
              maxLength={CHAR_LIMITS.country}
              className={fieldCls("country")}
              value={vals.country}
              placeholder="India"
              onChange={e => handleChange("country", e.target.value)}
              onBlur={() => handleBlur("country")}
            />
            <FieldError msg={err("country")} />
            <FieldWarn  msg={warn("country")} />
          </div>

          {/* City */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-style" htmlFor="city">City</label>
              <CharCount cur={vals.city.length} max={CHAR_LIMITS.city} />
            </div>
            <input
              id="city" name="city"
              maxLength={CHAR_LIMITS.city}
              className={fieldCls("city")}
              value={vals.city}
              placeholder="Mumbai"
              onChange={e => handleChange("city", e.target.value)}
              onBlur={() => handleBlur("city")}
            />
            <FieldError msg={err("city")} />
          </div>
        </div>
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

      {/* ── Footer ── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit" disabled={isPending}
          className="btn-primary bg-forest text-cream px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-60 transition-all hover:bg-forest/90 rounded-lg"
        >
          {isPending
            ? (
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Saving…
              </span>
            )
            : "Save Identity"}
        </button>
        {Object.keys(errs).length > 0 && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {Object.keys(errs).length} field{Object.keys(errs).length > 1 ? "s need" : " needs"} attention
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