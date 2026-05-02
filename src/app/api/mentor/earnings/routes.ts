import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  MentorSessionsTable,
  MentorProfilesTable,
  StartupProfilesTable,
  UsersTable,
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;

    // ── Resolve mentor profile from userId ────────────────────────
    const [mentorProfile] = await db
      .select({ id: MentorProfilesTable.id })
      .from(MentorProfilesTable)
      .where(eq(MentorProfilesTable.userId, userId))
      .limit(1);

    if (!mentorProfile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }


    const rows = await db
      .select({
        // Session fields
        id:                 MentorSessionsTable.id,
        status:             MentorSessionsTable.status,
        format:             MentorSessionsTable.format,
        agendaNote:         MentorSessionsTable.agendaNote,
        durationMinutes:    MentorSessionsTable.durationMinutes,
        scheduledAt:        MentorSessionsTable.scheduledAt,
        completedAt:        MentorSessionsTable.completedAt,
        requestedAt:        MentorSessionsTable.requestedAt,
        amountUsd:          MentorSessionsTable.amountUsd,
        platformCommission: MentorSessionsTable.platformCommission,
        mentorEarnings:     MentorSessionsTable.mentorEarnings,
        // Startup info — company name from startup_profiles, user name fallback
        startupCompanyName: StartupProfilesTable.companyName,
        startupUserName:    UsersTable.name,
      })
      .from(MentorSessionsTable)
      .innerJoin(
        StartupProfilesTable,
        eq(MentorSessionsTable.startupId, StartupProfilesTable.id)
      )
      .innerJoin(
        UsersTable,
        eq(StartupProfilesTable.userId, UsersTable.id)
      )
      .where(
        and(
          eq(MentorSessionsTable.mentorId, mentorProfile.id),
          eq(MentorSessionsTable.status, "COMPLETED"),
        )
      )
      .orderBy(desc(MentorSessionsTable.completedAt));

    const now        = new Date();
    const thisMonth  = now.getMonth();
    const thisYear   = now.getFullYear();
    const lastMonth  = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear   = thisMonth === 0 ? thisYear - 1 : thisYear;

    let totalEarnings      = 0;
    let thisMonthEarnings  = 0;
    let lastMonthEarnings  = 0;
    let pendingPayouts     = 0; 
    const sessions = rows.map((row) => {
      const gross    = parseFloat(row.amountUsd ?? "0");
      const earned   = row.mentorEarnings ? parseFloat(row.mentorEarnings) : null;
      const paidOut  = earned ?? gross; 
      const dateStr  = row.completedAt ?? row.requestedAt;
      const d        = new Date(dateStr!);

      totalEarnings += paidOut;

      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        thisMonthEarnings += paidOut;
      }
      if (d.getMonth() === lastMonth && d.getFullYear() === lastYear) {
        lastMonthEarnings += paidOut;
      }
      if (!row.mentorEarnings) {
        pendingPayouts += gross;
      }

      return {
        id:                 row.id,
        date:               dateStr,
        startupName:        row.startupCompanyName ?? row.startupUserName,
        topic:              row.agendaNote?.split("\n")[0] ?? "Session",
        format:             row.format,
        durationMinutes:    row.durationMinutes,
        scheduledAt:        row.scheduledAt,
        grossUsd:           row.amountUsd,
        platformCommission: row.platformCommission,
        mentorEarnings:     row.mentorEarnings,
        // Computed for display
        netUsd:             row.mentorEarnings ?? row.amountUsd,
      };
    });

    return NextResponse.json({
      data: sessions,
      stats: {
        totalEarnings:     totalEarnings.toFixed(2),
        thisMonthEarnings: thisMonthEarnings.toFixed(2),
        lastMonthEarnings: lastMonthEarnings.toFixed(2),
        totalSessions:     sessions.length,
        pendingPayouts:    pendingPayouts.toFixed(2),
      },
    });
  } catch (error) {
    console.error("[GET /api/mentor/earnings]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}