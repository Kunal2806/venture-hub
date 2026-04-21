"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save, CheckCircle, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, X, ChevronDown, Search,
} from "lucide-react";
import { Navigation } from "@/components/home/Navigation";
import { Footer } from "@/components/home/Footer";
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from "libphonenumber-js";
import { CHAR_LIMITS, SECTOR_VALUES, SectorValue } from "@/lib/applicationSchema";

// Shared schema — single source of truth for client + server validation


// ─── Types ─────────────────────────────────────────────────────────────────────

interface CountryData {
  code:     string;
  name:     string;
  flag:     string;
  dial:     string;
  currency: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const stageMapping = {
  "Ideation":     "IDEA",
  "MVP":          "PRE_SEED",
  "Seed / Early": "SEED",
} as const;

const industryOptions: { value: SectorValue; label: string }[] = [
  { value: "climatetech", label: "Climatetech" },
  { value: "biotech",     label: "Biotechnology" },
  { value: "agtech",      label: "Agtech" },
  { value: "deeptech",    label: "Deeptech" },
  { value: "fintech",     label: "Fintech" },
  { value: "healthtech",  label: "Healthtech" },
  { value: "edtech",      label: "Edtech" },
  { value: "cleantech",   label: "Cleantech" },
  { value: "saas",        label: "SaaS" },
  { value: "ecommerce",   label: "E-commerce" },
  { value: "ai-ml",       label: "AI/ML" },
  { value: "robotics",    label: "Robotics" },
];

const stages = ["Ideation", "MVP", "Seed / Early"] as const;

const steps = [
  { num: "01", title: "Founder Identity", sub: "Personal Background", icon: "👤" },
  { num: "02", title: "Core Concept",     sub: "Business & Industry", icon: "💡" },
  { num: "03", title: "Impact Resonance", sub: "Social & Ecology",    icon: "🌍" },
  { num: "04", title: "Capital Needs",    sub: "Terms & Deployment",  icon: "💰" },
  { num: "05", title: "The Collective",   sub: "Team & Outreach",     icon: "🤝" },
];

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
  { code: "IDR", symbol: "Rp",   name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱",    name: "Philippine Peso" },
  { code: "THB", symbol: "฿",    name: "Thai Baht" },
  { code: "KRW", symbol: "₩",    name: "South Korean Won" },
  { code: "TRY", symbol: "₺",    name: "Turkish Lira" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso" },
  { code: "RUB", symbol: "₽",    name: "Russian Ruble" },
  { code: "SEK", symbol: "kr",   name: "Swedish Krona" },
  { code: "NOK", symbol: "kr",   name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr",   name: "Danish Krone" },
  { code: "NZD", symbol: "NZ$",  name: "New Zealand Dollar" },
  { code: "HKD", symbol: "HK$",  name: "Hong Kong Dollar" },
  { code: "QAR", symbol: "QR",   name: "Qatari Riyal" },
  { code: "KWD", symbol: "KD",   name: "Kuwaiti Dinar" },
  { code: "EGP", symbol: "E£",   name: "Egyptian Pound" },
];

// Valid currency codes set — used to validate capitalCurrency before sending to API
const VALID_CURRENCY_CODES = new Set(CURRENCIES.map((c) => c.code));

const PERIOD_UNITS = ["Days", "Months", "Years"] as const;
type PeriodUnit = typeof PERIOD_UNITS[number];

const FREE_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "live.com", "icloud.com", "aol.com", "protonmail.com",
];

const TZ_TO_CC: Record<string, string> = {
  "Africa/Addis_Ababa": "ET", "Africa/Cairo": "EG", "Africa/Casablanca": "MA",
  "Africa/Lagos": "NG", "Africa/Nairobi": "KE", "Africa/Tunis": "TN",
  "America/Bogota": "CO", "America/Buenos_Aires": "AR", "America/Chicago": "US",
  "America/Denver": "US", "America/Lima": "PE", "America/Los_Angeles": "US",
  "America/Mexico_City": "MX", "America/New_York": "US", "America/Phoenix": "US",
  "America/Santiago": "CL", "America/Sao_Paulo": "BR", "America/Toronto": "CA",
  "America/Vancouver": "CA", "Asia/Baghdad": "IQ", "Asia/Baku": "AZ",
  "Asia/Bangkok": "TH", "Asia/Colombo": "LK", "Asia/Dhaka": "BD",
  "Asia/Dubai": "AE", "Asia/Ho_Chi_Minh": "VN", "Asia/Hong_Kong": "HK",
  "Asia/Jakarta": "ID", "Asia/Karachi": "PK", "Asia/Kathmandu": "NP",
  "Asia/Kolkata": "IN", "Asia/Kuala_Lumpur": "MY", "Asia/Kuwait": "KW",
  "Asia/Manila": "PH", "Asia/Qatar": "QA", "Asia/Riyadh": "SA",
  "Asia/Seoul": "KR", "Asia/Shanghai": "CN", "Asia/Singapore": "SG",
  "Asia/Taipei": "TW", "Asia/Tashkent": "UZ", "Asia/Tehran": "IR",
  "Asia/Tokyo": "JP", "Asia/Yangon": "MM", "Australia/Melbourne": "AU",
  "Australia/Perth": "AU", "Australia/Sydney": "AU", "Europe/Amsterdam": "NL",
  "Europe/Athens": "GR", "Europe/Belgrade": "RS", "Europe/Berlin": "DE",
  "Europe/Brussels": "BE", "Europe/Bucharest": "RO", "Europe/Budapest": "HU",
  "Europe/Copenhagen": "DK", "Europe/Dublin": "IE", "Europe/Helsinki": "FI",
  "Europe/Istanbul": "TR", "Europe/Kyiv": "UA", "Europe/Lisbon": "PT",
  "Europe/London": "GB", "Europe/Madrid": "ES", "Europe/Moscow": "RU",
  "Europe/Oslo": "NO", "Europe/Paris": "FR", "Europe/Prague": "CZ",
  "Europe/Rome": "IT", "Europe/Sofia": "BG", "Europe/Stockholm": "SE",
  "Europe/Warsaw": "PL", "Europe/Zurich": "CH", "Pacific/Auckland": "NZ",
};

// ─── Non-sensitive fields safe to persist in sessionStorage ───────────────────
//
// SECURITY: Email, mobile, and company details are NOT in this list.
// sessionStorage clears on tab close, reducing the XSS exposure window.
// We never use localStorage for PII.
//
const DRAFT_SAFE_FIELDS = [
  "companyName", "sector", "stage", "websiteUrl",
  "impactDescription", "impactMetrics", "useOfFunds",
] as const;

type DraftSafeField = typeof DRAFT_SAFE_FIELDS[number];

// ─── Micro components ──────────────────────────────────────────────────────────

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

// ─── Client-side field validation ─────────────────────────────────────────────
//
// IMPORTANT: These rules mirror the shared Zod schema in lib/applicationSchema.ts
// exactly. Client validation is UX-only; the server enforces all rules
// independently. If you update a rule here, update the schema too.

type VResult = { error?: string; warning?: string; success?: string };

function validate(
  id: string,
  value: string,
  ctx: { dialCountry?: string } = {}
): VResult {
  switch (id) {
    case "founderName":
      if (!value.trim()) return { error: "Please enter your full name" };
      if (value.trim().length < 2) return { error: "At least 2 characters" };
      if (value.length > CHAR_LIMITS.founderName) return { error: `Max ${CHAR_LIMITS.founderName} characters` };
      if (!/^[A-Za-z\u00C0-\u017E\s'\-]+$/.test(value.trim()))
        return { error: "Only letters, spaces, hyphens and apostrophes" };
      return { success: "Looks good" };

    case "email": {
      if (!value.trim()) return { error: "Email is required" };
      if (value.length > CHAR_LIMITS.email) return { error: "Email is too long" };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
        return { error: "Doesn't look valid — try name@company.com" };
      if (value.toLowerCase().endsWith(".con") || value.toLowerCase().endsWith(".cmo"))
        return { error: "Possible typo — did you mean .com?" };
      const domain = value.split("@")[1]?.toLowerCase();
      if (FREE_EMAIL_DOMAINS.includes(domain))
        return { warning: "We recommend a professional work email" };
      return { success: "Valid email" };
    }

    case "mobile": {
      if (!value.trim()) return {};
      if (!ctx.dialCountry) return { warning: "Select a country code to validate" };
      try {
        if (!isValidPhoneNumber(value, ctx.dialCountry as CountryCode))
          return { error: "Invalid number for the selected country" };
        const p = parsePhoneNumber(value, ctx.dialCountry as CountryCode);
        return { success: `Valid · ${p.formatInternational()}` };
      } catch {
        return { error: "Could not parse — check the format" };
      }
    }

    case "companyName":
      if (!value.trim()) return { error: "Company name is required" };
      if (value.trim().length < 2) return { error: "At least 2 characters" };
      if (value.length > CHAR_LIMITS.companyName) return { error: `Max ${CHAR_LIMITS.companyName} characters` };
      return { success: "Looks good" };

    case "sector":
      if (!value) return { error: "Please select an industry" };
      // Validate against the shared allowlist — same check the server does
      if (!(SECTOR_VALUES as readonly string[]).includes(value))
        return { error: "Please select a valid industry" };
      return {};

    case "websiteUrl":
      if (!value.trim()) return { warning: "A website builds credibility with reviewers" };
      if (!value.trim().startsWith("https://"))
        return { error: "Must start with https:// for security" };
      if (!/^https:\/\/.+\..+/.test(value.trim()))
        return { error: "Must be a valid URL — e.g. https://yoursite.com" };
      if (value.length > CHAR_LIMITS.websiteUrl) return { error: `Max ${CHAR_LIMITS.websiteUrl} characters` };
      return { success: "Valid URL" };

    case "country":
      if (!value.trim()) return { warning: "Helps us match regional investors" };
      return {};

    case "impactDescription":
      if (!value.trim()) return { warning: "Describe your impact — reviewed 2× faster" };
      if (value.trim().length < 30) return { warning: "A bit more detail helps reviewers" };
      if (value.length > CHAR_LIMITS.impactDescription) return { error: `Max ${CHAR_LIMITS.impactDescription} characters` };
      return { success: "Great — adds real depth to your application" };

    case "capitalRequested":
      if (!value.trim()) return { warning: "Specifying an amount helps investors assess fit" };
      // Mirror server regex: digits, commas, dots only
      if (!/^[\d.,]*$/.test(value)) return { error: "Please enter a numeric amount" };
      return {};

    case "fundingPeriod":
      if (!value.trim()) return { warning: "Let investors know your expected runway" };
      return {};

    case "useOfFunds":
      if (!value.trim()) return { warning: "A brief breakdown increases reviewer confidence" };
      if (value.length > CHAR_LIMITS.useOfFunds) return { error: `Max ${CHAR_LIMITS.useOfFunds} characters` };
      return {};

    case "pitchDeckUrl":
      if (!value.trim()) return { warning: "Applications with a pitch deck are 3× more likely to advance" };
      if (!value.trim().startsWith("https://"))
        return { error: "Must start with https://" };
      if (!/^https:\/\/.+\..+/.test(value.trim()))
        return { error: "Must be a valid URL" };
      if (value.length > CHAR_LIMITS.pitchDeckUrl) return { error: `Max ${CHAR_LIMITS.pitchDeckUrl} characters` };
      return { success: "Link looks valid" };

    default:
      return {};
  }
}

// ─── Phone country dropdown ────────────────────────────────────────────────────

function PhoneCountryDropdown({
  value, onChange, countries, loading,
}: {
  value: string;
  onChange: (cc: string) => void;
  countries: CountryData[];
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const keyBuf = useRef("");
  const keyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = search
    ? countries.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : countries;

  const selected = countries.find(c => c.code === value);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => searchRef.current?.focus(), 50);
    if (value && listRef.current) {
      const idx = filtered.findIndex(c => c.code === value);
      const el = listRef.current.children[idx + 1] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  function onTriggerKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); return; }
    if (e.key === "Escape") { setOpen(false); setSearch(""); return; }
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      keyBuf.current += e.key.toUpperCase();
      if (keyTimer.current) clearTimeout(keyTimer.current);
      keyTimer.current = setTimeout(() => { keyBuf.current = ""; }, 800);
      const match = countries.find(c => c.name.toUpperCase().startsWith(keyBuf.current));
      if (match) onChange(match.code);
    }
  }

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={onTriggerKey}
        disabled={loading}
        className="input-field flex items-center gap-2 pr-8 min-w-[130px] cursor-pointer select-none"
        style={{ fontSize: 13 }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-forest/40" />
          : selected
            ? (
              <>
                <img src={selected.flag} alt={selected.name} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
                <span className="font-medium text-forest/70">{selected.dial}</span>
              </>
            )
            : <span className="text-forest/40">+– Code</span>
        }
        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-forest/40 pointer-events-none transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-80 bg-white border border-forest/12 rounded-xl shadow-2xl z-[100] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-forest/8 bg-forest/2">
            <Search className="w-3.5 h-3.5 text-forest/30 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country or dial code…"
              className="flex-1 text-sm bg-transparent text-forest placeholder-forest/30 outline-none"
              onClick={e => e.stopPropagation()}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-forest/30 hover:text-forest/60 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <ul ref={listRef} className="overflow-y-auto max-h-60" role="listbox">
            <li
              role="option" aria-selected={!value}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${!value ? "bg-forest/6 font-medium text-forest" : "text-forest/50 hover:bg-beige/60"}`}
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
            >
              <span className="w-7 text-center">–</span>
              <span>No country code</span>
            </li>
            {filtered.map(c => (
              <li
                key={c.code}
                role="option" aria-selected={value === c.code}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${
                  value === c.code ? "bg-forest text-white" : "text-forest hover:bg-beige/60"
                }`}
                onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }}
              >
                <img src={c.flag} alt={c.name} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
                <span className="flex-1 truncate">{c.name}</span>
                <span className={`text-xs tabular-nums font-medium ${value === c.code ? "text-white/70" : "text-forest/40"}`}>{c.dial}</span>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-4 text-sm text-forest/40 text-center">No results for "{search}"</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Currency + Amount input ───────────────────────────────────────────────────

