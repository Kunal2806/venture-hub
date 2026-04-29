import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  MentorProfilesTable,
  MentorSessionsTable,
  StartupProfilesTable,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { z } from "zod";

const RequestBody = z.object({
  agendaNote: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { mentorId: string } }
) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session || session.user.role !== "STARTUP") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mentorId } = params;

    // ── Parse body ────────────────────────────────────────────────────────────
    const json = await req.json().catch(() => ({}));
    const body = RequestBody.safeParse(json);
    if (!body.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // ── Resolve startup profile ───────────────────────────────────────────────
    const startupProfile = await db.query.StartupProfilesTable.findFirst({
      where: and(
        eq(StartupProfilesTable.userId, userId),
        eq(StartupProfilesTable.approvalStatus, "APPROVED")
      ),
      columns: { id: true },
    });

    if (!startupProfile) {
      return NextResponse.json(
        { error: "Approved startup profile not found" },
        { status: 403 }
      );
    }

    // ── Verify mentor exists and is available ─────────────────────────────────
    const mentor = await db.query.MentorProfilesTable.findFirst({
      where: and(
        eq(MentorProfilesTable.id, mentorId),
        eq(MentorProfilesTable.approvalStatus, "APPROVED"),
        eq(MentorProfilesTable.isAvailable, true)
      ),
      columns: {
        id: true,
        sessionPriceUsd: true,
        sessionDurationMinutes: true,
      },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: "Mentor not found or unavailable" },
        { status: 404 }
      );
    }

    // ── Check for duplicate pending/accepted session ──────────────────────────
    const existing = await db.query.MentorSessionsTable.findFirst({
      where: and(
        eq(MentorSessionsTable.mentorId, mentorId),
        eq(MentorSessionsTable.startupId, startupProfile.id),
      ),
      columns: { id: true, status: true },
    });

    if (existing) {
      if (existing.status === "REQUESTED" || existing.status === "ACCEPTED") {
        return NextResponse.json(
          { error: "A session request already exists for this mentor", status: existing.status },
          { status: 409 }
        );
      }
      // If it was DECLINED / CANCELLED, allow re-request (new row)
    }

    // ── Create session request ────────────────────────────────────────────────
    const amountUsd = mentor.sessionPriceUsd ?? "0";

    const [newSession] = await db
      .insert(MentorSessionsTable)
      .values({
        mentorId:        mentorId,
        startupId:       startupProfile.id,
        status:          "REQUESTED",
        format:          "VIDEO_CALL",
        agendaNote:      body.data.agendaNote ?? null,
        amountUsd:       amountUsd,
        durationMinutes: mentor.sessionDurationMinutes ?? 60,
      })
      .returning({ id: MentorSessionsTable.id, status: MentorSessionsTable.status });

    return NextResponse.json(
      { sessionId: newSession.id, status: newSession.status },
      { status: 201 }
    );

  } catch (err) {
    console.error("[POST /api/mentors/[mentorId]/request]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}