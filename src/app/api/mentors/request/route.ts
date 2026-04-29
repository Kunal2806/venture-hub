import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { MentorSessionsTable, StartupProfilesTable, MentorProfilesTable } from "@/db/schema"
import { auth } from "@/auth"
import { z } from "zod"
import { db } from "@/db"

const RequestBodySchema = z.object({
  mentorId: z.string().uuid(),
  message: z.string().min(10, "Message too short").max(500, "Message too long"),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id // now narrowed to string


    const body = await req.json()
    const parsed = RequestBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { mentorId, message } = parsed.data

    // Verify mentor exists and is APPROVED
    const mentor = await db.query.MentorProfilesTable.findFirst({
      where: and(
        eq(MentorProfilesTable.id, mentorId),
        eq(MentorProfilesTable.approvalStatus, "APPROVED")
      ),
      columns: { id: true },
    })

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 })
    }

    // Get startup profile for logged-in user
    const startupProfile = await db.query.StartupProfilesTable.findFirst({
      where: eq(StartupProfilesTable.userId, userId),
      columns: { id: true },
    })

    if (!startupProfile) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 })
    }

    // Guard: prevent duplicate requests
    const existing = await db.query.MentorSessionsTable.findFirst({
      where: and(
        eq(MentorSessionsTable.mentorId, mentorId),
        eq(MentorSessionsTable.startupId, startupProfile.id)
      ),
      columns: { id: true, status: true },
    })

    if (existing) {
      return NextResponse.json(
        { error: "A request already exists for this mentor" },
        { status: 409 }
      )
    }

    // Insert the request
    const [newSession] = await db
      .insert(MentorSessionsTable)
      .values({
        mentorId,
        startupId: startupProfile.id,
        status: "REQUESTED",
        format: "VIDEO_CALL",
        agendaNote: message,
        amountUsd: "0",
        durationMinutes: 60,
      })
      .returning({ id: MentorSessionsTable.id, status: MentorSessionsTable.status })

    return NextResponse.json({ success: true, session: newSession }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/mentors/request]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}