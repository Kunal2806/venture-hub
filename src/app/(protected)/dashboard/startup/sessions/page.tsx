"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight, Loader2, CalendarClock, RefreshCw,
  Video, FileText, MapPin, CheckCircle2, XCircle,
  Clock, RotateCcw, CalendarDays, Timer, DollarSign,
  type LucideIcon,
  Heart,
} from "lucide-react";
import type { MentorSessionItem, SessionStatus, SessionFormat } from "../mentors/types";


type StatusCfg = { label: string; colorClass: string; bgClass: string; icon: LucideIcon };
type FormatCfg = { label: string; icon: LucideIcon };

const STATUS_CFG: Record<string, StatusCfg> = {
  REQUESTED:   { label: "Requested",   colorClass: "text-amber-700",   bgClass: "bg-amber-50",   icon: Clock        },
  ACCEPTED:    { label: "Accepted",    colorClass: "text-emerald-800", bgClass: "bg-emerald-50", icon: CheckCircle2 },
  DECLINED:    { label: "Declined",    colorClass: "text-red-800",     bgClass: "bg-red-50",     icon: XCircle      },
  RESCHEDULED: { label: "Rescheduled", colorClass: "text-blue-800",    bgClass: "bg-blue-50",    icon: RotateCcw    },
  COMPLETED:   { label: "Completed",   colorClass: "text-green-900",   bgClass: "bg-green-50",   icon: CheckCircle2 },
  CANCELLED:   { label: "Cancelled",   colorClass: "text-stone-500",   bgClass: "bg-stone-100",  icon: XCircle      },
};

const FORMAT_CFG: Record<string, FormatCfg> = {
  VIDEO_CALL:   { label: "Video Call",   icon: Video    },
  ASYNC_REVIEW: { label: "Async Review", icon: FileText },
  IN_PERSON:    { label: "In Person",    icon: MapPin   },
};

const STATUS_TABS: { label: string; value: SessionStatus | "ALL" }[] = [
  { label: "All",         value: "ALL"         },
  { label: "Requested",   value: "REQUESTED"   },
  { label: "Accepted",    value: "ACCEPTED"    },
  { label: "Completed",   value: "COMPLETED"   },
  { label: "Declined",    value: "DECLINED"    },
  { label: "Cancelled",   value: "CANCELLED"   },
];

// ── Page ──────────────────────────────────────────────────────────────────

