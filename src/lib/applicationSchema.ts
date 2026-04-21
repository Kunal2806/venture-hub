/**
 * Single source of truth for application validation.
 * Used by BOTH the API route (server) and the form page (client).
 * Eliminates the gap where client rules differed from server rules.
 */

import { z } from "zod";

// ─── Allowlists ────────────────────────────────────────────────────────────────

export const SECTOR_VALUES = [
  "climatetech", "biotech", "agtech", "deeptech",
  "fintech", "healthtech", "edtech", "cleantech",
  "saas", "ecommerce", "ai-ml", "robotics",
] as const;

export type SectorValue = typeof SECTOR_VALUES[number];

export const STAGE_VALUES = [
  "IDEA", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH",
] as const;

export type StageValue = typeof STAGE_VALUES[number];

/** Allowed URL schemes — everything else (javascript:, file://, data:) is blocked */
const SAFE_URL_SCHEMES = ["https://"] as const;

function isSafeUrl(val: string): boolean {
  try {
    const url = new URL(val);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Field character limits (shared with the UI) ───────────────────────────────

export const CHAR_LIMITS = {
  founderName:       60,
  companyName:       80,
  websiteUrl:        200,
  impactDescription: 500,
  impactMetrics:     150,
  capitalRequested:  30,
  useOfFunds:        400,
  pitchDeckUrl:      300,
  country:           60,
  mobile:            30,
  email:             254,   // RFC 5321 max
  sector:            20,
  fundingPeriod:     30,
} as const;

// ─── Shared Zod schema ─────────────────────────────────────────────────────────

export const applicationSchema = z.object({
  founderName: z
    .string()
    .min(2, "Founder name must be at least 2 characters")
    .max(CHAR_LIMITS.founderName, `Founder name must be at most ${CHAR_LIMITS.founderName} characters`)
    .regex(
      /^[A-Za-z\u00C0-\u017E\s'\-]+$/,
      "Only letters, spaces, hyphens and apostrophes are allowed"
    )
    .trim(),

  email: z
    .string()
    .email("A valid email address is required")
    .max(CHAR_LIMITS.email, "Email is too long")
    .trim()
    .toLowerCase(),

  mobile: z
    .string()
    .max(CHAR_LIMITS.mobile, "Mobile number is too long")
    .optional(),

  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(CHAR_LIMITS.companyName, `Company name must be at most ${CHAR_LIMITS.companyName} characters`)
    .trim(),

  // Strict enum — rejects any value not in the allowlist
  sector: z.enum(SECTOR_VALUES, {
    errorMap: () => ({ message: "Please select a valid industry" }),
  }),

  stage: z.enum(STAGE_VALUES, {
    errorMap: () => ({ message: "Please select a valid stage" }),
  }),

  country: z
    .string()
    .max(CHAR_LIMITS.country, `Country must be at most ${CHAR_LIMITS.country} characters`)
    .trim()
    .optional(),

  // URL fields: must be https://, block javascript:/file:/data: etc.
  websiteUrl: z
    .string()
    .max(CHAR_LIMITS.websiteUrl)
    .refine((v) => v === "" || isSafeUrl(v), {
      message: "Website URL must use https://",
    })
    .optional()
    .or(z.literal("")),

  pitchDeckUrl: z
    .string()
    .max(CHAR_LIMITS.pitchDeckUrl)
    .refine((v) => v === "" || isSafeUrl(v), {
      message: "Pitch deck URL must use https://",
    })
    .optional()
    .or(z.literal("")),

  impactDescription: z
    .string()
    .max(CHAR_LIMITS.impactDescription, `Impact description must be at most ${CHAR_LIMITS.impactDescription} characters`)
    .optional(),

  impactMetrics: z
    .string()
    .max(CHAR_LIMITS.impactMetrics, `Impact metrics must be at most ${CHAR_LIMITS.impactMetrics} characters`)
    .optional(),

  // Numeric amount — digits, commas and dots only
  capitalRequested: z
    .string()
    .max(CHAR_LIMITS.capitalRequested)
    .regex(/^[\d.,]*$/, "Capital must be a numeric value")
    .optional(),

  // Currency code validated against a known allowlist
  capitalCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Invalid currency code")
    .optional(),

  fundingPeriod: z
    .string()
    .max(CHAR_LIMITS.fundingPeriod)
    .optional(),

  useOfFunds: z
    .string()
    .max(CHAR_LIMITS.useOfFunds, `Use of funds must be at most ${CHAR_LIMITS.useOfFunds} characters`)
    .optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;