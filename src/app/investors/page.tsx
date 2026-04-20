"use client";

import { Footer } from "@/components/home/Footer";
import { Navigation } from "@/components/home/Navigation";
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Loader2, Save, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


// ─── Constants ────────────────────────────────────────────────────────────────

const steps = [
  { num: "01", title: "Identity",        sub: "Name & Contact",      icon: "👤" },
  { num: "02", title: "Firm Profile",    sub: "Background & Focus",  icon: "🏢" },
  { num: "03", title: "Investment Lens", sub: "Preferences & Thesis", icon: "🔭" },
  { num: "04", title: "Ticket Size",     sub: "Capital Parameters",  icon: "💰" },
  { num: "05", title: "Review",          sub: "Confirm & Submit",    icon: "✅" },
];

const sectorOptions = [
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

const stageOptions = [
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

const investorTypeOptions = [
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function MultiToggle({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const toggle = (val: string) =>
    onChange(
      selected.includes(val)
        ? selected.filter(v => v !== val)
        : [...selected, val]
    );
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => toggle(o.value)}
          className={`px-3 py-2 border rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
            selected.includes(o.value)
              ? "bg-forest text-white border-forest shadow-sm"
              : "bg-beige/50 border-forest/10 hover:bg-beige text-forest/70"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function InvestorApplyPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep]   = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isClient, setIsClient]         = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [warnings,  setWarnings]  = useState<Record<string, string>>({});
  const [successes, setSuccesses] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    // Step 0
    name:  "",
    email: "",
    mobile: "",
    // Step 1
    firmName:    "",
    designation: "",
    investorType: "",
    bio:         "",
    websiteUrl:  "",
    linkedinUrl: "",
    country:     "",
    city:        "",
    // Step 2
    preferredSectors:     [] as string[],
    preferredStages:      [] as string[],
    preferredGeographies: [] as string[],
    impactFocused:        false,
    investmentThesis:     "",
    // Step 3
    ticketSizeMin: "",
    ticketSizeMax: "",
  });

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showMobileMenu]);

  // Restore draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vh-investor-apply-draft");
      if (saved) setForm(prev => ({ ...prev, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  const set = (key: string, value: string | boolean | string[]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev   => { const n = { ...prev }; delete n[key]; return n; });
    setWarnings(prev  => { const n = { ...prev }; delete n[key]; return n; });
    setSuccesses(prev => { const n = { ...prev }; delete n[key]; return n; });
    setSubmitError(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => set(e.target.id, e.target.value);

  const saveDraft = () =>
    localStorage.setItem("vh-investor-apply-draft", JSON.stringify(form));

  // ── Step validation ────────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const e: Record<string, string> = {};
    const w: Record<string, string> = {};
    const s: Record<string, string> = {};

    // Step 0 — Identity
    if (step === 0) {
      const name = form.name.trim();
      if (!name) {
        e.name = "Please enter your full name";
      } else if (name.length < 2) {
        e.name = "Name must be at least 2 characters";
      } else if (name.length > 60) {
        e.name = "Name must be under 60 characters";
      } else if (!/^[A-Za-z\u00C0-\u017E\s'\-]+$/.test(name)) {
        e.name = "Only letters, spaces, hyphens, and apostrophes allowed";
      } else {
        s.name = "Looks good";
      }

      const email = form.email.trim();
      if (!email) {
        e.email = "Please enter your email address";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        e.email = "That doesn't look valid — try name@company.com";
      } else if (email.toLowerCase().endsWith(".con") || email.toLowerCase().endsWith(".cmo")) {
        e.email = "Possible typo — did you mean .com?";
      } else {
        const domain = email.split("@")[1]?.toLowerCase();
        if (FREE_EMAIL_DOMAINS.includes(domain)) {
          w.email = "A professional email builds more trust with startups";
        } else {
          s.email = "Valid email";
        }
      }
    }

    // Step 1 — Firm Profile
    if (step === 1) {
      if (!form.investorType) e.investorType = "Please select your investor type";

      if (!form.firmName.trim()) {
        w.firmName = "Adding your firm or fund name increases credibility";
      } else {
        s.firmName = "Looks good";
      }

      if (!form.designation.trim()) {
        w.designation = "Your title helps startups understand your role";
      }

      const url = form.websiteUrl.trim();
      if (url) {
        if (!/^https?:\/\/.+\..+/.test(url)) {
          e.websiteUrl = "URL must start with https://";
        } else {
          s.websiteUrl = "Valid URL";
        }
      }

      const li = form.linkedinUrl.trim();
      if (li && !li.includes("linkedin.com")) {
        w.linkedinUrl = "This doesn't look like a LinkedIn URL";
      } else if (li) {
        s.linkedinUrl = "Valid LinkedIn profile";
      }
    }

    // Step 2 — Investment Lens
    if (step === 2) {
      if (form.preferredSectors.length === 0) {
        w.preferredSectors = "Select at least one sector for better startup matching";
      }
      if (form.preferredStages.length === 0) {
        w.preferredStages = "Preferred stages help surface the right opportunities";
      }
      if (!form.investmentThesis.trim()) {
        w.investmentThesis = "A clear thesis attracts better-aligned founders";
      } else if (form.investmentThesis.trim().length > 30) {
        s.investmentThesis = "Great — founders will appreciate the clarity";
      }
    }

    // Step 3 — Ticket Size
    if (step === 3) {
      const min = parseFloat(form.ticketSizeMin.replace(/[^0-9.]/g, ""));
      const max = parseFloat(form.ticketSizeMax.replace(/[^0-9.]/g, ""));

      if (!form.ticketSizeMin.trim()) {
        w.ticketSizeMin = "Specify a minimum ticket for better matches";
      }
      if (!form.ticketSizeMax.trim()) {
        w.ticketSizeMax = "Specify a maximum ticket for better matches";
      }
      if (
        form.ticketSizeMin && form.ticketSizeMax &&
        !isNaN(min) && !isNaN(max) && min > max
      ) {
        e.ticketSizeMin = "Minimum cannot exceed maximum";
      } else if (
        form.ticketSizeMin && form.ticketSizeMax &&
        !isNaN(min) && !isNaN(max)
      ) {
        s.ticketSizeMin = `Range: $${min.toLocaleString()} – $${max.toLocaleString()} USD`;
      }
    }

    setErrors(e);
    setWarnings(w);
    setSuccesses(s);
    return Object.keys(e).length === 0;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const saveDraftToast = () => {
    saveDraft();
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-20 left-1/2 -translate-x-1/2 bg-forest text-white px-5 py-3 rounded-full shadow-xl z-[200] text-sm font-medium pointer-events-none";
    toast.textContent = "Progress saved ✓";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      saveDraft();
      setCurrentStep(p => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(p => Math.max(0, p - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepClick = (i: number) => {
    if (i <= currentStep || validateStep(currentStep)) {
      setCurrentStep(i);
      setShowMobileMenu(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Re-validate the two hard-required steps
    const step0Ok = validateStep(0);
    const step1Ok = validateStep(1);

    if (!step0Ok || !step1Ok) {
      setSubmitError("Some required fields are incomplete. Please review each step.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      localStorage.setItem("investor-application-email", form.email);

      const res = await fetch("/api/investors/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                 form.name,
          email:                form.email,
          mobile:               form.mobile               || undefined,
          firmName:             form.firmName             || undefined,
          designation:          form.designation          || undefined,
          investorType:         form.investorType         || undefined,
          bio:                  form.bio                  || undefined,
          websiteUrl:           form.websiteUrl           || undefined,
          linkedinUrl:          form.linkedinUrl          || undefined,
          country:              form.country              || undefined,
          city:                 form.city                 || undefined,
          preferredSectors:     form.preferredSectors,
          preferredStages:      form.preferredStages,
          preferredGeographies: form.preferredGeographies,
          impactFocused:        form.impactFocused,
          investmentThesis:     form.investmentThesis     || undefined,
          ticketSizeMin:        form.ticketSizeMin        || undefined,
          ticketSizeMax:        form.ticketSizeMax        || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409)
          throw new Error("An application with this email already exists. Check your inbox.");
        if (res.status === 400 && data.details)
          throw new Error(
            data.details.map((d: { message: string }) => d.message).join(". ")
          );
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      localStorage.removeItem("vh-investor-apply-draft");
      router.push("/investors/success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressValue = Math.round(((currentStep + 1) / steps.length) * 100);

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

      {/* Mobile progress bar */}
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
          <div
            className="h-full bg-forest transition-all duration-500 ease-out"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>

      <main className="flex-1 pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto pt-6 lg:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-20">

            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 h-fit">
              <span className="text-forest/40 font-bold uppercase tracking-[0.4em] text-[10px] block mb-4">
                Investor Application
              </span>
              <h1 className="font-serif text-5xl lg:text-6xl text-forest mb-8 leading-tight">
                Back the <span className="italic">builders.</span>
              </h1>
              <p className="text-forest/70 text-lg leading-relaxed mb-12 max-w-sm">
                Apply to join VentureHub's curated investor community. No password
                needed — we'll set up your account once your application is approved.
              </p>
              <nav className="space-y-7 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-forest/10" />
                {steps.map(({ num, title, sub }, i) => (
                  <div
                    key={num}
                    className={`relative pl-8 flex items-center group cursor-pointer transition-all ${
                      i === currentStep ? "scale-105" : ""
                    }`}
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
                  </div>
                ))}
              </nav>
            </aside>

            {/* Mobile title */}
            <div className="lg:hidden col-span-1 mb-5 px-1">
              <h1 className="font-serif text-3xl text-forest leading-tight">
                Back the <span className="italic">builders.</span>
              </h1>
              <p className="text-forest/60 text-sm mt-1.5 leading-relaxed">
                Apply to join VentureHub's investor community.
              </p>
            </div>

            {/* Form panel */}
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

                <form
                  className="p-4 sm:p-8 lg:p-12 space-y-8 lg:space-y-12"
                  onSubmit={e => e.preventDefault()}
                >

                  {/* ── Step 0: Identity ── */}
                  {currentStep === 0 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Identity</h2>
                        <p className="text-sm text-forest/50 mt-1">
                          Tell us who you are. No password needed — we'll create your account
                          once the application is approved.
                        </p>
                      </div>

                      {/* Name */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="label-style" htmlFor="name">
                            Full Name <span className="text-red-400">*</span>
                          </label>
                          <span className="text-[10px] text-forest/30">{form.name.length}/60</span>
                        </div>
                        <input
                          type="text" id="name" maxLength={60} autoComplete="name"
                          className={`input-field ${
                            errors.name   ? "border-red-300 bg-red-50/30"
                            : successes.name ? "border-green-400 bg-green-50/20" : ""
                          }`}
                          placeholder="Jordan Wei"
                          value={form.name} onChange={handleChange}
                        />
                        <FieldError   message={errors.name} />
                        <FieldSuccess message={successes.name} />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="label-style" htmlFor="email">
                          Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email" id="email" autoComplete="email"
                          className={`input-field ${
                            errors.email    ? "border-red-300 bg-red-50/30"
                            : warnings.email  ? "border-amber-300 bg-amber-50/20"
                            : successes.email ? "border-green-400 bg-green-50/20" : ""
                          }`}
                          placeholder="jordan@meridianvc.com"
                          value={form.email} onChange={handleChange}
                        />
                        <FieldError   message={errors.email} />
                        <FieldWarning message={warnings.email} />
                        <FieldSuccess message={successes.email} />
                        <p className="text-[10px] text-forest/30 mt-1">
                          Your account will be created at this address once approved.
                        </p>
                      </div>

                      {/* Mobile (optional) */}
                      <div>
                        <label className="label-style" htmlFor="mobile">
                          Mobile{" "}
                          <span className="text-forest/30 font-normal">(optional)</span>
                        </label>
                        <input
                          type="tel" id="mobile" autoComplete="tel"
                          className="input-field"
                          placeholder="+1 555 123 4567"
                          value={form.mobile} onChange={handleChange}
                        />
                      </div>
                    </section>
                  )}

                  {/* ── Step 1: Firm Profile ── */}
                  {currentStep === 1 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Firm Profile</h2>
                        <p className="text-sm text-forest/50 mt-1">
                          Tell founders who you are and what you represent.
                        </p>
                      </div>

                      <div>
                        <label className="label-style" htmlFor="investorType">
                          Investor Type <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="investorType"
                          className={`input-field appearance-none cursor-pointer ${
                            errors.investorType ? "border-red-300 bg-red-50/30" : ""
                          }`}
                          value={form.investorType} onChange={handleChange}
                        >
                          <option value="">Select type</option>
                          {investorTypeOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <FieldError message={errors.investorType} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style" htmlFor="firmName">
                            Firm / Fund Name{" "}
                            <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <input
                            type="text" id="firmName"
                            className={`input-field ${
                              warnings.firmName  ? "border-amber-300 bg-amber-50/20"
                              : successes.firmName ? "border-green-400 bg-green-50/20" : ""
                            }`}
                            placeholder="Meridian Ventures"
                            value={form.firmName} onChange={handleChange}
                          />
                          <FieldWarning message={warnings.firmName} />
                          <FieldSuccess message={successes.firmName} />
                        </div>
                        <div>
                          <label className="label-style" htmlFor="designation">
                            Your Title{" "}
                            <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <input
                            type="text" id="designation"
                            className={`input-field ${
                              warnings.designation ? "border-amber-300 bg-amber-50/20" : ""
                            }`}
                            placeholder="Partner, Managing Director…"
                            value={form.designation} onChange={handleChange}
                          />
                          <FieldWarning message={warnings.designation} />
                        </div>
                      </div>

                      <div>
                        <label className="label-style" htmlFor="bio">
                          Short Bio{" "}
                          <span className="text-forest/30 font-normal">(optional)</span>
                        </label>
                        <textarea
                          id="bio" rows={3}
                          className="input-field resize-none"
                          placeholder="A few sentences about your investment background and philosophy…"
                          value={form.bio} onChange={handleChange}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style" htmlFor="country">
                            Country{" "}
                            <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <input type="text" id="country" className="input-field"
                            placeholder="United States"
                            value={form.country} onChange={handleChange} />
                        </div>
                        <div>
                          <label className="label-style" htmlFor="city">
                            City{" "}
                            <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <input type="text" id="city" className="input-field"
                            placeholder="San Francisco"
                            value={form.city} onChange={handleChange} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style" htmlFor="websiteUrl">
                            Website{" "}
                            <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <input
                            type="url" id="websiteUrl"
                            className={`input-field ${
                              errors.websiteUrl   ? "border-red-300 bg-red-50/30"
                              : successes.websiteUrl ? "border-green-400 bg-green-50/20" : ""
                            }`}
                            placeholder="https://meridianvc.com"
                            value={form.websiteUrl} onChange={handleChange}
                          />
                          <FieldError   message={errors.websiteUrl} />
                          <FieldSuccess message={successes.websiteUrl} />
                        </div>
                        <div>
                          <label className="label-style" htmlFor="linkedinUrl">
                            LinkedIn{" "}
                            <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <input
                            type="url" id="linkedinUrl"
                            className={`input-field ${
                              warnings.linkedinUrl  ? "border-amber-300 bg-amber-50/20"
                              : successes.linkedinUrl ? "border-green-400 bg-green-50/20" : ""
                            }`}
                            placeholder="https://linkedin.com/in/jordan-wei"
                            value={form.linkedinUrl} onChange={handleChange}
                          />
                          <FieldWarning message={warnings.linkedinUrl} />
                          <FieldSuccess message={successes.linkedinUrl} />
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── Step 2: Investment Lens ── */}
                  {currentStep === 2 && (
                    <section className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Investment Lens</h2>
                        <p className="text-sm text-forest/50 mt-1">
                          Define your focus — we'll surface the right opportunities.
                        </p>
                      </div>

                      <div>
                        <label className="label-style">Preferred Sectors</label>
                        <MultiToggle
                          options={sectorOptions}
                          selected={form.preferredSectors}
                          onChange={v => set("preferredSectors", v)}
                        />
                        <FieldWarning message={warnings.preferredSectors} />
                      </div>

                      <div>
                        <label className="label-style">Preferred Stages</label>
                        <MultiToggle
                          options={stageOptions}
                          selected={form.preferredStages}
                          onChange={v => set("preferredStages", v)}
                        />
                        <FieldWarning message={warnings.preferredStages} />
                      </div>

                      <div>
                        <label className="label-style">Preferred Geographies</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {geoOptions.map(g => (
                            <button
                              key={g} type="button"
                              onClick={() => {
                                const curr = form.preferredGeographies;
                                set(
                                  "preferredGeographies",
                                  curr.includes(g) ? curr.filter(x => x !== g) : [...curr, g]
                                );
                              }}
                              className={`px-3 py-2 border rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                form.preferredGeographies.includes(g)
                                  ? "bg-forest text-white border-forest shadow-sm"
                                  : "bg-beige/50 border-forest/10 hover:bg-beige text-forest/70"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="label-style" htmlFor="investmentThesis">
                          Investment Thesis{" "}
                          <span className="text-forest/30 font-normal">(optional)</span>
                        </label>
                        <textarea
                          id="investmentThesis" rows={4}
                          className={`input-field resize-none ${
                            warnings.investmentThesis  ? "border-amber-300 bg-amber-50/20"
                            : successes.investmentThesis ? "border-green-400 bg-green-50/20" : ""
                          }`}
                          placeholder="Describe the kind of ventures that excite you most…"
                          value={form.investmentThesis} onChange={handleChange}
                        />
                        <FieldWarning message={warnings.investmentThesis} />
                        <FieldSuccess message={successes.investmentThesis} />
                      </div>

                      {/* Impact toggle */}
                      <div className="flex items-center gap-3 p-4 bg-beige/50 rounded-xl border border-forest/8">
                        <button
                          type="button"
                          onClick={() => set("impactFocused", !form.impactFocused)}
                          className={`w-11 h-6 rounded-full transition-all flex-shrink-0 relative ${
                            form.impactFocused ? "bg-forest" : "bg-forest/20"
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                            form.impactFocused ? "left-5.5 translate-x-0.5" : "left-0.5"
                          }`} />
                        </button>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-forest">
                            Impact-focused investor
                          </p>
                          <p className="text-[10px] text-forest/50 mt-0.5">
                            Prioritise companies with measurable social or environmental outcomes
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── Step 3: Ticket Size ── */}
                  {currentStep === 3 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Ticket Size</h2>
                        <p className="text-sm text-forest/50 mt-1">
                          Set your capital deployment parameters.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style" htmlFor="ticketSizeMin">
                            Minimum Ticket (USD)
                          </label>
                          <input
                            type="text" id="ticketSizeMin"
                            className={`input-field ${
                              errors.ticketSizeMin    ? "border-red-300 bg-red-50/30"
                              : warnings.ticketSizeMin  ? "border-amber-300 bg-amber-50/20"
                              : successes.ticketSizeMin ? "border-green-400 bg-green-50/20" : ""
                            }`}
                            placeholder="$50,000"
                            value={form.ticketSizeMin} onChange={handleChange}
                          />
                          <FieldError   message={errors.ticketSizeMin} />
                          <FieldWarning message={warnings.ticketSizeMin} />
                          <FieldSuccess message={successes.ticketSizeMin} />
                        </div>
                        <div>
                          <label className="label-style" htmlFor="ticketSizeMax">
                            Maximum Ticket (USD)
                          </label>
                          <input
                            type="text" id="ticketSizeMax"
                            className={`input-field ${
                              warnings.ticketSizeMax ? "border-amber-300 bg-amber-50/20" : ""
                            }`}
                            placeholder="$500,000"
                            value={form.ticketSizeMax} onChange={handleChange}
                          />
                          <FieldWarning message={warnings.ticketSizeMax} />
                        </div>
                      </div>

                      <p className="text-[10px] text-forest/30 mt-2">
                        Used for matching only — not displayed publicly.
                      </p>
                    </section>
                  )}

                  {/* ── Step 4: Review ── */}
                  {currentStep === 4 && (
                    <section className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Review & Submit</h2>
                        <p className="text-sm text-forest/50 mt-1">
                          Confirm your details. Our team will review and be in touch within 3–5 days.
                        </p>
                      </div>

                      <div className="bg-beige/50 rounded-xl p-6 space-y-4 border border-forest/8">
                        {[
                          { label: "Name",         value: form.name },
                          { label: "Email",        value: form.email },
                          { label: "Mobile",       value: form.mobile         || "—" },
                          { label: "Investor type",value: investorTypeOptions.find(o => o.value === form.investorType)?.label || "—" },
                          { label: "Firm",         value: form.firmName       || "—" },
                          { label: "Location",     value: [form.city, form.country].filter(Boolean).join(", ") || "—" },
                          { label: "Sectors",      value: form.preferredSectors.length
                              ? form.preferredSectors.map(v => sectorOptions.find(o => o.value === v)?.label).join(", ")
                              : "—" },
                          { label: "Stages",       value: form.preferredStages.length
                              ? form.preferredStages.map(v => stageOptions.find(o => o.value === v)?.label).join(", ")
                              : "—" },
                          { label: "Ticket range", value: form.ticketSizeMin && form.ticketSizeMax
                              ? `${form.ticketSizeMin} – ${form.ticketSizeMax} USD`
                              : "—" },
                          { label: "Impact focus", value: form.impactFocused ? "Yes" : "No" },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex gap-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-forest/40 w-28 flex-shrink-0 pt-0.5">
                              {label}
                            </span>
                            <span className="text-sm text-forest/80 break-words">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Info callout */}
                      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                          After submission, our team will review your application. If approved,
                          you'll receive an email to set your password and activate your account.
                        </p>
                      </div>

                      <p className="text-xs text-forest/40 leading-relaxed">
                        By submitting you agree to VentureHub's Terms of Service and Privacy Policy.
                      </p>
                    </section>
                  )}

                  {/* Navigation row */}
                  <div className="pt-6 border-t border-forest/10 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={saveDraftToast}
                      className="text-xs font-bold uppercase tracking-widest text-forest/40 hover:text-forest transition-colors flex items-center gap-1.5 py-2 flex-shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Save</span>
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
                          disabled={isSubmitting}
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
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile steps drawer */}
      {showMobileMenu && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-fade-in"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-left"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-forest/10 flex justify-between items-center">
              <h3 className="font-serif text-lg text-forest">All Steps</h3>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="w-8 h-8 rounded-full bg-forest/5 flex items-center justify-center"
              >
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
                      isCurrent    ? "bg-forest text-white"
                      : isCompleted ? "bg-forest/5 text-forest hover:bg-forest/10"
                      : "opacity-30 cursor-not-allowed text-forest"
                    }`}
                  >
                    <span className="text-xl w-8 text-center flex-shrink-0">{step.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${
                        isCurrent ? "text-white/60" : "text-forest/40"
                      }`}>
                        {step.num} {isCompleted ? "✓" : ""}
                      </p>
                      <p className="font-bold text-sm leading-tight">{step.title}</p>
                      <p className={`text-xs mt-0.5 ${isCurrent ? "text-white/50" : "text-forest/40"}`}>
                        {step.sub}
                      </p>
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
        @keyframes fade-in    { from { opacity: 0 }                         to { opacity: 1 } }
        @keyframes slide-left { from { transform: translateX(100%) }        to { transform: translateX(0) } }
        .animate-fade-in    { animation: fade-in 0.25s ease-out; }
        .animate-slide-left { animation: slide-left 0.25s ease-out; }
        @media (max-width: 1023px) { .input-field { font-size: 16px !important; } }
      `}</style>
    </div>
  );
}