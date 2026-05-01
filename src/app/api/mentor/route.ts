import { NextRequest, NextResponse } from "next/server";
import { MentorProfilesTable, UsersTable } from "@/db/schema";
import { eq, and, gte, lte, sql, ilike, or, desc } from "drizzle-orm";
import { db } from "@/db";

// ── Shared response shaper ────────────────────────────────────────────────
// Converts a raw DB row into the stable API shape the frontend expects.
// Keeps it in one place so listing + detail pages stay in sync.
export function shapeMentor(row: {
  id: string;
  name: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  domains: unknown;
  industries: unknown;
  yearsOfExperience: number | null;
  averageRating: string | null; // Drizzle returns decimal columns as string
  totalRatings: number;
  totalSessions: number;
  sessionPriceUsd: string | null;
  sessionDurationMinutes: number | null;
  isAvailable: boolean;
  isVerified: boolean;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  previousCompanies: string | null;
  createdAt: Date;
  availabilityHoursPerMonth?: number; // injected by detail route
}) {
  const price = row.sessionPriceUsd ? Number(row.sessionPriceUsd) : null;
  const engagementType = price === null || price === 0 ? "PRO_BONO" : "PAID";

  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatarUrl,
    // headline maps to designation in the frontend Mentor type
    designation: row.headline ?? "",
    // First company from comma-separated previousCompanies = current org
    organization: row.previousCompanies?.split(",")[0]?.trim() ?? "",
    bio: row.bio ?? "",
    expertiseDomains: (row.domains as string[]) ?? [],
    industries: (row.industries as string[]) ?? [],
    yearsOfExperience: row.yearsOfExperience ?? 0,
    averageRating: row.averageRating ? Number(row.averageRating) : 0,
    totalReviews: row.totalRatings,
    totalSessions: row.totalSessions,
    engagementType: engagementType as "PAID" | "PRO_BONO" | "BOTH",
    sessionPrice: price,
    sessionDurationMinutes: row.sessionDurationMinutes ?? 60,
    // Computed from MentorAvailabilityTable in detail route; 0 on listing
    availabilityHoursPerMonth: row.availabilityHoursPerMonth ?? 0,
    isAvailable: row.isAvailable,
    isVerified: row.isVerified,
    linkedinUrl: row.linkedinUrl,
    websiteUrl: row.websiteUrl,
    country: row.country,
    city: row.city,
    timezone: row.timezone,
    createdAt: row.createdAt.toISOString(),
  };
}

// ── GET /api/mentors ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const page    = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit   = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const offset  = (page - 1) * limit;
    const search  = searchParams.get("search")?.trim() ?? "";
    // Multi-domain: ?domains=SaaS&domains=FinTech
    const domains = searchParams.getAll("domains").filter(Boolean);
    const engType = searchParams.get("engagementType") ?? ""; // PAID | PRO_BONO
    const sortBy  = searchParams.get("sortBy") ?? "";         // rating | experience
    const minRating = searchParams.get("minRating");
    const maxPrice  = searchParams.get("maxPrice");
    const onlyAvailable = searchParams.get("available") === "true";

    // ── Build WHERE conditions ────────────────────────────────────
    const conditions = [
      eq(MentorProfilesTable.approvalStatus, "APPROVED"),
    ];

    if (onlyAvailable) {
      conditions.push(eq(MentorProfilesTable.isAvailable, true));
    }

    if (minRating) {
      conditions.push(gte(MentorProfilesTable.averageRating, minRating));
    }

    if (maxPrice) {
      conditions.push(
        or(
          lte(MentorProfilesTable.sessionPriceUsd, maxPrice),
          // Always include free/pro-bono mentors regardless of max price
          sql`${MentorProfilesTable.sessionPriceUsd} IS NULL`
        )!
      );
    }

    // Engagement type — derived from sessionPriceUsd since schema has no enum for it
    if (engType === "PAID") {
      conditions.push(
        and(
          sql`${MentorProfilesTable.sessionPriceUsd} IS NOT NULL`,
          sql`${MentorProfilesTable.sessionPriceUsd} > 0`
        )!
      );
    } else if (engType === "PRO_BONO") {
      conditions.push(
        or(
          sql`${MentorProfilesTable.sessionPriceUsd} IS NULL`,
          sql`${MentorProfilesTable.sessionPriceUsd} = 0`
        )!
      );
    }

    // Domain GIN containment — hits mentor_profiles_domains_gin_idx
    if (domains.length > 0) {
      conditions.push(
        sql`${MentorProfilesTable.domains} @> ${JSON.stringify(domains)}::jsonb`
      );
    }

    // Text search across headline + bio + previousCompanies + user name
    if (search) {
      conditions.push(
        or(
          ilike(MentorProfilesTable.headline, `%${search}%`),
          ilike(MentorProfilesTable.bio, `%${search}%`),
          ilike(MentorProfilesTable.previousCompanies, `%${search}%`),
          ilike(UsersTable.name, `%${search}%`)
        )!
      );
    }

    const orderCol =
      sortBy === "experience"
        ? desc(MentorProfilesTable.yearsOfExperience)
        : desc(MentorProfilesTable.averageRating); // default: highest-rated first

    // Run listing query + count in parallel
    const [rows, countResult] = await Promise.all([
      db
        .select({
          id:                     MentorProfilesTable.id,
          headline:               MentorProfilesTable.headline,
          bio:                    MentorProfilesTable.bio,
          linkedinUrl:            MentorProfilesTable.linkedinUrl,
          websiteUrl:             MentorProfilesTable.websiteUrl,
          country:                MentorProfilesTable.country,
          city:                   MentorProfilesTable.city,
          domains:                MentorProfilesTable.domains,
          industries:             MentorProfilesTable.industries,
          yearsOfExperience:      MentorProfilesTable.yearsOfExperience,
          previousCompanies:      MentorProfilesTable.previousCompanies,
          sessionPriceUsd:        MentorProfilesTable.sessionPriceUsd,
          sessionDurationMinutes: MentorProfilesTable.sessionDurationMinutes,
          timezone:               MentorProfilesTable.timezone,
          isAvailable:            MentorProfilesTable.isAvailable,
          isVerified:             MentorProfilesTable.isVerified,
          totalSessions:          MentorProfilesTable.totalSessions,
          averageRating:          MentorProfilesTable.averageRating,
          totalRatings:           MentorProfilesTable.totalRatings,
          createdAt:              MentorProfilesTable.createdAt,
          // From users JOIN
          name:      UsersTable.name,
          avatarUrl: UsersTable.avatarUrl,
        })
        .from(MentorProfilesTable)
        .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
        .where(and(...conditions))
        .orderBy(orderCol)
        .limit(limit)
        .offset(offset),

      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(MentorProfilesTable)
        .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
        .where(and(...conditions)),
    ]);

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      data: rows.map(shapeMentor),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/mentors]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}