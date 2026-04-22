import type { StartupProfile, FounderEntry } from "@/db/schema";

export type ScoreBreakdown = {
  basic: number;
  pitch: number;
  traction: number;
  founders: number;
  total: number;
};

// Max pts per section: basic=20, pitch=30, traction=20, founders=20, (docs=10 handled elsewhere)
export function calculateProfileScore(profile: Partial<StartupProfile>): ScoreBreakdown {
  let basic = 0;
  let pitch = 0;
  let traction = 0;
  let founders = 0;

  // --- Basic (20 pts) ---
  if (profile.companyName) basic += 4;
  if (profile.tagline) basic += 4;
  if (profile.websiteUrl) basic += 3;
  if (profile.sector) basic += 3;
  if (profile.stage) basic += 3;
  if (profile.country) basic += 3;

  // --- Pitch (30 pts) ---
  if (profile.problemStatement) pitch += 8;
  if (profile.solutionDescription) pitch += 8;
  if (profile.uniqueValueProposition) pitch += 7;
  if (profile.businessModel) pitch += 4;
  if (profile.targetMarket) pitch += 3;

  // --- Traction (20 pts) ---
  if (profile.userCount) traction += 5;
  if (profile.revenueMonthly || profile.revenueAnnual) traction += 5;
  if (profile.growthRate) traction += 4;
  // if (profile.fundingAskMin) traction += 3;
  if (profile.equityOffered) traction += 3;

  // --- Founders (20 pts) ---
  const founderList = (profile.founders ?? []) as FounderEntry[];
  if (founderList.length > 0) founders += 10;
  if (founderList.some((f) => f.linkedinUrl)) founders += 5;
  if (founderList.some((f) => f.bio)) founders += 5;

  const total = Math.min(basic + pitch + traction + founders, 90); // docs = 10 handled elsewhere

  return { basic, pitch, traction, founders, total };
}   