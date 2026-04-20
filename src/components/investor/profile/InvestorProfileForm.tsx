"use client";

import { InvestorProfile } from "@/db/schema";
import { useState } from "react";

const INVESTOR_TYPES = [
  { value: "ANGEL", label: "Angel" },
  { value: "VENTURE_CAPITAL", label: "Venture Capital" },
] as const;

type FormErrors = {
  firmName?: string;
  investorType?: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  errors?: FormErrors;
};

type InvestorProfileFormProps = {
  profile: InvestorProfile | null;
};

export function InvestorProfileForm({ profile }: InvestorProfileFormProps) {
  const [firmName, setFirmName] = useState(profile?.firmName ?? "");
  const [investorType, setInvestorType] = useState(profile?.investorType ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalMessage, setGlobalMessage] = useState<{
    text: string;
    success: boolean;
  } | null>(null);
  const [isPending, setIsPending] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!firmName.trim()) errs.firmName = "Firm name is required.";
    if (!investorType) errs.investorType = "Investor type is required.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalMessage(null);

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setErrors({});
    setIsPending(true);

    try {
      const res = await fetch("/api/investor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmName: firmName.trim(),
          investorType,
          preferredSectors: profile?.preferredSectors ?? [],
          preferredStages: profile?.preferredStages ?? [],
        }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setGlobalMessage({
            text: data.message ?? "Something went wrong. Please try again.",
            success: false,
          });
        }
        return;
      }

      setGlobalMessage({ text: data.message ?? "Profile saved.", success: true });
    } catch {
      setGlobalMessage({
        text: "Network error. Please check your connection.",
        success: false,
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-2xl space-y-8">
      {/* Global banner */}
      {globalMessage && (
        <div
          role="status"
          aria-live="polite"
          className={[
            "rounded px-4 py-3 text-sm font-medium",
            globalMessage.success
              ? "bg-[#1A362B]/10 text-[#1A362B]"
              : "bg-red-50 text-red-700",
          ].join(" ")}
        >
          {globalMessage.text}
        </div>
      )}

      {/* Firm Name */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="firmName"
          className="text-xs font-bold uppercase tracking-widest text-[#1A362B]/50"
        >
          Firm Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="firmName"
          name="firmName"
          type="text"
          required
          autoComplete="organization"
          value={firmName}
          onChange={(e) => setFirmName(e.target.value)}
          aria-describedby={errors.firmName ? "firmName-error" : undefined}
          aria-invalid={!!errors.firmName}
          placeholder="e.g. Sequoia Capital"
          className={[
            "w-full border-b bg-transparent py-3 text-base text-[#2D2D2D]",
            "placeholder:text-[#1A362B]/30 transition-colors duration-200",
            "focus:border-[#1A362B] focus:outline-none",
            errors.firmName
              ? "border-red-400"
              : "border-[#1A362B]/20 hover:border-[#1A362B]/40",
          ].join(" ")}
        />
        {errors.firmName && (
          <p id="firmName-error" role="alert" className="mt-1 text-sm text-red-500">
            {errors.firmName}
          </p>
        )}
      </div>

      {/* Investor Type */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="investorType"
          className="text-xs font-bold uppercase tracking-widest text-[#1A362B]/50"
        >
          Investor Type <span aria-hidden="true">*</span>
        </label>
        <select
          id="investorType"
          name="investorType"
          required
          value={investorType}
          onChange={(e) => setInvestorType(e.target.value)}
          aria-describedby={errors.investorType ? "investorType-error" : undefined}
          aria-invalid={!!errors.investorType}
          className={[
            "w-full border-b bg-transparent py-3 text-base text-[#2D2D2D]",
            "cursor-pointer transition-colors duration-200",
            "focus:border-[#1A362B] focus:outline-none",
            errors.investorType
              ? "border-red-400"
              : "border-[#1A362B]/20 hover:border-[#1A362B]/40",
          ].join(" ")}
        >
          <option value="" disabled>
            Select investor type
          </option>
          {INVESTOR_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.investorType && (
          <p id="investorType-error" role="alert" className="mt-1 text-sm text-red-500">
            {errors.investorType}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className={[
          "btn-primary inline-flex items-center gap-2",
          "bg-[#1A362B] px-8 py-3 text-sm font-semibold uppercase tracking-widest",
          "text-[#F9F7F2] transition-opacity duration-200",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-[#1A362B]",
        ].join(" ")}
      >
        {isPending ? (
          <>
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#F9F7F2] border-t-transparent"
              aria-hidden="true"
            />
            Saving…
          </>
        ) : (
          "Save Profile"
        )}
      </button>
    </form>
  );
}