import type { InvestorProfile } from "@/db/schema";

export type ActionResult = {
  success: boolean;
  message?: string;
};

export type ProfileSection = "identity" | "preferences" | "thesis" | "ticket";

export type ScoreBreakdown = {
  identity:    number;
  preferences: number;
  thesis:      number;
  ticket:      number;
  total:       number;
};

export type ProfilePageProps = {
  profile: InvestorProfile;
  userId:  string;
};