function CapitalInput({
  amount, currency, onAmountChange, onCurrencyChange, hasWarning,
}: {
  amount: string;
  currency: string;
  onAmountChange: (v: string) => void;
  onCurrencyChange: (c: string) => void;
  hasWarning?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const curr = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];

  const filtered = search
    ? CURRENCIES.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : CURRENCIES;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className={`flex border rounded-lg transition-colors bg-white ${hasWarning ? "border-amber-300" : "border-forest/15"}`}>
      <div className="relative flex-shrink-0 border-r border-forest/10" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 h-full py-2.5 text-sm font-semibold text-forest hover:bg-forest/4 transition-colors whitespace-nowrap rounded-l-[7px]"
        >
          <span className="text-[15px] leading-none">{curr.symbol}</span>
          <span className="text-xs text-forest/55">{curr.code}</span>
          <ChevronDown className={`w-3 h-3 text-forest/35 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-forest/12 rounded-xl shadow-2xl z-[100] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-forest/8 bg-forest/2">
              <Search className="w-3.5 h-3.5 text-forest/30 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="USD, Euro, Rupee…"
                className="flex-1 text-sm bg-transparent text-forest placeholder-forest/30 outline-none"
                onClick={e => e.stopPropagation()}
              />
            </div>
            <ul className="overflow-y-auto max-h-56">
              {filtered.map(c => (
                <li
                  key={c.code}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${
                    currency === c.code ? "bg-forest text-white" : "text-forest hover:bg-beige/60"
                  }`}
                  onClick={() => { onCurrencyChange(c.code); setOpen(false); setSearch(""); }}
                >
                  <span className={`w-8 font-bold text-[15px] ${currency === c.code ? "text-white" : "text-forest/60"}`}>{c.symbol}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className={`text-xs font-medium ${currency === c.code ? "text-white/65" : "text-forest/40"}`}>{c.code}</span>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-4 text-sm text-forest/40 text-center">No results</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <input
        type="text"
        inputMode="numeric"
        className="flex-1 px-3 py-2.5 text-sm text-forest bg-transparent outline-none placeholder-forest/30 min-w-0"
        placeholder="500,000"
        value={amount}
        maxLength={CHAR_LIMITS.capitalRequested}
        onChange={e => onAmountChange(e.target.value.replace(/[^\d.,]/g, "").slice(0, CHAR_LIMITS.capitalRequested))}
      />
    </div>
  );
}