export default function StartupSessionsPage() {
  const [sessions, setSessions] = useState<MentorSessionItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<SessionStatus | "ALL">("ALL");

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/mentor-sessions");
      const json = await res.json();
      setSessions(json.data ?? []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  async function handleCancel(id: string) {
    const prev = sessions;
    setSessions(s => s.map(x => x.id === id ? { ...x, status: "CANCELLED" as SessionStatus } : x));
    try {
      const res = await fetch("/api/mentor-sessions", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, status: "CANCELLED" }),
      });
      if (!res.ok) setSessions(prev);
    } catch {
      setSessions(prev);
    }
  }

  const probonoOffers = sessions.filter(
    s => s.status === "REQUESTED" &&
        parseFloat(s.amountUsd ?? "0") === 0 &&
        s.agendaNote?.startsWith("Pro-bono Offer")
  );

  const regularSessions = sessions.filter(
    s => !probonoOffers.find(p => p.id === s.id)
  );

  const filtered = tab === "ALL"
    ? regularSessions
    : regularSessions.filter(s => s.status === tab);

  const countFor = (t: SessionStatus | "ALL") =>
    t === "ALL"
      ? regularSessions.length
      : regularSessions.filter(s => s.status === t).length;
  
    function handleAcceptProbono(id: string) {
      setSessions(s =>
        s.map(x => x.id === id ? { ...x, status: "ACCEPTED" as SessionStatus } : x)
      );
    }


  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <Link href="/dashboard/startup" className="text-stone-400 hover:text-stone-600 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
        <span className="font-medium text-stone-700">My Sessions</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-stone-800">My Sessions</h1>
          <p className="text-sm mt-1 text-stone-400">
            {loading ? "Loading…" : `${filtered.length} session${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={["h-3.5 w-3.5", loading ? "animate-spin" : ""].join(" ")} />
            Refresh
          </button>
          <Link
            href="/dashboard/startup/mentors"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#1A362B" }}
          >
            Find a Mentor
          </Link>
        </div>
      </div>

       {probonoOffers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-stone-700">
                Pro-bono Offers
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                {probonoOffers.length} new
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Mentors who want to help you for free — decline if not interested
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {probonoOffers.map(s => (
                <ProbonoOfferCard
                  key={s.id}
                  session={s}
                  onDecline={handleCancel}
                  onAccept={handleAcceptProbono}
                />
              ))}
            </div>
          </div>
        )}


      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-stone-100 overflow-x-auto">
        {STATUS_TABS.map(t => {
          const count    = countFor(t.value);
          const isActive = tab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={[
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                isActive ? "text-white" : "text-stone-400 hover:text-stone-600",
              ].join(" ")}
              style={isActive ? { backgroundColor: "#1A362B" } : {}}
            >
              {t.label}
              {count > 0 && (
                <span
                  className={[
                    "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                    isActive ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600",
                  ].join(" ")}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 animate-spin text-stone-400" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(s => (
            <StartupSessionCard
              key={s.id}
              session={s}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: SessionStatus | "ALL" }) {
  return (
    <div className="bg-white rounded-xl border border-stone-100 p-12 text-center">
      <CalendarClock className="w-10 h-10 mx-auto mb-4 text-stone-200" />
      <p className="text-sm font-medium text-stone-700">
        {tab === "ALL" ? "No sessions yet" : `No ${tab.toLowerCase()} sessions`}
      </p>
      <p className="text-xs mt-1 text-stone-400 mb-5">
        {tab === "ALL"
          ? "Request a session from the mentor marketplace"
          : "Sessions matching this filter will appear here"}
      </p>
      {tab === "ALL" && (
        <Link
          href="/dashboard/startup/mentors"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#1A362B" }}
        >
          Browse Mentors
        </Link>
      )}
    </div>
  );
}

// ── Session Card (startup POV) ────────────────────────────────────────────

function StartupSessionCard({
  session,
  onCancel,
}: {
  session: MentorSessionItem;
  onCancel: (id: string) => void;
}) {
  const [cancelling, setCancelling] = useState(false);

  const sc = STATUS_CFG[session.status];
  const fc = FORMAT_CFG[session.format];
  const StatusIcon = sc.icon;
  const FormatIcon = fc.icon;

  const topic       = session.agendaNote?.split("\n")[0] ?? "Session";
  const description = session.agendaNote?.split("\n\n")[1] ?? null;

  const scheduledLabel = session.scheduledAt
    ? new Date(session.scheduledAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const requestedLabel = new Date(session.requestedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
  });

  async function handleCancel() {
    setCancelling(true);
    try {
      await onCancel(session.id);
    } finally {
      setCancelling(false);
    }
  }

  // Mentor avatar initials
  const mentorInitials = session.mentorName
    .split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-stone-100 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">

      {/* Mentor info + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: "#1A362B" }}
          >
            {session.mentorAvatar
              ? <img src={session.mentorAvatar} alt={session.mentorName} className="w-full h-full rounded-lg object-cover" />
              : mentorInitials
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">{session.mentorName}</p>
            {session.mentorHeadline && (
              <p className="text-xs text-stone-400 truncate">{session.mentorHeadline}</p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span className={["shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", sc.bgClass, sc.colorClass].join(" ")}>
          <StatusIcon className="w-3 h-3" />
          {sc.label}
        </span>
      </div>

      {/* Topic */}
      <div>
        <p className="text-sm font-medium text-stone-800 leading-snug">{topic}</p>
        {description && (
          <p className="text-xs mt-1 text-stone-400 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2">
        <Chip icon={FormatIcon} label={fc.label} />
        <Chip
          icon={CalendarDays}
          label={scheduledLabel ? scheduledLabel : "Requested " + requestedLabel}
        />
        <Chip icon={Timer} label={session.durationMinutes + " min"} />
        {parseFloat(session.amountUsd) > 0
          ? <Chip icon={DollarSign} label={"$" + parseFloat(session.amountUsd).toFixed(2)} />
          : <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium">Free</span>
        }
      </div>

      {/* Join link — only when accepted */}
      {session.status === "ACCEPTED" && session.videoCallLink && (
       <a 
          href={session.videoCallLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 w-fit text-xs font-medium px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
        >
          <Video className="w-3.5 h-3.5" />
          Join Meeting
        </a>
      )}

      {/* Cancel — only REQUESTED sessions */}
      {session.status === "REQUESTED" && (
        <div className="pt-1 border-t border-stone-100">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-xs font-medium px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {cancelling ? "Cancelling…" : "Cancel Request"}
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-stone-50 text-stone-500">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function ProbonoOfferCard({
  session,
  onDecline,
  onAccept,
}: {
  session: MentorSessionItem;
  onDecline: (id: string) => void;
  onAccept: (id: string) => void;
}) {
  const [declining, setDeclining] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted,  setAccepted]  = useState(false);

  const mentorInitials = session.mentorName
    .split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const message = session.agendaNote?.split("\n\n")[1] ?? null;

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch("/api/mentor-sessions", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: session.id, status: "ACCEPTED" }),
      });
      if (res.ok) {
        setAccepted(true);
        onAccept(session.id);
      }
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      await onDecline(session.id);
    } finally {
      setDeclining(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-emerald-100 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: "#1A362B" }}
          >
            {session.mentorAvatar
              ? <img src={session.mentorAvatar} alt={session.mentorName} className="w-full h-full rounded-lg object-cover" />
              : mentorInitials
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">
              {session.mentorName}
            </p>
            {session.mentorHeadline && (
              <p className="text-xs text-stone-400 truncate">{session.mentorHeadline}</p>
            )}
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
          Free offer
        </span>
      </div>

      {/* Message from mentor */}
      {message && (
        <p className="text-xs text-stone-500 leading-relaxed bg-stone-50 px-3 py-2.5 rounded-lg italic">
          "{message}"
        </p>
      )}

      {/* Duration */}
      <div className="flex items-center gap-1.5 text-xs text-stone-400">
        <Timer className="w-3 h-3" />
        {session.durationMinutes} min · Free session
      </div>

      {/* Actions */}
      {accepted ? (
        <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <p className="text-xs text-emerald-700 font-medium">
            Accepted — visible in your sessions & mentor's dashboard
          </p>
        </div>
      ) : (
        <div className="flex gap-2 pt-1 border-t border-stone-100">
          <button
            onClick={handleAccept}
            disabled={accepting || declining}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-white transition-colors disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: "#1A362B" }}
          >
            {accepting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <CheckCircle2 className="w-3.5 h-3.5" />
            }
            {accepting ? "Accepting…" : "Accept"}
          </button>
          <button
            onClick={handleDecline}
            disabled={accepting || declining}
            className="text-xs font-medium px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {declining ? "…" : "Decline"}
          </button>
        </div>
      )}
    </div>
  );
}