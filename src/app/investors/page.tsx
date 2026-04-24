"use client";

import { Footer } from "@/components/home/Footer";
import { Navigation } from "@/components/home/Navigation";
import {
  AlertCircle, CheckCircle, ChevronDown, ChevronLeft,
  ChevronRight, Eye, EyeOff, Loader2, Save, Search, X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from "libphonenumber-js";
import {
  INVESTOR_CHAR_LIMITS,
  INVESTOR_TYPE_VALUES,
  SECTOR_VALUES,
  STAGE_VALUES,
  GEO_VALUES,
} from "@/lib/investor/Investorschema ";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CountryData {
  code:     string;
  name:     string;
  flag:     string;
  dial:     string;
  currency: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const steps = [
  { num: "01", title: "Identity",        sub: "Name & Contact",       icon: "👤" },
  { num: "02", title: "Firm Profile",    sub: "Background & Focus",   icon: "🏢" },
  { num: "03", title: "Investment Lens", sub: "Preferences & Thesis", icon: "🔭" },
  { num: "04", title: "Ticket Size",     sub: "Capital Parameters",   icon: "💰" },
  { num: "05", title: "Review",          sub: "Confirm & Submit",     icon: "✅" },
];

const sectorOptions: { value: string; label: string }[] = [
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

const stageOptions: { value: string; label: string }[] = [
  { value: "IDEA",     label: "Idea / Pre-product" },
  { value: "PRE_SEED", label: "Pre-Seed / MVP" },
  { value: "SEED",     label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B+" },
  { value: "GROWTH",   label: "Growth" },
];

const geoOptions = [
  "North America", "South America", "Europe", "Middle East & Africa",
  "South Asia", "Southeast Asia", "East Asia", "Oceania", "Global",
];

const investorTypeOptions: { value: string; label: string }[] = [
  { value: "ANGEL",           label: "Angel Investor" },
  { value: "VENTURE_CAPITAL", label: "Venture Capital" },
  { value: "PRIVATE_EQUITY",  label: "Private Equity" },
  { value: "CORPORATE",       label: "Corporate / CVC" },
  { value: "FAMILY_OFFICE",   label: "Family Office" },
  { value: "ACCELERATOR",     label: "Accelerator / Incubator" },
];

const FREE_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", "icloud.com",
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

const VALID_CURRENCY_CODES = new Set(CURRENCIES.map(c => c.code));

const MAX_TICKET_BY_CURRENCY: Record<string, number> = {
  INR:     990_000_000,
  USD:     100_000_000,
  EUR:     100_000_000,
  GBP:     100_000_000,
  DEFAULT: 999_999_999,
};

const MIN_TICKET = 500;

// ─── Ticket formatting helpers ─────────────────────────────────────────────────

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
    const rest = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }
  return clamped.toLocaleString("en-US");
}

function parseTicketAmount(formatted: string): number {
  return Number(formatted.replace(/,/g, ""));
}

// ─── Password validation (mirrors API rules) ───────────────────────────────────

function validatePasswordValue(password: string): string | null {
  if (password.length < 8)             return "At least 8 characters required.";
  if (!/[a-z]/.test(password))         return "Needs a lowercase letter.";
  if (!/[0-9]/.test(password))         return "Needs a number.";
  if (!/[^A-Za-z0-9]/.test(password))  return "Needs a special character.";
  return null;
}

// ─── Micro-components ──────────────────────────────────────────────────────────

type VResult = { error?: string; warning?: string; success?: string };

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

// ─── Password strength meter ───────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ];
  const score = checks.filter(Boolean).length;
  const label = score <= 1 ? "Weak" : score <= 3 ? "Fair" : score === 4 ? "Good" : "Strong";
  const color = score <= 1 ? "bg-red-400" : score <= 3 ? "bg-amber-400" : score === 4 ? "bg-green-500" : "bg-green-600";
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : "bg-forest/10"}`} />
        ))}
      </div>
      <p className={`text-[10px] font-medium ${score <= 1 ? "text-red-500" : score <= 3 ? "text-amber-500" : "text-green-600"}`}>{label}</p>
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-2 cursor-help">
      <span className="w-5 h-5 rounded-full bg-forest/10 text-forest/50 text-[11px] font-bold flex items-center justify-center select-none hover:bg-forest/20 transition-colors">?</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-xl bg-forest text-white text-[11px] leading-relaxed px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl whitespace-normal text-left">
        {text}
      </span>
    </span>
  );
}

// ─── Field-level validation ────────────────────────────────────────────────────

function validate(
  id: string,
  value: string,
  ctx: { dialCountry?: string; currency?: string; confirmPassword?: string; password?: string } = {}
): VResult {
  switch (id) {
    case "name":
      if (!value.trim()) return { error: "Please enter your full name" };
      if (value.trim().length < 2) return { error: "At least 2 characters" };
      if (value.length > INVESTOR_CHAR_LIMITS.name) return { error: `Max ${INVESTOR_CHAR_LIMITS.name} characters` };
      if (!/^[A-Za-z\u00C0-\u017E\s'\-]+$/.test(value.trim()))
        return { error: "Only letters, spaces, hyphens and apostrophes" };
      return { success: "Looks good" };

    case "email": {
      if (!value.trim()) return { error: "Email is required" };
      if (value.length > INVESTOR_CHAR_LIMITS.email) return { error: "Email is too long" };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
        return { error: "Doesn't look valid — try name@company.com" };
      if (value.toLowerCase().endsWith(".con") || value.toLowerCase().endsWith(".cmo"))
        return { error: "Possible typo — did you mean .com?" };
      const domain = value.split("@")[1]?.toLowerCase();
      if (FREE_EMAIL_DOMAINS.includes(domain))
        return { warning: "A professional email builds more trust with startups" };
      return { success: "Valid email" };
    }

    case "password": {
      if (!value) return { error: "Password is required" };
      const err = validatePasswordValue(value);
      if (err) return { error: err };
      return { success: "Password looks strong" };
    }

    case "confirmPassword": {
      if (!value) return { error: "Please confirm your password" };
      if (value !== ctx.password) return { error: "Passwords do not match" };
      return { success: "Passwords match" };
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

    case "firmName":
      if (!value.trim()) return { warning: "Adding your firm or fund name increases credibility" };
      if (value.length > INVESTOR_CHAR_LIMITS.firmName) return { error: `Max ${INVESTOR_CHAR_LIMITS.firmName} characters` };
      return { success: "Looks good" };

    case "designation":
      if (!value.trim()) return { warning: "Your title helps startups understand your role" };
      if (value.length > INVESTOR_CHAR_LIMITS.designation) return { error: `Max ${INVESTOR_CHAR_LIMITS.designation} characters` };
      return {};

    case "investorType":
      if (!value) return { error: "Please select your investor type" };
      if (!(INVESTOR_TYPE_VALUES as readonly string[]).includes(value))
        return { error: "Please select a valid investor type" };
      return {};

    case "bio":
      if (value.length > INVESTOR_CHAR_LIMITS.bio) return { error: `Max ${INVESTOR_CHAR_LIMITS.bio} characters` };
      return {};

    case "websiteUrl":
      if (!value.trim()) return {};
      if (!value.trim().startsWith("https://")) return { error: "Must start with https://" };
      if (!/^https:\/\/.+\..+/.test(value.trim())) return { error: "Must be a valid URL — e.g. https://yourfirm.com" };
      if (value.length > INVESTOR_CHAR_LIMITS.websiteUrl) return { error: `Max ${INVESTOR_CHAR_LIMITS.websiteUrl} characters` };
      return { success: "Valid URL" };

    case "linkedinUrl":
      if (!value.trim()) return {};
      if (!value.trim().startsWith("https://")) return { error: "Must start with https://" };
      if (!value.includes("linkedin.com")) return { warning: "This doesn't look like a LinkedIn URL" };
      if (value.length > INVESTOR_CHAR_LIMITS.linkedinUrl) return { error: `Max ${INVESTOR_CHAR_LIMITS.linkedinUrl} characters` };
      return { success: "Valid LinkedIn profile" };

    case "investmentThesis":
      if (!value.trim()) return { warning: "A clear thesis attracts better-aligned founders" };
      if (value.trim().length > 30) return { success: "Great — founders will appreciate the clarity" };
      return {};

    case "ticketSizeMin":
    case "ticketSizeMax": {
      if (!value.trim()) return { warning: "Specify a ticket size for better matches" };
      const num = parseTicketAmount(value);
      const currency = ctx.currency ?? "USD";
      const maxVal = MAX_TICKET_BY_CURRENCY[currency] ?? MAX_TICKET_BY_CURRENCY.DEFAULT;
      if (num < MIN_TICKET) return { error: `Minimum is ${MIN_TICKET.toLocaleString()}` };
      if (num > maxVal) return { error: `Maximum is ${maxVal.toLocaleString()}` };
      return { success: `${value}` };
    }

    default:
      return {};
  }
}

// ─── Investor Type Dropdown ────────────────────────────────────────────────────

function InvestorTypeDropdown({
  value, onChange, hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = investorTypeOptions.find(o => o.value === value);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`input-field w-full flex items-center justify-between gap-2 cursor-pointer select-none text-left ${hasError ? "border-red-300 bg-red-50/30" : ""}`}>
        <span className={selected ? "text-forest text-sm font-medium" : "text-forest/35 text-sm"}>
          {selected ? selected.label : "Select Investor Type"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-forest/40 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-forest/12 rounded-xl shadow-2xl z-[100] overflow-hidden">
          <ul className="overflow-y-auto max-h-64 py-1.5">
            {investorTypeOptions.map(o => (
              <li key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === o.value ? "bg-forest text-white font-medium" : "text-forest hover:bg-beige/60"}`}>
                <span>{o.label}</span>
                {value === o.value && <CheckCircle className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Phone Country Dropdown ────────────────────────────────────────────────────

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
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); }
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
  }, [open, value, filtered]);

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
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)} onKeyDown={onTriggerKey} disabled={loading}
        className="input-field w-full flex items-center gap-2 pr-8 cursor-pointer select-none"
        style={{ fontSize: 13 }} aria-haspopup="listbox" aria-expanded={open}>
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-forest/40" />
          : selected
            ? (<>
                <Image src={selected.flag} alt={selected.name} width={20} height={14} style={{ width: 20, height: 14 }} className="object-cover rounded-sm flex-shrink-0" />
                <span className="font-medium text-forest/70">{selected.dial}</span>
              </>)
            : <span className="text-forest/40">+– Code</span>
        }
        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-forest/40 pointer-events-none transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-80 bg-white border border-forest/12 rounded-xl shadow-2xl z-[100] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-forest/8 bg-forest/2">
            <Search className="w-3.5 h-3.5 text-forest/30 flex-shrink-0" />
            <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search country or dial code…"
              className="flex-1 text-sm bg-transparent text-forest placeholder-forest/30 outline-none"
              onClick={e => e.stopPropagation()} />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-forest/30 hover:text-forest/60 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <ul ref={listRef} className="overflow-y-auto max-h-60" role="listbox">
            <li role="option" aria-selected={!value}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${!value ? "bg-forest/6 font-medium text-forest" : "text-forest/50 hover:bg-beige/60"}`}
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}>
              <span className="w-7 text-center">–</span>
              <span>No country code</span>
            </li>
            {filtered.map(c => (
              <li key={c.code} role="option" aria-selected={value === c.code}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${value === c.code ? "bg-forest text-white" : "text-forest hover:bg-beige/60"}`}
                onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }}>
                <Image src={c.flag} alt={c.name} width={20} height={14} style={{ width: 20, height: 14 }} className="object-cover rounded-sm flex-shrink-0" />
                <span className="flex-1 truncate">{c.name}</span>
                <span className={`text-xs tabular-nums font-medium ${value === c.code ? "text-white/70" : "text-forest/40"}`}>{c.dial}</span>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-4 text-sm text-forest/40 text-center">No results for &quot;{search}&quot;</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Multi-toggle chip group ───────────────────────────────────────────────────

