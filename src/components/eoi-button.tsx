// components/eoi-button.tsx
"use client"

import { useTransition, useState } from "react"

interface EOIButtonProps {
  startupId: string
  alreadySent?: boolean
}

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "You must be logged in as an investor.",
  NO_PROFILE:   "Complete your investor profile before expressing interest.",
  DUPLICATE:    "You've already expressed interest in this startup.",
  NOT_FOUND:    "This startup is no longer available.",
  UNKNOWN:      "Something went wrong. Please try again.",
}

export default function EOIButton({ startupId, alreadySent = false }: EOIButtonProps) {
  const [pending, startTransition] = useTransition()
  const [sent, setSent]   = useState(alreadySent)
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const res = await fetch("/api/eoi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId }),
      })

      if (res.ok) {
        setSent(true)
        return
      }

      const data = await res.json().catch(() => ({}))
      const code: string = data.error ?? "UNKNOWN"

      if (code === "DUPLICATE") {
        setSent(true)
      } else {
        setError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN)
      }
    })
  }

  if (sent) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div
          style={{ fontSize: "12px", padding: "7px 14px", backgroundColor: "rgba(26,54,43,0.06)", color: "var(--forest)", fontWeight: 500, border: "1px solid rgba(26,54,43,0.15)", cursor: "default", userSelect: "none" as const }}
        >
          Interest Sent ✓
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        style={{ fontSize: "12px", padding: "7px 14px", backgroundColor: "var(--forest)", color: "var(--cream)", border: "none", fontWeight: 600, cursor: pending ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: "0.02em", opacity: pending ? 0.6 : 1, transition: "opacity 0.2s ease" }}
      >
        {pending ? "Sending…" : "Express Interest"}
      </button>
      {error && <p style={{ fontSize: "11px", color: "#dc2626", maxWidth: "160px", textAlign: "right" }}>{error}</p>}
    </div>
  )
}