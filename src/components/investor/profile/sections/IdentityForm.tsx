"use client";

import { useRef, useState, useTransition } from "react";
import { updateIdentity } from "../actions";
import type { InvestorProfile } from "@/db/schema";
import { AlertCircle, CheckCircle, Globe, Linkedin, MapPin, User } from "lucide-react";

const BIO_MAX = 1000;
const BIO_MIN = 50;

type VResult = { error?: string; warning?: string; success?: string };

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-[1px]" />
      <p className="text-red-500 text-xs leading-tight">{msg}</p>
    </div>
  );
}
function FieldWarn({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-[1px]" />
      <p className="text-amber-600 text-xs leading-tight">{msg}</p>
    </div>
  );
}
function FieldOk({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5">
      <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-[1px]" />
      <p className="text-green-700 text-xs leading-tight">{msg}</p>
    </div>
  );
}
function CharBar({ current, max, min }: { current: number; max: number; min?: number }) {
  const pct     = Math.min((current / max) * 100, 100);
  const tooLong  = current > max;
  const tooShort = min !== undefined && current > 0 && current < min;
  const color    = tooLong ? "bg-red-400" : tooShort ? "bg-amber-400" : current >= (min ?? 0) ? "bg-green-500" : "bg-forest/30";
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

function validate(id: string, value: string): VResult {
  switch (id) {
    case "firmName":
      if (!value.trim()) return { warning: "Firm name increases credibility with founders." };
      if (value.length > 100) return { error: "Max 100 characters." };
      return { success: "Looks good" };
    case "designation":
      if (!value.trim()) return { error: "Your title is required." };
      if (value.length > 80) return { error: "Max 80 characters." };
      return { success: "Looks good" };
    case "bio":
      if (!value.trim()) return { warning: "Bio helps founders decide whether to respond to your EOI." };
      if (value.length < BIO_MIN) return { warning: `Add ${BIO_MIN - value.length} more characters.` };
      if (value.length > BIO_MAX) return { error: `Max ${BIO_MAX} characters.` };
      return { success: "Great — founders will appreciate this." };
    case "linkedinUrl":
      if (!value.trim()) return { warning: "Investors with LinkedIn get 2× more replies." };
      if (!value.startsWith("https://")) return { error: "Must start with https://" };
      if (!value.includes("linkedin.com")) return { warning: "This doesn't look like a LinkedIn URL." };
      return { success: "Valid LinkedIn URL" };
    case "websiteUrl":
      if (!value.trim()) return {};
      if (!value.startsWith("https://")) return { error: "Must start with https://" };
      return { success: "Valid URL" };
    case "country":
      if (!value.trim()) return { warning: "Location helps startups gauge geographic fit." };
      if (/\d/.test(value)) return { error: "Country name should not contain numbers." };
      return {};
    default:
      return {};
  }
}

type Props = { profile: InvestorProfile; userId: string; onSaved: () => void };

export default function IdentityForm({ profile, userId, onSaved }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result,   setResult]   = useState<{ success: boolean; message?: string } | null>(null);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [success,  setSuccess]  = useState<Record<string, string>>({});
  const [touched,  setTouched]  = useState<Record<string, boolean>>({});
  const [bioLen,   setBioLen]   = useState(profile.bio?.length ?? 0);

  function applyResult(id: string, r: VResult) {
    setErrors(p  => { const n = { ...p }; if (r.error)   n[id] = r.error;   else delete n[id]; return n; });
    setWarnings(p => { const n = { ...p }; if (r.warning) n[id] = r.warning; else delete n[id]; return n; });
    setSuccess(p  => { const n = { ...p }; if (r.success) n[id] = r.success; else delete n[id]; return n; });
  }

  function revalidate() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    ["firmName","designation","bio","linkedinUrl","websiteUrl","country","city"].forEach(id => {
      applyResult(id, validate(id, fd.get(id) as string ?? ""));
    });
  }

  function handleBlur(id: string) {
    setTouched(prev => ({ ...prev, [id]: true }));
    revalidate();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ids = ["firmName","designation","bio","linkedinUrl","websiteUrl","country","city"];
    const allTouched = Object.fromEntries(ids.map(k => [k, true]));
    setTouched(allTouched);
    const hasErrors = ids.some(id => {
      const r = validate(id, fd.get(id) as string ?? "");
      applyResult(id, r);
      return !!r.error;
    });
    if (hasErrors) return;

    startTransition(async () => {
      const res = await updateIdentity(fd);
      setResult(res);
      if (res.success) onSaved();
    });
  }

  const fieldCls = (id: string) => {
    if (!touched[id]) return "input-field";
    if (errors[id])   return "input-field border-red-300 bg-red-50/30";
    if (warnings[id]) return "input-field border-amber-300 bg-amber-50/20";
    if (success[id])  return "input-field border-green-400 bg-green-50/20";
    return "input-field";
  };
  const err  = (id: string) => touched[id] ? errors[id]   : undefined;
  const warn = (id: string) => touched[id] ? warnings[id] : undefined;
  const ok   = (id: string) => touched[id] ? success[id]  : undefined;

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
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-style" htmlFor="firmName">Firm / Fund Name</label>
            </div>
            <input id="firmName" name="firmName" maxLength={100}
              className={fieldCls("firmName")} defaultValue={profile.firmName ?? ""}
              placeholder="e.g. Sequoia Capital India"
              onBlur={() => handleBlur("firmName")}
              onChange={() => { if (touched.firmName) revalidate(); }} />
            <FieldError msg={err("firmName")} />
            <FieldWarn  msg={warn("firmName")} />
            <FieldOk    msg={ok("firmName")} />
          </div>

          <div>
            <label className="label-style" htmlFor="designation">
              Your Title <span className="text-red-400">*</span>
            </label>
            <input id="designation" name="designation" maxLength={80}
              className={fieldCls("designation")} defaultValue={profile.designation ?? ""}
              placeholder="e.g. Partner, Angel, Principal"
              onBlur={() => handleBlur("designation")}
              onChange={() => { if (touched.designation) revalidate(); }} />
            <FieldError msg={err("designation")} />
            <FieldOk    msg={ok("designation")} />
          </div>
        </div>
      </fieldset>

      {/* ── Bio ── */}
      <fieldset className="space-y-3">
        <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-1">
          Professional Bio
        </legend>
        <textarea id="bio" name="bio" rows={5} maxLength={BIO_MAX}
          className={`${fieldCls("bio")} resize-none leading-relaxed`}
          defaultValue={profile.bio ?? ""}
          placeholder="Investment history, domain expertise, notable exits — what makes you the right partner for a founder?"
          onBlur={() => handleBlur("bio")}
          onChange={e => { setBioLen(e.target.value.length); if (touched.bio) revalidate(); }} />
        <CharBar current={bioLen} max={BIO_MAX} min={BIO_MIN} />
        <FieldError msg={err("bio")} />
        <FieldWarn  msg={warn("bio")} />
        <FieldOk    msg={ok("bio")} />
        {bioLen > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex gap-1">
              {[50, 150, 300, 600].map(t => (
                <div key={t} className={`h-1 w-8 rounded-full transition-colors duration-300 ${bioLen >= t ? "bg-forest/60" : "bg-forest/10"}`} />
              ))}
            </div>
            <span className="text-[10px] text-forest/40">
              {bioLen < 50 ? "Too short" : bioLen < 150 ? "Minimal" : bioLen < 300 ? "Good" : bioLen < 600 ? "Strong" : "Excellent"}
            </span>
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
          <div>
            <label className="label-style" htmlFor="linkedinUrl">
              <span className="flex items-center gap-1.5"><Linkedin className="w-3 h-3" />LinkedIn URL</span>
            </label>
            <input id="linkedinUrl" name="linkedinUrl" type="url"
              className={fieldCls("linkedinUrl")} defaultValue={profile.linkedinUrl ?? ""}
              placeholder="https://linkedin.com/in/yourname"
              onBlur={() => handleBlur("linkedinUrl")}
              onChange={() => { if (touched.linkedinUrl) revalidate(); }} />
            <FieldError msg={err("linkedinUrl")} />
            <FieldWarn  msg={warn("linkedinUrl")} />
            <FieldOk    msg={ok("linkedinUrl")} />
          </div>
          <div>
            <label className="label-style" htmlFor="websiteUrl">
              <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" />Website</span>
            </label>
            <input id="websiteUrl" name="websiteUrl" type="url"
              className={fieldCls("websiteUrl")} defaultValue={profile.websiteUrl ?? ""}
              placeholder="https://yourfirm.com"
              onBlur={() => handleBlur("websiteUrl")}
              onChange={() => { if (touched.websiteUrl) revalidate(); }} />
            <FieldError msg={err("websiteUrl")} />
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
          <div>
            <label className="label-style" htmlFor="country">Country</label>
            <input id="country" name="country" className={fieldCls("country")}
              defaultValue={profile.country ?? ""} placeholder="India"
              onBlur={() => handleBlur("country")}
              onChange={() => { if (touched.country) revalidate(); }} />
            <FieldWarn msg={warn("country")} />
          </div>
          <div>
            <label className="label-style" htmlFor="city">City</label>
            <input id="city" name="city" className="input-field"
              defaultValue={profile.city ?? ""} placeholder="Mumbai" />
          </div>
        </div>
      </fieldset>

      {/* ── Feedback ── */}
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

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={isPending}
          className="btn-primary bg-forest text-cream px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-60 transition-all hover:bg-forest/90 rounded-lg">
          {isPending
            ? <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Saving…
              </span>
            : "Save Identity"}
        </button>
        {Object.keys(errors).length > 0 && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s need" : " needs"} attention
          </p>
        )}
      </div>
    </form>
  );
}