import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { MentorAvailabilityTable, MentorProfilesTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

async function resolveMentorProfileId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: MentorProfilesTable.id })
    .from(MentorProfilesTable)
    .where(eq(MentorProfilesTable.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const mentorId = await resolveMentorProfileId(session.user.id as string);
    if (!mentorId)
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });

    const slots = await db
      .select()
      .from(MentorAvailabilityTable)
      .where(eq(MentorAvailabilityTable.mentorId, mentorId))
      .orderBy(MentorAvailabilityTable.dayOfWeek, MentorAvailabilityTable.startTime);

    return NextResponse.json({ data: slots });
  } catch (error) {
    console.error("[GET /api/mentor/availability]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const mentorId = await resolveMentorProfileId(session.user.id as string);
    if (!mentorId)
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });

    const { dayOfWeek, startTime, endTime } = await req.json() as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    };

    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6)
      return NextResponse.json({ error: "dayOfWeek must be 0–6" }, { status: 400 });
    if (!timeRe.test(startTime) || !timeRe.test(endTime))
      return NextResponse.json({ error: "startTime / endTime must be HH:MM" }, { status: 400 });
    if (startTime >= endTime)
      return NextResponse.json({ error: "startTime must be before endTime" }, { status: 400 });

    const [slot] = await db
      .insert(MentorAvailabilityTable)
      .values({ mentorId, dayOfWeek, startTime, endTime, isActive: true })
      .returning();

    return NextResponse.json({ data: slot }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/mentor/availability]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const mentorId = await resolveMentorProfileId(session.user.id as string);
    if (!mentorId)
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });

    const { id, isActive } = await req.json() as { id: string; isActive: boolean };

    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    if (typeof isActive !== "boolean")
      return NextResponse.json({ error: "isActive must be boolean" }, { status: 400 });

    const [updated] = await db
      .update(MentorAvailabilityTable)
      .set({ isActive })
      .where(and(
        eq(MentorAvailabilityTable.id, id),
        eq(MentorAvailabilityTable.mentorId, mentorId)
      ))
      .returning();

    if (!updated)
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/mentor/availability]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const mentorId = await resolveMentorProfileId(session.user.id as string);
    if (!mentorId)
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });

    const { id } = await req.json() as { id: string };

    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    const [deleted] = await db
      .delete(MentorAvailabilityTable)
      .where(and(
        eq(MentorAvailabilityTable.id, id),
        eq(MentorAvailabilityTable.mentorId, mentorId)
      ))
      .returning({ id: MentorAvailabilityTable.id });

    if (!deleted)
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });

    return NextResponse.json({ data: { id: deleted.id } });
  } catch (error) {
    console.error("[DELETE /api/mentor/availability]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}