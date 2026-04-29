
// ─── All data fetched from real API routes — no mock data ─────────────

import { MentorAvailability, MentorProfile, UserType } from "./types";

export async function getMentorProfile(): Promise<{
  user: UserType;
  profile: MentorProfile;
  availability: MentorAvailability[];
}> {
  const res = await fetch("/api/mentor/profile", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch mentor profile");
  return res.json();
}

export async function updateMentorProfile(
  data: Partial<MentorProfile>
): Promise<MentorProfile> {
  const res = await fetch("/api/mentor/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to update profile");
  }
  return res.json();
}

// ─── Profile completion calculator ───────────────────────────────────
export function calcCompletion(
  profile: MentorProfile,
  user: UserType
): { score: number; missing: string[] } {
  const fields = [
    { label: "Avatar",              filled: !!user.avatarUrl,                                    weight: 5  },
    { label: "Headline",            filled: !!profile.headline,                                  weight: 10 },
    { label: "Bio",                 filled: !!(profile.bio && profile.bio.length >= 50),         weight: 15 },
    { label: "Domains",             filled: profile.domains.length > 0,                         weight: 15 },
    { label: "LinkedIn URL",        filled: !!profile.linkedinUrl,                              weight: 10 },
    { label: "Years of Experience", filled: !!profile.yearsOfExperience,                        weight: 10 },
    { label: "Session Price",       filled: !!profile.sessionPriceUsd,                          weight: 10 },
    { label: "City / Country",      filled: !!(profile.city && profile.country),                weight: 10 },
    { label: "Timezone",            filled: !!profile.timezone,                                 weight: 5  },
    { label: "Website",             filled: !!profile.websiteUrl,                               weight: 5  },
    { label: "Industries",          filled: profile.industries.length > 0,                      weight: 5  },
  ];

  const total   = fields.reduce((sum, f) => sum + f.weight, 0);
  const earned  = fields.filter((f) => f.filled).reduce((sum, f) => sum + f.weight, 0);
  const missing = fields.filter((f) => !f.filled).map((f) => f.label);

  return { score: Math.round((earned / total) * 100), missing };
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DOMAIN_OPTIONS = [
  "SaaS", "Fintech", "Edtech", "Healthtech", "AI/ML", "Web3",
  "Product", "Growth", "Marketing", "Sales", "Engineering",
  "Design", "Operations", "Finance", "Legal", "HR",
];

export const INDUSTRY_OPTIONS = [
  "B2B", "B2C", "D2C", "Enterprise", "SMB",
  "Fintech", "Edtech", "Healthtech", "E-commerce", "Logistics",
  "Gaming", "Media", "Climate Tech",
];