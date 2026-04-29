"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronRight, ChevronLeft, Save, Loader2, AlertCircle,
  CheckCircle, Briefcase, Users, Sparkles, ChevronDown, Search, X,
} from "lucide-react";
import { Navigation } from "@/components/home/Navigation";
import { Footer } from "@/components/home/Footer";
import { useSession } from "next-auth/react";
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from "libphonenumber-js";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CountryData {
  code:     string;
  name:     string;
  flag:     string;
  dial:     string;
  currency: string;
}

type VResult = { error?: string; warning?: string; success?: string };

interface FormData {
  fullName:          string;
  email:             string;
  mobile:            string;
  linkedinUrl:       string;
  currentRole:       string;
  company:           string;
  yearsOfExperience: string;
  domains:           string[];
  bio:               string;
}

type StringField = Exclude<keyof FormData, "domains">;

function getStr(form: FormData, id: string): string {
  return (form as unknown as Record<string, string>)[id] ?? "";
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CHAR_LIMITS = {
  fullName:          60,
  email:             120,
  mobile:            20,
  linkedinUrl:       200,
  currentRole:       80,
  company:           80,
  yearsOfExperience: 3,
  bio:               1200,
};

const DOMAIN_OPTIONS = [
  "Product Strategy", "Growth & Marketing", "Fundraising", "Sales & GTM",
  "Engineering & Tech", "AI/ML", "Finance & Accounting", "Legal & Compliance",
  "Operations & Scaling", "HR & Culture", "Design & UX", "Climate & Impact",
  "Healthtech", "Edtech", "Deeptech", "Fintech",
];

const steps = [
  { num: "01", title: "Your Identity",   sub: "Personal background",    icon: "👤" },
  { num: "02", title: "Your Expertise",  sub: "Role & experience",      icon: "🧠" },
  { num: "03", title: "Your Domains",    sub: "Areas you mentor in",    icon: "🎯" },
  { num: "04", title: "Your Story",      sub: "Bio & motivation",       icon: "✍️" },
];

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

// ─── Required fields per step ──────────────────────────────────────────────────

const REQUIRED_FIELDS: Record<number, string[]> = {
  0: ["fullName", "email"],
  1: ["currentRole", "company", "yearsOfExperience"],
  2: [],
  3: ["bio"],
};

const REQUIRED_FIELD_LABELS: Record<string, string> = {
  fullName:          "Full Name",
  email:             "Email",
  currentRole:       "Current Role",
  company:           "Company / Organisation",
  yearsOfExperience: "Years of Experience",
  bio:               "Bio",
};

const STEP_FIELDS: Record<number, string[]> = {
  0: ["fullName", "email", "mobile", "linkedinUrl"],
  1: ["currentRole", "company", "yearsOfExperience"],
  2: ["domains"],
  3: ["bio"],
};

// ─── Validation ────────────────────────────────────────────────────────────────

function validate(id: string, value: string, ctx: { dialCountry?: string; domains?: string[] } = {}): VResult {
  switch (id) {
    case "fullName":
      if (!value.trim()) return { warning: "Full name is required to proceed" };
      if (value.trim().length < 2) return { error: "At least 2 characters" };
      if (value.length > CHAR_LIMITS.fullName) return { error: `Max ${CHAR_LIMITS.fullName} characters` };
      if (!/^[A-Za-z\u00C0-\u017E\s'\-]+$/.test(value.trim()))
        return { error: "Only letters, spaces, hyphens and apostrophes" };
      return { success: "Looks good" };

    case "email": {
      if (!value.trim()) return { warning: "Email address is required" };
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

    case "linkedinUrl": {
      if (!value.trim()) return { warning: "A LinkedIn profile builds trust with the review team" };
      if (!/^https?:\/\/(www\.)?linkedin\.com\/in\//.test(value.trim()))
        return { error: "Must be a LinkedIn profile URL (linkedin.com/in/…)" };
      if (value.length > CHAR_LIMITS.linkedinUrl) return { error: `Max ${CHAR_LIMITS.linkedinUrl} characters` };
      return { success: "Valid LinkedIn URL" };
    }

    case "currentRole":
      if (!value.trim()) return { warning: "Please enter your current role" };
      if (value.trim().length < 2) return { error: "At least 2 characters" };
      if (value.length > CHAR_LIMITS.currentRole) return { error: `Max ${CHAR_LIMITS.currentRole} characters` };
      return { success: "Looks good" };

    case "company":
      if (!value.trim()) return { warning: "Please enter your company or organisation" };
      if (value.trim().length < 2) return { error: "At least 2 characters" };
      if (value.length > CHAR_LIMITS.company) return { error: `Max ${CHAR_LIMITS.company} characters` };
      return { success: "Looks good" };

    case "yearsOfExperience": {
      if (!value.trim()) return { warning: "Required" };
      const yoe = parseInt(value);
      if (isNaN(yoe) || yoe < 1) return { error: "Must be at least 1 year" };
      if (yoe > 60) return { error: "Please enter a realistic value" };
      return { success: `${yoe} year${yoe !== 1 ? "s" : ""} — great` };
    }

    case "domains": {
      const count = ctx.domains?.length ?? 0;
      if (count === 0) return { error: "Select at least one domain you mentor in" };
      if (count < 2) return { warning: "Selecting 2–4 domains gives startups more ways to find you" };
      return { success: `${count} domains selected` };
    }

    case "bio": {
      if (!value.trim()) return { warning: "Please write a short bio" };
      if (value.trim().length < 80) return { error: "Aim for at least 80 characters — give reviewers context" };
      if (value.length > CHAR_LIMITS.bio) return { error: `Max ${CHAR_LIMITS.bio} characters` };
      return { success: "Strong bio" };
    }

    default:
      return {};
  }
}

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
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={onTriggerKey}
        disabled={loading}
        className="input-field w-full flex items-center gap-2 pr-8 cursor-pointer select-none"
        style={{ fontSize: 13 }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-forest/40" />
          : selected
            ? (
              <>
                <Image
                  src={selected.flag}
                  alt={selected.name}
                  width={20}
                  height={14}
                  style={{ width: 20, height: 14 }}
                  className="object-cover rounded-sm flex-shrink-0"
                />
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
                <Image
                  src={c.flag}
                  alt={c.name}
                  width={20}
                  height={14}
                  style={{ width: 20, height: 14 }}
                  className="object-cover rounded-sm flex-shrink-0"
                />
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MentorApplyPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepBlocked, setStepBlocked] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [errs,  setErrs]  = useState<Record<string, string>>({});
  const [warns, setWarns] = useState<Record<string, string>>({});
  const [oks,   setOks]   = useState<Record<string, string>>({});

  const [countries, setCountries] = useState<CountryData[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [dialCountry, setDialCountry] = useState("");
  const [countryAutoFilled, setCountryAutoFilled] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    mobile: "",
    linkedinUrl: "",
    currentRole: "",
    company: "",
    yearsOfExperience: "",
    domains: [],
    bio: "",
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

  // ── Pre-fill from session ──────────────────────────────────────────────────
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        fullName: session.user.name  ?? prev.fullName,
        email:    session.user.email ?? prev.email,
      }));
    }
  }, [session]);

  // ── Restore draft ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved =
        sessionStorage.getItem("venturehub-mentor-draft") ??
        localStorage.getItem("venturehub-mentor-draft");
      if (!saved) return;
      const p = JSON.parse(saved);
      setFormData(prev => ({
        ...prev,
        fullName:          typeof p.fullName          === "string"  ? p.fullName          : prev.fullName,
        linkedinUrl:       typeof p.linkedinUrl       === "string"  ? p.linkedinUrl       : prev.linkedinUrl,
        currentRole:       typeof p.currentRole       === "string"  ? p.currentRole       : prev.currentRole,
        company:           typeof p.company           === "string"  ? p.company           : prev.company,
        yearsOfExperience: typeof p.yearsOfExperience === "string"  ? p.yearsOfExperience : prev.yearsOfExperience,
        domains:           Array.isArray(p.domains)                 ? p.domains           : prev.domains,
        bio:               typeof p.bio               === "string"  ? p.bio               : prev.bio,
      }));
      if (typeof p.dialCountry === "string" && p.dialCountry) setDialCountry(p.dialCountry);
    } catch {}
  }, []);

  // ── Auto-detect country from timezone ──────────────────────────────────────
  useEffect(() => {
    if (!isClient || countriesLoading || !countries.length || dialCountry) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const cc = TZ_TO_CC[tz];
      if (!cc) return;
      const found = countries.find(c => c.code === cc);
      if (!found) return;
      setDialCountry(cc);
      setCountryAutoFilled(true);
    } catch {}
  }, [isClient, countriesLoading, countries, dialCountry]);

  // ── Run validation on step change ──────────────────────────────────────────
  useEffect(() => {
    setStepBlocked(null);
    const fields = STEP_FIELDS[currentStep] ?? [];
    fields.forEach(id => {
      if (id === "domains") {
        applyResult("domains", validate("domains", "", { domains: formData.domains }));
      } else {
        const v = getStr(formData, id);
        applyResult(id, validate(id, v, { dialCountry }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  function applyResult(id: string, r: VResult) {
    setErrs(p  => { const n = { ...p }; if (r.error)   n[id] = r.error;   else delete n[id]; return n; });
    setWarns(p => { const n = { ...p }; if (r.warning)  n[id] = r.warning; else delete n[id]; return n; });
    setOks(p   => { const n = { ...p }; if (r.success)  n[id] = r.success; else delete n[id]; return n; });
  }

  function fieldCls(id: string) {
    if (errs[id])  return "border-red-300 bg-red-50/30";
    if (warns[id]) return "border-amber-300 bg-amber-50/20";
    if (oks[id])   return "border-green-400 bg-green-50/20";
    return "";
  }

  // ── Real-time validation ───────────────────────────────────────────────────
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { id, value } = e.target;

    if (id === "mobile" && /[^0-9\s\-()+]/.test(value)) return;
    if (id === "yearsOfExperience" && /[^\d]/.test(value)) return;

    const limit = CHAR_LIMITS[id as keyof typeof CHAR_LIMITS];
    const v = limit ? value.slice(0, limit) : value;
    setFormData(prev => ({ ...prev, [id as StringField]: v }));
    setSubmitError(null);
    setStepBlocked(null);

    applyResult(id, validate(id, v, { dialCountry }));
  }

  function handleDialChange(cc: string) {
    setDialCountry(cc);
    setStepBlocked(null);
    if (!cc) { setCountryAutoFilled(false); }
    if (formData.mobile.trim()) {
      applyResult("mobile", validate("mobile", formData.mobile, { dialCountry: cc }));
    }
  }

  function toggleDomain(domain: string) {
    const next = formData.domains.includes(domain)
      ? formData.domains.filter(d => d !== domain)
      : [...formData.domains, domain];
    setFormData(prev => ({ ...prev, domains: next }));
    applyResult("domains", validate("domains", "", { domains: next }));
    setStepBlocked(null);
  }

  // ── Step validation ────────────────────────────────────────────────────────
  function validateCurrentStep(): boolean {
    let ok = true;
    for (const id of (STEP_FIELDS[currentStep] ?? [])) {
      let r: VResult;
      if (id === "domains") {
        r = validate("domains", "", { domains: formData.domains });
      } else {
        const v = getStr(formData, id);
        r = validate(id, v, { dialCountry });
      }
      applyResult(id, r);
      if (r.error) ok = false;
    }
    for (const id of (REQUIRED_FIELDS[currentStep] ?? [])) {
      const v = getStr(formData, id);
      if (!v.trim()) ok = false;
    }
    return ok;
  }

  function validateAll(): boolean {
    let ok = true;
    for (const [stepStr, ids] of Object.entries(STEP_FIELDS)) {
      const step = parseInt(stepStr);
      for (const id of ids) {
        let r: VResult;
        if (id === "domains") {
          r = validate("domains", "", { domains: formData.domains });
        } else {
          const v = getStr(formData, id);
          r = validate(id, v, { dialCountry });
        }
        applyResult(id, r);
        if (r.error) ok = false;
      }
      for (const id of (REQUIRED_FIELDS[step] ?? [])) {
        const v = getStr(formData, id);
        if (!v.trim()) ok = false;
      }
    }
    return ok;
  }

  // ── Save / nav ─────────────────────────────────────────────────────────────
  const saveDraft = () => {
    try {
      const payload = {
        fullName:          formData.fullName,
        linkedinUrl:       formData.linkedinUrl,
        currentRole:       formData.currentRole,
        company:           formData.company,
        yearsOfExperience: formData.yearsOfExperience,
        domains:           formData.domains,
        bio:               formData.bio,
        dialCountry,
      };
      const s = JSON.stringify(payload);
      sessionStorage.setItem("venturehub-mentor-draft", s);
      localStorage.setItem("venturehub-mentor-draft", s);
    } catch {}
  };

  const handleNext = () => {
    for (const id of (STEP_FIELDS[currentStep] ?? [])) {
      if (id === "domains") {
        applyResult("domains", validate("domains", "", { domains: formData.domains }));
      } else {
        const v = getStr(formData, id);
        applyResult(id, validate(id, v, { dialCountry }));
      }
    }

    const required = REQUIRED_FIELDS[currentStep] ?? [];
    const emptyFields = required.filter(id => !getStr(formData, id).trim());
    if (emptyFields.length > 0) {
      const names = emptyFields.map(f => REQUIRED_FIELD_LABELS[f] ?? f).join(", ");
      setStepBlocked(`Please fill in the required fields before continuing: ${names}.`);
      return;
    }

    const hasErrors = (STEP_FIELDS[currentStep] ?? []).some(id => {
      if (id === "domains") return validate("domains", "", { domains: formData.domains }).error;
      const v = getStr(formData, id);
      return validate(id, v, { dialCountry }).error;
    });

    if (hasErrors) {
      setStepBlocked("Please fix the errors above before continuing.");
      return;
    }

    setStepBlocked(null);
    saveDraft();
    setCurrentStep(p => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setStepBlocked(null);
      setCurrentStep(p => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStepClick = (i: number) => {
    if (i <= currentStep || validateCurrentStep()) {
      setStepBlocked(null);
      setCurrentStep(i);
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

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateAll()) {
      setSubmitError("Some required fields are missing or invalid. Please review each step.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      let formattedPhone: string | undefined;
      if (formData.mobile.trim() && dialCountry) {
        try {
          formattedPhone = parsePhoneNumber(formData.mobile, dialCountry as CountryCode).formatInternational();
        } catch {
          formattedPhone = formData.mobile;
        }
      }

      const res = await fetch("/api/mentor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName:          formData.fullName,
          email:             formData.email,
          mobile:            formattedPhone || undefined,
          linkedinUrl:       formData.linkedinUrl || undefined,
          currentRole:       formData.currentRole,
          company:           formData.company,
          yearsOfExperience: parseInt(formData.yearsOfExperience),
          domains:           formData.domains,
          bio:               formData.bio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
        if (res.status === 409) throw new Error("An application with this email already exists.");
        if (res.status === 400) {
          if (data.details && Array.isArray(data.details)) {
            const msgs = data.details
              .map((d: { field: string; message: string }) =>
                d.field ? `${d.field}: ${d.message}` : d.message
              )
              .join("\n");
            throw new Error(msgs);
          }
          throw new Error(data.error || "Validation failed — please check all fields.");
        }
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      try {
        sessionStorage.removeItem("venturehub-mentor-draft");
        localStorage.removeItem("venturehub-mentor-draft");
      } catch {}
      router.push("/mentorship/success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = Math.round(((currentStep + 1) / steps.length) * 100);
  const selectedCountry = countries.find(c => c.code === dialCountry);

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation activeItem="home" />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="animate-pulse text-forest/40 text-sm">Loading…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-beige/30">
      <Navigation activeItem="home" />

      {/* ── Mobile progress bar ── */}
      <div className="lg:hidden sticky top-16 z-40 bg-white border-b border-forest/10 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex gap-1.5 flex-shrink-0">
            {steps.map((_, i) => (
              <button key={i} onClick={() => handleStepClick(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? "w-5 bg-forest" : i < currentStep ? "w-1.5 bg-forest/50" : "w-1.5 bg-forest/15"
                }`}
              />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest/40 leading-none">
              Step {currentStep + 1} of {steps.length}
            </p>
            <p className="text-sm font-serif text-forest leading-tight truncate">
              {steps[currentStep].title}
            </p>
          </div>
          <span className="text-xl">{steps[currentStep].icon}</span>
        </div>
        <div className="h-0.5 bg-forest/8">
          <div className="h-full bg-forest transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <main className="flex-1 pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto pt-6 lg:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-20">

            {/* ── Desktop sidebar ── */}
            <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 h-fit">
              <span className="text-forest/40 font-bold uppercase tracking-[0.4em] text-[10px] block mb-4">
                Become a Mentor
              </span>
              <h1 className="font-serif text-5xl lg:text-6xl text-forest mb-8 leading-tight">
                Share your <span className="italic">wisdom.</span>
              </h1>
              <p className="text-forest/70 text-lg leading-relaxed mb-12 max-w-sm">
                We partner with operators who've built and failed and built again. Help the next
                generation navigate what you've already crossed.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-12 pb-12 border-b border-forest/10">
                {[
                  { icon: <Users className="h-4 w-4" />, val: "200+", label: "Active Startups" },
                  { icon: <Sparkles className="h-4 w-4" />, val: "4.8★", label: "Avg rating" },
                  { icon: <Briefcase className="h-4 w-4" />, val: "$80–200", label: "Per session" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="flex justify-center mb-1 text-forest/40">{s.icon}</div>
                    <p className="text-lg font-bold text-forest">{s.val}</p>
                    <p className="text-[10px] uppercase tracking-wider text-forest/40">{s.label}</p>
                  </div>
                ))}
              </div>

              <nav className="space-y-7 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-forest/10" />
                {steps.map(({ num, title, sub }, i) => (
                  <div key={num}
                    className={`relative pl-8 flex items-center group cursor-pointer transition-all ${i === currentStep ? "scale-105" : ""}`}
                    onClick={() => handleStepClick(i)}
                  >
                    <div className={`absolute left-0 w-3.5 h-3.5 rounded-full transition-all ${
                      i === currentStep ? "bg-forest ring-4 ring-forest/20 scale-110"
                      : i < currentStep  ? "bg-forest/60"
                      : "bg-forest/20 group-hover:bg-forest/40"
                    }`} />
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                        i === currentStep ? "text-forest" : i < currentStep ? "text-forest/60" : "text-forest/40 group-hover:text-forest/60"
                      }`}>{num}. {title}</p>
                      <p className={`text-[10px] uppercase tracking-wider ${
                        i === currentStep ? "text-forest/40" : "text-forest/20"
                      }`}>{sub}</p>
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            {/* ── Mobile title ── */}
            <div className="lg:hidden col-span-1 mb-5 px-1">
              <h1 className="font-serif text-3xl text-forest leading-tight">
                Share your <span className="italic">wisdom.</span>
              </h1>
              <p className="text-forest/60 text-sm mt-1.5">We partner with operators who've built and failed.</p>
            </div>

            {/* ── Form panel ── */}
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

                  {/* ── Step 0: Identity ── */}
                  {currentStep === 0 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Your Identity</h2>
                        <p className="text-sm text-forest/50 mt-1">Who are you, beyond the title?</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="fullName">Full Name <span className="text-red-400">*</span></label>
                          <CharCount cur={formData.fullName.length} max={CHAR_LIMITS.fullName} />
                        </div>
                        <input type="text" id="fullName" maxLength={CHAR_LIMITS.fullName} autoComplete="name"
                          className={`input-field ${fieldCls("fullName")}`}
                          placeholder="Priya Nair" value={formData.fullName} onChange={handleChange}
                        />
                        <FieldError msg={errs.fullName} />
                        <FieldWarn  msg={warns.fullName} />
                        <FieldOk   msg={oks.fullName} />
                        <p className="text-[10px] text-forest/30 mt-1">Letters, spaces, hyphens, apostrophes · 2–{CHAR_LIMITS.fullName} chars</p>
                      </div>

                      <div>
                        <label className="label-style" htmlFor="email">Email <span className="text-red-400">*</span></label>
                        <input type="email" id="email" autoComplete="email"
                          className={`input-field ${fieldCls("email")}`}
                          placeholder="priya@example.com" value={formData.email} onChange={handleChange}
                        />
                        <FieldError msg={errs.email} />
                        <FieldWarn  msg={warns.email} />
                        <FieldOk   msg={oks.email} />
                      </div>

                      <div>
                        <label className="label-style mb-1 block">
                          Mobile <span className="text-forest/30 font-normal">(optional)</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <PhoneCountryDropdown
                            value={dialCountry}
                            onChange={handleDialChange}
                            countries={countries}
                            loading={countriesLoading}
                          />
                          <input
                            type="tel"
                            id="mobile"
                            autoComplete="tel-national"
                            disabled={!dialCountry}
                            title={!dialCountry ? "Select a country code first" : undefined}
                            className={`input-field ${fieldCls("mobile")} ${
                              !dialCountry ? "opacity-40 cursor-not-allowed bg-forest/5" : ""
                            }`}
                            placeholder={
                              !dialCountry        ? "Select a country code first"
                              : dialCountry === "IN" ? "98765 43210"
                              : dialCountry === "US" ? "(555) 123-4567"
                              : dialCountry === "GB" ? "07700 900123"
                              : "Enter number"
                            }
                            value={formData.mobile}
                            onChange={handleChange}
                          />
                        </div>
                        <FieldError msg={errs.mobile} />
                        <FieldWarn  msg={warns.mobile} />
                        <FieldOk   msg={oks.mobile} />
                        {countryAutoFilled && dialCountry && selectedCountry && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <Image
                              src={selectedCountry.flag}
                              alt={selectedCountry.name}
                              width={16}
                              height={12}
                              style={{ width: 16, height: 12 }}
                              className="object-cover rounded-sm"
                            />
                            <p className="text-[10px] text-forest/50">
                              Auto-detected: <span className="font-medium text-forest/70">{selectedCountry.name}</span>
                            </p>
                          </div>
                        )}
                        <p className="text-[10px] text-forest/30 mt-1">Validated via libphonenumber · stored in E.164 format</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="linkedinUrl">
                            LinkedIn Profile <span className="text-forest/30 font-normal">(optional but recommended)</span>
                          </label>
                          <CharCount cur={formData.linkedinUrl.length} max={CHAR_LIMITS.linkedinUrl} />
                        </div>
                        <input type="url" id="linkedinUrl" maxLength={CHAR_LIMITS.linkedinUrl}
                          className={`input-field ${fieldCls("linkedinUrl")}`}
                          placeholder="https://linkedin.com/in/yourprofile" value={formData.linkedinUrl} onChange={handleChange}
                        />
                        <FieldError msg={errs.linkedinUrl} />
                        <FieldWarn  msg={warns.linkedinUrl} />
                        <FieldOk   msg={oks.linkedinUrl} />
                      </div>
                    </section>
                  )}

                  {/* ── Step 1: Expertise ── */}
                  {currentStep === 1 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Your Expertise</h2>
                        <p className="text-sm text-forest/50 mt-1">Where have you built deep experience?</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="currentRole">Current Role <span className="text-red-400">*</span></label>
                          <CharCount cur={formData.currentRole.length} max={CHAR_LIMITS.currentRole} />
                        </div>
                        <input type="text" id="currentRole" maxLength={CHAR_LIMITS.currentRole}
                          className={`input-field ${fieldCls("currentRole")}`}
                          placeholder="Head of Growth / Founder / VP Engineering"
                          value={formData.currentRole} onChange={handleChange}
                        />
                        <FieldError msg={errs.currentRole} />
                        <FieldWarn  msg={warns.currentRole} />
                        <FieldOk   msg={oks.currentRole} />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="company">Company / Organisation <span className="text-red-400">*</span></label>
                          <CharCount cur={formData.company.length} max={CHAR_LIMITS.company} />
                        </div>
                        <input type="text" id="company" maxLength={CHAR_LIMITS.company}
                          className={`input-field ${fieldCls("company")}`}
                          placeholder="Acme Corp / Self-employed"
                          value={formData.company} onChange={handleChange}
                        />
                        <FieldError msg={errs.company} />
                        <FieldWarn  msg={warns.company} />
                        <FieldOk   msg={oks.company} />
                      </div>

                      <div>
                        <label className="label-style" htmlFor="yearsOfExperience">
                          Years of Experience <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          id="yearsOfExperience"
                          maxLength={CHAR_LIMITS.yearsOfExperience}
                          className={`input-field ${fieldCls("yearsOfExperience")}`}
                          placeholder="8"
                          value={formData.yearsOfExperience}
                          onChange={handleChange}
                        />
                        <FieldError msg={errs.yearsOfExperience} />
                        <FieldWarn  msg={warns.yearsOfExperience} />
                        <FieldOk   msg={oks.yearsOfExperience} />
                        <p className="text-[10px] text-forest/30 mt-1">Total professional experience · 1–60 years</p>
                      </div>
                    </section>
                  )}

                  {/* ── Step 2: Domains ── */}
                  {currentStep === 2 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Your Domains</h2>
                        <p className="text-sm text-forest/50 mt-1">Select the areas you can guide founders in.</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="label-style">Mentoring Domains <span className="text-red-400">*</span></label>
                          <span className="text-[10px] text-forest/30">{formData.domains.length} selected</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {DOMAIN_OPTIONS.map(domain => (
                            <button
                              key={domain}
                              type="button"
                              onClick={() => toggleDomain(domain)}
                              className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                                formData.domains.includes(domain)
                                  ? "bg-forest text-white border-forest shadow-sm"
                                  : "bg-beige/50 border-forest/10 text-forest/70 hover:bg-beige hover:border-forest/20"
                              }`}
                            >
                              {domain}
                            </button>
                          ))}
                        </div>
                        <FieldError msg={errs.domains} />
                        <FieldWarn  msg={warns.domains} />
                        <FieldOk   msg={oks.domains} />
                        <p className="text-[10px] text-forest/30 mt-2">Select at least 1 · 2–4 recommended</p>
                      </div>
                    </section>
                  )}

                  {/* ── Step 3: Bio ── */}
                  {currentStep === 3 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Your Story</h2>
                        <p className="text-sm text-forest/50 mt-1">Tell startups why they should learn from you.</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="bio">Bio <span className="text-red-400">*</span></label>
                          <CharCount cur={formData.bio.length} max={CHAR_LIMITS.bio} />
                        </div>
                        <textarea id="bio" rows={6} maxLength={CHAR_LIMITS.bio}
                          className={`input-field resize-none ${fieldCls("bio")}`}
                          placeholder="Describe your background, the key lessons you've learned, and the kind of founders you most love working with…"
                          value={formData.bio} onChange={handleChange}
                        />
                        <FieldError msg={errs.bio} />
                        <FieldWarn  msg={warns.bio} />
                        <FieldOk   msg={oks.bio} />
                        <p className="text-[10px] text-forest/30 mt-1">
                          Min 80 chars · Max {CHAR_LIMITS.bio} chars · Appears on your public mentor profile once approved
                        </p>
                      </div>

                      {/* ── Review summary ── */}
                      <div className="bg-beige/60 rounded-xl p-5 border border-forest/8 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-forest/50">Application summary</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {[
                            ["Name",       formData.fullName        || "—"],
                            ["Email",      formData.email           || "—"],
                            ["Role",       formData.currentRole     || "—"],
                            ["Company",    formData.company         || "—"],
                            ["Experience", formData.yearsOfExperience ? `${formData.yearsOfExperience} yrs` : "—"],
                            ["Domains",    formData.domains.length  ? `${formData.domains.length} selected` : "—"],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <span className="text-forest/40 text-[11px] uppercase tracking-wider">{k}</span>
                              <p className="font-semibold text-forest/80 text-xs mt-0.5 truncate">{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── Navigation row ── */}
                  <div className="pt-6 border-t border-forest/10 flex items-center justify-between gap-3">
                    <button type="button" onClick={handleSaveProgress}
                      className="text-xs font-bold uppercase tracking-widest text-forest/40 hover:text-forest transition-colors flex items-center gap-1.5 py-2 flex-shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Save</span>
                    </button>

                    <div className="flex flex-col items-end gap-2">
                      {stepBlocked && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <p className="text-red-600 text-xs font-medium leading-tight">{stepBlocked}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {currentStep > 0 && (
                          <button type="button" onClick={handlePrev}
                            className="flex items-center gap-1.5 px-4 py-3 border border-forest/20 text-forest font-bold uppercase text-xs tracking-[0.15em] hover:bg-beige transition-colors rounded-lg"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" /> Back
                          </button>
                        )}
                        {currentStep < steps.length - 1 ? (
                          <button type="button" onClick={handleNext}
                            className="flex items-center gap-1.5 px-6 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.15em] hover:bg-forest/90 transition-colors rounded-lg shadow-sm shadow-forest/10"
                          >
                            Continue <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.15em] hover:bg-forest/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-forest/10"
                          >
                            {isSubmitting ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</>
                            ) : (
                              "Submit Application"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="hidden lg:block"><Footer /></div>

      <style jsx>{`
        @keyframes fade-in    { from { opacity: 0 } to { opacity: 1 } }
        .animate-fade-in    { animation: fade-in 0.2s ease-out; }
        @media (max-width: 1023px) { .input-field { font-size: 16px !important; } }
      `}</style>
    </div>
  );
}