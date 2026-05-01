"use client";

import { useState, useEffect } from "react";
import { X, Plus, Save, Loader2, Star, Users } from "lucide-react";

const FOREST = "#1A362B";
const CREAM = "#F9F7F2";

const EXPERTISE_OPTIONS = [
  "Product Strategy", "Fundraising", "Growth Marketing", "Engineering",
  "B2B Sales", "Operations", "Finance & Accounting", "Legal",
  "UI/UX Design", "Data & Analytics", "AI/ML", "Supply Chain",
  "Climate Tech", "HealthTech", "EdTech", "FinTech",
];

interface ProfileFormData {
  headline: string;
  bio: string;
  linkedinUrl: string;
  websiteUrl: string;
  country: string;
  city: string;
  domains: string[];
  yearsOfExperience: number;
  sessionPriceUsd: string;
  sessionDurationMinutes: number;
  timezone: string;
  isAvailable: boolean;
  averageRating: string;
  totalSessions: number;
}

const DEFAULT_FORM: ProfileFormData = {
  headline:               "",
  bio:                    "",
  linkedinUrl:            "",
  websiteUrl:             "",
  country:                "",
  city:                   "",
  domains:                [],
  yearsOfExperience:      0,
  sessionPriceUsd:        "",
  sessionDurationMinutes: 60,
  timezone:               "",
  isAvailable:            true,
  averageRating:          "—",
  totalSessions:          0,
};

export function ProfileForm() {
  const [form, setForm]           = useState<ProfileFormData>(DEFAULT_FORM);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved]         = useState(false);
  const [domainInput, setDomainInput] = useState("");

  // ── Fetch profile on mount ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/mentor/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const { data } = await res.json();
        setForm({
          headline:               data.headline               ?? "",
          bio:                    data.bio                    ?? "",
          linkedinUrl:            data.linkedinUrl            ?? "",
          websiteUrl:             data.websiteUrl             ?? "",
          country:                data.country                ?? "",
          city:                   data.city                   ?? "",
          domains:                (data.domains as string[])  ?? [],
          yearsOfExperience:      data.yearsOfExperience      ?? 0,
          sessionPriceUsd:        data.sessionPriceUsd        ?? "",
          sessionDurationMinutes: data.sessionDurationMinutes ?? 60,
          timezone:               data.timezone               ?? "",
          isAvailable:            data.isAvailable            ?? true,
          averageRating:          data.averageRating          ?? "—",
          totalSessions:          data.totalSessions          ?? 0,
        });
      } catch {
        setFetchError("Could not load your profile. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function set<K extends keyof ProfileFormData>(key: K, val: ProfileFormData[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setSaved(false);
    setSaveError("");
  }

  function addDomain(d: string) {
    const trimmed = d.trim();
    if (trimmed && !form.domains.includes(trimmed))
      set("domains", [...form.domains, trimmed]);
    setDomainInput("");
  }

  function removeDomain(d: string) {
    set("domains", form.domains.filter(x => x !== d));
  }

  // ── Save — PATCH only editable fields ──────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const res = await fetch("/api/mentor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline:               form.headline,
          bio:                    form.bio,
          linkedinUrl:            form.linkedinUrl,
          websiteUrl:             form.websiteUrl,
          country:                form.country,
          city:                   form.city,
          domains:                form.domains,
          yearsOfExperience:      form.yearsOfExperience,
          sessionPriceUsd:        form.sessionPriceUsd,
          sessionDurationMinutes: form.sessionDurationMinutes,
          timezone:               form.timezone,
          isAvailable:            form.isAvailable,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Save failed");
      }

      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // ── Loading / error states ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-sm" style={{ color: `${FOREST}60` }}>
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: FOREST }} />
        Loading your profile…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border px-5 py-4 text-sm" style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", color: "#991B1B" }}>
        {fetchError}
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Basic Info ── */}
      <Section title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Headline / Designation" className="md:col-span-2">
            <Input value={form.headline} onChange={v => set("headline", v)} placeholder="ex-Google PM · B2B Expert" />
          </Field>
          <Field label="Country">
            <Input value={form.country} onChange={v => set("country", v)} placeholder="India" />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={v => set("city", v)} placeholder="Bangalore" />
          </Field>
        </div>
      </Section>

      {/* ── Professional Details ── */}
      <Section title="Professional Details">
        <div className="space-y-5">
          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={e => set("bio", e.target.value)}
              rows={4}
              placeholder="Tell startups about your background, expertise, and how you can help them…"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none resize-none transition-all"
              style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
            />
          </Field>

          <Field label="Years of Experience">
            <input
              type="number" min={0} max={50}
              value={form.yearsOfExperience}
              onChange={e => set("yearsOfExperience", Number(e.target.value))}
              className="w-32 px-3.5 py-2.5 text-sm rounded-lg border outline-none"
              style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
            />
          </Field>

          <Field label="Expertise Domains">
            <div className="flex flex-wrap gap-2 mb-3">
              {EXPERTISE_OPTIONS.map(opt => {
                const selected = form.domains.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => selected ? removeDomain(opt) : addDomain(opt)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all border"
                    style={
                      selected
                        ? { backgroundColor: FOREST, color: "white", borderColor: FOREST }
                        : { backgroundColor: "white", color: `${FOREST}80`, borderColor: `${FOREST}20` }
                    }
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDomain(domainInput); } }}
                placeholder="Add custom domain…"
                className="flex-1 px-3.5 py-2 text-sm rounded-lg border outline-none"
                style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
              />
              <button
                onClick={() => addDomain(domainInput)}
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: `${FOREST}10`, color: FOREST }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.domains.filter(d => !EXPERTISE_OPTIONS.includes(d)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.domains.filter(d => !EXPERTISE_OPTIONS.includes(d)).map(d => (
                  <span key={d} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: FOREST, color: "white" }}>
                    {d}
                    <button onClick={() => removeDomain(d)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </Field>
        </div>
      </Section>

      {/* ── Verification ── */}
      <Section title="Verification">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="LinkedIn URL">
            <Input value={form.linkedinUrl} onChange={v => set("linkedinUrl", v)} placeholder="https://linkedin.com/in/yourprofile" />
          </Field>
          <Field label="Website URL">
            <Input value={form.websiteUrl} onChange={v => set("websiteUrl", v)} placeholder="https://yoursite.com" />
          </Field>
        </div>
      </Section>

      {/* ── Session Settings ── */}
      <Section title="Session Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Session Price (USD)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: `${FOREST}55` }}>$</span>
              <input
                type="number" min={0}
                value={form.sessionPriceUsd}
                onChange={e => set("sessionPriceUsd", e.target.value)}
                placeholder="0 for pro-bono"
                className="w-full pl-7 pr-3.5 py-2.5 text-sm rounded-lg border outline-none"
                style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
              />
            </div>
          </Field>
          <Field label="Session Duration (minutes)">
            <input
              type="number" min={15} max={180} step={15}
              value={form.sessionDurationMinutes}
              onChange={e => set("sessionDurationMinutes", Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none"
              style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
            />
          </Field>
          <Field label="Timezone" className="md:col-span-2">
            <Input value={form.timezone} onChange={v => set("timezone", v)} placeholder="Asia/Kolkata" />
          </Field>
          <Field label="Availability" className="md:col-span-2">
            <Toggle
              label="Available for Sessions"
              sublabel="Turn off to pause new bookings"
              enabled={form.isAvailable}
              onToggle={() => set("isAvailable", !form.isAvailable)}
            />
          </Field>
        </div>
      </Section>

      {/* ── Read-only Stats ── */}
      <Section title="Your Stats">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: `${FOREST}06` }}>
            <Star className="w-5 h-5" style={{ color: FOREST }} />
            <div>
              <p className="text-xs" style={{ color: `${FOREST}60` }}>Average Rating</p>
              <p className="text-lg font-serif font-semibold" style={{ color: FOREST }}>{form.averageRating}</p>
            </div>
          </div>
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: `${FOREST}06` }}>
            <Users className="w-5 h-5" style={{ color: FOREST }} />
            <div>
              <p className="text-xs" style={{ color: `${FOREST}60` }}>Total Sessions</p>
              <p className="text-lg font-serif font-semibold" style={{ color: FOREST }}>{form.totalSessions}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Save ── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-70"
          style={{ backgroundColor: FOREST, color: "white" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Profile"}
        </button>

        {saved && (
          <span className="text-sm font-medium" style={{ color: "#065F46" }}>✓ Changes saved</span>
        )}
        {saveError && (
          <span className="text-sm" style={{ color: "#991B1B" }}>{saveError}</span>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-6" style={{ borderColor: `${FOREST}12` }}>
      <h2 className="font-serif text-base font-semibold mb-5 pb-3 border-b" style={{ color: FOREST, borderColor: `${FOREST}10` }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: `${FOREST}60` }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none focus:ring-1 transition-all"
      style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
    />
  );
}

function Toggle({ label, sublabel, enabled, onToggle }: { label: string; sublabel: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all"
      style={{ borderColor: enabled ? `${FOREST}25` : `${FOREST}10`, backgroundColor: enabled ? `${FOREST}06` : "white" }}
      onClick={onToggle}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: FOREST }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: `${FOREST}55` }}>{sublabel}</p>
      </div>
      <div className="relative" style={{ backgroundColor: enabled ? FOREST : `${FOREST}25`, width: 40, height: 22, borderRadius: 11 }}>
        <div className="absolute rounded-full bg-white" style={{ width: 18, height: 18, top: 2, left: enabled ? 20 : 2, transition: "left 0.15s" }} />
      </div>
    </div>
  );
}