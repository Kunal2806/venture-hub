import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { MentorProfilesTable, UsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;

    const [row] = await db
      .select({
        id:                     MentorProfilesTable.id,
        headline:               MentorProfilesTable.headline,
        bio:                    MentorProfilesTable.bio,
        linkedinUrl:            MentorProfilesTable.linkedinUrl,
        websiteUrl:             MentorProfilesTable.websiteUrl,
        country:                MentorProfilesTable.country,
        city:                   MentorProfilesTable.city,
        domains:                MentorProfilesTable.domains,
        yearsOfExperience:      MentorProfilesTable.yearsOfExperience,
        sessionPriceUsd:        MentorProfilesTable.sessionPriceUsd,
        sessionDurationMinutes: MentorProfilesTable.sessionDurationMinutes,
        timezone:               MentorProfilesTable.timezone,
        isAvailable:            MentorProfilesTable.isAvailable,
        averageRating:          MentorProfilesTable.averageRating,
        totalSessions:          MentorProfilesTable.totalSessions,
        // From users JOIN — read-only, not editable via this form
        name:      UsersTable.name,
        avatarUrl: UsersTable.avatarUrl,
      })
      .from(MentorProfilesTable)
      .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
      .where(eq(MentorProfilesTable.userId, userId))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...row,
        // Decimal columns aate hain string mein Drizzle se — normalize karo
        sessionPriceUsd: row.sessionPriceUsd ?? "",
        averageRating:   row.averageRating ? Number(row.averageRating).toFixed(1) : "—",
      },
    });
  } catch (error) {
    console.error("[GET /api/mentor/profile]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;

    // ── Verify profile exists ─────────────────────────────────────
    const [existing] = await db
      .select({ id: MentorProfilesTable.id })
      .from(MentorProfilesTable)
      .where(eq(MentorProfilesTable.userId, userId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    const body = await req.json();

    const {
      headline,
      bio,
      linkedinUrl,
      websiteUrl,
      country,
      city,
      domains,
      yearsOfExperience,
      sessionPriceUsd,
      sessionDurationMinutes,
      timezone,
      isAvailable,
    } = body;

    if (domains !== undefined && !Array.isArray(domains)) {
      return NextResponse.json({ error: "domains must be an array" }, { status: 400 });
    }

    if (
      sessionDurationMinutes !== undefined &&
      (typeof sessionDurationMinutes !== "number" || sessionDurationMinutes < 15)
    ) {
      return NextResponse.json(
        { error: "sessionDurationMinutes must be a number >= 15" },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (headline               !== undefined) updatePayload.headline               = headline;
    if (bio                    !== undefined) updatePayload.bio                    = bio;
    if (linkedinUrl            !== undefined) updatePayload.linkedinUrl            = linkedinUrl;
    if (websiteUrl             !== undefined) updatePayload.websiteUrl             = websiteUrl;
    if (country                !== undefined) updatePayload.country                = country;
    if (city                   !== undefined) updatePayload.city                   = city;
    if (domains                !== undefined) updatePayload.domains                = domains;
    if (yearsOfExperience      !== undefined) updatePayload.yearsOfExperience      = yearsOfExperience;
    if (sessionPriceUsd        !== undefined) updatePayload.sessionPriceUsd        = sessionPriceUsd === "" ? null : String(sessionPriceUsd);
    if (sessionDurationMinutes !== undefined) updatePayload.sessionDurationMinutes = sessionDurationMinutes;
    if (timezone               !== undefined) updatePayload.timezone               = timezone;
    if (isAvailable            !== undefined) updatePayload.isAvailable            = isAvailable;

    const [updated] = await db
      .update(MentorProfilesTable)
      .set(updatePayload)
      .where(eq(MentorProfilesTable.userId, userId))
      .returning({
        id:                     MentorProfilesTable.id,
        headline:               MentorProfilesTable.headline,
        bio:                    MentorProfilesTable.bio,
        linkedinUrl:            MentorProfilesTable.linkedinUrl,
        websiteUrl:             MentorProfilesTable.websiteUrl,
        country:                MentorProfilesTable.country,
        city:                   MentorProfilesTable.city,
        domains:                MentorProfilesTable.domains,
        yearsOfExperience:      MentorProfilesTable.yearsOfExperience,
        sessionPriceUsd:        MentorProfilesTable.sessionPriceUsd,
        sessionDurationMinutes: MentorProfilesTable.sessionDurationMinutes,
        timezone:               MentorProfilesTable.timezone,
        isAvailable:            MentorProfilesTable.isAvailable,
        updatedAt:              MentorProfilesTable.updatedAt,
      });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/mentor/profile]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}