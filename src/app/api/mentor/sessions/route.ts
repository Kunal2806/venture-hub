import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  MentorSessionsTable,
  MentorProfilesTable,
  StartupProfilesTable,
  UsersTable,
  PlatformConfigTable,
  SessionRatingsTable,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/auth";

async function resolveMentorProfileId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: MentorProfilesTable.id })
    .from(MentorProfilesTable)
    .where(eq(MentorProfilesTable.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

// ── GET /api/mentor/sessions ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const mentorId = await resolveMentorProfileId(session.user.id as string);
    if (!mentorId)
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");

    const conditions = [eq(MentorSessionsTable.mentorId, mentorId)];

    if (status) {
      conditions.push(
        eq(
          MentorSessionsTable.status,
          status as
            | "REQUESTED"
            | "ACCEPTED"
            | "DECLINED"
            | "RESCHEDULED"
            | "COMPLETED"
            | "CANCELLED"
        )
      );
    }

    const sessions = await db
      .select({
        id:              MentorSessionsTable.id,
        status:          MentorSessionsTable.status,
        format:          MentorSessionsTable.format,
        agendaNote:      MentorSessionsTable.agendaNote,
        sessionNotes:    MentorSessionsTable.sessionNotes,
        scheduledAt:     MentorSessionsTable.scheduledAt,
        durationMinutes: MentorSessionsTable.durationMinutes,
        amountUsd:       MentorSessionsTable.amountUsd,
        completedAt:     MentorSessionsTable.completedAt,
        cancelledAt:     MentorSessionsTable.cancelledAt,
        requestedAt:     MentorSessionsTable.requestedAt,
        videoCallLink:   MentorSessionsTable.videoCallLink,
        agoraChannel:    MentorSessionsTable.agoraChannel,
        // Startup info — directly joined, no hardcoding needed
        startupId:       StartupProfilesTable.id,
        startupName:     UsersTable.name,
        startupLogo:     UsersTable.avatarUrl,
        mentorEarnings:      MentorSessionsTable.mentorEarnings,
        platformCommission:  MentorSessionsTable.platformCommission,
        mentorUserId: UsersTable.id,
        startupUserId:   UsersTable.id,
      })
      .from(MentorSessionsTable)
      .innerJoin(
        StartupProfilesTable,
        eq(MentorSessionsTable.startupId, StartupProfilesTable.id)
      )
      .innerJoin(UsersTable, eq(StartupProfilesTable.userId, UsersTable.id))
      .where(and(...conditions))
      .orderBy(MentorSessionsTable.requestedAt);

    const ratedRows = await db
      .select({ sessionId: SessionRatingsTable.sessionId, rating: SessionRatingsTable.rating })
      .from(SessionRatingsTable)
      .where(eq(SessionRatingsTable.raterId, session.user.id as string));

    const ratingsBySession = new Map(ratedRows.map(row => [row.sessionId, row.rating]));
    const sessionsWithRating = sessions.map(s => ({
      ...s,
      hasRated: ratingsBySession.has(s.id),
      rating:   ratingsBySession.get(s.id) ?? null,
    }));

    return NextResponse.json({ data: sessionsWithRating });
  } catch (error) {
    console.error("[GET /api/mentor/sessions]", error);
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

    const body = await req.json() as {
      id: string;
      status: "ACCEPTED" | "DECLINED" | "COMPLETED" | "RESCHEDULED" | "CANCELLED";
      scheduledAt?: string;    
      videoCallLink?: string;  
      sessionNotes?: string;
      rescheduleReason?: string;
      durationMinutes?: number;
    };

    if (!body.id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      REQUESTED:   ["ACCEPTED", "DECLINED", "RESCHEDULED"],
      ACCEPTED:    ["COMPLETED", "RESCHEDULED", "CANCELLED"],
      RESCHEDULED: ["ACCEPTED", "DECLINED", "CANCELLED"],
    };

    const [existing] = await db
      .select({ status: MentorSessionsTable.status })
      .from(MentorSessionsTable)
      .where(
        and(
          eq(MentorSessionsTable.id, body.id),
          eq(MentorSessionsTable.mentorId, mentorId)
        )
      )
      .limit(1);

    if (!existing)
      return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(body.status))
      return NextResponse.json(
        { error: `Cannot transition from ${existing.status} to ${body.status}` },
        { status: 409 }
      );

    const now = new Date();
    const updatePayload: Record<string, unknown> = {
      status: body.status,
      updatedAt: now,
    };

    if (body.status === "ACCEPTED") {
      if (body.scheduledAt)      updatePayload.scheduledAt      = new Date(body.scheduledAt);
      if (typeof body.durationMinutes === "number") updatePayload.durationMinutes = body.durationMinutes;
      if (body.videoCallLink)     updatePayload.videoCallLink     = body.videoCallLink;
      
      // 🔴 YAHAN ADD KAR - Agora channel generate
      updatePayload.agoraChannel = `mentor_session_${body.id}`;
      console.log("✅ Generated Agora Channel:", updatePayload.agoraChannel);
    }

    if (body.status === "COMPLETED") {
      updatePayload.completedAt = now;
      if (body.sessionNotes) updatePayload.sessionNotes = body.sessionNotes;

        await db
        .update(MentorProfilesTable)
        .set({
          totalSessions: sql`${MentorProfilesTable.totalSessions} + 1`,
          updatedAt: now,
        })
        .where(eq(MentorProfilesTable.id, mentorId))

      const [config] = await db
        .select({ value: PlatformConfigTable.value })
        .from(PlatformConfigTable)
        .where(eq(PlatformConfigTable.key, "mentor_commission_percent"))
        .limit(1);

      const [sessionRow] = await db
        .select({ amountUsd: MentorSessionsTable.amountUsd })
        .from(MentorSessionsTable)
        .where(eq(MentorSessionsTable.id, body.id))
        .limit(1);

      if (config && sessionRow) {
        const gross      = parseFloat(sessionRow.amountUsd);
        const commission = gross * (parseFloat(config.value) / 100);
        const earnings   = gross - commission;
        updatePayload.platformCommission = commission.toFixed(2);
        updatePayload.mentorEarnings     = earnings.toFixed(2);
      }
    }

    if (body.status === "RESCHEDULED") {
      updatePayload.rescheduledAt    = now;
      updatePayload.rescheduleReason = body.rescheduleReason ?? null;
      updatePayload.scheduledAt      = body.scheduledAt ? new Date(body.scheduledAt) : null;
      if (typeof body.durationMinutes === "number") updatePayload.durationMinutes = body.durationMinutes;
    }

    if (body.status === "CANCELLED") {
      updatePayload.cancelledAt = now;
    }

    const [updated] = await db
      .update(MentorSessionsTable)
      .set(updatePayload)
      .where(
        and(
          eq(MentorSessionsTable.id, body.id),
          eq(MentorSessionsTable.mentorId, mentorId)
        )
      )
      .returning();

    // 🔴 YAHAN BHI ADD KAR - Confirm saved
    console.log("✅ Updated Session with Agora Channel:", updated);

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/mentor/sessions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}