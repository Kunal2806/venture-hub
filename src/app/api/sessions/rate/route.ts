import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  SessionRatingsTable,
  MentorSessionsTable,
  MentorProfilesTable,
  UsersTable,
} from "@/db/schema";
import { eq, and, avg, count } from "drizzle-orm";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raterId = session.user.id as string;

    const { sessionId, rateeId, rating, review } = await req.json() as {
      sessionId: string;
      rateeId:   string;
      rating:    number;
      review?:   string;
    };

    // ── Validation ────────────────────────────────────────────────
    if (!sessionId || !rateeId)
      return NextResponse.json({ error: "sessionId and rateeId are required" }, { status: 400 });

    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });

    const [mentorSession] = await db
      .select({
        id:        MentorSessionsTable.id,
        status:    MentorSessionsTable.status,
        mentorId:  MentorSessionsTable.mentorId,
        startupId: MentorSessionsTable.startupId,
      })
      .from(MentorSessionsTable)
      .where(eq(MentorSessionsTable.id, sessionId))
      .limit(1);

    if (!mentorSession)
      return NextResponse.json({ error: "Session not found" }, { status: 404 });

    if (mentorSession.status !== "COMPLETED")
      return NextResponse.json({ error: "Can only rate completed sessions" }, { status: 409 });

    const [raterUser] = await db
      .select({ id: UsersTable.id })
      .from(UsersTable)
      .where(eq(UsersTable.id, raterId))
      .limit(1);

    if (!raterUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [inserted] = await db
      .insert(SessionRatingsTable)
      .values({
        sessionId,
        raterId,
        rateeId,
        rating,
        review: review || null,
      })
      .onConflictDoNothing()
      .returning();

    if (!inserted)
      return NextResponse.json({ error: "You have already rated this session" }, { status: 409 });

    const mentorProfile = await db.query.MentorProfilesTable.findFirst({
      where: eq(MentorProfilesTable.id, mentorSession.mentorId),
      columns: { userId: true, id: true },
    });

    if (mentorProfile && rateeId === mentorProfile.userId) {
      const [stats] = await db
        .select({
          avgRating:    avg(SessionRatingsTable.rating),
          totalRatings: count(SessionRatingsTable.id),
        })
        .from(SessionRatingsTable)
        .where(eq(SessionRatingsTable.rateeId, rateeId));

      if (stats) {
        await db
          .update(MentorProfilesTable)
          .set({
            averageRating: stats.avgRating ?? "0",
            totalRatings:  Number(stats.totalRatings),
            updatedAt:     new Date(),
          })
          .where(eq(MentorProfilesTable.id, mentorSession.mentorId));
      }
    }

    return NextResponse.json({ data: inserted }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/sessions/rate]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}