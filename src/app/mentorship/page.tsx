// 

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save, CheckCircle, Loader2, AlertCircle, ChevronLeft,
  ChevronRight, X, Plus, Trash2,
} from "lucide-react";
import { Navigation } from "@/components/home/Navigation";
import { Footer } from "@/components/home/Footer";
import { useSession } from "next-auth/react";

// ─── Constants ────────────────────────────────────────────────────────────────

const steps = [
  { num: "01", title: "Identity",     sub: "Account & Contact",    icon: "👤" },
  { num: "02", title: "Expertise",    sub: "Domains & Background", icon: "🧠" },
  { num: "03", title: "Availability", sub: "Schedule & Pricing",   icon: "📅" },
  { num: "04", title: "Confirmation", sub: "Review & Submit",      icon: "✅" },
];

const domainOptions = [
  { value: "product",          label: "Product" },
  { value: "growth",           label: "Growth & Marketing" },
  { value: "fundraising",      label: "Fundraising" },
  { value: "strategy",         label: "Strategy" },
  { value: "engineering",      label: "Engineering" },
  { value: "design",           label: "Design & UX" },
  { value: "operations",       label: "Operations" },
  { value: "finance",          label: "Finance & Legal" },
  { value: "hr",               label: "People & HR" },
  { value: "sales",            label: "Sales & BD" },
  { value: "data",             label: "Data & Analytics" },
  { value: "ai-ml",            label: "AI/ML" },
  { value: "impact",           label: "Impact & ESG" },
  { value: "international",    label: "Internationalisation" },
];

const industryOptions = [
  { value: "climatetech", label: "Climatetech" },
  { value: "biotech",     label: "Biotechnology" },
  { value: "agtech",      label: "Agtech" },
  { value: "deeptech",    label: "Deeptech" },
  { value: "fintech",     label: "Fintech" },
  { value: "healthtech",  label: "Healthtech" },
  { value: "edtech",      label: "Edtech" },
  { value: "saas",        label: "SaaS" },
  { value: "ecommerce",   label: "E-commerce" },
  { value: "ai-ml",       label: "AI/ML" },
  { value: "robotics",    label: "Robotics" },
];

const formatOptions = [
  { value: "VIDEO_CALL",    label: "Video Call" },
  { value: "ASYNC_REVIEW",  label: "Async Review" },
  { value: "IN_PERSON",     label: "In Person" },
];

const daysOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const FREE_EMAIL_DOMAINS = [
  "gmail.com","yahoo.com","hotmail.com","outlook.com","live.com","icloud.com",
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
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => toggle(o.value)}
          className={`px-3 py-2 border rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
            selected.includes(o.value)
              ? "bg-forest text-white border-forest shadow-sm"
              : "bg-beige/50 border-forest/10 hover:bg-beige text-forest/70"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MentorRegisterPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep]   = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isClient, setIsClient]         = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [successes,setSuccesses]= useState<Record<string, string>>({});

  const [form, setForm] = useState({
    // Step 0
    name: "", email: "", password: "", confirmPassword: "",
    // Step 1
    headline: "", bio: "", linkedinUrl: "", websiteUrl: "",
    country: "", city: "",
    domains:    [] as string[],
    industries: [] as string[],
    yearsOfExperience: "",
    previousCompanies: "",
    // Step 2
    sessionPriceUsd: "",
    sessionDurationMinutes: "60",
    formats: [] as string[],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    isAvailable: true,
    // Availability slots: { day: 0-6, start: "09:00", end: "17:00" }[]
    availabilitySlots: [] as { day: number; start: string; end: string }[],
  });

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showMobileMenu]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vh-mentor-draft");
      if (saved) setForm(prev => ({ ...prev, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  const set = (key: string, value: string | boolean | string[] | { day: number; start: string; end: string }[]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev  => { const n = { ...prev }; delete n[key]; return n; });
    setWarnings(prev=> { const n = { ...prev }; delete n[key]; return n; });
    setSuccesses(prev=>{ const n = { ...prev }; delete n[key]; return n; });
    setSubmitError(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => set(e.target.id, e.target.value);

  const saveDraft = () =>
    localStorage.setItem("vh-mentor-draft", JSON.stringify(form));

  const addSlot = () => {
    const dayInUse = new Set(form.availabilitySlots.map(s => s.day));
    const nextDay = [1,2,3,4,5,0,6].find(d => !dayInUse.has(d)) ?? 1;
    set("availabilitySlots", [
      ...form.availabilitySlots,
      { day: nextDay, start: "09:00", end: "17:00" },
    ]);
  };

  const updateSlot = (i: number, field: "day" | "start" | "end", value: string | number) => {
    const updated = form.availabilitySlots.map((s, idx) =>
      idx === i ? { ...s, [field]: field === "day" ? Number(value) : value } : s
    );
    set("availabilitySlots", updated);
  };

  const removeSlot = (i: number) =>
    set("availabilitySlots", form.availabilitySlots.filter((_, idx) => idx !== i));

  const validateStep = (step: number): boolean => {
    const e: Record<string,string> = {};
    const w: Record<string,string> = {};
    const s: Record<string,string> = {};

    if (step === 0) {
      if (!form.name.trim()) e.name = "Full name is required";
      else if (form.name.trim().length < 2) e.name = "Name too short";
      else s.name = "Looks good";

      const email = form.email.trim();
      if (!email) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
        e.email = "Enter a valid email address";
      else {
        const domain = email.split("@")[1]?.toLowerCase();
        if (FREE_EMAIL_DOMAINS.includes(domain))
          w.email = "A professional email adds credibility to your mentor profile";
        else s.email = "Valid email";
      }

      if (!form.password) e.password = "Password is required";
      else if (form.password.length < 8) e.password = "Minimum 8 characters";
      else if (!/[A-Z]/.test(form.password)) e.password = "Include at least one uppercase letter";
      else if (!/[0-9]/.test(form.password)) e.password = "Include at least one number";
      else s.password = "Strong password";

      if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
      else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
      else if (!e.password) s.confirmPassword = "Passwords match";
    }

    if (step === 1) {
      if (!form.headline.trim()) w.headline = "A strong headline is the first thing founders see";
      else if (form.headline.trim().length < 10) w.headline = "Make it a little more descriptive";
      else s.headline = "Great headline";

      if (!form.bio.trim()) w.bio = "A bio helps founders decide who to book";
      else if (form.bio.trim().length < 50) w.bio = "A bit more context will help founders trust you";
      else s.bio = "Strong bio";

      if (form.domains.length === 0) e.domains = "Select at least one domain you can mentor in";

      if (!form.yearsOfExperience.trim()) w.yearsOfExperience = "Experience years help founders assess fit";

      const li = form.linkedinUrl.trim();
      if (!li) w.linkedinUrl = "LinkedIn is strongly recommended — it verifies your credibility";
      else if (!li.includes("linkedin.com")) w.linkedinUrl = "This doesn't look like a LinkedIn URL";
      else s.linkedinUrl = "Valid LinkedIn profile";
    }

    if (step === 2) {
      if (!form.sessionPriceUsd.trim()) {
        w.sessionPriceUsd = "Set a price — even $0 for free sessions";
      } else {
        const price = parseFloat(form.sessionPriceUsd.replace(/[^0-9.]/g,""));
        if (isNaN(price) || price < 0) e.sessionPriceUsd = "Enter a valid price";
        else s.sessionPriceUsd = price === 0 ? "Free sessions" : `$${price} USD per session`;
      }

      if (form.formats.length === 0) w.formats = "Select at least one session format";

      // Validate slots
      for (const slot of form.availabilitySlots) {
        if (slot.start >= slot.end) {
          e.availabilitySlots = "Start time must be before end time in all slots";
          break;
        }
      }
    }

    setErrors(e); setWarnings(w); setSuccesses(s);
    return Object.keys(e).length === 0;
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

  const handleSaveProgress = () => {
    saveDraft();
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-20 left-1/2 -translate-x-1/2 bg-forest text-white px-5 py-3 rounded-full shadow-xl z-[200] text-sm font-medium pointer-events-none";
    toast.textContent = "Progress saved ✓";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const handleSubmit = async () => {
    const s0 = validateStep(0);
    if (!s0) { setSubmitError("Please complete all required fields."); return; }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/register/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                   form.name,
          email:                  form.email,
          password:               form.password,
          headline:               form.headline               || undefined,
          bio:                    form.bio                   || undefined,
          linkedinUrl:            form.linkedinUrl           || undefined,
          websiteUrl:             form.websiteUrl            || undefined,
          country:                form.country               || undefined,
          city:                   form.city                  || undefined,
          domains:                form.domains,
          industries:             form.industries,
          yearsOfExperience:      form.yearsOfExperience     ? parseInt(form.yearsOfExperience) : undefined,
          previousCompanies:      form.previousCompanies     || undefined,
          sessionPriceUsd:        form.sessionPriceUsd       || undefined,
          sessionDurationMinutes: parseInt(form.sessionDurationMinutes) || 60,
          sessionFormats:         form.formats,
          timezone:               form.timezone              || undefined,
          isAvailable:            form.isAvailable,
          availabilitySlots:      form.availabilitySlots,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) throw new Error("An account with this email already exists.");
        throw new Error(data.error || "Registration failed. Please try again.");
      }
      localStorage.removeItem("vh-mentor-draft");
      router.push("/register/mentor/success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressValue = Math.round(((currentStep + 1) / steps.length) * 100);

  if (!isClient) return (
    <div className="min-h-screen flex flex-col">
      <Navigation activeItem="home" isLoggedIn={!!session?.user} />
      <main className="flex-1 pt-16 sm:pt-20 flex items-center justify-center">
        <div className="animate-pulse text-forest/40 text-sm">Loading…</div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-beige/30">
      <Navigation activeItem="home" isLoggedIn={!!session?.user} />

      {/* Mobile progress */}
      <div className="lg:hidden sticky top-16 z-40 bg-white border-b border-forest/10 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex gap-1.5 flex-shrink-0">
            {steps.map((_, i) => (
              <button key={i} onClick={() => handleStepClick(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? "w-5 bg-forest"
                  : i < currentStep  ? "w-1.5 bg-forest/50"
                  : "w-1.5 bg-forest/15"
                }`} />
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
          <button onClick={() => setShowMobileMenu(true)}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-forest/5 flex items-center justify-center text-sm">
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

            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 h-fit">
              <span className="text-forest/40 font-bold uppercase tracking-[0.4em] text-[10px] block mb-4">
                Mentor Application
              </span>
              <h1 className="font-serif text-5xl lg:text-6xl text-forest mb-8 leading-tight">
                Share your <span className="italic">wisdom.</span>
              </h1>
              <p className="text-forest/70 text-lg leading-relaxed mb-12 max-w-sm">
                Join a curated circle of mentors accelerating the world's most
                purposeful founders.
              </p>
              <div className="mb-10 p-4 bg-beige/80 rounded-xl border border-forest/8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-forest/40 mb-2">Note</p>
                <p className="text-xs text-forest/60 leading-relaxed">
                  Mentor applications are reviewed by our team. You'll receive
                  a decision within 2–3 business days.
                </p>
              </div>
              <nav className="space-y-7 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-forest/10" />
                {steps.map(({ num, title, sub }, i) => (
                  <div key={num}
                    className={`relative pl-8 flex items-center group cursor-pointer transition-all ${i === currentStep ? "scale-105" : ""}`}
                    onClick={() => handleStepClick(i)}>
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
                        i === currentStep ? "text-forest/40" : i < currentStep ? "text-forest/30" : "text-forest/20"
                      }`}>{sub}</p>
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            {/* Mobile title */}
            <div className="lg:hidden col-span-1 mb-5 px-1">
              <h1 className="font-serif text-3xl text-forest leading-tight">
                Share your <span className="italic">wisdom.</span>
              </h1>
              <p className="text-forest/60 text-sm mt-1.5 leading-relaxed">
                Apply to join VentureHub's mentor collective.
              </p>
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

                <form className="p-4 sm:p-8 lg:p-12 space-y-8 lg:space-y-12" onSubmit={e => e.preventDefault()}>

                  {/* ── Step 0: Identity ── */}
                  {currentStep === 0 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Identity</h2>
                        <p className="text-sm text-forest/50 mt-1">Create your mentor account.</p>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="label-style" htmlFor="name">Full Name <span className="text-red-400">*</span></label>
                          <span className="text-[10px] text-forest/30">{form.name.length}/60</span>
                        </div>
                        <input type="text" id="name" maxLength={60} autoComplete="name"
                          className={`input-field ${errors.name ? "border-red-300 bg-red-50/30" : successes.name ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="Dr. Priya Mehta" value={form.name} onChange={handleChange} />
                        <FieldError message={errors.name} />
                        <FieldSuccess message={successes.name} />
                      </div>

                      <div>
                        <label className="label-style" htmlFor="email">Email Address <span className="text-red-400">*</span></label>
                        <input type="email" id="email" autoComplete="email"
                          className={`input-field ${errors.email ? "border-red-300 bg-red-50/30" : warnings.email ? "border-amber-300 bg-amber-50/20" : successes.email ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="priya@nexus.ai" value={form.email} onChange={handleChange} />
                        <FieldError message={errors.email} />
                        <FieldWarning message={warnings.email} />
                        <FieldSuccess message={successes.email} />
                      </div>

                      <div>
                        <label className="label-style" htmlFor="password">Password <span className="text-red-400">*</span></label>
                        <input type="password" id="password" autoComplete="new-password"
                          className={`input-field ${errors.password ? "border-red-300 bg-red-50/30" : successes.password ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="Min. 8 chars, 1 uppercase, 1 number" value={form.password} onChange={handleChange} />
                        <FieldError message={errors.password} />
                        <FieldSuccess message={successes.password} />
                      </div>

                      <div>
                        <label className="label-style" htmlFor="confirmPassword">Confirm Password <span className="text-red-400">*</span></label>
                        <input type="password" id="confirmPassword" autoComplete="new-password"
                          className={`input-field ${errors.confirmPassword ? "border-red-300 bg-red-50/30" : successes.confirmPassword ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="Re-enter your password" value={form.confirmPassword} onChange={handleChange} />
                        <FieldError message={errors.confirmPassword} />
                        <FieldSuccess message={successes.confirmPassword} />
                      </div>
                    </section>
                  )}

                  {/* ── Step 1: Expertise ── */}
                  {currentStep === 1 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Expertise</h2>
                        <p className="text-sm text-forest/50 mt-1">Help founders understand what you bring to the table.</p>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="label-style" htmlFor="headline">
                            Headline <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <span className="text-[10px] text-forest/30">{form.headline.length}/120</span>
                        </div>
                        <input type="text" id="headline" maxLength={120}
                          className={`input-field ${warnings.headline ? "border-amber-300 bg-amber-50/20" : successes.headline ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="ex-Google PM · 12 yrs in SaaS · Seed-to-Series A specialist"
                          value={form.headline} onChange={handleChange} />
                        <FieldWarning message={warnings.headline} />
                        <FieldSuccess message={successes.headline} />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="label-style" htmlFor="bio">
                            Bio <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <span className="text-[10px] text-forest/30">{form.bio.length} chars</span>
                        </div>
                        <textarea id="bio" rows={4}
                          className={`input-field resize-none ${warnings.bio ? "border-amber-300 bg-amber-50/20" : successes.bio ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="Share your background, the companies you've built or scaled, and the type of founder you love to work with…"
                          value={form.bio} onChange={handleChange} />
                        <FieldWarning message={warnings.bio} />
                        <FieldSuccess message={successes.bio} />
                      </div>

                      <div>
                        <label className="label-style">
                          Mentoring Domains <span className="text-red-400">*</span>
                        </label>
                        <MultiToggle options={domainOptions} selected={form.domains}
                          onChange={v => set("domains", v)} />
                        <FieldError message={errors.domains} />
                      </div>

                      <div>
                        <label className="label-style">Industries</label>
                        <MultiToggle options={industryOptions} selected={form.industries}
                          onChange={v => set("industries", v)} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style" htmlFor="yearsOfExperience">
                            Years of Experience
                          </label>
                          <input type="number" id="yearsOfExperience" min={0} max={60}
                            className={`input-field ${warnings.yearsOfExperience ? "border-amber-300 bg-amber-50/20" : ""}`}
                            placeholder="12" value={form.yearsOfExperience} onChange={handleChange} />
                          <FieldWarning message={warnings.yearsOfExperience} />
                        </div>
                        <div>
                          <label className="label-style" htmlFor="previousCompanies">
                            Notable Companies <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <input type="text" id="previousCompanies"
                            className="input-field"
                            placeholder="Google, Stripe, Y Combinator…"
                            value={form.previousCompanies} onChange={handleChange} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style" htmlFor="country">Country <span className="text-forest/30 font-normal">(optional)</span></label>
                          <input type="text" id="country" className="input-field"
                            placeholder="India" value={form.country} onChange={handleChange} />
                        </div>
                        <div>
                          <label className="label-style" htmlFor="city">City <span className="text-forest/30 font-normal">(optional)</span></label>
                          <input type="text" id="city" className="input-field"
                            placeholder="Bangalore" value={form.city} onChange={handleChange} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style" htmlFor="linkedinUrl">
                            LinkedIn <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <input type="url" id="linkedinUrl"
                            className={`input-field ${warnings.linkedinUrl ? "border-amber-300 bg-amber-50/20" : successes.linkedinUrl ? "border-green-400 bg-green-50/20" : ""}`}
                            placeholder="https://linkedin.com/in/priya-mehta"
                            value={form.linkedinUrl} onChange={handleChange} />
                          <FieldWarning message={warnings.linkedinUrl} />
                          <FieldSuccess message={successes.linkedinUrl} />
                        </div>
                        <div>
                          <label className="label-style" htmlFor="websiteUrl">
                            Website <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <input type="url" id="websiteUrl" className="input-field"
                            placeholder="https://priyamehta.com"
                            value={form.websiteUrl} onChange={handleChange} />
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── Step 2: Availability ── */}
                  {currentStep === 2 && (
                    <section className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Availability</h2>
                        <p className="text-sm text-forest/50 mt-1">Configure your sessions and weekly schedule.</p>
                      </div>

                      {/* Pricing & duration */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style" htmlFor="sessionPriceUsd">
                            Session Price (USD)
                          </label>
                          <input type="text" id="sessionPriceUsd"
                            className={`input-field ${errors.sessionPriceUsd ? "border-red-300 bg-red-50/30" : warnings.sessionPriceUsd ? "border-amber-300 bg-amber-50/20" : successes.sessionPriceUsd ? "border-green-400 bg-green-50/20" : ""}`}
                            placeholder="150 (enter 0 for free)"
                            value={form.sessionPriceUsd} onChange={handleChange} />
                          <FieldError message={errors.sessionPriceUsd} />
                          <FieldWarning message={warnings.sessionPriceUsd} />
                          <FieldSuccess message={successes.sessionPriceUsd} />
                        </div>
                        <div>
                          <label className="label-style" htmlFor="sessionDurationMinutes">
                            Duration (minutes)
                          </label>
                          <select id="sessionDurationMinutes"
                            className="input-field appearance-none cursor-pointer"
                            value={form.sessionDurationMinutes} onChange={handleChange}>
                            {[30, 45, 60, 90, 120].map(d => (
                              <option key={d} value={d}>{d} minutes</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Session formats */}
                      <div>
                        <label className="label-style">Session Formats</label>
                        <MultiToggle options={formatOptions} selected={form.formats}
                          onChange={v => set("formats", v)} />
                        <FieldWarning message={warnings.formats} />
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="label-style" htmlFor="timezone">
                          Your Timezone
                        </label>
                        <input type="text" id="timezone" className="input-field"
                          placeholder="Asia/Kolkata" value={form.timezone} onChange={handleChange} />
                        <p className="text-[10px] text-forest/30 mt-1">
                          All availability slots are interpreted in this timezone.
                        </p>
                      </div>

                      {/* Availability slots */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="label-style mb-0">Weekly Availability</label>
                          <button type="button" onClick={addSlot}
                            disabled={form.availabilitySlots.length >= 7}
                            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-forest/60 hover:text-forest transition-colors disabled:opacity-30">
                            <Plus className="w-3.5 h-3.5" />
                            Add slot
                          </button>
                        </div>

                        {form.availabilitySlots.length === 0 && (
                          <p className="text-xs text-forest/40 py-3 italic">
                            No slots added yet — click "Add slot" to set your weekly availability.
                          </p>
                        )}

                        <div className="space-y-2">
                          {form.availabilitySlots.map((slot, i) => (
                            <div key={i} className="flex items-center gap-2 p-3 bg-beige/50 rounded-lg border border-forest/8">
                              <select
                                value={slot.day}
                                onChange={e => updateSlot(i, "day", e.target.value)}
                                className="input-field w-24 appearance-none cursor-pointer text-xs py-1">
                                {daysOfWeek.map((d, di) => (
                                  <option key={d} value={di}>{d}</option>
                                ))}
                              </select>
                              <input type="time" value={slot.start}
                                onChange={e => updateSlot(i, "start", e.target.value)}
                                className="input-field w-28 text-xs py-1" />
                              <span className="text-forest/30 text-xs flex-shrink-0">to</span>
                              <input type="time" value={slot.end}
                                onChange={e => updateSlot(i, "end", e.target.value)}
                                className="input-field w-28 text-xs py-1" />
                              <button type="button" onClick={() => removeSlot(i)}
                                className="ml-auto text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <FieldError message={errors.availabilitySlots} />
                      </div>

                      {/* Available toggle */}
                      <div className="flex items-center gap-3 p-4 bg-beige/50 rounded-xl border border-forest/8">
                        <button type="button"
                          onClick={() => set("isAvailable", !form.isAvailable)}
                          className={`w-11 h-6 rounded-full transition-all flex-shrink-0 relative ${
                            form.isAvailable ? "bg-forest" : "bg-forest/20"
                          }`}>
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                            form.isAvailable ? "left-5.5 translate-x-0.5" : "left-0.5"
                          }`} />
                        </button>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-forest">
                            Available for bookings
                          </p>
                          <p className="text-[10px] text-forest/50 mt-0.5">
                            You can toggle this at any time from your dashboard
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── Step 3: Review ── */}
                  {currentStep === 3 && (
                    <section className="space-y-6 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">Review & Submit</h2>
                        <p className="text-sm text-forest/50 mt-1">Confirm your application before sending it for review.</p>
                      </div>

                      <div className="bg-beige/50 rounded-xl p-6 space-y-4 border border-forest/8">
                        {[
                          { label: "Name",        value: form.name },
                          { label: "Email",       value: form.email },
                          { label: "Headline",    value: form.headline || "—" },
                          { label: "Domains",     value: form.domains.length ? form.domains.map(v => domainOptions.find(o=>o.value===v)?.label).join(", ") : "—" },
                          { label: "Industries",  value: form.industries.length ? form.industries.map(v => industryOptions.find(o=>o.value===v)?.label).join(", ") : "—" },
                          { label: "Experience",  value: form.yearsOfExperience ? `${form.yearsOfExperience} years` : "—" },
                          { label: "Location",    value: [form.city, form.country].filter(Boolean).join(", ") || "—" },
                          { label: "Price",       value: form.sessionPriceUsd ? `$${form.sessionPriceUsd} USD` : "—" },
                          { label: "Duration",    value: `${form.sessionDurationMinutes} min` },
                          { label: "Formats",     value: form.formats.length ? form.formats.map(v=>formatOptions.find(o=>o.value===v)?.label).join(", ") : "—" },
                          { label: "Availability",value: form.availabilitySlots.length ? `${form.availabilitySlots.length} slot${form.availabilitySlots.length > 1 ? "s" : ""} configured` : "No slots added" },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex gap-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-forest/40 w-28 flex-shrink-0 pt-0.5">{label}</span>
                            <span className="text-sm text-forest/80 break-words">{value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl">
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">
                          Application Review
                        </p>
                        <p className="text-xs text-amber-700/80 leading-relaxed">
                          Mentor profiles are curated by the VentureHub team. You'll receive
                          an email decision within 2–3 business days. Once approved,
                          your profile will go live and startups can begin booking sessions.
                        </p>
                      </div>

                      <p className="text-xs text-forest/40 leading-relaxed">
                        By submitting, you agree to VentureHub's Terms of Service and Mentor Code of Conduct.
                      </p>
                    </section>
                  )}

                  {/* Navigation */}
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
                          <ChevronLeft className="w-3.5 h-3.5" />
                          Back
                        </button>
                      )}
                      {currentStep < steps.length - 1 ? (
                        <button type="button" onClick={handleNext}
                          className="flex items-center gap-1.5 px-6 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.15em] hover:bg-forest/90 transition-colors rounded-lg shadow-sm shadow-forest/10">
                          Continue
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                          className="flex items-center gap-2 px-6 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.15em] hover:bg-forest/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-forest/10">
                          {isSubmitting ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</>
                          ) : "Submit Application"}
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

      {/* Mobile drawer */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-fade-in"
          onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-left"
            onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-forest/10 flex justify-between items-center">
              <h3 className="font-serif text-lg text-forest">All Steps</h3>
              <button onClick={() => setShowMobileMenu(false)}
                className="w-8 h-8 rounded-full bg-forest/5 flex items-center justify-center">
                <X className="w-4 h-4 text-forest" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent   = index === currentStep;
                const isAvailable = index <= currentStep;
                return (
                  <button key={step.num} onClick={() => isAvailable && handleStepClick(index)}
                    disabled={!isAvailable}
                    className={`w-full text-left p-4 rounded-xl mb-1.5 transition-all flex items-center gap-3 ${
                      isCurrent ? "bg-forest text-white"
                      : isCompleted ? "bg-forest/5 text-forest hover:bg-forest/10"
                      : "opacity-30 cursor-not-allowed text-forest"
                    }`}>
                    <span className="text-xl w-8 text-center flex-shrink-0">{step.icon}</span>
                    <div className="min-w-0">
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

      <div className="hidden lg:block"><Footer /></div>

      <style jsx>{`
        @keyframes fade-in    { from { opacity: 0 }                  to { opacity: 1 } }
        @keyframes slide-left { from { transform: translateX(100%) } to { transform: translateX(0) } }
        .animate-fade-in    { animation: fade-in 0.25s ease-out; }
        .animate-slide-left { animation: slide-left 0.25s ease-out; }
        @media (max-width: 1023px) { .input-field { font-size: 16px !important; } }
      `}</style>
    </div>
  );
}