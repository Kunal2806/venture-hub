// app/dashboard/investor/discover/page.tsx
// NOTE: The sticky FilterBar is a Client Component; the page itself stays a Server Component.

import { redirect } from "next/navigation"
import { db } from "@/db"
import { EOITable, InvestorProfilesTable, StartupProfilesTable } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import Link from "next/link"
import { auth } from "@/auth"
import EOIButton from "@/components/eoi-button"
import DiscoverClient from "@/components/investor/discover-client"

type FounderEntry = {
  name: string
  role: string
  bio?: string
  linkedinUrl?: string
  avatarUrl?: string
  isLeadFounder: boolean
}

export default async function DiscoverPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/sign-in")
  if (session.user.role !== "INVESTOR") redirect("/dashboard")

  const userId = session.user.id
  if (!userId) redirect("/auth/sign-in")

  const startups = await db.query.StartupProfilesTable.findMany({
    where: eq(StartupProfilesTable.approvalStatus, "APPROVED"),
    orderBy: desc(StartupProfilesTable.profileScore),
  })

  const investorProfile = await db.query.InvestorProfilesTable.findFirst({
    where: eq(InvestorProfilesTable.userId, userId),
    columns: { id: true },
  })

  const sentStartupIds = new Set<string>()
  if (investorProfile) {
    const sentEOIs = await db.query.EOITable.findMany({
      where: eq(EOITable.investorId, investorProfile.id),
      columns: { startupId: true },
    })
    sentEOIs.forEach((e) => sentStartupIds.add(e.startupId))
  }

  // Pass serialisable data down to the client component
  return (
    <DiscoverClient
      startups={startups.map((s) => ({
        ...s,
        // drizzle numeric columns come as strings; keep them as-is
        profileScore: s.profileScore ?? 0,
      }))}
      sentStartupIds={Array.from(sentStartupIds)}
    />
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// components/discover-client.tsx  (paste into its own file)
// ─────────────────────────────────────────────────────────────────────────────
//
// "use client"
//
// import { useState, useMemo } from "react"
// import Link from "next/link"
// import EOIButton from "@/components/eoi-button"
//
// … (full implementation below)