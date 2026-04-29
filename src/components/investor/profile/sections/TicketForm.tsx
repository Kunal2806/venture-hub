"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { updateTicket } from "../actions";
import type { InvestorProfile } from "@/db/schema";
import { AlertCircle, CheckCircle, ChevronDown, Search, X } from "lucide-react";

// ─── Currency data ────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "USD", symbol: "$",    name: "US Dollar" },
  { code: "EUR", symbol: "€",    name: "Euro" },
  { code: "GBP", symbol: "£",    name: "British Pound" },
  { code: "INR", symbol: "₹",    name: "Indian Rupee" },
  { code: "AED", symbol: "د.إ",  name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼",    name: "Saudi Riyal" },
  { code: "SGD", symbol: "S$",   name: "Singapore Dollar" },
  { code: "AUD", symbol: "A$",   name: "Australian Dollar" },
  { code: "CAD", symbol: "C$",   name: "Canadian Dollar" },
  { code: "JPY", symbol: "¥",    name: "Japanese Yen" },
  { code: "CNY", symbol: "¥",    name: "Chinese Yuan" },
  { code: "CHF", symbol: "Fr",   name: "Swiss Franc" },
  { code: "BRL", symbol: "R$",   name: "Brazilian Real" },
  { code: "ZAR", symbol: "R",    name: "South African Rand" },
  { code: "NGN", symbol: "₦",    name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh",  name: "Kenyan Shilling" },
  { code: "PKR", symbol: "₨",    name: "Pakistani Rupee" },
  { code: "BDT", symbol: "৳",    name: "Bangladeshi Taka" },
  { code: "MYR", symbol: "RM",   name: "Malaysian Ringgit" },
  { code: "QAR", symbol: "QR",   name: "Qatari Riyal" },
  { code: "KWD", symbol: "KD",   name: "Kuwaiti Dinar" },
  { code: "EGP", symbol: "E£",   name: "Egyptian Pound" },
];

const VALID_CURRENCY_CODES = new Set(CURRENCIES.map(c => c.code));

const MAX_TICKET_BY_CURRENCY: Record<string, number> = {
  INR:     990_000_000,
  USD:     100_000_000,
  EUR:     100_000_000,
  GBP:     100_000_000,
  DEFAULT: 999_999_999,
};

const MIN_TICKET = 500;

// ─── INR Quick Presets ────────────────────────────────────────────────────────
const INR_PRESETS = [
  { label: "₹5L – ₹25L",   min: 500_000,    max: 2_500_000   },
  { label: "₹25L – ₹1Cr",  min: 2_500_000,  max: 10_000_000  },
  { label: "₹1Cr – ₹5Cr",  min: 10_000_000, max: 50_000_000  },
  { label: "₹5Cr – ₹20Cr", min: 50_000_000, max: 200_000_000 },
  { label: "₹20Cr+",        min: 200_000_000, max: 0          },
];

const USD_PRESETS = [
  { label: "$10K – $50K",   min: 10_000,     max: 50_000    },
  { label: "$50K – $250K",  min: 50_000,     max: 250_000   },
  { label: "$250K – $1M",   min: 250_000,    max: 1_000_000 },
  { label: "$1M – $5M",     min: 1_000_000,  max: 5_000_000 },
  { label: "$5M+",           min: 5_000_000,  max: 0         },
];

// ─── Ticket formatting (mirrors registration form) ────────────────────────────
function formatTicketAmount(raw: string, currencyCode: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  if (isNaN(num)) return "";
  const max = MAX_TICKET_BY_CURRENCY[currencyCode] ?? MAX_TICKET_BY_CURRENCY.DEFAULT;
  const clamped = Math.min(num, max);
  if (currencyCode === "INR") {
    const s = clamped.toString();
    if (s.length <= 3) return s;
    const last3 = s.slice(-3);
    const rest  = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }
  return clamped.toLocaleString("en-US");
}

function parseTicketAmount(formatted: string): number {
  return Number(formatted.replace(/,/g, ""));
}

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

// ─── Currency Dropdown ────────────────────────────────────────────────────────
function CurrencyDropdown({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const curr = CURRENCIES.find(c => c.code === value) ?? CURRENCIES[0];

  const filtered = search
    ? CURRENCIES.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : CURRENCIES;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-forest/15 rounded-lg text-sm font-semibold text-forest hover:bg-beige transition-colors"
      >
        <span className="text-[15px] leading-none">{curr.symbol}</span>
        <span className="text-xs text-forest/60">{curr.code}</span>
        <ChevronDown className={`w-3 h-3 text-forest/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-forest/12 rounded-xl shadow-2xl z-[100] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-forest/8 bg-forest/2">
            <Search className="w-3.5 h-3.5 text-forest/30 flex-shrink-0" />
            <input
              autoFocus
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="USD, Euro, Rupee…"
              className="flex-1 text-sm bg-transparent text-forest placeholder-forest/30 outline-none"
              onClick={e => e.stopPropagation()}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-forest/30 hover:text-forest/60 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <ul className="overflow-y-auto max-h-56">
            {filtered.map(c => (
              <li key={c.code}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${
                  value === c.code ? "bg-forest text-white" : "text-forest hover:bg-beige/60"
                }`}
                onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }}
              >
                <span className={`w-8 font-bold text-[15px] ${value === c.code ? "text-white" : "text-forest/60"}`}>{c.symbol}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className={`text-xs font-medium ${value === c.code ? "text-white/65" : "text-forest/40"}`}>{c.code}</span>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-4 text-sm text-forest/40 text-center">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Ticket Amount Input (mirrors registration form) ──────────────────────────
function TicketAmountInput({
  amount, currency, onAmountChange, placeholder, hasWarning, hasError,
}: {
  amount: string; currency: string;
  onAmountChange: (v: string) => void;
  placeholder: string; hasWarning?: boolean; hasError?: boolean;
}) {
  const curr   = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];
  const maxVal = MAX_TICKET_BY_CURRENCY[currency] ?? MAX_TICKET_BY_CURRENCY.DEFAULT;
  const maxLabel = currency === "INR"
    ? `Max ₹${(maxVal / 10_000_000).toFixed(0)} Cr`
    : `Max ${(maxVal / 1_000_000).toFixed(0)}M`;

  return (
    <div className={`flex border rounded-lg transition-colors bg-white ${
      hasError   ? "border-red-300 bg-red-50/30"    :
      hasWarning ? "border-amber-300"                :
                   "border-forest/15"
    }`}>
      <span className="flex items-center gap-1 px-3 py-2.5 border-r border-forest/10 flex-shrink-0">
        <span className="text-[15px] leading-none font-semibold text-forest">{curr.symbol}</span>
        <span className="text-xs text-forest/55 font-semibold">{curr.code}</span>
      </span>
      <input
        type="text" inputMode="numeric"
        className="flex-1 px-3 py-2.5 text-sm text-forest bg-transparent outline-none placeholder-forest/30 min-w-0"
        placeholder={placeholder} value={amount}
        onChange={e => onAmountChange(formatTicketAmount(e.target.value, currency))}
      />
      <span className="flex-shrink-0 self-center pr-3 text-[10px] text-forest/30 whitespace-nowrap">
        {maxLabel}
      </span>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateAmount(value: string, currency: string): VResult {
  if (!value.trim()) return { warning: "Specify a ticket size for better founder matches." };
  const num    = parseTicketAmount(value);
  const maxVal = MAX_TICKET_BY_CURRENCY[currency] ?? MAX_TICKET_BY_CURRENCY.DEFAULT;
  if (isNaN(num) || num < MIN_TICKET) return { error: `Minimum is ${MIN_TICKET.toLocaleString()}` };
  if (num > maxVal) return { error: `Maximum is ${maxVal.toLocaleString()}` };
  return { success: `Valid amount` };
}

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = { profile: InvestorProfile; userId: string; onSaved: () => void };

// ─── Helper: detect currency from existing stored value ──────────────────────
function detectCurrency(profile: InvestorProfile): string {
  // If profile has a stored ticketCurrency, use it. Otherwise default USD.
  // (If you add ticketCurrency column to schema, read it here.)
  // Heuristic: if ticketSizeMin >= 100000 and country is India, default INR.
  const min = Number(profile.ticketSizeMin ?? 0);
  if (min >= 100_000 && profile.country?.toLowerCase().includes("india")) return "INR";
  return "USD";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TicketForm({ profile, userId, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result,  setResult]  = useState<{ success: boolean; message?: string } | null>(null);

  const [currency,   setCurrency]   = useState(() => detectCurrency(profile));
  const [ticketMin,  setTicketMin]  = useState(() => {
    const v = profile.ticketSizeMin ? String(Math.round(Number(profile.ticketSizeMin))) : "";
    return v ? formatTicketAmount(v, detectCurrency(profile)) : "";
  });
  const [ticketMax,  setTicketMax]  = useState(() => {
    const v = profile.ticketSizeMax ? String(Math.round(Number(profile.ticketSizeMax))) : "";
    return v ? formatTicketAmount(v, detectCurrency(profile)) : "";
  });

  const [touchedMin, setTouchedMin] = useState(false);
  const [touchedMax, setTouchedMax] = useState(false);

  const [errs,  setErrs]  = useState<Record<string, string>>({});
  const [warns, setWarns] = useState<Record<string, string>>({});
  const [oks,   setOks]   = useState<Record<string, string>>({});

  const currObj  = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];
  const presets  = currency === "INR" ? INR_PRESETS : USD_PRESETS;

  function applyResult(id: string, r: VResult) {
    setErrs(p  => { const n = { ...p }; if (r.error)   n[id] = r.error;   else delete n[id]; return n; });
    setWarns(p => { const n = { ...p }; if (r.warning) n[id] = r.warning; else delete n[id]; return n; });
    setOks(p   => { const n = { ...p }; if (r.success) n[id] = r.success; else delete n[id]; return n; });
  }

  function handleCurrencyChange(code: string) {
    if (!VALID_CURRENCY_CODES.has(code)) return;
    setCurrency(code);
    if (ticketMin) {
      const fmt = formatTicketAmount(ticketMin, code);
      setTicketMin(fmt);
      if (touchedMin) applyResult("ticketSizeMin", validateAmount(fmt, code));
    }
    if (ticketMax) {
      const fmt = formatTicketAmount(ticketMax, code);
      setTicketMax(fmt);
      if (touchedMax) applyResult("ticketSizeMax", validateAmount(fmt, code));
    }
    setResult(null);
  }

  function handleMinChange(v: string) {
    setTicketMin(v);
    setTouchedMin(true);
    const num = parseTicketAmount(v);
    if (!v) {
      applyResult("ticketSizeMin", { warning: "Specify a ticket size for better matches." });
    } else if (num < MIN_TICKET) {
      applyResult("ticketSizeMin", { error: `Minimum is ${MIN_TICKET.toLocaleString()}` });
    } else {
      const maxNum = parseTicketAmount(ticketMax);
      if (ticketMax && !isNaN(maxNum) && num > maxNum) {
        applyResult("ticketSizeMin", { error: "Minimum cannot exceed maximum." });
      } else {
        applyResult("ticketSizeMin", { success: `Valid` });
      }
    }
    setResult(null);
  }

  function handleMaxChange(v: string) {
    setTicketMax(v);
    setTouchedMax(true);
    const num = parseTicketAmount(v);
    if (!v) {
      applyResult("ticketSizeMax", { warning: "Specify a ticket size for better matches." });
    } else if (num < MIN_TICKET) {
      applyResult("ticketSizeMax", { error: `Minimum is ${MIN_TICKET.toLocaleString()}` });
    } else {
      const minNum = parseTicketAmount(ticketMin);
      if (ticketMin && !isNaN(minNum) && num < minNum) {
        applyResult("ticketSizeMax", { error: "Maximum cannot be less than minimum." });
      } else {
        applyResult("ticketSizeMax", { success: `Valid` });
      }
    }
    setResult(null);
  }

  function applyPreset(min: number, max: number) {
    const fmtMin = formatTicketAmount(String(min), currency);
    const fmtMax = max ? formatTicketAmount(String(max), currency) : "";
    setTicketMin(fmtMin);
    setTicketMax(fmtMax);
    setTouchedMin(true);
    setTouchedMax(true);
    applyResult("ticketSizeMin", { success: "Valid" });
    if (fmtMax) applyResult("ticketSizeMax", { success: "Valid" });
    else applyResult("ticketSizeMax", {});
    setResult(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouchedMin(true);
    setTouchedMax(true);

    const rMin = validateAmount(ticketMin, currency);
    const rMax = validateAmount(ticketMax, currency);
    applyResult("ticketSizeMin", rMin);
    applyResult("ticketSizeMax", rMax);

    const minNum = parseTicketAmount(ticketMin);
    const maxNum = parseTicketAmount(ticketMax);
    if (ticketMin && ticketMax && !isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
      applyResult("ticketSizeMin", { error: "Minimum cannot exceed maximum." });
      return;
    }

    if (rMin.error || rMax.error) return;

    const fd = new FormData(e.currentTarget);
    fd.set("ticketSizeMin", String(minNum || ""));
    fd.set("ticketSizeMax", String(maxNum || ""));
    fd.set("ticketCurrency", currency);

    startTransition(async () => {
      const res = await updateTicket(fd);
      setResult(res);
      if (res.success) onSaved();
    });
  }

  const activePreset = presets.find(p =>
    parseTicketAmount(ticketMin) === p.min &&
    (p.max === 0 ? !ticketMax : parseTicketAmount(ticketMax) === p.max)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <input type="hidden" name="profileId"    value={profile.id} />
      <input type="hidden" name="userId"       value={userId} />
      <input type="hidden" name="ticketCurrency" value={currency} />

      {/* ── Currency selector info bar ── */}
      <div className="flex items-center gap-3 p-3 bg-forest/5 rounded-xl border border-forest/8">
        <CheckCircle className="w-3.5 h-3.5 text-forest/40 flex-shrink-0" />
        <p className="text-[11px] text-forest/60 flex-1">
          Currency · <span className="font-semibold text-forest">{currency} ({currObj.symbol})</span>
          {" · "}applies to both fields
        </p>
        <CurrencyDropdown value={currency} onChange={handleCurrencyChange} />
      </div>

      {/* ── Quick Presets ── */}
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          Quick Select
        </legend>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.label} type="button"
              onClick={() => applyPreset(p.min, p.max)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                activePreset?.label === p.label
                  ? "bg-forest text-white border-forest shadow-sm"
                  : "bg-beige/50 border-forest/10 hover:bg-beige text-forest/70"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* ── Min / Max fields ── */}
      <fieldset className="space-y-5">
        <legend className="text-xs font-bold uppercase tracking-[0.2em] text-forest/50 mb-4">
          Custom Range
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Min */}
          <div>
            <label className="label-style mb-1.5 block">Minimum Ticket</label>
            <TicketAmountInput
              amount={ticketMin}
              currency={currency}
              onAmountChange={handleMinChange}
              placeholder={currency === "INR" ? "5,000" : "5,000"}
              hasWarning={touchedMin && !!warns.ticketSizeMin}
              hasError={touchedMin && !!errs.ticketSizeMin}
            />
            {touchedMin && <FieldError msg={errs.ticketSizeMin} />}
            {touchedMin && <FieldWarn  msg={warns.ticketSizeMin} />}
            {touchedMin && <FieldOk    msg={oks.ticketSizeMin} />}
          </div>

          {/* Max */}
          <div>
            <label className="label-style mb-1.5 block">Maximum Ticket</label>
            <TicketAmountInput
              amount={ticketMax}
              currency={currency}
              onAmountChange={handleMaxChange}
              placeholder={currency === "INR" ? "50,00,000" : "500,000"}
              hasWarning={touchedMax && !!warns.ticketSizeMax}
              hasError={touchedMax && !!errs.ticketSizeMax}
            />
            {touchedMax && <FieldError msg={errs.ticketSizeMax} />}
            {touchedMax && <FieldWarn  msg={warns.ticketSizeMax} />}
            {touchedMax && <FieldOk    msg={oks.ticketSizeMax} />}
          </div>
        </div>

        {/* Range preview */}
        {ticketMin && ticketMax && !errs.ticketSizeMin && !errs.ticketSizeMax && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl animate-fade-in">
            <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">
              Ticket range: {currObj.symbol}{ticketMin} – {currObj.symbol}{ticketMax} {currency}
            </p>
          </div>
        )}

        <p className="text-[10px] text-forest/30">
          Used for startup matching only · not displayed publicly.
        </p>
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
        {isPending ? "Saving…" : "Save Ticket Size"}
      </button>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </form>
  );
}