"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

// ─── Types ────────────────────────────────────────────────────────────────────

interface MentorData {
  id: string
  userId: string
  name: string
  avatarUrl: string | null
  headline: string | null
  bio: string | null
  linkedinUrl: string | null
  websiteUrl: string | null
  country: string | null
  city: string | null
  domains: unknown
  industries: unknown
  yearsOfExperience: number | null
  previousCompanies: string | null
  sessionPriceUsd: string | null
  isAvailable: boolean
  totalSessions: number
  averageRating: string | null
  totalRatings: number
  isVerified: boolean
}

interface ExistingRequest {
  id: string
  status: string
}

interface Props {
  mentor: MentorData
  existingRequest: ExistingRequest | null
}

type RequestStatus = "NONE" | "REQUESTED" | "ACCEPTED" | "DECLINED" | "COMPLETED"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function asDomainArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string")
  return []
}

function deriveStatus(req: ExistingRequest | null): RequestStatus {
  if (!req) return "NONE"
  const s = req.status.toUpperCase()
  if (s === "REQUESTED") return "REQUESTED"
  if (s === "ACCEPTED") return "ACCEPTED"
  if (s === "DECLINED") return "DECLINED"
  if (s === "COMPLETED") return "COMPLETED"
  return "NONE"
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = "lg" }: { name: string; avatarUrl: string | null; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-[72px] h-[72px] text-2xl" : "w-10 h-10 text-sm"
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size === "lg" ? 72 : 40}
        height={size === "lg" ? 72 : 40}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    )
  }
  return (
    <div className={`${dim} rounded-full bg-[var(--forest)] flex items-center justify-center font-serif text-[var(--cream)] flex-shrink-0 font-semibold`}>
      {getInitials(name)}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--forest)]/40 mb-3">{children}</p>
}

function Chip({ label }: { label: string }) {
  return <span className="bg-[var(--beige)] text-[var(--forest)] text-[11px] font-bold tracking-[0.07em] uppercase px-3 py-1 border border-[var(--forest)]/12">{label}</span>
}

function ExpertiseTag({ label }: { label: string }) {
  return <span className="bg-[var(--cream)] border border-[var(--forest)]/15 text-[var(--forest)] text-[13px] font-medium px-4 py-1.5">{label}</span>
}

// ─── Request Dialog ───────────────────────────────────────────────────────────

function RequestDialog({ mentorName, mentorId, onClose, onSuccess }: {
  mentorName: string
  mentorId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [message, setMessage] = useState(
    `Hi ${mentorName.split(" ")[0]}, I'm building a startup and would love your mentorship on...`
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!message.trim()) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/mentors/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId, message }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return }
      onSuccess()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--cream)] w-full max-w-lg border border-[var(--forest)]/15">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--forest)]/10">
          <p className="font-serif text-lg font-semibold text-[var(--forest)]">Request Mentorship</p>
          <button onClick={onClose} className="text-[var(--forest)]/40 hover:text-[var(--forest)] transition-colors text-xl leading-none">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--forest)]/40 block mb-2">Your Message</label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              className="w-full bg-white border border-[var(--forest)]/15 text-[var(--stone)] text-[14px] px-4 py-3 resize-none focus:outline-none focus:border-[var(--forest)] transition-colors"
              placeholder="Describe what you'd like help with..."
            />
            <p className="text-[12px] text-[var(--forest)]/35 mt-1">{message.length} / 500 characters</p>
          </div>
          {error && <p className="text-red-600 text-[13px] font-medium">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-[var(--forest)]/20 text-[var(--forest)] text-[13px] font-bold tracking-[0.08em] uppercase py-3 hover:bg-[var(--beige)] transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !message.trim()} className="flex-1 bg-[var(--forest)] text-[var(--cream)] text-[13px] font-bold tracking-[0.08em] uppercase py-3 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sticky Action Panel ──────────────────────────────────────────────────────

