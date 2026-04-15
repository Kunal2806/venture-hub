"use client";

import { useRef, useState, useTransition } from "react";
import { updateBasicInfo } from "../actions";
import type { StartupProfile } from "@/db/schema";
import { AlertCircle, CheckCircle, Globe, Building2, MapPin, Calendar, Tag, AlignLeft } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = [
  { value: "IDEA",     label: "Idea" },
  { value: "PRE_SEED", label: "Pre-Seed" },
  { value: "SEED",     label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B" },
  { value: "SERIES_C", label: "Series C" },
  { value: "GROWTH",   label: "Growth" },
];

const SECTORS = [
  "SaaS", "FinTech", "HealthTech", "EdTech", "AgriTech", "CleanTech",
  "E-Commerce", "Logistics", "AI/ML", "Cybersecurity", "Blockchain",
  "Media & Entertainment", "Real Estate", "Consumer", "B2B", "Deep Tech", "Other",
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;

const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 1000;
const TAGLINE_MAX     = 160;

// ─── Helper components ────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-[1px]" />
      <p className="text-red-500 text-xs leading-tight">{message}</p>
    </div>
  );
}

function FieldWarning({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-[1px]" />
      <p className="text-amber-600 text-xs leading-tight">{message}</p>
    </div>
  );
}

function FieldSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5">
      <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-[1px]" />
      <p className="text-green-700 text-xs leading-tight">{message}</p>
    </div>
  );
}