// ─── Period picker ─────────────────────────────────────────────────────────────

function PeriodInput({
  value, unit, onValueChange, onUnitChange, hasWarning,
}: {
  value: string;
  unit: PeriodUnit;
  onValueChange: (v: string) => void;
  onUnitChange: (u: PeriodUnit) => void;
  hasWarning?: boolean;
}) {
  return (
    <div className={`flex border rounded-lg overflow-hidden transition-colors ${hasWarning ? "border-amber-300 bg-amber-50/20" : "border-forest/15 bg-white"}`}>
      <input
        type="text"
        inputMode="numeric"
        className="w-20 px-3 py-2.5 text-sm text-forest bg-transparent outline-none placeholder-forest/30 border-r border-forest/10"
        placeholder="18"
        value={value}
        onChange={e => onValueChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      />
      <div className="flex items-center gap-1 px-2.5">
        {PERIOD_UNITS.map(u => (
          <button
            key={u}
            type="button"
            onClick={() => onUnitChange(u)}
            className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors ${
              unit === u ? "bg-forest text-white" : "bg-forest/6 text-forest/50 hover:bg-forest/12 hover:text-forest"
            }`}
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  const [errs,  setErrs]  = useState<Record<string, string>>({});
  const [warns, setWarns] = useState<Record<string, string>>({});
  const [oks,   setOks]   = useState<Record<string, string>>({});

  const [isClient, setIsClient] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [countries, setCountries] = useState<CountryData[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  const [dialCountry, setDialCountry] = useState("");
  const [countryAutoFilled, setCountryAutoFilled] = useState(false);
  const [capitalCurrency, setCapitalCurrency] = useState("USD");
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>("Months");
  const [periodValue, setPeriodValue] = useState("");

  const [form, setForm] = useState({
    founderName: "", email: "", mobile: "",
    companyName: "", sector: "",
    stage: "Seed / Early" as typeof stages[number],
    country: "", websiteUrl: "",
    impactDescription: "", impactMetrics: "",
    capitalRequested: "", fundingPeriod: "", useOfFunds: "",
    pitchDeckUrl: "",
  });

  useEffect(() => {
    fetch("/api/countries")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: CountryData[]) => setCountries(data))
      .catch(() => {})
      .finally(() => setCountriesLoading(false));
  }, []);

  useEffect(() => { setIsClient(true); }, []);

  // ── Restore draft from sessionStorage (non-sensitive fields only) ──────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("venturehub-draft");
      if (!saved) return;
      const p = JSON.parse(saved);
      // Only restore fields on the safe list — never email, mobile, or name
      const patch: Partial<typeof form> = {};
      for (const field of DRAFT_SAFE_FIELDS) {
        if (typeof p[field] === "string") {
          (patch as Record<string, string>)[field] = p[field];
        }
      }
      setForm(prev => ({ ...prev, ...patch }));
      if (p.dialCountry)    setDialCountry(p.dialCountry);
      if (p.capitalCurrency && VALID_CURRENCY_CODES.has(p.capitalCurrency))
        setCapitalCurrency(p.capitalCurrency);
      if (p.periodUnit && (PERIOD_UNITS as readonly string[]).includes(p.periodUnit))
        setPeriodUnit(p.periodUnit as PeriodUnit);
      if (p.periodValue)    setPeriodValue(p.periodValue);
    } catch {
      // Corrupt storage — ignore silently
    }
  }, []);

  useEffect(() => {
    if (!isClient || countriesLoading || !countries.length || dialCountry) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const cc = TZ_TO_CC[tz];
      if (!cc) return;
      const found = countries.find(c => c.code === cc);
      if (!found) return;
      setDialCountry(cc);
      setForm(prev => ({ ...prev, country: found.name }));
      setCapitalCurrency(found.currency || "USD");
      setCountryAutoFilled(true);
    } catch {}
  }, [isClient, countriesLoading, countries]);

  useEffect(() => {
    const combined = periodValue ? `${periodValue} ${periodUnit}` : "";
    setForm(prev => ({ ...prev, fundingPeriod: combined }));
    applyResult("fundingPeriod", validate("fundingPeriod", combined));
  }, [periodValue, periodUnit]);

  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showMobileMenu]);

  function applyResult(id: string, r: VResult) {
    setErrs(p => { const n = { ...p }; if (r.error) n[id] = r.error; else delete n[id]; return n; });
    setWarns(p => { const n = { ...p }; if (r.warning) n[id] = r.warning; else delete n[id]; return n; });
    setOks(p => { const n = { ...p }; if (r.success) n[id] = r.success; else delete n[id]; return n; });
  }

  function fieldCls(id: string) {
    if (errs[id])  return "border-red-300 bg-red-50/30";
    if (warns[id]) return "border-amber-300 bg-amber-50/20";
    if (oks[id])   return "border-green-400 bg-green-50/20";
    return "";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { id, value } = e.target;
    const limit = CHAR_LIMITS[id as keyof typeof CHAR_LIMITS];
    const v = limit ? value.slice(0, limit) : value;
    setForm(prev => ({ ...prev, [id]: v }));
    setSubmitError(null);
    applyResult(id, validate(id, v, { dialCountry }));
  }

  function handleDialChange(cc: string) {
    setDialCountry(cc);
    if (cc) {
      const found = countries.find(c => c.code === cc);
      if (found) {
        setForm(prev => ({ ...prev, country: found.name }));
        setCapitalCurrency(found.currency || "USD");
        setCountryAutoFilled(true);
        applyResult("country", {});
      }
    } else {
      setCountryAutoFilled(false);
    }
    if (form.mobile.trim()) {
      applyResult("mobile", validate("mobile", form.mobile, { dialCountry: cc }));
    }
  }

  const STEP_FIELDS: Record<number, string[]> = {
    0: ["founderName", "email", "mobile"],
    1: ["companyName", "sector", "websiteUrl", "country"],
    2: ["impactDescription"],
    3: ["capitalRequested", "fundingPeriod", "useOfFunds"],
    4: ["pitchDeckUrl"],
  };

  function validateStep(step: number): boolean {
    let ok = true;
    for (const id of (STEP_FIELDS[step] ?? [])) {
      const v = (form as Record<string, string>)[id] ?? "";
      const r = validate(id, v, { dialCountry });
      applyResult(id, r);
      if (r.error) ok = false;
    }
    return ok;
  }

  function validateAll(): boolean {
    let ok = true;
    for (const ids of Object.values(STEP_FIELDS)) {
      for (const id of ids) {
        const v = (form as Record<string, string>)[id] ?? "";
        const r = validate(id, v, { dialCountry });
        applyResult(id, r);
        if (r.error) ok = false;
      }
    }
    return ok;
  }

  // ── Save draft: only non-sensitive fields to sessionStorage ───────────────
  const saveDraft = () => {
    try {
      const safeDraft: Record<string, string> = { dialCountry, capitalCurrency, periodUnit, periodValue };
      for (const field of DRAFT_SAFE_FIELDS) {
        safeDraft[field] = (form as Record<string, string>)[field] ?? "";
      }
      sessionStorage.setItem("venturehub-draft", JSON.stringify(safeDraft));
    } catch {
      // sessionStorage unavailable — fail silently
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      saveDraft();
      setCurrentStep(p => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(p => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStepClick = (i: number) => {
    if (i <= currentStep || validateStep(currentStep)) {
      setCurrentStep(i);
      setShowMobileMenu(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSaveProgress = () => {
    saveDraft();
    const t = document.createElement("div");
    t.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-forest text-white px-5 py-3 rounded-full shadow-xl z-[200] text-sm font-medium pointer-events-none";
    t.textContent = "Progress saved ✓";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  };

  const handleSubmit = async () => {
    if (!validateAll()) {
      setSubmitError("Some required fields are missing or invalid. Please review each step.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    setEmailWarning(null);

    try {
      let formattedPhone: string | undefined;
      if (form.mobile.trim() && dialCountry) {
        try {
          formattedPhone = parsePhoneNumber(form.mobile, dialCountry as CountryCode).formatInternational();
        } catch {
          formattedPhone = form.mobile;
        }
      }

      // Validate currency code before sending — must be in our allowlist
      const safeCurrency = VALID_CURRENCY_CODES.has(capitalCurrency) ? capitalCurrency : "USD";

      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founderName:       form.founderName,
          email:             form.email,
          mobile:            formattedPhone,
          companyName:       form.companyName,
          sector:            form.sector,
          stage:             stageMapping[form.stage as keyof typeof stageMapping],
          country:           form.country        || undefined,
          websiteUrl:        form.websiteUrl      || undefined,
          pitchDeckUrl:      form.pitchDeckUrl    || undefined,
          impactDescription: form.impactDescription || undefined,
          impactMetrics:     form.impactMetrics    || undefined,
          useOfFunds:        form.useOfFunds       || undefined,
          fundingPeriod:     form.fundingPeriod    || undefined,
          capitalRequested:  form.capitalRequested || undefined,
          capitalCurrency:   safeCurrency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
        if (response.status === 409) throw new Error("An application with this email already exists.");
        if (response.status === 400 && data.details)
          throw new Error(data.details.map((d: { message: string }) => d.message).join(". "));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      // Clear only the draft — never stored sensitive data there anyway
      try { sessionStorage.removeItem("venturehub-draft"); } catch {}

      // Surface email warning if confirmation failed
      if (data.emailWarning) setEmailWarning(data.emailWarning);

      router.push("/startups/success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation activeItem="home" />
        <main className="flex-1 pt-16 sm:pt-20 flex items-center justify-center">
          <div className="animate-pulse text-forest/40 text-sm">Loading…</div>
        </main>
      </div>
    );
  }

  const selectedCountry = countries.find(c => c.code === dialCountry);

  return (
    <div className="min-h-screen flex flex-col bg-beige/30">
      <Navigation activeItem="home" />

      {/* Sticky mobile progress */}
      <div className="lg:hidden sticky top-16 z-40 bg-white border-b border-forest/10 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex gap-1.5 flex-shrink-0">
            {steps.map((_, i) => (
              <button key={i} onClick={() => handleStepClick(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? "w-5 bg-forest" : i < currentStep ? "w-1.5 bg-forest/50" : "w-1.5 bg-forest/15"}`} />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest/40 leading-none">Step {currentStep + 1} of {steps.length}</p>
            <p className="text-sm font-serif text-forest leading-tight truncate">{steps[currentStep].title}</p>
          </div>
          <button onClick={() => setShowMobileMenu(true)} className="flex-shrink-0 w-8 h-8 rounded-full bg-forest/5 flex items-center justify-center text-sm">
            {steps[currentStep].icon}
          </button>
        </div>
        <div className="h-0.5 bg-forest/8">
          <div className="h-full bg-forest transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <main className="flex-1 pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto pt-6 lg:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-20">

            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 h-fit">
              <span className="text-forest/40 font-bold uppercase tracking-[0.4em] text-[10px] block mb-4">Apply for Capital</span>
              <h1 className="font-serif text-5xl lg:text-6xl text-forest mb-8 leading-tight">Plant your <span className="italic">vision.</span></h1>
              <p className="text-forest/70 text-lg leading-relaxed mb-12 max-w-sm">We partner with founders who see beyond the horizon. Tell us about the legacy you intend to build.</p>
              <nav className="space-y-7 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-forest/10" />
                {steps.map(({ num, title, sub }, i) => (
                  <div key={num} className={`relative pl-8 flex items-center group cursor-pointer transition-all ${i === currentStep ? "scale-105" : ""}`} onClick={() => handleStepClick(i)}>
                    <div className={`absolute left-0 w-3.5 h-3.5 rounded-full transition-all ${i === currentStep ? "bg-forest ring-4 ring-forest/20 scale-110" : i < currentStep ? "bg-forest/60" : "bg-forest/20 group-hover:bg-forest/40"}`} />
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest transition-colors ${i === currentStep ? "text-forest" : i < currentStep ? "text-forest/60" : "text-forest/40 group-hover:text-forest/60"}`}>{num}. {title}</p>
                      <p className={`text-[10px] uppercase tracking-wider ${i === currentStep ? "text-forest/40" : i < currentStep ? "text-forest/30" : "text-forest/20"}`}>{sub}</p>
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            {/* Mobile title */}
            <div className="lg:hidden col-span-1 mb-5 px-1">
              <h1 className="font-serif text-3xl text-forest leading-tight">Plant your <span className="italic">vision.</span></h1>
              <p className="text-forest/60 text-sm mt-1.5 leading-relaxed">We partner with founders who see beyond the horizon.</p>
            </div>

            {/* Form */}
            <div className="lg:col-span-8">
              <div className="bg-white/60 backdrop-blur-sm border border-forest/5 shadow-lg rounded-2xl lg:rounded-none overflow-hidden">

                {submitError && (
                  <div className="mx-4 sm:mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-700 text-sm font-medium">Submission failed</p>
                      <p className="text-red-600 text-xs mt-0.5">{submitError}</p>
                    </div>
                  </div>
                )}

                {emailWarning && (
                  <div className="mx-4 sm:mx-8 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-700 text-xs">{emailWarning}</p>
                  </div>
                )}

                <form className="p-4 sm:p-8 lg:p-12 space-y-8 lg:space-y-12" onSubmit={e => e.preventDefault()}>

                  {/* ── Step 1 ── */}
                  {currentStep === 0 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Founder Identity</h2>
                        <p className="text-sm text-forest/50 mt-1">The heartbeat of every great venture is its architect.</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="founderName">Full Name <span className="text-red-400">*</span></label>
                          <CharCount cur={form.founderName.length} max={CHAR_LIMITS.founderName} />
                        </div>
                        <input type="text" id="founderName" autoComplete="name" maxLength={CHAR_LIMITS.founderName}
                          className={`input-field ${fieldCls("founderName")}`}
                          placeholder="Elara Vance" value={form.founderName} onChange={handleChange} />
                        <FieldError msg={errs.founderName} />
                        <FieldOk   msg={oks.founderName} />
                        <p className="text-[10px] text-forest/30 mt-1">Letters, spaces, hyphens, apostrophes · 2–{CHAR_LIMITS.founderName} chars</p>
                      </div>

                      <div>
                        <label className="label-style" htmlFor="email">Professional Email <span className="text-red-400">*</span></label>
                        <input type="email" id="email" autoComplete="email"
                          className={`input-field ${fieldCls("email")}`}
                          placeholder="elara@aeris.bio" value={form.email} onChange={handleChange} />
                        <FieldError msg={errs.email} />
                        <FieldWarn  msg={warns.email} />
                        <FieldOk   msg={oks.email} />
                      </div>

                      <div>
                        <label className="label-style mb-1 block">
                          Mobile <span className="text-forest/30 font-normal">(optional)</span>
                        </label>
                        <div className="flex gap-2">
                          <PhoneCountryDropdown value={dialCountry} onChange={handleDialChange} countries={countries} loading={countriesLoading} />
                          <input type="tel" id="mobile" autoComplete="tel-national"
                            className={`input-field flex-1 ${fieldCls("mobile")}`}
                            placeholder={dialCountry === "IN" ? "98765 43210" : dialCountry === "US" ? "(555) 123-4567" : dialCountry === "GB" ? "07700 900123" : "Enter number"}
                            value={form.mobile} onChange={handleChange} />
                        </div>
                        <FieldError msg={errs.mobile} />
                        <FieldWarn  msg={warns.mobile} />
                        <FieldOk   msg={oks.mobile} />
                        {countryAutoFilled && dialCountry && selectedCountry && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <img src={selectedCountry.flag} alt={selectedCountry.name} className="w-4 h-3 object-cover rounded-sm" />
                            <p className="text-[10px] text-forest/50">
                              Auto-detected: <span className="font-medium text-forest/70">{selectedCountry.name}</span>
                            </p>
                          </div>
                        )}
                        <p className="text-[10px] text-forest/30 mt-1">Validated via libphonenumber · stored in E.164 format</p>
                      </div>
                    </section>
                  )}

                  {/* ── Step 2 ── */}
                  {currentStep === 1 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Core Concept</h2>
                        <p className="text-sm text-forest/50 mt-1">Defining the solution and the ecosystem it inhabits.</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="companyName">Company Name <span className="text-red-400">*</span></label>
                          <CharCount cur={form.companyName.length} max={CHAR_LIMITS.companyName} />
                        </div>
                        <input type="text" id="companyName" maxLength={CHAR_LIMITS.companyName}
                          className={`input-field ${fieldCls("companyName")}`}
                          placeholder="Aeris Bio" value={form.companyName} onChange={handleChange} />
                        <FieldError msg={errs.companyName} />
                        <FieldOk   msg={oks.companyName} />
                      </div>

                      <div>
                        <label className="label-style" htmlFor="sector">Primary Industry <span className="text-red-400">*</span></label>
                        <select id="sector" className={`input-field appearance-none cursor-pointer ${fieldCls("sector")}`}
                          value={form.sector} onChange={handleChange}>
                          <option value="">Select Industry</option>
                          {industryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <FieldError msg={errs.sector} />
                      </div>

                      <div>
                        <label className="label-style">Current Stage</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {stages.map(s => (
                            <label key={s} className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-all ${form.stage === s ? "bg-forest text-white border-forest shadow-sm" : "bg-beige/50 border-forest/10 hover:bg-beige"}`}>
                              <input type="radio" name="stage" value={s} checked={form.stage === s} onChange={() => setForm(p => ({ ...p, stage: s }))} className="sr-only" />
                              <span className={`text-xs font-bold uppercase tracking-widest ${form.stage === s ? "text-white" : "text-forest/70"}`}>{s}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="label-style" htmlFor="country">Country <span className="text-forest/30 font-normal">(optional)</span></label>
                            <CharCount cur={form.country.length} max={CHAR_LIMITS.country} />
                          </div>
                          <input type="text" id="country" maxLength={CHAR_LIMITS.country}
                            className={`input-field ${fieldCls("country")}`}
                            placeholder="India" value={form.country} onChange={handleChange} />
                          {countryAutoFilled && form.country && (
                            <div className="flex items-center gap-1 mt-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <p className="text-[10px] text-forest/40">Auto-filled from phone country</p>
                            </div>
                          )}
                          <FieldWarn msg={warns.country} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="label-style" htmlFor="websiteUrl">Website <span className="text-forest/30 font-normal">(optional)</span></label>
                            <CharCount cur={form.websiteUrl.length} max={CHAR_LIMITS.websiteUrl} />
                          </div>
                          <input type="url" id="websiteUrl" maxLength={CHAR_LIMITS.websiteUrl}
                            className={`input-field ${fieldCls("websiteUrl")}`}
                            placeholder="https://aeris.bio" value={form.websiteUrl} onChange={handleChange} />
                          <FieldError msg={errs.websiteUrl} />
                          <FieldWarn  msg={warns.websiteUrl} />
                          <FieldOk   msg={oks.websiteUrl} />
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── Step 3 ── */}
                  {currentStep === 2 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Impact Resonance</h2>
                        <p className="text-sm text-forest/50 mt-1">How does your growth enrich the world?</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="impactDescription">Environmental or Social Impact</label>
                          <CharCount cur={form.impactDescription.length} max={CHAR_LIMITS.impactDescription} />
                        </div>
                        <textarea id="impactDescription" rows={5} maxLength={CHAR_LIMITS.impactDescription}
                          className={`input-field resize-none ${fieldCls("impactDescription")}`}
                          placeholder="Describe the intended positive ripple effects of your technology…"
                          value={form.impactDescription} onChange={handleChange} />
                        <FieldWarn msg={warns.impactDescription} />
                        <FieldOk   msg={oks.impactDescription} />
                        <p className="text-[10px] text-forest/30 mt-1">Up to {CHAR_LIMITS.impactDescription} characters</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="impactMetrics">Target Metrics <span className="text-forest/30 font-normal">(optional)</span></label>
                          <CharCount cur={form.impactMetrics.length} max={CHAR_LIMITS.impactMetrics} />
                        </div>
                        <input type="text" id="impactMetrics" maxLength={CHAR_LIMITS.impactMetrics}
                          className="input-field" placeholder="e.g. 50k tons CO₂ sequestered annually by 2026"
                          value={form.impactMetrics} onChange={handleChange} />
                        <p className="text-[10px] text-forest/30 mt-1">Up to {CHAR_LIMITS.impactMetrics} characters</p>
                      </div>
                    </section>
                  )}

                  {/* ── Step 4 ── */}
                  {currentStep === 3 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Capital Deployment</h2>
                        <p className="text-sm text-forest/50 mt-1">The tactical fuel for your strategic vision.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style mb-1.5 block">Capital Requested</label>
                          <CapitalInput
                            amount={form.capitalRequested}
                            currency={capitalCurrency}
                            onAmountChange={v => {
                              setForm(p => ({ ...p, capitalRequested: v }));
                              applyResult("capitalRequested", validate("capitalRequested", v));
                            }}
                            onCurrencyChange={code => {
                              // Only accept codes from the allowlist
                              if (VALID_CURRENCY_CODES.has(code)) setCapitalCurrency(code);
                            }}
                            hasWarning={!!warns.capitalRequested}
                          />
                          <FieldWarn msg={warns.capitalRequested} />
                          <p className="text-[10px] text-forest/30 mt-1">
                            Currency auto-set from region · change freely
                          </p>
                        </div>

                        <div>
                          <label className="label-style mb-1.5 block">Planned Use Period</label>
                          <PeriodInput
                            value={periodValue} unit={periodUnit}
                            onValueChange={v => setPeriodValue(v)}
                            onUnitChange={u => setPeriodUnit(u)}
                            hasWarning={!!warns.fundingPeriod}
                          />
                          <FieldWarn msg={warns.fundingPeriod} />
                          {periodValue && (
                            <p className="text-[10px] text-forest/40 mt-1.5">= <span className="font-semibold text-forest/60">{periodValue} {periodUnit}</span></p>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="useOfFunds">Use of Funds</label>
                          <CharCount cur={form.useOfFunds.length} max={CHAR_LIMITS.useOfFunds} />
                        </div>
                        <textarea id="useOfFunds" rows={3} maxLength={CHAR_LIMITS.useOfFunds}
                          className={`input-field resize-none ${fieldCls("useOfFunds")}`}
                          placeholder="R&D, expansion into NA market, core hiring…"
                          value={form.useOfFunds} onChange={handleChange} />
                        <FieldWarn msg={warns.useOfFunds} />
                        <p className="text-[10px] text-forest/30 mt-1">Up to {CHAR_LIMITS.useOfFunds} characters</p>
                      </div>
                    </section>
                  )}

                  {/* ── Step 5 ── */}
                  {currentStep === 4 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">The Collective</h2>
                        <p className="text-sm text-forest/50 mt-1">Team and outreach materials.</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="pitchDeckUrl">Pitch Deck URL <span className="text-forest/30 font-normal">(optional)</span></label>
                          <CharCount cur={form.pitchDeckUrl.length} max={CHAR_LIMITS.pitchDeckUrl} />
                        </div>
                        <input type="url" id="pitchDeckUrl" maxLength={CHAR_LIMITS.pitchDeckUrl}
                          className={`input-field ${fieldCls("pitchDeckUrl")}`}
                          placeholder="https://drive.google.com/your-pitch-deck"
                          value={form.pitchDeckUrl} onChange={handleChange} />
                        <FieldError msg={errs.pitchDeckUrl} />
                        <FieldWarn  msg={warns.pitchDeckUrl} />
                        <FieldOk   msg={oks.pitchDeckUrl} />
                        <p className="text-xs text-forest/40 mt-2">Upload to Google Drive, Dropbox, or Notion and paste the shareable link here.</p>
                      </div>
                    </section>
                  )}

                  {/* Nav row */}
                  <div className="pt-6 border-t border-forest/10 flex items-center justify-between gap-3">
                    <button type="button" onClick={handleSaveProgress}
                      className="text-xs font-bold uppercase tracking-widest text-forest/40 hover:text-forest transition-colors flex items-center gap-1.5 py-2 flex-shrink-0">
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Save</span>
                    </button>
                    <div className="flex gap-2">
                      {currentStep > 0 && (
                        <button type="button" onClick={handlePrevious}
                          className="flex items-center gap-1.5 px-4 py-3 border border-forest/20 text-forest font-bold uppercase text-xs tracking-[0.15em] hover:bg-beige transition-colors rounded-lg">
                          <ChevronLeft className="w-3.5 h-3.5" />Back
                        </button>
                      )}
                      {currentStep < steps.length - 1 ? (
                        <button type="button" onClick={handleNext}
                          className="flex items-center gap-1.5 px-6 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.15em] hover:bg-forest/90 transition-colors rounded-lg shadow-sm shadow-forest/10">
                          Continue<ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                          className="flex items-center gap-2 px-6 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.15em] hover:bg-forest/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-forest/10">
                          {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Submitting…</> : "Submit Application"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile steps drawer */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-fade-in" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-left" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-forest/10 flex justify-between items-center">
              <h3 className="font-serif text-lg text-forest">All Steps</h3>
              <button onClick={() => setShowMobileMenu(false)} className="w-8 h-8 rounded-full bg-forest/5 flex items-center justify-center">
                <X className="w-4 h-4 text-forest" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto">
              {steps.map((step, index) => {
                const done  = index < currentStep;
                const curr  = index === currentStep;
                const avail = index <= currentStep;
                return (
                  <button key={step.num} onClick={() => avail && handleStepClick(index)} disabled={!avail}
                    className={`w-full text-left p-4 rounded-xl mb-1.5 transition-all flex items-center gap-3 ${curr ? "bg-forest text-white" : done ? "bg-forest/5 text-forest hover:bg-forest/10" : "opacity-30 cursor-not-allowed text-forest"}`}>
                    <span className="text-xl w-8 text-center flex-shrink-0">{step.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${curr ? "text-white/60" : "text-forest/40"}`}>{step.num} {done ? "✓" : ""}</p>
                      <p className="font-bold text-sm leading-tight">{step.title}</p>
                      <p className={`text-xs mt-0.5 ${curr ? "text-white/50" : "text-forest/40"}`}>{step.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="hidden lg:block"><Footer /></div>

      <style jsx>{`
        @keyframes fade-in    { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slide-left { from { transform: translateX(100%) } to { transform: translateX(0) } }
        .animate-fade-in    { animation: fade-in 0.2s ease-out; }
        .animate-slide-left { animation: slide-left 0.25s ease-out; }
        @media (max-width: 1023px) { .input-field { font-size: 16px !important; } }
      `}</style>
    </div>
  );
}