// app/api/mentor-sessions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  MentorSessionsTable,
  MentorProfilesTable,
  StartupProfilesTable,
  UsersTable,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// ── Validation ─────────────────────────────────────────────────────────────
const PatchSessionSchema = z.discriminatedUnion("action", [
  z.object({
    action:          z.literal("accept"),
    scheduledAt:     z.string().datetime("Invalid date"),
    videoCallLink:   z.string().url().optional(),
  }),
  z.object({
    action:          z.literal("decline"),
    cancellationReason: z.string().min(1).max(500).optional(),
  }),
  z.object({
    action:          z.literal("reschedule"),
    scheduledAt:     z.string().datetime("New scheduled time required"),
    rescheduleReason: z.string().min(1).max(500).optional(),
  }),
  z.object({
    action:          z.literal("complete"),
    sessionNotes:    z.string().max(2000).optional(),
    deliverables:    z.string().max(1000).optional(),
  }),
  z.object({
    action:          z.literal("cancel"),
    cancellationReason: z.string().min(1).max(500).optional(),
  }),
]);

// ── GET /api/mentor-sessions/[id] ─────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [mentorSession] = await db
    .select({
      session:       MentorSessionsTable,
      mentorUser:    { id: UsersTable.id, name: UsersTable.name, avatarUrl: UsersTable.avatarUrl },
      mentorProfile: {
        id:            MentorProfilesTable.id,
        headline:      MentorProfilesTable.headline,
        bio:           MentorProfilesTable.bio,
        domains:       MentorProfilesTable.domains,
        averageRating: MentorProfilesTable.averageRating,
        sessionPriceUsd: MentorProfilesTable.sessionPriceUsd,
        userId:        MentorProfilesTable.userId,
      },
      startupProfile: {
        id:          StartupProfilesTable.id,
        companyName: StartupProfilesTable.companyName,
        sector:      StartupProfilesTable.sector,
        logoUrl:     StartupProfilesTable.logoUrl,
        userId:      StartupProfilesTable.userId,
      },
    })
    .from(MentorSessionsTable)
    .innerJoin(MentorProfilesTable, eq(MentorSessionsTable.mentorId, MentorProfilesTable.id))
    .innerJoin(StartupProfilesTable, eq(MentorSessionsTable.startupId, StartupProfilesTable.id))
    .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
    .where(eq(MentorSessionsTable.id, params.id))
    .limit(1);

  if (!mentorSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Ensure requester is a participant
  const isMentor  = mentorSession.mentorProfile.userId === session.user.id;
  const isStartup = mentorSession.startupProfile.userId === session.user.id;
  const isAdmin   = session.user.role === "ADMIN";

  if (!isMentor && !isStartup && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: mentorSession });
}

