import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { SessionRatingsTable, UsersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId } = await params;

    const ratings = await db
      .select({
        id:        SessionRatingsTable.id,
        rating:    SessionRatingsTable.rating,
        review:    SessionRatingsTable.review,
        createdAt: SessionRatingsTable.createdAt,
        raterName: UsersTable.name,
        raterId:   SessionRatingsTable.raterId,
        rateeId:   SessionRatingsTable.rateeId,
      })
      .from(SessionRatingsTable)
      .innerJoin(UsersTable, eq(SessionRatingsTable.raterId, UsersTable.id))
      .where(eq(SessionRatingsTable.sessionId, sessionId));

    return NextResponse.json({ data: ratings });
  } catch (error) {
    console.error("[GET /api/sessions/[sessionId]/ratings]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}