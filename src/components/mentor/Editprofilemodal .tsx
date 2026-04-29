"use client";

import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { MentorProfile, MentorProfileEditForm, UserType } from "@/lib/mentor/types";
import { DOMAIN_OPTIONS, INDUSTRY_OPTIONS } from "@/lib/mentor/mentor-api";

type Props = {
  profile: MentorProfile;
  user: UserType;
  onSave: (data: Partial<MentorProfile>) => Promise<void>;
  onClose: () => void;
};

type Errors = Partial<Record<keyof MentorProfileEditForm, string>>;

function validate(form: MentorProfileEditForm): Errors {
  const e: Errors = {};
  if (!form.headline?.trim()) e.headline = "Headline is required";
  if (!form.bio || form.bio.trim().length < 50)
    e.bio = "Bio must be at least 50 characters";
  if (!form.currentRole?.trim()) e.currentRole = "Current role is required";
  if (!form.company?.trim()) e.company = "Company is required";
  if (!form.yearsOfExperience || form.yearsOfExperience < 1 || form.yearsOfExperience > 50)
    e.yearsOfExperience = "Experience must be between 1–50 years";
  if (form.domains.length < 1 || form.domains.length > 5)
    e.domains = "Select 1–5 domains";
  if (!form.linkedinUrl?.trim())
    e.linkedinUrl = "LinkedIn URL is required";
  else if (!/linkedin\.com\/in\/.+/.test(form.linkedinUrl))
    e.linkedinUrl = "Enter a valid LinkedIn profile URL";
  return e;
}

