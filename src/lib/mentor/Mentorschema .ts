/**
 * Single source of truth for mentor application validation.
 * Imported by BOTH the API route (server) and any client form.
 *
 * Server enforces everything; the client mirrors for UX only.
 * If you change a rule here, update client-side hints to match.
 */

import { z } from "zod";

// ─── Allowlists ────────────────────────────────────────────────────────────────

export const MENTOR_DOMAIN_VALUES = [
  "product",       "engineering",  "design",      "marketing",
  "sales",         "fundraising",  "legal",       "finance",
  "hr-talent",     "operations",   "strategy",    "ai-ml",
  "deeptech",      "biotech",      "climatetech", "edtech",
  "fintech",       "healthtech",   "saas",        "ecommerce",
] as const;

export type MentorDomainValue = typeof MENTOR_DOMAIN_VALUES[number];

// ─── Character / value limits (shared with UI) ─────────────────────────────────

export const MENTOR_LIMITS = {
  fullName:          60,
  email:             254,  // RFC 5321 max
  mobile:            30,
  linkedinUrl:       200,
  currentRole:       100,
  company:           100,
  yearsOfExperienceMin: 1,
  yearsOfExperienceMax: 60,
  bioMin:            80,
  bioMax:            1200,
  domainsMin:        1,
  domainsMax:        6,    // cap to prevent trivial "select all"
} as const;

// ─── URL safety: https:// only — blocks javascript:, file://, data:, etc. ─────

function isSafeHttpsUrl(val: string): boolean {
  try {
    return new URL(val).protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Shared Zod schema ─────────────────────────────────────────────────────────

export const mentorApplicationSchema = z.object({

  fullName: z
    .string()
    .min(2,  "Full name must be at least 2 characters")
    .max(MENTOR_LIMITS.fullName, `Name must be at most ${MENTOR_LIMITS.fullName} characters`)
    .regex(
      /^[A-Za-z\u00C0-\u017E\s'\-]+$/,
      "Only letters, spaces, hyphens and apostrophes are allowed"
    )
    .trim(),

  email: z
    .string()
    .email("A valid email address is required")
    .max(MENTOR_LIMITS.email, "Email is too long")
    .trim()
    .toLowerCase(),

  mobile: z
    .string()
    .max(MENTOR_LIMITS.mobile, "Mobile number is too long")
    .optional(),

  // https:// only; must contain linkedin.com
  linkedinUrl: z
    .string()
    .max(MENTOR_LIMITS.linkedinUrl, `LinkedIn URL must be at most ${MENTOR_LIMITS.linkedinUrl} characters`)
    .refine((v) => v === "" || isSafeHttpsUrl(v), {
      message: "LinkedIn URL must use https://",
    })
    .refine(
      (v) => v === "" || v.includes("linkedin.com"),
      { message: "Must be a linkedin.com URL" }
    )
    .optional()
    .or(z.literal("")),

  currentRole: z
    .string()
    .min(2,  "Current role must be at least 2 characters")
    .max(MENTOR_LIMITS.currentRole, `Role must be at most ${MENTOR_LIMITS.currentRole} characters`)
    .trim(),

  company: z
    .string()
    .min(2,  "Company name must be at least 2 characters")
    .max(MENTOR_LIMITS.company, `Company must be at most ${MENTOR_LIMITS.company} characters`)
    .trim(),

  // Integer, bounded range, not a free string
  yearsOfExperience: z
    .number()
    .int("Must be a whole number")
    .min(MENTOR_LIMITS.yearsOfExperienceMin, `Must be at least ${MENTOR_LIMITS.yearsOfExperienceMin}`)
    .max(MENTOR_LIMITS.yearsOfExperienceMax, `Must be at most ${MENTOR_LIMITS.yearsOfExperienceMax}`),

  // Strict enum array — rejects unknown values injected via direct API calls
  domains: z
    .array(z.enum(MENTOR_DOMAIN_VALUES))
    .min(MENTOR_LIMITS.domainsMin, "Select at least one domain")
    .max(MENTOR_LIMITS.domainsMax, `Select at most ${MENTOR_LIMITS.domainsMax} domains`),

  bio: z
    .string()
    .min(MENTOR_LIMITS.bioMin,  `Bio must be at least ${MENTOR_LIMITS.bioMin} characters`)
    .max(MENTOR_LIMITS.bioMax,  `Bio must be at most ${MENTOR_LIMITS.bioMax} characters`)
    .trim(),
});

export type MentorApplicationInput = z.infer<typeof mentorApplicationSchema>;

// ─── Safe draft fields (non-sensitive — OK for sessionStorage) ─────────────────

export const MENTOR_DRAFT_SAFE_FIELDS = [
  "currentRole", "company", "yearsOfExperience",
  "domains", "bio", "linkedinUrl",
] as const;

export type MentorDraftSafeField = typeof MENTOR_DRAFT_SAFE_FIELDS[number];