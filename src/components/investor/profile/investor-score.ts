import type { InvestorProfile } from "@/db/schema";
import type { ScoreBreakdown } from "./types";

// Max pts: identity=25, preferences=30, thesis=25, ticket=20 → total=100

export function calculateInvestorScore(profile: Partial<InvestorProfile>): ScoreBreakdown {
  let identity    = 0;
  let preferences = 0;
  let thesis      = 0;
  let ticket      = 0;

  // ── Identity (25 pts) ──────────────────────────────────────────────
  if (profile.firmName)    identity += 5;
  if (profile.designation) identity += 5;
  if (profile.bio)         identity += 8;
  if (profile.linkedinUrl) identity += 4;
  if (profile.country)     identity += 3;

  // ── Preferences (30 pts) ──────────────────────────────────────────
  const sectors = (profile.preferredSectors as string[] | undefined) ?? [];
  const stages  = (profile.preferredStages  as string[] | undefined) ?? [];
  const geos    = (profile.preferredGeographies as string[] | undefined) ?? [];

  if (sectors.length > 0)  preferences += 10;
  if (stages.length  > 0)  preferences += 10;
  if (geos.length    > 0)  preferences += 5;
  if (profile.investorType) preferences += 5;

  // ── Thesis (25 pts) ───────────────────────────────────────────────
  if (profile.investmentThesis) {
    const len = profile.investmentThesis.length;
    if (len >= 200) thesis += 20;
    else if (len >= 80) thesis += 12;
    else thesis += 6;
  }
  if (profile.impactFocused) thesis += 5;

  // ── Ticket (20 pts) ───────────────────────────────────────────────
  if (profile.ticketSizeMin) ticket += 10;
  if (profile.ticketSizeMax) ticket += 10;

  const total = Math.min(identity + preferences + thesis + ticket, 100);
  return { identity, preferences, thesis, ticket, total };
}