export function EditProfileModal({ profile, user, onSave, onClose }: Props) {
  const [form, setForm] = useState<MentorProfileEditForm>({
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    currentRole: "",           // from application — mentor fills here
    company: "",
    yearsOfExperience: profile.yearsOfExperience ?? 1,
    domains: profile.domains ?? [],
    industries: profile.industries ?? [],
    linkedinUrl: profile.linkedinUrl ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    country: profile.country ?? "",
    city: profile.city ?? "",
    timezone: profile.timezone ?? "",
    sessionPriceUsd: profile.sessionPriceUsd ?? "",
    sessionDurationMinutes: profile.sessionDurationMinutes ?? 60,
    isAvailable: profile.isAvailable,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"identity" | "expertise" | "sessions">("identity");

  const set = <K extends keyof MentorProfileEditForm>(k: K, v: MentorProfileEditForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleArray = (key: "domains" | "industries", val: string) => {
    const arr = form[key];
    if (arr.includes(val)) {
      set(key, arr.filter((x) => x !== val));
    } else {
      if (key === "domains" && arr.length >= 5) return;
      set(key, [...arr, val]);
    }
  };

  const handleSubmit = async () => {
    const e = validate(form);
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSave({
        headline: form.headline,
        bio: form.bio,
        domains: form.domains,
        industries: form.industries,
        linkedinUrl: form.linkedinUrl,
        websiteUrl: form.websiteUrl || null,
        country: form.country || null,
        city: form.city || null,
        timezone: form.timezone || null,
        yearsOfExperience: form.yearsOfExperience,
        sessionPriceUsd: form.sessionPriceUsd || null,
        sessionDurationMinutes: form.sessionDurationMinutes,
        isAvailable: form.isAvailable,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "identity", label: "Identity" },
    { key: "expertise", label: "Expertise" },
    { key: "sessions", label: "Sessions" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(26,54,43,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-2xl bg-[#F9F7F2] max-h-[90vh] flex flex-col" style={{ border: "1px solid rgba(26,54,43,0.15)" }}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[rgba(26,54,43,0.1)]">
          <div>
            <h2 className="font-serif text-xl text-[#1A362B]">Edit Profile</h2>
            <p className="text-xs text-[#4A5D4E] mt-0.5">Update your professional information</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-[#EFEBE3] transition-colors">
            <X size={16} className="text-[#1A362B]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[rgba(26,54,43,0.1)]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === t.key
                  ? "text-[#1A362B] border-b-2 border-[#1A362B]"
                  : "text-[#4A5D4E] hover:text-[#1A362B]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">

          {/* ── IDENTITY TAB ── */}
          {activeTab === "identity" && (
            <>
              <Field label="Headline" error={errors.headline}>
                <input
                  className="input-field text-sm text-[#1A362B] placeholder:text-[rgba(26,54,43,0.3)]"
                  placeholder="e.g. Helping early-stage startups scale product & GTM"
                  value={form.headline}
                  onChange={(e) => set("headline", e.target.value)}
                />
              </Field>

              <Field label={`Bio (${form.bio.length} / min 50 chars)`} error={errors.bio}>
                <textarea
                  rows={5}
                  className="input-field text-sm text-[#1A362B] placeholder:text-[rgba(26,54,43,0.3)] resize-none pt-2"
                  placeholder="Tell startups who you are, what you've built, and what you help with..."
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-6">
                <Field label="Current Role" error={errors.currentRole}>
                  <input
                    className="input-field text-sm text-[#1A362B] placeholder:text-[rgba(26,54,43,0.3)]"
                    placeholder="e.g. Product Lead"
                    value={form.currentRole}
                    onChange={(e) => set("currentRole", e.target.value)}
                  />
                </Field>
                <Field label="Company" error={errors.company}>
                  <input
                    className="input-field text-sm text-[#1A362B] placeholder:text-[rgba(26,54,43,0.3)]"
                    placeholder="e.g. Stripe"
                    value={form.company}
                    onChange={(e) => set("company", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Field label="Years of Experience" error={errors.yearsOfExperience}>
                  <input
                    type="number" min={1} max={50}
                    className="input-field text-sm text-[#1A362B]"
                    value={form.yearsOfExperience}
                    onChange={(e) => set("yearsOfExperience", Number(e.target.value))}
                  />
                </Field>
                <Field label="City">
                  <input
                    className="input-field text-sm text-[#1A362B] placeholder:text-[rgba(26,54,43,0.3)]"
                    placeholder="e.g. Bangalore"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Field label="LinkedIn URL" error={errors.linkedinUrl}>
                  <input
                    className="input-field text-sm text-[#1A362B] placeholder:text-[rgba(26,54,43,0.3)]"
                    placeholder="linkedin.com/in/yourname"
                    value={form.linkedinUrl}
                    onChange={(e) => set("linkedinUrl", e.target.value)}
                  />
                </Field>
                <Field label="Website (optional)">
                  <input
                    className="input-field text-sm text-[#1A362B] placeholder:text-[rgba(26,54,43,0.3)]"
                    placeholder="yourwebsite.com"
                    value={form.websiteUrl}
                    onChange={(e) => set("websiteUrl", e.target.value)}
                  />
                </Field>
              </div>
            </>
          )}

          {/* ── EXPERTISE TAB ── */}
          {activeTab === "expertise" && (
            <>
              <Field label={`Domains (${form.domains.length}/5 selected)`} error={errors.domains}>
                <div className="flex flex-wrap gap-2 pt-2">
                  {DOMAIN_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleArray("domains", d)}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                        form.domains.includes(d)
                          ? "bg-[#1A362B] text-[#F9F7F2]"
                          : "bg-[#EFEBE3] text-[#4A5D4E] hover:bg-[#1A362B] hover:text-[#F9F7F2]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Industries">
                <div className="flex flex-wrap gap-2 pt-2">
                  {INDUSTRY_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleArray("industries", d)}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                        form.industries.includes(d)
                          ? "bg-[#4A5D4E] text-[#F9F7F2]"
                          : "bg-[#EFEBE3] text-[#4A5D4E] hover:bg-[#4A5D4E] hover:text-[#F9F7F2]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Timezone">
                <select
                  className="input-field text-sm text-[#1A362B] bg-transparent"
                  value={form.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                >
                  <option value="">Select timezone</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                </select>
              </Field>
            </>
          )}

          {/* ── SESSIONS TAB ── */}
          {activeTab === "sessions" && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <Field label="Session Price (USD)">
                  <input
                    type="number" min={0}
                    className="input-field text-sm text-[#1A362B] placeholder:text-[rgba(26,54,43,0.3)]"
                    placeholder="e.g. 80"
                    value={form.sessionPriceUsd}
                    onChange={(e) => set("sessionPriceUsd", e.target.value)}
                  />
                </Field>
                <Field label="Duration (minutes)">
                  <select
                    className="input-field text-sm text-[#1A362B] bg-transparent"
                    value={form.sessionDurationMinutes}
                    onChange={(e) => set("sessionDurationMinutes", Number(e.target.value))}
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </Field>
              </div>

              <Field label="Availability">
                <div className="flex items-center gap-3 pt-3">
                  <button
                    onClick={() => set("isAvailable", !form.isAvailable)}
                    className={`relative w-12 h-6 transition-colors ${form.isAvailable ? "bg-[#1A362B]" : "bg-[rgba(26,54,43,0.2)]"}`}
                    style={{ borderRadius: 0 }}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white transition-transform ${form.isAvailable ? "translate-x-7" : "translate-x-1"}`}
                    />
                  </button>
                  <span className="text-sm text-[#1A362B] font-medium">
                    {form.isAvailable ? "Available for sessions" : "Not accepting sessions"}
                  </span>
                </div>
              </Field>

              <div className="bg-[#EFEBE3] p-4 text-xs text-[#4A5D4E]">
                <p className="font-bold uppercase tracking-wider mb-1">Note</p>
                <p>Detailed availability slots (days & times) can be configured separately. Toggle above controls your visibility in the mentor marketplace.</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-[rgba(26,54,43,0.1)] flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-[#4A5D4E] hover:text-[#1A362B] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary bg-[#1A362B] text-[#F9F7F2] px-8 py-3 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-style">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}