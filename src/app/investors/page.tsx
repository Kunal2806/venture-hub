"use client";

import { Footer } from "@/components/home/Footer";
import { Navigation } from "@/components/home/Navigation";
import {
  AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
  Eye, EyeOff, Loader2, Save, X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { parsePhoneNumber, CountryCode } from "libphonenumber-js";
import { INVESTOR_CHAR_LIMITS } from "@/lib/investor/Investorschema ";

// Local imports
import {
  CountryData, VResult,
  steps, sectorOptions, stageOptions, geoOptions, investorTypeOptions,
  CURRENCIES, VALID_CURRENCY_CODES, TZ_TO_CC,
  formatTicketAmount, parseTicketAmount, validatePasswordValue, validate,
  MIN_TICKET,
} from "@/components/investor/types-constants";
import { FieldError, FieldWarn, FieldOk, CharCount, PasswordStrength, Tooltip, MultiToggle } from "@/components/investor/ui-components";
import { InvestorTypeDropdown, PhoneCountryDropdown, TicketAmountInput } from "@/components/investor/input-components";
import { useToast } from "@/hooks/use-toast";
// ─── Step field maps ───────────────────────────────────────────────────────────

const STEP_FIELDS: Record<number, string[]> = {
  0: ["name", "email", "password", "confirmPassword", "mobile"],
  1: ["investorType", "firmName", "designation", "websiteUrl", "linkedinUrl"],
  2: ["investmentThesis"],
  3: ["ticketSizeMin", "ticketSizeMax"],
  4: [],
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InvestorApplyPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
  const [isCheckingEmail, setIsCheckingEmail] = useState(false); 
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

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/countries")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: CountryData[]) => setCountries(data))
      .catch(() => {})
      .finally(() => setCountriesLoading(false));
  }, []);

  useEffect(() => { setIsClient(true); }, []);

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
      }));
      if (typeof p.dialCountry === "string" && p.dialCountry) setDialCountry(p.dialCountry);
      if (typeof p.ticketCurrency === "string" && VALID_CURRENCY_CODES.has(p.ticketCurrency))
        setTicketCurrency(p.ticketCurrency);
    } catch {}
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
    if (id === "password") {
      applyResult(id, validate(id, v));
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

  function getStringField(id: string): string {
    const v = form[id as keyof typeof form];
    return typeof v === "string" ? v : "";
  }

  function validateStep(step: number): boolean {
    let ok = true;
    if (step === 0) {
      const pwErr = validatePasswordValue(form.password);
      if (pwErr) { applyResult("password", { error: pwErr }); ok = false; }
      else applyResult("password", { success: "Password looks strong" });
      if (form.confirmPassword !== form.password) {
        applyResult("confirmPassword", { error: "Passwords do not match" }); ok = false;
      } else if (form.confirmPassword) {
        applyResult("confirmPassword", { success: "Passwords match" });
      } else {
        applyResult("confirmPassword", { error: "Please confirm your password" }); ok = false;
      }
    }
    if (step === 3) {
      const min = parseTicketAmount(form.ticketSizeMin);
      const max = parseTicketAmount(form.ticketSizeMax);
      if (form.ticketSizeMin && form.ticketSizeMax && !isNaN(min) && !isNaN(max) && min > max) {
        applyResult("ticketSizeMin", { error: "Minimum cannot exceed maximum" }); ok = false;
      }
    }
    for (const id of (STEP_FIELDS[step] ?? [])) {
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

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // Check email uniqueness before leaving step 0
    if (currentStep === 0) {
      try {
        setIsCheckingEmail(true);
        const res = await fetch("/api/investors/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });


        if (!res.ok) {
          toast({
            title: "Error",
            description: "This email is already registered.",
            variant: "destructive",
          });
          return;
        }
      } catch {
        toast({
          title: "Network error",
          description: "Couldn't verify your email. Check your connection and try again.",
          variant: "destructive",
        });
        return;
      } finally {
          setIsCheckingEmail(false);
      }
    }

    saveDraft();
    setCurrentStep(p => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    try {
      let formattedPhone: string | undefined;
      if (form.mobile.trim() && dialCountry) {
        try { formattedPhone = parsePhoneNumber(form.mobile, dialCountry as CountryCode).formatInternational(); }
        catch { formattedPhone = form.mobile; }
      }
      const safeCurrency = VALID_CURRENCY_CODES.has(ticketCurrency) ? ticketCurrency : "USD";
      const res = await fetch("/api/investors/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                 form.name,
          email:                form.email,
          password:             form.password,
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
        toast({
          title: "Error submitting application",
          description: data.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      try {
        sessionStorage.removeItem("vh-investor-apply-draft");
        localStorage.removeItem("vh-investor-apply-draft");
      } catch {}
      router.push("/investors/success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived values ───────────────────────────────────────────────────────────

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
                      <div>
                        <label className="label-style" htmlFor="email">Email Address <span className="text-red-400">*</span></label>
                        <input type="email" id="email" autoComplete="email"
                          className={`input-field ${fieldCls("email")}`} placeholder="jordan@meridianvc.com" value={form.email} onChange={handleChange} />
                        <FieldError msg={errs.email} /><FieldWarn msg={warns.email} /><FieldOk msg={oks.email} />
                        <p className="text-[10px] text-forest/30 mt-1">This will be your login email address.</p>
                      </div>
                      <div>
                        <label className="label-style" htmlFor="password">Password <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} id="password" autoComplete="new-password"
                            className={`input-field pr-10 ${fieldCls("password")}`} placeholder="Create a strong password"
                            value={form.password} onChange={handleChange} />
                          <button type="button" onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/30 hover:text-forest/60 transition-colors" tabIndex={-1}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <PasswordStrength password={form.password} />
                        <FieldError msg={errs.password} /><FieldOk msg={oks.password} />
                        <p className="text-[10px] text-forest/30 mt-1">Min 8 chars · lowercase · number · special character</p>
                      </div>
                      <div>
                        <label className="label-style" htmlFor="confirmPassword">Confirm Password <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" autoComplete="new-password"
                            className={`input-field pr-10 ${fieldCls("confirmPassword")}`} placeholder="Repeat your password"
                            value={form.confirmPassword} onChange={handleChange} />
                          <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/30 hover:text-forest/60 transition-colors" tabIndex={-1}>
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <FieldError msg={errs.confirmPassword} /><FieldOk msg={oks.confirmPassword} />
                      </div>
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
                            amount={form.ticketSizeMin} currency={ticketCurrency}
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
                            hasWarning={!!warns.ticketSizeMin} hasError={!!errs.ticketSizeMin}
                          />
                          <FieldError msg={errs.ticketSizeMin} /><FieldWarn msg={warns.ticketSizeMin} /><FieldOk msg={oks.ticketSizeMin} />
                        </div>
                        <div>
                          <label className="label-style mb-1.5 block">Maximum Ticket</label>
                          <TicketAmountInput
                            amount={form.ticketSizeMax} currency={ticketCurrency}
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
                            hasWarning={!!warns.ticketSizeMax} hasError={!!errs.ticketSizeMax}
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
                        <button type="button" onClick={handleNext} disabled={isCheckingEmail}
                          className="flex items-center gap-1.5 px-6 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.15em] hover:bg-forest/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-forest/10">
                          {isCheckingEmail
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Checking…</>
                            : <>Continue<ChevronRight className="w-3.5 h-3.5" /></>
                          }
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