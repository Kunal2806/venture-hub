// app/api/mentor-sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  MentorSessionsTable,
  MentorProfilesTable,
  StartupProfilesTable,
  UsersTable,
} from "@/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { z } from "zod";

// ── Validation schema ──────────────────────────────────────────────────────
const CreateSessionSchema = z.object({
  mentorProfileId: z.string().uuid("Invalid mentor ID"),
  agendaNote:      z.string().min(10, "Please describe your agenda (min 10 chars)").max(1000),
  scheduledAt:     z.string().datetime("Invalid date format").optional(),
  format:          z.enum(["VIDEO_CALL", "ASYNC_REVIEW", "IN_PERSON"]).default("VIDEO_CALL"),
});

// ── GET /api/mentor-sessions ───────────────────────────────────────────────
// Returns sessions relevant to the logged-in user (startup or mentor)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const role = session.user.role;

  try {
    if (role === "STARTUP") {
      // Find startup profile
      const [startupProfile] = await db
        .select({ id: StartupProfilesTable.id })
        .from(StartupProfilesTable)
        .where(eq(StartupProfilesTable.userId, session.user.id))
        .limit(1);

      if (!startupProfile) {
        return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
      }

      const conditions = [eq(MentorSessionsTable.startupId, startupProfile.id)];
      if (statusFilter) {
        conditions.push(
          eq(MentorSessionsTable.status, statusFilter as
            "REQUESTED" | "ACCEPTED" | "DECLINED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED"
          )
        );
      }

      const sessions = await db
        .select({
          session:      MentorSessionsTable,
          mentorUser:   { name: UsersTable.name, avatarUrl: UsersTable.avatarUrl },
          mentorProfile: {
            id:          MentorProfilesTable.id,
            headline:    MentorProfilesTable.headline,
            domains:     MentorProfilesTable.domains,
            averageRating: MentorProfilesTable.averageRating,
            totalSessions: MentorProfilesTable.totalSessions,
          },
        })
        .from(MentorSessionsTable)
        .innerJoin(MentorProfilesTable, eq(MentorSessionsTable.mentorId, MentorProfilesTable.id))
        .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
        .where(and(...conditions))
        .orderBy(desc(MentorSessionsTable.createdAt));

      return NextResponse.json({ data: sessions });
    }

    if (role === "MENTOR") {
      // Find mentor profile
      const [mentorProfile] = await db
        .select({ id: MentorProfilesTable.id })
        .from(MentorProfilesTable)
        .where(eq(MentorProfilesTable.userId, session.user.id))
        .limit(1);

      if (!mentorProfile) {
        return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
      }

      const conditions = [eq(MentorSessionsTable.mentorId, mentorProfile.id)];
      if (statusFilter) {
        conditions.push(
          eq(MentorSessionsTable.status, statusFilter as
            "REQUESTED" | "ACCEPTED" | "DECLINED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED"
          )
        );
      }

      const sessions = await db
        .select({
          session:       MentorSessionsTable,
          startupUser:   { name: UsersTable.name, avatarUrl: UsersTable.avatarUrl },
          startupProfile: {
            id:          StartupProfilesTable.id,
            companyName: StartupProfilesTable.companyName,
            sector:      StartupProfilesTable.sector,
            stage:       StartupProfilesTable.stage,
            logoUrl:     StartupProfilesTable.logoUrl,
          },
        })
        .from(MentorSessionsTable)
        .innerJoin(StartupProfilesTable, eq(MentorSessionsTable.startupId, StartupProfilesTable.id))
        .innerJoin(UsersTable, eq(StartupProfilesTable.userId, UsersTable.id))
        .where(and(...conditions))
        .orderBy(desc(MentorSessionsTable.createdAt));

      return NextResponse.json({ data: sessions });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (err) {
    console.error("[GET /mentor-sessions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/mentor-sessions ──────────────────────────────────────────────
// Startup creates a session request
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STARTUP") {
    return NextResponse.json({ error: "Only startups can request sessions" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { mentorProfileId, agendaNote, scheduledAt, format } = parsed.data;

  try {
    // 1. Verify startup profile exists and is approved
    const [startupProfile] = await db
      .select({ id: StartupProfilesTable.id, approvalStatus: StartupProfilesTable.approvalStatus })
      .from(StartupProfilesTable)
      .where(eq(StartupProfilesTable.userId, session.user.id))
      .limit(1);

    if (!startupProfile) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }
    if (startupProfile.approvalStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Your startup profile must be approved before booking sessions" },
        { status: 403 }
      );
    }

    // 2. Verify mentor exists, is approved, and is available
    const [mentorProfile] = await db
      .select({
        id:             MentorProfilesTable.id,
        approvalStatus: MentorProfilesTable.approvalStatus,
        isAvailable:    MentorProfilesTable.isAvailable,
        sessionPriceUsd: MentorProfilesTable.sessionPriceUsd,
        sessionDurationMinutes: MentorProfilesTable.sessionDurationMinutes,
      })
      .from(MentorProfilesTable)
      .where(eq(MentorProfilesTable.id, mentorProfileId))
      .limit(1);

    if (!mentorProfile) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }
    if (mentorProfile.approvalStatus !== "APPROVED") {
      return NextResponse.json({ error: "This mentor is not available" }, { status: 400 });
    }
    if (!mentorProfile.isAvailable) {
      return NextResponse.json({ error: "This mentor is not accepting sessions right now" }, { status: 400 });
    }

    // 3. Prevent duplicate pending/accepted sessions with same mentor
    const [existing] = await db
      .select({ id: MentorSessionsTable.id })
      .from(MentorSessionsTable)
      .where(
        and(
          eq(MentorSessionsTable.mentorId, mentorProfile.id),
          eq(MentorSessionsTable.startupId, startupProfile.id),
          or(
            eq(MentorSessionsTable.status, "REQUESTED"),
            eq(MentorSessionsTable.status, "ACCEPTED"),
            eq(MentorSessionsTable.status, "RESCHEDULED")
          )
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "You already have an active session request with this mentor" },
        { status: 409 }
      );
    }

    // 4. Create session
    const now = new Date();
    const [newSession] = await db
      .insert(MentorSessionsTable)
      .values({
        mentorId:        mentorProfile.id,
        startupId:       startupProfile.id,
        status:          "REQUESTED",
        format,
        agendaNote,
        scheduledAt:     scheduledAt ? new Date(scheduledAt) : null,
        amountUsd:       mentorProfile.sessionPriceUsd || "0",
        durationMinutes: mentorProfile.sessionDurationMinutes || 60,
        requestedAt:     now,
        createdAt:       now,
        updatedAt:       now,
      })
      .returning();

    return NextResponse.json({ success: true, data: newSession }, { status: 201 });
  } catch (err) {
    console.error("[POST /mentor-sessions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}