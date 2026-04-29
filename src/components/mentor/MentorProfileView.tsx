"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  MapPin,
  Globe,
  Linkedin,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Edit3,
  Calendar,
  TrendingUp,
  Shield,
  ChevronRight,
  User,
} from "lucide-react";
import { getMentorProfile, updateMentorProfile, calcCompletion, DAY_NAMES } from "@/lib/mentor/mentor-api";
import { EditProfileModal } from "./Editprofilemodal ";
import { MentorAvailability, MentorProfile, UserType } from "@/lib/mentor/types";

// ─── Chip ─────────────────────────────────────────────────────────────
function Chip({ label, variant = "default" }: { label: string; variant?: "default" | "moss" }) {
  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider ${
        variant === "moss"
          ? "bg-[rgba(74,93,78,0.12)] text-[#4A5D4E]"
          : "bg-[rgba(26,54,43,0.08)] text-[#1A362B]"
      }`}
    >
      {label}
    </span>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────
function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-[rgba(26,54,43,0.08)] p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[rgba(26,54,43,0.5)]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────
function StatCard({ value, label, icon: Icon }: { value: string | number; label: string; icon: React.ElementType }) {
  return (
    <div className="bg-[#F9F7F2] border border-[rgba(26,54,43,0.08)] p-5">
      <div className="flex items-start justify-between mb-3">
        <Icon size={16} className="text-[#4A5D4E]" />
      </div>
      <p className="font-serif text-2xl text-[#1A362B] mb-1">{value}</p>
      <p className="text-xs text-[rgba(26,54,43,0.5)] uppercase tracking-wider">{label}</p>
    </div>
  );
}

// ─── Profile completion bar ───────────────────────────────────────────
function CompletionBar({ score, missing }: { score: number; missing: string[] }) {
  const color = score >= 80 ? "#1A362B" : score >= 50 ? "#4A5D4E" : "#c0392b";
  return (
    <div className="bg-white border border-[rgba(26,54,43,0.08)] p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-[#4A5D4E]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[rgba(26,54,43,0.5)]">
            Profile Completion
          </span>
        </div>
        <span className="font-serif text-lg" style={{ color }}>{score}%</span>
      </div>
      <div className="h-1 bg-[#EFEBE3] w-full">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      {missing.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-[rgba(26,54,43,0.5)] mb-2">Missing fields:</p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <span
                key={m}
                className="px-2 py-0.5 text-xs bg-[#EFEBE3] text-[#4A5D4E] flex items-center gap-1"
              >
                <AlertCircle size={9} />
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
      {score === 100 && (
        <p className="mt-3 text-xs text-[#1A362B] flex items-center gap-1.5">
          <CheckCircle size={12} />
          Profile is complete — you appear in startup searches
        </p>
      )}
    </div>
  );
}

// ─── Availability display ─────────────────────────────────────────────
function AvailabilityDisplay({ slots }: { slots: MentorAvailability[] }) {
  const active = slots.filter((s) => s.isActive);
  if (active.length === 0)
    return <p className="text-sm text-[rgba(26,54,43,0.4)]">No availability configured yet.</p>;

  return (
    <div className="space-y-2">
      {active.map((s) => (
        <div key={s.id} className="flex items-center gap-3 text-sm">
          <span className="w-8 text-xs font-bold text-[#4A5D4E] uppercase">{DAY_NAMES[s.dayOfWeek]}</span>
          <div className="h-px flex-1 bg-[rgba(26,54,43,0.06)]" />
          <span className="text-[#1A362B] font-medium tabular-nums">
            {s.startTime} – {s.endTime}
          </span>
          <span className="text-xs text-[rgba(26,54,43,0.4)]">UTC</span>
        </div>
      ))}
    </div>
  );
}

// ─── Avatar placeholder ───────────────────────────────────────────────
function Avatar({ name, url, size = 80 }: { name: string; url: string | null; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center bg-[#1A362B] text-[#F9F7F2] font-serif font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────────
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-[#EFEBE3] ${className}`} />;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────
export function MentorProfileView() {
  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [availability, setAvailability] = useState<MentorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMentorProfile().then(({ user, profile, availability }) => {
      setUser(user);
      setProfile(profile);
      setAvailability(availability);
      setLoading(false);
    });
  }, []);

  const handleSave = async (data: Partial<MentorProfile>) => {
    const updated = await updateMentorProfile(data);
    setProfile(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <LoadingSkeleton />;
  if (!profile || !user) return null;

  const { score, missing } = calcCompletion(profile, user);
  const isIncomplete = score < 60;

  return (
    <div className="min-h-screen bg-[#F9F7F2]">
      {/* Toast */}
      {saved && (
        <div className="fixed top-6 right-6 z-50 bg-[#1A362B] text-[#F9F7F2] px-5 py-3 text-sm flex items-center gap-2 shadow-lg">
          <CheckCircle size={14} />
          Profile updated successfully
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <EditProfileModal
          profile={profile}
          user={user}
          onSave={handleSave}
          onClose={() => setEditOpen(false)}
        />
      )}

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Incomplete profile banner */}
        {isIncomplete && (
          <div className="mb-6 bg-[#EFEBE3] border border-[rgba(26,54,43,0.15)] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className="text-[#4A5D4E]" />
              <p className="text-sm text-[#1A362B]">
                <span className="font-semibold">Complete your profile</span> to appear in startup searches and receive mentoring requests.
              </p>
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className="text-xs font-bold uppercase tracking-wider text-[#1A362B] flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              Complete now <ChevronRight size={12} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Header Card */}
            <div className="bg-white border border-[rgba(26,54,43,0.08)] p-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar name={user.name} url={user.avatarUrl} size={80} />
                  {profile.isVerified && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1A362B] flex items-center justify-center">
                      <Shield size={10} className="text-[#F9F7F2]" />
                    </span>
                  )}
                </div>

                <h1 className="font-serif text-2xl text-[#1A362B] mb-1">{user.name}</h1>

                {profile.headline ? (
                  <p className="text-sm text-[#4A5D4E] leading-relaxed mb-4">{profile.headline}</p>
                ) : (
                  <p className="text-sm text-[rgba(26,54,43,0.3)] italic mb-4">No headline added yet</p>
                )}

                {/* Meta info */}
                <div className="w-full space-y-2 text-left">
                  {profile.city && profile.country && (
                    <div className="flex items-center gap-2 text-xs text-[rgba(26,54,43,0.6)]">
                      <MapPin size={12} />
                      {profile.city}, {profile.country}
                    </div>
                  )}
                  {profile.yearsOfExperience && (
                    <div className="flex items-center gap-2 text-xs text-[rgba(26,54,43,0.6)]">
                      <Briefcase size={12} />
                      {profile.yearsOfExperience}+ years experience
                    </div>
                  )}
                  {profile.timezone && (
                    <div className="flex items-center gap-2 text-xs text-[rgba(26,54,43,0.6)]">
                      <Clock size={12} />
                      {profile.timezone.replace("_", " ")}
                    </div>
                  )}
                </div>

                {/* Availability badge */}
                <div className={`mt-4 w-full py-2 text-center text-xs font-bold uppercase tracking-widest ${
                  profile.isAvailable
                    ? "bg-[rgba(26,54,43,0.08)] text-[#1A362B]"
                    : "bg-[#EFEBE3] text-[rgba(26,54,43,0.4)]"
                }`}>
                  {profile.isAvailable ? "✦ Available for sessions" : "Not accepting sessions"}
                </div>

                {/* Domains */}
                {profile.domains.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                    {profile.domains.map((d) => <Chip key={d} label={d} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Completion */}
            <CompletionBar score={score} missing={missing} />

            {/* Links */}
            <Section title="Links">
              <div className="space-y-3">
                {profile.linkedinUrl ? (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#1A362B] hover:opacity-70 transition-opacity group"
                  >
                    <Linkedin size={14} />
                    LinkedIn Profile
                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <p className="text-sm text-[rgba(26,54,43,0.3)] flex items-center gap-2">
                    <Linkedin size={14} />
                    No LinkedIn added
                  </p>
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#1A362B] hover:opacity-70 transition-opacity group"
                  >
                    <Globe size={14} />
                    Portfolio / Website
                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>
            </Section>

            {/* Session Pricing */}
            <Section title="Session Pricing">
              {profile.sessionPriceUsd ? (
                <div>
                  <p className="font-serif text-3xl text-[#1A362B]">
                    ${profile.sessionPriceUsd}
                    <span className="text-base text-[rgba(26,54,43,0.4)] font-sans ml-1">/ session</span>
                  </p>
                  <p className="text-xs text-[rgba(26,54,43,0.5)] mt-1">
                    {profile.sessionDurationMinutes} min • {profile.sessionDurationMinutes === 60 ? "1 hour" : `${profile.sessionDurationMinutes} min`}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[rgba(26,54,43,0.3)] italic">No pricing set yet</p>
              )}
            </Section>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Actions bar */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditOpen(true)}
                className="btn-primary bg-[#1A362B] text-[#F9F7F2] px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Edit3 size={13} />
                Edit Profile
              </button>
              <button className="border border-[rgba(26,54,43,0.2)] text-[#1A362B] px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#EFEBE3] transition-colors">
                <ExternalLink size={13} />
                View Public Profile
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                value={profile.totalSessions}
                label="Sessions Completed"
                icon={Calendar}
              />
              <StatCard
                value={profile.averageRating ? `${profile.averageRating} ★` : "—"}
                label="Average Rating"
                icon={Star}
              />
              <StatCard
                value={profile.totalRatings}
                label="Total Reviews"
                icon={User}
              />
            </div>

            {/* About */}
            <Section title="About">
              {profile.bio ? (
                <p className="text-[#2D2D2D] leading-relaxed text-[15px]">{profile.bio}</p>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <AlertCircle size={20} className="text-[rgba(26,54,43,0.2)] mb-2" />
                  <p className="text-sm text-[rgba(26,54,43,0.4)]">No bio added yet</p>
                  <button onClick={() => setEditOpen(true)} className="mt-2 text-xs text-[#1A362B] underline underline-offset-2">
                    Add your bio
                  </button>
                </div>
              )}
            </Section>

            {/* Professional Details */}
            <Section title="Professional Details">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <InfoRow label="Current Role" value={profile.headline ?? "Not set"} />
                <InfoRow label="Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : "Not set"} />
                <InfoRow label="Previous Companies" value={profile.previousCompanies ?? "Not set"} />
                <InfoRow label="Location" value={[profile.city, profile.country].filter(Boolean).join(", ") || "Not set"} />
                <InfoRow label="Session Duration" value={`${profile.sessionDurationMinutes ?? 60} minutes`} />
                <InfoRow label="Status" value={
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 ${
                    profile.approvalStatus === "APPROVED"
                      ? "bg-[rgba(26,54,43,0.08)] text-[#1A362B]"
                      : "bg-[#EFEBE3] text-[#4A5D4E]"
                  }`}>
                    {profile.approvalStatus}
                  </span>
                } />
              </div>
            </Section>

            {/* Expertise */}
            <Section title="Expertise">
              <div className="space-y-5">
                <div>
                  <p className="label-style mb-3">Domains</p>
                  {profile.domains.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.domains.map((d) => <Chip key={d} label={d} />)}
                    </div>
                  ) : (
                    <p className="text-sm text-[rgba(26,54,43,0.3)] italic">No domains selected</p>
                  )}
                </div>
                {profile.industries.length > 0 && (
                  <div>
                    <p className="label-style mb-3">Industries</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.industries.map((d) => <Chip key={d} label={d} variant="moss" />)}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Availability */}
            <Section
              title="Availability"
              action={
                <span className="text-xs text-[rgba(26,54,43,0.4)]">Times in UTC</span>
              }
            >
              <AvailabilityDisplay slots={availability} />
              {availability.length === 0 && (
                <button onClick={() => setEditOpen(true)} className="text-xs text-[#1A362B] underline underline-offset-2">
                  Configure availability
                </button>
              )}
            </Section>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Info row helper ──────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="label-style">{label}</p>
      <p className="text-sm text-[#1A362B] font-medium mt-0.5">
        {typeof value === "string" ? (value || "—") : value}
      </p>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F9F7F2] max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          <div className="bg-white border border-[rgba(26,54,43,0.08)] p-8 flex flex-col items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-none" />
            <Skeleton className="w-36 h-5" />
            <Skeleton className="w-48 h-3" />
            <Skeleton className="w-full h-8 mt-2" />
          </div>
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-20" />
        </div>
        <div className="lg:col-span-2 space-y-5">
          <Skeleton className="w-full h-10" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="w-full h-40" />
          <Skeleton className="w-full h-32" />
        </div>
      </div>
    </div>
  );
}