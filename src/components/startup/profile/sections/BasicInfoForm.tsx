"use client";

import { useRef, useState, useTransition } from "react";
import { updateBasicInfo } from "../actions";
import type { StartupProfile } from "@/db/schema";

const STAGES = [
  { value: "IDEA", label: "Idea" },
  { value: "PRE_SEED", label: "Pre-Seed" },
  { value: "SEED", label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B" },
  { value: "SERIES_C", label: "Series C" },
  { value: "GROWTH", label: "Growth" },
];

const SECTORS = [
  "SaaS", "FinTech", "HealthTech", "EdTech", "AgriTech", "CleanTech",
  "E-Commerce", "Logistics", "AI/ML", "Cybersecurity", "Blockchain",
  "Media & Entertainment", "Real Estate", "Consumer", "B2B", "Deep Tech", "Other",
];

type Props = { profile: StartupProfile; userId: string; onSaved: () => void };

export default function BasicInfoForm({ profile, userId, onSaved }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(data: FormData) {
    const errs: Record<string, string> = {};
    if (!data.get("companyName")) errs.companyName = "Company name is required.";
    if (!data.get("sector")) errs.sector = "Sector is required.";
    if (!data.get("stage")) errs.stage = "Stage is required.";
    const year = data.get("foundedYear") as string;
    if (year && !/^\d{4}$/.test(year)) errs.foundedYear = "Must be a 4-digit year.";
    const url = data.get("websiteUrl") as string;
    if (url) {
      try { new URL(url); } catch { errs.websiteUrl = "Must be a valid URL."; }
    }
    return errs;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const errs = validate(fd);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    startTransition(async () => {
      const res = await updateBasicInfo(fd);
      setResult(res);
      if (res.success) onSaved();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="profileId" value={profile.id} />
      <input type="hidden" name="userId" value={userId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div className="md:col-span-2">
          <label className="label-style" htmlFor="companyName">Company Name *</label>
          <input
            id="companyName"
            name="companyName"
            className="input-field"
            defaultValue={profile.companyName}
            placeholder="e.g. Acme Technologies"
          />
          {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
        </div>

        {/* Tagline */}
        <div className="md:col-span-2">
          <label className="label-style" htmlFor="tagline">Tagline</label>
          <input
            id="tagline"
            name="tagline"
            className="input-field"
            defaultValue={profile.tagline ?? ""}
            placeholder="One line that says it all"
            maxLength={160}
          />
        </div>

        {/* Website */}
        <div>
          <label className="label-style" htmlFor="websiteUrl">Website URL</label>
          <input
            id="websiteUrl"
            name="websiteUrl"
            className="input-field"
            defaultValue={profile.websiteUrl ?? ""}
            placeholder="https://yourcompany.com"
          />
          {errors.websiteUrl && <p className="text-red-500 text-sm mt-1">{errors.websiteUrl}</p>}
        </div>

        {/* Founded Year */}
        <div>
          <label className="label-style" htmlFor="foundedYear">Founded Year</label>
          <input
            id="foundedYear"
            name="foundedYear"
            className="input-field"
            defaultValue={profile.foundedYear?.toString() ?? ""}
            placeholder="2021"
            maxLength={4}
          />
          {errors.foundedYear && <p className="text-red-500 text-sm mt-1">{errors.foundedYear}</p>}
        </div>

        {/* Sector */}
        <div>
          <label className="label-style" htmlFor="sector">Sector *</label>
          <select
            id="sector"
            name="sector"
            className="input-field bg-transparent cursor-pointer"
            defaultValue={profile.sector}
          >
            <option value="">Select sector…</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.sector && <p className="text-red-500 text-sm mt-1">{errors.sector}</p>}
        </div>

        {/* Stage */}
        <div>
          <label className="label-style" htmlFor="stage">Stage *</label>
          <select
            id="stage"
            name="stage"
            className="input-field bg-transparent cursor-pointer"
            defaultValue={profile.stage}
          >
            <option value="">Select stage…</option>
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {errors.stage && <p className="text-red-500 text-sm mt-1">{errors.stage}</p>}
        </div>

        {/* Country */}
        <div>
          <label className="label-style" htmlFor="country">Country</label>
          <input
            id="country"
            name="country"
            className="input-field"
            defaultValue={profile.country ?? ""}
            placeholder="India"
          />
        </div>

        {/* City */}
        <div>
          <label className="label-style" htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            className="input-field"
            defaultValue={profile.city ?? ""}
            placeholder="Bangalore"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="label-style" htmlFor="description">Short Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="input-field resize-none"
            defaultValue={profile.description ?? ""}
            placeholder="Brief overview of what your company does (max 1000 chars)"
            maxLength={1000}
          />
        </div>
      </div>

      {/* Feedback */}
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
        {isPending ? "Saving…" : "Save Basic Info"}
      </button>
    </form>
  );
}