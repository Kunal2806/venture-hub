"use client";

import { useState, useTransition } from "react";
import { updateTraction } from "../actions";
import type { StartupProfile } from "@/db/schema";

type Props = { profile: StartupProfile; userId: string; onSaved: () => void };

type FieldDef = {
  name: string;
  label: string;
  placeholder: string;
  prefix?: string;
  suffix?: string;
  hint?: string;
};

const METRIC_FIELDS: FieldDef[] = [
  { name: "revenueMonthly", label: "Monthly Revenue (MRR)", placeholder: "0", prefix: "$", hint: "Optional for early-stage" },
  { name: "revenueAnnual", label: "Annual Revenue (ARR)", placeholder: "0", prefix: "$" },
  { name: "userCount", label: "Active Users / Customers", placeholder: "0" },
  { name: "growthRate", label: "Monthly Growth Rate", placeholder: "0", suffix: "%" },
];

const FUNDING_FIELDS: FieldDef[] = [
  // { name: "fundingAskMin", label: "Funding Ask — Minimum", placeholder: "500000", prefix: "$" },
  // { name: "fundingAskMax", label: "Funding Ask — Maximum", placeholder: "2000000", prefix: "$" },
  { name: "equityOffered", label: "Equity Offered", placeholder: "10", suffix: "%" },
];

export default function TractionForm({ profile, userId, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(fd: FormData) {
    const errs: Record<string, string> = {};
    const equity = fd.get("equityOffered") as string;
    if (equity && (parseFloat(equity) < 0 || parseFloat(equity) > 100)) {
      errs.equityOffered = "Equity must be between 0 and 100%.";
    }
    //  const numFields = ["revenueMonthly", "revenueAnnual", "userCount", "growthRate", "fundingAskMin", "fundingAskMax"];

    const numFields = ["revenueMonthly", "revenueAnnual", "userCount", "growthRate"];
    for (const f of numFields) {
      const v = fd.get(f) as string;
      if (v && isNaN(parseFloat(v))) errs[f] = "Must be a number.";
      if (v && parseFloat(v) < 0) errs[f] = "Must be a positive number.";
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
      const res = await updateTraction(fd);
      setResult(res);
      if (res.success) onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <input type="hidden" name="profileId" value={profile.id} />
      <input type="hidden" name="userId" value={userId} />

      {/* Traction Metrics */}
      <section>
        <h3 className="font-serif text-lg text-forest mb-5 pb-2 border-b border-forest/10">
          Traction Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {METRIC_FIELDS.map((f) => (
            <div key={f.name}>
              <label className="label-style" htmlFor={f.name}>{f.label}</label>
              {f.hint && <p className="text-xs italic text-moss mb-1">{f.hint}</p>}
              <div className="relative">
                {f.prefix && (
                  <span className="absolute left-0 bottom-3 text-sm text-forest/40 font-medium">
                    {f.prefix}
                  </span>
                )}
                <input
                  id={f.name}
                  name={f.name}
                  type="number"
                  min="0"
                  step="any"
                  className={`input-field ${f.prefix ? "pl-4" : ""} ${f.suffix ? "pr-8" : ""}`}
                  defaultValue={(profile[f.name as keyof StartupProfile] as string | null) ?? ""}
                  placeholder={f.placeholder}
                />
                {f.suffix && (
                  <span className="absolute right-0 bottom-3 text-sm text-forest/40 font-medium">
                    {f.suffix}
                  </span>
                )}
              </div>
              {errors[f.name] && <p className="text-red-500 text-sm mt-1">{errors[f.name]}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Funding Ask */}
      <section>
        <h3 className="font-serif text-lg text-forest mb-5 pb-2 border-b border-forest/10">
          Funding Ask
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FUNDING_FIELDS.map((f) => (
            <div key={f.name}>
              <label className="label-style" htmlFor={f.name}>{f.label}</label>
              <div className="relative">
                {f.prefix && (
                  <span className="absolute left-0 bottom-3 text-sm text-forest/40 font-medium">
                    {f.prefix}
                  </span>
                )}
                <input
                  id={f.name}
                  name={f.name}
                  type="number"
                  min="0"
                  step="any"
                  className={`input-field ${f.prefix ? "pl-4" : ""} ${f.suffix ? "pr-8" : ""}`}
                  defaultValue={(profile[f.name as keyof StartupProfile] as string | null) ?? ""}
                  placeholder={f.placeholder}
                />
                {f.suffix && (
                  <span className="absolute right-0 bottom-3 text-sm text-forest/40 font-medium">
                    {f.suffix}
                  </span>
                )}
              </div>
              {errors[f.name] && <p className="text-red-500 text-sm mt-1">{errors[f.name]}</p>}
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className="label-style" htmlFor="useOfFunds">Use of Funds</label>
            <textarea
              id="useOfFunds"
              name="useOfFunds"
              rows={3}
              className="input-field resize-none w-full"
              defaultValue={profile.useOfFunds ?? ""}
              placeholder="How will you deploy the capital? (hiring, product, marketing…)"
              maxLength={1000}
            />
          </div>
        </div>
      </section>

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
        {isPending ? "Saving…" : "Save Traction & Financials"}
      </button>
    </form>
  );
}