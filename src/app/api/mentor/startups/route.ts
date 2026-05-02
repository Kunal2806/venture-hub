import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { StartupProfilesTable, UsersTable, MentorSessionsTable, MentorProfilesTable } from "@/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "MENTOR")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const search  = searchParams.get("search")?.trim() ?? "";
    const sector  = searchParams.get("sector")?.trim() ?? "";
    const stage   = searchParams.get("stage")?.trim() ?? "";

    const conditions = [
      eq(StartupProfilesTable.approvalStatus, "APPROVED"),
    ];

    if (sector) conditions.push(eq(StartupProfilesTable.sector, sector));
    if (stage)  conditions.push(eq(StartupProfilesTable.stage, stage as any));
    if (search) {
      conditions.push(
        or(
          ilike(StartupProfilesTable.companyName, `%${search}%`),
          ilike(StartupProfilesTable.tagline,     `%${search}%`),
          ilike(StartupProfilesTable.sector,      `%${search}%`),
        )!
      );
    }

    // Get mentor profile
    const [mentor] = await db
      .select({ id: MentorProfilesTable.id })
      .from(MentorProfilesTable)
      .where(eq(MentorProfilesTable.userId, session.user.id as string))
      .limit(1);

    // Get startups
    const startups = await db
      .select({
        id:           StartupProfilesTable.id,
        companyName:  StartupProfilesTable.companyName,
        tagline:      StartupProfilesTable.tagline,
        sector:       StartupProfilesTable.sector,
        stage:        StartupProfilesTable.stage,
        country:      StartupProfilesTable.country,
        city:         StartupProfilesTable.city,
        description:  StartupProfilesTable.description,
        profileScore: StartupProfilesTable.profileScore,
        isFeatured:   StartupProfilesTable.isFeatured,
        logoUrl:      StartupProfilesTable.logoUrl,
        founderName:  UsersTable.name,
      })
      .from(StartupProfilesTable)
      .innerJoin(UsersTable, eq(StartupProfilesTable.userId, UsersTable.id))
      .where(and(...conditions))
      .orderBy(StartupProfilesTable.profileScore)
      .limit(50);

    // If mentor exists, fetch existing pro-bono offers
    let existingOffersMap = new Map<string, string>();
    
    if (mentor && startups.length > 0) {
      const startupIds = startups.map(s => s.id);
      
      const existingOffers = await db
        .select({
          startupId: MentorSessionsTable.startupId,
          status: MentorSessionsTable.status,
        })
        .from(MentorSessionsTable)
        .where(
          and(
            eq(MentorSessionsTable.mentorId, mentor.id),
            eq(MentorSessionsTable.amountUsd, "0"),
          
          )
        );
      
      existingOffers.forEach(offer => {
        existingOffersMap.set(offer.startupId, offer.status);
      });
    }

    const startupsWithStatus = startups.map(startup => ({
      ...startup,
      existingProBonoStatus: existingOffersMap.get(startup.id) || null,
    }));

    return NextResponse.json({ data: startupsWithStatus });
  } catch (error) {
    console.error("[GET /api/mentor/startups]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}