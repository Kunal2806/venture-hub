import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  MentorProfilesTable,
  MentorSessionsTable,
  StartupProfilesTable,
  UsersTable,
} from "@/db/schema";
import { and, eq, gte, ilike, or, sql } from "drizzle-orm";
import { auth } from "@/auth";

export type MentorListItem = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  currentRole: string;   // from users join — stored in mentor_applications; we fall back to headline
  company: string | null;
  country: string | null;
  city: string | null;
  domains: string[];
  yearsOfExperience: number | null;
  averageRating: string | null;
  totalSessions: number;
  sessionPriceUsd: string | null;
  isAvailable: boolean;
  requestStatus: "none" | "requested" | "accepted";
};

export type MentorsResponse = {
  mentors: MentorListItem[];
  total: number;
  page: number;
  limit: number;
};

export async function GET(req: NextRequest) {
  try {
    // ── Auth: must be logged-in startup ──────────────────────────────────────
    const session = await auth();
    if (!session || session.user.role !== "STARTUP") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // NextAuth v5: session.user.id is string | undefined — narrow it here
    // so every downstream eq() call gets a guaranteed string.
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse query params ───────────────────────────────────────────────────
    const { searchParams } = req.nextUrl;
    const search   = searchParams.get("search")?.trim()   ?? "";
    const domains  = searchParams.get("domains")          ?? "";   // comma-separated
    const expMin   = searchParams.get("expMin")           ?? "";   // "1" | "3" | "7"
    const sortBy   = searchParams.get("sort")             ?? "experience"; // "experience" | "rating" | "sessions"
    const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit    = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? 12)));
    const offset   = (page - 1) * limit;

    const domainList = domains ? domains.split(",").map(d => d.trim()).filter(Boolean) : [];

    // ── Get this startup's profile id (for requestStatus) ───────────────────
    const startupProfile = await db.query.StartupProfilesTable.findFirst({
      where: eq(StartupProfilesTable.userId, userId),
      columns: { id: true },
    });

    // ── Build WHERE conditions ───────────────────────────────────────────────
    const conditions = [
      eq(MentorProfilesTable.approvalStatus, "APPROVED"),
    ];

    if (search) {
      conditions.push(
        or(
          ilike(UsersTable.name, `%${search}%`),
          ilike(MentorProfilesTable.headline, `%${search}%`),
        )!
      );
    }

    if (expMin) {
      conditions.push(gte(MentorProfilesTable.yearsOfExperience, Number(expMin)));
    }

    // Domain overlap: mentors whose domains jsonb array contains ANY of the selected domains
    // Using Postgres ?| (has any key) operator via sql template
    if (domainList.length > 0) {
      // Cast the jsonb array to text array and use &&  (overlap) operator
      conditions.push(
        sql`${MentorProfilesTable.domains}::text[] && ARRAY[${sql.join(
          domainList.map(d => sql`${d}`),
          sql`, `
        )}]::text[]`
      );
    }

    // ── ORDER BY ─────────────────────────────────────────────────────────────
    const orderBy =
      sortBy === "rating"
        ? sql`${MentorProfilesTable.averageRating} DESC NULLS LAST`
        : sortBy === "sessions"
        ? sql`${MentorProfilesTable.totalSessions} DESC`
        : sql`${MentorProfilesTable.yearsOfExperience} DESC NULLS LAST`;

    // ── Count query ───────────────────────────────────────────────────────────
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(MentorProfilesTable)
      .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
      .where(and(...conditions));

    // ── Main query ────────────────────────────────────────────────────────────
    const rows = await db
      .select({
        id:                 MentorProfilesTable.id,
        userId:             MentorProfilesTable.userId,
        fullName:           UsersTable.name,
        avatarUrl:          UsersTable.avatarUrl,
        headline:           MentorProfilesTable.headline,
        bio:                MentorProfilesTable.bio,
        country:            MentorProfilesTable.country,
        city:               MentorProfilesTable.city,
        domains:            MentorProfilesTable.domains,
        yearsOfExperience:  MentorProfilesTable.yearsOfExperience,
        averageRating:      MentorProfilesTable.averageRating,
        totalSessions:      MentorProfilesTable.totalSessions,
        sessionPriceUsd:    MentorProfilesTable.sessionPriceUsd,
        isAvailable:        MentorProfilesTable.isAvailable,
      })
      .from(MentorProfilesTable)
      .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // ── Fetch request statuses for this startup in one query ─────────────────
    // MentorSessionsTable: mentorId (profile id), startupId (startup profile id), status
    let requestMap: Record<string, "requested" | "accepted"> = {};

    if (startupProfile && rows.length > 0) {
      const mentorIds = rows.map(r => r.id);

      const sessions = await db
        .select({
          mentorId: MentorSessionsTable.mentorId,
          status:   MentorSessionsTable.status,
        })
        .from(MentorSessionsTable)
        .where(
          and(
            eq(MentorSessionsTable.startupId, startupProfile.id),
            sql`${MentorSessionsTable.mentorId} = ANY(ARRAY[${sql.join(
              mentorIds.map(id => sql`${id}::uuid`),
              sql`, `
            )}])`
          )
        );

      // If multiple sessions exist, prefer ACCEPTED > REQUESTED
      for (const s of sessions) {
        const prev = requestMap[s.mentorId];
        if (s.status === "ACCEPTED" || !prev) {
          requestMap[s.mentorId] =
            s.status === "ACCEPTED" ? "accepted" : "requested";
        }
      }
    }

    // ── Shape response ────────────────────────────────────────────────────────
    const mentors: MentorListItem[] = rows.map(r => ({
      id:               r.id,
      userId:           r.userId,
      fullName:         r.fullName,
      avatarUrl:        r.avatarUrl ?? null,
      headline:         r.headline ?? null,
      bio:              r.bio ?? null,
      currentRole:      r.headline ?? "Mentor",
      company:          null,  // not stored on MentorProfilesTable — pull from headline
      country:          r.country ?? null,
      city:             r.city ?? null,
      domains:          (r.domains as string[]) ?? [],
      yearsOfExperience: r.yearsOfExperience ?? null,
      averageRating:    r.averageRating ?? null,
      totalSessions:    r.totalSessions,
      sessionPriceUsd:  r.sessionPriceUsd ?? null,
      isAvailable:      r.isAvailable,
      requestStatus:    requestMap[r.id] ?? "none",
    }));

    return NextResponse.json({
      mentors,
      total: Number(count),
      page,
      limit,
    } satisfies MentorsResponse);

  } catch (err) {
    console.error("[GET /api/mentors]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}