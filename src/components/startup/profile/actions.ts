"use server";

import { z } from "zod";
import { db } from "@/db";
import { StartupProfilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateProfileScore } from "@/lib/profile-score";
import type { ActionResult } from "./types";
import type { FounderEntry } from "@/db/schema";

// ─── Helper: verify ownership ────────────────────────────────────────────────
async function verifyOwnership(profileId: string, userId: string) {
  const profile = await db.query.StartupProfilesTable.findFirst({
    where: eq(StartupProfilesTable.id, profileId),
    columns: { userId: true },
  });
  if (!profile) return { ok: false, error: "Profile not found." };
  if (profile.userId !== userId) return { ok: false, error: "Unauthorized." };
  return { ok: true, error: null };
}

// ─── Helper: recalculate and persist score ────────────────────────────────────
async function syncScore(profileId: string) {
  const profile = await db.query.StartupProfilesTable.findFirst({
    where: eq(StartupProfilesTable.id, profileId),
  });
  if (!profile) return;
  const { total } = calculateProfileScore(profile);
  await db
    .update(StartupProfilesTable)
    .set({ profileScore: total, updatedAt: new Date() })
    .where(eq(StartupProfilesTable.id, profileId));
}

// ─── Basic Info ───────────────────────────────────────────────────────────────
const BasicInfoSchema = z.object({
  profileId: z.string().uuid(),
  userId: z.string().uuid(),
  companyName: z.string().min(1, "Company name is required").max(100),
  tagline: z.string().max(160).optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  sector: z.string().min(1, "Sector is required").max(80),
  stage: z.enum([
    "IDEA", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH",
  ]),
  foundedYear: z
    .string()
    .regex(/^\d{4}$/, "Must be a 4-digit year")
    .optional()
    .or(z.literal("")),
  description: z.string().max(1000).optional(),
});

export async function updateBasicInfo(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    profileId: formData.get("profileId"),
    userId: formData.get("userId"),
    companyName: formData.get("companyName"),
    tagline: formData.get("tagline"),
    websiteUrl: formData.get("websiteUrl"),
    country: formData.get("country"),
    city: formData.get("city"),
    sector: formData.get("sector"),
    stage: formData.get("stage"),
    foundedYear: formData.get("foundedYear"),
    description: formData.get("description"),
  };

  const parsed = BasicInfoSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Validation failed.";
    return { success: false, message: msg };
  }

  const { profileId, userId, foundedYear, websiteUrl, ...rest } = parsed.data;

  const ownership = await verifyOwnership(profileId, userId);
  if (!ownership.ok) return { success: false, message: ownership.error! };

  try {
    await db
      .update(StartupProfilesTable)
      .set({
        ...rest,
        websiteUrl: websiteUrl || null,
        foundedYear: foundedYear ? parseInt(foundedYear) : null,
        updatedAt: new Date(),
      })
      .where(eq(StartupProfilesTable.id, profileId));

    await syncScore(profileId);
    return { success: true, message: "Basic info saved." };
  } catch {
    return { success: false, message: "Failed to save. Please try again." };
  }
}

// ─── Pitch ────────────────────────────────────────────────────────────────────
const PitchSchema = z.object({
  profileId: z.string().uuid(),
  userId: z.string().uuid(),
  problemStatement: z.string().max(2000).optional(),
  solutionDescription: z.string().max(2000).optional(),
  uniqueValueProposition: z.string().max(1000).optional(),
  businessModel: z.string().max(1000).optional(),
  targetMarket: z.string().max(1000).optional(),
  competitiveLandscape: z.string().max(1000).optional(),
});

export async function updatePitch(formData: FormData): Promise<ActionResult> {
  const raw = {
    profileId: formData.get("profileId"),
    userId: formData.get("userId"),
    problemStatement: formData.get("problemStatement"),
    solutionDescription: formData.get("solutionDescription"),
    uniqueValueProposition: formData.get("uniqueValueProposition"),
    businessModel: formData.get("businessModel"),
    targetMarket: formData.get("targetMarket"),
    competitiveLandscape: formData.get("competitiveLandscape"),
  };

  const parsed = PitchSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Validation failed." };
  }

  const { profileId, userId, ...fields } = parsed.data;

  const ownership = await verifyOwnership(profileId, userId);
  if (!ownership.ok) return { success: false, message: ownership.error! };

  try {
    await db
      .update(StartupProfilesTable)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(StartupProfilesTable.id, profileId));

    await syncScore(profileId);
    return { success: true, message: "Pitch section saved." };
  } catch {
    return { success: false, message: "Failed to save. Please try again." };
  }
}

