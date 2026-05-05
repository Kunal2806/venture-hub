import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  MentorProfilesTable,
  MentorAvailabilityTable,
  SessionRatingsTable,
  UsersTable,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { shapeMentor } from "../route";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_RE.test(id))
      return NextResponse.json({ error: "Invalid mentor ID" }, { status: 400 });

    const [row] = await db
      .select({
        id:                     MentorProfilesTable.id,
        userId:                 MentorProfilesTable.userId,
        headline:               MentorProfilesTable.headline,
        bio:                    MentorProfilesTable.bio,
        linkedinUrl:            MentorProfilesTable.linkedinUrl,
        websiteUrl:             MentorProfilesTable.websiteUrl,
        country:                MentorProfilesTable.country,
        city:                   MentorProfilesTable.city,
        domains:                MentorProfilesTable.domains,
        industries:             MentorProfilesTable.industries,
        yearsOfExperience:      MentorProfilesTable.yearsOfExperience,
        previousCompanies:      MentorProfilesTable.previousCompanies,
        sessionPriceUsd:        MentorProfilesTable.sessionPriceUsd,
        sessionDurationMinutes: MentorProfilesTable.sessionDurationMinutes,
        timezone:               MentorProfilesTable.timezone,
        isAvailable:            MentorProfilesTable.isAvailable,
        isVerified:             MentorProfilesTable.isVerified,
        totalSessions:          MentorProfilesTable.totalSessions,
        averageRating:          MentorProfilesTable.averageRating,
        totalRatings:           MentorProfilesTable.totalRatings,
        createdAt:              MentorProfilesTable.createdAt,
        name:                   UsersTable.name,
        avatarUrl:              UsersTable.avatarUrl,
      })
      .from(MentorProfilesTable)
      .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
      .where(
        and(
          eq(MentorProfilesTable.id, id),
          eq(MentorProfilesTable.approvalStatus, "APPROVED")
        )
      )
      .limit(1);

    if (!row)
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });

    const [slots, reviews] = await Promise.all([
      db
        .select({
          startTime: MentorAvailabilityTable.startTime,
          endTime:   MentorAvailabilityTable.endTime,
        })
        .from(MentorAvailabilityTable)
        .where(
          and(
            eq(MentorAvailabilityTable.mentorId, id),
            eq(MentorAvailabilityTable.isActive, true)
          )
        ),

      db
        .select({
          id:        SessionRatingsTable.id,
          rating:    SessionRatingsTable.rating,
          review:    SessionRatingsTable.review,
          createdAt: SessionRatingsTable.createdAt,
          raterName: UsersTable.name,
        })
        .from(SessionRatingsTable)
        .innerJoin(UsersTable, eq(SessionRatingsTable.raterId, UsersTable.id))
        .where(eq(SessionRatingsTable.rateeId, row.userId))
        .orderBy(desc(SessionRatingsTable.createdAt))
        .limit(10),
    ]);

    const hoursPerWeek = slots.reduce((acc, slot) => {
      const [sh, sm] = slot.startTime.split(":").map(Number);
      const [eh, em] = slot.endTime.split(":").map(Number);
      return acc + Math.max(0, eh + em / 60 - (sh + sm / 60));
    }, 0);

    return NextResponse.json({
      data: {
        ...shapeMentor({
          ...row,
          availabilityHoursPerMonth: Math.round(hoursPerWeek * 4),
        }),
        reviews: reviews.map(r => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/mentors/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// app/api/mentors/[id]/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/db";
// import {
//   MentorProfilesTable,
//   MentorAvailabilityTable,
//   UsersTable,
// } from "@/db/schema";
// import { eq, and } from "drizzle-orm";
// import { shapeMentor } from "../route";

// // ✅ UUID validator
// function isUUID(str: string) {
//   return /^[0-9a-fA-F-]{36}$/.test(str);
// }

// // ── GET /api/mentors/:id ───────────────────────────────────────────────
// export async function GET(
//   _req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const { id } = await params;

//     // 🔥 CRITICAL FIX (yahi lagana tha)
//     if (!isUUID(id)) {
//       return NextResponse.json(
//         { error: "Invalid mentor ID" },
//         { status: 400 }
//       );
//     }

//     // ── Fetch mentor profile + user ──────────────────────────────
//     const [row] = await db
//       .select({
//         id:                     MentorProfilesTable.id,
//         userId:                 MentorProfilesTable.userId,
//         approvalStatus:         MentorProfilesTable.approvalStatus,
//         headline:               MentorProfilesTable.headline,
//         bio:                    MentorProfilesTable.bio,
//         linkedinUrl:            MentorProfilesTable.linkedinUrl,
//         websiteUrl:             MentorProfilesTable.websiteUrl,
//         country:                MentorProfilesTable.country,
//         city:                   MentorProfilesTable.city,
//         domains:                MentorProfilesTable.domains,
//         industries:             MentorProfilesTable.industries,
//         yearsOfExperience:      MentorProfilesTable.yearsOfExperience,
//         previousCompanies:      MentorProfilesTable.previousCompanies,
//         sessionPriceUsd:        MentorProfilesTable.sessionPriceUsd,
//         sessionDurationMinutes: MentorProfilesTable.sessionDurationMinutes,
//         timezone:               MentorProfilesTable.timezone,
//         isAvailable:            MentorProfilesTable.isAvailable,
//         isVerified:             MentorProfilesTable.isVerified,
//         totalSessions:          MentorProfilesTable.totalSessions,
//         averageRating:          MentorProfilesTable.averageRating,
//         totalRatings:           MentorProfilesTable.totalRatings,
//         createdAt:              MentorProfilesTable.createdAt,
//         name:                   UsersTable.name,
//         avatarUrl:              UsersTable.avatarUrl,
//         email:                  UsersTable.email,
//       })
//       .from(MentorProfilesTable)
//       .innerJoin(UsersTable, eq(MentorProfilesTable.userId, UsersTable.id))
//       .where(
//         and(
//           eq(MentorProfilesTable.id, id),
//           eq(MentorProfilesTable.approvalStatus, "APPROVED")
//         )
//       )
//       .limit(1);

//     if (!row) {
//       return NextResponse.json(
//         { error: "Mentor not found" },
//         { status: 404 }
//       );
//     }

//     // ── Availability calculation ────────────────────────────────
//     const availabilityRows = await db
//       .select({
//         startTime: MentorAvailabilityTable.startTime,
//         endTime:   MentorAvailabilityTable.endTime,
//       })
//       .from(MentorAvailabilityTable)
//       .where(
//         and(
//           eq(MentorAvailabilityTable.mentorId, id),
//           eq(MentorAvailabilityTable.isActive, true)
//         )
//       );

//     const hoursPerWeek = availabilityRows.reduce((acc, slot) => {
//       const [sh, sm] = slot.startTime.split(":").map(Number);
//       const [eh, em] = slot.endTime.split(":").map(Number);
//       const h = eh + em / 60 - (sh + sm / 60);
//       return acc + Math.max(0, h);
//     }, 0);

//     const availabilityHoursPerMonth = Math.round(hoursPerWeek * 4);

//     const mentor = shapeMentor({
//       ...row,
//       availabilityHoursPerMonth,
//     });

//     return NextResponse.json({ data: mentor });

//   } catch (error) {
//     console.error("[GET /api/mentors/:id]", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }