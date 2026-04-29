// app/dashboard/investor/startups/[id]/page.tsx

import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/db"
import {
  EOITable,
  FounderEntry,
  InvestorProfilesTable,
  StartupProfilesTable,
  ConversationsTable,
} from "@/db/schema"
import { eq, and } from "drizzle-orm"
import EOIButton from "@/components/eoi-button"

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (copied from dashboard page)
// text-[#1A362B]   → forest primary
// text-[#4A5D4E]   → muted label
// text-[#2D2D2D]   → body text
// border-[#1A362B]/8 or /10  → card border
// bg-[#F9F7F2]     → hover / beige
// bg-[#EFEBE3]     → dividers / light backgrounds
// font Gambetta serif (headings) + Satoshi sans (body)
// ─────────────────────────────────────────────────────────────────────────────

// ── Primitives ────────────────────────────────────────────────────────────────

/** Pill chip — sector / stage / location tags */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-[#1A362B]/15 text-[#4A5D4E] text-[10px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full">
      {children}
    </span>
  )
}

/**
 * Section headings — h2
 * Mirrors the "Deal Pipeline" / "New Matches" headers in the dashboard:
 * small, uppercase, tracking-wider, forest color
 */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-semibold text-[#1A362B] uppercase tracking-wider"
      style={{ fontFamily: "'Satoshi', sans-serif" }}
    >
      {children}
    </h2>
  )
}

/**
 * Sub-headings — h3
 * Used for field labels inside sections (Problem, Solution, etc.)
 */
function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4A5D4E] mb-1"
      style={{ fontFamily: "'Satoshi', sans-serif" }}
    >
      {children}
    </h3>
  )
}

/**
 * Metric card — matches the stat card style from dashboard
 * Large bold number (font-bold text-[#1A362B]), small label above
 */
function MetricCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#1A362B]/8 p-4 hover:shadow-sm transition-shadow">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4A5D4E] mb-1">
        {label}
      </p>
      <p
        className="text-2xl font-bold text-[#1A362B] leading-none"
        style={{ fontFamily: "'Gambetta', serif" }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-[#4A5D4E] mt-1">{sub}</p>}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StartupDetailPage({ params }: PageProps) {
  const { id } = await params

  // 1. Auth
  const session = await auth()
  if (!session?.user) redirect("/auth/sign-in")
  if (session.user.role !== "INVESTOR") redirect("/dashboard")
  const userId = session.user.id
  if (!userId) redirect("/auth/sign-in")

  // 2. Startup
  const startup = await db.query.StartupProfilesTable.findFirst({
    where: eq(StartupProfilesTable.id, id),
  })

  if (!startup || startup.approvalStatus !== "APPROVED") {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center"
        style={{ fontFamily: "'Satoshi', sans-serif" }}
      >
        <div className="text-center space-y-3">
          <p
            className="text-5xl font-bold text-[#1A362B]/20"
            style={{ fontFamily: "'Gambetta', serif" }}
          >
            404
          </p>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4A5D4E]">
            Startup not found
          </p>
          <Link
            href="/dashboard/investor/startups"
            className="inline-block mt-3 text-xs font-semibold uppercase tracking-wider bg-[#1A362B] text-white px-5 py-2.5 rounded-xl hover:bg-[#1A362B]/90 transition-colors"
          >
            ← Back to Startups
          </Link>
        </div>
      </div>
    )
  }

  // 3. View count (fire-and-forget)
  db.update(StartupProfilesTable)
    .set({ profileViewCount: startup.profileViewCount + 1 })
    .where(eq(StartupProfilesTable.id, startup.id))
    .catch(() => {})

  // 4. Investor profile + EOI state
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
        columns: { id: true, status: true },
      })
    : null

  const conversation =
    existingEOI?.status === "ACCEPTED"
      ? await db.query.ConversationsTable.findFirst({
          where: eq(ConversationsTable.eoiId, existingEOI.id),
          columns: { id: true },
        })
      : null

  // 5. Derived helpers
  const founders  = (startup.founders as FounderEntry[]) ?? []
  const sdgGoals  = (startup.sdgGoals as number[])       ?? []
  const eoiStatus = existingEOI?.status ?? null

  const stageLabel: Record<string, string> = {
    IDEA: "Idea", PRE_SEED: "Pre-Seed", SEED: "Seed",
    SERIES_A: "Series A", SERIES_B: "Series B",
    SERIES_C: "Series C", GROWTH: "Growth",
  }

  const fmtUsd = (v: string | null | undefined) =>
    v ? `$${Number(v).toLocaleString()}` : null

  const fmtDate = (d: Date | null | undefined) =>
    d
      ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : null

  // Section visibility guards
  const hasPitch    = startup.description || startup.problemStatement || startup.solutionDescription
  const hasBusiness = startup.businessModel || startup.targetMarket || startup.uniqueValueProposition || startup.competitiveLandscape
  const hasTraction = startup.revenueMonthly || startup.revenueAnnual || startup.userCount !== null || startup.growthRate !== null
  const hasFunding  = startup.equityOffered || startup.previousFundingTotal || startup.useOfFunds || startup.fundingDeadline
  const hasImpact   = startup.impactDescription || sdgGoals.length > 0

  return (
    <div className="space-y-6" style={{ fontFamily: "'Satoshi', sans-serif" }}>

      {/* ── Page header — mirrors dashboard "Investor Dashboard" header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/dashboard/investor/startups"
            className="text-xs font-semibold uppercase tracking-widest text-[#4A5D4E] hover:text-[#1A362B] transition-colors"
          >
            ← Startups
          </Link>
          <span className="text-[#4A5D4E]/40 text-xs">/</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#4A5D4E] truncate max-w-[180px]">
            {startup.companyName}
          </span>
        </div>

        {/* h1 — only one; mirrors "Good morning, Ramesh" style */}
        <h1
          className="text-2xl font-bold text-[#1A362B]"
          style={{ fontFamily: "'Gambetta', serif" }}
        >
          {startup.companyName}
        </h1>

        {startup.tagline && (
          <p className="text-sm text-[#4A5D4E] mt-1 max-w-2xl">{startup.tagline}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Chip>{stageLabel[startup.stage] ?? startup.stage}</Chip>
          <Chip>{startup.sector}</Chip>
          {startup.industry && <Chip>{startup.industry}</Chip>}
          {startup.foundedYear && <Chip>Est. {startup.foundedYear}</Chip>}
          {(startup.city || startup.country) && (
            <Chip>📍 {[startup.city, startup.country].filter(Boolean).join(", ")}</Chip>
          )}
          {startup.isVerified && (
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-emerald-700 border border-emerald-200 bg-emerald-50 px-2.5 py-1 rounded-full">
              ✓ Verified
            </span>
          )}
          {startup.isFeatured && (
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-amber-700 border border-amber-200 bg-amber-50 px-2.5 py-1 rounded-full">
              ★ Featured
            </span>
          )}
          {startup.websiteUrl && (
            <a
              href={startup.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold uppercase tracking-wider text-[#4A5D4E] hover:text-[#1A362B] underline underline-offset-2 transition-colors ml-1"
            >
              Website ↗
            </a>
          )}
        </div>
      </div>

      {/* ── Two-column body ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-6 items-start">

        {/* ══════════════════════════════════════════════════
            LEFT — content sections
        ══════════════════════════════════════════════════ */}
        <div className="space-y-5 min-w-0">

          {/* About + Pitch */}
          {hasPitch && (
            <div className="bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EFEBE3] flex items-center justify-between">
                <SectionHeading>About</SectionHeading>
              </div>
              <div className="px-6 py-5 space-y-5">
                {startup.description && (
                  <p className="text-sm text-[#2D2D2D] leading-relaxed">
                    {startup.description}
                  </p>
                )}
                {(startup.problemStatement || startup.solutionDescription) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                    {startup.problemStatement && (
                      <div>
                        <SubHeading>Problem</SubHeading>
                        <p className="text-sm text-[#4A5D4E] leading-relaxed">
                          {startup.problemStatement}
                        </p>
                      </div>
                    )}
                    {startup.solutionDescription && (
                      <div>
                        <SubHeading>Solution</SubHeading>
                        <p className="text-sm text-[#4A5D4E] leading-relaxed">
                          {startup.solutionDescription}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Business Overview */}
          {hasBusiness && (
            <div className="bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EFEBE3]">
                <SectionHeading>Business Overview</SectionHeading>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {startup.uniqueValueProposition && (
                  <div>
                    <SubHeading>Unique Value Proposition</SubHeading>
                    <p className="text-sm text-[#4A5D4E] leading-relaxed">
                      {startup.uniqueValueProposition}
                    </p>
                  </div>
                )}
                {startup.businessModel && (
                  <div>
                    <SubHeading>Business Model</SubHeading>
                    <p className="text-sm text-[#4A5D4E] leading-relaxed">
                      {startup.businessModel}
                    </p>
                  </div>
                )}
                {startup.targetMarket && (
                  <div>
                    <SubHeading>Target Market</SubHeading>
                    <p className="text-sm text-[#4A5D4E] leading-relaxed">
                      {startup.targetMarket}
                    </p>
                  </div>
                )}
                {startup.competitiveLandscape && (
                  <div>
                    <SubHeading>Competitive Landscape</SubHeading>
                    <p className="text-sm text-[#4A5D4E] leading-relaxed">
                      {startup.competitiveLandscape}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Traction — metric cards */}
          {hasTraction && (
            <div className="bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EFEBE3]">
                <SectionHeading>Traction</SectionHeading>
              </div>
              <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {startup.revenueMonthly && (
                  <MetricCard label="Monthly Rev." value={fmtUsd(startup.revenueMonthly)!} />
                )}
                {startup.revenueAnnual && (
                  <MetricCard label="Annual Rev." value={fmtUsd(startup.revenueAnnual)!} />
                )}
                {startup.userCount !== null && (
                  <MetricCard label="Users" value={startup.userCount!.toLocaleString()} />
                )}
                {startup.growthRate !== null && (
                  <MetricCard label="Growth" value={`${startup.growthRate}%`} sub="month-over-month" />
                )}
              </div>
            </div>
          )}

          {/* Funding */}
          {hasFunding && (
            <div className="bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EFEBE3]">
                <SectionHeading>Funding</SectionHeading>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {startup.equityOffered && (
                    <MetricCard label="Equity Offered" value={`${startup.equityOffered}%`} />
                  )}
                  {startup.previousFundingTotal && (
                    <MetricCard label="Previously Raised" value={fmtUsd(startup.previousFundingTotal)!} />
                  )}
                  {startup.fundingDeadline && (
                    <MetricCard label="Deadline" value={fmtDate(startup.fundingDeadline)!} />
                  )}
                </div>
                {startup.useOfFunds && (
                  <div>
                    <SubHeading>Use of Funds</SubHeading>
                    <p className="text-sm text-[#4A5D4E] leading-relaxed max-w-2xl">
                      {startup.useOfFunds}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Founders — mirrors deal pipeline row style */}
          {founders.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EFEBE3]">
                <SectionHeading>Founders</SectionHeading>
              </div>
              <div className="divide-y divide-[#EFEBE3]">
                {founders.map((founder, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-[#F9F7F2] transition-colors"
                  >
                    {/* Avatar — mirrors pipeline initials avatar */}
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-[#1A362B]/10 text-[#1A362B] flex items-center justify-center font-bold text-sm overflow-hidden">
                      {founder.avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img
                            src={founder.avatarUrl}
                            alt={founder.name}
                            className="w-full h-full object-cover"
                          />
                        : founder.name[0]
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#2D2D2D]">
                          {founder.name}
                        </p>
                        {founder.isLeadFounder && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-[#1A362B]/8 text-[#1A362B] px-2 py-0.5 rounded-full">
                            Lead
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#4A5D4E] mt-0.5">{founder.role}</p>
                      {founder.bio && (
                        <p className="text-xs text-[#4A5D4E] mt-1.5 leading-relaxed line-clamp-2">
                          {founder.bio}
                        </p>
                      )}
                    </div>

                    {founder.linkedinUrl && (
                      <a
                        href={founder.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold uppercase tracking-wider text-[#4A5D4E] hover:text-[#1A362B] underline underline-offset-2 transition-colors shrink-0 self-center"
                      >
                        LinkedIn ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact */}
          {hasImpact && (
            <div className="bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EFEBE3]">
                <SectionHeading>Impact</SectionHeading>
              </div>
              <div className="px-6 py-5 space-y-4">
                {startup.impactDescription && (
                  <p className="text-sm text-[#4A5D4E] leading-relaxed max-w-2xl">
                    {startup.impactDescription}
                  </p>
                )}
                {sdgGoals.length > 0 && (
                  <div>
                    <SubHeading>SDG Goals</SubHeading>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {sdgGoals.map((g) => (
                        <Chip key={g}>SDG {g}</Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT — sticky decision panel
        ══════════════════════════════════════════════════ */}
        <aside className="lg:sticky lg:top-6 space-y-4">

          {/* EOI action card */}
          <div className="bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EFEBE3]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1A362B]"
                style={{ fontFamily: "'Satoshi', sans-serif" }}>
                {eoiStatus === "ACCEPTED"   ? "Status — Connected"
                : eoiStatus === "PENDING"   ? "Status — Pending"
                : eoiStatus === "REJECTED"
                || eoiStatus === "WITHDRAWN" ? "Status — Closed"
                :                             "Express Interest"}
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* h2-level inside panel */}
              <p
                className="text-lg font-bold text-[#1A362B] leading-snug"
                style={{ fontFamily: "'Gambetta', serif" }}
              >
                {eoiStatus === "ACCEPTED"
                  ? "You're in conversation"
                  : eoiStatus === "PENDING"
                  ? "Awaiting response"
                  : eoiStatus === "REJECTED" || eoiStatus === "WITHDRAWN"
                  ? "EOI was declined"
                  : `Invest in ${startup.companyName}`}
              </p>
              <p className="text-xs text-[#4A5D4E] leading-relaxed">
                {eoiStatus === "ACCEPTED"
                  ? "Open the chat to continue the discussion."
                  : eoiStatus === "PENDING"
                  ? "The startup will respond to your EOI shortly."
                  : eoiStatus === "REJECTED" || eoiStatus === "WITHDRAWN"
                  ? "Another EOI cannot be sent at this time."
                  : "Send an EOI to begin the investment conversation."}
              </p>
              <EOIActionArea
                eoiStatus={eoiStatus}
                startupId={startup.id}
                conversationId={conversation?.id ?? null}
              />
            </div>
          </div>

          {/* Quick snapshot */}
          <div className="bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EFEBE3]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1A362B]"
                style={{ fontFamily: "'Satoshi', sans-serif" }}>
                Quick Snapshot
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <PanelRow label="Stage"   value={stageLabel[startup.stage] ?? startup.stage} />
              <PanelRow label="Sector"  value={startup.sector} />
              {startup.industry && (
                <PanelRow label="Industry" value={startup.industry} />
              )}
              {(startup.city || startup.country) && (
                <PanelRow
                  label="Location"
                  value={[startup.city, startup.country].filter(Boolean).join(", ")}
                />
              )}
              {startup.foundedYear && (
                <PanelRow label="Founded" value={String(startup.foundedYear)} />
              )}

              {hasTraction && (
                <>
                  <div className="border-t border-[#EFEBE3] pt-3 space-y-3">
                    {startup.revenueMonthly && (
                      <PanelRow label="MRR" value={fmtUsd(startup.revenueMonthly)!} highlight />
                    )}
                    {startup.revenueAnnual && (
                      <PanelRow label="ARR" value={fmtUsd(startup.revenueAnnual)!} highlight />
                    )}
                    {startup.userCount !== null && (
                      <PanelRow label="Users" value={startup.userCount!.toLocaleString()} />
                    )}
                    {startup.growthRate !== null && (
                      <PanelRow label="Growth" value={`${startup.growthRate}% MoM`} highlight />
                    )}
                  </div>
                </>
              )}

              {hasFunding && (
                <>
                  <div className="border-t border-[#EFEBE3] pt-3 space-y-3">
                    {startup.equityOffered && (
                      <PanelRow label="Equity" value={`${startup.equityOffered}%`} />
                    )}
                    {startup.previousFundingTotal && (
                      <PanelRow label="Prev. Raised" value={fmtUsd(startup.previousFundingTotal)!} />
                    )}
                    {startup.fundingDeadline && (
                      <PanelRow label="Deadline" value={fmtDate(startup.fundingDeadline)!} />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Profile signals */}
          <div className="bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EFEBE3]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1A362B]"
                style={{ fontFamily: "'Satoshi', sans-serif" }}>
                Profile Signals
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Score bar — mirrors match bar from dashboard */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#4A5D4E]">Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-[#EFEBE3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#1A362B] to-emerald-500 rounded-full"
                      style={{ width: `${Math.min(startup.profileScore, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#1A362B]">
                    {startup.profileScore}
                  </span>
                </div>
              </div>
              <PanelRow label="Views"      value={(startup.profileViewCount + 1).toLocaleString()} />
              <PanelRow label="EOIs"        value={startup.eoiReceivedCount.toLocaleString()} />
              <PanelRow label="Watchlisted" value={startup.watchlistCount.toLocaleString()} />
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}

// ── Panel row ─────────────────────────────────────────────────────────────────

function PanelRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-[#4A5D4E] shrink-0">{label}</span>
      <span
        className={`text-xs text-right leading-snug ${
          highlight
            ? "font-bold text-[#1A362B]"
            : "font-medium text-[#2D2D2D]"
        }`}
      >
        {value}
      </span>
    </div>
  )
}

// ── EOI Action Area ───────────────────────────────────────────────────────────

function EOIActionArea({
  eoiStatus,
  startupId,
  conversationId,
}: {
  eoiStatus: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | null
  startupId: string
  conversationId: string | null
}) {
  if (eoiStatus === "ACCEPTED") {
    return (
      <Link
        href={
          conversationId
            ? `/dashboard/investor/conversations/${conversationId}`
            : `/dashboard/investor/conversations`
        }
        className="flex items-center justify-center gap-2 w-full bg-[#1A362B] text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-xl hover:bg-[#1A362B]/90 transition-colors"
      >
        Open Chat ↗
      </Link>
    )
  }

  if (eoiStatus === "PENDING") {
    return (
      <button
        disabled
        className="w-full border border-[#1A362B]/20 text-[#1A362B]/40 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-xl cursor-not-allowed"
      >
        EOI Sent — Pending
      </button>
    )
  }

  if (eoiStatus === "REJECTED" || eoiStatus === "WITHDRAWN") {
    return (
      <button
        disabled
        className="w-full border border-[#1A362B]/10 text-[#1A362B]/25 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-xl cursor-not-allowed"
      >
        Not Accepted
      </button>
    )
  }

  // null — no EOI yet
  return (
    <div className="w-full">
      <EOIButton startupId={startupId} alreadySent={false} />
    </div>
  )
}