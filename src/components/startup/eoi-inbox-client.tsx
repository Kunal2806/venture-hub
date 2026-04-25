"use client"

import { useState, useMemo } from "react"
import EOICard from "@/components/startup/eoi-card"

// ─── Types ────────────────────────────────────────────────────────────────────

type EOIStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN"
type DealStage = "EOI_SENT" | "EOI_ACCEPTED" | "IN_DISCUSSION" | "DUE_DILIGENCE" | "TERM_SHEET" | "CLOSED" | "DROPPED"

type EOIRow = {
  id: string
  investorName: string | null
  firmName: string | null
  designation: string | null
  investorType: string | null
  message: string | null
  proposedAmount: string | null
  status: EOIStatus
  dealStage: DealStage | null
  sentAt: Date | string
}

type Props = {
  companyName: string
  eois: EOIRow[]
}

type SortKey = "newest" | "oldest" | "name"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; dot: string; bg: string; border: string; text: string }> = {
  PENDING:  { label: "Pending",  dot: "#d97706", bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
  ACCEPTED: { label: "Accepted", dot: "#059669", bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
  REJECTED: { label: "Declined", dot: "#dc2626", bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
}

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, dot: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", text: "#374151" }
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EOIInboxClient({ companyName, eois }: Props) {
  const [query, setQuery]               = useState("")
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set())
  const [activeTypes, setActiveTypes]   = useState<Set<string>>(new Set())
  const [sortKey, setSortKey]           = useState<SortKey>("newest")

  // Derived investor types present in data
  const allTypes = useMemo(
    () => Array.from(new Set(eois.map((e) => e.investorType).filter(Boolean) as string[])).sort(),
    [eois]
  )

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {}
    eois.forEach((e) => { map[e.status] = (map[e.status] ?? 0) + 1 })
    return map
  }, [eois])

  const filtered = useMemo(() => {
    let list = [...eois]

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (e) =>
          (e.investorName ?? "").toLowerCase().includes(q) ||
          (e.firmName ?? "").toLowerCase().includes(q) ||
          (e.designation ?? "").toLowerCase().includes(q) ||
          (e.message ?? "").toLowerCase().includes(q)
      )
    }

    if (activeStatuses.size > 0) {
      list = list.filter((e) => activeStatuses.has(e.status))
    }

    if (activeTypes.size > 0) {
      list = list.filter((e) => e.investorType && activeTypes.has(e.investorType))
    }

    list.sort((a, b) => {
      const tA = new Date(a.sentAt).getTime()
      const tB = new Date(b.sentAt).getTime()
      if (sortKey === "newest") return tB - tA
      if (sortKey === "oldest") return tA - tB
      if (sortKey === "name")
        return (a.investorName ?? "").localeCompare(b.investorName ?? "")
      return 0
    })

    return list
  }, [eois, query, activeStatuses, activeTypes, sortKey])

  const hasFilters = query.trim() !== "" || activeStatuses.size > 0 || activeTypes.size > 0

  function toggleStatus(s: string) {
    setActiveStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(s)) { next.delete(s) } else { next.add(s) }
      return next
    })
  }

  function toggleType(t: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) { next.delete(t) } else { next.add(t) }
      return next
    })
  }

  function clearAll() {
    setQuery("")
    setActiveStatuses(new Set())
    setActiveTypes(new Set())
    setSortKey("newest")
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--cream)" }}>
      <style>{`
        .eoi-filter-chip { transition: all 0.15s ease; cursor: pointer; user-select: none; }
        .eoi-filter-chip:hover { border-color: rgba(26,54,43,0.5) !important; }
        .eoi-sort-btn { transition: all 0.15s ease; cursor: pointer; }
        .eoi-sort-btn:hover { color: var(--forest) !important; }
        .eoi-search:focus { outline: none; border-color: var(--forest) !important; }
        .eoi-clear:hover { text-decoration: underline; }
      `}</style>

      {/* ── Static page header ─────────────────────────────────────── */}
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
          Startup Dashboard
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
              Investor Interest
            </h1>
            <p style={{ marginTop: "8px", fontSize: "14px", color: "rgba(26,54,43,0.55)" }}>
              Investors who have expressed interest in {companyName}
            </p>
          </div>

          {/* Summary stat chips */}
          {eois.length > 0 && (
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {(["PENDING", "ACCEPTED", "REJECTED"] as const)
                .filter((s) => (statusCounts[s] ?? 0) > 0)
                .map((s) => {
                  const m = statusMeta(s)
                  return (
                    <div key={s} style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "22px", fontWeight: 600, color: "var(--forest)", lineHeight: 1 }}>
                        {statusCounts[s]}
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
                        {m.label}
                      </p>
                    </div>
                  )
                })}
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "22px", fontWeight: 600, color: "var(--forest)", lineHeight: 1 }}>
                  {eois.length}
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
                  Total
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STICKY FILTER BAR ──────────────────────────────────────── */}
      {eois.length > 0 && (
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
          {/* Row 1: search + sort */}
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
                className="eoi-search"
                type="text"
                placeholder="Search investors…"
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
                    padding: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            <div style={{ flex: 1 }} />

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
                  { key: "newest", label: "Newest" },
                  { key: "oldest", label: "Oldest" },
                  { key: "name",   label: "Name" },
                ] as { key: SortKey; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  className="eoi-sort-btn"
                  onClick={() => setSortKey(key)}
                  style={{
                    fontSize: "12px",
                    padding: "5px 10px",
                    border: "none",
                    backgroundColor: sortKey === key ? "var(--forest)" : "transparent",
                    color: sortKey === key ? "#fff" : "rgba(26,54,43,0.5)",
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
                className="eoi-clear"
                onClick={clearAll}
                style={{
                  fontSize: "12px",
                  color: "rgba(26,54,43,0.45)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  whiteSpace: "nowrap",
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Row 2: Status + Type chips */}
          <div
            style={{
              padding: "8px 48px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {/* Status label */}
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
              Status
            </span>

            {(["PENDING", "ACCEPTED", "REJECTED"] as const)
              .filter((s) => (statusCounts[s] ?? 0) > 0)
              .map((s) => {
                const active = activeStatuses.has(s)
                const m = statusMeta(s)
                return (
                  <button
                    key={s}
                    className="eoi-filter-chip"
                    onClick={() => toggleStatus(s)}
                    style={{
                      fontSize: "11px",
                      padding: "4px 10px",
                      border: `1px solid ${active ? m.dot : "rgba(26,54,43,0.18)"}`,
                      backgroundColor: active ? m.bg : "transparent",
                      color: active ? m.text : "rgba(26,54,43,0.6)",
                      cursor: "pointer",
                      fontWeight: active ? 600 : 400,
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: active ? m.dot : "rgba(26,54,43,0.25)",
                        flexShrink: 0,
                      }}
                    />
                    {m.label}
                    <span style={{ fontSize: "10px", opacity: 0.65, fontVariantNumeric: "tabular-nums" }}>
                      {statusCounts[s]}
                    </span>
                  </button>
                )
              })}

            {/* Divider — only if we also have types */}
            {allTypes.length > 0 && (
              <>
                <div
                  style={{
                    width: "1px",
                    height: "18px",
                    backgroundColor: "rgba(26,54,43,0.12)",
                    margin: "0 6px",
                    flexShrink: 0,
                  }}
                />
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
                  Type
                </span>
                {allTypes.map((t) => {
                  const active = activeTypes.has(t)
                  return (
                    <button
                      key={t}
                      className="eoi-filter-chip"
                      onClick={() => toggleType(t)}
                      style={{
                        fontSize: "11px",
                        padding: "4px 10px",
                        border: `1px solid ${active ? "var(--forest)" : "rgba(26,54,43,0.18)"}`,
                        backgroundColor: active ? "var(--forest)" : "transparent",
                        color: active ? "#fff" : "rgba(26,54,43,0.6)",
                        cursor: "pointer",
                        fontWeight: active ? 600 : 400,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t}
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Results summary ─────────────────────────────────────────── */}
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
            of {eois.length} investors
            {query && (
              <>
                {" "}
                matching <em style={{ fontStyle: "italic" }}>&ldquo;{query}&rdquo;</em>
              </>
            )}
          </p>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "768px", margin: "0 auto", padding: "28px 48px 80px" }}>
        {/* Empty state — no EOIs at all */}
        {eois.length === 0 && (
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
              ♡
            </div>
            <h2
              className="font-serif"
              style={{ fontSize: "22px", color: "var(--forest)", marginBottom: "8px" }}
            >
              No interest yet
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(26,54,43,0.45)", maxWidth: "280px" }}>
              When investors express interest in your startup, they&apos;ll appear here. Make sure
              your profile is complete and approved.
            </p>
          </div>
        )}

        {/* Empty state — filters returned nothing */}
        {eois.length > 0 && filtered.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 24px",
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
              No matches
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(26,54,43,0.45)", marginBottom: "20px" }}>
              Try adjusting your search or filters.
            </p>
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
          </div>
        )}

        {/* EOI list */}
        {filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((eoi) => (
              <EOICard
                key={eoi.id}
                eoiId={eoi.id}
                investorName={eoi.investorName}
                firmName={eoi.firmName}
                designation={eoi.designation}
                investorType={eoi.investorType}
                message={eoi.message}
                proposedAmount={eoi.proposedAmount}
                status={eoi.status}
                dealStage={eoi.dealStage ?? "EOI_SENT"}
                sentAt={eoi.sentAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}