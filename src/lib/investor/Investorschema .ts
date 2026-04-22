/**
 * Single source of truth for investor application validation.
 * Imported by BOTH the API route (server) and the page (client).
 *
 * Rules here must stay in sync — never add a client-only check.
 * The server enforces everything; the client mirrors it for UX.
 */

import { z } from "zod";

// ─── Allowlists ────────────────────────────────────────────────────────────────

export const INVESTOR_TYPE_VALUES = [
  "ANGEL", "VENTURE_CAPITAL", "PRIVATE_EQUITY",
  "CORPORATE", "FAMILY_OFFICE", "ACCELERATOR",
] as const;
export type InvestorTypeValue = typeof INVESTOR_TYPE_VALUES[number];

export const SECTOR_VALUES = [
  "climatetech", "biotech", "agtech", "deeptech",
  "fintech", "healthtech", "edtech", "cleantech",
  "saas", "ecommerce", "ai-ml", "robotics",
] as const;
export type SectorValue = typeof SECTOR_VALUES[number];

export const STAGE_VALUES = [
  "IDEA", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B", "GROWTH",
] as const;
export type StageValue = typeof STAGE_VALUES[number];

export const GEO_VALUES = [
  "North America", "South America", "Europe", "Middle East & Africa",
  "South Asia", "Southeast Asia", "East Asia", "Oceania", "Global",
] as const;
export type GeoValue = typeof GEO_VALUES[number];

// ─── Character limits (shared with UI CharCount components) ────────────────────

export const INVESTOR_CHAR_LIMITS = {
  name:             60,
  email:            254,   // RFC 5321 max
  mobile:           30,
  firmName:         80,
  designation:      80,
  bio:              600,
  websiteUrl:       200,
  linkedinUrl:      200,
  country:          60,
  city:             60,
  investmentThesis: 1000,
  ticketSizeMin:    20,
  ticketSizeMax:    20,
} as const;

// ─── URL safety check — blocks javascript:, file://, data: etc. ───────────────

function isSafeHttpsUrl(val: string): boolean {
  try {
    return new URL(val).protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Numeric ticket amount: digits, commas, dots only ─────────────────────────

const ticketAmountSchema = z
  .string()
  .max(INVESTOR_CHAR_LIMITS.ticketSizeMax)
  .regex(/^[\d.,]*$/, "Must be a numeric value (digits, commas or dots only)")
  .optional();

// ─── Main schema ───────────────────────────────────────────────────────────────

export const investorApplicationSchema = z.object({

  // ── Step 0: Identity ──────────────────────────────────────────────────────
  name: z
    .string()
    .min(2,  "Full name must be at least 2 characters")
    .max(INVESTOR_CHAR_LIMITS.name, `Name must be at most ${INVESTOR_CHAR_LIMITS.name} characters`)
    .regex(
      /^[A-Za-z\u00C0-\u017E\s'\-]+$/,
      "Only letters, spaces, hyphens and apostrophes are allowed"
    )
    .trim(),

  email: z
    .string()
    .email("A valid email address is required")
    .max(INVESTOR_CHAR_LIMITS.email, "Email is too long")
    .trim()
    .toLowerCase(),

  mobile: z
    .string()
    .max(INVESTOR_CHAR_LIMITS.mobile, "Mobile number is too long")
    .optional(),

  // ── Step 1: Firm Profile ──────────────────────────────────────────────────
  firmName: z
    .string()
    .max(INVESTOR_CHAR_LIMITS.firmName, `Firm name must be at most ${INVESTOR_CHAR_LIMITS.firmName} characters`)
    .trim()
    .optional(),

  designation: z
    .string()
    .max(INVESTOR_CHAR_LIMITS.designation, `Title must be at most ${INVESTOR_CHAR_LIMITS.designation} characters`)
    .trim()
    .optional(),

  // Strict enum — rejects any value not in the allowlist
  investorType: z
    .enum(INVESTOR_TYPE_VALUES, {
      errorMap: () => ({ message: "Please select a valid investor type" }),
    })
    .optional(),

  bio: z
    .string()
    .max(INVESTOR_CHAR_LIMITS.bio, `Bio must be at most ${INVESTOR_CHAR_LIMITS.bio} characters`)
    .trim()
    .optional(),

  // URL fields: https:// only — blocks javascript:/file:/data: schemes
  websiteUrl: z
    .string()
    .max(INVESTOR_CHAR_LIMITS.websiteUrl)
    .refine((v) => v === "" || isSafeHttpsUrl(v), {
      message: "Website URL must use https://",
    })
    .optional()
    .or(z.literal("")),

  linkedinUrl: z
    .string()
    .max(INVESTOR_CHAR_LIMITS.linkedinUrl)
    .refine((v) => v === "" || isSafeHttpsUrl(v), {
      message: "LinkedIn URL must use https://",
    })
    .refine(
      (v) => v === "" || v.includes("linkedin.com"),
      { message: "Must be a linkedin.com URL" }
    )
    .optional()
    .or(z.literal("")),

  country: z
    .string()
    .max(INVESTOR_CHAR_LIMITS.country, `Country must be at most ${INVESTOR_CHAR_LIMITS.country} characters`)
    .trim()
    .optional(),

  city: z
    .string()
    .max(INVESTOR_CHAR_LIMITS.city, `City must be at most ${INVESTOR_CHAR_LIMITS.city} characters`)
    .trim()
    .optional(),

  // ── Step 2: Investment Lens ───────────────────────────────────────────────
  // Arrays validated against strict enums — rejects unknown values injected via API
  preferredSectors: z
    .array(z.enum(SECTOR_VALUES))
    .default([]),

  preferredStages: z
    .array(z.enum(STAGE_VALUES))
    .default([]),

  preferredGeographies: z
    .array(z.enum(GEO_VALUES))
    .default([]),

  impactFocused: z.boolean().default(false),

  investmentThesis: z
    .string()
    .max(INVESTOR_CHAR_LIMITS.investmentThesis, `Thesis must be at most ${INVESTOR_CHAR_LIMITS.investmentThesis} characters`)
    .trim()
    .optional(),

  // ── Step 3: Ticket Size ───────────────────────────────────────────────────
  ticketSizeMin: ticketAmountSchema,
  ticketSizeMax: ticketAmountSchema,

}).refine(
  (data) => {
    // Cross-field: min must not exceed max when both are provided
    if (!data.ticketSizeMin || !data.ticketSizeMax) return true;
    const min = parseFloat(data.ticketSizeMin.replace(/[^0-9.]/g, ""));
    const max = parseFloat(data.ticketSizeMax.replace(/[^0-9.]/g, ""));
    if (isNaN(min) || isNaN(max)) return true;
    return min <= max;
  },
  { message: "Minimum ticket cannot exceed maximum", path: ["ticketSizeMin"] }
);

export type InvestorApplicationInput = z.infer<typeof investorApplicationSchema>;

// ─── Safe draft fields (non-sensitive — OK for sessionStorage) ─────────────────

export const INVESTOR_DRAFT_SAFE_FIELDS = [
  "firmName", "designation", "investorType", "bio",
  "websiteUrl", "linkedinUrl", "country", "city",
  "preferredSectors", "preferredStages", "preferredGeographies",
  "impactFocused", "investmentThesis", "ticketSizeMin", "ticketSizeMax",
] as const;

export type InvestorDraftSafeField = typeof INVESTOR_DRAFT_SAFE_FIELDS[number];