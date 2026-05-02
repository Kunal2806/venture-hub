// app/api/mentors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  MentorProfilesTable,
  MentorAvailabilityTable,
  UsersTable,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { shapeMentor } from "../route";

// ── GET /api/mentors/:id ──────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch mentor profile + user in one query
    const [row] = await db
      .select({
        id:                     MentorProfilesTable.id,
        userId:                 MentorProfilesTable.userId,
        approvalStatus:         MentorProfilesTable.approvalStatus,
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
        name:      UsersTable.name,
        avatarUrl: UsersTable.avatarUrl,
        email:     UsersTable.email,
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

    if (!row) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // ── Compute availabilityHoursPerMonth from MentorAvailabilityTable ──
    // Each active slot = (endTime - startTime) in hours × 4 weeks/month
    // startTime / endTime stored as "HH:MM" UTC strings
    const availabilityRows = await db
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
      );

    const hoursPerWeek = availabilityRows.reduce((acc, slot) => {
      const [sh, sm] = slot.startTime.split(":").map(Number);
      const [eh, em] = slot.endTime.split(":").map(Number);
      const h = eh + em / 60 - (sh + sm / 60);
      return acc + Math.max(0, h);
    }, 0);

    const availabilityHoursPerMonth = Math.round(hoursPerWeek * 4);

    const mentor = shapeMentor({ ...row, availabilityHoursPerMonth });

    return NextResponse.json({ data: mentor });
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