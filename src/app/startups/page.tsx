"use client";

import { useState, useEffect, useRef } from "react";
import {
  Save, CheckCircle, Loader2, AlertCircle, ChevronLeft,
  ChevronRight, X, Phone,
} from "lucide-react";
import { Navigation } from "@/components/home/Navigation";
import { Footer } from "@/components/home/Footer";
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from "libphonenumber-js";

// ─── Constants ────────────────────────────────────────────────────────────────

const stageMapping = {
  "Ideation":     "IDEA",
  "MVP":          "PRE_SEED",
  "Seed / Early": "SEED",
} as const;

const industryOptions = [
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

// Full country list with ISO codes and dial codes
const COUNTRIES: { code: CountryCode; dial: string; name: string }[] = [
  { code: "AF", dial: "+93",  name: "Afghanistan" },
  { code: "AL", dial: "+355", name: "Albania" },
  { code: "DZ", dial: "+213", name: "Algeria" },
  { code: "AR", dial: "+54",  name: "Argentina" },
  { code: "AM", dial: "+374", name: "Armenia" },
  { code: "AU", dial: "+61",  name: "Australia" },
  { code: "AT", dial: "+43",  name: "Austria" },
  { code: "AZ", dial: "+994", name: "Azerbaijan" },
  { code: "BH", dial: "+973", name: "Bahrain" },
  { code: "BD", dial: "+880", name: "Bangladesh" },
  { code: "BY", dial: "+375", name: "Belarus" },
  { code: "BE", dial: "+32",  name: "Belgium" },
  { code: "BO", dial: "+591", name: "Bolivia" },
  { code: "BA", dial: "+387", name: "Bosnia & Herzegovina" },
  { code: "BR", dial: "+55",  name: "Brazil" },
  { code: "BG", dial: "+359", name: "Bulgaria" },
  { code: "CA", dial: "+1",   name: "Canada" },
  { code: "CL", dial: "+56",  name: "Chile" },
  { code: "CN", dial: "+86",  name: "China" },
  { code: "CO", dial: "+57",  name: "Colombia" },
  { code: "HR", dial: "+385", name: "Croatia" },
  { code: "CY", dial: "+357", name: "Cyprus" },
  { code: "CZ", dial: "+420", name: "Czech Republic" },
  { code: "DK", dial: "+45",  name: "Denmark" },
  { code: "DO", dial: "+1",   name: "Dominican Republic" },
  { code: "EC", dial: "+593", name: "Ecuador" },
  { code: "EG", dial: "+20",  name: "Egypt" },
  { code: "ET", dial: "+251", name: "Ethiopia" },
  { code: "FI", dial: "+358", name: "Finland" },
  { code: "FR", dial: "+33",  name: "France" },
  { code: "GE", dial: "+995", name: "Georgia" },
  { code: "DE", dial: "+49",  name: "Germany" },
  { code: "GH", dial: "+233", name: "Ghana" },
  { code: "GR", dial: "+30",  name: "Greece" },
  { code: "GT", dial: "+502", name: "Guatemala" },
  { code: "HK", dial: "+852", name: "Hong Kong" },
  { code: "HU", dial: "+36",  name: "Hungary" },
  { code: "IN", dial: "+91",  name: "India" },
  { code: "ID", dial: "+62",  name: "Indonesia" },
  { code: "IR", dial: "+98",  name: "Iran" },
  { code: "IQ", dial: "+964", name: "Iraq" },
  { code: "IE", dial: "+353", name: "Ireland" },
  { code: "IL", dial: "+972", name: "Israel" },
  { code: "IT", dial: "+39",  name: "Italy" },
  { code: "JP", dial: "+81",  name: "Japan" },
  { code: "JO", dial: "+962", name: "Jordan" },
  { code: "KZ", dial: "+7",   name: "Kazakhstan" },
  { code: "KE", dial: "+254", name: "Kenya" },
  { code: "KW", dial: "+965", name: "Kuwait" },
  { code: "LB", dial: "+961", name: "Lebanon" },
  { code: "LY", dial: "+218", name: "Libya" },
  { code: "LT", dial: "+370", name: "Lithuania" },
  { code: "MY", dial: "+60",  name: "Malaysia" },
  { code: "MX", dial: "+52",  name: "Mexico" },
  { code: "MA", dial: "+212", name: "Morocco" },
  { code: "MM", dial: "+95",  name: "Myanmar" },
  { code: "NP", dial: "+977", name: "Nepal" },
  { code: "NL", dial: "+31",  name: "Netherlands" },
  { code: "NZ", dial: "+64",  name: "New Zealand" },
  { code: "NG", dial: "+234", name: "Nigeria" },
  { code: "NO", dial: "+47",  name: "Norway" },
  { code: "OM", dial: "+968", name: "Oman" },
  { code: "PK", dial: "+92",  name: "Pakistan" },
  { code: "PE", dial: "+51",  name: "Peru" },
  { code: "PH", dial: "+63",  name: "Philippines" },
  { code: "PL", dial: "+48",  name: "Poland" },
  { code: "PT", dial: "+351", name: "Portugal" },
  { code: "QA", dial: "+974", name: "Qatar" },
  { code: "RO", dial: "+40",  name: "Romania" },
  { code: "RU", dial: "+7",   name: "Russia" },
  { code: "SA", dial: "+966", name: "Saudi Arabia" },
  { code: "RS", dial: "+381", name: "Serbia" },
  { code: "SG", dial: "+65",  name: "Singapore" },
  { code: "SK", dial: "+421", name: "Slovakia" },
  { code: "ZA", dial: "+27",  name: "South Africa" },
  { code: "KR", dial: "+82",  name: "South Korea" },
  { code: "ES", dial: "+34",  name: "Spain" },
  { code: "LK", dial: "+94",  name: "Sri Lanka" },
  { code: "SD", dial: "+249", name: "Sudan" },
  { code: "SE", dial: "+46",  name: "Sweden" },
  { code: "CH", dial: "+41",  name: "Switzerland" },
  { code: "SY", dial: "+963", name: "Syria" },
  { code: "TW", dial: "+886", name: "Taiwan" },
  { code: "TZ", dial: "+255", name: "Tanzania" },
  { code: "TH", dial: "+66",  name: "Thailand" },
  { code: "TN", dial: "+216", name: "Tunisia" },
  { code: "TR", dial: "+90",  name: "Turkey" },
  { code: "UA", dial: "+380", name: "Ukraine" },
  { code: "AE", dial: "+971", name: "United Arab Emirates" },
  { code: "GB", dial: "+44",  name: "United Kingdom" },
  { code: "US", dial: "+1",   name: "United States" },
  { code: "UZ", dial: "+998", name: "Uzbekistan" },
  { code: "VE", dial: "+58",  name: "Venezuela" },
  { code: "VN", dial: "+84",  name: "Vietnam" },
  { code: "YE", dial: "+967", name: "Yemen" },
  { code: "ZM", dial: "+260", name: "Zambia" },
  { code: "ZW", dial: "+263", name: "Zimbabwe" },
].sort((a, b) => a.name.localeCompare(b.name));

// Timezone → ISO country code map for auto-detection
const TZ_TO_CC: Record<string, CountryCode> = {
  "Africa/Abidjan": "CI", "Africa/Accra": "GH", "Africa/Addis_Ababa": "ET",
  "Africa/Cairo": "EG", "Africa/Casablanca": "MA", "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE", "Africa/Tunis": "TN", "America/Bogota": "CO",
  "America/Buenos_Aires": "AR", "America/Chicago": "US", "America/Denver": "US",
  "America/Lima": "PE", "America/Los_Angeles": "US", "America/Mexico_City": "MX",
  "America/New_York": "US", "America/Phoenix": "US", "America/Santiago": "CL",
  "America/Sao_Paulo": "BR", "America/Toronto": "CA", "America/Vancouver": "CA",
  "Asia/Baghdad": "IQ", "Asia/Baku": "AZ", "Asia/Bangkok": "TH",
  "Asia/Colombo": "LK", "Asia/Dhaka": "BD", "Asia/Dubai": "AE",
  "Asia/Ho_Chi_Minh": "VN", "Asia/Hong_Kong": "HK", "Asia/Jakarta": "ID",
  "Asia/Karachi": "PK", "Asia/Kathmandu": "NP", "Asia/Kolkata": "IN",
  "Asia/Kuala_Lumpur": "MY", "Asia/Kuwait": "KW", "Asia/Manila": "PH",
  "Asia/Qatar": "QA", "Asia/Riyadh": "SA", "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN", "Asia/Singapore": "SG", "Asia/Taipei": "TW",
  "Asia/Tashkent": "UZ", "Asia/Tehran": "IR", "Asia/Tokyo": "JP",
  "Asia/Yangon": "MM", "Australia/Melbourne": "AU", "Australia/Perth": "AU",
  "Australia/Sydney": "AU", "Europe/Amsterdam": "NL", "Europe/Athens": "GR",
  "Europe/Belgrade": "RS", "Europe/Berlin": "DE", "Europe/Brussels": "BE",
  "Europe/Bucharest": "RO", "Europe/Budapest": "HU", "Europe/Copenhagen": "DK",
  "Europe/Dublin": "IE", "Europe/Helsinki": "FI", "Europe/Istanbul": "TR",
  "Europe/Kyiv": "UA", "Europe/Lisbon": "PT", "Europe/London": "GB",
  "Europe/Madrid": "ES", "Europe/Moscow": "RU", "Europe/Oslo": "NO",
  "Europe/Paris": "FR", "Europe/Prague": "CZ", "Europe/Rome": "IT",
  "Europe/Sofia": "BG", "Europe/Stockholm": "SE", "Europe/Warsaw": "PL",
  "Europe/Zurich": "CH", "Pacific/Auckland": "NZ",
};

const FREE_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "live.com", "icloud.com", "aol.com", "protonmail.com",
];

// ─── Helper components ────────────────────────────────────────────────────────

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

export default function ApplyPage() {
  const [currentStep, setCurrentStep]   = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(5);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [validationErrors,   setValidationErrors]   = useState<Record<string, string>>({});
  const [validationWarnings, setValidationWarnings] = useState<Record<string, string>>({});
  const [validationSuccess,  setValidationSuccess]  = useState<Record<string, string>>({});
  const [isClient, setIsClient]         = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Phone-specific state
  const [dialCountry, setDialCountry]   = useState<CountryCode | "">("");
  const [countryAutoFilled, setCountryAutoFilled] = useState(false);

  const [formData, setFormData] = useState({
    founderName: "", email: "", mobile: "",
    companyName: "", sector: "",
    stage: "Seed / Early" as typeof stages[number],
    country: "", websiteUrl: "",
    impactDescription: "", impactMetrics: "",
    capitalRequested: "", fundingPeriod: "", useOfFunds: "",
    pitchDeckUrl: "",
  });

  // ── Hydration guard ────────────────────────────────────────────────────────
  useEffect(() => { setIsClient(true); }, []);

  // ── Restore draft ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("venturehub-application-draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
        if (parsed.dialCountry) setDialCountry(parsed.dialCountry);
      }
    } catch {}
  }, []);

  // ── Auto-detect country from timezone ─────────────────────────────────────
  useEffect(() => {
    if (!isClient) return;
    try {
      const tz  = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const cc  = TZ_TO_CC[tz];
      if (cc && !dialCountry) {
        setDialCountry(cc);
        const found = COUNTRIES.find(c => c.code === cc);
        if (found) {
          setFormData(prev => ({ ...prev, country: found.name }));
          setCountryAutoFilled(true);
        }
      }
    } catch {}
  }, [isClient]);

  // ── Body scroll lock ───────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showMobileMenu]);

  // ── Success auto-close ─────────────────────────────────────────────────────
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

  // ── Input change handler ───────────────────────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    // Clear existing messages on edit
    if (validationErrors[id])
      setValidationErrors(prev  => { const n = { ...prev }; delete n[id]; return n; });
    if (validationWarnings[id])
      setValidationWarnings(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (validationSuccess[id])
      setValidationSuccess(prev  => { const n = { ...prev }; delete n[id]; return n; });
    setSubmitError(null);
  };

  // ── Dial country change ────────────────────────────────────────────────────
  const handleDialCountryChange = (cc: CountryCode | "") => {
    setDialCountry(cc);
    if (cc) {
      const found = COUNTRIES.find(c => c.code === cc);
      if (found) {
        setFormData(prev => ({ ...prev, country: found.name }));
        setCountryAutoFilled(true);
      }
    } else {
      setCountryAutoFilled(false);
    }
    // Re-validate mobile if already entered
    if (formData.mobile.trim()) {
      validateMobileField(formData.mobile, cc);
    }
  };

  // ── Phone validation helper (shared by validateStep & real-time) ──────────
  const validateMobileField = (
    num: string,
    cc: CountryCode | ""
  ): { error?: string; warning?: string; success?: string } => {
    if (!num.trim()) return {};
    if (!cc)
      return { warning: "Select a country code to validate the number" };
    try {
      const valid = isValidPhoneNumber(num, cc);
      if (!valid)
        return { error: "Invalid number for the selected country — check the digits" };
      const parsed = parsePhoneNumber(num, cc);
      return { success: `Valid · ${parsed.formatInternational()}` };
    } catch {
      return { error: "Could not parse — check the number format" };
    }
  };

  // ── Step validation ────────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const errors:   Record<string, string> = {};
    const warnings: Record<string, string> = {};
    const success:  Record<string, string> = {};

    // ── Step 0: Founder Identity ─────────────────────────────────────────────
    if (step === 0) {
      // Name
      const name = formData.founderName.trim();
      if (!name) {
        errors.founderName = "Please enter your full name";
      } else if (name.length < 2) {
        errors.founderName = "Name must be at least 2 characters";
      } else if (name.length > 60) {
        errors.founderName = "Name must be under 60 characters";
      } else if (!/^[A-Za-z\u00C0-\u017E\s'\-]+$/.test(name)) {
        errors.founderName = "Only letters, spaces, hyphens, and apostrophes allowed — no numbers";
      } else {
        success.founderName = "Looks good";
      }

      // Email
      const email = formData.email.trim();
      if (!email) {
        errors.email = "Please enter your email address";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        errors.email = "That doesn't look valid — try name@company.com";
      } else if (email.toLowerCase().endsWith(".con") || email.toLowerCase().endsWith(".cmo")) {
        errors.email = "Possible typo detected — did you mean .com?";
      } else {
        const domain = email.split("@")[1]?.toLowerCase();
        if (FREE_EMAIL_DOMAINS.includes(domain)) {
          warnings.email = "We recommend a professional work email";
        } else {
          success.email = "Valid email";
        }
      }

      // Mobile (optional but validated if provided)
      if (formData.mobile.trim()) {
        const result = validateMobileField(formData.mobile, dialCountry);
        if (result.error)   errors.mobile   = result.error;
        if (result.warning) warnings.mobile = result.warning;
        if (result.success) success.mobile  = result.success;
      }
    }

    // ── Step 1: Core Concept ─────────────────────────────────────────────────
    if (step === 1) {
      if (!formData.companyName.trim()) {
        errors.companyName = "Please enter your company or project name";
      } else if (formData.companyName.trim().length < 2) {
        errors.companyName = "Company name must be at least 2 characters";
      } else {
        success.companyName = "Looks good";
      }

      if (!formData.sector) {
        errors.sector = "Please select the industry that best fits";
      }

      const url = formData.websiteUrl.trim();
      if (url) {
        if (!/^https?:\/\/.+\..+/.test(url)) {
          errors.websiteUrl = "URL must start with https:// — e.g. https://yoursite.com";
        } else if (!/^https:\/\//.test(url)) {
          warnings.websiteUrl = "Consider using https:// for a secure link";
        } else {
          success.websiteUrl = "Valid URL";
        }
      } else {
        warnings.websiteUrl = "A website builds credibility with reviewers";
      }

      if (!formData.country.trim()) {
        warnings.country = "Adding your country helps us match regional investors";
      }
    }

    // ── Step 2: Impact Resonance ─────────────────────────────────────────────
    if (step === 2) {
      if (!formData.impactDescription.trim()) {
        warnings.impactDescription = "Founders who describe their impact get reviewed 2× faster";
      } else if (formData.impactDescription.trim().length < 30) {
        warnings.impactDescription = "A bit more detail helps reviewers understand your mission";
      } else {
        success.impactDescription = "Great — this adds real depth to your application";
      }
    }

    // ── Step 3: Capital Needs ────────────────────────────────────────────────
    if (step === 3) {
      if (!formData.capitalRequested.trim()) {
        warnings.capitalRequested = "Specifying an amount helps investors assess fit quickly";
      }
      if (!formData.useOfFunds.trim()) {
        warnings.useOfFunds = "A brief breakdown increases reviewer confidence";
      }
      if (!formData.fundingPeriod.trim()) {
        warnings.fundingPeriod = "Let investors know your expected runway period";
      }
    }

    // ── Step 4: The Collective ───────────────────────────────────────────────
    if (step === 4) {
      const deckUrl = formData.pitchDeckUrl.trim();
      if (deckUrl) {
        if (!/^https?:\/\/.+\..+/.test(deckUrl)) {
          errors.pitchDeckUrl = "Pitch deck URL must start with https://";
        } else {
          success.pitchDeckUrl = "Link looks valid";
        }
      } else {
        warnings.pitchDeckUrl = "Applications with a pitch deck are 3× more likely to advance";
      }
    }

    setValidationErrors(errors);
    setValidationWarnings(warnings);
    setValidationSuccess(success);
    return Object.keys(errors).length === 0;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const saveDraft = () => {
    localStorage.setItem(
      "venturehub-application-draft",
      JSON.stringify({ ...formData, dialCountry })
    );
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      saveDraft(); // auto-save on every successful Continue
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
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-20 left-1/2 -translate-x-1/2 bg-forest text-white px-5 py-3 rounded-full shadow-xl z-[200] text-sm font-medium pointer-events-none";
    toast.textContent = "Progress saved ✓";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const step0Ok = validateStep(0);
    const step1Ok = validateStep(1);
    const step4Ok = validateStep(4);

    // Re-run all three so errors from the earliest failing step are shown
    if (!step0Ok || !step1Ok || !step4Ok) {
      setSubmitError("Some required fields are missing. Please review each step.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      localStorage.setItem("application-email", formData.email);

      const fullDescription = [
        `Impact: ${formData.impactDescription  || "—"}`,
        `Metrics: ${formData.impactMetrics     || "—"}`,
        `Use of Funds: ${formData.useOfFunds   || "—"}`,
        `Period: ${formData.fundingPeriod      || "—"}`,
        `Capital: ${formData.capitalRequested  || "—"}`,
      ].join("\n");

      // Format phone with international prefix if valid
      let formattedPhone: string | undefined;
      if (formData.mobile.trim() && dialCountry) {
        try {
          const parsed = parsePhoneNumber(formData.mobile, dialCountry);
          formattedPhone = parsed.formatInternational();
        } catch {
          formattedPhone = formData.mobile;
        }
      }

      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founderName:  formData.founderName,
          email:        formData.email,
          mobile:       formattedPhone,
          companyName:  formData.companyName,
          sector:       formData.sector,
          stage:        stageMapping[formData.stage as keyof typeof stageMapping],
          country:      formData.country || undefined,
          websiteUrl:   formData.websiteUrl || undefined,
          description:  fullDescription,
          pitchDeckUrl: formData.pitchDeckUrl || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409)
          throw new Error("An application with this email already exists. Check your inbox.");
        if (response.status === 400 && data.details)
          throw new Error(data.details.map((d: { message: string }) => d.message).join(". "));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      localStorage.removeItem("venturehub-application-draft");
      setShowSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressValue = Math.round(((currentStep + 1) / steps.length) * 100);

  // ── SSR guard ──────────────────────────────────────────────────────────────
  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation activeItem="startups" />
        <main className="flex-1 pt-16 sm:pt-20 flex items-center justify-center">
          <div className="animate-pulse text-forest/40 text-sm">Loading…</div>
        </main>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-beige/30">
      <Navigation activeItem="startups" />

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
          <div
            className="h-full bg-forest transition-all duration-500 ease-out"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>

      <main className="flex-1 pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto pt-6 lg:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-20">

            {/* ── Desktop sidebar ── */}
            <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 h-fit">
              <span className="text-forest/40 font-bold uppercase tracking-[0.4em] text-[10px] block mb-4">
                Apply for Capital
              </span>
              <h1 className="font-serif text-5xl lg:text-6xl text-forest mb-8 leading-tight">
                Plant your <span className="italic">vision.</span>
              </h1>
              <p className="text-forest/70 text-lg leading-relaxed mb-12 max-w-sm">
                We partner with founders who see beyond the horizon. Tell us about
                the legacy you intend to build.
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

            {/* ── Mobile title ── */}
            <div className="lg:hidden col-span-1 mb-5 px-1">
              <h1 className="font-serif text-3xl text-forest leading-tight">
                Plant your <span className="italic">vision.</span>
              </h1>
              <p className="text-forest/60 text-sm mt-1.5 leading-relaxed">
                We partner with founders who see beyond the horizon.
              </p>
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

                <form
                  className="p-4 sm:p-8 lg:p-12 space-y-8 lg:space-y-12"
                  onSubmit={e => e.preventDefault()}
                >

                  {/* ── Step 1: Founder Identity ── */}
                  {currentStep === 0 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">
                          Founder Identity
                        </h2>
                        <p className="text-sm text-forest/50 mt-1">
                          The heartbeat of every great venture is its architect.
                        </p>
                      </div>

                      {/* Full Name */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="founderName">
                            Full Name <span className="text-red-400">*</span>
                          </label>
                          <span className="text-[10px] text-forest/30">
                            {formData.founderName.length}/60
                          </span>
                        </div>
                        <input
                          type="text"
                          id="founderName"
                          maxLength={60}
                          autoComplete="name"
                          className={`input-field ${
                            validationErrors.founderName   ? "border-red-300 bg-red-50/30"
                            : validationSuccess.founderName ? "border-green-400 bg-green-50/20"
                            : ""
                          }`}
                          placeholder="Elara Vance"
                          value={formData.founderName}
                          onChange={handleInputChange}
                        />
                        <FieldError   message={validationErrors.founderName} />
                        <FieldSuccess message={validationSuccess.founderName} />
                        <p className="text-[10px] text-forest/30 mt-1">
                          Letters, spaces, hyphens and apostrophes only · 2–60 characters
                        </p>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="label-style" htmlFor="email">
                          Professional Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          autoComplete="email"
                          className={`input-field ${
                            validationErrors.email   ? "border-red-300 bg-red-50/30"
                            : validationWarnings.email ? "border-amber-300 bg-amber-50/20"
                            : validationSuccess.email  ? "border-green-400 bg-green-50/20"
                            : ""
                          }`}
                          placeholder="elara@aeris.bio"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                        <FieldError   message={validationErrors.email} />
                        <FieldWarning message={validationWarnings.email} />
                        <FieldSuccess message={validationSuccess.email} />
                      </div>

                      {/* Mobile + dial code */}
                      <div>
                        <label className="label-style" htmlFor="mobile">
                          Mobile{" "}
                          <span className="text-forest/30 font-normal">(optional)</span>
                        </label>

                        <div className="flex gap-2">
                          {/* Country code selector */}
                          <div className="relative flex-shrink-0">
                            <select
                              value={dialCountry}
                              onChange={e =>
                                handleDialCountryChange(e.target.value as CountryCode | "")
                              }
                              className={`input-field appearance-none cursor-pointer pr-7 ${
                                dialCountry ? "w-44" : "w-36"
                              }`}
                              style={{ fontSize: 13 }}
                              aria-label="Country code"
                            >
                              <option value="">+– Code</option>
                              {COUNTRIES.map(c => (
                                <option key={`${c.code}-${c.dial}`} value={c.code}>
                                  {c.dial} {c.name}
                                </option>
                              ))}
                            </select>
                            {/* chevron */}
                            <svg
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-forest/40 pointer-events-none"
                              viewBox="0 0 12 8" fill="none"
                            >
                              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5"
                                strokeLinecap="round" />
                            </svg>
                          </div>

                          {/* Number input */}
                          <input
                            type="tel"
                            id="mobile"
                            autoComplete="tel-national"
                            className={`input-field flex-1 ${
                              validationErrors.mobile   ? "border-red-300 bg-red-50/30"
                              : validationWarnings.mobile ? "border-amber-300 bg-amber-50/20"
                              : validationSuccess.mobile  ? "border-green-400 bg-green-50/20"
                              : ""
                            }`}
                            placeholder={
                              dialCountry === "IN" ? "98765 43210"
                              : dialCountry === "US" ? "(555) 123-4567"
                              : dialCountry === "GB" ? "07700 900123"
                              : "Enter number"
                            }
                            value={formData.mobile}
                            onChange={handleInputChange}
                          />
                        </div>

                        <FieldError   message={validationErrors.mobile} />
                        <FieldWarning message={validationWarnings.mobile} />
                        <FieldSuccess message={validationSuccess.mobile} />

                        {/* Auto-filled country indicator */}
                        {countryAutoFilled && dialCountry && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <p className="text-[10px] text-forest/50">
                              Country auto-detected from your timezone:{" "}
                              <span className="font-medium text-forest/70">
                                {COUNTRIES.find(c => c.code === dialCountry)?.name}
                              </span>
                            </p>
                          </div>
                        )}

                        <p className="text-[10px] text-forest/30 mt-1">
                          Validated via libphonenumber · number stored in international format
                        </p>
                      </div>
                    </section>
                  )}

                  {/* ── Step 2: Core Concept ── */}
                  {currentStep === 1 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">
                          Core Concept
                        </h2>
                        <p className="text-sm text-forest/50 mt-1">
                          Defining the solution and the ecosystem it inhabits.
                        </p>
                      </div>

                      {/* Company name */}
                      <div>
                        <label className="label-style" htmlFor="companyName">
                          Company Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          id="companyName"
                          className={`input-field ${
                            validationErrors.companyName   ? "border-red-300 bg-red-50/30"
                            : validationSuccess.companyName ? "border-green-400 bg-green-50/20"
                            : ""
                          }`}
                          placeholder="Aeris Bio"
                          value={formData.companyName}
                          onChange={handleInputChange}
                        />
                        <FieldError   message={validationErrors.companyName} />
                        <FieldSuccess message={validationSuccess.companyName} />
                      </div>

                      {/* Sector */}
                      <div>
                        <label className="label-style" htmlFor="sector">
                          Primary Industry <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="sector"
                          className={`input-field appearance-none cursor-pointer ${
                            validationErrors.sector ? "border-red-300 bg-red-50/30" : ""
                          }`}
                          value={formData.sector}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Industry</option>
                          {industryOptions.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <FieldError message={validationErrors.sector} />
                      </div>

                      {/* Stage */}
                      <div>
                        <label className="label-style">Current Stage</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {stages.map(stage => (
                            <label
                              key={stage}
                              className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-all ${
                                formData.stage === stage
                                  ? "bg-forest text-white border-forest shadow-sm"
                                  : "bg-beige/50 border-forest/10 hover:bg-beige"
                              }`}
                            >
                              <input
                                type="radio"
                                name="stage"
                                value={stage}
                                checked={formData.stage === stage}
                                onChange={() => setFormData(p => ({ ...p, stage }))}
                                className="sr-only"
                              />
                              <span className={`text-xs font-bold uppercase tracking-widest ${
                                formData.stage === stage ? "text-white" : "text-forest/70"
                              }`}>
                                {stage}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Country + Website */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style" htmlFor="country">
                            Country{" "}
                            <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <input
                            type="text"
                            id="country"
                            className="input-field"
                            placeholder="United States"
                            value={formData.country}
                            onChange={handleInputChange}
                          />
                          {countryAutoFilled && formData.country && (
                            <div className="flex items-center gap-1 mt-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <p className="text-[10px] text-forest/40">
                                Auto-filled from phone code
                              </p>
                            </div>
                          )}
                          <FieldWarning message={validationWarnings.country} />
                        </div>

                        <div>
                          <label className="label-style" htmlFor="websiteUrl">
                            Website{" "}
                            <span className="text-forest/30 font-normal">(optional)</span>
                          </label>
                          <input
                            type="url"
                            id="websiteUrl"
                            className={`input-field ${
                              validationErrors.websiteUrl   ? "border-red-300 bg-red-50/30"
                              : validationWarnings.websiteUrl ? "border-amber-300 bg-amber-50/20"
                              : validationSuccess.websiteUrl  ? "border-green-400 bg-green-50/20"
                              : ""
                            }`}
                            placeholder="https://aeris.bio"
                            value={formData.websiteUrl}
                            onChange={handleInputChange}
                          />
                          <FieldError   message={validationErrors.websiteUrl} />
                          <FieldWarning message={validationWarnings.websiteUrl} />
                          <FieldSuccess message={validationSuccess.websiteUrl} />
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── Step 3: Impact Resonance ── */}
                  {currentStep === 2 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">
                          Impact Resonance
                        </h2>
                        <p className="text-sm text-forest/50 mt-1">
                          How does your growth enrich the world?
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label-style" htmlFor="impactDescription">
                            Environmental or Social Impact
                          </label>
                          <span className="text-[10px] text-forest/30">
                            {formData.impactDescription.length} chars
                          </span>
                        </div>
                        <textarea
                          id="impactDescription"
                          rows={4}
                          className={`input-field resize-none ${
                            validationWarnings.impactDescription ? "border-amber-300 bg-amber-50/20"
                            : validationSuccess.impactDescription  ? "border-green-400 bg-green-50/20"
                            : ""
                          }`}
                          placeholder="Describe the intended positive ripple effects of your technology…"
                          value={formData.impactDescription}
                          onChange={handleInputChange}
                        />
                        <FieldWarning message={validationWarnings.impactDescription} />
                        <FieldSuccess message={validationSuccess.impactDescription} />
                      </div>

                      <div>
                        <label className="label-style" htmlFor="impactMetrics">
                          Target Metrics{" "}
                          <span className="text-forest/30 font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          id="impactMetrics"
                          className="input-field"
                          placeholder="e.g. 50k tons of carbon sequestered annually by 2026"
                          value={formData.impactMetrics}
                          onChange={handleInputChange}
                        />
                      </div>
                    </section>
                  )}

                  {/* ── Step 4: Capital Deployment ── */}
                  {currentStep === 3 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">
                          Capital Deployment
                        </h2>
                        <p className="text-sm text-forest/50 mt-1">
                          The tactical fuel for your strategic vision.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-style" htmlFor="capitalRequested">
                            Capital Requested (USD)
                          </label>
                          <input
                            type="text"
                            id="capitalRequested"
                            className={`input-field ${
                              validationWarnings.capitalRequested
                                ? "border-amber-300 bg-amber-50/20"
                                : ""
                            }`}
                            placeholder="$500,000"
                            value={formData.capitalRequested}
                            onChange={handleInputChange}
                          />
                          <FieldWarning message={validationWarnings.capitalRequested} />
                        </div>

                        <div>
                          <label className="label-style" htmlFor="fundingPeriod">
                            Planned Use Period
                          </label>
                          <input
                            type="text"
                            id="fundingPeriod"
                            className={`input-field ${
                              validationWarnings.fundingPeriod
                                ? "border-amber-300 bg-amber-50/20"
                                : ""
                            }`}
                            placeholder="18–24 Months"
                            value={formData.fundingPeriod}
                            onChange={handleInputChange}
                          />
                          <FieldWarning message={validationWarnings.fundingPeriod} />
                        </div>
                      </div>

                      <div>
                        <label className="label-style" htmlFor="useOfFunds">
                          Use of Funds
                        </label>
                        <textarea
                          id="useOfFunds"
                          rows={3}
                          className={`input-field resize-none ${
                            validationWarnings.useOfFunds
                              ? "border-amber-300 bg-amber-50/20"
                              : ""
                          }`}
                          placeholder="R&D, expansion into NA market, core hiring…"
                          value={formData.useOfFunds}
                          onChange={handleInputChange}
                        />
                        <FieldWarning message={validationWarnings.useOfFunds} />
                      </div>
                    </section>
                  )}

                  {/* ── Step 5: The Collective ── */}
                  {currentStep === 4 && (
                    <section className="space-y-5 animate-fade-in">
                      <div>
                        <h2 className="font-serif text-2xl lg:text-3xl text-forest">
                          The Collective
                        </h2>
                        <p className="text-sm text-forest/50 mt-1">
                          Team and outreach materials.
                        </p>
                      </div>

                      <div>
                        <label className="label-style" htmlFor="pitchDeckUrl">
                          Pitch Deck URL{" "}
                          <span className="text-forest/30 font-normal">(optional)</span>
                        </label>
                        <input
                          type="url"
                          id="pitchDeckUrl"
                          className={`input-field ${
                            validationErrors.pitchDeckUrl   ? "border-red-300 bg-red-50/30"
                            : validationWarnings.pitchDeckUrl ? "border-amber-300 bg-amber-50/20"
                            : validationSuccess.pitchDeckUrl  ? "border-green-400 bg-green-50/20"
                            : ""
                          }`}
                          placeholder="https://drive.google.com/your-pitch-deck"
                          value={formData.pitchDeckUrl}
                          onChange={handleInputChange}
                        />
                        <FieldError   message={validationErrors.pitchDeckUrl} />
                        <FieldWarning message={validationWarnings.pitchDeckUrl} />
                        <FieldSuccess message={validationSuccess.pitchDeckUrl} />
                        <p className="text-xs text-forest/40 mt-2">
                          Upload to Google Drive, Dropbox, or Notion and paste the
                          shareable link here.
                        </p>
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
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Submitting…
                            </>
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

      {/* ── Mobile steps drawer ── */}
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
                      isCurrent   ? "bg-forest text-white"
                      : isCompleted ? "bg-forest/5 text-forest hover:bg-forest/10"
                      : "opacity-30 cursor-not-allowed text-forest"
                    }`}
                  >
                    <span className="text-xl w-8 text-center flex-shrink-0">
                      {step.icon}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${
                        isCurrent ? "text-white/60" : "text-forest/40"
                      }`}>
                        {step.num} {isCompleted ? "✓" : ""}
                      </p>
                      <p className="font-bold text-sm leading-tight">{step.title}</p>
                      <p className={`text-xs mt-0.5 ${
                        isCurrent ? "text-white/50" : "text-forest/40"
                      }`}>
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

      {/* ── Footer (desktop only) ── */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* ── Success overlay ── */}
      {showSuccess && (
        <div className="fixed inset-0 bg-forest/95 z-[100] flex items-center justify-center text-center px-6 animate-fade-in">
          {/* Close button */}
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
              Application Planted.
            </h2>
            <p className="text-white/60 text-base leading-relaxed animate-slide-up animation-delay-150">
              Your vision is now in our ecosystem. Check your email for
              confirmation and next steps.
            </p>
            <p className="mt-6 text-white/30 text-xs tracking-widest uppercase animate-slide-up animation-delay-150">
              Closing in {successCountdown}s
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in    { from { opacity: 0 }                         to { opacity: 1 } }
        @keyframes slide-up   { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes scale-in   { from { opacity: 0; transform: scale(0.85) } to { opacity: 1; transform: scale(1) } }
        @keyframes slide-left { from { transform: translateX(100%) }        to { transform: translateX(0) } }

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