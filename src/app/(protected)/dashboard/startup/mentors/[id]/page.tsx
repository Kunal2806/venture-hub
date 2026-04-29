import { notFound } from "next/navigation"
import { eq, and } from "drizzle-orm"
import { db } from "@/db"
import {
  MentorProfilesTable,
  UsersTable,
  MentorSessionsTable,
  StartupProfilesTable,
} from "@/db/schema"
import { auth } from "@/auth" // your auth helper
import MentorDetailClient from "@/components/startup/MentorDetailClient"

interface PageProps {
  params: { id: string }
}

export default async function MentorDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) notFound()

  const userId = session.user.id // now narrowed to string

  // 1. Fetch mentor profile + user info
  const mentor = await db
    .select({
      id: MentorProfilesTable.id,
      userId: MentorProfilesTable.userId,
      approvalStatus: MentorProfilesTable.approvalStatus,
      headline: MentorProfilesTable.headline,
      bio: MentorProfilesTable.bio,
      linkedinUrl: MentorProfilesTable.linkedinUrl,
      websiteUrl: MentorProfilesTable.websiteUrl,
      country: MentorProfilesTable.country,
      city: MentorProfilesTable.city,
      domains: MentorProfilesTable.domains,
      industries: MentorProfilesTable.industries,
      yearsOfExperience: MentorProfilesTable.yearsOfExperience,
      previousCompanies: MentorProfilesTable.previousCompanies,
      sessionPriceUsd: MentorProfilesTable.sessionPriceUsd,
      isAvailable: MentorProfilesTable.isAvailable,
      totalSessions: MentorProfilesTable.totalSessions,
      averageRating: MentorProfilesTable.averageRating,
      totalRatings: MentorProfilesTable.totalRatings,
      isVerified: MentorProfilesTable.isVerified,
      // From users join
      name: UsersTable.name,
      avatarUrl: UsersTable.avatarUrl,
    })
    .from(MentorProfilesTable)
    .innerJoin(UsersTable, eq(UsersTable.id, MentorProfilesTable.userId))
    .where(eq(MentorProfilesTable.id, params.id))
    .limit(1)
    .then((r) => r[0] ?? null)

  // 2. Security gate — only show APPROVED mentors
  if (!mentor || mentor.approvalStatus !== "APPROVED") {
    notFound()
  }

  // 3. Fetch the startup profile for the logged-in user
  const startupProfile = await db.query.StartupProfilesTable.findFirst({
    where: eq(StartupProfilesTable.userId, userId),
    columns: { id: true },
  })

  if (!startupProfile) notFound()

  // 4. Check for existing session/request between this startup and mentor
  const existingRequest = await db.query.MentorSessionsTable.findFirst({
    where: and(
      eq(MentorSessionsTable.mentorId, mentor.id),
      eq(MentorSessionsTable.startupId, startupProfile.id)
    ),
    columns: { id: true, status: true },
  })

  return (
    <MentorDetailClient
      mentor={mentor}
      existingRequest={existingRequest ?? null}
    />
  )
}