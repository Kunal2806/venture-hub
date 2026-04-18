import { z } from "zod";

export const InvestorProfileSchema = z
  .object({
    firmName: z
      .string()
      .min(2, "Firm name must be at least 2 characters")
      .max(100, "Firm name must be under 100 characters")
      .optional()
      .or(z.literal("")),

    designation: z
      .string()
      .min(2, "Designation must be at least 2 characters")
      .max(100, "Designation must be under 100 characters")
      .optional()
      .or(z.literal("")),

    bio: z
      .string()
      .max(1000, "Bio must be under 1000 characters")
      .optional()
      .or(z.literal("")),

    linkedinUrl: z
      .string()
      .url("Invalid LinkedIn URL")
      .optional()
      .or(z.literal("")),

    websiteUrl: z
      .string()
      .url("Invalid website URL")
      .optional()
      .or(z.literal("")),

    investorType: z.enum(
      [
        "ANGEL",
        "VENTURE_CAPITAL",
        "PRIVATE_EQUITY",
        "CORPORATE",
        "FAMILY_OFFICE",
        "ACCELERATOR",
      ],
      { errorMap: () => ({ message: "Select a valid investor type" }) }
    ),

    preferredSectors: z
      .array(z.string().min(2))
      .min(1, "Select at least one sector"),

    preferredStages: z
      .array(z.string())
      .min(1, "Select at least one stage"),

    preferredGeographies: z.array(z.string()).optional().default([]),

    ticketSizeMin: z.coerce
      .number()
      .positive("Must be a positive number")
      .optional()
      .or(z.literal("").transform(() => undefined)),

    ticketSizeMax: z.coerce
      .number()
      .positive("Must be a positive number")
      .optional()
      .or(z.literal("").transform(() => undefined)),

    investmentThesis: z
      .string()
      .max(2000, "Thesis must be under 2000 characters")
      .optional()
      .or(z.literal("")),

    impactFocused: z.coerce.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (data.ticketSizeMin && data.ticketSizeMax) {
        return data.ticketSizeMax >= data.ticketSizeMin;
      }
      return true;
    },
    {
      message: "Max ticket size must be greater than or equal to min",
      path: ["ticketSizeMax"],
    }
  );

export type InvestorProfileInput = z.infer<typeof InvestorProfileSchema>;

// ─── Investor type display labels ───────────────────────────────────────────

export const INVESTOR_TYPE_LABELS: Record<
  InvestorProfileInput["investorType"],
  string
> = {
  ANGEL: "Angel Investor",
  VENTURE_CAPITAL: "Venture Capital",
  PRIVATE_EQUITY: "Private Equity",
  CORPORATE: "Corporate Investor",
  FAMILY_OFFICE: "Family Office",
  ACCELERATOR: "Accelerator / Incubator",
};

// ─── Multi-select option lists ───────────────────────────────────────────────

export const SECTOR_OPTIONS = [
  "Fintech",
  "Healthtech",
  "Edtech",
  "Agritech",
  "Cleantech",
  "SaaS",
  "E-commerce",
  "Logistics",
  "AI / ML",
  "Deeptech",
  "Biotech",
  "Real Estate",
  "Media & Entertainment",
  "Gaming",
  "D2C / Consumer",
  "Climate Tech",
  "Cybersecurity",
  "HR Tech",
  "Legal Tech",
  "PropTech",
  "Mobility",
  "Space Tech",
  "Web3 / Blockchain",
  "Social Impact",
] as const;

export const STAGE_OPTIONS = [
  "IDEA",
  "PRE_SEED",
  "SEED",
  "SERIES_A",
  "SERIES_B",
  "SERIES_C",
  "GROWTH",
] as const;

export const STAGE_LABELS: Record<(typeof STAGE_OPTIONS)[number], string> = {
  IDEA: "Idea Stage",
  PRE_SEED: "Pre-Seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  SERIES_B: "Series B",
  SERIES_C: "Series C",
  GROWTH: "Growth",
};

export const GEOGRAPHY_OPTIONS = [
  "India",
  "USA",
  "Southeast Asia",
  "Europe",
  "Middle East",
  "Africa",
  "Latin America",
  "APAC",
  "Global",
] as const;