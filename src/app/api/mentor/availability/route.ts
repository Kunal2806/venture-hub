import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { MentorProfilesTable, MentorAvailabilityTable } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/auth";

// GET /api/mentor/availability
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.MentorProfilesTable.findFirst({
      where: eq(MentorProfilesTable.userId, session.user.id),
      columns: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    const slots = await db.query.MentorAvailabilityTable.findMany({
      where: eq(MentorAvailabilityTable.mentorId, profile.id),
      orderBy: [asc(MentorAvailabilityTable.dayOfWeek)],
    });

    return NextResponse.json(slots);
  } catch (err) {
    console.error("[GET /api/mentor/availability]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/mentor/availability
// Body: { slots: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[] }
// Replaces all existing slots for this mentor (delete + insert in a transaction)
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

    const { slots } = await req.json();

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: "slots must be an array" }, { status: 422 });
    }

    // Validate each slot
    for (const s of slots) {
      if (typeof s.dayOfWeek !== "number" || s.dayOfWeek < 0 || s.dayOfWeek > 6) {
        return NextResponse.json({ error: "dayOfWeek must be 0 (Sun) – 6 (Sat)" }, { status: 422 });
      }
      if (!/^\d{2}:\d{2}$/.test(s.startTime) || !/^\d{2}:\d{2}$/.test(s.endTime)) {
        return NextResponse.json({ error: "Times must be in HH:MM format (UTC)" }, { status: 422 });
      }
      if (s.startTime >= s.endTime) {
        return NextResponse.json({ error: "startTime must be before endTime" }, { status: 422 });
      }
    }

    // Replace all slots in a transaction
    await db.transaction(async (tx) => {
      // Delete existing slots for this mentor
      await tx
        .delete(MentorAvailabilityTable)
        .where(eq(MentorAvailabilityTable.mentorId, profile.id));

      // Insert new slots (skip if empty array)
      if (slots.length > 0) {
        await tx.insert(MentorAvailabilityTable).values(
          slots.map((s: { dayOfWeek: number; startTime: string; endTime: string; isActive?: boolean }) => ({
            mentorId: profile.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isActive: s.isActive ?? true,
          }))
        );
      }
    });

    // Return updated slots
    const updated = await db.query.MentorAvailabilityTable.findMany({
      where: eq(MentorAvailabilityTable.mentorId, profile.id),
      orderBy: [asc(MentorAvailabilityTable.dayOfWeek)],
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/mentor/availability]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}