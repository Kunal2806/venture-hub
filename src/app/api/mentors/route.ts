// app/api/mentors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  MentorProfilesTable,
  UsersTable,
} from "@/db/schema";
import { eq, and, gte, lte, ilike, or, desc, count, sql } from "drizzle-orm";

// ── GET /api/mentors ───────────────────────────────────────────────────────
// Public-ish: available + approved mentors (requires login)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search    = searchParams.get("search")    || "";
  const domain    = searchParams.get("domain")    || "";
  const maxPrice  = searchParams.get("maxPrice")  || "";
  const page      = Math.max(1, parseInt(searchParams.get("page")  || "1", 10));
  const limit     = Math.min(50, parseInt(searchParams.get("limit") || "12", 10));
  const offset    = (page - 1) * limit;

  const conditions = [
    eq(MentorProfilesTable.approvalStatus, "APPROVED"),
    eq(MentorProfilesTable.isAvailable,    true),
  ];

  if (maxPrice) {
    conditions.push(lte(MentorProfilesTable.sessionPriceUsd, maxPrice));
  }

  if (search) {
    // Search mentor bio, headline, or linked user name
    conditions.push(
      or(
        ilike(MentorProfilesTable.headline, `%${search}%`),
        ilike(MentorProfilesTable.bio,      `%${search}%`),
        ilike(UsersTable.name,              `%${search}%`)
      )!
    );
  }

  const whereClause = and(...conditions);

  const [mentors, [{ total }]] = await Promise.all([
    db
      .select({
        id:               MentorProfilesTable.id,
        userId:           MentorProfilesTable.userId,
        headline:         MentorProfilesTable.headline,
        bio:              MentorProfilesTable.bio,
        domains:          MentorProfilesTable.domains,
        industries:       MentorProfilesTable.industries,
        country:          MentorProfilesTable.country,
        city:             MentorProfilesTable.city,
        sessionPriceUsd:  MentorProfilesTable.sessionPriceUsd,
        sessionDurationMinutes: MentorProfilesTable.sessionDurationMinutes,
        averageRating:    MentorProfilesTable.averageRating,
        totalSessions:    MentorProfilesTable.totalSessions,
        totalRatings:     MentorProfilesTable.totalRatings,
        isVerified:       MentorProfilesTable.isVerified,
        yearsOfExperience: MentorProfilesTable.yearsOfExperience,
        previousCompanies: MentorProfilesTable.previousCompanies,
        // User info
        name:             UsersTable.name,
        avatarUrl:        UsersTable.avatarUrl,
      })
      .from(MentorProfilesTable)
      .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
      .where(whereClause)
      .orderBy(desc(MentorProfilesTable.averageRating), desc(MentorProfilesTable.totalSessions))
      .limit(limit)
      .offset(offset),

    db
      .select({ total: count() })
      .from(MentorProfilesTable)
      .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
      .where(whereClause),
  ]);

  // Filter by domain in JS (jsonb @> not directly typed in drizzle select)
  // For production scale, add a raw SQL condition; this is fine for early traffic
  const filtered = domain
    ? mentors.filter(m => {
        try {
          const domains = Array.isArray(m.domains) ? m.domains : JSON.parse(m.domains as string);
          return domains.some((d: string) => d.toLowerCase().includes(domain.toLowerCase()));
        } catch {
          return false;
        }
      })
    : mentors;

  return NextResponse.json({
    data: filtered,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}