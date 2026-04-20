// app/dashboard/startup/eois/page.tsx

import { auth } from "@/auth"
import EOICard from "@/components/startup/eoi-card"
import { db } from "@/db"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Investor Interest | VentureHub",
}

export default async function StartupEOIInboxPage() {
  // ── Auth guard ─────────────────────────────────────────────────────
  const session = await auth()

  if (!session?.user?.id) redirect("/auth/sign-in")
  if (session.user.role !== "STARTUP") redirect("/dashboard")
    
  const userId: string = session.user.id;
  // ── Startup profile ────────────────────────────────────────────────
  const startup = await db.query.StartupProfilesTable.findFirst({
    where: (table, { eq }) => eq(table.userId,userId),
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

  // ── Fetch EOIs for this startup only ──────────────────────────────
  const eois = await db.query.EOITable.findMany({
    where: (table, { eq }) => eq(table.startupId, startup.id),
    with: {
      investor: {
        with: {
          user: true,
        },
      },
    },
    orderBy: (table, { desc }) => [desc(table.sentAt)],
  })

  // ── Counts ─────────────────────────────────────────────────────────
  const pendingCount  = eois.filter((e) => e.status === "PENDING").length
  const acceptedCount = eois.filter((e) => e.status === "ACCEPTED").length

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-8">
          <p className="label-style mb-1">Startup Dashboard</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--forest)] leading-tight">
            Investor Interest
          </h1>
          <p className="mt-2 text-sm text-[var(--moss)]">
            Investors who have expressed interest in {startup.companyName}
          </p>

          {/* Summary chips */}
          {eois.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--stone)] bg-white border border-[rgba(26,54,43,0.1)] px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--forest)]" />
                {eois.length} total
              </div>
              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {pendingCount} pending
                </div>
              )}
              {acceptedCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {acceptedCount} accepted
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[rgba(26,54,43,0.1)] mb-8" />

        {/* Empty state */}
        {eois.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-[var(--beige)] flex items-center justify-center mb-5">
              <svg
                className="w-7 h-7 text-[var(--moss)]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </div>
            <h2 className="font-semibold text-[var(--stone)] text-lg mb-1">
              No interest yet
            </h2>
            <p className="text-sm text-[var(--moss)] max-w-xs">
              When investors express interest in your startup, they&apos;ll appear here. Make sure your profile is complete and approved.
            </p>
          </div>
        )}

        {/* EOI list */}
        {eois.length > 0 && (
          <div className="space-y-4">
            {eois.map((eoi) => (
              <EOICard
                key={eoi.id}
                eoiId={eoi.id}
                investorName={eoi.investor.user.name}
                firmName={eoi.investor.firmName}
                designation={eoi.investor.designation}
                investorType={eoi.investor.investorType}
                message={eoi.message}
                proposedAmount={eoi.proposedAmount}
                status={eoi.status}
                dealStage={eoi.dealStage}
                sentAt={eoi.sentAt}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}