function ActionPanel({ mentor, status, onRequestSent }: { mentor: MentorData; status: RequestStatus; onRequestSent: () => void }) {
  const [showDialog, setShowDialog] = useState(false)
  const domains = asDomainArray(mentor.domains).slice(0, 4)

  const ctaConfig: Record<RequestStatus, { label: string; disabled: boolean; style: string; note: string }> = {
    NONE:      { label: "Request Mentorship",  disabled: false, style: "bg-[var(--cream)] text-[var(--forest)] hover:bg-[var(--beige)]",                  note: "Mentors typically respond within 24h" },
    REQUESTED: { label: "● Requested",         disabled: true,  style: "bg-white/10 text-white/40 cursor-not-allowed border border-white/15",              note: "Awaiting mentor's response" },
    ACCEPTED:  { label: "→ Open Chat",          disabled: false, style: "bg-[#4A5D4E] text-[var(--cream)] hover:bg-[#3a4d3e]",                             note: "Mentor accepted your request" },
    DECLINED:  { label: "✕ Request Declined",  disabled: true,  style: "bg-white/5 text-white/30 cursor-not-allowed border border-white/10",               note: "This mentor is unavailable right now" },
    COMPLETED: { label: "Session Completed",   disabled: true,  style: "bg-white/10 text-white/40 cursor-not-allowed",                                     note: "You've completed a session with this mentor" },
  }

  const cta = ctaConfig[status]

  function handleCta() {
    if (status === "NONE") setShowDialog(true)
    if (status === "ACCEPTED") window.location.href = `/dashboard/startup/chat`
  }

  return (
    <>
      <div className="bg-[var(--forest)] text-[var(--cream)] p-7 sticky top-6">
        <div className="flex items-center gap-3 mb-5">
          <Avatar name={mentor.name} avatarUrl={mentor.avatarUrl} size="sm" />
          <div>
            <p className="font-serif font-semibold text-[var(--cream)] leading-tight">{mentor.name}</p>
            <p className="text-[12px] text-[var(--cream)]/55 leading-tight mt-0.5">{mentor.headline ?? "Mentor"}</p>
          </div>
        </div>

        <hr className="border-t border-white/12 mb-5" />

        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
            { label: "Experience", value: mentor.yearsOfExperience ? `${mentor.yearsOfExperience} yrs` : "—" },
            { label: "Sessions",   value: String(mentor.totalSessions) },
            { label: "Avg. Rating", value: mentor.averageRating ? `${parseFloat(mentor.averageRating).toFixed(1)} ★` : "New" },
            { label: "Response",   value: "~24h" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--cream)]/40 mb-0.5">{label}</p>
              <p className="text-[16px] font-semibold text-[var(--cream)]">{value}</p>
            </div>
          ))}
        </div>

        {domains.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {domains.map((d) => (
              <span key={d} className="bg-white/10 text-[var(--cream)]/80 text-[11px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 border border-white/15">{d}</span>
            ))}
          </div>
        )}

        {status === "NONE" && (
          <div className="bg-white/7 border border-white/12 px-4 py-3 mb-5">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--cream)]/35 mb-1.5">Message preview</p>
            <p className="text-[13px] text-[var(--cream)]/70 leading-relaxed italic">
              "Hi {mentor.name.split(" ")[0]}, I'm building a startup and would love your guidance on…"
            </p>
          </div>
        )}

        <button onClick={handleCta} disabled={cta.disabled} className={`w-full py-3.5 text-[13px] font-bold tracking-[0.1em] uppercase transition-all flex items-center justify-center gap-2 ${cta.style}`}>
          {cta.label}
        </button>
        <p className="text-[11px] text-[var(--cream)]/40 text-center mt-2 tracking-[0.04em]">{cta.note}</p>
      </div>

      {showDialog && (
        <RequestDialog
          mentorName={mentor.name}
          mentorId={mentor.id}
          onClose={() => setShowDialog(false)}
          onSuccess={() => { setShowDialog(false); onRequestSent() }}
        />
      )}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MentorDetailClient({ mentor, existingRequest }: Props) {
  const [status, setStatus] = useState<RequestStatus>(deriveStatus(existingRequest))

  const domains      = asDomainArray(mentor.domains)
  const industries   = asDomainArray(mentor.industries)
  const expertiseTags = [...new Set([...domains, ...industries])]
  const location     = [mentor.city, mentor.country].filter(Boolean).join(", ")

  return (
    <div className="min-h-screen bg-[var(--cream)] font-sans">
      <div className="max-w-[1100px] mx-auto px-6 pb-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 py-5 text-[12px] font-bold tracking-[0.1em] uppercase text-[var(--forest)]/40">
          <Link href="/dashboard/startup/mentors" className="hover:text-[var(--forest)] transition-colors">Mentors</Link>
          <span>›</span>
          <span className="text-[var(--forest)]">{mentor.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

          {/* ── LEFT ── */}
          <div className="flex flex-col gap-5">

            {/* Header */}
            <div className="bg-white border border-[var(--forest)]/10 p-7">
              <div className="flex gap-5 items-start">
                <Avatar name={mentor.name} avatarUrl={mentor.avatarUrl} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h1 className="font-serif text-[1.65rem] font-semibold text-[var(--forest)] leading-tight">
                        {mentor.name}
                        {mentor.isVerified && (
                          <span className="ml-2 text-[11px] font-bold tracking-[0.08em] uppercase bg-[var(--forest)] text-[var(--cream)] px-2 py-0.5 align-middle">Verified</span>
                        )}
                      </h1>
                      <p className="text-[14px] text-[var(--forest)]/60 mt-1">{mentor.headline}</p>
                    </div>
                    {mentor.yearsOfExperience && (
                      <span className="bg-[var(--forest)] text-[var(--cream)] text-[11px] font-bold tracking-[0.08em] uppercase px-3 py-1.5 flex-shrink-0">
                        {mentor.yearsOfExperience}+ Years Exp.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap mt-3">
                    {location && <span className="text-[12px] font-bold tracking-[0.06em] uppercase text-[var(--forest)]/50">📍 {location}</span>}
                    <span className={`text-[12px] font-bold tracking-[0.06em] uppercase flex items-center gap-1.5 ${mentor.isAvailable ? "text-[#4A5D4E]" : "text-[var(--forest)]/40"}`}>
                      <span className={`w-2 h-2 rounded-full ${mentor.isAvailable ? "bg-[#4A5D4E]" : "bg-[var(--forest)]/30"}`} />
                      {mentor.isAvailable ? "Available" : "Unavailable"}
                    </span>
                    {mentor.totalRatings > 0 && mentor.averageRating && (
                      <span className="text-[12px] font-bold tracking-[0.06em] uppercase text-[var(--forest)]/50">
                        ★ {parseFloat(mentor.averageRating).toFixed(1)} ({mentor.totalRatings} ratings)
                      </span>
                    )}
                  </div>
                  {domains.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3.5">
                      {domains.map((d) => <Chip key={d} label={d} />)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* About */}
            {mentor.bio && (
              <div className="bg-white border border-[var(--forest)]/10 px-7 py-6">
                <SectionLabel>About</SectionLabel>
                <div className="space-y-3">
                  {mentor.bio.split("\n\n").map((para, i) => (
                    <p key={i} className="text-[15px] leading-[1.8] text-[var(--stone)]">{para}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Expertise */}
            {expertiseTags.length > 0 && (
              <div className="bg-white border border-[var(--forest)]/10 px-7 py-6">
                <SectionLabel>Expertise</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {expertiseTags.map((tag) => <ExpertiseTag key={tag} label={tag} />)}
                </div>
              </div>
            )}

            {/* Professional Details */}
            <div className="bg-white border border-[var(--forest)]/10 px-7 py-6">
              <SectionLabel>Professional Details</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {[
                  { label: "Experience",     value: mentor.yearsOfExperience ? `${mentor.yearsOfExperience} Years` : null, highlight: false },
                  { label: "Location",       value: location || null,                                                       highlight: false },
                  { label: "Availability",   value: mentor.isAvailable ? "Available" : "Unavailable",                      highlight: mentor.isAvailable },
                  { label: "Total Sessions", value: mentor.totalSessions > 0 ? `${mentor.totalSessions} sessions` : null,  highlight: false },
                  { label: "Industries",     value: industries.length > 0 ? industries.join(", ") : null,                   highlight: false },
                  { label: "Past Companies", value: mentor.previousCompanies ?? null,                                       highlight: false },
                ]
                  .filter((item) => item.value !== null)
                  .map(({ label, value, highlight }) => (
                    <div key={label}>
                      <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--forest)]/40 mb-1">{label}</p>
                      <p className={`text-[15px] font-medium ${highlight ? "text-[#4A5D4E]" : "text-[var(--forest)]"}`}>{value}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* LinkedIn */}
            {mentor.linkedinUrl && (
              <div className="bg-white border border-[var(--forest)]/10 px-7 py-5 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <SectionLabel>LinkedIn</SectionLabel>
                  <p className="text-[14px] text-[var(--forest)]/55">Verify credentials &amp; past experience</p>
                </div>
                <a href={mentor.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border-[1.5px] border-[var(--forest)] text-[var(--forest)] text-[13px] font-bold tracking-[0.07em] uppercase px-5 py-2.5 hover:bg-[var(--forest)] hover:text-[var(--cream)] transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                  View LinkedIn Profile
                </a>
              </div>
            )}

          </div>

          {/* ── RIGHT sticky panel ── */}
          <div className="lg:sticky lg:top-6">
            <ActionPanel mentor={mentor} status={status} onRequestSent={() => setStatus("REQUESTED")} />
          </div>

        </div>
      </div>
    </div>
  )
}