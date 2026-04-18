// app/dashboard/investor/startups/[id]/page.tsx

import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/db"
import { EOITable, FounderEntry, InvestorProfilesTable, StartupProfilesTable } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import EOIButton from "@/components/eoi-button"

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block border border-forest/20 text-forest/70 text-xs font-medium uppercase tracking-widest px-3 py-1">
      {children}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="label-style mb-3">{children}</p>
}

function StatBlock({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="label-style">{label}</p>
      <p className="text-2xl font-serif text-forest">
        {value ?? <span className="text-forest/30 text-base font-sans">—</span>}
      </p>
    </div>
  )
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StartupDetailPage({ params }: PageProps) {
  const { id } = await params

  // ── 1. Auth guard ──────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user) redirect("/auth/sign-in")
  if (session.user.role !== "INVESTOR") redirect("/dashboard")

  const userId = session.user.id
  if (!userId) redirect("/auth/sign-in")

  // ── 2. Fetch startup ───────────────────────────────────────────────
  const startup = await db.query.StartupProfilesTable.findFirst({
    where: eq(StartupProfilesTable.id, id),
  })

  if (!startup || startup.approvalStatus !== "APPROVED") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-serif text-4xl text-forest/30">404</p>
          <p className="label-style">Startup not found</p>
          <Link
            href="/dashboard/investor/discover"
            className="inline-block border border-forest text-forest px-6 py-2 text-sm uppercase tracking-widest hover:bg-forest hover:text-cream transition-colors"
          >
            Back to Discover
          </Link>
        </div>
      </div>
    )
  }

  // ── 3. Check existing EOI ──────────────────────────────────────────
  const investorProfile = await db.query.InvestorProfilesTable.findFirst({
    where: eq(InvestorProfilesTable.userId, userId),
    columns: { id: true },
  })

  const existingEOI = investorProfile
    ? await db.query.EOITable.findFirst({
        where: and(
          eq(EOITable.investorId, investorProfile.id),
          eq(EOITable.startupId, startup.id)
        ),
        columns: { id: true },
      })
    : null

  const alreadySent = !!existingEOI

  // ── 4. Derived helpers ─────────────────────────────────────────────
  const founders = (startup.founders as FounderEntry[]) ?? []
  const sdgGoals = (startup.sdgGoals as number[]) ?? []
  const hasRevenue = startup.revenueMonthly !== null || startup.revenueAnnual !== null
  const hasFunding = startup.fundingAskMin !== null || startup.fundingAskMax !== null

  const fmtUsd = (v: string | null | undefined) =>
    v ? `$${Number(v).toLocaleString()}` : null

  const stageLabel: Record<string, string> = {
    IDEA: "Idea", PRE_SEED: "Pre-Seed", SEED: "Seed",
    SERIES_A: "Series A", SERIES_B: "Series B", SERIES_C: "Series C", GROWTH: "Growth",
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Top nav */}
      <div className="border-b border-forest/10 px-6 py-4 flex items-center gap-4 bg-cream">
        <Link href="/dashboard/investor/discover" className="label-style hover:text-forest transition-colors flex items-center gap-2">
          ← Discover
        </Link>
        <span className="text-forest/20">/</span>
        <span className="label-style text-forest/40">{startup.companyName}</span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-20">

        {/* HERO */}
        <section className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Tag>{stageLabel[startup.stage] ?? startup.stage}</Tag>
              <Tag>{startup.sector}</Tag>
              {startup.isVerified && <Tag>✓ Verified</Tag>}
              {startup.isFeatured && <Tag>★ Featured</Tag>}
            </div>
            <h1 className="font-serif text-5xl md:text-6xl text-forest leading-tight">{startup.companyName}</h1>
            {startup.tagline && <p className="text-xl text-forest/60 max-w-xl leading-relaxed">{startup.tagline}</p>}
            {(startup.city || startup.country) && (
              <p className="label-style">{[startup.city, startup.country].filter(Boolean).join(", ")}</p>
            )}
            {startup.websiteUrl && (
              <a href={startup.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="label-style hover:text-forest transition-colors underline underline-offset-2">
                Website ↗
              </a>
            )}
          </div>
          {startup.logoUrl ? (
            <div className="w-24 h-24 border border-forest/10 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={startup.logoUrl} alt={`${startup.companyName} logo`} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-24 h-24 border border-forest/10 bg-beige flex items-center justify-center">
              <span className="font-serif text-3xl text-forest/30">{startup.companyName[0]}</span>
            </div>
          )}
        </section>

        <div className="border-t border-forest/10" />

        {/* PITCH */}
        <section className="space-y-12">
          {startup.description && (
            <div>
              <SectionLabel>About</SectionLabel>
              <p className="text-forest/80 leading-relaxed max-w-3xl text-lg">{startup.description}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {startup.problemStatement && (
              <div className="space-y-3"><SectionLabel>Problem</SectionLabel><p className="text-forest/70 leading-relaxed">{startup.problemStatement}</p></div>
            )}
            {startup.solutionDescription && (
              <div className="space-y-3"><SectionLabel>Solution</SectionLabel><p className="text-forest/70 leading-relaxed">{startup.solutionDescription}</p></div>
            )}
            {startup.uniqueValueProposition && (
              <div className="space-y-3"><SectionLabel>Unique Value Proposition</SectionLabel><p className="text-forest/70 leading-relaxed">{startup.uniqueValueProposition}</p></div>
            )}
          </div>
          {startup.businessModel && (
            <div className="space-y-3"><SectionLabel>Business Model</SectionLabel><p className="text-forest/70 leading-relaxed max-w-2xl">{startup.businessModel}</p></div>
          )}
          {startup.targetMarket && (
            <div className="space-y-3"><SectionLabel>Target Market</SectionLabel><p className="text-forest/70 leading-relaxed max-w-2xl">{startup.targetMarket}</p></div>
          )}
          {startup.competitiveLandscape && (
            <div className="space-y-3"><SectionLabel>Competitive Landscape</SectionLabel><p className="text-forest/70 leading-relaxed max-w-2xl">{startup.competitiveLandscape}</p></div>
          )}
        </section>

        {/* TRACTION */}
        {hasRevenue && (
          <>
            <div className="border-t border-forest/10" />
            <section className="space-y-8">
              <SectionLabel>Traction</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {startup.revenueMonthly && <StatBlock label="Monthly Revenue" value={fmtUsd(startup.revenueMonthly)} />}
                {startup.revenueAnnual && <StatBlock label="Annual Revenue" value={fmtUsd(startup.revenueAnnual)} />}
                {startup.userCount !== null && <StatBlock label="Users" value={startup.userCount?.toLocaleString()} />}
                {startup.growthRate !== null && <StatBlock label="Growth Rate" value={`${startup.growthRate}%`} />}
              </div>
            </section>
          </>
        )}

        {/* FUNDING */}
        {hasFunding && (
          <>
            <div className="border-t border-forest/10" />
            <section className="space-y-8">
              <SectionLabel>Funding Ask</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {startup.fundingAskMin && startup.fundingAskMax ? (
                  <StatBlock label="Raising" value={`${fmtUsd(startup.fundingAskMin)} – ${fmtUsd(startup.fundingAskMax)}`} />
                ) : startup.fundingAskMin ? (
                  <StatBlock label="Min. Raise" value={fmtUsd(startup.fundingAskMin)} />
                ) : null}
                {startup.equityOffered && <StatBlock label="Equity Offered" value={`${startup.equityOffered}%`} />}
                {startup.previousFundingTotal && <StatBlock label="Previously Raised" value={fmtUsd(startup.previousFundingTotal)} />}
                {startup.foundedYear && <StatBlock label="Founded" value={startup.foundedYear} />}
              </div>
              {startup.useOfFunds && (
                <div className="space-y-3"><SectionLabel>Use of Funds</SectionLabel><p className="text-forest/70 leading-relaxed max-w-2xl">{startup.useOfFunds}</p></div>
              )}
            </section>
          </>
        )}

        {/* IMPACT */}
        {(startup.impactDescription || sdgGoals.length > 0) && (
          <>
            <div className="border-t border-forest/10" />
            <section className="space-y-6">
              <SectionLabel>Impact</SectionLabel>
              {startup.impactDescription && <p className="text-forest/70 leading-relaxed max-w-2xl">{startup.impactDescription}</p>}
              {sdgGoals.length > 0 && (
                <div className="space-y-2">
                  <SectionLabel>SDG Goals</SectionLabel>
                  <div className="flex flex-wrap gap-2">{sdgGoals.map((g) => <Tag key={g}>SDG {g}</Tag>)}</div>
                </div>
              )}
            </section>
          </>
        )}

        {/* FOUNDERS */}
        {founders.length > 0 && (
          <>
            <div className="border-t border-forest/10" />
            <section className="space-y-8">
              <SectionLabel>Founders</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {founders.map((founder, i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <div className="w-14 h-14 shrink-0 border border-forest/10 bg-beige flex items-center justify-center overflow-hidden">
                      {founder.avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={founder.avatarUrl} alt={founder.name} className="w-full h-full object-cover" />
                        : <span className="font-serif text-xl text-forest/40">{founder.name[0]}</span>
                      }
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-forest">{founder.name}</p>
                        {founder.isLeadFounder && <span className="text-xs border border-forest/20 px-2 py-0.5 label-style">Lead</span>}
                      </div>
                      <p className="label-style">{founder.role}</p>
                      {founder.bio && <p className="text-sm text-forest/60 leading-relaxed">{founder.bio}</p>}
                      {founder.linkedinUrl && (
                        <a href={founder.linkedinUrl} target="_blank" rel="noopener noreferrer"
                          className="label-style hover:text-forest transition-colors underline underline-offset-2 text-xs">
                          LinkedIn ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* STATS */}
        <div className="border-t border-forest/10" />
        <section className="grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="label-style">Profile Views</p>
            <p className="font-serif text-3xl text-forest">{startup.profileViewCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="label-style">Expressions of Interest</p>
            <p className="font-serif text-3xl text-forest">{startup.eoiReceivedCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="label-style">Profile Score</p>
            <p className="font-serif text-3xl text-forest">{startup.profileScore}</p>
          </div>
        </section>

        {/* CTA */}
        <div className="border-t border-forest/10 pt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="font-serif text-2xl text-forest">Interested in {startup.companyName}?</p>
            <p className="text-forest/50 text-sm">Send an expression of interest to start a conversation.</p>
          </div>
          <EOIButton startupId={startup.id} alreadySent={alreadySent} />
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}