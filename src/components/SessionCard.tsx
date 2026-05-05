"use client";

import { useState } from "react";
import {
  Video, FileText, MapPin,
  CheckCircle2, XCircle, Clock, RotateCcw,
  CalendarDays, Timer, DollarSign,
  type LucideIcon,
  Star,
} from "lucide-react";
import type { SessionStatus, SessionFormat } from "@/app/(protected)/dashboard/startup/mentors/types";
import { RatingModal } from "./RatingModal";

const FOREST = "#1A362B";
const BEIGE  = "#EFEBE3";
const CREAM  = "#F9F7F2";

type StatusConfig = {
  label: string;
  color: string;
  bg: string;
  icon: LucideIcon;
};

type FormatConfig = {
  label: string;
  icon: LucideIcon;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  REQUESTED:   { label: "Requested",   color: "#B45309", bg: "#FEF3C7", icon: Clock        },
  ACCEPTED:    { label: "Accepted",    color: "#065F46", bg: "#D1FAE5", icon: CheckCircle2 },
  DECLINED:    { label: "Declined",    color: "#991B1B", bg: "#FEE2E2", icon: XCircle      },
  RESCHEDULED: { label: "Rescheduled", color: "#1D4ED8", bg: "#DBEAFE", icon: RotateCcw   },
  COMPLETED:   { label: "Completed",   color: FOREST,   bg: BEIGE,     icon: CheckCircle2 },
  CANCELLED:   { label: "Cancelled",   color: "#6B7280", bg: "#F3F4F6", icon: XCircle      },
};

const FORMAT_CONFIG: Record<string, FormatConfig> = {
  VIDEO_CALL:   { label: "Video Call",   icon: Video    },
  ASYNC_REVIEW: { label: "Async Review", icon: FileText },
  IN_PERSON:    { label: "In Person",    icon: MapPin   },
};

export interface SessionCardSession {
  id: string;
  status: SessionStatus;
  format: SessionFormat;
  agendaNote: string | null;
  scheduledAt: string | null;
  durationMinutes: number;
  amountUsd: string;
  requestedAt: string;
  videoCallLink: string | null;
  startupName?: string | null;
  mentorUserId: string;   
  startupUserId?: string;
}

interface SessionCardProps {
  session: SessionCardSession;
  onStatusChange: (
    id: string,
    status: "ACCEPTED" | "DECLINED" | "COMPLETED",
    extra?: {
      scheduledAt?: string;
      videoCallLink?: string;
      sessionNotes?: string;
    }
  ) => Promise<void>;
}

export function SessionCard({ session, onStatusChange }: SessionCardProps) {
  const [loading, setLoading] = useState<"accept" | "decline" | "complete" | null>(null);
  const [ratingModal, setRatingModal] = useState(false); 
  const [alreadyRated, setAlreadyRated] = useState(false)

  const status     = STATUS_CONFIG[session.status];
  const format     = FORMAT_CONFIG[session.format];
  const StatusIcon = status.icon;
  const FormatIcon = format.icon;

  const topic       = session.agendaNote?.split("\n")[0] ?? "Session";
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
      const statusMap = {
        accept:   "ACCEPTED",
        decline:  "DECLINED",
        complete: "COMPLETED",
      } as const;
      await onStatusChange(session.id, statusMap[action]);
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
          <p className="text-xs font-medium mb-1" style={{ color: `${FOREST}55` }}>
            {session.startupName ?? "—"}
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

        <span
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2">
        <MetaChip icon={FormatIcon} label={format.label} />
        {scheduledDate
          ? <MetaChip icon={CalendarDays} label={`${scheduledDate} · ${scheduledTime}`} />
          : <MetaChip icon={CalendarDays} label={`Requested ${requestedDate}`} />
        }
        <MetaChip icon={Timer} label={`${session.durationMinutes} min`} />
        {parseFloat(session.amountUsd) > 0 && (
          <MetaChip icon={DollarSign} label={`$${session.amountUsd}`} />
        )}
      </div>

      {/* ✅ FIXED JOIN LINK */}
      {session.videoCallLink && session.status === "ACCEPTED" && (
        <a
          href={session.videoCallLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: `${FOREST}08`, color: FOREST }}
        >
          <Video className="w-3.5 h-3.5" />
          Join Meeting
        </a>
      )}
      {session.status === "COMPLETED" && !alreadyRated && session.startupUserId && (
        <div className="pt-1 border-t border-stone-100">
          <button
            onClick={() => setRatingModal(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <Star className="w-3.5 h-3.5" />
            Rate this startup
          </button>
        </div>
      )}

      {session.status === "COMPLETED" && alreadyRated && (
        <div className="pt-1 border-t border-stone-100">
          <span className="flex items-center gap-1.5 text-xs text-stone-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            You've rated this session
          </span>
        </div>
      )}

      <RatingModal
        open={ratingModal}
        onClose={() => setRatingModal(false)}
        sessionId={session.id}
        rateeId={session.startupUserId!}
        rateeName={session.startupName ?? "Startup"}
        rateeRole="startup"
        onRated={() => setAlreadyRated(true)}
      />
      {/* Actions */}
      {session.status === "REQUESTED" && (
        <div className="flex gap-2 pt-1 border-t" style={{ borderColor: `${FOREST}08` }}>
          <ActionBtn
            label="Accept"
            loading={loading === "accept"}
            variant="primary"
            onClick={() => handle("accept")}
          />
          <ActionBtn
            label="Decline"
            loading={loading === "decline"}
            variant="ghost"
            onClick={() => handle("decline")}
          />
        </div>
      )}

      {session.status === "ACCEPTED" && (
        <div className="flex gap-2 pt-1 border-t" style={{ borderColor: `${FOREST}08` }}>
          <ActionBtn
            label="Mark Complete"
            loading={loading === "complete"}
            variant="primary"
            onClick={() => handle("complete")}
          />
        </div>
      )}
    </div>
  );
}

function MetaChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
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

function ActionBtn({
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
      {loading ? "…" : label}
    </button>
  );
}