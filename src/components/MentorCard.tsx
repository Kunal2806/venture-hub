// components/mentors/MentorCard.tsx
import Link from "next/link";
import { Star, Briefcase, Clock, IndianRupee } from "lucide-react";
import type { Mentor } from "@/app/(protected)/dashboard/startup/mentors/types";
import { TagBadge } from "./TagBadge";

const FOREST = "#1A362B";
const BEIGE = "#EFEBE3";

const ENGAGEMENT_CONFIG = {
  PAID: { label: "Paid", classes: "bg-violet-50 text-violet-700 border-violet-200" },
  PRO_BONO: { label: "Pro-bono", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  BOTH: { label: "Paid & Pro-bono", classes: "bg-blue-50 text-blue-700 border-blue-200" },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface MentorCardProps {
  mentor: Mentor;
}

export function MentorCard({ mentor }: MentorCardProps) {
  const engCfg = ENGAGEMENT_CONFIG[mentor.engagementType];

  return (
    <div
      className="group flex flex-col bg-white rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
      style={{ borderColor: `${FOREST}12` }}
    >
      {/* Card Top */}
      <div className="p-5 flex-1">
        {/* Avatar + Name */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
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
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-base font-semibold text-[#1A362B] truncate">
              {mentor.name}
            </h3>
            <p className="text-xs text-[#1A362B]/60 truncate">
              {mentor.designation}
            </p>
            <p className="text-xs text-[#1A362B]/40 truncate">
              {mentor.organization}
            </p>
          </div>
        </div>

        {/* Expertise Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {mentor.expertiseDomains.slice(0, 3).map((domain) => (
            <TagBadge key={domain} label={domain} size="sm" />
          ))}
          {mentor.expertiseDomains.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full text-[#1A362B]/40 bg-[#F9F7F2]">
              +{mentor.expertiseDomains.length - 3}
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 rounded-lg bg-[#F9F7F2]">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-[#1A362B]">
                {mentor.averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-[9px] text-[#1A362B]/40 mt-0.5">
              {mentor.totalReviews} reviews
            </span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-[#F9F7F2]">
            <div className="flex items-center gap-1">
              <Briefcase className="h-3 w-3 text-[#1A362B]/60" />
              <span className="text-xs font-bold text-[#1A362B]">
                {mentor.yearsOfExperience}y
              </span>
            </div>
            <span className="text-[9px] text-[#1A362B]/40 mt-0.5">experience</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-[#F9F7F2]">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#1A362B]/60" />
              <span className="text-xs font-bold text-[#1A362B]">
                {mentor.availabilityHoursPerMonth}h
              </span>
            </div>
            <span className="text-[9px] text-[#1A362B]/40 mt-0.5">/month</span>
          </div>
        </div>

        {/* Engagement + Price */}
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${engCfg.classes}`}
          >
            {engCfg.label}
          </span>
          {mentor.sessionPrice !== null && (
            <div className="flex items-center gap-0.5 text-[#1A362B]">
              <IndianRupee className="h-3 w-3" />
              <span className="text-sm font-bold">
                {mentor.sessionPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-[#1A362B]/40">/session</span>
            </div>
          )}
          {mentor.engagementType === "PRO_BONO" && (
            <span className="text-sm font-bold text-emerald-600">Free</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <Link
          href={`/dashboard/startup/mentors/${mentor.id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ backgroundColor: FOREST, color: "white" }}
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}