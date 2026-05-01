"use client";

import { useState } from "react";
import { X, Plus, Save, Loader2, Star, Users } from "lucide-react";

const FOREST = "#1A362B";
const BEIGE = "#EFEBE3";
const CREAM = "#F9F7F2";

const EXPERTISE_OPTIONS = [
  "Product Strategy", "Fundraising", "Growth Marketing", "Engineering",
  "B2B Sales", "Operations", "Finance & Accounting", "Legal",
  "UI/UX Design", "Data & Analytics", "AI/ML", "Supply Chain",
  "Climate Tech", "HealthTech", "EdTech", "FinTech",
];

interface ProfileFormData {
  // Basic
  name: string;
  headline: string;
  organization: string;
  // Professional
  bio: string;
  yearsOfExperience: number;
  domains: string[];
  // Verification
  linkedinUrl: string;
  // Engagement
  acceptsPaid: boolean;
  acceptsProBono: boolean;
  // Pricing
  hourlyRate: string;
  sessionRate: string;
  // Availability
  hoursPerMonth: number;
  // Read-only
  averageRating: string;
  totalSessions: number;
}

interface ProfileFormProps {
  initialData: Partial<ProfileFormData>;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormData>({
    name:              initialData.name ?? "",
    headline:          initialData.headline ?? "",
    organization:      initialData.organization ?? "",
    bio:               initialData.bio ?? "",
    yearsOfExperience: initialData.yearsOfExperience ?? 0,
    domains:           initialData.domains ?? [],
    linkedinUrl:       initialData.linkedinUrl ?? "",
    acceptsPaid:       initialData.acceptsPaid ?? true,
    acceptsProBono:    initialData.acceptsProBono ?? false,
    hourlyRate:        initialData.hourlyRate ?? "",
    sessionRate:       initialData.sessionRate ?? "",
    hoursPerMonth:     initialData.hoursPerMonth ?? 8,
    averageRating:     initialData.averageRating ?? "—",
    totalSessions:     initialData.totalSessions ?? 0,
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [domainInput, setDomainInput] = useState("");

  function set<K extends keyof ProfileFormData>(key: K, val: ProfileFormData[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setSaved(false);
  }

  function addDomain(d: string) {
    const trimmed = d.trim();
    if (trimmed && !form.domains.includes(trimmed)) {
      set("domains", [...form.domains, trimmed]);
    }
    setDomainInput("");
  }

  function removeDomain(d: string) {
    set("domains", form.domains.filter(x => x !== d));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900)); // UI-only mock
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-8">

      {/* ── Basic Info ── */}
      <Section title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Full Name">
            <Input
              value={form.name}
              onChange={v => set("name", v)}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Designation / Headline">
            <Input
              value={form.headline}
              onChange={v => set("headline", v)}
              placeholder="ex-Google PM · B2B Expert"
            />
          </Field>
          <Field label="Current Organization" className="md:col-span-2">
            <Input
              value={form.organization}
              onChange={v => set("organization", v)}
              placeholder="Company or 'Independent'"
            />
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
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none resize-none focus:ring-1 transition-all"
              style={{
                borderColor: `${FOREST}18`,
                backgroundColor: CREAM,
                color: "#2D2D2D",
              }}
            />
          </Field>

          <Field label="Years of Experience">
            <input
              type="number"
              min={0}
              max={50}
              value={form.yearsOfExperience}
              onChange={e => set("yearsOfExperience", Number(e.target.value))}
              className="w-32 px-3.5 py-2.5 text-sm rounded-lg border outline-none focus:ring-1 transition-all"
              style={{
                borderColor: `${FOREST}18`,
                backgroundColor: CREAM,
                color: "#2D2D2D",
              }}
            />
          </Field>

          <Field label="Expertise Domains">
            {/* Quick-select chips */}
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

            {/* Custom domain input */}
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
                className="px-3 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: `${FOREST}10`, color: FOREST }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Selected custom tags (non-preset ones) */}
            {form.domains.filter(d => !EXPERTISE_OPTIONS.includes(d)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.domains
                  .filter(d => !EXPERTISE_OPTIONS.includes(d))
                  .map(d => (
                    <span
                      key={d}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: FOREST, color: "white" }}
                    >
                      {d}
                      <button onClick={() => removeDomain(d)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </Field>
        </div>
      </Section>

      {/* ── Verification ── */}
      <Section title="Verification">
        <Field label="LinkedIn URL">
          <Input
            value={form.linkedinUrl}
            onChange={v => set("linkedinUrl", v)}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </Field>
      </Section>

      {/* ── Engagement Settings ── */}
      <Section title="Engagement Settings">
        <div className="space-y-3">
          <Toggle
            label="Accepts Paid Sessions"
            sublabel="Startups can book you for a fee"
            enabled={form.acceptsPaid}
            onToggle={() => set("acceptsPaid", !form.acceptsPaid)}
          />
          <Toggle
            label="Accepts Pro-bono Sessions"
            sublabel="Offer free sessions to early-stage startups"
            enabled={form.acceptsProBono}
            onToggle={() => set("acceptsProBono", !form.acceptsProBono)}
          />
        </div>
      </Section>

      {/* ── Pricing ── */}
      <Section title="Pricing">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Hourly Rate (USD)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: `${FOREST}55` }}>$</span>
              <input
                type="number"
                min={0}
                value={form.hourlyRate}
                onChange={e => set("hourlyRate", e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3.5 py-2.5 text-sm rounded-lg border outline-none"
                style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
              />
            </div>
          </Field>
          <Field label="Session Rate (USD)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: `${FOREST}55` }}>$</span>
              <input
                type="number"
                min={0}
                value={form.sessionRate}
                onChange={e => set("sessionRate", e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3.5 py-2.5 text-sm rounded-lg border outline-none"
                style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
              />
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Availability ── */}
      <Section title="Availability">
        <Field label="Hours Available per Month">
          <input
            type="number"
            min={1}
            max={200}
            value={form.hoursPerMonth}
            onChange={e => set("hoursPerMonth", Number(e.target.value))}
            className="w-32 px-3.5 py-2.5 text-sm rounded-lg border outline-none"
            style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
          />
        </Field>
      </Section>

      {/* ── Read-only Stats ── */}
      <Section title="Your Stats">
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ backgroundColor: `${FOREST}06` }}
          >
            <Star className="w-5 h-5" style={{ color: FOREST }} />
            <div>
              <p className="text-xs" style={{ color: `${FOREST}60` }}>Average Rating</p>
              <p className="text-lg font-serif font-semibold" style={{ color: FOREST }}>
                {form.averageRating}
              </p>
            </div>
          </div>
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ backgroundColor: `${FOREST}06` }}
          >
            <Users className="w-5 h-5" style={{ color: FOREST }} />
            <div>
              <p className="text-xs" style={{ color: `${FOREST}60` }}>Total Sessions</p>
              <p className="text-lg font-serif font-semibold" style={{ color: FOREST }}>
                {form.totalSessions}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Save Button ── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-70"
          style={{ backgroundColor: FOREST, color: "white" }}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving…" : "Save Profile"}
        </button>

        {saved && (
          <span className="text-sm font-medium" style={{ color: "#065F46" }}>
            ✓ Changes saved
          </span>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-xl border p-6"
      style={{ borderColor: `${FOREST}12` }}
    >
      <h2
        className="font-serif text-base font-semibold mb-5 pb-3 border-b"
        style={{ color: FOREST, borderColor: `${FOREST}10` }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: `${FOREST}60` }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none focus:ring-1 transition-all"
      style={{
        borderColor: `${FOREST}18`,
        backgroundColor: CREAM,
        color: "#2D2D2D",
      }}
    />
  );
}

function Toggle({
  label,
  sublabel,
  enabled,
  onToggle,
}: {
  label: string;
  sublabel: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all"
      style={{
        borderColor: enabled ? `${FOREST}25` : `${FOREST}10`,
        backgroundColor: enabled ? `${FOREST}06` : "white",
      }}
      onClick={onToggle}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: FOREST }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: `${FOREST}55` }}>{sublabel}</p>
      </div>
      <div
        className="w-10 h-5.5 rounded-full relative transition-colors"
        style={{ backgroundColor: enabled ? FOREST : `${FOREST}25`, width: 40, height: 22 }}
      >
        <div
          className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all"
          style={{
            width: 18,
            height: 18,
            top: 2,
            left: enabled ? 20 : 2,
          }}
        />
      </div>
    </div>
  );
}