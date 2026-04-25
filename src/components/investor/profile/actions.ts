"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { InvestorProfilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";

// ─── Guard ────────────────────────────────────────────────────────────────────

async function getVerifiedInvestorId(profileId: string): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INVESTOR") return null;

  const [profile] = await db
    .select({ userId: InvestorProfilesTable.userId })
    .from(InvestorProfilesTable)
    .where(eq(InvestorProfilesTable.id, profileId))
    .limit(1);

  if (!profile || profile.userId !== session.user.id) return null;
  return session.user.id;
}

// ─── Update Identity ──────────────────────────────────────────────────────────

export async function updateIdentity(fd: FormData): Promise<ActionResult> {
  const profileId = fd.get("profileId") as string;
  if (!await getVerifiedInvestorId(profileId))
    return { success: false, message: "Unauthorized." };

  const firmName    = (fd.get("firmName")    as string)?.trim() || null;
  const designation = (fd.get("designation") as string)?.trim() || null;
  const bio         = (fd.get("bio")         as string)?.trim() || null;
  const linkedinUrl = (fd.get("linkedinUrl") as string)?.trim() || null;
  const websiteUrl  = (fd.get("websiteUrl")  as string)?.trim() || null;
  const country     = (fd.get("country")     as string)?.trim() || null;
  const city        = (fd.get("city")        as string)?.trim() || null;

  if (bio && bio.length > 1000)
    return { success: false, message: "Bio must be under 1000 characters." };
  if (linkedinUrl && !linkedinUrl.startsWith("https://"))
    return { success: false, message: "LinkedIn URL must start with https://" };
  if (websiteUrl && !websiteUrl.startsWith("https://"))
    return { success: false, message: "Website URL must start with https://" };

  try {
    await db
      .update(InvestorProfilesTable)
      .set({ firmName, designation, bio, linkedinUrl, websiteUrl, country, city, updatedAt: new Date() })
      .where(eq(InvestorProfilesTable.id, profileId));
    revalidatePath("/dashboard/investor/profile");
    return { success: true, message: "Identity saved." };
  } catch {
    return { success: false, message: "Failed to save. Please try again." };
  }
}

// ─── Update Preferences ───────────────────────────────────────────────────────

const ALLOWED_INVESTOR_TYPES = [
  "ANGEL", "VENTURE_CAPITAL", "PRIVATE_EQUITY",
  "CORPORATE", "FAMILY_OFFICE", "ACCELERATOR",
] as const;

export async function updatePreferences(fd: FormData): Promise<ActionResult> {
  const profileId = fd.get("profileId") as string;
  if (!await getVerifiedInvestorId(profileId))
    return { success: false, message: "Unauthorized." };

  const investorType    = (fd.get("investorType") as string)?.trim() || null;
  const sectorsRaw      = fd.get("preferredSectors")    as string;
  const stagesRaw       = fd.get("preferredStages")     as string;
  const geosRaw         = fd.get("preferredGeographies") as string;

  if (investorType && !ALLOWED_INVESTOR_TYPES.includes(investorType as typeof ALLOWED_INVESTOR_TYPES[number]))
    return { success: false, message: "Invalid investor type." };

  let preferredSectors:     string[] = [];
  let preferredStages:      string[] = [];
  let preferredGeographies: string[] = [];

  try {
    preferredSectors     = sectorsRaw  ? JSON.parse(sectorsRaw)  : [];
    preferredStages      = stagesRaw   ? JSON.parse(stagesRaw)   : [];
    preferredGeographies = geosRaw     ? JSON.parse(geosRaw)     : [];
  } catch {
    return { success: false, message: "Invalid data format." };
  }

  try {
    await db
      .update(InvestorProfilesTable)
      .set({
        investorType: investorType as typeof ALLOWED_INVESTOR_TYPES[number] | null,
        preferredSectors,
        preferredStages,
        preferredGeographies,
        updatedAt: new Date(),
      })
      .where(eq(InvestorProfilesTable.id, profileId));
    revalidatePath("/dashboard/investor/profile");
    return { success: true, message: "Preferences saved." };
  } catch {
    return { success: false, message: "Failed to save. Please try again." };
  }
}

// ─── Update Thesis ────────────────────────────────────────────────────────────

export async function updateThesis(fd: FormData): Promise<ActionResult> {
  const profileId = fd.get("profileId") as string;
  if (!await getVerifiedInvestorId(profileId))
    return { success: false, message: "Unauthorized." };

  const investmentThesis = (fd.get("investmentThesis") as string)?.trim() || null;
  const impactFocused    = fd.get("impactFocused") === "true";

  if (investmentThesis && investmentThesis.length > 2000)
    return { success: false, message: "Thesis must be under 2000 characters." };

  try {
    await db
      .update(InvestorProfilesTable)
      .set({ investmentThesis, impactFocused, updatedAt: new Date() })
      .where(eq(InvestorProfilesTable.id, profileId));
    revalidatePath("/dashboard/investor/profile");
    return { success: true, message: "Thesis saved." };
  } catch {
    return { success: false, message: "Failed to save. Please try again." };
  }
}

// ─── Update Ticket Size ───────────────────────────────────────────────────────

export async function updateTicket(fd: FormData): Promise<ActionResult> {
  const profileId = fd.get("profileId") as string;
  if (!await getVerifiedInvestorId(profileId))
    return { success: false, message: "Unauthorized." };

  const minRaw = (fd.get("ticketSizeMin") as string)?.trim();
  const maxRaw = (fd.get("ticketSizeMax") as string)?.trim();

  const ticketSizeMin = minRaw || null;
  const ticketSizeMax = maxRaw || null;

  if (minRaw && maxRaw) {
    const min = parseFloat(minRaw);
    const max = parseFloat(maxRaw);
    if (isNaN(min) || isNaN(max))
      return { success: false, message: "Ticket sizes must be valid numbers." };
    if (min < 0 || max < 0)
      return { success: false, message: "Ticket sizes must be positive." };
    if (min > max)
      return { success: false, message: "Minimum ticket cannot exceed maximum." };
  }

  try {
    await db
      .update(InvestorProfilesTable)
      .set({ ticketSizeMin, ticketSizeMax, updatedAt: new Date() })
      .where(eq(InvestorProfilesTable.id, profileId));
    revalidatePath("/dashboard/investor/profile");
    return { success: true, message: "Ticket size saved." };
  } catch {
    return { success: false, message: "Failed to save. Please try again." };
  }
}