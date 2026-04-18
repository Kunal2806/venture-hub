import type { StartupProfile, FounderEntry } from "@/db/schema";

export type ActionResult = {
  success: boolean;
  message?: string;
};

export type ProfileSection = "basic" | "pitch" | "traction" | "founders";

export type BasicInfoData = {
  companyName: string;
  tagline: string;
  websiteUrl: string;
  country: string;
  city: string;
  sector: string;
  stage: string;
  foundedYear: string;
  description: string;
};

export type PitchData = {
  problemStatement: string;
  solutionDescription: string;
  uniqueValueProposition: string;
  businessModel: string;
  targetMarket: string;
  competitiveLandscape: string;
};

export type TractionData = {
  revenueMonthly: string;
  revenueAnnual: string;
  userCount: string;
  growthRate: string;
  fundingAskMin: string;
  fundingAskMax: string;
  equityOffered: string;
  useOfFunds: string;
};

export type FoundersData = {
  founders: FounderEntry[];
};

export type ProfilePageProps = {
  profile: StartupProfile;
  userId: string;
};