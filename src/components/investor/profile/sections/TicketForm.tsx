"use client";

import { useState, useTransition } from "react";
import { updateTicket } from "../actions";
import type { InvestorProfile } from "@/db/schema";
import { AlertCircle, CheckCircle } from "lucide-react";

const PRESETS = [
  { label: "₹5L – ₹25L",   min: "500000",    max: "2500000"   },
  { label: "₹25L – ₹1Cr",  min: "2500000",   max: "10000000"  },
  { label: "₹1Cr – ₹5Cr",  min: "10000000",  max: "50000000"  },
  { label: "₹5Cr – ₹20Cr", min: "50000000",  max: "200000000" },
  { label: "₹20Cr+",        min: "200000000", max: ""          },
];

type Props = { profile: InvestorProfile; userId: string; onSaved: () => void };

export default function TicketForm({ profile, userId, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result,  setResult]  = useState<{ success: boolean; message?: string } | null>(null);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [ticketMin, setTicketMin] = useState(profile.ticketSizeMin?.toString() ?? "");
  const [ticketMax, setTicketMax] = useState(profile.ticketSizeMax?.toString() ?? "");

  function applyPreset(min: string, max: string) {
    setTicketMin(min);
    setTicketMax(max);
    setErrors({});
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (ticketMin && isNaN(parseFloat(ticketMin))) errs.ticketSizeMin = "Must be a valid number.";
    if (ticketMax && isNaN(parseFloat(ticketMax))) errs.ticketSizeMax = "Must be a valid number.";
    if (ticketMin && parseFloat(ticketMin) < 0)    errs.ticketSizeMin = "Must be positive.";
    if (ticketMax && parseFloat(ticketMax) < 0)    errs.ticketSizeMax = "Must be positive.";
    if (ticketMin && ticketMax && parseFloat(ticketMin) > parseFloat(ticketMax))
      errs.ticketSizeMin = "Minimum cannot exceed maximum.";
    return errs;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const fd = new FormData(e.currentTarget);
    fd.set("ticketSizeMin", ticketMin);
    fd.set("ticketSizeMax", ticketMax);
    startTransition(async () => {
      const res = await updateTicket(fd);
      setResult(res);
      if (res.success) onSaved();
    });
  }

  const activePreset = PRESETS.find(p => p.min === ticketMin && p.max === ticketMax);

  const formatINR = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return "";
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(0)} Cr`;
    if (n >= 100_000)    return `₹${(n / 100_000).toFixed(0)} L`;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <input type="hidden" name="profileId" value={profile.id} />
      <input type="hidden" name="userId"    value={userId} />

      {/* ── Quick Presets ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          Quick Select
        </legend>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.label} type="button" onClick={() => applyPreset(p.min, p.max)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                activePreset?.label === p.label
                  ? "bg-forest text-white border-forest shadow-sm"
                  : "bg-beige/50 border-forest/10 hover:bg-beige text-forest/70"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* ── Manual Range ── */}
      <fieldset className="space-y-5">
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          Custom Range
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label-style" htmlFor="ticketSizeMin">Minimum Ticket (₹)</label>
            <input id="ticketSizeMin" name="ticketSizeMin" type="number" min="0" step="any"
              className={`input-field ${errors.ticketSizeMin ? "border-red-300 bg-red-50/30" : ""}`}
              value={ticketMin} placeholder="e.g. 500000"
              onChange={e => { setTicketMin(e.target.value); setErrors(p => ({ ...p, ticketSizeMin: "" })); }} />
            {errors.ticketSizeMin && (
              <div className="flex items-start gap-1.5 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-[1px]" />
                <p className="text-red-500 text-xs">{errors.ticketSizeMin}</p>
              </div>
            )}
            {ticketMin && !errors.ticketSizeMin && (
              <p className="text-[10px] text-forest/40 mt-1">{formatINR(ticketMin)}</p>
            )}
          </div>
          <div>
            <label className="label-style" htmlFor="ticketSizeMax">Maximum Ticket (₹)</label>
            <input id="ticketSizeMax" name="ticketSizeMax" type="number" min="0" step="any"
              className={`input-field ${errors.ticketSizeMax ? "border-red-300 bg-red-50/30" : ""}`}
              value={ticketMax} placeholder="e.g. 5000000"
              onChange={e => { setTicketMax(e.target.value); setErrors(p => ({ ...p, ticketSizeMax: "" })); }} />
            {errors.ticketSizeMax && (
              <div className="flex items-start gap-1.5 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-[1px]" />
                <p className="text-red-500 text-xs">{errors.ticketSizeMax}</p>
              </div>
            )}
            {ticketMax && !errors.ticketSizeMax && (
              <p className="text-[10px] text-forest/40 mt-1">{formatINR(ticketMax)}</p>
            )}
          </div>
        </div>

        {/* Range preview */}
        {ticketMin && ticketMax && !errors.ticketSizeMin && !errors.ticketSizeMax && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
            <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">
              Ticket range: {formatINR(ticketMin)} – {formatINR(ticketMax)}
            </p>
          </div>
        )}

        <p className="text-[10px] text-forest/30">
          Used for startup matching only · not displayed publicly.
        </p>
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
        {isPending ? "Saving…" : "Save Ticket Size"}
      </button>
    </form>
  );
}