/** Character count bar shown beneath textarea / tagline */
function CharBar({
  current,
  max,
  min,
}: {
  current: number;
  max: number;
  min?: number;
}) {
  const pct     = Math.min((current / max) * 100, 100);
  const tooLong = current > max;
  const tooShort = min !== undefined && current > 0 && current < min;
  const color   = tooLong
    ? "bg-red-400"
    : tooShort
    ? "bg-amber-400"
    : current >= (min ?? 0)
    ? "bg-green-500"
    : "bg-forest/30";

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1 w-full rounded-full bg-forest/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-forest/40">
        {min !== undefined && current > 0 && current < min ? (
          <span className="text-amber-500">{min - current} more characters needed</span>
        ) : (
          <span />
        )}
        <span className={`ml-auto ${tooLong ? "text-red-500 font-medium" : ""}`}>
          {current} / {max}
        </span>
      </div>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

type ValidationResult = {
  errors:   Record<string, string>;
  warnings: Record<string, string>;
  success:  Record<string, string>;
};

function validateAll(fields: Record<string, string>): ValidationResult {
  const errors:   Record<string, string> = {};
  const warnings: Record<string, string> = {};
  const success:  Record<string, string> = {};

  // ── Company Name ────────────────────────────────────────────────────────────
  const name = fields.companyName?.trim() ?? "";
  if (!name) {
    errors.companyName = "Company name is required.";
  } else if (name.length < 2) {
    errors.companyName = "Company name must be at least 2 characters.";
  } else if (name.length > 100) {
    errors.companyName = "Company name must be under 100 characters.";
  } else if (/^\d+$/.test(name)) {
    errors.companyName = "Company name cannot be numbers only.";
  } else {
    success.companyName = "Looks good";
  }

  // ── Tagline ─────────────────────────────────────────────────────────────────
  const tagline = fields.tagline?.trim() ?? "";
  if (tagline) {
    if (tagline.length < 10) {
      warnings.tagline = "A tagline works best with at least 10 characters.";
    } else if (tagline.length > TAGLINE_MAX) {
      errors.tagline = `Tagline must be under ${TAGLINE_MAX} characters.`;
    } else {
      success.tagline = "Good tagline length";
    }
  }

  // ── Website URL ─────────────────────────────────────────────────────────────
  const url = fields.websiteUrl?.trim() ?? "";
  if (url) {
    if (!/^https?:\/\//i.test(url)) {
      errors.websiteUrl = "URL must start with https:// or http://";
    } else {
      try {
        const parsed = new URL(url);
        if (!parsed.hostname.includes(".")) {
          errors.websiteUrl = "Enter a valid domain — e.g. https://yourcompany.com";
        } else if (!url.startsWith("https://")) {
          warnings.websiteUrl = "Consider using https:// for a secure link.";
        } else {
          success.websiteUrl = "Valid URL";
        }
      } catch {
        errors.websiteUrl = "That doesn't look like a valid URL.";
      }
    }
  } else {
    warnings.websiteUrl = "Adding a website builds credibility with investors.";
  }

  // ── Founded Year ────────────────────────────────────────────────────────────
  const year = fields.foundedYear?.trim() ?? "";
  if (year) {
    if (!/^\d{4}$/.test(year)) {
      errors.foundedYear = "Must be a 4-digit year (e.g. 2019).";
    } else {
      const y = parseInt(year, 10);
      if (y < MIN_YEAR) {
        errors.foundedYear = `Year must be ${MIN_YEAR} or later.`;
      } else if (y > CURRENT_YEAR) {
        errors.foundedYear = `Year cannot be in the future.`;
      } else if (y > CURRENT_YEAR - 1) {
        warnings.foundedYear = "Just founded — welcome to the journey!";
      } else {
        success.foundedYear = "Valid year";
      }
    }
  }

  // ── Sector ──────────────────────────────────────────────────────────────────
  if (!fields.sector) {
    errors.sector = "Please select your primary sector.";
  } else {
    success.sector = "Selected";
  }

  // ── Stage ───────────────────────────────────────────────────────────────────
  if (!fields.stage) {
    errors.stage = "Please select your current stage.";
  } else {
    success.stage = "Selected";
  }

  // ── Country ─────────────────────────────────────────────────────────────────
  const country = fields.country?.trim() ?? "";
  if (!country) {
    warnings.country = "Adding your country helps match you with regional investors.";
  } else if (country.length < 2) {
    errors.country = "Enter a valid country name.";
  } else if (/\d/.test(country)) {
    errors.country = "Country name should not contain numbers.";
  }

  // ── City ────────────────────────────────────────────────────────────────────
  const city = fields.city?.trim() ?? "";
  if (city && /\d/.test(city)) {
    errors.city = "City name should not contain numbers.";
  }

  // ── Description ─────────────────────────────────────────────────────────────
  const desc = fields.description?.trim() ?? "";
  if (!desc) {
    warnings.description = "A description helps investors and partners understand you faster.";
  } else if (desc.length < DESCRIPTION_MIN) {
    warnings.description = `Add ${DESCRIPTION_MIN - desc.length} more characters for a meaningful description.`;
  } else if (desc.length > DESCRIPTION_MAX) {
    errors.description = `Description must be under ${DESCRIPTION_MAX} characters.`;
  } else {
    success.description = "Great — this adds real depth to your profile.";
  }

  return { errors, warnings, success };
}

// ─── Field input class helper ─────────────────────────────────────────────────

function fieldCls(
  base: string,
  id: string,
  errors: Record<string, string>,
  warnings: Record<string, string>,
  success: Record<string, string>
) {
  if (errors[id])   return `${base} border-red-300 bg-red-50/30`;
  if (warnings[id]) return `${base} border-amber-300 bg-amber-50/20`;
  if (success[id])  return `${base} border-green-400 bg-green-50/20`;
  return base;
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  profile: StartupProfile;
  userId:  string;
  onSaved: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BasicInfoForm({ profile, userId, onSaved }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult]   = useState<{ success: boolean; message?: string } | null>(null);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [success,  setSuccess]  = useState<Record<string, string>>({});

  // Live character counts for text inputs with bars
  const [taglineLen,     setTaglineLen]     = useState(profile.tagline?.length ?? 0);
  const [descLen,        setDescLen]        = useState(profile.description?.length ?? 0);
  const [touched,        setTouched]        = useState<Record<string, boolean>>({});

  // ── Live single-field validation on blur ──────────────────────────────────
  function revalidate() {
    if (!formRef.current) return;
    const fd     = new FormData(formRef.current);
    const fields = Object.fromEntries(
      Array.from(fd.entries()).map(([k, v]) => [k, v.toString()])
    );
    const res = validateAll(fields);
    setErrors(res.errors);
    setWarnings(res.warnings);
    setSuccess(res.success);
  }

  function handleBlur(id: string) {
    setTouched(prev => ({ ...prev, [id]: true }));
    revalidate();
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd     = new FormData(e.currentTarget);
    const fields = Object.fromEntries(
      Array.from(fd.entries()).map(([k, v]) => [k, v.toString()])
    );
    const res = validateAll(fields);
    setErrors(res.errors);
    setWarnings(res.warnings);
    setSuccess(res.success);
    // Mark all fields as touched so messages show
    const allTouched = Object.fromEntries(Object.keys(fields).map(k => [k, true]));
    setTouched(allTouched);
    if (Object.keys(res.errors).length > 0) return;

    startTransition(async () => {
      const serverRes = await updateBasicInfo(fd);
      setResult(serverRes);
      if (serverRes.success) onSaved();
    });
  }

  // Helpers that only show messages for touched fields
  const err  = (id: string) => touched[id] ? errors[id]   : undefined;
  const warn = (id: string) => touched[id] ? warnings[id] : undefined;
  const suc  = (id: string) => touched[id] ? success[id]  : undefined;
  const cls  = (id: string) =>
    touched[id]
      ? fieldCls("input-field", id, errors, warnings, success)
      : "input-field";

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8" noValidate>
      <input type="hidden" name="profileId" value={profile.id} />
      <input type="hidden" name="userId"    value={userId} />

      {/* ── Section: Identity ── */}
      <fieldset className="space-y-5">
        <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          <Building2 className="w-3.5 h-3.5" />
          Company Identity
        </legend>

        {/* Company Name */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label-style" htmlFor="companyName">
              Company Name <span className="text-red-400">*</span>
            </label>
            <span className="text-[10px] text-forest/30">
              {(profile.companyName ?? "").length}/100
            </span>
          </div>
          <input
            id="companyName"
            name="companyName"
            maxLength={100}
            className={cls("companyName")}
            defaultValue={profile.companyName}
            placeholder="e.g. Aeris Technologies"
            onBlur={() => handleBlur("companyName")}
            onChange={e => {
              if (touched.companyName) revalidate();
            }}
          />
          <FieldError   message={err("companyName")} />
          <FieldWarning message={warn("companyName")} />
          <FieldSuccess message={suc("companyName")} />
        </div>

        {/* Tagline */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label-style" htmlFor="tagline">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                Tagline
                <span className="text-forest/30 font-normal normal-case text-[10px]">(optional)</span>
              </span>
            </label>
          </div>
          <input
            id="tagline"
            name="tagline"
            maxLength={TAGLINE_MAX}
            className={cls("tagline")}
            defaultValue={profile.tagline ?? ""}
            placeholder="One line that says it all"
            onBlur={() => handleBlur("tagline")}
            onChange={e => {
              setTaglineLen(e.target.value.length);
              if (touched.tagline) revalidate();
            }}
          />
          <CharBar current={taglineLen} max={TAGLINE_MAX} min={10} />
          <FieldError   message={err("tagline")} />
          <FieldWarning message={warn("tagline")} />
          <FieldSuccess message={suc("tagline")} />
        </div>
      </fieldset>

      {/* ── Section: Classification ── */}
      <fieldset className="space-y-5">
        <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          <AlignLeft className="w-3.5 h-3.5" />
          Classification
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Sector */}
          <div>
            <label className="label-style" htmlFor="sector">
              Sector <span className="text-red-400">*</span>
            </label>
            <select
              id="sector"
              name="sector"
              className={`${cls("sector")} bg-transparent cursor-pointer appearance-none`}
              defaultValue={profile.sector}
              onBlur={() => handleBlur("sector")}
              onChange={() => { if (touched.sector) revalidate(); }}
            >
              <option value="">Select sector…</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FieldError   message={err("sector")} />
            <FieldSuccess message={suc("sector")} />
          </div>

          {/* Stage */}
          <div>
            <label className="label-style" htmlFor="stage">
              Stage <span className="text-red-400">*</span>
            </label>
            <select
              id="stage"
              name="stage"
              className={`${cls("stage")} bg-transparent cursor-pointer appearance-none`}
              defaultValue={profile.stage}
              onBlur={() => handleBlur("stage")}
              onChange={() => { if (touched.stage) revalidate(); }}
            >
              <option value="">Select stage…</option>
              {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <FieldError   message={err("stage")} />
            <FieldSuccess message={suc("stage")} />
          </div>

          {/* Founded Year */}
          <div>
            <label className="label-style" htmlFor="foundedYear">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Founded Year
                <span className="text-forest/30 font-normal normal-case text-[10px]">(optional)</span>
              </span>
            </label>
            <input
              id="foundedYear"
              name="foundedYear"
              maxLength={4}
              inputMode="numeric"
              pattern="\d{4}"
              className={cls("foundedYear")}
              defaultValue={profile.foundedYear?.toString() ?? ""}
              placeholder={String(CURRENT_YEAR - 2)}
              onBlur={() => handleBlur("foundedYear")}
              onChange={e => {
                // Only allow digits
                e.target.value = e.target.value.replace(/\D/g, "");
                if (touched.foundedYear) revalidate();
              }}
            />
            <FieldError   message={err("foundedYear")} />
            <FieldWarning message={warn("foundedYear")} />
            <FieldSuccess message={suc("foundedYear")} />
            <p className="text-[10px] text-forest/30 mt-1">
              4-digit year · {MIN_YEAR}–{CURRENT_YEAR}
            </p>
          </div>

          {/* Website */}
          <div>
            <label className="label-style" htmlFor="websiteUrl">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                Website URL
                <span className="text-forest/30 font-normal normal-case text-[10px]">(optional)</span>
              </span>
            </label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              className={cls("websiteUrl")}
              defaultValue={profile.websiteUrl ?? ""}
              placeholder="https://yourcompany.com"
              onBlur={() => handleBlur("websiteUrl")}
              onChange={() => { if (touched.websiteUrl) revalidate(); }}
            />
            <FieldError   message={err("websiteUrl")} />
            <FieldWarning message={warn("websiteUrl")} />
            <FieldSuccess message={suc("websiteUrl")} />
          </div>
        </div>
      </fieldset>

      {/* ── Section: Location ── */}
      <fieldset className="space-y-5">
        <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          <MapPin className="w-3.5 h-3.5" />
          Location
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Country */}
          <div>
            <label className="label-style" htmlFor="country">
              Country
              <span className="text-forest/30 font-normal normal-case text-[10px] ml-1">(optional)</span>
            </label>
            <input
              id="country"
              name="country"
              className={cls("country")}
              defaultValue={profile.country ?? ""}
              placeholder="India"
              onBlur={() => handleBlur("country")}
              onChange={() => { if (touched.country) revalidate(); }}
            />
            <FieldError   message={err("country")} />
            <FieldWarning message={warn("country")} />
          </div>

          {/* City */}
          <div>
            <label className="label-style" htmlFor="city">
              City
              <span className="text-forest/30 font-normal normal-case text-[10px] ml-1">(optional)</span>
            </label>
            <input
              id="city"
              name="city"
              className={cls("city")}
              defaultValue={profile.city ?? ""}
              placeholder="Bangalore"
              onBlur={() => handleBlur("city")}
              onChange={() => { if (touched.city) revalidate(); }}
            />
            <FieldError message={err("city")} />
          </div>
        </div>
      </fieldset>

      {/* ── Section: Description ── */}
      <fieldset className="space-y-3">
        <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-1">
          <AlignLeft className="w-3.5 h-3.5" />
          About Your Company
        </legend>

        {/* Writing guide */}
        {/* <div className="bg-forest/[0.03] border border-forest/8 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-forest/60 uppercase tracking-wider">
            What to include
          </p>
          <ul className="space-y-1.5">
            {[
              "What problem are you solving and for whom?",
              "What is your core product or service?",
              "What makes your approach unique?",
              "Where are you in your journey?",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-forest/50">
                <span className="w-4 h-4 rounded-full bg-forest/10 text-forest/40 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-[1px]">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div> */}

        {/* Textarea */}
        <div>
          <label className="label-style" htmlFor="description">
            Short Description
            <span className="text-forest/30 font-normal normal-case text-[10px] ml-1">(optional but recommended)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            maxLength={DESCRIPTION_MAX}
            className={`${cls("description")} resize-none leading-relaxed`}
            defaultValue={profile.description ?? ""}
            placeholder={`We're building a platform that… Our core users are… What sets us apart is…`}
            onBlur={() => handleBlur("description")}
            onChange={e => {
              setDescLen(e.target.value.length);
              if (touched.description) revalidate();
            }}
          />
          <CharBar current={descLen} max={DESCRIPTION_MAX} min={DESCRIPTION_MIN} />
          <FieldError   message={err("description")} />
          <FieldWarning message={warn("description")} />
          <FieldSuccess message={suc("description")} />
        </div>

        {/* Quality indicator */}
        {descLen > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex gap-1">
              {[50, 150, 300, 600].map(threshold => (
                <div
                  key={threshold}
                  className={`h-1 w-8 rounded-full transition-colors duration-300 ${
                    descLen >= threshold ? "bg-forest/60" : "bg-forest/10"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-forest/40">
              {descLen < 50   ? "Too short"
               : descLen < 150 ? "Minimal"
               : descLen < 300 ? "Good"
               : descLen < 600 ? "Strong"
               : "Excellent"}
            </span>
          </div>
        )}
      </fieldset>

      {/* ── Server feedback ── */}
      {result && (
        <div className={`flex items-start gap-2 p-4 rounded-xl border text-sm ${
          result.success
            ? "bg-green-50/40 border-green-200 text-green-700"
            : "bg-red-50/40 border-red-200 text-red-600"
        }`}>
          {result.success
            ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          }
          <p>{result.message}</p>
        </div>
      )}

      {/* ── Submit ── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary bg-forest text-cream px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] disabled:opacity-60 transition-all hover:bg-forest/90 rounded-lg"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Saving…
            </span>
          ) : "Save Basic Info"}
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