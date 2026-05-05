// app/(public)/mentors/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Star, Briefcase, Clock, IndianRupee,
  Globe, ChevronRight, Loader2, AlertCircle,
  Mail, ArrowLeft,
} from "lucide-react";
import { TagBadge } from "@/components/TagBadge";
import { RequestSessionModal } from "@/components/RequestSessionModal";
import { Mentor } from "../types";

const FOREST = "#1A362B";
const BEIGE = "#EFEBE3";
const CREAM = "#F9F7F2";

const ENGAGEMENT_LABEL: Record<string, string> = {
  PAID: "Paid",
  PRO_BONO: "Pro-bono",
  BOTH: "Paid & Pro-bono",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-4 w-4"
          style={{
            fill: i <= Math.round(rating) ? "#F59E0B" : "transparent",
            color: i <= Math.round(rating) ? "#F59E0B" : "#D1D5DB",
          }}
        />
      ))}
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function MentorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function fetchMentor() {
      setLoading(true);
      try {
        const res = await fetch(`/api/mentor/${id}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setMentor(json.data || json);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMentor();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: FOREST }} />
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="h-12 w-12 mb-4" style={{ color: FOREST }} />
        <p className="font-serif text-xl text-[#1A362B] mb-2">Mentor not found</p>
        <Link
          href="/dashboard/startup/mentors"
          className="text-sm text-[#1A362B]/60 hover:text-[#1A362B] transition-colors"
        >
          ← Back to mentors
        </Link>
      </div>
    );
  }

  const isPaid = mentor.engagementType === "PAID" || mentor.engagementType === "BOTH";
  const isProBono = mentor.engagementType === "PRO_BONO" || mentor.engagementType === "BOTH";

  return (
    <>
      <div className="mx-auto space-y-6 px-1 lg:px-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs lg:text-sm">
          <Link
            href="/dashboard/startup/mentors"
            className="flex items-center gap-1 text-[#1A362B]/50 hover:text-[#1A362B] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Find Mentors
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#1A362B]/30" />
          <span className="text-[#1A362B] font-medium truncate">{mentor.name}</span>
        </div>

        {/* Hero Card */}
        <div
          className="bg-white rounded-2xl border overflow-hidden"
          style={{ borderColor: `${FOREST}12` }}
        >
          {/* Banner */}
          <div className="h-24 lg:h-32" style={{ backgroundColor: `${FOREST}08` }} />

          <div className="px-5 lg:px-8 pb-6">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-8 lg:-mt-10 mb-5">
              <div className="flex items-end gap-4">
                <div
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl border-4 border-white flex items-center justify-center text-white text-xl lg:text-2xl font-bold shadow-sm flex-shrink-0"
                  style={{ backgroundColor: FOREST }}
                >
                  {mentor.avatarUrl ? (
                    <img
                      src={mentor.avatarUrl}
                      alt={mentor.name}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    initials(mentor.name)
                  )}
                </div>
                <div className="pb-1">
                  <h1 className="font-serif text-xl lg:text-2xl text-[#1A362B]">{mentor.name}</h1>
                  <p className="text-sm text-[#1A362B]/60">
                    {mentor.designation} · {mentor.organization}
                  </p>
                </div>
              </div>

              {/* CTA (desktop) */}
              <div className="hidden sm:block pb-1">
                <button
                  onClick={() => setModalOpen(true)}
                  disabled={!mentor.isAvailable}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: FOREST }}
                >
                  {mentor.isAvailable ? "Request Session" : "Not Available"}
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 lg:p-4 rounded-xl" style={{ backgroundColor: CREAM }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-base font-bold text-[#1A362B]">
                    {mentor.averageRating.toFixed(1)}
                  </span>
                </div>
                <p className="text-[10px] text-[#1A362B]/50">{mentor.totalReviews} reviews</p>
              </div>
              <div className="p-3 lg:p-4 rounded-xl" style={{ backgroundColor: CREAM }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Briefcase className="h-4 w-4 text-[#1A362B]/60" />
                  <span className="text-base font-bold text-[#1A362B]">
                    {mentor.yearsOfExperience}+
                  </span>
                </div>
                <p className="text-[10px] text-[#1A362B]/50">Years experience</p>
              </div>
              <div className="p-3 lg:p-4 rounded-xl" style={{ backgroundColor: CREAM }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-4 w-4 text-[#1A362B]/60" />
                  <span className="text-base font-bold text-[#1A362B]">
                    {mentor.availabilityHoursPerMonth}h
                  </span>
                </div>
                <p className="text-[10px] text-[#1A362B]/50">Available/month</p>
              </div>
              <div className="p-3 lg:p-4 rounded-xl" style={{ backgroundColor: CREAM }}>
                {isPaid && mentor.sessionPrice !== null ? (
                  <>
                    <div className="flex items-center gap-1 mb-1">
                      <IndianRupee className="h-4 w-4 text-[#1A362B]/60" />
                      <span className="text-base font-bold text-[#1A362B]">
                        {mentor.sessionPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#1A362B]/50">Per session</p>
                  </>
                ) : (
                  <>
                    <span className="text-base font-bold text-emerald-600">Free</span>
                    <p className="text-[10px] text-[#1A362B]/50">Pro-bono</p>
                  </>
                )}
              </div>
            </div>

            {/* Engagement badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ backgroundColor: BEIGE, color: FOREST }}
              >
                {ENGAGEMENT_LABEL[mentor.engagementType]}
              </span>
              {isProBono && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">
                  Open to pro-bono
                </span>
              )}
              {!mentor.isAvailable && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-red-50 text-red-700">
                  Not accepting sessions
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left: Bio + Expertise */}
          <div className="lg:col-span-2 space-y-5">
            {/* Bio */}
            <div
              className="bg-white rounded-2xl border p-5 lg:p-6"
              style={{ borderColor: `${FOREST}12` }}
            >
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#1A362B]/50 mb-3">
                About
              </h2>
              <p className="text-sm lg:text-base text-[#1A362B]/80 leading-relaxed">{mentor.bio}</p>
            </div>

            {/* Expertise */}
            <div
              className="bg-white rounded-2xl border p-5 lg:p-6"
              style={{ borderColor: `${FOREST}12` }}
            >
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#1A362B]/50 mb-3">
                Expertise Domains
              </h2>
              <div className="flex flex-wrap gap-2">
                {mentor.expertiseDomains.map((domain) => (
                  <TagBadge key={domain} label={domain} size="md" />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            {/* Rating breakdown */}
            <div
              className="bg-white rounded-2xl border p-5"
              style={{ borderColor: `${FOREST}12` }}
            >
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#1A362B]/50 mb-3">
                Rating
              </h2>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-[#1A362B] font-serif">
                  {mentor.averageRating.toFixed(1)}
                </span>
                <div>
                  <StarRating rating={mentor.averageRating} />
                  <p className="text-xs text-[#1A362B]/50 mt-1">
                    {mentor.totalReviews} reviews
                  </p>
                </div>
              </div>
            </div>
            {mentor.reviews && mentor.reviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Reviews ({mentor.totalReviews})
                </h2>
                <div className="space-y-3">
                  {mentor.reviews.map(r => (
                    <div key={r.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-stone-700">{r.raterName}</p>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <Star
                              key={i}
                              className="w-3 h-3"
                              style={{
                                fill:  i <= r.rating ? "#F59E0B" : "transparent",
                                color: i <= r.rating ? "#F59E0B" : "#D1D5DB",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      {r.review && (
                        <p className="text-xs text-stone-500 leading-relaxed">"{r.review}"</p>
                      )}
                      <p className="text-[10px] text-stone-300">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                      <div className="border-b border-stone-50 last:border-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {mentor.linkedinUrl && (
              <div
                className="bg-white rounded-2xl border p-5"
                style={{ borderColor: `${FOREST}12` }}
              >
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#1A362B]/50 mb-3">
                  Links
                </h2>
                <a
                  href={mentor.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#1A362B] hover:underline"
                >
                  <Globe className="h-4 w-4 text-[#1A362B]/50" />
                  LinkedIn Profile
                </a>
              </div>
            )}

            {/* CTA Card */}
            <div
              className="rounded-2xl border p-5 space-y-3"
              style={{ borderColor: `${FOREST}20`, backgroundColor: `${FOREST}04` }}
            >
              <p className="text-sm font-medium text-[#1A362B]">
                Ready to connect with {mentor.name.split(" ")[0]}?
              </p>
              {isPaid && mentor.sessionPrice !== null && (
                <p className="text-xs text-[#1A362B]/50">
                  Session fee: ₹{mentor.sessionPrice.toLocaleString("en-IN")}
                </p>
              )}
              {isProBono && (
                <p className="text-xs text-emerald-600">✓ Available for free sessions</p>
              )}
              <button
                onClick={() => setModalOpen(true)}
                disabled={!mentor.isAvailable}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: FOREST }}
              >
                {mentor.isAvailable ? "Request Session" : "Not Available"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-20"
        style={{ borderColor: `${FOREST}12` }}
      >
        <button
          onClick={() => setModalOpen(true)}
          disabled={!mentor.isAvailable}
          className="w-full py-3 rounded-xl text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: FOREST }}
        >
          {mentor.isAvailable ? "Request a Session" : "Not Available"}
        </button>
      </div>

      {/* Session Request Modal */}
      <RequestSessionModal
        mentor={mentor}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}