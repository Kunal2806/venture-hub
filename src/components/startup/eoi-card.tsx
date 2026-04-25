"use client"

import { useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type EOIStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN"
type DealStage =
  | "EOI_SENT"
  | "EOI_ACCEPTED"
  | "IN_DISCUSSION"
  | "DUE_DILIGENCE"
  | "TERM_SHEET"
  | "CLOSED"
  | "DROPPED"

interface EOICardProps {
  eoiId: string
  investorName: string | null
  firmName: string | null
  designation: string | null
  investorType: string | null
  message: string | null
  proposedAmount: string | null
  status: EOIStatus
  dealStage: DealStage
  sentAt: Date | string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<EOIStatus, { label: string; dot: string; bg: string; border: string; text: string }> = {
  PENDING:   { label: "Pending",   dot: "#d97706", bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
  ACCEPTED:  { label: "Accepted",  dot: "#059669", bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
  REJECTED:  { label: "Rejected",  dot: "#dc2626", bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  WITHDRAWN: { label: "Withdrawn", dot: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", text: "#374151" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: string | null): string | null {
  if (!amount) return null
  const num = parseFloat(amount)
  if (isNaN(num)) return null
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`
  return `$${num.toFixed(0)}`
}

function initials(name: string | null): string {
  if (!name) return "?"
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EOICard({
  eoiId,
  investorName,
  firmName,
  designation,
  investorType,
  message,
  proposedAmount,
  status,
  dealStage,
  sentAt,
}: EOICardProps) {
  const [currentStatus, setCurrentStatus] = useState<EOIStatus>(status)
  const [loading, setLoading] = useState<"ACCEPT" | "REJECT" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isPending = currentStatus === "PENDING"
  const formattedAmount = formatAmount(proposedAmount)
  const meta = STATUS_META[currentStatus]

  async function handleAction(action: "ACCEPT" | "REJECT") {
    if (loading || !isPending) return
    setLoading(action)
    setError(null)
    try {
      const res = await fetch("/api/eoi/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eoiId, action }),
      })
      const data: { success: boolean; message?: string } = await res.json()
      if (data.success) {
        setCurrentStatus(action === "ACCEPT" ? "ACCEPTED" : "REJECTED")
      } else {
        setError(data.message ?? "Something went wrong")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <style>{`
        .eoi-card { transition: box-shadow 0.2s ease; }
        .eoi-card:hover { box-shadow: 0 2px 16px rgba(26,54,43,0.08); }
        .eoi-accept:hover:not(:disabled) { opacity: 0.88; }
        .eoi-reject:hover:not(:disabled) { border-color: #f87171 !important; color: #b91c1c !important; background-color: #fef2f2 !important; }
        .eoi-accept:disabled, .eoi-reject:disabled { opacity: 0.5; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.7s linear infinite; }
      `}</style>

      <article
        className="eoi-card"
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(26,54,43,0.09)",
          padding: "20px 24px",
        }}
      >
        {/* ── Top row ───────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>

          {/* Avatar + info */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", minWidth: 0 }}>
            {/* Avatar */}
            <div
              style={{
                flexShrink: 0,
                width: "40px",
                height: "40px",
                backgroundColor: "var(--forest)",
                color: "var(--cream)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.02em",
                userSelect: "none",
              }}
            >
              {initials(investorName)}
            </div>

            {/* Name / firm / badges */}
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--forest)",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {investorName ?? "Unknown investor"}
              </h3>

              {(designation || firmName) && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(26,54,43,0.5)",
                    marginTop: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {[designation, firmName].filter(Boolean).join(" · ")}
                </p>
              )}

              {/* Badge row */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                {/* Status badge */}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                    padding: "3px 8px",
                    backgroundColor: meta.bg,
                    border: `1px solid ${meta.border}`,
                    color: meta.text,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      backgroundColor: meta.dot,
                      flexShrink: 0,
                    }}
                  />
                  {meta.label}
                </span>

                {/* Investor type */}
                {investorType && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "3px 8px",
                      backgroundColor: "rgba(26,54,43,0.05)",
                      border: "1px solid rgba(26,54,43,0.1)",
                      color: "rgba(26,54,43,0.55)",
                    }}
                  >
                    {investorType.replace(/_/g, " ")}
                  </span>
                )}

                {/* Proposed amount */}
                {formattedAmount && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "var(--forest)",
                    }}
                  >
                    {formattedAmount} proposed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Date */}
          <p
            style={{
              fontSize: "11px",
              color: "rgba(26,54,43,0.4)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginTop: "2px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(sentAt))}
          </p>
        </div>

        {/* ── Message ───────────────────────────────────────────────── */}
        {message && (
          <p
            style={{
              marginTop: "16px",
              fontSize: "13px",
              color: "rgba(26,54,43,0.7)",
              lineHeight: 1.65,
              backgroundColor: "rgba(26,54,43,0.025)",
              border: "1px solid rgba(26,54,43,0.07)",
              padding: "12px 14px",
              fontStyle: "italic",
            }}
          >
            &ldquo;{message}&rdquo;
          </p>
        )}

        {/* ── Error ─────────────────────────────────────────────────── */}
        {error && (
          <p
            style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "#b91c1c",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "8px 12px",
            }}
          >
            {error}
          </p>
        )}

        {/* ── Actions (PENDING only) ─────────────────────────────────── */}
        {isPending && (
          <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              className="eoi-accept"
              onClick={() => handleAction("ACCEPT")}
              disabled={loading !== null}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 18px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "var(--forest)",
                color: "var(--cream)",
                border: "none",
                cursor: "pointer",
                transition: "opacity 0.15s ease",
                letterSpacing: "0.02em",
              }}
            >
              {loading === "ACCEPT" && (
                <span
                  className="spin"
                  style={{
                    display: "inline-block",
                    width: "11px",
                    height: "11px",
                    border: "2px solid var(--cream)",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                  }}
                />
              )}
              {loading === "ACCEPT" ? "Accepting…" : "Accept"}
            </button>

            <button
              className="eoi-reject"
              onClick={() => handleAction("REJECT")}
              disabled={loading !== null}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 18px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "transparent",
                color: "rgba(26,54,43,0.6)",
                border: "1px solid rgba(26,54,43,0.22)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                letterSpacing: "0.02em",
              }}
            >
              {loading === "REJECT" && (
                <span
                  className="spin"
                  style={{
                    display: "inline-block",
                    width: "11px",
                    height: "11px",
                    border: "2px solid currentColor",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                  }}
                />
              )}
              {loading === "REJECT" ? "Rejecting…" : "Reject"}
            </button>
          </div>
        )}

        {/* ── Post-action banners ────────────────────────────────────── */}
        {currentStatus === "ACCEPTED" && !isPending && (
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "#065f46",
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              padding: "9px 12px",
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Accepted — conversation will be available shortly
          </div>
        )}

        {currentStatus === "REJECTED" && !isPending && (
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "rgba(26,54,43,0.45)",
              backgroundColor: "rgba(26,54,43,0.03)",
              border: "1px solid rgba(26,54,43,0.09)",
              padding: "9px 12px",
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            EOI declined
          </div>
        )}
      </article>
    </>
  )
}