// ── PATCH /api/mentor-sessions/[id] ───────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = PatchSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const now = new Date();

  // Fetch the session with ownership info
  const [existing] = await db
    .select({
      session:    MentorSessionsTable,
      mentorUserId:  MentorProfilesTable.userId,
      startupUserId: StartupProfilesTable.userId,
    })
    .from(MentorSessionsTable)
    .innerJoin(MentorProfilesTable, eq(MentorSessionsTable.mentorId, MentorProfilesTable.id))
    .innerJoin(StartupProfilesTable, eq(MentorSessionsTable.startupId, StartupProfilesTable.id))
    .where(eq(MentorSessionsTable.id, params.id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isMentor  = existing.mentorUserId  === session.user.id;
  const isStartup = existing.startupUserId === session.user.id;
  const { action } = parsed.data;
  const currentStatus = existing.session.status;

  // ── ACCEPT (mentor only) ─────────────────────────────────────────────────
  if (action === "accept") {
    if (!isMentor) return NextResponse.json({ error: "Only the mentor can accept" }, { status: 403 });
    if (currentStatus !== "REQUESTED" && currentStatus !== "RESCHEDULED") {
      return NextResponse.json({ error: `Cannot accept a session in ${currentStatus} status` }, { status: 409 });
    }

    const [updated] = await db
      .update(MentorSessionsTable)
      .set({
        status:        "ACCEPTED",
        scheduledAt:   new Date(parsed.data.scheduledAt),
        videoCallLink: "videoCallLink" in parsed.data ? parsed.data.videoCallLink : null,
        updatedAt:     now,
      })
      .where(eq(MentorSessionsTable.id, params.id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  }

  // ── DECLINE (mentor only) ────────────────────────────────────────────────
  if (action === "decline") {
    if (!isMentor) return NextResponse.json({ error: "Only the mentor can decline" }, { status: 403 });
    if (currentStatus !== "REQUESTED" && currentStatus !== "RESCHEDULED") {
      return NextResponse.json({ error: `Cannot decline a session in ${currentStatus} status` }, { status: 409 });
    }

    const [updated] = await db
      .update(MentorSessionsTable)
      .set({
        status:             "DECLINED",
        cancellationReason: "cancellationReason" in parsed.data ? parsed.data.cancellationReason : null,
        cancelledAt:        now,
        updatedAt:          now,
      })
      .where(eq(MentorSessionsTable.id, params.id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  }

  // ── RESCHEDULE (mentor only) ─────────────────────────────────────────────
  if (action === "reschedule") {
    if (!isMentor) return NextResponse.json({ error: "Only the mentor can reschedule" }, { status: 403 });
    if (currentStatus !== "ACCEPTED" && currentStatus !== "REQUESTED") {
      return NextResponse.json({ error: `Cannot reschedule a session in ${currentStatus} status` }, { status: 409 });
    }

    const [updated] = await db
      .update(MentorSessionsTable)
      .set({
        status:           "RESCHEDULED",
        scheduledAt:      new Date(parsed.data.scheduledAt),
        rescheduleReason: "rescheduleReason" in parsed.data ? parsed.data.rescheduleReason : null,
        rescheduledAt:    now,
        updatedAt:        now,
      })
      .where(eq(MentorSessionsTable.id, params.id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  }

  // ── COMPLETE (mentor only) ───────────────────────────────────────────────
  if (action === "complete") {
    if (!isMentor) return NextResponse.json({ error: "Only the mentor can mark as complete" }, { status: 403 });
    if (currentStatus !== "ACCEPTED") {
      return NextResponse.json({ error: "Session must be accepted before it can be completed" }, { status: 409 });
    }

    const [updated] = await db
      .update(MentorSessionsTable)
      .set({
        status:       "COMPLETED",
        sessionNotes: "sessionNotes" in parsed.data ? parsed.data.sessionNotes : null,
        deliverables: "deliverables" in parsed.data ? parsed.data.deliverables : null,
        completedAt:  now,
        updatedAt:    now,
      })
      .where(eq(MentorSessionsTable.id, params.id))
      .returning();

    // Increment mentor's totalSessions counter
    await db
      .update(MentorProfilesTable)
      .set({
        totalSessions: existing.session.startupId ? db
          .select()
          .from(MentorProfilesTable) as any : undefined, // handled below via raw
        updatedAt: now,
      })
      .where(eq(MentorProfilesTable.id, existing.session.mentorId));

    // Use raw increment safely
    await db.execute(
      `UPDATE mentor_profiles SET total_sessions = total_sessions + 1, updated_at = NOW() WHERE id = $1`,
      // Note: switch to db.run() / db.execute() per your driver. With drizzle-orm/neon-http:
      // @ts-ignore
      [existing.session.mentorId]
    );

    return NextResponse.json({ success: true, data: updated });
  }

  // ── CANCEL (either party) ────────────────────────────────────────────────
  if (action === "cancel") {
    if (!isMentor && !isStartup) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED" || currentStatus === "DECLINED") {
      return NextResponse.json({ error: `Cannot cancel a session in ${currentStatus} status` }, { status: 409 });
    }

    const [updated] = await db
      .update(MentorSessionsTable)
      .set({
        status:             "CANCELLED",
        cancellationReason: "cancellationReason" in parsed.data ? parsed.data.cancellationReason : null,
        cancelledAt:        now,
        updatedAt:          now,
      })
      .where(eq(MentorSessionsTable.id, params.id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}