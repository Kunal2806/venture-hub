"use client";

import {
  Save, CheckCircle, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, X, Globe, Linkedin,
  TrendingUp, DollarSign, Layers, Target, Zap,
} from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import {
  GEOGRAPHY_OPTIONS,
  INVESTOR_TYPE_LABELS,
  SECTOR_OPTIONS,
  STAGE_LABELS,
  STAGE_OPTIONS,
} from "@/validaton-schema/investor";
import { InvestorProfile } from "@/db/schema";
import { Navigation } from "@/components/home/Navigation";
import { Footer } from "@/components/home/Footer";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  defaultValues: InvestorProfile | null;
}

type FieldErrors = Record<string, string[]>;

type ActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ─── Steps config ─────────────────────────────────────────────────────────────

const steps = [
  { num: "01", title: "Identity",    sub: "Firm & background",     icon: "🏛️" },
  { num: "02", title: "Preferences", sub: "Sectors & stages",      icon: "🎯" },
  { num: "03", title: "Ticket Size", sub: "Investment range",      icon: "💰" },
  { num: "04", title: "Thesis",      sub: "Investment philosophy", icon: "📜" },
  { num: "05", title: "Signals",     sub: "Focus flags",           icon: "📡" },
];

const FREE_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "live.com", "icloud.com", "aol.com", "protonmail.com",
];

// ─── Multi-select ─────────────────────────────────────────────────────────────

interface MultiSelectProps {
  label: string;
  options: readonly string[];
  displayLabels?: Record<string, string>;
  selected: string[];
  onChange: (next: string[]) => void;
  error?: string;
  warning?: string;
  required?: boolean;
  placeholder?: string;
}

