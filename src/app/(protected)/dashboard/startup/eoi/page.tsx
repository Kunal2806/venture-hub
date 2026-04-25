// app/dashboard/startup/eois/page.tsx

import { auth } from "@/auth"
import { db } from "@/db"
import { redirect } from "next/navigation"
import EOIInboxClient from "@/components/startup/eoi-inbox-client"

export const metadata = {
  title: "Investor Interest | VentureHub",
}

export default async function StartupEOIInboxPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/sign-in")
  if (session.user.role !== "STARTUP") redirect("/dashboard")

  const userId: string = session.user.id

  const startup = await db.query.StartupProfilesTable.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
  })

  if (!startup) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-[var(--beige)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[var(--moss)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="font-semibold text-[var(--stone)] mb-1">No startup profile found</h2>
          <p className="text-sm text-[var(--moss)]">
            Your startup profile hasn&apos;t been set up yet. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  const eois = await db.query.EOITable.findMany({
    where: (table, { eq }) => eq(table.startupId, startup.id),
    with: {
      investor: { with: { user: true } },
    },
    orderBy: (table, { desc }) => [desc(table.sentAt)],
  })

  return (
    <EOIInboxClient
      companyName={startup.companyName}
      eois={eois.map((e) => ({
        id: e.id,
        investorName: e.investor.user.name,
        firmName: e.investor.firmName,
        designation: e.investor.designation,
        investorType: e.investor.investorType,
        message: e.message,
        proposedAmount: e.proposedAmount,
        status: e.status,
        dealStage: e.dealStage,
        sentAt: e.sentAt,
      }))}
    />
  )
}