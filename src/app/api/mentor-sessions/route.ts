// app/api/mentor-sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  MentorSessionsTable,
  MentorProfilesTable,
  StartupProfilesTable,
  UsersTable,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

// ── POST /api/mentor-sessions ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── Auth: get logged-in startup user ─────────────────────────
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;

    // ── Parse + validate body ─────────────────────────────────────
    const body = await req.json();
    const {
      mentorProfileId, // MentorProfilesTable.id (not userId)
      topic,
      description,
      format = "VIDEO_CALL",
    } = body as {
      mentorProfileId: string;
      topic: string;
      description?: string;
      format?: "VIDEO_CALL" | "ASYNC_REVIEW" | "IN_PERSON";
    };

    if (!mentorProfileId?.trim()) {
      return NextResponse.json(
        { error: "mentorProfileId is required" },
        { status: 400 }
      );
    }
    if (!topic?.trim()) {
      return NextResponse.json(
        { error: "topic is required" },
        { status: 400 }
      );
    }

    // ── Verify mentor exists, is approved, and is available ───────
    const [mentor] = await db
      .select({
        id:              MentorProfilesTable.id,
        isAvailable:     MentorProfilesTable.isAvailable,
        approvalStatus:  MentorProfilesTable.approvalStatus,
        sessionPriceUsd: MentorProfilesTable.sessionPriceUsd,
        sessionDuration: MentorProfilesTable.sessionDurationMinutes,
      })
      .from(MentorProfilesTable)
      .where(
        and(
          eq(MentorProfilesTable.id, mentorProfileId),
          eq(MentorProfilesTable.approvalStatus, "APPROVED"),
        )
      )
      .limit(1);

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor not found or not accepting sessions" },
        { status: 404 }
      );
    }

    if (!mentor.isAvailable) {
      return NextResponse.json(
        { error: "Mentor is not currently available" },
        { status: 409 }
      );
    }

    // ── Resolve requesting startup profile from userId ─────────────
    const [startupProfile] = await db
      .select({ id: StartupProfilesTable.id })
      .from(StartupProfilesTable)
      .where(eq(StartupProfilesTable.userId, userId))
      .limit(1);

    if (!startupProfile) {
      return NextResponse.json(
        { error: "Startup profile not found for this user" },
        { status: 404 }
      );
    }

    // ── Determine amount ──────────────────────────────────────────
    const amountUsd = mentor.sessionPriceUsd ?? "0";

    // ── Insert session row ────────────────────────────────────────
    const [newSession] = await db
      .insert(MentorSessionsTable)
      .values({
        mentorId:        mentor.id,
        startupId:       startupProfile.id,
        status:          "REQUESTED",
        format:          format as "VIDEO_CALL" | "ASYNC_REVIEW" | "IN_PERSON",
        agendaNote:      `${topic}${description ? `\n\n${description}` : ""}`,
        amountUsd:       amountUsd,
        durationMinutes: mentor.sessionDuration ?? 60,
      })
      .returning();

    return NextResponse.json({ data: newSession }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/mentor-sessions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET /api/mentor-sessions ──────────────────────────────────────────────
// Returns sessions for the logged-in startup user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status"); // REQUESTED | ACCEPTED | COMPLETED | etc.

    // ── Resolve startup profile ───────────────────────────────────
    const [startupProfile] = await db
      .select({ id: StartupProfilesTable.id })
      .from(StartupProfilesTable)
      .where(eq(StartupProfilesTable.userId, userId))
      .limit(1);

    if (!startupProfile) {
      return NextResponse.json({ data: [] });
    }

    // ── Fetch sessions with mentor name + headline ────────────────
    const conditions = [
      eq(MentorSessionsTable.startupId, startupProfile.id),
    ];

    if (status) {
      conditions.push(
        eq(
          MentorSessionsTable.status,
          status as "REQUESTED" | "ACCEPTED" | "DECLINED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED"
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
        // Mentor info
        mentorId:        MentorProfilesTable.id,
        mentorHeadline:  MentorProfilesTable.headline,
        mentorName:      UsersTable.name,
        mentorAvatar:    UsersTable.avatarUrl,
      })
      .from(MentorSessionsTable)
      .innerJoin(
        MentorProfilesTable,
        eq(MentorSessionsTable.mentorId, MentorProfilesTable.id)
      )
      .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
      .where(and(...conditions))
      .orderBy(MentorSessionsTable.requestedAt);

    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error("[GET /api/mentor-sessions]", error);
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
    const { id, status } = await req.json() as {
      id: string;
      status: "ACCEPTED" | "CANCELLED";
    };

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [startupProfile] = await db
      .select({ id: StartupProfilesTable.id })
      .from(StartupProfilesTable)
      .where(eq(StartupProfilesTable.userId, userId))
      .limit(1);

    if (!startupProfile) {
      return NextResponse.json(
        { error: "Startup profile not found" },
        { status: 404 }
      );
    }

    if (status === "ACCEPTED") {
      const [existing] = await db
        .select({
          status: MentorSessionsTable.status,
          amountUsd: MentorSessionsTable.amountUsd,
        })
        .from(MentorSessionsTable)
        .where(
          and(
            eq(MentorSessionsTable.id, id),
            eq(MentorSessionsTable.startupId, startupProfile.id)
          )
        )
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (existing.status !== "REQUESTED") {
        return NextResponse.json(
          { error: "Can only accept REQUESTED sessions" },
          { status: 409 }
        );
      }

      if (parseFloat(existing.amountUsd) !== 0) {
        return NextResponse.json(
          { error: "Only pro-bono sessions can be accepted" },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(MentorSessionsTable)
        .set({
          status: "ACCEPTED",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(MentorSessionsTable.id, id),
            eq(MentorSessionsTable.startupId, startupProfile.id)
          )
        )
        .returning();

      return NextResponse.json({ data: updated });
    }

    // ── CANCEL ───────────────────────────────────────────────────
    if (status === "CANCELLED") {
      const [existing] = await db
        .select({
          status: MentorSessionsTable.status,
        })
        .from(MentorSessionsTable)
        .where(
          and(
            eq(MentorSessionsTable.id, id),
            eq(MentorSessionsTable.startupId, startupProfile.id)
          )
        )
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (existing.status !== "REQUESTED") {
        return NextResponse.json(
          {
            error: `Cannot cancel a session with status ${existing.status}`,
          },
          { status: 409 }
        );
      }

      const [updated] = await db
        .update(MentorSessionsTable)
        .set({
          status: "CANCELLED",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(MentorSessionsTable.id, id),
            eq(MentorSessionsTable.startupId, startupProfile.id)
          )
        )
        .returning();

      return NextResponse.json({ data: updated });
    }

    // ── fallback ─────────────────────────────────────────────────
    return NextResponse.json(
      { error: "Invalid status value" },
      { status: 400 }
    );

  } catch (error) {
    console.error("[PATCH /api/mentor-sessions]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}