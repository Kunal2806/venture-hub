"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronLeft, Save, Loader2, AlertCircle,
  CheckCircle, GraduationCap, Briefcase, Globe, Users, Sparkles,
} from "lucide-react";
import { Navigation } from "@/components/home/Navigation";
import { Footer } from "@/components/home/Footer";
import { useSession } from "next-auth/react";

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MentorApplyPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [success, setSuccess]   = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    linkedinUrl: "",
    currentRole: "",
    company: "",
    yearsOfExperience: "",
    domains: [] as string[],
    bio: "",
  });

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
      const saved = localStorage.getItem("venturehub-mentor-application-draft");
      if (saved) setFormData(prev => ({ ...prev, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id])   setErrors(p   => { const n = { ...p }; delete n[id]; return n; });
    if (warnings[id]) setWarnings(p => { const n = { ...p }; delete n[id]; return n; });
    if (success[id])  setSuccess(p  => { const n = { ...p }; delete n[id]; return n; });
    setSubmitError(null);
  };

  const toggleDomain = (domain: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter(d => d !== domain)
        : [...prev.domains, domain],
    }));
    if (errors.domains) setErrors(p => { const n = { ...p }; delete n.domains; return n; });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const e: Record<string, string> = {};
    const w: Record<string, string> = {};
    const s: Record<string, string> = {};

    if (step === 0) {
      const name = formData.fullName.trim();
      if (!name)         e.fullName = "Please enter your full name";
      else if (name.length < 2) e.fullName = "Must be at least 2 characters";
      else               s.fullName = "Looks good";

      const email = formData.email.trim();
      if (!email)        e.email = "Please enter your email";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = "Invalid email format";
      else               s.email = "Valid email";

      const li = formData.linkedinUrl.trim();
      if (li && !/^https?:\/\/(www\.)?linkedin\.com\/in\//.test(li))
        e.linkedinUrl = "Must be a LinkedIn profile URL (linkedin.com/in/…)";
      else if (li) s.linkedinUrl = "Valid LinkedIn URL";
      else         w.linkedinUrl = "A LinkedIn profile builds trust with the review team";
    }

    if (step === 1) {
      if (!formData.currentRole.trim()) e.currentRole = "Please enter your current role";
      else s.currentRole = "Looks good";

      if (!formData.company.trim())     e.company = "Please enter your company or organisation";
      else s.company = "Looks good";

      const yoe = parseInt(formData.yearsOfExperience);
      if (!formData.yearsOfExperience.trim()) e.yearsOfExperience = "Required";
      else if (isNaN(yoe) || yoe < 1)         e.yearsOfExperience = "Must be at least 1 year";
      else if (yoe > 60)                       e.yearsOfExperience = "Please enter a realistic value";
      else                                     s.yearsOfExperience = `${yoe} years — great`;
    }

    if (step === 2) {
      if (formData.domains.length === 0)
        e.domains = "Select at least one domain you mentor in";
      else if (formData.domains.length < 2)
        w.domains = "Selecting 2–4 domains gives startups more ways to find you";
      else
        s.domains = `${formData.domains.length} domains selected`;
    }

    if (step === 3) {
      const bio = formData.bio.trim();
      if (!bio)           e.bio = "Please write a short bio";
      else if (bio.length < 80) e.bio = "Aim for at least 80 characters — give reviewers context";
      else                s.bio = "Strong bio";
    }

    setErrors(e);
    setWarnings(w);
    setSuccess(s);
    return Object.keys(e).length === 0;
  };

  // ── Nav ────────────────────────────────────────────────────────────────────
  const saveDraft = () => {
    localStorage.setItem("venturehub-mentor-application-draft", JSON.stringify(formData));
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      saveDraft();
      setCurrentStep(p => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(p => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStepClick = (i: number) => {
    if (i <= currentStep) { setCurrentStep(i); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  const handleSave = () => {
    saveDraft();
    const t = document.createElement("div");
    t.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-forest text-white px-5 py-3 rounded-full shadow-xl z-[200] text-sm font-medium pointer-events-none";
    t.textContent = "Progress saved ✓";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/mentor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName:          formData.fullName,
          email:             formData.email,
          mobile:            formData.mobile || undefined,
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
        if (res.status === 409) throw new Error("An application with this email already exists.");
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      localStorage.removeItem("venturehub-mentor-application-draft");
      router.push("/mentorship/success");
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
        <Navigation activeItem="home" isLoggedIn={!!session?.user} />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="animate-pulse text-forest/40 text-sm">Loading…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-beige/30">
      <Navigation activeItem="home" isLoggedIn={!!session?.user} />

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

              {/* Stats strip */}
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
                      <p className="text-red-600 text-xs mt-0.5">{submitError}</p>
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
                          <span className="text-[10px] text-forest/30">{formData.fullName.length}/60</span>
                        </div>
                        <input type="text" id="fullName" maxLength={60} autoComplete="name"
                          className={`input-field ${errors.fullName ? "border-red-300 bg-red-50/30" : success.fullName ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="Priya Nair" value={formData.fullName} onChange={handleChange}
                        />
                        <FieldError message={errors.fullName} />
                        <FieldSuccess message={success.fullName} />
                      </div>

                      <div>
                        <label className="label-style" htmlFor="email">Email <span className="text-red-400">*</span></label>
                        <input type="email" id="email" autoComplete="email"
                          className={`input-field ${errors.email ? "border-red-300 bg-red-50/30" : success.email ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="priya@example.com" value={formData.email} onChange={handleChange}
                        />
                        <FieldError message={errors.email} />
                        <FieldSuccess message={success.email} />
                      </div>

                      <div>
                        <label className="label-style" htmlFor="mobile">
                          Mobile <span className="text-forest/30 font-normal">(optional)</span>
                        </label>
                        <input type="tel" id="mobile" autoComplete="tel"
                          className="input-field" placeholder="+91 98765 43210"
                          value={formData.mobile} onChange={handleChange}
                        />
                      </div>

                      <div>
                        <label className="label-style" htmlFor="linkedinUrl">
                          LinkedIn Profile <span className="text-forest/30 font-normal">(optional but recommended)</span>
                        </label>
                        <input type="url" id="linkedinUrl"
                          className={`input-field ${errors.linkedinUrl ? "border-red-300 bg-red-50/30" : warnings.linkedinUrl ? "border-amber-300 bg-amber-50/20" : success.linkedinUrl ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="https://linkedin.com/in/yourprofile" value={formData.linkedinUrl} onChange={handleChange}
                        />
                        <FieldError message={errors.linkedinUrl} />
                        <FieldWarning message={warnings.linkedinUrl} />
                        <FieldSuccess message={success.linkedinUrl} />
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
                        <label className="label-style" htmlFor="currentRole">Current Role <span className="text-red-400">*</span></label>
                        <input type="text" id="currentRole"
                          className={`input-field ${errors.currentRole ? "border-red-300 bg-red-50/30" : success.currentRole ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="Head of Growth / Founder / VP Engineering"
                          value={formData.currentRole} onChange={handleChange}
                        />
                        <FieldError message={errors.currentRole} />
                        <FieldSuccess message={success.currentRole} />
                      </div>

                      <div>
                        <label className="label-style" htmlFor="company">Company / Organisation <span className="text-red-400">*</span></label>
                        <input type="text" id="company"
                          className={`input-field ${errors.company ? "border-red-300 bg-red-50/30" : success.company ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="Acme Corp / Self-employed"
                          value={formData.company} onChange={handleChange}
                        />
                        <FieldError message={errors.company} />
                        <FieldSuccess message={success.company} />
                      </div>

                      <div>
                        <label className="label-style" htmlFor="yearsOfExperience">
                          Years of Experience <span className="text-red-400">*</span>
                        </label>
                        <input type="number" id="yearsOfExperience" min={1} max={60}
                          className={`input-field ${errors.yearsOfExperience ? "border-red-300 bg-red-50/30" : success.yearsOfExperience ? "border-green-400 bg-green-50/20" : ""}`}
                          placeholder="8"
                          value={formData.yearsOfExperience} onChange={handleChange}
                        />
                        <FieldError message={errors.yearsOfExperience} />
                        <FieldSuccess message={success.yearsOfExperience} />
                        <p className="text-[10px] text-forest/30 mt-1">Total professional experience in years</p>
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
                        <FieldError message={errors.domains} />
                        <FieldSuccess message={success.domains} />
                        <FieldWarning message={warnings.domains} />
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
                          <span className="text-[10px] text-forest/30">{formData.bio.length} chars</span>
                        </div>
                        <textarea id="bio" rows={6}
                          className={`input-field resize-none ${
                            errors.bio ? "border-red-300 bg-red-50/30" : success.bio ? "border-green-400 bg-green-50/20" : ""
                          }`}
                          placeholder="Describe your background, the key lessons you've learned, and the kind of founders you most love working with…"
                          value={formData.bio} onChange={handleChange}
                        />
                        <FieldError message={errors.bio} />
                        <FieldSuccess message={success.bio} />
                        <p className="text-[10px] text-forest/30 mt-1">
                          Min 80 characters · This appears on your public mentor profile once approved.
                        </p>
                      </div>

                      {/* Review summary */}
                      <div className="bg-beige/60 rounded-xl p-5 border border-forest/8 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-forest/50">Application summary</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {[
                            ["Name",       formData.fullName     || "—"],
                            ["Email",      formData.email        || "—"],
                            ["Role",       formData.currentRole  || "—"],
                            ["Company",    formData.company      || "—"],
                            ["Experience", formData.yearsOfExperience ? `${formData.yearsOfExperience} yrs` : "—"],
                            ["Domains",    formData.domains.length ? `${formData.domains.length} selected` : "—"],
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

                  {/* ── Navigation ── */}
                  <div className="pt-6 border-t border-forest/10 flex items-center justify-between gap-3">
                    <button type="button" onClick={handleSave}
                      className="text-xs font-bold uppercase tracking-widest text-forest/40 hover:text-forest transition-colors flex items-center gap-1.5 py-2 flex-shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Save</span>
                    </button>

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
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="hidden lg:block"><Footer /></div>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        .animate-fade-in { animation: fade-in 0.25s ease-out; }
        @media (max-width: 1023px) { .input-field { font-size: 16px !important; } }
      `}</style>
    </div>
  );
}