import { redirect } from "next/navigation"
import { db } from "@/db"
import { StartupProfilesTable } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import Link from "next/link"
import { auth } from "@/auth"

// ─── Types ───────────────────────────────────────────────────────────
type FounderEntry = {
  name: string
  role: string
  bio?: string
  linkedinUrl?: string
  avatarUrl?: string
  isLeadFounder: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────
function stageLabel(stage: string) {
  const map: Record<string, string> = {
    IDEA: "Idea",
    PRE_SEED: "Pre-Seed",
    SEED: "Seed",
    SERIES_A: "Series A",
    SERIES_B: "Series B",
    SERIES_C: "Series C",
    GROWTH: "Growth",
  }
  return map[stage] ?? stage
}

function formatAmount(val: string | null | undefined) {
  if (!val) return null
  const n = parseFloat(val)
  if (isNaN(n)) return null
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

// Deterministic colour per sector (no randomness on server render)
const SECTOR_COLORS: Record<string, string> = {
  Fintech: "#1A362B",
  Healthtech: "#2D5A4A",
  Edtech: "#4A5D4E",
  Agritech: "#3D5C3A",
  Cleantech: "#2E4D3A",
  SaaS: "#1E3D30",
  Ecommerce: "#3A4E40",
  Logistics: "#2A4838",
  "Deep Tech": "#1C3A2C",
  Other: "#334D3F",
}

function sectorColor(sector: string) {
  return SECTOR_COLORS[sector] ?? SECTOR_COLORS["Other"]
}

// ─── Score bar component ──────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          width: "80px",
          height: "3px",
          backgroundColor: "rgba(26,54,43,0.12)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: "var(--forest)",
            borderRadius: "2px",
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "11px",
          color: "rgba(26,54,43,0.5)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {score}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────
export default async function DiscoverPage() {
  // ── Auth guard ──
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/sign-in")
  }

  if (session.user.role !== "INVESTOR") {
    redirect("/dashboard")
  }

  // ── Data fetch ──
  const startups = await db.query.StartupProfilesTable.findMany({
    where: eq(StartupProfilesTable.approvalStatus, "APPROVED"),
    orderBy: desc(StartupProfilesTable.profileScore),
  })

  // ── UI ──
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--cream)",
        color: "var(--stone)",
      }}
    >
      {/* ── Scoped styles for hover effects ── */}
      <style>{`
        .startup-card:hover {
          box-shadow: 0 4px 24px rgba(26,54,43,0.10);
          transform: translateY(-2px);
        }
        .view-btn:hover {
          background-color: rgba(26,54,43,0.06);
        }
        .express-btn:hover {
          opacity: 0.85;
        }
      `}</style>

      {/* ── Page header ── */}
      <div
        style={{
          borderBottom: "1px solid rgba(26,54,43,0.08)",
          padding: "48px 48px 36px",
          backgroundColor: "var(--cream)",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(26,54,43,0.4)",
            marginBottom: "12px",
          }}
        >
          Investor Portal
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              className="font-serif"
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 500,
                color: "var(--forest)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Discover Startups
            </h1>
            <p
              style={{
                marginTop: "8px",
                fontSize: "14px",
                color: "rgba(26,54,43,0.55)",
              }}
            >
              {startups.length} approved startup
              {startups.length !== 1 ? "s" : ""} · Sorted by profile score
            </p>
          </div>

          {/* Stat chips */}
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {(["SEED", "SERIES_A", "GROWTH"] as const).map((stage) => {
              const count = startups.filter((s) => s.stage === stage).length
              return (
                <div key={stage} style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: "22px",
                      fontWeight: 600,
                      color: "var(--forest)",
                      lineHeight: 1,
                    }}
                  >
                    {count}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "rgba(26,54,43,0.4)",
                      marginTop: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {stageLabel(stage)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ padding: "40px 48px 80px" }}>
        {startups.length === 0 ? (
          /* ── Empty state ── */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "96px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                border: "1px solid rgba(26,54,43,0.15)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
                color: "rgba(26,54,43,0.3)",
                fontSize: "24px",
              }}
            >
              ◎
            </div>
            <h2
              className="font-serif"
              style={{
                fontSize: "22px",
                color: "var(--forest)",
                marginBottom: "8px",
              }}
            >
              No startups available yet
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(26,54,43,0.45)" }}>
              Approved startups will appear here once they complete their
              profiles.
            </p>
          </div>
        ) : (
          /* ── Startup grid ── */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "24px",
            }}
          >
            {startups.map((startup, i) => {
              const leadFounder = (
                startup.founders as FounderEntry[]
              )?.find((f) => f.isLeadFounder)

              const askMin = formatAmount(startup.fundingAskMin?.toString())
              const askMax = formatAmount(startup.fundingAskMax?.toString())
              const fundingRange =
                askMin && askMax
                  ? `${askMin} – ${askMax}`
                  : askMin ?? askMax ?? null

              const accentColor = sectorColor(startup.sector)

              return (
                <article
                  key={startup.id}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid rgba(26,54,43,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                    transition: "box-shadow 0.25s ease, transform 0.25s ease",
                  }}
                  className="startup-card"
                >
                  {/* Coloured top stripe */}
                  <div
                    style={{
                      height: "3px",
                      backgroundColor: accentColor,
                      opacity: 0.7,
                    }}
                  />

                  {/* Card body */}
                  <div style={{ padding: "24px", flex: 1 }}>
                    {/* Header row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "16px",
                        gap: "12px",
                      }}
                    >
                      {/* Logo / initials */}
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          backgroundColor: accentColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        {startup.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={startup.logoUrl}
                            alt={startup.companyName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              color: "#fff",
                              fontSize: "16px",
                              fontWeight: 700,
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {startup.companyName.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Stage + verified badge */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            padding: "3px 8px",
                            backgroundColor: "rgba(26,54,43,0.06)",
                            color: "var(--forest)",
                          }}
                        >
                          {stageLabel(startup.stage)}
                        </span>
                        {startup.isVerified && (
                          <span
                            title="Verified"
                            style={{
                              fontSize: "11px",
                              color: "var(--forest)",
                            }}
                          >
                            ✦
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Company name */}
                    <h2
                      className="font-serif"
                      style={{
                        fontSize: "20px",
                        fontWeight: 500,
                        color: "var(--forest)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                        marginBottom: "6px",
                      }}
                    >
                      {startup.companyName}
                    </h2>

                    {/* Tagline */}
                    {startup.tagline && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "rgba(26,54,43,0.6)",
                          lineHeight: 1.5,
                          marginBottom: "16px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {startup.tagline}
                      </p>
                    )}

                    {/* Meta row */}
                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        marginBottom: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "rgba(26,54,43,0.45)",
                        }}
                      >
                        {startup.sector}
                      </span>
                      {startup.country && (
                        <>
                          <span
                            style={{
                              color: "rgba(26,54,43,0.2)",
                              fontSize: "12px",
                            }}
                          >
                            ·
                          </span>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "rgba(26,54,43,0.45)",
                            }}
                          >
                            {startup.city
                              ? `${startup.city}, ${startup.country}`
                              : startup.country}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Funding ask */}
                    {fundingRange && (
                      <div style={{ marginBottom: "16px" }}>
                        <p
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            color: "rgba(26,54,43,0.35)",
                            marginBottom: "3px",
                          }}
                        >
                          Raising
                        </p>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "var(--forest)",
                          }}
                        >
                          {fundingRange}
                        </p>
                      </div>
                    )}

                    {/* Lead founder */}
                    {leadFounder && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          paddingTop: "12px",
                          borderTop: "1px solid rgba(26,54,43,0.06)",
                        }}
                      >
                        <div
                          style={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(26,54,43,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "var(--forest)",
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          {leadFounder.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={leadFounder.avatarUrl}
                              alt={leadFounder.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            leadFounder.name.slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "var(--forest)",
                              lineHeight: 1.2,
                            }}
                          >
                            {leadFounder.name}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "rgba(26,54,43,0.4)",
                            }}
                          >
                            {leadFounder.role}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div
                    style={{
                      padding: "16px 24px",
                      borderTop: "1px solid rgba(26,54,43,0.07)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      backgroundColor: "rgba(249,247,242,0.5)",
                    }}
                  >
                    {/* Profile score */}
                    <ScoreBar score={startup.profileScore} />

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link
                        href={`/dashboard/investor/startups/${startup.id}`}
                        className="view-btn"
                        style={{
                          fontSize: "12px",
                          padding: "7px 14px",
                          border: "1px solid rgba(26,54,43,0.2)",
                          color: "var(--forest)",
                          textDecoration: "none",
                          fontWeight: 500,
                          transition: "all 0.2s ease",
                          display: "inline-block",
                        }}
                      >
                        View
                      </Link>

                      <button
                        className="express-btn"
                        style={{
                          fontSize: "12px",
                          padding: "7px 14px",
                          backgroundColor: "var(--forest)",
                          color: "var(--cream)",
                          border: "none",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          letterSpacing: "0.02em",
                          transition: "opacity 0.2s ease",
                        }}
                      >
                        Express Interest
                      </button>
                    </div>
                  </div>

                  {/* Index number — decorative */}
                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      fontSize: "10px",
                      color: "rgba(26,54,43,0.12)",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 700,
                      userSelect: "none",
                    }}
                  >
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}