function MultiSelect({
  label, options, displayLabels, selected, onChange,
  error, warning, required, placeholder = "Search...",
}: MultiSelectProps) {
  const [query, setQuery] = useState("");

  const filtered = options.filter((opt) => {
    const display = displayLabels?.[opt] ?? opt;
    return display.toLowerCase().includes(query.toLowerCase());
  });

  const toggle = (opt: string) =>
    onChange(selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt]);

  return (
    <div>
      <label className="label-style">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className={`border rounded-xl overflow-hidden transition-colors ${
        error ? "border-red-300 ring-1 ring-red-200"
        : warning ? "border-amber-300"
        : "border-forest/20 focus-within:border-forest/40"
      }`}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 text-sm bg-transparent border-b border-forest/10 focus:outline-none text-forest placeholder:text-forest/30"
        />
        <div className="max-h-44 overflow-y-auto bg-beige/30">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-forest/40 italic">No results for "{query}"</p>
          )}
          {filtered.map((opt) => {
            const display = displayLabels?.[opt] ?? opt;
            const checked = selected.includes(opt);
            return (
              <label key={opt} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-beige cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt)}
                  className="w-4 h-4 accent-forest cursor-pointer"
                />
                <span className={checked ? "font-medium text-forest" : "text-forest/70"}>
                  {display}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((opt) => {
            const display = displayLabels?.[opt] ?? opt;
            return (
              <span key={opt} className="inline-flex items-center gap-1 bg-forest text-cream text-xs px-2.5 py-1 rounded-full font-medium">
                {display}
                <button type="button" onClick={() => toggle(opt)} className="ml-0.5 hover:opacity-70 leading-none text-base">×</button>
              </span>
            );
          })}
        </div>
      )}

      {error && <FieldError message={error} />}
      {!error && warning && <FieldWarning message={warning} />}
    </div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileForm({ defaultValues }: Props) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(5);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [validationWarnings, setValidationWarnings] = useState<Record<string, string>>({});
  const [validationSuccess, setValidationSuccess] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);

  // Multi-select state
  const [sectors, setSectors] = useState<string[]>((defaultValues?.preferredSectors as string[]) ?? []);
  const [stages, setStages] = useState<string[]>((defaultValues?.preferredStages as string[]) ?? []);
  const [geos, setGeos] = useState<string[]>((defaultValues?.preferredGeographies as string[]) ?? []);

  // Form field state
  const [form, setForm] = useState({
    firmName:         defaultValues?.firmName         ?? "",
    designation:      defaultValues?.designation      ?? "",
    bio:              defaultValues?.bio              ?? "",
    linkedinUrl:      defaultValues?.linkedinUrl      ?? "",
    websiteUrl:       defaultValues?.websiteUrl       ?? "",
    investorType:     defaultValues?.investorType     ?? "",
    ticketSizeMin:    defaultValues?.ticketSizeMin    ? String(defaultValues.ticketSizeMin) : "",
    ticketSizeMax:    defaultValues?.ticketSizeMax    ? String(defaultValues.ticketSizeMax) : "",
    investmentThesis: defaultValues?.investmentThesis ?? "",
    impactFocused:    defaultValues?.impactFocused    ?? false,
  });

  // Hydration guard
  useEffect(() => { setIsClient(true); }, []);

  // Restore draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem("venturehub-investor-draft");
      if (saved && !defaultValues) {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm(prev => ({ ...prev, ...parsed.form }));
        if (parsed.sectors) setSectors(parsed.sectors);
        if (parsed.stages) setStages(parsed.stages);
        if (parsed.geos) setGeos(parsed.geos);
      }
    } catch {}
  }, []);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showMobileMenu]);

  // Success countdown
  useEffect(() => {
    if (!showSuccess) return;
    setSuccessCountdown(5);
    const interval = setInterval(() => {
      setSuccessCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); setShowSuccess(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showSuccess]);

  const update = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (validationErrors[key])
      setValidationErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    if (validationWarnings[key])
      setValidationWarnings(prev => { const n = { ...prev }; delete n[key]; return n; });
    if (validationSuccess[key])
      setValidationSuccess(prev => { const n = { ...prev }; delete n[key]; return n; });
    setSubmitError(null);
  };

  const getErr  = (key: string) => fieldErrors[key]?.[0] ?? validationErrors[key];
  const getWarn = (key: string) => validationWarnings[key];
  const getOk   = (key: string) => validationSuccess[key];

  // ── Step validation ──────────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const errors:   Record<string, string> = {};
    const warnings: Record<string, string> = {};
    const success:  Record<string, string> = {};

    // ── Step 0: Identity ─────────────────────────────────────────────────────
    if (step === 0) {
      // Firm Name
      const firm = form.firmName.trim();
      if (firm && firm.length < 2) {
        errors.firmName = "Firm name must be at least 2 characters";
      } else if (firm.length >= 2) {
        success.firmName = "Looks good";
      } else {
        warnings.firmName = "Adding your firm name builds credibility with founders";
      }

      // Designation
      if (!form.designation.trim()) {
        warnings.designation = "Your designation helps founders understand your role";
      }

      // LinkedIn URL
      const linkedin = form.linkedinUrl.trim();
      if (linkedin) {
        if (!/^https?:\/\/.+/.test(linkedin)) {
          errors.linkedinUrl = "URL must start with https://";
        } else if (!linkedin.includes("linkedin.com")) {
          warnings.linkedinUrl = "This doesn't look like a LinkedIn URL — double-check?";
        } else {
          success.linkedinUrl = "Valid LinkedIn URL";
        }
      } else {
        warnings.linkedinUrl = "A LinkedIn profile increases founder trust";
      }

      // Website URL
      const website = form.websiteUrl.trim();
      if (website) {
        if (!/^https?:\/\/.+/.test(website)) {
          errors.websiteUrl = "URL must start with https://";
        } else if (!/^https:\/\//.test(website)) {
          warnings.websiteUrl = "Consider using https:// for a secure link";
        } else {
          success.websiteUrl = "Valid URL";
        }
      }

      // Bio
      if (!form.bio.trim()) {
        warnings.bio = "A bio helps founders understand your background and interests";
      } else if (form.bio.trim().length < 50) {
        warnings.bio = "A bit more detail helps founders connect with your story";
      } else {
        success.bio = "Great — this adds depth to your profile";
      }
    }

    // ── Step 1: Preferences ──────────────────────────────────────────────────
    if (step === 1) {
      if (!form.investorType) {
        errors.investorType = "Please select your investor type";
      } else {
        success.investorType = "Got it";
      }
      if (sectors.length === 0) {
        errors.preferredSectors = "Select at least one sector you invest in";
      }
      if (stages.length === 0) {
        errors.preferredStages = "Select at least one stage you invest at";
      }
      if (geos.length === 0) {
        warnings.preferredGeographies = "Adding preferred geographies improves matching accuracy";
      }
    }

    // ── Step 2: Ticket Size ──────────────────────────────────────────────────
    if (step === 2) {
      const min = Number(form.ticketSizeMin);
      const max = Number(form.ticketSizeMax);

      if (form.ticketSizeMin && min <= 0) {
        errors.ticketSizeMin = "Must be a positive number";
      } else if (form.ticketSizeMin && min > 0) {
        success.ticketSizeMin = `$${min.toLocaleString()}`;
      }

      if (form.ticketSizeMax && max <= 0) {
        errors.ticketSizeMax = "Must be a positive number";
      } else if (form.ticketSizeMax && max > 0) {
        if (form.ticketSizeMin && max < min) {
          errors.ticketSizeMax = "Max must be ≥ minimum ticket size";
        } else {
          success.ticketSizeMax = `$${max.toLocaleString()}`;
        }
      }

      if (!form.ticketSizeMin && !form.ticketSizeMax) {
        warnings.ticketSizeMin = "Specifying a range helps founders self-qualify before reaching out";
      }
    }

    // ── Step 3: Thesis ───────────────────────────────────────────────────────
    if (step === 3) {
      if (!form.investmentThesis.trim()) {
        warnings.investmentThesis = "Investors with a clear thesis attract 3× more relevant applications";
      } else if (form.investmentThesis.trim().length < 80) {
        warnings.investmentThesis = "A bit more detail helps founders understand your conviction";
      } else {
        success.investmentThesis = "Excellent — a strong thesis helps us surface the right founders";
      }
    }

    setValidationErrors(errors);
    setValidationWarnings(warnings);
    setValidationSuccess(success);
    return Object.keys(errors).length === 0;
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const saveDraft = () => {
    try {
      localStorage.setItem("venturehub-investor-draft", JSON.stringify({ form, sectors, stages, geos }));
    } catch {}
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      saveDraft();
      setCurrentStep((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((p) => p - 1);
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
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-20 left-1/2 -translate-x-1/2 bg-forest text-white px-5 py-3 rounded-full shadow-xl z-[200] text-sm font-medium pointer-events-none";
    toast.textContent = "Progress saved ✓";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const step1Ok = validateStep(1);
    if (!step1Ok) {
      setSubmitError("Some required fields are missing. Please review each step.");
      return;
    }

    setSubmitError(null);

    startTransition(async () => {
      const data = {
        firmName:             form.firmName         || undefined,
        designation:          form.designation      || undefined,
        bio:                  form.bio              || undefined,
        linkedinUrl:          form.linkedinUrl      || undefined,
        websiteUrl:           form.websiteUrl       || undefined,
        investorType:         form.investorType,
        preferredSectors:     sectors,
        preferredStages:      stages,
        preferredGeographies: geos,
        ticketSizeMin:        form.ticketSizeMin ? Number(form.ticketSizeMin) : undefined,
        ticketSizeMax:        form.ticketSizeMax ? Number(form.ticketSizeMax) : undefined,
        investmentThesis:     form.investmentThesis || undefined,
        impactFocused:        form.impactFocused,
      };

      const res = await fetch("/api/investor/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result: ActionResult = await res.json();

      if (!res.ok && "fieldErrors" in result && result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        setSubmitError("error" in result ? result.error : "Validation failed");
        return;
      }

      if (res.ok) {
        try { localStorage.removeItem("venturehub-investor-draft"); } catch {}
        setShowSuccess(true);
      }
    });
  };

  const progressValue = Math.round(((currentStep + 1) / steps.length) * 100);

  // SSR guard
  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation activeItem="home" isLoggedIn={!!session?.user} />
        <main className="flex-1 pt-16 sm:pt-20 flex items-center justify-center">
          <div className="animate-pulse text-forest/40 text-sm">Loading…</div>
        </main>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-beige/30">
      <Navigation activeItem="home" isLoggedIn={!!session?.user} />

      {/* ── Sticky mobile progress bar ── */}
      <div className="lg:hidden sticky top-16 z-40 bg-white border-b border-forest/10 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex gap-1.5 flex-shrink-0">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => handleStepClick(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? "w-5 bg-forest"
                  : i < currentStep  ? "w-1.5 bg-forest/50"
                  : "w-1.5 bg-forest/15"
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
          <button
            onClick={() => setShowMobileMenu(true)}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-forest/5 flex items-center justify-center text-sm"
          >
            {steps[currentStep].icon}
          </button>
        </div>
        <div className="h-0.5 bg-forest/8">
          <div className="h-full bg-forest transition-all duration-500 ease-out" style={{ width: `${progressValue}%` }} />
        </div>
      </div>

      <main className="flex-1 pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto pt-6 lg:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-20">

            {/* ── Desktop sidebar ── */}
            <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 h-fit">
              <span className="text-forest/40 font-bold uppercase tracking-[0.4em] text-[10px] block mb-4">
                Investor Profile
              </span>
              <h1 className="font-serif text-5xl lg:text-6xl text-forest mb-8 leading-tight">
                Define your <span className="italic">edge.</span>
              </h1>
              <p className="text-forest/70 text-lg leading-relaxed mb-12 max-w-sm">
                The best deals find investors who know exactly what they're looking for. Tell us what moves you.
              </p>
              <nav className="space-y-7 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-forest/10" />
                {steps.map(({ num, title, sub }, i) => (
                  <div
                    key={num}
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
                        i === currentStep ? "text-forest"
                        : i < currentStep  ? "text-forest/60"
                        : "text-forest/40 group-hover:text-forest/60"
                      }`}>{num}. {title}</p>
                      <p className={`text-[10px] uppercase tracking-wider ${
                        i === currentStep ? "text-forest/40"
                        : i < currentStep  ? "text-forest/30"
                        : "text-forest/20"
                      }`}>{sub}</p>
                    </div>
                    {i < currentStep && (
                      <CheckCircle className="w-3.5 h-3.5 text-forest/50 ml-auto mr-2" />
                    )}
                  </div>
                ))}
              </nav>

              {/* Profile completion indicator */}
              <div className="mt-12 p-4 bg-white/60 rounded-xl border border-forest/8">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-forest/50">Profile Strength</p>
                  <p className="text-xs font-bold text-forest">{progressValue}%</p>
                </div>
                <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-forest/60 to-forest rounded-full transition-all duration-700"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
                <p className="text-[10px] text-forest/30 mt-2">
                  Complete all steps to maximise founder discovery
                </p>
              </div>
            </aside>

            {/* ── Mobile title ── */}
            <div className="lg:hidden col-span-1 mb-5 px-1">
              <h1 className="font-serif text-3xl text-forest leading-tight">
                Define your <span className="italic">edge.</span>
              </h1>
              <p className="text-forest/60 text-sm mt-1.5 leading-relaxed">
                Tell us what moves you — we'll handle the matching.
              </p>
            </div>

            {/* ── Form panel ── */}
            <div className="lg:col-span-8">
              <div className="bg-white/60 backdrop-blur-sm border border-forest/5 shadow-lg rounded-2xl lg:rounded-none overflow-hidden">

                {submitError && (
                  <div className="mx-4 sm:mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-700 text-sm font-medium">Could not save profile</p>
                      <p className="text-red-600 text-xs mt-0.5">{submitError}</p>
                    </div>
                  </div>
                )}

                <form className="p-4 sm:p-8 lg:p-12 space-y-8 lg:space-y-10" onSubmit={(e) => e.preventDefault()}>

                  {/* ── Step 1: Identity ── */}
                  {currentStep === 0 && (
                    <section className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Identity</h2>
                        <p className="text-sm text-forest/50 mt-1">Who you are and what you've built.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="label-style" htmlFor="firmName">Firm Name</label>
                            <span className="text-[10px] text-forest/30">{form.firmName.length}/100</span>
                          </div>
                          <input
                            id="firmName" type="text" maxLength={100}
                            value={form.firmName}
                            onChange={(e) => update("firmName", e.target.value)}
                            placeholder="e.g. Sequoia Capital"
                            className={`input-field ${
                              getErr("firmName")  ? "border-red-300 bg-red-50/30"
                              : getWarn("firmName") ? "border-amber-300 bg-amber-50/20"
                              : getOk("firmName")   ? "border-green-400 bg-green-50/20"
                              : ""
                            }`}
                          />
                          <FieldError   message={getErr("firmName")} />
                          <FieldWarning message={!getErr("firmName") ? getWarn("firmName") : undefined} />
                          <FieldSuccess message={getOk("firmName")} />
                        </div>
                        <div>
                          <label className="label-style" htmlFor="designation">Designation</label>
                          <input
                            id="designation" type="text" maxLength={100}
                            value={form.designation}
                            onChange={(e) => update("designation", e.target.value)}
                            placeholder="e.g. Partner, Managing Director"
                            className={`input-field ${
                              getWarn("designation") ? "border-amber-300 bg-amber-50/20" : ""
                            }`}
                          />
                          <FieldWarning message={getWarn("designation")} />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="bio">Bio</label>
                          <span className="text-[10px] text-forest/30">{form.bio.length}/1000</span>
                        </div>
                        <textarea
                          id="bio" rows={4} maxLength={1000}
                          value={form.bio}
                          onChange={(e) => update("bio", e.target.value)}
                          placeholder="Brief background — what you've built, invested in, and care about. Tell founders why you're the right partner for their journey..."
                          className={`input-field resize-none ${
                            getWarn("bio") ? "border-amber-300 bg-amber-50/20"
                            : getOk("bio")  ? "border-green-400 bg-green-50/20"
                            : ""
                          }`}
                        />
                        <FieldWarning message={getWarn("bio")} />
                        <FieldSuccess message={getOk("bio")} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style" htmlFor="linkedinUrl">
                            <Linkedin className="w-3 h-3 inline mr-1" />
                            LinkedIn URL
                          </label>
                          <input
                            id="linkedinUrl" type="url"
                            value={form.linkedinUrl}
                            onChange={(e) => update("linkedinUrl", e.target.value)}
                            placeholder="https://linkedin.com/in/you"
                            className={`input-field ${
                              getErr("linkedinUrl")  ? "border-red-300 bg-red-50/30"
                              : getWarn("linkedinUrl") ? "border-amber-300 bg-amber-50/20"
                              : getOk("linkedinUrl")   ? "border-green-400 bg-green-50/20"
                              : ""
                            }`}
                          />
                          <FieldError   message={getErr("linkedinUrl")} />
                          <FieldWarning message={!getErr("linkedinUrl") ? getWarn("linkedinUrl") : undefined} />
                          <FieldSuccess message={getOk("linkedinUrl")} />
                        </div>
                        <div>
                          <label className="label-style" htmlFor="websiteUrl">
                            <Globe className="w-3 h-3 inline mr-1" />
                            Website URL
                          </label>
                          <input
                            id="websiteUrl" type="url"
                            value={form.websiteUrl}
                            onChange={(e) => update("websiteUrl", e.target.value)}
                            placeholder="https://yourfirm.com"
                            className={`input-field ${
                              getErr("websiteUrl")  ? "border-red-300 bg-red-50/30"
                              : getWarn("websiteUrl") ? "border-amber-300 bg-amber-50/20"
                              : getOk("websiteUrl")   ? "border-green-400 bg-green-50/20"
                              : ""
                            }`}
                          />
                          <FieldError   message={getErr("websiteUrl")} />
                          <FieldWarning message={!getErr("websiteUrl") ? getWarn("websiteUrl") : undefined} />
                          <FieldSuccess message={getOk("websiteUrl")} />
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── Step 2: Preferences ── */}
                  {currentStep === 1 && (
                    <section className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Preferences</h2>
                        <p className="text-sm text-forest/50 mt-1">The kinds of ventures that excite you.</p>
                      </div>

                      <div>
                        <label className="label-style" htmlFor="investorType">
                          Investor Type <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="investorType"
                          value={form.investorType}
                          onChange={(e) => update("investorType", e.target.value)}
                          className={`input-field appearance-none cursor-pointer ${
                            getErr("investorType") ? "border-red-300 bg-red-50/30"
                            : getOk("investorType")  ? "border-green-400 bg-green-50/20"
                            : ""
                          }`}
                        >
                          <option value="" disabled>Select investor type…</option>
                          {Object.entries(INVESTOR_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <FieldError   message={getErr("investorType")} />
                        <FieldSuccess message={getOk("investorType")} />
                      </div>

                      <MultiSelect
                        label="Preferred Sectors"
                        options={SECTOR_OPTIONS}
                        selected={sectors}
                        onChange={setSectors}
                        error={getErr("preferredSectors")}
                        required
                        placeholder="Search sectors…"
                      />

                      <MultiSelect
                        label="Preferred Stages"
                        options={STAGE_OPTIONS}
                        displayLabels={STAGE_LABELS}
                        selected={stages}
                        onChange={setStages}
                        error={getErr("preferredStages")}
                        required
                        placeholder="Search stages…"
                      />

                      <MultiSelect
                        label="Preferred Geographies"
                        options={GEOGRAPHY_OPTIONS}
                        selected={geos}
                        onChange={setGeos}
                        warning={getWarn("preferredGeographies")}
                        placeholder="Search geographies…"
                      />
                    </section>
                  )}

                  {/* ── Step 3: Ticket Size ── */}
                  {currentStep === 2 && (
                    <section className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Ticket Size</h2>
                        <p className="text-sm text-forest/50 mt-1">Your typical investment range in USD.</p>
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
                        <div>
                          <label className="label-style" htmlFor="ticketSizeMin">Minimum ($)</label>
                          <input
                            id="ticketSizeMin" type="number" min={1}
                            value={form.ticketSizeMin}
                            onChange={(e) => update("ticketSizeMin", e.target.value)}
                            placeholder="e.g. 50000"
                            className={`input-field ${
                              getErr("ticketSizeMin")  ? "border-red-300 bg-red-50/30"
                              : getWarn("ticketSizeMin") ? "border-amber-300 bg-amber-50/20"
                              : getOk("ticketSizeMin")   ? "border-green-400 bg-green-50/20"
                              : ""
                            }`}
                          />
                          <FieldError   message={getErr("ticketSizeMin")} />
                          <FieldWarning message={!getErr("ticketSizeMin") ? getWarn("ticketSizeMin") : undefined} />
                          <FieldSuccess message={getOk("ticketSizeMin")} />
                        </div>
                        <span className="text-sm text-forest/40 pt-8 text-center">to</span>
                        <div>
                          <label className="label-style" htmlFor="ticketSizeMax">Maximum ($)</label>
                          <input
                            id="ticketSizeMax" type="number" min={1}
                            value={form.ticketSizeMax}
                            onChange={(e) => update("ticketSizeMax", e.target.value)}
                            placeholder="e.g. 500000"
                            className={`input-field ${
                              getErr("ticketSizeMax")  ? "border-red-300 bg-red-50/30"
                              : getOk("ticketSizeMax")   ? "border-green-400 bg-green-50/20"
                              : ""
                            }`}
                          />
                          <FieldError   message={getErr("ticketSizeMax")} />
                          <FieldSuccess message={getOk("ticketSizeMax")} />
                        </div>
                      </div>

                      {/* Range preview */}
                      {form.ticketSizeMin && form.ticketSizeMax &&
                       Number(form.ticketSizeMin) > 0 && Number(form.ticketSizeMax) > 0 &&
                       Number(form.ticketSizeMax) >= Number(form.ticketSizeMin) && (
                        <div className="p-4 bg-forest/5 rounded-xl border border-forest/10">
                          <p className="text-xs font-bold uppercase tracking-widest text-forest/40 mb-1">Range Preview</p>
                          <p className="text-forest font-medium">
                            ${Number(form.ticketSizeMin).toLocaleString()} — ${Number(form.ticketSizeMax).toLocaleString()}
                          </p>
                          <p className="text-xs text-forest/40 mt-1">
                            This range will be shown to founders evaluating fit
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-forest/40">
                        Leave blank if your ticket size varies significantly by deal or stage.
                      </p>
                    </section>
                  )}

                  {/* ── Step 4: Thesis ── */}
                  {currentStep === 3 && (
                    <section className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Investment Thesis</h2>
                        <p className="text-sm text-forest/50 mt-1">The conviction behind your capital.</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="investmentThesis">Thesis</label>
                          <span className="text-[10px] text-forest/30">{form.investmentThesis.length}/2000</span>
                        </div>
                        <textarea
                          id="investmentThesis" rows={7} maxLength={2000}
                          value={form.investmentThesis}
                          onChange={(e) => update("investmentThesis", e.target.value)}
                          placeholder={`e.g. "We invest in early-stage SaaS solving India-specific problems in fintech and healthtech. We look for mission-driven founders with deep domain expertise and a clear path to regional leadership within 18 months of seed."`}
                          className={`input-field resize-none ${
                            getWarn("investmentThesis") ? "border-amber-300 bg-amber-50/20"
                            : getOk("investmentThesis")  ? "border-green-400 bg-green-50/20"
                            : ""
                          }`}
                        />
                        <FieldWarning message={getWarn("investmentThesis")} />
                        <FieldSuccess message={getOk("investmentThesis")} />
                        <p className="text-xs text-forest/40 mt-1.5">
                          Investors with a clear thesis are 3× more likely to get matched with relevant founders.
                        </p>
                      </div>

                      {/* Thesis prompts */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          "What sectors do you specialise in?",
                          "What stage do you prefer and why?",
                          "What kind of founder excites you?",
                          "What's your typical hold period?",
                        ].map(prompt => (
                          <div key={prompt} className="p-3 bg-beige/60 rounded-lg border border-forest/5">
                            <p className="text-xs text-forest/50 flex items-start gap-1.5">
                              <span className="text-forest/30 flex-shrink-0 mt-0.5">→</span>
                              {prompt}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* ── Step 5: Signals ── */}
                  {currentStep === 4 && (
                    <section className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Signals</h2>
                        <p className="text-sm text-forest/50 mt-1">Fine-tune what we surface for you.</p>
                      </div>

                      <div className="border border-forest/10 rounded-xl p-5 bg-white hover:border-forest/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-forest/8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Target className="w-4 h-4 text-forest/60" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-stone">Impact Focused</p>
                              <p className="text-xs text-forest/50 mt-0.5 max-w-xs leading-relaxed">
                                Prioritise SDG-aligned, mission-driven startups in your discovery feed and matching recommendations.
                              </p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={form.impactFocused}
                              onChange={(e) => update("impactFocused", e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-forest/20 peer-checked:bg-forest rounded-full transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                          </label>
                        </div>
                        {form.impactFocused && (
                          <div className="mt-3 pt-3 border-t border-forest/8 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            <p className="text-xs text-green-700">Impact filtering active — we'll prioritise SDG-aligned founders</p>
                          </div>
                        )}
                      </div>

                      {/* Upcoming signals */}
                      <div className="space-y-2">
                        {[
                          { icon: <Zap className="w-3.5 h-3.5" />, label: "Deal flow alerts", desc: "Real-time notifications for new applications matching your thesis" },
                          { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Sector trend reports", desc: "Weekly insights on sectors you follow" },
                          { icon: <DollarSign className="w-3.5 h-3.5" />, label: "Stage-based notifications", desc: "Alerts when startups hit milestones in your preferred stages" },
                        ].map(signal => (
                          <div key={signal.label} className="border border-forest/8 rounded-xl p-4 bg-forest/2 opacity-50">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-forest/8 rounded-lg flex items-center justify-center text-forest/40">
                                {signal.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-semibold text-forest/60">{signal.label}</p>
                                  <span className="text-[9px] font-bold uppercase tracking-widest bg-forest/10 text-forest/40 px-1.5 py-0.5 rounded-full">Coming soon</span>
                                </div>
                                <p className="text-[10px] text-forest/30 mt-0.5">{signal.desc}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* ── Navigation row ── */}
                  <div className="pt-6 border-t border-forest/10 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleSaveProgress}
                      className="text-xs font-bold uppercase tracking-widest text-forest/40 hover:text-forest transition-colors flex items-center gap-1.5 py-2 flex-shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Save draft</span>
                    </button>

                    <div className="flex gap-2">
                      {currentStep > 0 && (
                        <button
                          type="button"
                          onClick={handlePrevious}
                          className="flex items-center gap-1.5 px-4 py-3 border border-forest/20 text-forest font-bold uppercase text-xs tracking-[0.15em] hover:bg-beige transition-colors rounded-lg"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          Back
                        </button>
                      )}
                      {currentStep < steps.length - 1 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="flex items-center gap-1.5 px-6 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.15em] hover:bg-forest/90 transition-colors rounded-lg shadow-sm shadow-forest/10"
                        >
                          Continue
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isPending}
                          className="flex items-center gap-2 px-6 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.15em] hover:bg-forest/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-forest/10"
                        >
                          {isPending ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                          ) : (
                            "Save Profile"
                          )}
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

      {/* ── Desktop footer ── */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* ── Mobile steps drawer ── */}
      {showMobileMenu && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-fade-in"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-forest/10 flex justify-between items-center">
              <h3 className="font-serif text-lg text-forest">All Steps</h3>
              <button onClick={() => setShowMobileMenu(false)} className="w-8 h-8 rounded-full bg-forest/5 flex items-center justify-center">
                <X className="w-4 h-4 text-forest" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent   = index === currentStep;
                const isAvailable = index <= currentStep;
                return (
                  <button
                    key={step.num}
                    onClick={() => isAvailable && handleStepClick(index)}
                    disabled={!isAvailable}
                    className={`w-full text-left p-4 rounded-xl mb-1.5 transition-all flex items-center gap-3 ${
                      isCurrent   ? "bg-forest text-white"
                      : isCompleted ? "bg-forest/5 text-forest hover:bg-forest/10"
                      : "opacity-30 cursor-not-allowed text-forest"
                    }`}
                  >
                    <span className="text-xl w-8 text-center flex-shrink-0">{step.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? "text-white/60" : "text-forest/40"}`}>
                        {step.num} {isCompleted ? "✓" : ""}
                      </p>
                      <p className="font-bold text-sm leading-tight">{step.title}</p>
                      <p className={`text-xs mt-0.5 ${isCurrent ? "text-white/50" : "text-forest/40"}`}>{step.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Success overlay ── */}
      {showSuccess && (
        <div className="fixed inset-0 bg-forest/95 z-[100] flex items-center justify-center text-center px-6 animate-fade-in">
          <button
            onClick={() => setShowSuccess(false)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="max-w-md">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white mb-6 mx-auto animate-scale-in">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl text-white mb-4 animate-slide-up">
              Profile locked in.
            </h2>
            <p className="text-white/60 text-base leading-relaxed animate-slide-up animation-delay-150">
              Your investment lens is set. We'll start surfacing the right founders based on your thesis and preferences.
            </p>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-6 animate-slide-up animation-delay-150">
              {sectors.slice(0, 3).map(s => (
                <span key={s} className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full">{s}</span>
              ))}
              {sectors.length > 3 && (
                <span className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full">+{sectors.length - 3} more</span>
              )}
            </div>

            <p className="mt-8 text-white/30 text-xs tracking-widest uppercase animate-slide-up animation-delay-150">
              Closing in {successCountdown}s
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in    { from { opacity: 0 }                              to { opacity: 1 } }
        @keyframes slide-up   { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes scale-in   { from { opacity: 0; transform: scale(0.85) }     to { opacity: 1; transform: scale(1) } }
        @keyframes slide-left { from { transform: translateX(100%) }             to { transform: translateX(0) } }

        .animate-fade-in    { animation: fade-in 0.25s ease-out; }
        .animate-slide-up   { animation: slide-up 0.3s ease-out; }
        .animate-scale-in   { animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-slide-left { animation: slide-left 0.25s ease-out; }
        .animation-delay-150 { animation-delay: 150ms; animation-fill-mode: both; }

        @media (max-width: 1023px) { .input-field { font-size: 16px !important; } }
      `}</style>
    </div>
  );
}