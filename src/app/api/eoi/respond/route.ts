// app/api/eoi/respond/route.ts
import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/db"
import { EOITable, ConversationsTable } from "@/db/schema"

type RespondBody = {
  eoiId: string
  action: "ACCEPT" | "REJECT"
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "STARTUP") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      )
    }

    const body: RespondBody = await req.json()
    const { eoiId, action } = body

    if (!eoiId || !["ACCEPT", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      )
    }

    const userId: string = session.user.id

    const startup = await db.query.StartupProfilesTable.findFirst({
      where: (table, { eq }) => eq(table.userId, userId),
    })

    if (!startup) {
      return NextResponse.json(
        { success: false, message: "Startup profile not found" },
        { status: 404 }
      )
    }

    // ── Fetch EOI WITH investor relation so we can get investor.userId ──
    const eoi = await db.query.EOITable.findFirst({
      where: (table, { eq }) => eq(table.id, eoiId),
      with: {
        investor: true, // gives us eoi.investor.userId
      },
    })

    if (!eoi) {
      return NextResponse.json(
        { success: false, message: "EOI not found" },
        { status: 404 }
      )
    }

    if (eoi.startupId !== startup.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      )
    }

    if (eoi.status !== "PENDING") {
      return NextResponse.json(
        { success: false, message: "EOI has already been responded to" },
        { status: 409 }
      )
    }

    if (action === "ACCEPT") {
      await db
        .update(EOITable)
        .set({
          status: "ACCEPTED",
          dealStage: "EOI_ACCEPTED",
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(EOITable.id, eoiId))

      // ── Create conversation if one doesn't exist yet ──────────────
      const existing = await db.query.ConversationsTable.findFirst({
        where: (table, { eq }) => eq(table.eoiId, eoiId),
      })

      if (!existing) {
        await db.insert(ConversationsTable).values({
          eoiId:          eoi.id,
          investorUserId: eoi.investor.userId, // ✅ user ID via relation
          startupUserId:  userId,              // ✅ session user ID
          isActive:       true,
          lastMessageAt:  new Date(),
        })
      }
    } else {
      await db
        .update(EOITable)
        .set({
          status: "REJECTED",
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(EOITable.id, eoiId))
    }

    revalidatePath("/dashboard/startup/eois")

    return NextResponse.json(
      {
        success: true,
        message: action === "ACCEPT" ? "Investor accepted" : "EOI rejected",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[POST /api/eoi/respond]", error)
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}