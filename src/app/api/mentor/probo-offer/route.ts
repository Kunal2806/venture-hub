import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  MentorSessionsTable,
  MentorProfilesTable,
  StartupProfilesTable,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "MENTOR")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { startupProfileId, message } = await req.json() as {
      startupProfileId: string;
      message?: string;
    };

    if (!startupProfileId)
      return NextResponse.json({ error: "startupProfileId is required" }, { status: 400 });

    const [mentor] = await db
      .select({
        id:             MentorProfilesTable.id,
        approvalStatus: MentorProfilesTable.approvalStatus,
        isAvailable:    MentorProfilesTable.isAvailable,
        sessionDurationMinutes: MentorProfilesTable.sessionDurationMinutes,
      })
      .from(MentorProfilesTable)
      .where(eq(MentorProfilesTable.userId, session.user.id as string))
      .limit(1);

    if (!mentor || mentor.approvalStatus !== "APPROVED")
      return NextResponse.json({ error: "Mentor profile not found or not approved" }, { status: 404 });

    const [startup] = await db
      .select({ id: StartupProfilesTable.id, approvalStatus: StartupProfilesTable.approvalStatus })
      .from(StartupProfilesTable)
      .where(eq(StartupProfilesTable.id, startupProfileId))
      .limit(1);

    if (!startup || startup.approvalStatus !== "APPROVED")
      return NextResponse.json({ error: "Startup not found" }, { status: 404 });

    const [existing] = await db
      .select({ id: MentorSessionsTable.id, status: MentorSessionsTable.status })
      .from(MentorSessionsTable)
      .where(
        and(
          eq(MentorSessionsTable.mentorId, mentor.id),
          eq(MentorSessionsTable.startupId, startup.id),
          eq(MentorSessionsTable.amountUsd, "0"),
        )
      )
      .limit(1);

    if (existing) {
      const blockStatuses = ["REQUESTED", "ACCEPTED", "DECLINED", "COMPLETED"];
      
      if (blockStatuses.includes(existing.status)) {
        if (existing.status === "REQUESTED") {
          return NextResponse.json(
            { error: "You have already sent a pro-bono offer to this startup (pending)" },
            { status: 409 }
          );
        } else if (existing.status === "ACCEPTED") {
          return NextResponse.json(
            { error: "This startup has already accepted your pro-bono offer" },
            { status: 409 }
          );
        } else if (existing.status === "DECLINED") {
          return NextResponse.json(
            { error: "This startup declined your previous pro-bono offer" },
            { status: 409 }
          );
        } else {
          return NextResponse.json(
            { error: `Cannot send new offer - existing session is ${existing.status.toLowerCase()}` },
            { status: 409 }
          );
        }
      }
    }

    const [newSession] = await db
      .insert(MentorSessionsTable)
      .values({
        mentorId:        mentor.id,
        startupId:       startup.id,
        status:          "REQUESTED",
        format:          "VIDEO_CALL",
        amountUsd:       "0",
        durationMinutes: mentor.sessionDurationMinutes ?? 60,
        agendaNote: message
          ? `Pro-bono Offer\n\n${message}`
          : "Pro-bono Offer",
      })
      .returning();

    return NextResponse.json({ data: newSession }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/mentor/probo-offer]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}