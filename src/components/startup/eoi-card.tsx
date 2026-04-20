// app/dashboard/startup/eois/_components/eoi-card.tsx
"use client"

import { useState } from "react"

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
  investorName: string
  firmName: string | null
  designation: string | null
  investorType: string | null
  message: string | null
  proposedAmount: string | null
  status: EOIStatus
  dealStage: DealStage
  sentAt: Date
}

const STATUS_STYLES: Record<EOIStatus, string> = {
  PENDING:   "bg-amber-50 text-amber-800 border border-amber-200",
  ACCEPTED:  "bg-emerald-50 text-emerald-800 border border-emerald-200",
  REJECTED:  "bg-red-50 text-red-700 border border-red-200",
  WITHDRAWN: "bg-stone-100 text-stone-600 border border-stone-200",
}

const STATUS_LABELS: Record<EOIStatus, string> = {
  PENDING:   "Pending",
  ACCEPTED:  "Accepted",
  REJECTED:  "Rejected",
  WITHDRAWN: "Withdrawn",
}

function formatAmount(amount: string | null): string | null {
  if (!amount) return null
  const num = parseFloat(amount)
  if (isNaN(num)) return null
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`
  return `$${num.toFixed(0)}`
}

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

  const initials = investorName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <article className="bg-white border border-[rgba(26,54,43,0.1)] p-5 sm:p-6 transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        {/* Left — investor info */}
        <div className="flex items-start gap-4 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0 w-11 h-11 bg-[var(--forest)] text-[var(--cream)] flex items-center justify-center text-sm font-semibold select-none">
            {initials}
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--stone)] leading-snug truncate">
              {investorName}
            </h3>

            {(designation || firmName) && (
              <p className="text-sm text-[var(--moss)] mt-0.5 truncate">
                {[designation, firmName].filter(Boolean).join(" · ")}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium tracking-wide ${STATUS_STYLES[currentStatus]}`}>
                {STATUS_LABELS[currentStatus]}
              </span>

              {investorType && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-[var(--beige)] text-[var(--moss)] border border-[rgba(26,54,43,0.08)]">
                  {investorType.replace("_", " ")}
                </span>
              )}

              {formattedAmount && (
                <span className="text-xs text-[var(--moss)] font-medium">
                  {formattedAmount} proposed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right — date */}
        <p className="text-xs text-[var(--moss)] whitespace-nowrap mt-1 sm:mt-0 flex-shrink-0">
          {new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(new Date(sentAt))}
        </p>
      </div>

      {/* Message */}
      {message && (
        <p className="mt-4 text-sm text-[var(--stone)] leading-relaxed bg-[var(--cream)] border border-[rgba(26,54,43,0.06)] p-3">
          &ldquo;{message}&rdquo;
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions — only shown if PENDING */}
      {isPending && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => handleAction("ACCEPT")}
            disabled={loading !== null}
            className="
              flex items-center gap-2 px-4 py-2 text-sm font-medium
              bg-[var(--forest)] text-[var(--cream)]
              hover:opacity-90 active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {loading === "ACCEPT" && (
              <span className="w-3.5 h-3.5 border-2 border-[var(--cream)] border-t-transparent rounded-full animate-spin" />
            )}
            {loading === "ACCEPT" ? "Accepting…" : "Accept"}
          </button>

          <button
            onClick={() => handleAction("REJECT")}
            disabled={loading !== null}
            className="
              flex items-center gap-2 px-4 py-2 text-sm font-medium
              border border-[rgba(26,54,43,0.25)] text-[var(--stone)]
              hover:border-red-400 hover:text-red-700 hover:bg-red-50
              active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {loading === "REJECT" && (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {loading === "REJECT" ? "Rejecting…" : "Reject"}
          </button>
        </div>
      )}

      {/* Post-action state */}
      {currentStatus === "ACCEPTED" && !isPending && (
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Accepted — conversation will be available shortly
        </div>
      )}

      {currentStatus === "REJECTED" && !isPending && (
        <div className="mt-4 flex items-center gap-2 text-sm text-stone-500 bg-stone-50 border border-stone-100 px-3 py-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          EOI rejected
        </div>
      )}
    </article>
  )
}