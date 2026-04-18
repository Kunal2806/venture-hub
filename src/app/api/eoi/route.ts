// app/api/eoi/route.ts

import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db"
import { EOITable, InvestorProfilesTable, StartupProfilesTable } from "@/db/schema"

export async function POST(req: NextRequest) {
  // ── 1. Auth guard ────────────────────────────────────────────────────
  const session = await auth()

  if (!session?.user || session.user.role !== "INVESTOR") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  // Narrow session.user.id from string | undefined → string
  const userId = session.user.id
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  // ── 2. Parse body ────────────────────────────────────────────────────
  let startupId: string

  try {
    const body = await req.json()
    startupId = body.startupId

    if (!startupId || typeof startupId !== "string") {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 })
  }

  // ── 3. Resolve investor profile ──────────────────────────────────────
  const investor = await db.query.InvestorProfilesTable.findFirst({
    where: eq(InvestorProfilesTable.userId, userId),
    columns: { id: true },
  })

  if (!investor) {
    return NextResponse.json({ error: "NO_PROFILE" }, { status: 403 })
  }

  // ── 4. Confirm startup exists and is approved ────────────────────────
  const startup = await db.query.StartupProfilesTable.findFirst({
    where: and(
      eq(StartupProfilesTable.id, startupId),
      eq(StartupProfilesTable.approvalStatus, "APPROVED")
    ),
    columns: { id: true },
  })

  if (!startup) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  }

  // ── 5. Prevent duplicate ─────────────────────────────────────────────
  const existing = await db.query.EOITable.findFirst({
    where: and(
      eq(EOITable.investorId, investor.id),
      eq(EOITable.startupId, startupId)
    ),
    columns: { id: true },
  })

  if (existing) {
    return NextResponse.json({ error: "DUPLICATE" }, { status: 409 })
  }

  // ── 6. Insert EOI ────────────────────────────────────────────────────
  const [eoi] = await db
    .insert(EOITable)
    .values({
      investorId: investor.id,
      startupId,
      status: "PENDING",
      dealStage: "EOI_SENT",
    })
    .returning({ id: EOITable.id })

  return NextResponse.json({ success: true, eoiId: eoi.id }, { status: 201 })
}