// ─── Traction & Financials ────────────────────────────────────────────────────
const positiveDecimal = z
  .string()
  .optional()
  .refine(
    (v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0),
    "Must be a positive number"
  );

const TractionSchema = z.object({
  profileId: z.string().uuid(),
  userId: z.string().uuid(),
  revenueMonthly: positiveDecimal,
  revenueAnnual: positiveDecimal,
  userCount: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!isNaN(parseInt(v)) && parseInt(v) >= 0),
      "Must be a positive integer"
    ),
  growthRate: positiveDecimal,
  fundingAskMin: positiveDecimal,
  fundingAskMax: positiveDecimal,
  equityOffered: z
    .string()
    .optional()
    .refine(
      (v) => !v || (parseFloat(v) >= 0 && parseFloat(v) <= 100),
      "Equity must be 0–100%"
    ),
  useOfFunds: z.string().max(1000).optional(),
});

export async function updateTraction(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    profileId: formData.get("profileId"),
    userId: formData.get("userId"),
    revenueMonthly: formData.get("revenueMonthly"),
    revenueAnnual: formData.get("revenueAnnual"),
    userCount: formData.get("userCount"),
    growthRate: formData.get("growthRate"),
    fundingAskMin: formData.get("fundingAskMin"),
    fundingAskMax: formData.get("fundingAskMax"),
    equityOffered: formData.get("equityOffered"),
    useOfFunds: formData.get("useOfFunds"),
  };

  const parsed = TractionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Validation failed." };
  }

  const { profileId, userId, userCount, revenueMonthly, revenueAnnual, growthRate, fundingAskMin, fundingAskMax, equityOffered, useOfFunds } = parsed.data;

  const ownership = await verifyOwnership(profileId, userId);
  if (!ownership.ok) return { success: false, message: ownership.error! };

  try {
    await db
      .update(StartupProfilesTable)
      .set({
        revenueMonthly: revenueMonthly || null,
        revenueAnnual: revenueAnnual || null,
        userCount: userCount ? parseInt(userCount) : null,
        growthRate: growthRate || null,
        fundingAskMin: fundingAskMin || null,
        fundingAskMax: fundingAskMax || null,
        equityOffered: equityOffered || null,
        useOfFunds: useOfFunds || null,
        updatedAt: new Date(),
      })
      .where(eq(StartupProfilesTable.id, profileId));

    await syncScore(profileId);
    return { success: true, message: "Traction data saved." };
  } catch {
    return { success: false, message: "Failed to save. Please try again." };
  }
}

// ─── Founders ─────────────────────────────────────────────────────────────────
const FounderSchema = z.object({
  name: z.string().min(1, "Founder name required"),
  role: z.string().min(1, "Role required"),
  bio: z.string().max(500).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  avatarUrl: z.string().optional(),
  isLeadFounder: z.boolean(),
});

const FoundersActionSchema = z.object({
  profileId: z.string().uuid(),
  userId: z.string().uuid(),
  founders: z.array(FounderSchema).min(1, "At least one founder required"),
});

export async function updateFounders(
  data: { profileId: string; userId: string; founders: FounderEntry[] }
): Promise<ActionResult> {
  const parsed = FoundersActionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Validation failed." };
  }

  const { profileId, userId, founders } = parsed.data;

  const ownership = await verifyOwnership(profileId, userId);
  if (!ownership.ok) return { success: false, message: ownership.error! };

  try {
    await db
      .update(StartupProfilesTable)
      .set({ founders, updatedAt: new Date() })
      .where(eq(StartupProfilesTable.id, profileId));

    await syncScore(profileId);
    return { success: true, message: "Founders saved." };
  } catch {
    return { success: false, message: "Failed to save. Please try again." };
  }
}