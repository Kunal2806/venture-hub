"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import EOIButton from "@/components/eoi-button"

// ─── Types ────────────────────────────────────────────────────────────────────

type FounderEntry = {
  name: string
  role: string
  bio?: string
  linkedinUrl?: string
  avatarUrl?: string
  isLeadFounder: boolean
}

type Startup = {
  id: string
  companyName: string
  tagline?: string | null
  sector: string
  stage: string
  country?: string | null
  city?: string | null
  logoUrl?: string | null
  isVerified?: boolean | null
  profileScore: number
  founders?: unknown
}

type Props = {
  startups: Startup[]
  sentStartupIds: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  IDEA: "Idea",
  PRE_SEED: "Pre-Seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  SERIES_B: "Series B",
  SERIES_C: "Series C",
  GROWTH: "Growth",
}

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

const ALL_STAGES = ["IDEA", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH"]

type SortKey = "score" | "name" | "stage"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stageLabel(stage: string) {
  return STAGE_LABELS[stage] ?? stage
}

function sectorColor(sector: string) {
  return SECTOR_COLORS[sector] ?? SECTOR_COLORS["Other"]
}

function stageOrder(stage: string) {
  return ALL_STAGES.indexOf(stage)
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiscoverClient({ startups, sentStartupIds }: Props) {
  const sentSet = useMemo(() => new Set(sentStartupIds), [sentStartupIds])

  // ── Filter / sort state ──────────────────────────────────────────────────
  const [query, setQuery] = useState("")
  const [activeStages, setActiveStages] = useState<Set<string>>(new Set())
  const [activeSectors, setActiveSectors] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>("score")
  const [eoisOnly, setEoisOnly] = useState(false)

  // Derive available sectors from data
  const allSectors = useMemo(
    () => Array.from(new Set(startups.map((s) => s.sector))).sort(),
    [startups]
  )

  // ── Derived list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...startups]

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (s) =>
          s.companyName.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q) ||
          (s.tagline ?? "").toLowerCase().includes(q) ||
          (s.city ?? "").toLowerCase().includes(q) ||
          (s.country ?? "").toLowerCase().includes(q)
      )
    }

    if (activeStages.size > 0) {
      list = list.filter((s) => activeStages.has(s.stage))
    }

    if (activeSectors.size > 0) {
      list = list.filter((s) => activeSectors.has(s.sector))
    }

    if (eoisOnly) {
      list = list.filter((s) => sentSet.has(s.id))
    }

    list.sort((a, b) => {
      if (sortKey === "score") return b.profileScore - a.profileScore
      if (sortKey === "name") return a.companyName.localeCompare(b.companyName)
      if (sortKey === "stage") return stageOrder(a.stage) - stageOrder(b.stage)
      return 0
    })

    return list
  }, [startups, query, activeStages, activeSectors, eoisOnly, sortKey, sentSet])

  const hasFilters =
    query.trim() !== "" || activeStages.size > 0 || activeSectors.size > 0 || eoisOnly

  function toggleStage(stage: string) {
    setActiveStages((prev) => {
      const next = new Set(prev)
      next.has(stage) ? next.delete(stage) : next.add(stage)
      return next
    })
  }

  function toggleSector(sector: string) {
    setActiveSectors((prev) => {
      const next = new Set(prev)
      next.has(sector) ? next.delete(sector) : next.add(sector)
      return next
    })
  }

  function clearAll() {
    setQuery("")
    setActiveStages(new Set())
    setActiveSectors(new Set())
    setEoisOnly(false)
    setSortKey("score")
  }

  // ── Stage counts (on full list, not filtered) ────────────────────────────
  const stageCounts = useMemo(() => {
    const map: Record<string, number> = {}
    startups.forEach((s) => {
      map[s.stage] = (map[s.stage] ?? 0) + 1
    })
    return map
  }, [startups])

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--cream)",
        color: "var(--stone)",
      }}
    >
      <style>{`
        .startup-card { transition: box-shadow 0.25s ease, transform 0.25s ease; }
        .startup-card:hover { box-shadow: 0 4px 24px rgba(26,54,43,0.10); transform: translateY(-2px); }
        .view-btn:hover { background-color: rgba(26,54,43,0.06); }
        .filter-chip { transition: all 0.15s ease; cursor: pointer; user-select: none; }
        .filter-chip:hover { border-color: rgba(26,54,43,0.5) !important; }
        .sort-btn { transition: all 0.15s ease; cursor: pointer; }
        .sort-btn:hover { color: var(--forest) !important; }
        .clear-btn:hover { text-decoration: underline; }
        .search-input:focus { outline: none; border-color: var(--forest) !important; }
        .eoi-toggle:hover { border-color: rgba(26,54,43,0.5) !important; }
      `}</style>

      {/* ── Static page header ───────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: "1px solid rgba(26,54,43,0.08)",
          padding: "32px 48px 24px",
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
            <p style={{ marginTop: "8px", fontSize: "14px", color: "rgba(26,54,43,0.55)" }}>
              {startups.length} approved startup{startups.length !== 1 ? "s" : ""} · Sorted by
              profile score
            </p>
          </div>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {(["SEED", "SERIES_A", "GROWTH"] as const).map((stage) => (
              <div key={stage} style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "var(--forest)",
                    lineHeight: 1,
                  }}
                >
                  {stageCounts[stage] ?? 0}
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
            ))}
          </div>
        </div>
      </div>

      {/* ── STICKY FILTER BAR ────────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "var(--cream)",
          borderBottom: "1px solid rgba(26,54,43,0.1)",
          boxShadow: "0 2px 16px rgba(26,54,43,0.06)",
        }}
      >
        {/* Row 1: search + sort + EOI toggle */}
        <div
          style={{
            padding: "10px 48px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            borderBottom: "1px solid rgba(26,54,43,0.06)",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px", maxWidth: "360px" }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(26,54,43,0.35)",
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search startups…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                fontSize: "13px",
                border: "1px solid rgba(26,54,43,0.18)",
                backgroundColor: "#fff",
                color: "var(--forest)",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(26,54,43,0.35)",
                  fontSize: "16px",
                  lineHeight: 1,
                  padding: "0",
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* EOIs-only toggle */}
          <button
            className="eoi-toggle"
            onClick={() => setEoisOnly((v) => !v)}
            style={{
              fontSize: "12px",
              padding: "7px 14px",
              border: `1px solid ${eoisOnly ? "var(--forest)" : "rgba(26,54,43,0.18)"}`,
              backgroundColor: eoisOnly ? "var(--forest)" : "transparent",
              color: eoisOnly ? "#fff" : "rgba(26,54,43,0.6)",
              cursor: "pointer",
              fontWeight: 500,
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            ✦ EOI Sent
          </button>

          {/* Sort */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(26,54,43,0.35)",
                whiteSpace: "nowrap",
              }}
            >
              Sort
            </span>
            {(
              [
                { key: "score", label: "Score" },
                { key: "name", label: "Name" },
                { key: "stage", label: "Stage" },
              ] as { key: SortKey; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                className="sort-btn"
                onClick={() => setSortKey(key)}
                style={{
                  fontSize: "12px",
                  padding: "5px 10px",
                  border: "none",
                  backgroundColor: sortKey === key ? "var(--forest)" : "transparent",
                  color:
                    sortKey === key ? "#fff" : "rgba(26,54,43,0.5)",
                  cursor: "pointer",
                  fontWeight: sortKey === key ? 600 : 400,
                  transition: "all 0.15s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Clear all */}
          {hasFilters && (
            <button
              className="clear-btn"
              onClick={clearAll}
              style={{
                fontSize: "12px",
                color: "rgba(26,54,43,0.45)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
                whiteSpace: "nowrap",
              }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Row 2: Stage + Sector chips */}
        <div
          style={{
            padding: "8px 48px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            overflowX: "auto",
          }}
        >
          {/* Stage label */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(26,54,43,0.35)",
              marginRight: "4px",
              whiteSpace: "nowrap",
            }}
          >
            Stage
          </span>

          {ALL_STAGES.filter((s) => (stageCounts[s] ?? 0) > 0).map((stage) => {
            const active = activeStages.has(stage)
            return (
              <button
                key={stage}
                className="filter-chip"
                onClick={() => toggleStage(stage)}
                style={{
                  fontSize: "11px",
                  padding: "4px 10px",
                  border: `1px solid ${active ? "var(--forest)" : "rgba(26,54,43,0.18)"}`,
                  backgroundColor: active ? "var(--forest)" : "transparent",
                  color: active ? "#fff" : "rgba(26,54,43,0.6)",
                  cursor: "pointer",
                  fontWeight: active ? 600 : 400,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {stageLabel(stage)}
                <span
                  style={{
                    fontSize: "10px",
                    opacity: 0.65,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {stageCounts[stage]}
                </span>
              </button>
            )
          })}

          {/* Divider */}
          <div
            style={{
              width: "1px",
              height: "18px",
              backgroundColor: "rgba(26,54,43,0.12)",
              margin: "0 6px",
              flexShrink: 0,
            }}
          />

          {/* Sector label */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(26,54,43,0.35)",
              marginRight: "4px",
              whiteSpace: "nowrap",
            }}
          >
            Sector
          </span>

          {allSectors.map((sector) => {
            const active = activeSectors.has(sector)
            const color = sectorColor(sector)
            return (
              <button
                key={sector}
                className="filter-chip"
                onClick={() => toggleSector(sector)}
                style={{
                  fontSize: "11px",
                  padding: "4px 10px",
                  border: `1px solid ${active ? color : "rgba(26,54,43,0.18)"}`,
                  backgroundColor: active ? color : "transparent",
                  color: active ? "#fff" : "rgba(26,54,43,0.6)",
                  cursor: "pointer",
                  fontWeight: active ? 600 : 400,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {active && (
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#fff",
                      opacity: 0.7,
                      flexShrink: 0,
                    }}
                  />
                )}
                {sector}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Results summary bar ──────────────────────────────────────────── */}
      {hasFilters && (
        <div
          style={{
            padding: "10px 48px",
            borderBottom: "1px solid rgba(26,54,43,0.05)",
            backgroundColor: "rgba(26,54,43,0.02)",
          }}
        >
          <p style={{ fontSize: "12px", color: "rgba(26,54,43,0.45)" }}>
            Showing{" "}
            <strong style={{ color: "var(--forest)", fontWeight: 600 }}>{filtered.length}</strong>{" "}
            of {startups.length} startups
            {query && (
              <>
                {" "}
                matching{" "}
                <em style={{ fontStyle: "italic" }}>
                  &ldquo;{query}&rdquo;
                </em>
              </>
            )}
          </p>
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "28px 48px 80px" }}>
        {filtered.length === 0 ? (
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
              style={{ fontSize: "22px", color: "var(--forest)", marginBottom: "8px" }}
            >
              {hasFilters ? "No startups match your filters" : "No startups available yet"}
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(26,54,43,0.45)", marginBottom: "20px" }}>
              {hasFilters
                ? "Try adjusting your search or filters."
                : "Approved startups will appear here once they complete their profiles."}
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                style={{
                  fontSize: "13px",
                  padding: "9px 20px",
                  border: "1px solid rgba(26,54,43,0.25)",
                  background: "none",
                  color: "var(--forest)",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "24px",
            }}
          >
            {filtered.map((startup, i) => {
              const founders = startup.founders as FounderEntry[] | null | undefined
              const leadFounder = founders?.find((f) => f.isLeadFounder)
              const accentColor = sectorColor(startup.sector)
              const eoisSent = sentSet.has(startup.id)

              return (
                <article
                  key={startup.id}
                  className="startup-card"
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid rgba(26,54,43,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Colour stripe */}
                  <div style={{ height: "3px", backgroundColor: accentColor, opacity: 0.7 }} />

                  {/* Body */}
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
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                          <span title="Verified" style={{ fontSize: "11px", color: "var(--forest)" }}>
                            ✦
                          </span>
                        )}
                      </div>
                    </div>

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

                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        marginBottom: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "rgba(26,54,43,0.45)" }}>
                        {startup.sector}
                      </span>
                      {startup.country && (
                        <>
                          <span style={{ color: "rgba(26,54,43,0.2)", fontSize: "12px" }}>·</span>
                          <span style={{ fontSize: "12px", color: "rgba(26,54,43,0.45)" }}>
                            {startup.city ? `${startup.city}, ${startup.country}` : startup.country}
                          </span>
                        </>
                      )}
                    </div>

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
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                          <p style={{ fontSize: "11px", color: "rgba(26,54,43,0.4)" }}>
                            {leadFounder.role}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
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
                    <ScoreBar score={startup.profileScore} />
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
                      <EOIButton startupId={startup.id} alreadySent={eoisSent} />
                    </div>
                  </div>

                  {/* Index number */}
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