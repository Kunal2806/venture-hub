import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  UsersTable,
  MentorProfilesTable,
  MentorAvailabilityTable,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/auth";

// GET /api/mentor/profile
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, session.user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role !== "MENTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await db.query.MentorProfilesTable.findFirst({
      where: eq(MentorProfilesTable.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    const availability = await db.query.MentorAvailabilityTable.findMany({
      where: eq(MentorAvailabilityTable.mentorId, profile.id),
      orderBy: [asc(MentorAvailabilityTable.dayOfWeek)],
    });

    return NextResponse.json({ user, profile, availability });
  } catch (err) {
    console.error("[GET /api/mentor/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/mentor/profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.MentorProfilesTable.findFirst({
      where: eq(MentorProfilesTable.userId, session.user.id),
      columns: { id: true, approvalStatus: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }
    if (profile.approvalStatus === "SUSPENDED") {
      return NextResponse.json({ error: "Account is suspended" }, { status: 403 });
    }

    const body = await req.json();

    const {
      headline,
      bio,
      linkedinUrl,
      websiteUrl,
      country,
      city,
      timezone,
      domains,
      industries,
      yearsOfExperience,
      previousCompanies,
      sessionPriceUsd,
      sessionDurationMinutes,
      isAvailable,
    } = body;

    // Validation
    if (bio !== undefined && bio !== null && bio.trim().length < 50) {
      return NextResponse.json({ error: "Bio must be at least 50 characters" }, { status: 422 });
    }
    if (domains !== undefined && (!Array.isArray(domains) || domains.length < 1 || domains.length > 5)) {
      return NextResponse.json({ error: "Select 1–5 domains" }, { status: 422 });
    }
    if (linkedinUrl && !/linkedin\.com\/in\/.+/.test(linkedinUrl)) {
      return NextResponse.json({ error: "Enter a valid LinkedIn profile URL" }, { status: 422 });
    }
    if (yearsOfExperience !== undefined && (yearsOfExperience < 1 || yearsOfExperience > 50)) {
      return NextResponse.json({ error: "Years of experience must be between 1 and 50" }, { status: 422 });
    }

    // Build update payload — only whitelisted fields
    const updateData: Partial<typeof MentorProfilesTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (headline !== undefined)               updateData.headline = headline || null;
    if (bio !== undefined)                    updateData.bio = bio || null;
    if (linkedinUrl !== undefined)            updateData.linkedinUrl = linkedinUrl || null;
    if (websiteUrl !== undefined)             updateData.websiteUrl = websiteUrl || null;
    if (country !== undefined)                updateData.country = country || null;
    if (city !== undefined)                   updateData.city = city || null;
    if (timezone !== undefined)               updateData.timezone = timezone || null;
    if (domains !== undefined)                updateData.domains = domains;
    if (industries !== undefined)             updateData.industries = industries;
    if (yearsOfExperience !== undefined)      updateData.yearsOfExperience = yearsOfExperience;
    if (previousCompanies !== undefined)      updateData.previousCompanies = previousCompanies || null;
    if (sessionPriceUsd !== undefined)        updateData.sessionPriceUsd = sessionPriceUsd || null;
    if (sessionDurationMinutes !== undefined) updateData.sessionDurationMinutes = sessionDurationMinutes;
    if (isAvailable !== undefined)            updateData.isAvailable = isAvailable;

    const [updated] = await db
      .update(MentorProfilesTable)
      .set(updateData)
      .where(eq(MentorProfilesTable.id, profile.id))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/mentor/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}