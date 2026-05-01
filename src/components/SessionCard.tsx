"use client";

import { useState } from "react";
import {
  Video, FileText, MapPin,
  CheckCircle2, XCircle, Clock, AlertCircle,
  CalendarDays, Timer, DollarSign, RotateCcw,
} from "lucide-react";
import type { SessionStatus, SessionFormat } from "@/app/(protected)/dashboard/startup/mentors/types";

const FOREST = "#1A362B";
const BEIGE = "#EFEBE3";
const CREAM = "#F9F7F2";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  REQUESTED:   { label: "Requested",   color: "#B45309", bg: "#FEF3C7", icon: Clock },
  ACCEPTED:    { label: "Accepted",    color: "#065F46", bg: "#D1FAE5", icon: CheckCircle2 },
  DECLINED:    { label: "Declined",    color: "#991B1B", bg: "#FEE2E2", icon: XCircle },
  RESCHEDULED: { label: "Rescheduled", color: "#1D4ED8", bg: "#DBEAFE", icon: RotateCcw },
  COMPLETED:   { label: "Completed",   color: FOREST,   bg: BEIGE,     icon: CheckCircle2 },
  CANCELLED:   { label: "Cancelled",   color: "#6B7280", bg: "#F3F4F6", icon: XCircle },
};

const FORMAT_CONFIG: Record<SessionFormat, { label: string; icon: React.ElementType }> = {
  VIDEO_CALL:   { label: "Video Call",    icon: Video },
  ASYNC_REVIEW: { label: "Async Review",  icon: FileText },
  IN_PERSON:    { label: "In Person",     icon: MapPin },
};

interface SessionCardProps {
  session: {
    id: string;
    status: SessionStatus;
    format: SessionFormat;
    agendaNote: string | null;
    scheduledAt: string | null;
    durationMinutes: number;
    amountUsd: string;
    requestedAt: string;
    videoCallLink: string | null;
    startupName?: string;
  };
  onAccept?: (id: string) => Promise<void>;
  onDecline?: (id: string) => Promise<void>;
  onComplete?: (id: string) => Promise<void>;
  onReschedule?: (id: string) => void;
}

export function SessionCard({
  session,
  onAccept,
  onDecline,
  onComplete,
  onReschedule,
}: SessionCardProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const status = STATUS_CONFIG[session.status];
  const format = FORMAT_CONFIG[session.format];
  const StatusIcon = status.icon;
  const FormatIcon = format.icon;

  const topic = session.agendaNote?.split("\n")[0] ?? "Session";
  const description = session.agendaNote?.split("\n\n")[1] ?? null;

  const scheduledDate = session.scheduledAt
    ? new Date(session.scheduledAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;
  const scheduledTime = session.scheduledAt
    ? new Date(session.scheduledAt).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const requestedDate = new Date(session.requestedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
  });

  async function handle(action: "accept" | "decline" | "complete") {
    setLoading(action);
    try {
      if (action === "accept") await onAccept?.(session.id);
      if (action === "decline") await onDecline?.(session.id);
      if (action === "complete") await onComplete?.(session.id);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      className="bg-white rounded-xl border p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow"
      style={{ borderColor: `${FOREST}12` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Startup name */}
          <p className="text-xs font-medium mb-1" style={{ color: `${FOREST}55` }}>
            {session.startupName ?? "Startup"}
          </p>
          <h3
            className="font-serif text-base font-semibold leading-snug line-clamp-2"
            style={{ color: FOREST }}
          >
            {topic}
          </h3>
          {description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: `${FOREST}60` }}>
              {description}
            </p>
          )}
        </div>

        {/* Status badge */}
        <span
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3">
        <MetaChip icon={FormatIcon} label={format.label} />

        {scheduledDate ? (
          <MetaChip icon={CalendarDays} label={`${scheduledDate} · ${scheduledTime}`} />
        ) : (
          <MetaChip icon={CalendarDays} label={`Requested ${requestedDate}`} />
        )}

        <MetaChip icon={Timer} label={`${session.durationMinutes} min`} />

        {parseFloat(session.amountUsd) > 0 && (
          <MetaChip icon={DollarSign} label={`$${session.amountUsd}`} />
        )}
      </div>

      {/* Video link */}
      {session.videoCallLink && session.status === "ACCEPTED" && (
        <a
          href={session.videoCallLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: `${FOREST}08`, color: FOREST }}
        >
          <Video className="w-3.5 h-3.5" />
          Join Meeting
        </a>
      )}

      {/* Actions */}
      {session.status === "REQUESTED" && (
        <div className="flex gap-2 pt-1 border-t" style={{ borderColor: `${FOREST}08` }}>
          <ActionButton
            label="Accept"
            loading={loading === "accept"}
            variant="primary"
            onClick={() => handle("accept")}
          />
          <ActionButton
            label="Decline"
            loading={loading === "decline"}
            variant="ghost"
            onClick={() => handle("decline")}
          />
          <ActionButton
            label="Reschedule"
            loading={false}
            variant="ghost"
            onClick={() => onReschedule?.(session.id)}
          />
        </div>
      )}

      {session.status === "ACCEPTED" && (
        <div className="flex gap-2 pt-1 border-t" style={{ borderColor: `${FOREST}08` }}>
          <ActionButton
            label="Mark Complete"
            loading={loading === "complete"}
            variant="primary"
            onClick={() => handle("complete")}
          />
          <ActionButton
            label="Reschedule"
            loading={false}
            variant="ghost"
            onClick={() => onReschedule?.(session.id)}
          />
        </div>
      )}
    </div>
  );
}

// ── Helper sub-components ──────────────────────────────────────────────────

function MetaChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
      style={{ backgroundColor: CREAM, color: `${FOREST}80` }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function ActionButton({
  label,
  loading,
  variant,
  onClick,
}: {
  label: string;
  loading: boolean;
  variant: "primary" | "ghost";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex-1 text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50"
      style={
        variant === "primary"
          ? { backgroundColor: FOREST, color: "white" }
          : { backgroundColor: `${FOREST}08`, color: FOREST }
      }
    >
      {loading ? "..." : label}
    </button>
  );
}