function MultiToggle({ options, selected, onChange }: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(o => (
        <label key={o.value}
          className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-all ${selected.includes(o.value) ? "bg-forest text-white border-forest shadow-sm" : "bg-beige/50 border-forest/10 hover:bg-beige"}`}>
          <input type="checkbox" className="sr-only" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
          <span className={`text-xs font-bold uppercase tracking-widest ${selected.includes(o.value) ? "text-white" : "text-forest/70"}`}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Ticket Amount Input ──────────────────────────────────────────────────────

function TicketAmountInput({
  amount, currency, onAmountChange, onCurrencyChange,
  placeholder, hasWarning, hasError,
}: {
  amount: string;
  currency: string;
  onAmountChange: (v: string) => void;
  onCurrencyChange: (c: string) => void;
  placeholder: string;
  hasWarning?: boolean;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const curr = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];
  const maxVal = MAX_TICKET_BY_CURRENCY[currency] ?? MAX_TICKET_BY_CURRENCY.DEFAULT;
  const maxLabel = currency === "INR"
    ? `Max ₹${(maxVal / 10_000_000).toFixed(0)} Cr`
    : `Max ${(maxVal / 1_000_000).toFixed(0)}M`;

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

  function handleAmountChange(raw: string) {
    onAmountChange(formatTicketAmount(raw, currency));
  }

  function handleCurrencySelect(code: string) {
    onCurrencyChange(code);
    if (amount) onAmountChange(formatTicketAmount(amount, code));
    setOpen(false);
    setSearch("");
  }

  return (
    <div className={`flex border rounded-lg transition-colors bg-white ${
      hasError ? "border-red-300 bg-red-50/30" : hasWarning ? "border-amber-300" : "border-forest/15"
    }`}>
      <div className="relative flex-shrink-0 border-r border-forest/10" ref={ref}>
        <button type="button" onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 h-full py-2.5 text-sm font-semibold text-forest hover:bg-forest/4 transition-colors whitespace-nowrap rounded-l-[7px]">
          <span className="text-[15px] leading-none">{curr.symbol}</span>
          <span className="text-xs text-forest/55">{curr.code}</span>
          <ChevronDown className={`w-3 h-3 text-forest/35 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-forest/12 rounded-xl shadow-2xl z-[100] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-forest/8 bg-forest/2">
              <Search className="w-3.5 h-3.5 text-forest/30 flex-shrink-0" />
              <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="USD, Euro, Rupee…"
                className="flex-1 text-sm bg-transparent text-forest placeholder-forest/30 outline-none"
                onClick={e => e.stopPropagation()} />
            </div>
            <ul className="overflow-y-auto max-h-56">
              {filtered.map(c => (
                <li key={c.code}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${currency === c.code ? "bg-forest text-white" : "text-forest hover:bg-beige/60"}`}
                  onClick={() => handleCurrencySelect(c.code)}>
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
      <input type="text" inputMode="numeric"
        className="flex-1 px-3 py-2.5 text-sm text-forest bg-transparent outline-none placeholder-forest/30 min-w-0"
        placeholder={placeholder}
        value={amount}
        onChange={e => handleAmountChange(e.target.value)} />
      <span className="flex-shrink-0 self-center pr-3 text-[10px] text-forest/30 whitespace-nowrap">{maxLabel}</span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InvestorApplyPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [countries, setCountries] = useState<CountryData[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [dialCountry, setDialCountry] = useState("");
  const [countryAutoFilled, setCountryAutoFilled] = useState(false);

  const [ticketCurrency, setTicketCurrency] = useState("USD");

  const [errs,  setErrs]  = useState<Record<string, string>>({});
  const [warns, setWarns] = useState<Record<string, string>>({});
  const [oks,   setOks]   = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name:                 "",
    email:                "",
    password:             "",
    confirmPassword:      "",
    mobile:               "",
    firmName:             "",
    designation:          "",
    investorType:         "",
    bio:                  "",
    websiteUrl:           "",
    linkedinUrl:          "",
    country:              "",
    city:                 "",
    preferredSectors:     [] as string[],
    preferredStages:      [] as string[],
    preferredGeographies: [] as string[],
    impactFocused:        false,
    investmentThesis:     "",
    ticketSizeMin:        "",
    ticketSizeMax:        "",
  });

  // ── Load countries ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/countries")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: CountryData[]) => setCountries(data))
      .catch(() => {})
      .finally(() => setCountriesLoading(false));
  }, []);

  useEffect(() => { setIsClient(true); }, []);

  // ── Restore draft ───────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved =
        sessionStorage.getItem("vh-investor-apply-draft") ??
        localStorage.getItem("vh-investor-apply-draft");
      if (!saved) return;
      const p = JSON.parse(saved);
      setForm(prev => ({
        ...prev,
        firmName:             typeof p.firmName         === "string"  ? p.firmName             : prev.firmName,
        designation:          typeof p.designation      === "string"  ? p.designation           : prev.designation,
        investorType:         typeof p.investorType     === "string"  ? p.investorType          : prev.investorType,
        bio:                  typeof p.bio              === "string"  ? p.bio                   : prev.bio,
        websiteUrl:           typeof p.websiteUrl       === "string"  ? p.websiteUrl            : prev.websiteUrl,
        linkedinUrl:          typeof p.linkedinUrl      === "string"  ? p.linkedinUrl           : prev.linkedinUrl,
        country:              typeof p.country          === "string"  ? p.country               : prev.country,
        city:                 typeof p.city             === "string"  ? p.city                  : prev.city,
        investmentThesis:     typeof p.investmentThesis === "string"  ? p.investmentThesis      : prev.investmentThesis,
        ticketSizeMin:        typeof p.ticketSizeMin    === "string"  ? p.ticketSizeMin         : prev.ticketSizeMin,
        ticketSizeMax:        typeof p.ticketSizeMax    === "string"  ? p.ticketSizeMax         : prev.ticketSizeMax,
        preferredSectors:     Array.isArray(p.preferredSectors)     ? p.preferredSectors      : prev.preferredSectors,
        preferredStages:      Array.isArray(p.preferredStages)      ? p.preferredStages       : prev.preferredStages,
        preferredGeographies: Array.isArray(p.preferredGeographies) ? p.preferredGeographies  : prev.preferredGeographies,
        impactFocused:        typeof p.impactFocused    === "boolean" ? p.impactFocused         : prev.impactFocused,
        // NOTE: passwords are intentionally NOT restored from draft for security
      }));
      if (typeof p.dialCountry === "string" && p.dialCountry) setDialCountry(p.dialCountry);
      if (typeof p.ticketCurrency === "string" && VALID_CURRENCY_CODES.has(p.ticketCurrency))
        setTicketCurrency(p.ticketCurrency);
    } catch {}
  }, []);

  // ── Auto-detect country + currency from timezone ────────────────────────────
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
      if (found.currency && VALID_CURRENCY_CODES.has(found.currency))
        setTicketCurrency(found.currency);
      setCountryAutoFilled(true);
    } catch {}
  }, [isClient, countriesLoading, countries, dialCountry]);

  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showMobileMenu]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { id, value } = e.target;
    const limit = INVESTOR_CHAR_LIMITS[id as keyof typeof INVESTOR_CHAR_LIMITS];
    const v = typeof limit === "number" ? value.slice(0, limit) : value;
    setForm(prev => ({ ...prev, [id]: v }));
    setSubmitError(null);

    // Special cross-field validation for confirm password
    if (id === "password") {
      applyResult(id, validate(id, v));
      // Re-validate confirm if already filled
      if (form.confirmPassword) {
        applyResult("confirmPassword", validate("confirmPassword", form.confirmPassword, { password: v }));
      }
    } else if (id === "confirmPassword") {
      applyResult(id, validate(id, v, { password: form.password }));
    } else {
      applyResult(id, validate(id, v, { dialCountry, currency: ticketCurrency }));
    }
  }

  function handleDialChange(cc: string) {
    setDialCountry(cc);
    if (cc) {
      const found = countries.find(c => c.code === cc);
      if (found) {
        setForm(prev => ({ ...prev, country: found.name }));
        if (found.currency && VALID_CURRENCY_CODES.has(found.currency)) {
          const newCurrency = found.currency;
          setTicketCurrency(newCurrency);
          if (form.ticketSizeMin) {
            const fmt = formatTicketAmount(form.ticketSizeMin, newCurrency);
            setForm(prev => ({ ...prev, ticketSizeMin: fmt }));
            applyResult("ticketSizeMin", validate("ticketSizeMin", fmt, { currency: newCurrency }));
          }
          if (form.ticketSizeMax) {
            const fmt = formatTicketAmount(form.ticketSizeMax, newCurrency);
            setForm(prev => ({ ...prev, ticketSizeMax: fmt }));
            applyResult("ticketSizeMax", validate("ticketSizeMax", fmt, { currency: newCurrency }));
          }
        }
        setCountryAutoFilled(true);
        applyResult("country", {});
      }
    } else {
      setCountryAutoFilled(false);
    }
    if (form.mobile.trim()) applyResult("mobile", validate("mobile", form.mobile, { dialCountry: cc }));
  }

  function handleCurrencyChange(code: string) {
    if (!VALID_CURRENCY_CODES.has(code)) return;
    setTicketCurrency(code);
    if (form.ticketSizeMin) {
      const fmt = formatTicketAmount(form.ticketSizeMin, code);
      setForm(prev => ({ ...prev, ticketSizeMin: fmt }));
      applyResult("ticketSizeMin", validate("ticketSizeMin", fmt, { currency: code }));
    }
    if (form.ticketSizeMax) {
      const fmt = formatTicketAmount(form.ticketSizeMax, code);
      setForm(prev => ({ ...prev, ticketSizeMax: fmt }));
      applyResult("ticketSizeMax", validate("ticketSizeMax", fmt, { currency: code }));
    }
  }

  // ── Step field maps — now includes password fields in step 0 ────────────────
  const STEP_FIELDS: Record<number, string[]> = {
    0: ["name", "email", "password", "confirmPassword", "mobile"],
    1: ["investorType", "firmName", "designation", "websiteUrl", "linkedinUrl"],
    2: ["investmentThesis"],
    3: ["ticketSizeMin", "ticketSizeMax"],
    4: [],
  };

  function getStringField(id: string): string {
    const v = form[id as keyof typeof form];
    return typeof v === "string" ? v : "";
  }

  function validateStep(step: number): boolean {
    let ok = true;
    if (step === 0) {
      // Cross-field: confirm password matches
      const pwErr = validatePasswordValue(form.password);
      if (pwErr) { applyResult("password", { error: pwErr }); ok = false; }
      else applyResult("password", { success: "Password looks strong" });
      if (form.confirmPassword !== form.password) {
        applyResult("confirmPassword", { error: "Passwords do not match" });
        ok = false;
      } else if (form.confirmPassword) {
        applyResult("confirmPassword", { success: "Passwords match" });
      } else {
        applyResult("confirmPassword", { error: "Please confirm your password" });
        ok = false;
      }
    }
    if (step === 3) {
      const min = parseTicketAmount(form.ticketSizeMin);
      const max = parseTicketAmount(form.ticketSizeMax);
      if (form.ticketSizeMin && form.ticketSizeMax && !isNaN(min) && !isNaN(max) && min > max) {
        applyResult("ticketSizeMin", { error: "Minimum cannot exceed maximum" });
        ok = false;
      }
    }
    for (const id of (STEP_FIELDS[step] ?? [])) {
      // Skip password fields here — handled above with cross-field logic
      if (step === 0 && (id === "password" || id === "confirmPassword")) continue;
      const v = getStringField(id);
      const r = validate(id, v, { dialCountry, currency: ticketCurrency });
      applyResult(id, r);
      if (r.error) ok = false;
    }
    return ok;
  }

  function validateAll(): boolean {
    let ok = true;
    for (let step = 0; step < steps.length; step++) {
      if (!validateStep(step)) ok = false;
    }
    return ok;
  }

  // Passwords intentionally excluded from draft
  const saveDraft = () => {
    try {
      const payload = {
        firmName: form.firmName, designation: form.designation,
        investorType: form.investorType, bio: form.bio,
        websiteUrl: form.websiteUrl, linkedinUrl: form.linkedinUrl,
        country: form.country, city: form.city,
        investmentThesis: form.investmentThesis,
        ticketSizeMin: form.ticketSizeMin, ticketSizeMax: form.ticketSizeMax,
        preferredSectors: form.preferredSectors, preferredStages: form.preferredStages,
        preferredGeographies: form.preferredGeographies, impactFocused: form.impactFocused,
        dialCountry, ticketCurrency,
      };
      const s = JSON.stringify(payload);
      sessionStorage.setItem("vh-investor-apply-draft", s);
      localStorage.setItem("vh-investor-apply-draft", s);
    } catch {}
  };

  const handleNext = () => {
    if (validateStep(currentStep)) { saveDraft(); setCurrentStep(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };
  const handlePrevious = () => {
    if (currentStep > 0) { setCurrentStep(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };
  const handleStepClick = (i: number) => {
    if (i <= currentStep || validateStep(currentStep)) {
      setCurrentStep(i); setShowMobileMenu(false); window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (!validateAll()) { setSubmitError("Some required fields are missing or invalid. Please review each step."); return; }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      let formattedPhone: string | undefined;
      if (form.mobile.trim() && dialCountry) {
        try { formattedPhone = parsePhoneNumber(form.mobile, dialCountry as CountryCode).formatInternational(); }
        catch { formattedPhone = form.mobile; }
      }
      const safeCurrency = VALID_CURRENCY_CODES.has(ticketCurrency) ? ticketCurrency : "USD";

      // ── Updated: POST to the public investor creation route ──
      const res = await fetch("/api/investors/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                 form.name,
          email:                form.email,
          password:             form.password,          // ← now sent from user
          mobile:               formattedPhone || undefined,
          firmName:             form.firmName || undefined,
          designation:          form.designation || undefined,
          investorType:         form.investorType || undefined,
          bio:                  form.bio || undefined,
          websiteUrl:           form.websiteUrl || undefined,
          linkedinUrl:          form.linkedinUrl || undefined,
          country:              form.country || undefined,
          city:                 form.city || undefined,
          preferredSectors:     form.preferredSectors,
          preferredStages:      form.preferredStages,
          preferredGeographies: form.preferredGeographies,
          impactFocused:        form.impactFocused,
          investmentThesis:     form.investmentThesis || undefined,
          ticketSizeMin:        form.ticketSizeMin || undefined,
          ticketSizeMax:        form.ticketSizeMax || undefined,
          ticketCurrency:       safeCurrency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
        if (res.status === 409) throw new Error("An account with this email already exists.");
        if (res.status === 422 && data.errors) {
          const msgs = Object.values(data.errors as Record<string, string>).join("\n");
          throw new Error(msgs);
        }
        throw new Error(data.message || "Something went wrong. Please try again.");
      }

      try {
        sessionStorage.removeItem("vh-investor-apply-draft");
        localStorage.removeItem("vh-investor-apply-draft");
      } catch {}

      router.push("/investors/success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setIsSubmitting(false); }
  };

  const progress = Math.round(((currentStep + 1) / steps.length) * 100);
  const selectedCountry = countries.find(c => c.code === dialCountry);
  const currObj = CURRENCIES.find(c => c.code === ticketCurrency) ?? CURRENCIES[0];

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
              <span className="text-forest/40 font-bold uppercase tracking-[0.4em] text-[10px] block mb-4">Investor Registration</span>
              <h1 className="font-serif text-5xl lg:text-6xl text-forest mb-8 leading-tight">Back the <span className="italic">builders.</span></h1>
              <p className="text-forest/70 text-lg leading-relaxed mb-12 max-w-sm">Join VentureHub's curated investor community. Create your account and start connecting with founders today.</p>
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
              <h1 className="font-serif text-3xl text-forest leading-tight">Back the <span className="italic">builders.</span></h1>
              <p className="text-forest/60 text-sm mt-1.5 leading-relaxed">Join VentureHub's investor community.</p>
            </div>

            {/* Form */}
            <div className="lg:col-span-8">
              <div className="bg-white/60 backdrop-blur-sm border border-forest/5 shadow-lg rounded-2xl lg:rounded-none overflow-hidden">

                {submitError && (
                  <div className="mx-4 sm:mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-700 text-sm font-medium">Submission failed</p>
                      <p className="text-red-600 text-xs mt-0.5 whitespace-pre-line">{submitError}</p>
                    </div>
                  </div>
                )}

                <form className="p-4 sm:p-8 lg:p-12 space-y-8 lg:space-y-12" onSubmit={e => e.preventDefault()}>

                  {/* ── Step 1: Identity ── */}
                  {currentStep === 0 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Identity</h2>
                        <p className="text-sm text-forest/50 mt-1">Tell us who you are and create your account credentials.</p>
                      </div>

                      {/* Name */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="name">Full Name <span className="text-red-400">*</span></label>
                          <CharCount cur={form.name.length} max={INVESTOR_CHAR_LIMITS.name} />
                        </div>
                        <input type="text" id="name" autoComplete="name" maxLength={INVESTOR_CHAR_LIMITS.name}
                          className={`input-field ${fieldCls("name")}`} placeholder="Jordan Wei" value={form.name} onChange={handleChange} />
                        <FieldError msg={errs.name} /><FieldOk msg={oks.name} />
                        <p className="text-[10px] text-forest/30 mt-1">Letters, spaces, hyphens, apostrophes · 2–{INVESTOR_CHAR_LIMITS.name} chars</p>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="label-style" htmlFor="email">Email Address <span className="text-red-400">*</span></label>
                        <input type="email" id="email" autoComplete="email"
                          className={`input-field ${fieldCls("email")}`} placeholder="jordan@meridianvc.com" value={form.email} onChange={handleChange} />
                        <FieldError msg={errs.email} /><FieldWarn msg={warns.email} /><FieldOk msg={oks.email} />
                        <p className="text-[10px] text-forest/30 mt-1">This will be your login email address.</p>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="label-style" htmlFor="password">Password <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            autoComplete="new-password"
                            className={`input-field pr-10 ${fieldCls("password")}`}
                            placeholder="Create a strong password"
                            value={form.password}
                            onChange={handleChange}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/30 hover:text-forest/60 transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <PasswordStrength password={form.password} />
                        <FieldError msg={errs.password} /><FieldOk msg={oks.password} />
                        <p className="text-[10px] text-forest/30 mt-1">Min 8 chars · lowercase · number · special character</p>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="label-style" htmlFor="confirmPassword">Confirm Password <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            autoComplete="new-password"
                            className={`input-field pr-10 ${fieldCls("confirmPassword")}`}
                            placeholder="Repeat your password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/30 hover:text-forest/60 transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <FieldError msg={errs.confirmPassword} /><FieldOk msg={oks.confirmPassword} />
                      </div>

                      {/* Mobile */}
                      <div>
                        <label className="label-style mb-1 block">Mobile <span className="text-forest/30 font-normal">(optional)</span></label>
                        <div className="grid grid-cols-2 gap-2">
                          <PhoneCountryDropdown value={dialCountry} onChange={handleDialChange} countries={countries} loading={countriesLoading} />
                          <input type="tel" id="mobile" autoComplete="tel-national"
                            className={`input-field ${fieldCls("mobile")}`}
                            placeholder={dialCountry === "IN" ? "98765 43210" : dialCountry === "US" ? "(555) 123-4567" : dialCountry === "GB" ? "07700 900123" : "Enter number"}
                            value={form.mobile} onChange={handleChange} />
                        </div>
                        <FieldError msg={errs.mobile} /><FieldWarn msg={warns.mobile} /><FieldOk msg={oks.mobile} />
                        {countryAutoFilled && dialCountry && selectedCountry && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <Image src={selectedCountry.flag} alt={selectedCountry.name} width={16} height={12} style={{ width: 16, height: 12 }} className="object-cover rounded-sm" />
                            <p className="text-[10px] text-forest/50">
                              Auto-detected: <span className="font-medium text-forest/70">{selectedCountry.name}</span>
                              {" · "}ticket currency set to <span className="font-medium text-forest/70">{ticketCurrency}</span>
                            </p>
                          </div>
                        )}
                        <p className="text-[10px] text-forest/30 mt-1">Validated via libphonenumber · stored in E.164 format</p>
                      </div>
                    </section>
                  )}

                  {/* ── Step 2: Firm Profile ── */}
                  {currentStep === 1 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Firm Profile</h2>
                        <p className="text-sm text-forest/50 mt-1">Tell founders who you are and what you represent.</p>
                      </div>
                      <div>
                        <label className="label-style mb-1 block">Investor Type <span className="text-red-400">*</span></label>
                        <InvestorTypeDropdown value={form.investorType}
                          onChange={v => { setForm(prev => ({ ...prev, investorType: v })); applyResult("investorType", validate("investorType", v)); }}
                          hasError={!!errs.investorType} />
                        <FieldError msg={errs.investorType} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="label-style" htmlFor="firmName">Firm / Fund Name <span className="text-forest/30 font-normal">(optional)</span></label>
                            <CharCount cur={form.firmName.length} max={INVESTOR_CHAR_LIMITS.firmName} />
                          </div>
                          <input type="text" id="firmName" maxLength={INVESTOR_CHAR_LIMITS.firmName}
                            className={`input-field ${fieldCls("firmName")}`} placeholder="Meridian Ventures" value={form.firmName} onChange={handleChange} />
                          <FieldWarn msg={warns.firmName} /><FieldOk msg={oks.firmName} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="label-style" htmlFor="designation">Your Title <span className="text-forest/30 font-normal">(optional)</span></label>
                            <CharCount cur={form.designation.length} max={INVESTOR_CHAR_LIMITS.designation} />
                          </div>
                          <input type="text" id="designation" maxLength={INVESTOR_CHAR_LIMITS.designation}
                            className={`input-field ${fieldCls("designation")}`} placeholder="Partner, Managing Director…" value={form.designation} onChange={handleChange} />
                          <FieldWarn msg={warns.designation} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="bio">Short Bio <span className="text-forest/30 font-normal">(optional)</span></label>
                          <CharCount cur={form.bio.length} max={INVESTOR_CHAR_LIMITS.bio} />
                        </div>
                        <textarea id="bio" rows={3} maxLength={INVESTOR_CHAR_LIMITS.bio}
                          className={`input-field resize-none ${fieldCls("bio")}`}
                          placeholder="A few sentences about your investment background and philosophy…" value={form.bio} onChange={handleChange} />
                        <FieldError msg={errs.bio} />
                        <p className="text-[10px] text-forest/30 mt-1">Up to {INVESTOR_CHAR_LIMITS.bio} characters</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="label-style" htmlFor="country">Country <span className="text-forest/30 font-normal">(optional)</span></label>
                            <CharCount cur={form.country.length} max={INVESTOR_CHAR_LIMITS.country} />
                          </div>
                          <input type="text" id="country" maxLength={INVESTOR_CHAR_LIMITS.country} className="input-field"
                            placeholder="United States" value={form.country} onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))} />
                          {countryAutoFilled && form.country && (
                            <div className="flex items-center gap-1 mt-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <p className="text-[10px] text-forest/40">Auto-filled from phone country</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="label-style" htmlFor="city">City <span className="text-forest/30 font-normal">(optional)</span></label>
                            <CharCount cur={form.city.length} max={INVESTOR_CHAR_LIMITS.city} />
                          </div>
                          <input type="text" id="city" maxLength={INVESTOR_CHAR_LIMITS.city} className="input-field"
                            placeholder="San Francisco" value={form.city} onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="label-style" htmlFor="websiteUrl">Website <span className="text-forest/30 font-normal">(optional)</span></label>
                            <CharCount cur={form.websiteUrl.length} max={INVESTOR_CHAR_LIMITS.websiteUrl} />
                          </div>
                          <input type="url" id="websiteUrl" maxLength={INVESTOR_CHAR_LIMITS.websiteUrl}
                            className={`input-field ${fieldCls("websiteUrl")}`} placeholder="https://meridianvc.com" value={form.websiteUrl} onChange={handleChange} />
                          <FieldError msg={errs.websiteUrl} /><FieldOk msg={oks.websiteUrl} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="label-style" htmlFor="linkedinUrl">LinkedIn <span className="text-forest/30 font-normal">(optional)</span></label>
                            <CharCount cur={form.linkedinUrl.length} max={INVESTOR_CHAR_LIMITS.linkedinUrl} />
                          </div>
                          <input type="url" id="linkedinUrl" maxLength={INVESTOR_CHAR_LIMITS.linkedinUrl}
                            className={`input-field ${fieldCls("linkedinUrl")}`} placeholder="https://linkedin.com/in/jordan-wei" value={form.linkedinUrl} onChange={handleChange} />
                          <FieldError msg={errs.linkedinUrl} /><FieldWarn msg={warns.linkedinUrl} /><FieldOk msg={oks.linkedinUrl} />
                          {form.linkedinUrl && oks.linkedinUrl && (
                            <a href={form.linkedinUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors">
                              Open profile ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── Step 3: Investment Lens ── */}
                  {currentStep === 2 && (
                    <section className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Investment Lens</h2>
                        <p className="text-sm text-forest/50 mt-1">Define your focus — we'll surface the right opportunities.</p>
                      </div>
                      <div>
                        <label className="label-style">Preferred Sectors</label>
                        <MultiToggle options={sectorOptions} selected={form.preferredSectors} onChange={v => setForm(prev => ({ ...prev, preferredSectors: v }))} />
                      </div>
                      <div>
                        <label className="label-style">Preferred Stages</label>
                        <MultiToggle options={stageOptions} selected={form.preferredStages} onChange={v => setForm(prev => ({ ...prev, preferredStages: v }))} />
                      </div>
                      <div>
                        <label className="label-style">Preferred Geographies</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {geoOptions.map(g => (
                            <label key={g}
                              className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-all ${form.preferredGeographies.includes(g) ? "bg-forest text-white border-forest shadow-sm" : "bg-beige/50 border-forest/10 hover:bg-beige"}`}>
                              <input type="checkbox" className="sr-only" checked={form.preferredGeographies.includes(g)}
                                onChange={() => {
                                  const curr = form.preferredGeographies;
                                  setForm(prev => ({ ...prev, preferredGeographies: curr.includes(g) ? curr.filter(x => x !== g) : [...curr, g] }));
                                }} />
                              <span className={`text-xs font-bold uppercase tracking-widest ${form.preferredGeographies.includes(g) ? "text-white" : "text-forest/70"}`}>{g}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="investmentThesis">Investment Thesis <span className="text-forest/30 font-normal">(optional)</span></label>
                          <CharCount cur={form.investmentThesis.length} max={INVESTOR_CHAR_LIMITS.investmentThesis} />
                        </div>
                        <textarea id="investmentThesis" rows={4} maxLength={INVESTOR_CHAR_LIMITS.investmentThesis}
                          className={`input-field resize-none ${fieldCls("investmentThesis")}`}
                          placeholder="Describe the kind of ventures that excite you most…" value={form.investmentThesis} onChange={handleChange} />
                        <FieldWarn msg={warns.investmentThesis} /><FieldOk msg={oks.investmentThesis} />
                        <p className="text-[10px] text-forest/30 mt-1">Up to {INVESTOR_CHAR_LIMITS.investmentThesis} characters</p>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-beige/50 rounded-xl border border-forest/8">
                        <button type="button" role="switch" aria-checked={form.impactFocused}
                          onClick={() => setForm(prev => ({ ...prev, impactFocused: !prev.impactFocused }))}
                          className={`w-11 h-6 rounded-full transition-all flex-shrink-0 relative ${form.impactFocused ? "bg-forest" : "bg-forest/20"}`}>
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.impactFocused ? "left-[22px]" : "left-0.5"}`} />
                        </button>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-forest">Impact-focused investor</p>
                          <p className="text-[10px] text-forest/50 mt-0.5">Prioritise companies with measurable social or environmental outcomes</p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── Step 4: Ticket Size ── */}
                  {currentStep === 3 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest flex items-center">
                          Ticket Size
                          <Tooltip text={`Enter your minimum and maximum investment per startup in ${ticketCurrency}. Currency is auto-set from your phone country — you can change it freely using the selector on each field. Used for founder matching only, never shown publicly.`} />
                        </h2>
                        <p className="text-sm text-forest/50 mt-1">Set your capital deployment parameters.</p>
                      </div>
                      {countryAutoFilled && (
                        <div className="flex items-center gap-2 p-3 bg-forest/5 rounded-xl border border-forest/8">
                          <CheckCircle className="w-3.5 h-3.5 text-forest/40 flex-shrink-0" />
                          <p className="text-[11px] text-forest/60">
                            Currency auto-set to <span className="font-semibold text-forest">{ticketCurrency} ({currObj.symbol})</span> from your phone country · change freely via the selector
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style mb-1.5 block">Minimum Ticket</label>
                          <TicketAmountInput
                            amount={form.ticketSizeMin}
                            currency={ticketCurrency}
                            onAmountChange={v => {
                              setForm(prev => ({ ...prev, ticketSizeMin: v }));
                              const num = parseTicketAmount(v);
                              if (!v) { applyResult("ticketSizeMin", { warning: "Specify a ticket size for better matches" }); }
                              else if (num < MIN_TICKET) { applyResult("ticketSizeMin", { error: `Minimum is ${MIN_TICKET.toLocaleString()}` }); }
                              else {
                                const maxNum = parseTicketAmount(form.ticketSizeMax);
                                if (form.ticketSizeMax && !isNaN(maxNum) && num > maxNum) { applyResult("ticketSizeMin", { error: "Minimum cannot exceed maximum" }); }
                                else { applyResult("ticketSizeMin", { success: `${currObj.symbol} ${v}` }); }
                              }
                            }}
                            onCurrencyChange={handleCurrencyChange}
                            placeholder={ticketCurrency === "INR" ? "5,000" : "5,000"}
                            hasWarning={!!warns.ticketSizeMin}
                            hasError={!!errs.ticketSizeMin}
                          />
                          <FieldError msg={errs.ticketSizeMin} /><FieldWarn msg={warns.ticketSizeMin} /><FieldOk msg={oks.ticketSizeMin} />
                        </div>
                        <div>
                          <label className="label-style mb-1.5 block">Maximum Ticket</label>
                          <TicketAmountInput
                            amount={form.ticketSizeMax}
                            currency={ticketCurrency}
                            onAmountChange={v => {
                              setForm(prev => ({ ...prev, ticketSizeMax: v }));
                              const num = parseTicketAmount(v);
                              if (!v) { applyResult("ticketSizeMax", { warning: "Specify a ticket size for better matches" }); }
                              else if (num < MIN_TICKET) { applyResult("ticketSizeMax", { error: `Minimum is ${MIN_TICKET.toLocaleString()}` }); }
                              else {
                                const minNum = parseTicketAmount(form.ticketSizeMin);
                                if (form.ticketSizeMin && !isNaN(minNum) && num < minNum) { applyResult("ticketSizeMax", { error: "Maximum cannot be less than minimum" }); }
                                else { applyResult("ticketSizeMax", { success: `${currObj.symbol} ${v}` }); }
                              }
                            }}
                            onCurrencyChange={handleCurrencyChange}
                            placeholder={ticketCurrency === "INR" ? "50,00,000" : "500,000"}
                            hasWarning={!!warns.ticketSizeMax}
                            hasError={!!errs.ticketSizeMax}
                          />
                          <FieldError msg={errs.ticketSizeMax} /><FieldWarn msg={warns.ticketSizeMax} /><FieldOk msg={oks.ticketSizeMax} />
                        </div>
                      </div>
                      {form.ticketSizeMin && form.ticketSizeMax && !errs.ticketSizeMin && !errs.ticketSizeMax && (
                        <p className="text-[10px] text-forest/40">
                          Range: <span className="font-semibold text-forest/60">{currObj.symbol}{form.ticketSizeMin} – {currObj.symbol}{form.ticketSizeMax} {ticketCurrency}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-forest/30">Used for matching only — not displayed publicly.</p>
                    </section>
                  )}

                  {/* ── Step 5: Review ── */}
                  {currentStep === 4 && (
                    <section className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Review & Submit</h2>
                        <p className="text-sm text-forest/50 mt-1">Confirm your details before creating your account.</p>
                      </div>
                      <div className="bg-beige/50 rounded-xl p-6 space-y-4 border border-forest/8">
                        {([
                          { label: "Name",          value: form.name,          isLink: false },
                          { label: "Email",         value: form.email,         isLink: false },
                          { label: "Password",      value: "••••••••",         isLink: false },
                          { label: "Mobile",        value: form.mobile || "—", isLink: false },
                          { label: "Investor type", value: investorTypeOptions.find(o => o.value === form.investorType)?.label || "—", isLink: false },
                          { label: "Firm",          value: form.firmName || "—",    isLink: false },
                          { label: "Title",         value: form.designation || "—", isLink: false },
                          { label: "LinkedIn",      value: form.linkedinUrl || "—", isLink: true  },
                          { label: "Location",      value: [form.city, form.country].filter(Boolean).join(", ") || "—", isLink: false },
                          { label: "Sectors",       value: form.preferredSectors.length ? form.preferredSectors.map(v => sectorOptions.find(o => o.value === v)?.label).join(", ") : "—", isLink: false },
                          { label: "Stages",        value: form.preferredStages.length ? form.preferredStages.map(v => stageOptions.find(o => o.value === v)?.label).join(", ") : "—", isLink: false },
                          { label: "Geographies",   value: form.preferredGeographies.join(", ") || "—", isLink: false },
                          { label: "Ticket range",  value: form.ticketSizeMin && form.ticketSizeMax ? `${currObj.symbol}${form.ticketSizeMin} – ${currObj.symbol}${form.ticketSizeMax} ${ticketCurrency}` : "—", isLink: false },
                          { label: "Impact focus",  value: form.impactFocused ? "Yes" : "No", isLink: false },
                        ] as { label: string; value: string; isLink: boolean }[]).map(({ label, value, isLink }) => (
                          <div key={label} className="flex gap-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-forest/40 w-28 flex-shrink-0 pt-0.5">{label}</span>
                            {isLink && value !== "—" ? (
                              <a href={value} target="_blank" rel="noopener noreferrer"
                                className="text-sm text-blue-600 underline underline-offset-2 hover:text-blue-800 break-words transition-colors">{value}</a>
                            ) : (
                              <span className="text-sm text-forest/80 break-words">{value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 leading-relaxed">Your investor account will be created immediately. You can sign in right away using the email and password you set above.</p>
                      </div>
                      <p className="text-xs text-forest/40 leading-relaxed">By submitting you agree to VentureHub's Terms of Service and Privacy Policy.</p>
                    </section>
                  )}

                  {/* ── Navigation row ── */}
                  <div className="pt-6 border-t border-forest/10 flex items-center justify-between gap-3">
                    <button type="button" onClick={handleSaveProgress}
                      className="text-xs font-bold uppercase tracking-widest text-forest/40 hover:text-forest transition-colors flex items-center gap-1.5 py-2 flex-shrink-0">
                      <Save className="w-3.5 h-3.5" /><span className="hidden sm:inline">Save</span>
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
                          {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Creating account…</> : "Create Account"}
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