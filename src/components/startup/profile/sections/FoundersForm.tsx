"use client";

import { useState, useTransition } from "react";
import { updateFounders } from "../actions";
import type { StartupProfile, FounderEntry } from "@/db/schema";

type Props = { profile: StartupProfile; userId: string; onSaved: () => void };

const EMPTY_FOUNDER: FounderEntry = {
  name: "",
  role: "",
  bio: "",
  linkedinUrl: "",
  avatarUrl: "",
  isLeadFounder: false,
};

const ROLES = ["CEO", "CTO", "COO", "CFO", "CMO", "CPO", "Co-Founder", "Other"];

type FieldErrors = Partial<Record<keyof FounderEntry, string>>;

export default function FoundersForm({ profile, userId, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [founders, setFounders] = useState<FounderEntry[]>(
    (profile.founders as FounderEntry[]) ?? []
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  function addFounder() {
    setFounders((prev) => [...prev, { ...EMPTY_FOUNDER }]);
    setFieldErrors((prev) => [...prev, {}]);
  }

  function removeFounder(idx: number) {
    setFounders((prev) => prev.filter((_, i) => i !== idx));
    setFieldErrors((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateField(idx: number, key: keyof FounderEntry, value: string | boolean) {
    setFounders((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [key]: value } : f))
    );
  }

  function setLeadFounder(idx: number) {
    setFounders((prev) =>
      prev.map((f, i) => ({ ...f, isLeadFounder: i === idx }))
    );
  }

  function validate() {
    const errs: FieldErrors[] = founders.map((f) => {
      const e: FieldErrors = {};
      if (!f.name.trim()) e.name = "Name is required.";
      if (!f.role.trim()) e.role = "Role is required.";
      if (f.linkedinUrl) {
        try { new URL(f.linkedinUrl); } catch { e.linkedinUrl = "Must be a valid URL."; }
      }
      return e;
    });
    return errs;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (founders.length === 0) {
      setFormError("Add at least one founder.");
      return;
    }

    const errs = validate();
    setFieldErrors(errs);
    if (errs.some((e) => Object.keys(e).length > 0)) return;

    startTransition(async () => {
      const res = await updateFounders({ profileId: profile.id, userId, founders });
      setResult(res);
      if (res.success) onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {founders.length === 0 && (
        <div className="text-center py-10 border border-dashed border-forest/20">
          <p className="text-forest/40 font-medium">No founders added yet.</p>
          <p className="text-sm text-forest/30 mt-1">Investors invest in people first.</p>
        </div>
      )}

      <div className="space-y-8">
        {founders.map((founder, idx) => (
          <div key={idx} className="relative border border-forest/10 p-6 bg-white/50">
            {/* Lead badge */}
            {founder.isLeadFounder && (
              <span className="absolute top-4 right-4 text-xs font-bold uppercase tracking-widest text-forest bg-beige px-2 py-1">
                Lead
              </span>
            )}

            <div className="flex items-start justify-between mb-5">
              <span className="text-xs font-bold uppercase tracking-widest text-forest/40">
                Founder #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeFounder(idx)}
                className="text-red-400 hover:text-red-600 text-sm transition-colors"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className="label-style" htmlFor={`name-${idx}`}>Full Name *</label>
                <input
                  id={`name-${idx}`}
                  className="input-field"
                  value={founder.name}
                  onChange={(e) => updateField(idx, "name", e.target.value)}
                  placeholder="Jane Doe"
                />
                {fieldErrors[idx]?.name && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors[idx]?.name}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="label-style" htmlFor={`role-${idx}`}>Role *</label>
                <select
                  id={`role-${idx}`}
                  className="input-field bg-transparent cursor-pointer"
                  value={founder.role}
                  onChange={(e) => updateField(idx, "role", e.target.value)}
                >
                  <option value="">Select role…</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {fieldErrors[idx]?.role && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors[idx]?.role}</p>
                )}
              </div>

              {/* LinkedIn */}
              <div className="sm:col-span-2">
                <label className="label-style" htmlFor={`linkedin-${idx}`}>LinkedIn URL</label>
                <input
                  id={`linkedin-${idx}`}
                  className="input-field"
                  value={founder.linkedinUrl ?? ""}
                  onChange={(e) => updateField(idx, "linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/janedoe"
                />
                {fieldErrors[idx]?.linkedinUrl && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors[idx]?.linkedinUrl}</p>
                )}
              </div>

              {/* Bio */}
              <div className="sm:col-span-2">
                <label className="label-style" htmlFor={`bio-${idx}`}>Bio</label>
                <textarea
                  id={`bio-${idx}`}
                  rows={3}
                  className="input-field resize-none w-full"
                  value={founder.bio ?? ""}
                  onChange={(e) => updateField(idx, "bio", e.target.value)}
                  placeholder="Brief background, experience, and why this founder for this startup"
                  maxLength={500}
                />
              </div>

              {/* Lead toggle */}
              <div className="sm:col-span-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLeadFounder(idx)}
                  className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                    founder.isLeadFounder
                      ? "bg-forest border-forest"
                      : "border-forest/30"
                  }`}
                >
                  {founder.isLeadFounder && (
                    <svg className="w-3 h-3 text-cream" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
                <label
                  className="text-sm text-forest/70 cursor-pointer"
                  onClick={() => setLeadFounder(idx)}
                >
                  Mark as Lead Founder
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addFounder}
        className="w-full py-3 border border-dashed border-forest/30 text-forest/60 text-sm font-medium uppercase tracking-widest hover:border-forest/60 hover:text-forest transition-colors"
      >
        + Add Founder
      </button>

      {formError && <p className="text-red-500 text-sm">{formError}</p>}
      {result && (
        <p className={`text-sm font-medium ${result.success ? "text-green-600" : "text-red-500"}`}>
          {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary bg-forest text-cream px-6 py-3 text-sm font-semibold uppercase tracking-widest disabled:opacity-60 transition-all"
      >
        {isPending ? "Saving…" : "Save Founders"}
      </button>
    </form>
  );
}